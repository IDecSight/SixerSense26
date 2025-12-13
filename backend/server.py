from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Request, Header
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
from jose import JWTError, jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage
import asyncio
from collections import defaultdict
from affiliate_products import get_random_product
from default_tasks import get_default_tasks_for_category, DEFAULT_TASKS_BY_CATEGORY

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Auth configuration
SECRET_KEY = os.environ.get('SECRET_KEY')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get('ACCESS_TOKEN_EXPIRE_MINUTES', 10080))

# Create the main app without a prefix
app = FastAPI(title="Sixer Sense API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class UserProfile(BaseModel):
    primary_goal: str = "Balance"  # Career growth, Health, Wealth, Balance
    profession: Optional[str] = None
    life_stage: str = "Working Professional"  # Student, Working Professional, Entrepreneur
    daily_availability: str = "Medium"  # Low, Medium, High
    preferred_focus_areas: List[str] = ["Career", "Health"]  # 2-3 from six categories

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    is_premium: bool = False
    wallet_balance: float = 0.0
    profile: Optional[UserProfile] = None
    win_streak: int = 0
    next_target: int = 60
    total_bonus_runs: int = 0
    created_at: datetime

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime

class Match(BaseModel):
    match_id: str
    user_id: str
    date: str
    format: str  # T20, ODI, Test
    target_score: int
    total_runs: int = 0
    total_wickets: int = 0
    completed_tasks: int = 0
    overs: float = 0.0
    bonus_runs: int = 0
    status: str = "in_progress"  # in_progress, won, lost
    created_at: datetime

class Task(BaseModel):
    task_id: str
    user_id: str
    match_id: str
    title: str
    category: str
    run_value: int
    estimated_minutes: Optional[int] = None
    status: str = "pending"  # pending, in_progress, completed, dismissed
    completed_at: Optional[datetime] = None
    created_at: datetime

class Transaction(BaseModel):
    transaction_id: str
    user_id: str
    amount: float
    currency: str
    type: str  # deposit, conversion, run_purchase
    status: str  # pending, completed, failed
    runs_converted: Optional[int] = None
    payment_id: Optional[str] = None
    created_at: datetime

# ==================== REQUEST MODELS ====================

class AuthSessionRequest(BaseModel):
    session_id: str

class TaskCreateRequest(BaseModel):
    title: str
    category: str
    run_value: int
    estimated_minutes: Optional[int] = None

class TaskUpdateRequest(BaseModel):
    status: str

class AIRecommendRequest(BaseModel):
    match_id: str
    time_available: Optional[int] = 30

class ProfileUpdateRequest(BaseModel):
    primary_goal: str
    profession: Optional[str] = None
    life_stage: str
    daily_availability: str
    preferred_focus_areas: List[str]

class BuyRunsRequest(BaseModel):
    amount: float

class UpdateFormatRequest(BaseModel):
    match_id: str
    format: str

# ==================== AUTH HELPER ====================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        if authorization.startswith('Bearer '):
            token = authorization.split(' ')[1]
        else:
            token = authorization
            
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== HELPER FUNCTIONS ====================

async def calculate_category_balance(user_id: str, days: int = 7) -> Dict[str, Dict]:
    """Calculate task completion balance across categories for recent days"""
    categories = ["Health", "Career", "Finance", "Relationships", "Spiritual/Mindset", "Travel/Leisure"]
    
    # Get date range
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)
    start_date_str = start_date.strftime("%Y-%m-%d")
    
    # Get all tasks from recent days
    matches = await db.matches.find(
        {"user_id": user_id, "date": {"$gte": start_date_str}}
    ).to_list(None)
    
    match_ids = [m["match_id"] for m in matches]
    
    if not match_ids:
        # Return balanced zero state
        return {cat: {"count": 0, "runs": 0, "minutes": 0} for cat in categories}
    
    tasks = await db.tasks.find(
        {"match_id": {"$in": match_ids}, "status": "completed"},
        {"_id": 0}
    ).to_list(None)
    
    # Calculate stats per category
    balance = {cat: {"count": 0, "runs": 0, "minutes": 0} for cat in categories}
    
    for task in tasks:
        cat = task.get("category")
        if cat in balance:
            balance[cat]["count"] += 1
            balance[cat]["runs"] += task.get("run_value", 0)
            balance[cat]["minutes"] += task.get("estimated_minutes", 0)
    
    return balance

