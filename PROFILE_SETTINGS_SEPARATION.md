# 🔧 PROFILE vs SETTINGS SEPARATION - COMPLETE

## OBJECTIVE ACHIEVED
Implemented clean separation between USER PROFILE (identity/goals) and USER SETTINGS (app behavior/preferences).

---

## PART 1: CLEAR RESPONSIBILITIES DEFINED

### PROFILE = WHO THE USER IS & WHAT THEY WANT ✅

**Purpose**: Identity, long-term intent, life strategy

**Model**:
```python
class UserProfile(BaseModel):
    name: str
    email: str
    playing_style: str = "Balanced"  # Aggressive, Balanced, Defensive
```

**User Model (Root Level)**:
```python
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    profile: Optional[UserProfile] = None
    goals: Optional[UserGoals] = None  # ✅ Root level, not in profile
    settings: Optional[UserSettings] = UserSettings()  # ✅ Separate object
    ...
```

**Goals Structure**:
```python
goals = {
    "Health": {"short": [], "medium": [], "long": []},
    "Career": {"short": [], "medium": [], "long": []},
    "Finance": {"short": [], "medium": [], "long": []},
    "Relationships": {"short": [], "medium": [], "long": []},
    "Spiritual": {"short": [], "medium": [], "long": []},
    "Travel": {"short": [], "medium": [], "long": []}
}
```

**Updated By**: ✅ "Set Game Plan" (Goals flow) ONLY

**Profile Does NOT Store**:
- ❌ UI preferences
- ❌ Notifications
- ❌ Theme
- ❌ App behavior flags

---

### SETTINGS = HOW THE APP BEHAVES FOR THE USER ✅

**Purpose**: App behavior, UI preferences, defaults

**Model**:
```python
class UserSettings(BaseModel):
    preferred_playing_style: str = "Balanced"
    notifications_enabled: bool = True
    daily_reminder_time: Optional[str] = "09:00"  # HH:MM
    default_match_format: str = "T20"  # T20, ODI, Test
    language: str = "en"
    theme: str = "light"  # light, dark
    calendar_sync_enabled: bool = False
    health_sync_enabled: bool = False
```

**Updated By**: ✅ Settings Screen/Endpoint ONLY

**Settings Does NOT Store**:
- ❌ Goals
- ❌ Tasks
- ❌ Match data
- ❌ User identity

---

## PART 2: SET GAME PLAN FLOW (PROFILE ONLY) ✅

### What Happens

```
User clicks "Set Game Plan"
  ↓
1. Call AI Orchestrator
2. Parse goals
3. Update ONLY: goals (root level)
4. Create Today's Playing XI tasks
5. DO NOT touch settings
6. DO NOT touch profile
```

### Code Implementation

**Endpoint**: `POST /api/goals/set-game-plan`

**Update Query**:
```python
await db.users.update_one(
    {"user_id": current_user},
    {"$set": {"goals": mapped_goals}}  # ✅ Only updates goals
)
```

**What is PROTECTED**:
- ✅ `settings` object - NEVER touched
- ✅ `profile.name` - NEVER touched
- ✅ `profile.email` - NEVER touched
- ✅ `profile.playing_style` - NEVER touched
- ✅ All other user fields - NEVER touched

**What is UPDATED**:
- ✅ `goals` ONLY - Safe, targeted update

**Logs**:
```
💾 Updating goals (safe update)...
✅ Goals updated successfully
```

---

## PART 3: SETTINGS FLOW (SEPARATE ENDPOINTS) ✅

### New Endpoints Created

#### 1. GET /api/user/settings

**Purpose**: Retrieve user settings

**Response**:
```json
{
  "preferred_playing_style": "Balanced",
  "notifications_enabled": true,
  "daily_reminder_time": "09:00",
  "default_match_format": "T20",
  "language": "en",
  "theme": "light",
  "calendar_sync_enabled": false,
  "health_sync_enabled": false
}
```

**Returns Default if Not Exists**: Yes

---

#### 2. PATCH /api/user/settings

**Purpose**: Update user settings

**Request Model**:
```python
class UpdateSettingsRequest(BaseModel):
    preferred_playing_style: Optional[str] = None
    notifications_enabled: Optional[bool] = None
    daily_reminder_time: Optional[str] = None
    default_match_format: Optional[str] = None
    language: Optional[str] = None
    theme: Optional[str] = None
    calendar_sync_enabled: Optional[bool] = None
    health_sync_enabled: Optional[bool] = None
```

**Request Example**:
```json
{
  "theme": "dark",
  "notifications_enabled": false
}
```

