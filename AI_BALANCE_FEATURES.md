# 🎯 AI Recommendation Balance System & User Profile

## Overview

Implemented comprehensive AI recommendation balance logic and user profile system to ensure life-balanced task recommendations across all six productivity categories.

---

## ✅ 1. AI RECOMMENDATION BALANCE LOGIC

### Problem Solved
Previously, AI could recommend tasks from the same category repeatedly, leading to imbalanced productivity focus (e.g., only Health tasks, neglecting Career or Relationships).

### Solution Implemented

#### **Category Balance Tracking**
- Tracks task completion across 6 categories over last 7 days
- Calculates metrics per category:
  - Task count (completed tasks)
  - Total runs earned
  - Time spent (minutes)

#### **Intelligent Category Selection**
```python
# Backend calculates balance automatically
balance = await calculate_category_balance(user_id, days=7)
# Example output:
{
  "Health": {"count": 5, "runs": 20, "minutes": 75},
  "Career": {"count": 8, "runs": 40, "minutes": 240},
  "Finance": {"count": 1, "runs": 4, "minutes": 20},  # Underrepresented!
  "Relationships": {"count": 2, "runs": 6, "minutes": 30},
  "Spiritual/Mindset": {"count": 3, "runs": 12, "minutes": 45},
  "Travel/Leisure": {"count": 0, "runs": 0, "minutes": 0}  # Neglected!
}
```

#### **Priority Logic**
1. **Identify Underrepresented Categories**: Categories with lowest task count get priority
2. **Avoid Repetition**: Tracks last 3 completed tasks to prevent same category twice in a row
3. **Balance Reasoning**: AI explains WHY a category was chosen

### API Response Example
```json
{
  "task": "Review monthly budget and expenses",
  "category": "Finance",
  "run_value": 4,
  "balance_reasoning": "Finance is underplayed with only 1 task in 7 days - time to check your financial health!",
  "reasoning": [
    "Helps maintain financial awareness",
    "Quick 20-minute review can prevent issues"
  ]
}
```

### Frontend Display
- Shows **"Life Balance Insight"** section in Captain's Call
- Highlights why AI chose that specific category
- Makes users aware of neglected life areas

---

## ✅ 2. USER PROFILE SYSTEM

### Profile Fields

| Field | Options | Purpose |
|-------|---------|---------|
| **Primary Goal** | Balance, Career growth, Health, Wealth | Guides overall recommendation weighting |
| **Profession** | Free text (optional) | Contextualizes work-related tasks |
| **Life Stage** | Student, Working Professional, Entrepreneur | Adjusts task complexity and focus |
| **Daily Availability** | Low (1-2h), Medium (3-5h), High (6+h) | Controls task volume and duration |
| **Preferred Focus Areas** | Select 2-3 from 6 categories | Increases weight for chosen categories |

### Profile Impact on Recommendations

#### **Example 1: Career-Focused User**
```json
{
  "primary_goal": "Career growth",
  "life_stage": "Working Professional",
  "daily_availability": "High",
  "preferred_focus_areas": ["Career", "Finance"]
}
```
**AI Behavior:**
- Career tasks weighted 3x
- Finance tasks weighted 2x
- Still recommends other categories for balance
- Higher-effort tasks (6 runs) more frequent

#### **Example 2: Health-Focused User**
```json
{
  "primary_goal": "Health",
  "life_stage": "Entrepreneur",
  "daily_availability": "Low",
  "preferred_focus_areas": ["Health", "Spiritual/Mindset"]
}
```
**AI Behavior:**
- Health tasks weighted 3x
- Spiritual/Mindset weighted 2x
- Shorter tasks (1-4 runs) prioritized
- Wellness and balance emphasized

---

## ✅ 3. DEFAULT TASK GENERATION

### Dynamic Task Creation
When a user logs in for the first time each day, the system generates balanced starter tasks based on their profile.

### Task Templates by Category

**Health:**
- Morning exercise routine (4 runs, 15 mins)
- Drink 8 glasses of water (1 run, 5 mins)
- Take a mindful walk (1 run, 10 mins)

**Career:**
- Complete priority work task (6 runs, 60 mins)
- Learn something new (4 runs, 30 mins)
- Review daily goals (1 run, 10 mins)

**Finance:**
- Review budget and expenses (4 runs, 20 mins)
- Track today's spending (1 run, 5 mins)
- Research investment opportunity (4 runs, 30 mins)

**Relationships:**
- Call or message a loved one (1 run, 15 mins)
- Plan quality time (4 runs, 20 mins)
- Send appreciation message (1 run, 5 mins)

**Spiritual/Mindset:**
- 10-minute meditation (4 runs, 10 mins)
- Write gratitude journal (1 run, 5 mins)
- Practice breathing exercises (1 run, 5 mins)

**Travel/Leisure:**
- Enjoy a hobby (4 runs, 20 mins)
- Watch/read something entertaining (1 run, 30 mins)
- Plan weekend activity (1 run, 10 mins)

### Generation Rules

