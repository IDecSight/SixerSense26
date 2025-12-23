#!/usr/bin/env python3

import requests
import json
import sys
from pymongo import MongoClient
import uuid
from datetime import datetime, timezone, timedelta
import jwt

def test_premium_enforcement():
    """Test Free vs Premium enforcement for Sixer Sense app"""
    
    print("🔐 Testing Free vs Premium Enforcement")
    print("=" * 50)
    
    base_url = "https://sixer-sense-1.preview.emergentagent.com"
    
    # MongoDB connection
    mongo_client = MongoClient("mongodb://localhost:27017")
    db = mongo_client["test_database"]
    
    tests_passed = 0
    tests_failed = 0
    
    def create_test_user(is_premium=False):
        """Create test user and return user_id and JWT token"""
        user_id = f"test_user_{uuid.uuid4().hex[:12]}"
        
        # Create user in database
        user_doc = {
            "user_id": user_id,
            "email": f"test_{user_id}@example.com",
            "name": f"Test User {user_id[:8]}",
            "is_premium": is_premium,
            "wallet_balance": 100.0 if is_premium else 0.0,
            "profile": {
                "primary_goal": "Balance",
                "profession": "Software Engineer",
                "life_stage": "Working Professional", 
                "daily_availability": "Medium",
                "preferred_focus_areas": ["Career", "Health"]
            },
            "country": "IN",
            "currency": "INR",
            "win_streak": 0,
            "next_target": 60,
            "total_bonus_runs": 0,
            "created_at": datetime.utcnow()
        }
        
        db.users.insert_one(user_doc)
        
        # Create JWT token
        payload = {
            "sub": user_id,
            "exp": datetime.now(timezone.utc) + timedelta(hours=24)
        }
        secret_key = "your_secret_key_change_in_production_c3db956af1e2b2a"
        token = jwt.encode(payload, secret_key, algorithm="HS256")
        
        print(f"✅ Created test user: {user_id[:12]} (Premium: {is_premium})")
        return user_id, token
    
    def create_test_match(user_id):
        """Create test match for user"""
        match_id = f"match_{uuid.uuid4().hex[:12]}"
        today = datetime.utcnow().strftime("%Y-%m-%d")
        
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
            "balls_played": 0,
            "bonus_runs": 0,
            "status": "in_progress",
            "created_at": datetime.utcnow()
        }
        
        db.matches.insert_one(match_doc)
        print(f"✅ Created test match: {match_id[:12]}")
        return match_id
    
    def cleanup_user(user_id):
        """Clean up test data"""
        db.matches.delete_many({"user_id": user_id})
        db.tasks.delete_many({"user_id": user_id})
        db.users.delete_one({"user_id": user_id})
        print(f"🧹 Cleaned up user: {user_id[:12]}")
    
    try:
        # Test 1: AI Recommendation Endpoint Protection
        print("\n🤖 Test 1: AI Recommendation Endpoint Protection")
        
        # Create free user
        free_user_id, free_token = create_test_user(is_premium=False)
        match_id = create_test_match(free_user_id)
        
        # Test free user access (should get 403)
        headers = {
            'Authorization': f'Bearer {free_token}',
            'Content-Type': 'application/json'
        }
        data = {"match_id": match_id, "time_available": 30}
        
        response = requests.post(f"{base_url}/api/ai/recommend", json=data, headers=headers)
        
        if response.status_code == 403:
            error_msg = response.json().get("detail", "")
            if "Premium membership" in error_msg:
                print("✅ Free user correctly blocked from AI recommendations")
                tests_passed += 1
            else:
                print(f"❌ Wrong error message: {error_msg}")
                tests_failed += 1
        else:
            print(f"❌ Expected 403, got {response.status_code}")
            tests_failed += 1
        
        # Upgrade user to premium
        db.users.update_one({"user_id": free_user_id}, {"$set": {"is_premium": True}})
        print("🔄 Upgraded user to premium")
        
        # Test premium user access (should get 200)
        response = requests.post(f"{base_url}/api/ai/recommend", json=data, headers=headers)
        
        if response.status_code == 200:
            ai_data = response.json()
            if "task" in ai_data and "category" in ai_data:
                print("✅ Premium user can access AI recommendations")
                tests_passed += 1
            else:
                print("❌ Invalid AI response structure")
                tests_failed += 1
        else:
            print(f"❌ Expected 200, got {response.status_code}: {response.text}")
            tests_failed += 1
        
        cleanup_user(free_user_id)
        
        # Test 2: Profile Update Endpoint Protection
        print("\n👤 Test 2: Profile Update Endpoint Protection")
        
        # Create free user
        free_user_id, free_token = create_test_user(is_premium=False)
        
        headers = {
            'Authorization': f'Bearer {free_token}',
            'Content-Type': 'application/json'
        }
        profile_data = {
            "primary_goal": "Career growth",
            "profession": "Data Scientist",
            "life_stage": "Working Professional",
            "daily_availability": "High",
            "preferred_focus_areas": ["Career", "Finance"]
        }
        
        # Test free user access (should get 403)
        response = requests.patch(f"{base_url}/api/profile", json=profile_data, headers=headers)
        
        if response.status_code == 403:
            error_msg = response.json().get("detail", "")
            if "Premium membership" in error_msg:
                print("✅ Free user correctly blocked from profile updates")
                tests_passed += 1
            else:
                print(f"❌ Wrong error message: {error_msg}")
                tests_failed += 1
        else:
            print(f"❌ Expected 403, got {response.status_code}")
            tests_failed += 1
        
        # Upgrade user to premium
        db.users.update_one({"user_id": free_user_id}, {"$set": {"is_premium": True}})
        print("🔄 Upgraded user to premium")
        
        # Test premium user access (should get 200)
        response = requests.patch(f"{base_url}/api/profile", json=profile_data, headers=headers)
        
        if response.status_code == 200:
            update_data = response.json()
            if "message" in update_data and "profile" in update_data:
                print("✅ Premium user can update profile")
                tests_passed += 1
            else:
                print("❌ Invalid profile update response")
                tests_failed += 1
        else:
            print(f"❌ Expected 200, got {response.status_code}: {response.text}")
            tests_failed += 1
        
        cleanup_user(free_user_id)
        
        # Test 3: Verify Premium User Status
        print("\n🔒 Test 3: Premium User Status Verification")
        
        # Create premium user
        premium_user_id, premium_token = create_test_user(is_premium=True)
        
        headers = {
            'Authorization': f'Bearer {premium_token}',
            'Content-Type': 'application/json'
        }
        
        # Check wallet balance shows premium status
        response = requests.get(f"{base_url}/api/wallet/balance", headers=headers)
        
        if response.status_code == 200:
            wallet_data = response.json()
            if wallet_data.get("is_premium") == True:
                print("✅ Premium user status correctly reflected in wallet")
                tests_passed += 1
            else:
                print("❌ Premium status not shown in wallet")
                tests_failed += 1
        else:
            print(f"❌ Wallet endpoint failed: {response.status_code}")
            tests_failed += 1
        
        cleanup_user(premium_user_id)
        
        # Print Results
        print("\n" + "=" * 50)
        print("📊 TEST RESULTS")
        print("=" * 50)
        print(f"✅ Tests Passed: {tests_passed}")
        print(f"❌ Tests Failed: {tests_failed}")
        print(f"📈 Success Rate: {tests_passed}/{tests_passed + tests_failed} ({100 * tests_passed / (tests_passed + tests_failed):.1f}%)")
        
        if tests_failed == 0:
            print("\n🎉 ALL PREMIUM ENFORCEMENT TESTS PASSED!")
            print("✅ Free users are correctly blocked from premium features")
            print("✅ Premium users can access all premium features")
            print("✅ Error messages are correct and informative")
            return True
        else:
            print(f"\n❌ {tests_failed} TESTS FAILED")
            print("❌ Premium enforcement may have issues")
            return False
            
    except Exception as e:
        print(f"❌ Test execution failed: {str(e)}")
        return False
    
    finally:
        mongo_client.close()

if __name__ == "__main__":
    success = test_premium_enforcement()
    sys.exit(0 if success else 1)