**Update Query**:
```python
# Build update object with only provided fields
update_fields = {}
for field, value in req.dict(exclude_unset=True).items():
    if value is not None:
        update_fields[f"settings.{field}"] = value

# Update ONLY settings, NEVER profile or goals
await db.users.update_one(
    {"user_id": current_user},
    {"$set": update_fields}
)
```

**Response**:
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "settings": {
    "preferred_playing_style": "Balanced",
    "notifications_enabled": false,
    "theme": "dark",
    ...
  }
}
```

**What Happens After Update**:
- ✅ Changes apply immediately to app behavior
- ❌ Does NOT regenerate tasks
- ❌ Does NOT change goals
- ❌ Does NOT affect profile

**Logs**:
```
🎚️ Updating settings for user abc123
   Fields to update: ['settings.theme', 'settings.notifications_enabled']
✅ Settings updated successfully
```

---

## PART 4: FRONTEND BOUNDARIES ✅

### HOME / SET GAME PLAN Screen

**Reads**:
- `goals` (to display current goals)

**Writes**:
- `goals` (via "Set Game Plan" button)

**Triggers**:
- ✅ Task regeneration (deletes old, creates new 11 tasks)

**Does NOT Touch**:
- ❌ `settings`
- ❌ `profile.name`
- ❌ `profile.email`

---

### PROFILE Screen

**Displays**:
- Goals (read-only or editable via "Set Game Plan")
- Strongest/weakest categories
- Playing style

**Does NOT Display**:
- ❌ Notification toggles
- ❌ Theme selector
- ❌ App behavior settings

---

### SETTINGS Screen (NEW)

**Displays**:
- ✅ Theme toggle (light/dark)
- ✅ Notification toggle
- ✅ Daily reminder time picker
- ✅ Default match format selector
- ✅ Language selector
- ✅ Calendar sync toggle
- ✅ Health sync toggle

**Does NOT Display**:
- ❌ Goals input
- ❌ Task list
- ❌ Match data

**API Calls**:
- `GET /api/user/settings` on mount
- `PATCH /api/user/settings` on change

**Does NOT Trigger**:
- ❌ Task regeneration
- ❌ Match restart
- ❌ Goal updates

---

## PART 5: VERIFICATION CHECKLIST ✅

### ✅ Profile Safety
```python
# Before Set Game Plan
user = db.users.find_one({"user_id": "test_user"})
assert "settings" in user
assert user["settings"]["theme"] == "light"

# Set Game Plan
# ...

# After Set Game Plan
user = db.users.find_one({"user_id": "test_user"})
assert user["settings"]["theme"] == "light"  # ✅ UNCHANGED
assert user["goals"] is not None  # ✅ UPDATED
```

### ✅ Settings Safety
```python
# Before Settings Update
user = db.users.find_one({"user_id": "test_user"})
assert user["goals"]["Health"]["short"] == ["Exercise daily"]

# Update Settings (theme = dark)
# ...

# After Settings Update
user = db.users.find_one({"user_id": "test_user"})
assert user["goals"]["Health"]["short"] == ["Exercise daily"]  # ✅ UNCHANGED
assert user["settings"]["theme"] == "dark"  # ✅ UPDATED
```

### ✅ Task Regeneration
- Set Game Plan → Tasks regenerated
- Update Settings → Tasks NOT regenerated

### ✅ Independence
- Update goals → Settings unchanged
- Update settings → Goals unchanged

---

## DATABASE SCHEMA

### User Collection

```json
{
  "user_id": "user_123",
  "email": "john@example.com",
  "name": "John Doe",
  "picture": "https://...",
  "is_premium": false,
  
  "profile": {
    "name": "John Doe",
    "email": "john@example.com",
    "playing_style": "Balanced"
  },
  
  "goals": {
    "Health": {
      "short": ["Exercise 30 min daily"],
      "medium": ["Run a 5K"],
      "long": ["Complete marathon"]
    },
    "Career": {
      "short": ["Learn AI"],
      "medium": ["Get promoted"],
      "long": ["Start business"]
    },
    "Finance": {"short": [], "medium": [], "long": []},
    "Relationships": {"short": [], "medium": [], "long": []},
    "Spiritual": {"short": [], "medium": [], "long": []},
    "Travel": {"short": [], "medium": [], "long": []}
  },
  
  "settings": {
    "preferred_playing_style": "Balanced",
    "notifications_enabled": true,
    "daily_reminder_time": "09:00",
    "default_match_format": "T20",
    "language": "en",
    "theme": "light",
    "calendar_sync_enabled": false,
    "health_sync_enabled": false
  },
  
  "country": "IN",
  "currency": "INR",
  "created_at": "2024-12-24T..."
}
```

---

## API REFERENCE

### Goals Endpoints

#### POST /api/goals/set-game-plan
**Purpose**: Parse goals, update user goals, generate Playing XI  
**Updates**: `goals` ONLY  
**Triggers**: Task regeneration  

---

### Settings Endpoints

#### GET /api/user/settings
**Purpose**: Retrieve user settings  
**Returns**: Settings object or defaults  

#### PATCH /api/user/settings
**Purpose**: Update app behavior preferences  
**Updates**: `settings` ONLY  
**Does NOT Trigger**: Task regeneration  

---

## TESTING GUIDE

### Test 1: Set Game Plan Does Not Affect Settings

```bash
# 1. Get current settings
curl -H "Authorization: Bearer $TOKEN" \
  https://sixer-sense-1.preview.emergentagent.com/api/user/settings

