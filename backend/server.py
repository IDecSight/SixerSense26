from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Request, Header
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from jose import JWTError, jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage
import asyncio

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

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    is_premium: bool = False
    wallet_balance: float = 0.0
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
    type: str  # deposit, conversion
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
        # Check cookie as fallback
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
            # Create new user
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            user_doc = {
                "user_id": user_id,
                "email": email,
                "name": name,
                "picture": picture,
                "is_premium": False,
                "wallet_balance": 0.0,
                "created_at": datetime.now(timezone.utc)
            }
            await db.users.insert_one(user_doc)
            user_doc.pop("_id", None)
        else:
            user_id = user_doc["user_id"]
        
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
            match_id = f"match_{uuid.uuid4().hex[:12]}"
            match_doc = {
                "match_id": match_id,
                "user_id": user_id,
                "date": today,
                "format": "T20",
                "target_score": 60,
                "total_runs": 0,
                "total_wickets": 0,
                "completed_tasks": 0,
                "overs": 0.0,
                "status": "in_progress",
                "created_at": datetime.now(timezone.utc)
            }
            await db.matches.insert_one(match_doc)
        
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

# ==================== MATCH ROUTES ====================

@api_router.get("/matches/today")
async def get_today_match(current_user: str = Depends(get_current_user)):
    """Get today's match"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    match_doc = await db.matches.find_one(
        {"user_id": current_user, "date": today},
        {"_id": 0}
    )
    
    if not match_doc:
        # Create today's match
        match_id = f"match_{uuid.uuid4().hex[:12]}"
        match_doc = {
            "match_id": match_id,
            "user_id": current_user,
            "date": today,
            "format": "T20",
            "target_score": 60,
            "total_runs": 0,
            "total_wickets": 0,
            "completed_tasks": 0,
            "overs": 0.0,
            "status": "in_progress",
            "created_at": datetime.now(timezone.utc)
        }
        await db.matches.insert_one(match_doc)
        match_doc.pop("_id", None)
    
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
async def update_match_format(match_id: str, format: str, current_user: str = Depends(get_current_user)):
    """Update match format"""
    # Update target based on format
    target_map = {"T20": 60, "ODI": 150, "Test": 100}
    target = target_map.get(format, 60)
    
    await db.matches.update_one(
        {"match_id": match_id, "user_id": current_user},
        {"$set": {"format": format, "target_score": target}}
    )
    
    return {"message": "Format updated successfully"}

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
    if new_runs >= match_doc["target_score"] and match_doc["total_wickets"] < 10:
        status = "won"
    
    await db.matches.update_one(
        {"match_id": task_doc["match_id"]},
        {
            "$set": {
                "total_runs": new_runs,
                "completed_tasks": new_completed,
                "overs": new_overs,
                "status": status
            }
        }
    )
    
    return {
        "message": "Task completed",
        "runs_earned": task_doc["run_value"],
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
    """Get AI task recommendation"""
    try:
        # Get match details
        match_doc = await db.matches.find_one({"match_id": req.match_id})
        if not match_doc:
            raise HTTPException(status_code=404, detail="Match not found")
        
        # Get existing tasks
        tasks = await db.tasks.find({"match_id": req.match_id}, {"_id": 0}).to_list(None)
        
        # Create AI prompt
        system_message = f"""You are a productivity coach and cricket strategist for Sixer Sense app.
The user's day is a cricket match. Each task = one ball. Runs scored = productivity.

Current Match Status:
- Format: {match_doc['format']}
- Target: {match_doc['target_score']} runs
- Current Runs: {match_doc['total_runs']}
- Wickets Lost: {match_doc['total_wickets']}/10
- Overs: {match_doc['overs']:.1f}

Recommend ONE specific, actionable task across these categories:
- Health (exercise, nutrition)
- Career (work, learning)
- Finance (budget, investments)
- Relationships (family, friends)
- Spiritual/Mindset (meditation, reflection)
- Travel/Leisure (hobbies, fun)

Consider:
1. Time available: {req.time_available} minutes
2. Energy levels (morning/afternoon/evening)
3. Impact on overall goals
4. Match situation (need quick runs or steady progress?)

Return ONLY a JSON object:
{{
  "task": "Specific task title",
  "category": "Category name",
  "run_value": 1/4/6,
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
            text=f"Recommend a task for someone with {req.time_available} minutes available. Consider it's {datetime.now(timezone.utc).strftime('%H:%M')} UTC."
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
            return recommendation
        except:
            # Fallback recommendation
            return {
                "task": "Take a 5-minute walk",
                "category": "Health",
                "run_value": 1,
                "reasoning": ["Quick energy boost", "Improves focus"]
            }
    
    except Exception as e:
        logging.error(f"AI recommendation error: {str(e)}")
        # Return fallback
        return {
            "task": "Review your goals for the day",
            "category": "Career",
            "run_value": 1,
            "reasoning": ["Helps prioritize", "Quick planning task"]
        }

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