async def get_least_focused_categories(balance: Dict[str, Dict], limit: int = 3) -> List[str]:
    """Get categories with least attention"""
    # Sort by count (primary) and runs (secondary)
    sorted_cats = sorted(balance.items(), key=lambda x: (x[1]["count"], x[1]["runs"]))
    return [cat for cat, _ in sorted_cats[:limit]]

async def get_recent_recommendation_categories(user_id: str, limit: int = 3) -> List[str]:
    """Get last N recommendation categories to avoid repetition"""
    # This would track AI recommendations in a separate collection
    # For now, use recent completed tasks as proxy
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    match = await db.matches.find_one({"user_id": user_id, "date": today})
    
    if not match:
        return []
    
    tasks = await db.tasks.find(
        {"match_id": match["match_id"], "status": "completed"},
        {"_id": 0}
    ).sort("completed_at", -1).limit(limit).to_list(limit)
    
    return [task["category"] for task in tasks]

async def generate_default_tasks(user_id: str, profile: UserProfile) -> List[Dict]:
    """Generate balanced default tasks based on user profile"""
    default_tasks = []
    
    # Base task templates by category
    task_templates = {
        "Health": [
            {"title": "Morning exercise routine (15 mins)", "run_value": 4, "minutes": 15},
            {"title": "Drink 8 glasses of water today", "run_value": 1, "minutes": 5},
            {"title": "Take a mindful walk", "run_value": 1, "minutes": 10}
        ],
        "Career": [
            {"title": "Complete priority work task", "run_value": 6, "minutes": 60},
            {"title": "Learn something new (skill/course)", "run_value": 4, "minutes": 30},
            {"title": "Review daily goals and plan tomorrow", "run_value": 1, "minutes": 10}
        ],
        "Finance": [
            {"title": "Review budget and expenses", "run_value": 4, "minutes": 20},
            {"title": "Track today's spending", "run_value": 1, "minutes": 5},
            {"title": "Research investment opportunity", "run_value": 4, "minutes": 30}
        ],
        "Relationships": [
            {"title": "Call or message a loved one", "run_value": 1, "minutes": 15},
            {"title": "Plan quality time with family/friends", "run_value": 4, "minutes": 20},
            {"title": "Send appreciation message to someone", "run_value": 1, "minutes": 5}
        ],
        "Spiritual/Mindset": [
            {"title": "10-minute meditation or reflection", "run_value": 4, "minutes": 10},
            {"title": "Write gratitude journal (3 things)", "run_value": 1, "minutes": 5},
            {"title": "Practice deep breathing exercises", "run_value": 1, "minutes": 5}
        ],
        "Travel/Leisure": [
            {"title": "Enjoy a hobby for 20 mins", "run_value": 4, "minutes": 20},
            {"title": "Watch/read something entertaining", "run_value": 1, "minutes": 30},
            {"title": "Plan weekend leisure activity", "run_value": 1, "minutes": 10}
        ]
    }
    
    # Weight distribution based on profile
    weights = {cat: 1 for cat in task_templates.keys()}
    
    # Increase weight for preferred focus areas
    for area in profile.preferred_focus_areas:
        if area in weights:
            weights[area] = 2
    
    # Adjust based on primary goal
    if profile.primary_goal == "Career growth":
        weights["Career"] = 3
        weights["Finance"] = 2
    elif profile.primary_goal == "Health":
        weights["Health"] = 3
        weights["Spiritual/Mindset"] = 2
    elif profile.primary_goal == "Wealth":
        weights["Finance"] = 3
        weights["Career"] = 2
    
    # Adjust based on daily availability
    if profile.daily_availability == "Low":
        # Pick 1 task per category, prefer low-effort
        for cat, templates in task_templates.items():
            selected = min(templates, key=lambda x: x["minutes"])
            if weights[cat] >= 2:  # Only add if weighted
                default_tasks.append({**selected, "category": cat})
    elif profile.daily_availability == "High":
        # Pick 2 tasks per category
        for cat, templates in task_templates.items():
            count = min(2, weights[cat])
            for i in range(count):
                if i < len(templates):
                    default_tasks.append({**templates[i], "category": cat})
    else:  # Medium
        # Pick 1 task per category, balanced
        for cat, templates in task_templates.items():
            if weights[cat] >= 1 and templates:
                default_tasks.append({**templates[0], "category": cat})
    
    return default_tasks

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/session")
async def process_auth_session(request: AuthSessionRequest):
    """Process Emergent Auth session_id and create user"""
    import aiohttp
    
    try:
        # Call Emergent Auth API to get session data
        async with aiohttp.ClientSession() as session:
            headers = {"X-Session-ID": request.session_id}
            async with session.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers=headers
            ) as response:
                if response.status != 200:
                    raise HTTPException(status_code=400, detail="Invalid session")
                
                session_data = await response.json()
        
        # Extract user data
        email = session_data.get("email")
        name = session_data.get("name")
        picture = session_data.get("picture")
        emergent_session_token = session_data.get("session_token")
        
        # Check if user exists
        user_doc = await db.users.find_one({"email": email}, {"_id": 0})
        
        if not user_doc:
            # Create new user with default profile
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            default_profile = {
                "primary_goal": "Balance",
                "profession": None,
                "life_stage": "Working Professional",
                "daily_availability": "Medium",
                "preferred_focus_areas": ["Career", "Health"]
            }
            user_doc = {
                "user_id": user_id,
                "email": email,
                "name": name,
                "picture": picture,
                "is_premium": False,
                "wallet_balance": 0.0,
                "profile": default_profile,
                "win_streak": 0,
                "next_target": 60,
                "total_bonus_runs": 0,
                "created_at": datetime.now(timezone.utc)
            }
            await db.users.insert_one(user_doc)
            user_doc.pop("_id", None)
        else:
            user_id = user_doc["user_id"]
            # Ensure profile exists for existing users
            if "profile" not in user_doc or not user_doc["profile"]:
                default_profile = {
                    "primary_goal": "Balance",
                    "profession": None,
                    "life_stage": "Working Professional",
                    "daily_availability": "Medium",
                    "preferred_focus_areas": ["Career", "Health"]
                }
                await db.users.update_one(
                    {"user_id": user_id},
                    {"$set": {"profile": default_profile}}
                )
                user_doc["profile"] = default_profile
            
            # Ensure new fields exist
            if "win_streak" not in user_doc:
                await db.users.update_one(
                    {"user_id": user_id},
                    {"$set": {
                        "win_streak": 0,
                        "next_target": 60,
                        "total_bonus_runs": 0
                    }}
                )
                user_doc["win_streak"] = 0
                user_doc["next_target"] = 60
                user_doc["total_bonus_runs"] = 0
        
        # Create user session
        session_token = emergent_session_token
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        await db.user_sessions.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "session_token": session_token,
                    "expires_at": expires_at,
                    "created_at": datetime.now(timezone.utc)
                }
            },
            upsert=True
        )
        
        # Create today's match if doesn't exist
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        existing_match = await db.matches.find_one({"user_id": user_id, "date": today}, {"_id": 0})
        
        if not existing_match:
            # Get user's next target
            user_data = await db.users.find_one({"user_id": user_id})
            target_score = user_data.get("next_target", 60)
            
            match_id = f"match_{uuid.uuid4().hex[:12]}"
            match_doc = {
                "match_id": match_id,
                "user_id": user_id,
                "date": today,
                "format": "T20",
                "target_score": target_score,
                "total_runs": 0,
                "total_wickets": 0,
                "completed_tasks": 0,
                "overs": 0.0,
                "bonus_runs": 0,
                "status": "in_progress",
                "created_at": datetime.now(timezone.utc)
            }
            await db.matches.insert_one(match_doc)
            
            # Generate default tasks based on profile
            profile_data = UserProfile(**user_doc.get("profile", {}))
            default_tasks = await generate_default_tasks(user_id, profile_data)
            
            # Insert default tasks
            for task_template in default_tasks:
                task_id = f"task_{uuid.uuid4().hex[:12]}"
                task_doc = {
                    "task_id": task_id,
                    "user_id": user_id,
                    "match_id": match_id,
                    "title": task_template["title"],
                    "category": task_template["category"],
                    "run_value": task_template["run_value"],
                    "estimated_minutes": task_template["minutes"],
                    "status": "pending",
                    "completed_at": None,
                    "created_at": datetime.now(timezone.utc)
                }
                await db.tasks.insert_one(task_doc)
        
        # Create JWT token
        access_token = create_access_token({"sub": user_id})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_doc
        }
        
    except Exception as e:
        logging.error(f"Auth error: {str(e)}")
        raise HTTPException(status_code=500, detail="Authentication failed")