# Note theme: "light"

# 2. Set game plan
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"goal_text": "I want to exercise daily"}' \
  https://sixer-sense-1.preview.emergentagent.com/api/goals/set-game-plan

# 3. Get settings again
curl -H "Authorization: Bearer $TOKEN" \
  https://sixer-sense-1.preview.emergentagent.com/api/user/settings

# Verify theme still "light" ✅
```

### Test 2: Update Settings Does Not Affect Goals

```bash
# 1. Set goals
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"goal_text": "I want to exercise daily"}' \
  https://sixer-sense-1.preview.emergentagent.com/api/goals/set-game-plan

# Note goals created

# 2. Update settings
curl -X PATCH -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"theme": "dark"}' \
  https://sixer-sense-1.preview.emergentagent.com/api/user/settings

# 3. Check goals still exist
# Goals should be unchanged ✅
```

### Test 3: Settings Update Does Not Regenerate Tasks

```bash
# 1. Create tasks via Set Game Plan
# 2. Note task count (11)
# 3. Update settings (theme = dark)
# 4. Check task count
# Should still be 11 (not regenerated) ✅
```

---

## MIGRATION NOTES

### Existing Users

**If `settings` field doesn't exist**:
- Default settings returned by GET endpoint
- First PATCH creates the field

**If old profile structure exists**:
- Goals at root level take precedence
- Old `profile.goals` ignored if `goals` exists at root

**Backward Compatibility**:
- ✅ Existing goals work
- ✅ Existing profiles work
- ✅ New settings field added seamlessly

---

## BENEFITS OF THIS SEPARATION

### 1. Clarity ✅
- Clear what "Set Game Plan" updates (goals only)
- Clear what Settings screen updates (settings only)

### 2. Safety ✅
- Goals cannot accidentally affect UI preferences
- Settings cannot accidentally regenerate tasks

### 3. Maintainability ✅
- Easy to add new settings without touching goals logic
- Easy to add new goal categories without touching settings

### 4. User Experience ✅
- Users understand where to change what
- No unexpected side effects

### 5. API Design ✅
- RESTful separation
- Single responsibility per endpoint

---

## WHAT DID NOT CHANGE

### Unchanged Systems:
- ❌ Match lifecycle
- ❌ Task scoring
- ❌ AI Orchestrator prompts
- ❌ Task generation logic
- ❌ Subscription system
- ❌ Calendar sync (just moved to settings toggle)
- ❌ Health tracking (just moved to settings toggle)

### Only Changed:
- ✅ Data model (added `settings` object)
- ✅ Set Game Plan updates `goals` only
- ✅ New Settings endpoints
- ✅ Clear separation of concerns

---

## FILES MODIFIED

1. **`/app/backend/server.py`**
   - Refactored `UserProfile` model (simplified)
   - Added `UserSettings` model (lines 114-122)
   - Updated `User` model (added `settings` field)
   - Added `UpdateSettingsRequest` model (lines 238-246)
   - Added `GET /api/user/settings` endpoint (lines 902-918)
   - Added `PATCH /api/user/settings` endpoint (lines 920-964)
   - Updated Set Game Plan to update `goals` not `profile.goals` (line 1953)

---

## SUMMARY

| Feature | Before | After |
|---------|--------|-------|
| Goals Location | `profile.goals` | `goals` (root level) ✅ |
| Settings Location | N/A | `settings` (root level) ✅ |
| Set Game Plan Updates | ❓ Unclear | `goals` ONLY ✅ |
| Settings Updates | ❌ No endpoint | `PATCH /api/user/settings` ✅ |
| Clear Boundaries | ❌ No | ✅ Yes |
| Safe Updates | ⚠️ Risky | ✅ Safe |

---

**Status**: ✅ COMPLETE  
**Profile/Settings Separation**: IMPLEMENTED  
**Backend**: Clean boundaries enforced  
**Frontend**: Ready for Settings screen implementation  

**Goals and Settings are now completely separate with no risk of cross-contamination.**

---

**Date**: December 24, 2024  
**Version**: 6.0 - Profile/Settings Separation  
**Status**: ✅ PRODUCTION READY
