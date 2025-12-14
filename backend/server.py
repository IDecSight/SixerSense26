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
import httpx
import razorpay
import hmac
import hashlib
from affiliate_products import get_random_product
from affiliate_products_by_country import (
    get_products_for_country, 
    format_price, 
    get_currency_for_country,
    DEFAULT_COUNTRY
)
from default_tasks import get_default_tasks_for_category, DEFAULT_TASKS_BY_CATEGORY
from player_system import (
    generate_playing_xi,
    get_time_block_overs,
    calculate_balls_for_task,
    should_match_end_automatically
)

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

# Razorpay Configuration
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET")
RAZORPAY_WEBHOOK_SECRET = os.environ.get("RAZORPAY_WEBHOOK_SECRET")

# Initialize Razorpay client
razorpay_client = None
if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    logging.info("Razorpay client initialized successfully")
else:
    logging.warning("Razorpay credentials not found - payment features will be disabled")

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
    country: str = DEFAULT_COUNTRY  # User's country code (e.g., "IN", "US")
    currency: str = "INR"  # User's preferred currency
    playing_xi: Optional[List[Dict]] = None  # 11 players representing life roles
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
    balls_played: int = 0  # Total balls consumed by tasks
    bonus_runs: int = 0
    current_time_block: Optional[str] = None  # Morning, Afternoon, Evening, Night
    available_overs: int = 0  # Overs available in current time block
    status: str = "in_progress"  # in_progress, won, lost, expired
    created_at: datetime