@api_router.get("/auth/me")
async def get_current_user_info(current_user: str = Depends(get_current_user)):
    """Get current user information"""
    user_doc = await db.users.find_one({"user_id": current_user}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    return user_doc

@api_router.post("/auth/logout")
async def logout(current_user: str = Depends(get_current_user)):
    """Logout user"""
    await db.user_sessions.delete_one({"user_id": current_user})
    return {"message": "Logged out successfully"}

# ==================== PROFILE ROUTES ====================

@api_router.patch("/profile")
async def update_profile(profile_data: ProfileUpdateRequest, current_user: str = Depends(get_current_user)):
    """Update user profile"""
    profile_dict = profile_data.model_dump()
    
    await db.users.update_one(
        {"user_id": current_user},
        {"$set": {"profile": profile_dict}}
    )
    
    return {"message": "Profile updated successfully", "profile": profile_dict}

@api_router.get("/profile")
async def get_profile(current_user: str = Depends(get_current_user)):
    """Get user profile"""
    user_doc = await db.users.find_one({"user_id": current_user}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    return user_doc.get("profile", {})

# ==================== MATCH ROUTES ====================

@api_router.get("/matches/today")
async def get_today_match(current_user: str = Depends(get_current_user)):
    """Get today's match - returns null if no match exists for today"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    match_doc = await db.matches.find_one(
        {"user_id": current_user, "date": today},
        {"_id": 0}
    )
    
    if not match_doc:
        # Return null to indicate no match exists - user needs to select format
        return None
    
    # Get tasks for this match
    tasks = await db.tasks.find(
        {"match_id": match_doc["match_id"]},
        {"_id": 0}
    ).sort("created_at", 1).to_list(None)
    
    match_doc["tasks"] = tasks
    return match_doc

@api_router.post("/matches/start")
async def start_today_match(
    request: Request,
    current_user: str = Depends(get_current_user)
):
    """Start today's match with selected format"""
    body = await request.json()
    match_format = body.get("format", "T20")
    
    # Validate format
    if match_format not in ["T20", "ODI", "Test"]:
        raise HTTPException(status_code=400, detail="Invalid match format")
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Check if match already exists
    existing_match = await db.matches.find_one(
        {"user_id": current_user, "date": today}
    )
    if existing_match:
        raise HTTPException(status_code=400, detail="Match already exists for today")
    
    # Get user's next target
    user_data = await db.users.find_one({"user_id": current_user})
    base_target = user_data.get("next_target", 60) if user_data else 60
    
    # Set target based on format
    format_targets = {
        "T20": base_target,
        "ODI": base_target * 2.5,
        "Test": base_target * 1.67
    }
    target_score = int(format_targets.get(match_format, base_target))
    
    # Create today's match
    match_id = f"match_{uuid.uuid4().hex[:12]}"
    match_doc = {
        "match_id": match_id,
        "user_id": current_user,
        "date": today,
        "format": match_format,
        "target_score": target_score,
        "total_runs": 0,
        "total_wickets": 0,
        "completed_tasks": 0,
        "overs": 0.0,
        "bonus_runs": 0,
        "status": "in_progress",
        "created_at": datetime.now(timezone.utc)
    }
    await db.matches.insert_one(match_doc)
    match_doc.pop("_id", None)
    
    # Generate default tasks based on profile
    user_doc = await db.users.find_one({"user_id": current_user}, {"_id": 0})
    if user_doc and "profile" in user_doc:
        profile_data = UserProfile(**user_doc["profile"])
        default_tasks = await generate_default_tasks(current_user, profile_data)
        
        # Insert default tasks
        for task_template in default_tasks:
            task_id = f"task_{uuid.uuid4().hex[:12]}"
            task_doc = {
                "task_id": task_id,
                "user_id": current_user,
                "match_id": match_id,
                "title": task_template["title"],
                "category": task_template["category"],
                "run_value": task_template["run_value"],
                "estimated_minutes": task_template["minutes"],
                "status": "pending",
                "completed_at": None,
                "created_at": datetime.now(timezone.utc)
            }
            await db.tasks.insert_one(task_doc)
    
    # Get tasks for this match
    tasks = await db.tasks.find(
        {"match_id": match_doc["match_id"]},
        {"_id": 0}
    ).sort("created_at", 1).to_list(None)
    
    match_doc["tasks"] = tasks
    return match_doc

@api_router.get("/matches/history")
async def get_match_history(current_user: str = Depends(get_current_user), limit: int = 14):
    """Get match history"""
    matches = await db.matches.find(
        {"user_id": current_user},
        {"_id": 0}
    ).sort("date", -1).limit(limit).to_list(limit)
    
    return matches

@api_router.post("/matches/update-format")
async def update_match_format(req: UpdateFormatRequest, current_user: str = Depends(get_current_user)):
    """Update match format"""
    # Update target based on format
    target_map = {"T20": 60, "ODI": 150, "Test": 100}
    target = target_map.get(req.format, 60)
    
    await db.matches.update_one(
        {"match_id": req.match_id, "user_id": current_user},
        {"$set": {"format": req.format, "target_score": target}}
    )
    
    return {"message": "Format updated successfully", "format": req.format, "target_score": target}

# ==================== TASK ROUTES ====================

@api_router.post("/tasks")
async def create_task(task: TaskCreateRequest, current_user: str = Depends(get_current_user)):
    """Create a new task"""
    # Get today's match
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    match_doc = await db.matches.find_one({"user_id": current_user, "date": today})
    
    if not match_doc:
        raise HTTPException(status_code=404, detail="No active match found")
    
    task_id = f"task_{uuid.uuid4().hex[:12]}"
    task_doc = {
        "task_id": task_id,
        "user_id": current_user,
        "match_id": match_doc["match_id"],
        "title": task.title,
        "category": task.category,
        "run_value": task.run_value,
        "estimated_minutes": task.estimated_minutes,
        "status": "pending",
        "completed_at": None,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.tasks.insert_one(task_doc)
    task_doc.pop("_id", None)
    
    return task_doc

@api_router.patch("/tasks/{task_id}/complete")
async def complete_task(task_id: str, current_user: str = Depends(get_current_user)):
    """Mark task as completed and update match score"""
    task_doc = await db.tasks.find_one({"task_id": task_id, "user_id": current_user})
    
    if not task_doc:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task_doc["status"] == "completed":
        return {"message": "Task already completed"}
    
    # Update task
    await db.tasks.update_one(
        {"task_id": task_id},
        {
            "$set": {
                "status": "completed",
                "completed_at": datetime.now(timezone.utc)
            }
        }
    )
    
    # Update match
    match_doc = await db.matches.find_one({"match_id": task_doc["match_id"]})
    
    new_runs = match_doc["total_runs"] + task_doc["run_value"]
    new_completed = match_doc["completed_tasks"] + 1
    new_overs = new_completed / 6
    
    # Check if match is won
    status = match_doc["status"]
    bonus_runs = 0
    
    if new_runs >= match_doc["target_score"] and match_doc["total_wickets"] < 10:
        status = "won"
        
        # Calculate bonus runs (5 runs per wicket remaining)
        wickets_remaining = 10 - match_doc["total_wickets"]
        bonus_runs = wickets_remaining * 5
        new_runs += bonus_runs
        
        # Get user data
        user_doc = await db.users.find_one({"user_id": current_user})
        win_streak = user_doc.get("win_streak", 0) + 1
        
        # Increase difficulty for next match
        next_target = match_doc["target_score"] + (10 * win_streak)
        
        # Update user
        await db.users.update_one(
            {"user_id": current_user},
            {
                "$set": {
                    "win_streak": win_streak,
                    "next_target": next_target
                },
                "$inc": {"total_bonus_runs": bonus_runs}
            }
        )
    
    await db.matches.update_one(
        {"match_id": task_doc["match_id"]},
        {
            "$set": {
                "total_runs": new_runs,
                "completed_tasks": new_completed,
                "overs": new_overs,
                "bonus_runs": bonus_runs,
                "status": status
            }
        }
    )
    
    return {
        "message": "Task completed",
        "runs_earned": task_doc["run_value"],
        "bonus_runs": bonus_runs,
        "total_runs": new_runs,
        "status": status
    }

@api_router.patch("/tasks/{task_id}/distraction")
async def mark_distraction(task_id: str, current_user: str = Depends(get_current_user)):
    """Mark task as distraction and lose a wicket"""
    task_doc = await db.tasks.find_one({"task_id": task_id, "user_id": current_user})
    
    if not task_doc:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update task
    await db.tasks.update_one(
        {"task_id": task_id},
        {"$set": {"status": "dismissed"}}
    )
    
    # Update match - lose wicket
    match_doc = await db.matches.find_one({"match_id": task_doc["match_id"]})
    
    new_wickets = match_doc["total_wickets"] + 1
    status = match_doc["status"]
    
    # Check if match is lost
    if new_wickets >= 10:
        status = "lost"
        
        # Reset win streak on loss
        await db.users.update_one(
            {"user_id": current_user},
            {"$set": {"win_streak": 0, "next_target": 60}}
        )
    
    await db.matches.update_one(
        {"match_id": task_doc["match_id"]},
        {
            "$set": {
                "total_wickets": new_wickets,
                "status": status
            }
        }
    )
    
    return {
        "message": "Wicket lost",
        "total_wickets": new_wickets,
        "status": status
    }

# ==================== AI ROUTES ====================

@api_router.post("/ai/recommend")
async def get_ai_recommendation(req: AIRecommendRequest, current_user: str = Depends(get_current_user)):
    """Get AI task recommendation with life balance logic"""
    try:
        # Get user profile
        user_doc = await db.users.find_one({"user_id": current_user}, {"_id": 0})
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
        
        profile = UserProfile(**user_doc.get("profile", {}))
        
        # Get match details
        match_doc = await db.matches.find_one({"match_id": req.match_id})
        if not match_doc:
            raise HTTPException(status_code=404, detail="Match not found")
        
        # Calculate available hours in the day
        current_hour = datetime.now(timezone.utc).hour
        hours_remaining = 24 - current_hour  # Hours left until midnight
        
        # Get total time spent on tasks today
        tasks_today = await db.tasks.find({"match_id": req.match_id}).to_list(1000)
        total_minutes_spent = sum(task.get("estimated_minutes", 0) for task in tasks_today)
        available_minutes = (hours_remaining * 60) - total_minutes_spent
        
        # Determine recommended time bracket
        if available_minutes < 60:
            time_bracket = "short"  # Quick 5-15 min tasks
            suggested_run_value = 1
        elif available_minutes < 180:
            time_bracket = "medium"  # 20-30 min tasks
            suggested_run_value = 4
        else:
            time_bracket = "long"  # 30+ min tasks
            suggested_run_value = 6
        
        # Calculate category balance (last 7 days)
        balance = await calculate_category_balance(current_user, days=7)
        
        # Get underrepresented categories
        least_focused = await get_least_focused_categories(balance, limit=3)
        
        # Get recent recommendation categories to avoid repetition
        recent_cats = await get_recent_recommendation_categories(current_user, limit=3)
        
        # Filter out recently used categories if possible
        available_cats = [cat for cat in least_focused if cat not in recent_cats]
        if not available_cats:
            available_cats = least_focused  # Use least focused even if recent
        
        # Format balance info for AI
        balance_summary = "\n".join([
            f"- {cat}: {stats['count']} tasks, {stats['runs']} runs, {stats['minutes']} minutes"
            for cat, stats in balance.items()
        ])
        
        # Create AI prompt with balance logic
        system_message = f"""You are a productivity coach and cricket strategist for Sixer Sense app.
The user's day is a cricket match. Each task = one ball. Runs scored = productivity.

🎯 USER PROFILE:
- Primary Goal: {profile.primary_goal}
- Life Stage: {profile.life_stage}
- Daily Availability: {profile.daily_availability}
- Preferred Focus: {', '.join(profile.preferred_focus_areas)}

📊 CURRENT MATCH STATUS:
- Format: {match_doc['format']}
- Target: {match_doc['target_score']} runs
- Current Runs: {match_doc['total_runs']}
- Wickets Lost: {match_doc['total_wickets']}/10
- Overs: {match_doc['overs']:.1f}

⏰ TIME AVAILABILITY:
- Current Hour: {current_hour}:00
- Hours Remaining Today: {hours_remaining} hours
- Minutes Already Spent: {total_minutes_spent} minutes
- Available Minutes: {available_minutes} minutes
- Recommended Time Bracket: {time_bracket} (prefer {suggested_run_value}-run tasks)

⚖️ LIFE BALANCE ANALYSIS (Last 7 Days):
{balance_summary}

🎯 PRIORITY CATEGORIES (Need More Attention):
{', '.join(available_cats)}

🚫 AVOID CATEGORIES (Recently Recommended):
{', '.join(recent_cats) if recent_cats else 'None'}

📋 RECOMMENDATION RULES:
1. MUST prioritize underrepresented categories: {', '.join(available_cats)}
2. AVOID recommending same category more than twice consecutively
3. Consider user's primary goal and preferred focus areas
4. Match task complexity to available time: {available_minutes} minutes remaining today
5. Prefer {suggested_run_value}-run tasks given current time availability
6. Provide clear reasoning for category selection based on balance analysis

Six Categories Available:
- Health (exercise, nutrition)
- Career (work, learning)
- Finance (budget, investments)
- Relationships (family, friends)
- Spiritual/Mindset (meditation, reflection)
- Travel/Leisure (hobbies, fun)

Return ONLY a JSON object:
{{
  "task": "Specific task title",
  "category": "Must be from priority categories if possible",
  "run_value": 1/4/6,
  "balance_reasoning": "Why this category was chosen based on life balance (e.g., 'Finance is underplayed with only 2 tasks in 7 days')",
  "reasoning": ["Bullet point 1", "Bullet point 2"]
}}"""
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"recommend_{current_user}_{req.match_id}",
            system_message=system_message
        )
        chat.with_model("openai", "gpt-4o")
        
        user_message = UserMessage(
            text=f"Recommend a life-balanced task. Time available: {req.time_available} minutes. Current time: {datetime.now(timezone.utc).strftime('%H:%M')} UTC. Remember to prioritize: {', '.join(available_cats)}"
        )
        
        response = await chat.send_message(user_message)
        
        # Parse AI response
        import json
        try:
            # Extract JSON from response
            response_text = response.strip()
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            recommendation = json.loads(response_text)
            
            # Ensure balance_reasoning exists
            if "balance_reasoning" not in recommendation:
                recommendation["balance_reasoning"] = f"Balancing your life across all categories"
            
            # Get category and add 3 task options with affiliate products
            category = recommendation.get("category")
            if category:
                # Get 3 default tasks for this category (1, 4, 6 runs)
                default_tasks = get_default_tasks_for_category(category)
                if default_tasks:
                    # Add affiliate product to EACH task option
                    for task in default_tasks:
                        affiliate_product = get_random_product(category)
                        if affiliate_product:
                            task["affiliate_product"] = affiliate_product
                    
                    recommendation["task_options"] = default_tasks
                
                # Also add main affiliate product for backward compatibility
                affiliate_product = get_random_product(category)
                if affiliate_product:
                    recommendation["affiliate_product"] = affiliate_product
            
            return recommendation
        except Exception as e:
            logging.error(f"JSON parse error: {str(e)}, Response: {response}")
            # Fallback recommendation from priority categories
            fallback_cat = available_cats[0] if available_cats else "Health"
            default_tasks = get_default_tasks_for_category(fallback_cat)
            
            # Add affiliate product to each task option
            if default_tasks:
                for task in default_tasks:
                    affiliate_product = get_random_product(fallback_cat)
                    if affiliate_product:
                        task["affiliate_product"] = affiliate_product
            
            affiliate_product = get_random_product(fallback_cat)
            fallback = {
                "task": f"Quick {fallback_cat.lower()} check-in",
                "category": fallback_cat,
                "run_value": 1,
                "balance_reasoning": f"{fallback_cat} needs more attention - only {balance[fallback_cat]['count']} tasks completed recently",
                "reasoning": ["Helps maintain life balance", "Quick and impactful"],
                "task_options": default_tasks if default_tasks else []
            }
            if affiliate_product:
                fallback["affiliate_product"] = affiliate_product
            return fallback
    
    except Exception as e:
        logging.error(f"AI recommendation error: {str(e)}")
        # Return fallback
        default_tasks = get_default_tasks_for_category("Career")
        
        # Add affiliate product to each task option
        if default_tasks:
            for task in default_tasks:
                affiliate_product = get_random_product("Career")
                if affiliate_product:
                    task["affiliate_product"] = affiliate_product
        
        affiliate_product = get_random_product("Career")
        fallback = {
            "task": "Review your goals for the day",
            "category": "Career",
            "run_value": 1,
            "balance_reasoning": "Career focus helps maintain productivity momentum",
            "reasoning": ["Helps prioritize", "Quick planning task"],
            "task_options": default_tasks if default_tasks else []
        }
        if affiliate_product:
            fallback["affiliate_product"] = affiliate_product
        return fallback

@api_router.get("/ai/balance")
async def get_category_balance_api(current_user: str = Depends(get_current_user), days: int = 7):
    """Get category balance for analytics"""
    balance = await calculate_category_balance(current_user, days)
    return balance

# ==================== WALLET ROUTES ====================

@api_router.get("/wallet/balance")
async def get_wallet_balance(current_user: str = Depends(get_current_user)):
    """Get wallet balance"""
    user_doc = await db.users.find_one({"user_id": current_user}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "balance": user_doc.get("wallet_balance", 0.0),
        "is_premium": user_doc.get("is_premium", False)
    }

@api_router.get("/wallet/transactions")
async def get_transactions(current_user: str = Depends(get_current_user)):
    """Get transaction history"""
    transactions = await db.transactions.find(
        {"user_id": current_user},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    return transactions

@api_router.post("/wallet/buy-runs")
async def buy_runs(req: BuyRunsRequest, current_user: str = Depends(get_current_user)):
    """Convert wallet balance to game runs"""
    # Check if user is premium
    user_doc = await db.users.find_one({"user_id": current_user})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user_doc.get("is_premium", False):
        raise HTTPException(status_code=403, detail="Premium membership required to buy runs")
    
    # Pricing: $1 = 10 runs
    runs_to_add = int(req.amount * 10)
    
    if user_doc["wallet_balance"] < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance")
    
    # Deduct from wallet
    new_balance = user_doc["wallet_balance"] - req.amount
    
    # Create transaction
    transaction_id = f"txn_{uuid.uuid4().hex[:12]}"
    transaction = {
        "transaction_id": transaction_id,
        "user_id": current_user,
        "amount": req.amount,
        "currency": "USD",
        "type": "run_purchase",
        "status": "completed",
        "runs_converted": runs_to_add,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.transactions.insert_one(transaction)
    await db.users.update_one(
        {"user_id": current_user},
        {"$set": {"wallet_balance": new_balance}}
    )
    
    # Add runs to current match
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    match = await db.matches.find_one({"user_id": current_user, "date": today})
    
    if match:
        new_runs = match["total_runs"] + runs_to_add
        await db.matches.update_one(
            {"match_id": match["match_id"]},
            {"$set": {"total_runs": new_runs}}
        )
    
    return {
        "message": "Runs purchased successfully",
        "runs_added": runs_to_add,
        "new_balance": new_balance,
        "exchange_rate": "₹1 = 10 runs"
    }

@api_router.post("/users/upgrade-premium")
async def upgrade_to_premium(current_user: str = Depends(get_current_user)):
    """Upgrade user to premium membership"""
    user_doc = await db.users.find_one({"user_id": current_user})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_doc.get("is_premium", False):
        raise HTTPException(status_code=400, detail="User is already premium")
    
    # Add ₹100 to wallet as welcome bonus
    welcome_bonus = 100.0
    new_balance = user_doc.get("wallet_balance", 0.0) + welcome_bonus
    
    # Upgrade user to premium
    await db.users.update_one(
        {"user_id": current_user},
        {
            "$set": {
                "is_premium": True,
                "wallet_balance": new_balance,
                "upgraded_at": datetime.now(timezone.utc)
            }
        }
    )
    
    # Create transaction for welcome bonus
    transaction_id = f"txn_{uuid.uuid4().hex[:12]}"
    transaction = {
        "transaction_id": transaction_id,
        "user_id": current_user,
        "amount": welcome_bonus,
        "currency": "INR",
        "type": "premium_welcome_bonus",
        "status": "completed",
        "runs_converted": None,
        "created_at": datetime.now(timezone.utc)
    }
    await db.transactions.insert_one(transaction)
    
    return {
        "message": "Successfully upgraded to Premium!",
        "is_premium": True,
        "welcome_bonus": welcome_bonus,
        "new_balance": new_balance
    }

@api_router.delete("/matches/today")
async def delete_today_match(current_user: str = Depends(get_current_user)):
    """Delete today's match to allow format selection"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Find today's match
    match_doc = await db.matches.find_one(
        {"user_id": current_user, "date": today}
    )
    
    if not match_doc:
        raise HTTPException(status_code=404, detail="No match found for today")
    
    # Delete all tasks for this match
    await db.tasks.delete_many({"match_id": match_doc["match_id"]})
    
    # Delete the match
    await db.matches.delete_one({"match_id": match_doc["match_id"]})
    
    return {"message": "Match deleted successfully. You can now select a new format."}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