#### Low Availability
- 1 task per category
- Prefer shortest duration tasks
- Only add if category weighted ≥ 2

#### Medium Availability (Default)
- 1 task per category
- Balanced mix of durations
- All categories included

#### High Availability
- 2 tasks per weighted category
- Mix of short and long tasks
- More ambitious goals

---

## ✅ 4. PROFILE UPDATE FLOW

### Settings Page Enhancement

**New Section:** "Your Profile" card in Settings

**Features:**
- ✅ View current profile
- ✅ Edit all profile fields
- ✅ Interactive focus area selection (checkboxes)
- ✅ Real-time validation (2-3 focus areas required)
- ✅ Save profile with success toast

### What Happens on Profile Update

1. **Profile Saved** → Database updated
2. **Future Recommendations** → AI uses new profile
3. **Next Day's Tasks** → Default tasks regenerated with new weights
4. **Past Data Preserved** → Match history and scores unchanged

### API Endpoints

```
PATCH /api/profile
GET /api/profile
GET /api/ai/balance?days=7
```

---

## ✅ 5. SAFETY & CONTINUITY

### Backward Compatibility
- Existing users automatically get default profile
- Profile fields: `primary_goal: "Balance"`, `life_stage: "Working Professional"`, etc.
- No data loss for existing matches and tasks

### Data Integrity
- Profile updates don't affect:
  - ✅ Past match history
  - ✅ Completed task records
  - ✅ Runs and wickets earned
  - ✅ Strike rates and achievements
- Only affects:
  - ⚠️ Future AI recommendations
  - ⚠️ Tomorrow's default tasks
  - ⚠️ Category balance weighting

---

## 🧪 Testing Scenarios

### Scenario 1: Imbalanced User
**Setup:**
- User completes 10 Career tasks, 0 Health tasks in 7 days
- Requests AI recommendation

**Expected:**
- AI prioritizes Health category
- balance_reasoning: "Health is neglected with 0 tasks in 7 days - your body needs attention!"

### Scenario 2: Profile-Driven Tasks
**Setup:**
- User sets primary_goal: "Wealth"
- preferred_focus_areas: ["Finance", "Career"]
- daily_availability: "Low"

**Expected:**
- Next day: 1-2 Finance tasks, 1-2 Career tasks appear as defaults
- Shorter duration tasks (5-20 mins)
- Other categories still present for balance

### Scenario 3: Repetition Avoidance
**Setup:**
- User completes 3 consecutive Career tasks
- Requests AI recommendation

**Expected:**
- AI avoids Career category
- Suggests next-priority category (e.g., Relationships or Finance)
- balance_reasoning explains the switch

---

## 📊 API Changes Summary

### New Endpoints
- `PATCH /api/profile` - Update user profile
- `GET /api/profile` - Get user profile
- `GET /api/ai/balance` - Get category balance analytics

### Modified Endpoints
- `POST /api/ai/recommend` - Now includes balance logic and profile context
- `POST /api/auth/session` - Creates default profile for new users
- `GET /api/matches/today` - Generates profile-based default tasks

### New Models
```python
class UserProfile(BaseModel):
    primary_goal: str
    profession: Optional[str]
    life_stage: str
    daily_availability: str
    preferred_focus_areas: List[str]
```

---

## 🎯 Impact Summary

### User Benefits
1. **Life Balance** → AI prevents category neglect
2. **Personalization** → Tasks match user goals and lifestyle
3. **Transparency** → Clear reasoning for recommendations
4. **Flexibility** → Update profile anytime, instant effect
5. **Smart Defaults** → New days start with relevant tasks

### Technical Benefits
1. **Scalable** → Balance calculation works for any user
2. **Maintainable** → Profile system is extensible
3. **Testable** → Clear inputs and outputs
4. **Performant** → Efficient MongoDB queries

---

## 🚀 Next Steps (Future Enhancements)

1. **Category Analytics Dashboard** → Visual chart showing 7-day balance
2. **Balance Score** → Single metric (0-100) showing life balance quality
3. **Streak Bonuses** → Extra runs for maintaining balance across all categories
4. **Weekly Balance Report** → Email summary with insights
5. **AI Learning** → Track which recommendations user accepts/ignores

---

## 📝 Change Log

**Date:** December 13, 2024

**Changes:**
- ✅ Added category balance tracking (7-day window)
- ✅ Implemented priority-based category selection
- ✅ Added balance reasoning to AI responses
- ✅ Created user profile system (5 fields)
- ✅ Built profile update UI in Settings
- ✅ Implemented profile-driven default task generation
- ✅ Added backward compatibility for existing users
- ✅ Updated Captain's Call to show balance insights

**Files Modified:**
- `/app/backend/server.py` - Core balance logic and profile endpoints
- `/app/frontend/src/components/ProfileForm.js` - New profile form component
- `/app/frontend/src/components/CaptainsCall.js` - Balance reasoning display
- `/app/frontend/src/pages/Settings.js` - Profile form integration

**API Version:** v1.1

---

**Built with ❤️ for balanced, productive living**