class Task(BaseModel):
    task_id: str
    user_id: str
    match_id: str
    title: str
    category: str
    run_value: int
    estimated_minutes: Optional[int] = None
    balls_consumed: int = 1  # Number of balls this task consumes (1-6)
    status: str = "pending"  # pending, in_progress, completed, dismissed
    started_at: Optional[datetime] = None  # When task was started
    completed_at: Optional[datetime] = None  # When task was completed
    scheduled_start: Optional[datetime] = None  # Calculated start time based on previous tasks
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
    """Get today's match - auto-creates fresh match for new day"""
    print(f"[DEBUG TEST] GET /matches/today called for user {current_user[:8]}")
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    current_datetime = datetime.now(timezone.utc)
    
    # Check for any existing match from a previous day and archive it
    old_matches = await db.matches.find(
        {"user_id": current_user, "date": {"$ne": today}, "status": "in_progress"}
    ).to_list(None)
    
    for old_match in old_matches:
        # Auto-expire old matches
        await db.matches.update_one(
            {"match_id": old_match["match_id"]},
            {"$set": {"status": "expired"}}
        )
    
    # Look for today's ACTIVE match (exclude abandoned/expired matches)
    match_doc = await db.matches.find_one(
        {"user_id": current_user, "date": today, "status": "in_progress"},
        {"_id": 0}
    )
    
    if not match_doc:
        # Return null to indicate no match exists - user needs to select format
        return None
    
    # Check if match should auto-expire (day is over) - shouldn't happen with above logic
    if should_match_end_automatically(match_doc["date"], current_datetime):
        if match_doc["status"] == "in_progress":
            await db.matches.update_one(
                {"match_id": match_doc["match_id"]},
                {"$set": {"status": "expired"}}
            )
            match_doc["status"] = "expired"
    
    # Update time block and available overs
    current_hour = current_datetime.hour
    time_block_info = get_time_block_overs(current_hour)
    
    await db.matches.update_one(
        {"match_id": match_doc["match_id"]},
        {
            "$set": {
                "current_time_block": time_block_info["time_block"],
                "available_overs": time_block_info["available_overs"]
            }
        }
    )
    
    match_doc["current_time_block"] = time_block_info["time_block"]
    match_doc["available_overs"] = time_block_info["available_overs"]
    
    # Get tasks for this match (exclude dismissed tasks for clean display)
    tasks = await db.tasks.find(
        {"match_id": match_doc["match_id"], "status": {"$ne": "dismissed"}},
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
    logging.warning(f"[MATCH START] Endpoint hit - User: {current_user[:8] if current_user else 'None'}")
    
    try:
        body = await request.json()
        logging.warning(f"[MATCH START] Request body: {body}")
    except Exception as e:
        logging.error(f"[MATCH START] JSON parse failed: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
    
    match_format = body.get("format", "T20")
    logging.warning(f"[MATCH START] Format: {match_format}")
    
    # Validate format
    if match_format not in ["T20", "ODI", "Test"]:
        logging.error(f"[MATCH START] Invalid format: {match_format}")
        raise HTTPException(status_code=400, detail=f"Invalid format '{match_format}'. Must be T20, ODI, or Test")
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    logging.warning(f"[MATCH START] Checking existing match for {today}")
    
    # First check all matches for today
    all_todays_matches = await db.matches.find(
        {"user_id": current_user, "date": today}
    ).to_list(10)
    logging.warning(f"[MATCH START] Total matches today: {len(all_todays_matches)}")
    for m in all_todays_matches:
        logging.warning(f"[MATCH START] - Match {m.get('match_id')}: status={m.get('status')}")
    
    # Check if active match already exists (exclude abandoned matches)
    existing_match = await db.matches.find_one(
        {"user_id": current_user, "date": today, "status": "in_progress"}
    )
    if existing_match:
        logging.error(f"[MATCH START] Found active match: {existing_match.get('match_id')}")
        raise HTTPException(status_code=400, detail="Active match already exists for today")
    
    logging.warning(f"[MATCH START] No existing match, creating new one")
    
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
    
    # Get current time block and available overs
    current_datetime = datetime.now(timezone.utc)
    current_hour = current_datetime.hour
    time_block_info = get_time_block_overs(current_hour)
    
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
        "balls_played": 0,
        "bonus_runs": 0,
        "current_time_block": time_block_info["time_block"],
        "available_overs": time_block_info["available_overs"],
        "status": "in_progress",
        "created_at": current_datetime
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
                "created_at": current_datetime
            }
            await db.tasks.insert_one(task_doc)
    
    # Get tasks for this match (exclude dismissed tasks for clean display)
    tasks = await db.tasks.find(
        {"match_id": match_doc["match_id"], "status": {"$ne": "dismissed"}},
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
    # Get today's active match (exclude abandoned matches)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    match_doc = await db.matches.find_one({
        "user_id": current_user, 
        "date": today,
        "status": "in_progress"
    })
    
    if not match_doc:
        raise HTTPException(status_code=404, detail="No active match found. Please start a match first.")
    
    # Calculate balls consumed for this task
    estimated_minutes = task.estimated_minutes or 15  # Default 15 min
    balls_consumed = calculate_balls_for_task(estimated_minutes)
    
    # Calculate scheduled start time based on profile day_start_time and last task
    user_doc = await db.users.find_one({"user_id": current_user}, {"_id": 0})
    profile = user_doc.get("profile", {}) if user_doc else {}
    day_start_time_str = profile.get("day_start_time", "06:00")
    
    # Parse day_start_time
    day_start_hour, day_start_minute = map(int, day_start_time_str.split(":"))
    
    current_time = datetime.now(timezone.utc)
    today = current_time.date()
    
    # Get day start datetime
    day_start_dt = datetime.combine(today, datetime.min.time().replace(
        hour=day_start_hour, minute=day_start_minute
    ))
    day_start_dt = day_start_dt.replace(tzinfo=timezone.utc)
    
    # Find last task
    last_task = await db.tasks.find_one(
        {"match_id": match_doc["match_id"]},
        sort=[("completed_at", -1), ("started_at", -1), ("created_at", -1)]
    )
    
    scheduled_start = None
    
    if last_task:
        # If last task is completed, schedule with 5-min buffer
        if last_task.get("completed_at"):
            scheduled_start = max(last_task["completed_at"] + timedelta(minutes=5), current_time)
        # If last task is in progress, schedule after its estimated completion
        elif last_task.get("started_at"):
            last_task_duration = last_task.get("estimated_minutes", 15)
            scheduled_start = last_task["started_at"] + timedelta(minutes=last_task_duration + 5)
        # If last task is pending with scheduled end, chain after it
        elif last_task.get("scheduled_end"):
            scheduled_start = last_task["scheduled_end"] + timedelta(minutes=5)
        elif last_task.get("scheduled_start"):
            last_task_duration = last_task.get("estimated_minutes", 15)
            scheduled_start = last_task["scheduled_start"] + timedelta(minutes=last_task_duration + 5)
    else:
        # First task starts at user's day_start_time (if future) or now
        scheduled_start = max(day_start_dt, current_time)
    
    task_id = f"task_{uuid.uuid4().hex[:12]}"
    task_doc = {
        "task_id": task_id,
        "user_id": current_user,
        "match_id": match_doc["match_id"],
        "title": task.title,
        "category": task.category,
        "run_value": task.run_value,
        "estimated_minutes": estimated_minutes,
        "balls_consumed": balls_consumed,
        "status": "pending",
        "started_at": None,
        "completed_at": None,
        "scheduled_start": scheduled_start,
        "scheduled_end": scheduled_start + timedelta(minutes=estimated_minutes) if scheduled_start else None,
        "created_at": current_time
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
    
    # Check if the match is still active
    match_doc = await db.matches.find_one({"match_id": task_doc["match_id"]})
    
    if not match_doc:
        raise HTTPException(status_code=404, detail="Match not found")


    
    # Update task with completion time
    completion_time = datetime.now(timezone.utc)
    await db.tasks.update_one(
        {"task_id": task_id},
        {
            "$set": {
                "status": "completed",
                "completed_at": completion_time,
                "started_at": task_doc.get("started_at") or completion_time  # Set start if not set
            }
        }
    )
    
    # Calculate new totals
    balls_consumed = task_doc.get("balls_consumed", 1)
    new_runs = match_doc["total_runs"] + task_doc["run_value"]
    new_completed = match_doc["completed_tasks"] + 1
    new_balls_played = match_doc.get("balls_played", 0) + balls_consumed
    
    # Calculate overs in cricket notation (overs.balls format)
    # Example: 7 balls = 1.1 overs (1 over + 1 ball), not 1.166...
    complete_overs = new_balls_played // 6
    remaining_balls = new_balls_played % 6
    new_overs = complete_overs + (remaining_balls / 10.0)
    
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
                "balls_played": new_balls_played,
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
            
            # Get user's country for localized products
            user_country = user_doc.get("country", DEFAULT_COUNTRY)
            user_currency = user_doc.get("currency", get_currency_for_country(user_country))
            
            # Get category and add 3 task options with affiliate products
            category = recommendation.get("category")
            if category:
                # Get country-specific products
                country_products = get_products_for_country(user_country)
                
                # Get 3 default tasks for this category (1, 4, 6 runs)
                default_tasks = get_default_tasks_for_category(category)
                if default_tasks:
                    # Add affiliate product to EACH task option
                    category_products = country_products.get(category, [])
                    for idx, task in enumerate(default_tasks):
                        if category_products and idx < len(category_products):
                            product = category_products[idx].copy()
                            # Format price with local currency
                            product["price"] = format_price(product["price"], product["currency"])
                            task["affiliate_product"] = product
                    
                    recommendation["task_options"] = default_tasks
                
                # Also add main affiliate product for backward compatibility
                if category_products:
                    product = category_products[0].copy()
                    product["price"] = format_price(product["price"], product["currency"])
                    recommendation["affiliate_product"] = product
            
            return recommendation
        except Exception as e:
            logging.error(f"JSON parse error: {str(e)}, Response: {response}")
            # Fallback recommendation from priority categories
            fallback_cat = available_cats[0] if available_cats else "Health"
            default_tasks = get_default_tasks_for_category(fallback_cat)
            
            # Add country-specific affiliate products
            user_country = user_doc.get("country", DEFAULT_COUNTRY)
            country_products = get_products_for_country(user_country)
            category_products = country_products.get(fallback_cat, [])
            
            # Add affiliate product to each task option
            if default_tasks:
                for idx, task in enumerate(default_tasks):
                    if category_products and idx < len(category_products):
                        product = category_products[idx].copy()
                        product["price"] = format_price(product["price"], product["currency"])
                        task["affiliate_product"] = product
            
            affiliate_product = None
            if category_products:
                product = category_products[0].copy()
                product["price"] = format_price(product["price"], product["currency"])
                affiliate_product = product
            
            fallback = {
                "task": f"Quick {fallback_cat.lower()} check-in",
                "category": fallback_cat,
                "run_value": 1,
                "balance_reasoning": f"{fallback_cat} needs more attention - only {balance.get(fallback_cat, {}).get('count', 0)} tasks completed recently",
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

# ==================== RAZORPAY PAYMENT ROUTES ====================

class CreateOrderRequest(BaseModel):
    plan: str  # "monthly" or "yearly"
    
class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan: str

@api_router.post("/payment/create-order")
async def create_payment_order(
    request: CreateOrderRequest,
    current_user: str = Depends(get_current_user)
):
    """Create Razorpay order for subscription"""
    if not razorpay_client:
        raise HTTPException(
            status_code=503, 
            detail="Payment service not configured. Please contact support."
        )
    
    # Define plan amounts (in paise - multiply by 100)
    plan_amounts = {
        "monthly": 9900,  # ₹99
        "yearly": 69900   # ₹699
    }
    
    if request.plan not in plan_amounts:
        raise HTTPException(status_code=400, detail="Invalid plan selected")
    
    amount = plan_amounts[request.plan]
    
    try:
        # Create Razorpay order
        order_data = {
            "amount": amount,
            "currency": "INR",
            "receipt": f"sub_{request.plan}_{current_user}_{uuid.uuid4().hex[:8]}",
            "notes": {
                "user_id": current_user,
                "plan": request.plan,
                "description": f"Sixer Sense {request.plan.capitalize()} Subscription"
            }
        }
        
        razorpay_order = razorpay_client.order.create(data=order_data)
        
        # Store order in database
        order_doc = {
            "order_id": razorpay_order["id"],
            "user_id": current_user,
            "plan": request.plan,
            "amount": amount,
            "currency": "INR",
            "status": "created",
            "created_at": datetime.now(timezone.utc)
        }
        await db.payment_orders.insert_one(order_doc)
        
        logging.info(f"Razorpay order created: {razorpay_order['id']} for user {current_user}")
        
        return {
            "order_id": razorpay_order["id"],
            "amount": amount,
            "currency": "INR",
            "key_id": RAZORPAY_KEY_ID,
            "plan": request.plan
        }
        
    except Exception as e:
        logging.error(f"Error creating Razorpay order: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create payment order")

@api_router.post("/payment/verify")
async def verify_payment(
    request: VerifyPaymentRequest,
    current_user: str = Depends(get_current_user)
):
    """Verify Razorpay payment and activate premium subscription"""
    if not razorpay_client:
        raise HTTPException(status_code=503, detail="Payment service not configured")
    
    try:
        # Verify payment signature
        params_dict = {
            'razorpay_order_id': request.razorpay_order_id,
            'razorpay_payment_id': request.razorpay_payment_id,
            'razorpay_signature': request.razorpay_signature
        }
        
        razorpay_client.utility.verify_payment_signature(params_dict)
        
        # Payment verified successfully - Update user to premium
        subscription_duration = 30 if request.plan == "monthly" else 365  # days
        premium_expires_at = datetime.now(timezone.utc) + timedelta(days=subscription_duration)
        
        await db.users.update_one(
            {"user_id": current_user},
            {
                "$set": {
                    "is_premium": True,
                    "premium_plan": request.plan,
                    "premium_since": datetime.now(timezone.utc),
                    "premium_expires_at": premium_expires_at,
                    "wallet_balance": 100.0  # Welcome bonus
                }
            }
        )
        
        # Update order status
        await db.payment_orders.update_one(
            {"order_id": request.razorpay_order_id},
            {
                "$set": {
                    "payment_id": request.razorpay_payment_id,
                    "status": "paid",
                    "paid_at": datetime.now(timezone.utc)
                }
            }
        )
        
        # Create transaction record
        transaction = {
            "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
            "user_id": current_user,
            "type": "subscription",
            "amount": 9900 if request.plan == "monthly" else 69900,
            "currency": "INR",
            "plan": request.plan,
            "payment_id": request.razorpay_payment_id,
            "order_id": request.razorpay_order_id,
            "status": "success",
            "created_at": datetime.now(timezone.utc)
        }
        await db.transactions.insert_one(transaction)
        
        logging.info(f"Payment verified and premium activated for user {current_user}")
        
        return {
            "success": True,
            "message": "Payment successful! Welcome to Premium 🎉",
            "plan": request.plan,
            "expires_at": premium_expires_at.isoformat()
        }
        
    except razorpay.errors.SignatureVerificationError:
        logging.error(f"Payment signature verification failed for user {current_user}")
        raise HTTPException(status_code=400, detail="Invalid payment signature")
    except Exception as e:
        logging.error(f"Error verifying payment: {str(e)}")
        raise HTTPException(status_code=500, detail="Payment verification failed")

@api_router.post("/payment/webhook")
async def handle_payment_webhook(request: Request):
    """Handle Razorpay webhook events"""
    if not RAZORPAY_WEBHOOK_SECRET:
        logging.warning("Webhook received but RAZORPAY_WEBHOOK_SECRET not configured")
        return {"status": "ignored"}
    
    try:
        # Get webhook signature
        webhook_signature = request.headers.get('X-Razorpay-Signature', '')
        webhook_body = await request.body()
        
        # Verify webhook signature
        expected_signature = hmac.new(
            RAZORPAY_WEBHOOK_SECRET.encode('utf-8'),
            webhook_body,
            hashlib.sha256
        ).hexdigest()
        
        if webhook_signature != expected_signature:
            logging.error("Invalid webhook signature")
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        # Parse webhook data
        import json
        webhook_data = json.loads(webhook_body.decode('utf-8'))
        event = webhook_data.get('event')
        
        logging.info(f"Webhook received: {event}")
        
        # Handle different webhook events
        if event == 'payment.captured':
            payment = webhook_data['payload']['payment']['entity']
            order_id = payment.get('order_id')
            
            # Update order status in database
            await db.payment_orders.update_one(
                {"order_id": order_id},
                {
                    "$set": {
                        "webhook_status": "captured",
                        "webhook_received_at": datetime.now(timezone.utc)
                    }
                }
            )
            
        return {"status": "processed"}
        
    except Exception as e:
        logging.error(f"Webhook processing error: {str(e)}")
        return {"status": "error", "message": str(e)}

@api_router.delete("/matches/today")
async def delete_today_match(current_user: str = Depends(get_current_user)):
    """Delete today's match to restart fresh - can be done anytime"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Find ALL today's matches (in case there are duplicates)
    matches = await db.matches.find(
        {"user_id": current_user, "date": today}
    ).to_list(100)
    
    if not matches:
        raise HTTPException(status_code=404, detail="No match found for today")
    
    logging.warning(f"[MATCH DELETE] Found {len(matches)} matches to abandon")
    
    # Archive ALL matches for today instead of deleting (for history)
    result = await db.matches.update_many(
        {"user_id": current_user, "date": today},
        {"$set": {"status": "abandoned", "abandoned_at": datetime.now(timezone.utc)}}
    )
    
    logging.warning(f"[MATCH DELETE] Updated {result.modified_count} matches to abandoned")
    
    # Mark ALL tasks (pending, in_progress, completed) from today's matches as dismissed
    # This ensures a completely fresh start
    task_result = await db.tasks.update_many(
        {"user_id": current_user, "match_id": {"$in": [m["match_id"] for m in matches]}},
        {"$set": {"status": "dismissed", "dismissed_at": datetime.now(timezone.utc)}}
    )
    
    logging.warning(f"[MATCH DELETE] Dismissed {task_result.modified_count} tasks from abandoned matches")
    
    return {
        "message": "Match restarted successfully. Select a new format to begin fresh!",
        "can_restart": True,
        "matches_abandoned": result.modified_count,
        "tasks_dismissed": task_result.modified_count
    }

@api_router.get("/users/location")
async def detect_user_location(request: Request):
    """Detect user's location based on IP address"""
    try:
        # Try to get real IP from headers (in case of proxy/load balancer)
        client_ip = request.headers.get("X-Forwarded-For", request.client.host).split(",")[0].strip()
        
        # For localhost/development, return default
        if client_ip in ["127.0.0.1", "localhost", "::1"]:
            return {
                "country": DEFAULT_COUNTRY,
                "currency": get_currency_for_country(DEFAULT_COUNTRY),
                "detected": False
            }
        
        # Use ip-api.com for geolocation (free, no API key needed)
        async with httpx.AsyncClient() as client:
            response = await client.get(f"http://ip-api.com/json/{client_ip}")
            if response.status_code == 200:
                data = response.json()
                country_code = data.get("countryCode", DEFAULT_COUNTRY)
                
                return {
                    "country": country_code,
                    "currency": get_currency_for_country(country_code),
                    "detected": True,
                    "ip": client_ip
                }
    except Exception as e:
        print(f"Error detecting location: {str(e)}")
    
    # Fallback to default
    return {
        "country": DEFAULT_COUNTRY,
        "currency": get_currency_for_country(DEFAULT_COUNTRY),
        "detected": False
    }

@api_router.post("/users/update-location")
async def update_user_location(
    request: Request,
    current_user: str = Depends(get_current_user)
):
    """Update user's country and currency preferences"""
    try:
        body = await request.json()
        country = body.get("country", DEFAULT_COUNTRY)
        currency = get_currency_for_country(country)
        
        await db.users.update_one(
            {"user_id": current_user},
            {
                "$set": {
                    "country": country,
                    "currency": currency,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        
        return {
            "message": "Location updated successfully",
            "country": country,
            "currency": currency
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class CommentaryRequest(BaseModel):
    event_type: str  # task_completed, wicket_lost, over_completed, match_won, match_lost
    task_name: Optional[str] = None
    category: Optional[str] = None
    run_value: Optional[int] = None
    current_runs: int
    current_wickets: int
    match_format: str
    target_score: Optional[int] = None

@api_router.post("/users/generate-players")
async def generate_user_players(current_user: str = Depends(get_current_user)):
    """Generate playing XI (11 players) for user based on profile"""
    try:
        user_doc = await db.users.find_one({"user_id": current_user}, {"_id": 0})
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get user profile
        profile = user_doc.get("profile", {})
        if not profile:
            raise HTTPException(status_code=400, detail="Profile not set. Please complete profile first.")
        
        # Generate playing XI
        playing_xi = generate_playing_xi(profile)
        
        # Update user with players
        await db.users.update_one(
            {"user_id": current_user},
            {
                "$set": {
                    "playing_xi": playing_xi,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        
        return {
            "message": "Playing XI generated successfully",
            "playing_xi": playing_xi,
            "total_players": len(playing_xi)
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/users/playing-xi")
async def get_playing_xi(current_user: str = Depends(get_current_user)):
    """Get user's playing XI"""
    user_doc = await db.users.find_one({"user_id": current_user}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    playing_xi = user_doc.get("playing_xi", [])
    
    if not playing_xi:
        return {
            "playing_xi": [],
            "message": "No playing XI generated yet. Complete your profile first."
        }
    
    return {
        "playing_xi": playing_xi,
        "total_players": len(playing_xi)
    }

@api_router.post("/commentary/generate")
async def generate_commentary(req: CommentaryRequest, current_user: str = Depends(get_current_user)):
    """Generate live cricket-style commentary for user actions"""
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        # Build context-aware system message
        system_message = """You are a live Match Commentary Agent for the Sixer Sense app.

Your job is to generate short, engaging cricket-style commentary based on the user's real productivity actions.

You must make the app feel alive, fun, and motivating — never judgmental.

TONE & STYLE:
- Cricket commentator style
- Encouraging, witty, calm confidence
- Never sarcastic, never shaming
- 1–2 short sentences max
- Simple English, high energy

COMMENTARY RULES:
1. Never repeat the same line within the same day.
2. Match tone to event:
   - Success → celebratory
   - Wicket → calm, recovery-focused
   - Loss → respectful, encouraging
3. Do NOT mention money, betting, or gambling.
4. Do NOT over-hype small actions.
5. Make the user feel in control.

OUTPUT FORMAT (MANDATORY):
Return ONLY the commentary line as plain text.
No emojis.
No formatting.
No explanations."""

        # Build event-specific prompt
        if req.event_type == "task_completed":
            if req.run_value == 6:
                prompt = f"HIGH-VALUE TASK! User just completed '{req.task_name}' ({req.category}) for 6 RUNS! Score: {req.current_runs}/{req.current_wickets}. Match format: {req.match_format}. Generate exciting commentary."
            elif req.run_value == 4:
                prompt = f"User completed '{req.task_name}' ({req.category}) for 4 runs. Score: {req.current_runs}/{req.current_wickets}. Match format: {req.match_format}. Generate positive commentary."
            else:
                prompt = f"User completed '{req.task_name}' ({req.category}) for 1 run. Score: {req.current_runs}/{req.current_wickets}. Match format: {req.match_format}. Generate encouraging commentary."
        
        elif req.event_type == "wicket_lost":
            prompt = f"WICKET! User lost focus/missed a task. Score: {req.current_runs}/{req.current_wickets}. Match format: {req.match_format}. Generate calm, recovery-focused commentary. No blame."
        
        elif req.event_type == "over_completed":
            prompt = f"OVER COMPLETED! User finished 6 tasks. Score: {req.current_runs}/{req.current_wickets}. Match format: {req.match_format}. Generate celebratory commentary about the over."
        
        elif req.event_type == "match_won":
            prompt = f"MATCH WON! User achieved target of {req.target_score} runs! Final score: {req.current_runs}/{req.current_wickets}. Match format: {req.match_format}. Generate victory commentary."
        
        elif req.event_type == "match_lost":
            prompt = f"Match ended. User scored {req.current_runs} runs, target was {req.target_score}. Match format: {req.match_format}. Generate respectful, encouraging commentary about tomorrow."
        
        else:
            prompt = f"Generate cricket commentary for: {req.event_type}. Score: {req.current_runs}/{req.current_wickets}."
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"commentary_{current_user}",
            system_message=system_message
        )
        chat.with_model("openai", "gpt-4o-mini")  # Use faster model for real-time commentary
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Clean response - remove any extra formatting
        commentary = response.strip()
        commentary = commentary.replace("**", "").replace("*", "").replace("_", "")
        
        # Ensure it's concise (max 150 characters)
        if len(commentary) > 150:
            sentences = commentary.split(".")
            commentary = sentences[0] + "."
        
        return {
            "commentary": commentary,
            "event_type": req.event_type
        }
    
    except Exception as e:
        logging.error(f"Commentary generation error: {str(e)}")
        # Fallback commentary
        fallbacks = {
            "task_completed": "Task completed! Keep the momentum going.",
            "wicket_lost": "Focus reset. You're still in this match.",
            "over_completed": "Solid over! Six tasks down.",
            "match_won": "Victory! You've conquered today's match.",
            "match_lost": "Match done. Tomorrow's a fresh start."
        }
        return {
            "commentary": fallbacks.get(req.event_type, "Well played!"),
            "event_type": req.event_type
        }

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
