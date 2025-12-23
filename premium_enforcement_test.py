import requests
import sys
import json
from datetime import datetime
import asyncio
import aiohttp
import os
import pymongo
from pymongo import MongoClient
import uuid

class PremiumEnforcementTester:
    def __init__(self, base_url="https://cricketodo.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
        # MongoDB connection for direct user manipulation
        self.mongo_client = MongoClient("mongodb://localhost:27017")
        self.db = self.mongo_client["test_database"]
        
        # Test user data
        self.test_user_id = None
        self.test_token = None
        self.test_match_id = None

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
            if details:
                print(f"   {details}")
        else:
            print(f"❌ {name}")
            if details:
                print(f"   {details}")
            self.failed_tests.append({"test": name, "details": details})

    def create_test_user(self, is_premium=False):
        """Create a test user directly in database"""
        try:
            user_id = f"test_user_{uuid.uuid4().hex[:12]}"
            user_doc = {
                "user_id": user_id,
                "email": f"test_{user_id}@example.com",
                "name": f"Test User {user_id[:8]}",
                "picture": None,
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
            
            # Insert user
            result = self.db.users.insert_one(user_doc)
            
            # Create JWT token for this user
            import jwt
            from datetime import timedelta, timezone
            
            payload = {
                "sub": user_id,
                "exp": datetime.now(timezone.utc) + timedelta(hours=24)
            }
            
            # Use the same secret key as backend
            secret_key = "your_secret_key_change_in_production_c3db956af1e2b2a"
            token = jwt.encode(payload, secret_key, algorithm="HS256")
            
            print(f"✅ Created test user: {user_id} (Premium: {is_premium})")
            return user_id, token
            
        except Exception as e:
            print(f"❌ Failed to create test user: {str(e)}")
            return None, None

    def create_test_match(self, user_id):
        """Create a test match for the user"""
        try:
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
                "current_time_block": "Morning",
                "available_overs": 6,
                "status": "in_progress",
                "created_at": datetime.utcnow()
            }
            
            result = self.db.matches.insert_one(match_doc)
            print(f"✅ Created test match: {match_id}")
            return match_id
            
        except Exception as e:
            print(f"❌ Failed to create test match: {str(e)}")
            return None

    def update_user_premium_status(self, user_id, is_premium):
        """Update user's premium status in database"""
        try:
            result = self.db.users.update_one(
                {"user_id": user_id},
                {"$set": {"is_premium": is_premium}}
            )
            
            if result.modified_count > 0:
                print(f"✅ Updated user {user_id[:8]} premium status to: {is_premium}")
                return True
            else:
                print(f"❌ Failed to update user premium status")
                return False
                
        except Exception as e:
            print(f"❌ Error updating premium status: {str(e)}")
            return False

    def make_api_request(self, method, endpoint, token=None, data=None):
        """Make API request with proper headers"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        print(f"🔍 Making {method} request to: {url}")
        if token:
            print(f"   Using token: {token[:20]}...")
        if data:
            print(f"   Data: {data}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            
            print(f"   Response: {response.status_code}")
            if response.text:
                print(f"   Body: {response.text[:200]}...")
            
            return response
            
        except requests.exceptions.RequestException as e:
            print(f"❌ API request failed: {str(e)}")
            return None
        except Exception as e:
            print(f"❌ Unexpected error: {str(e)}")
            return None

    def test_ai_recommendation_premium_enforcement(self):
        """Test AI recommendation endpoint premium enforcement"""
        print("\n🤖 Testing AI Recommendation Premium Enforcement...")
        
        # Test 1: Create free user and test AI recommendation (should fail)
        free_user_id, free_token = self.create_test_user(is_premium=False)
        if not free_user_id or not free_token:
            self.log_test("Create Free User for AI Test", False, "Failed to create test user")
            return False
        
        # Create match for free user
        match_id = self.create_test_match(free_user_id)
        if not match_id:
            self.log_test("Create Match for Free User", False, "Failed to create test match")
            return False
        
        # Test AI recommendation with free user (should get 403)
        response = self.make_api_request(
            'POST', 
            'ai/recommend', 
            token=free_token,
            data={"match_id": match_id, "time_available": 30}
        )
        
        if response is not None and response.status_code == 403:
            try:
                error_data = response.json()
                if "Premium membership" in error_data.get("detail", ""):
                    self.log_test("AI Recommendation - Free User Blocked", True, 
                                f"Correctly returned 403 with message: {error_data.get('detail')}")
                else:
                    self.log_test("AI Recommendation - Free User Blocked", False, 
                                f"Got 403 but wrong message: {error_data.get('detail')}")
                    return False
            except:
                self.log_test("AI Recommendation - Free User Blocked", True, "Got 403 status")
        else:
            status = response.status_code if response else "No response"
            self.log_test("AI Recommendation - Free User Blocked", False, 
                        f"Expected 403, got {status}")
            return False
        
        # Test 2: Upgrade user to premium and test again (should work)
        if not self.update_user_premium_status(free_user_id, True):
            self.log_test("Upgrade User to Premium", False, "Failed to update premium status")
            return False
        
        # Test AI recommendation with premium user (should get 200)
        response = self.make_api_request(
            'POST', 
            'ai/recommend', 
            token=free_token,  # Same token, but user is now premium
            data={"match_id": match_id, "time_available": 30}
        )
        
        if response is not None and response.status_code == 200:
            try:
                ai_data = response.json()
                if "task" in ai_data and "category" in ai_data:
                    self.log_test("AI Recommendation - Premium User Allowed", True, 
                                f"Got AI recommendation: {ai_data.get('task', 'N/A')}")
                else:
                    self.log_test("AI Recommendation - Premium User Allowed", False, 
                                "Got 200 but invalid AI response structure")
                    return False
            except:
                self.log_test("AI Recommendation - Premium User Allowed", False, 
                            "Got 200 but invalid JSON response")
                return False
        else:
            status = response.status_code if response else "No response"
            self.log_test("AI Recommendation - Premium User Allowed", False, 
                        f"Expected 200, got {status}")
            return False
        
        # Cleanup
        self.cleanup_test_user(free_user_id)
        return True

    def test_profile_update_premium_enforcement(self):
        """Test profile update endpoint premium enforcement"""
        print("\n👤 Testing Profile Update Premium Enforcement...")
        
        # Test 1: Create free user and test profile update (should fail)
        free_user_id, free_token = self.create_test_user(is_premium=False)
        if not free_user_id or not free_token:
            self.log_test("Create Free User for Profile Test", False, "Failed to create test user")
            return False
        
        # Test profile update with free user (should get 403)
        profile_data = {
            "primary_goal": "Career growth",
            "profession": "Data Scientist",
            "life_stage": "Working Professional",
            "daily_availability": "High",
            "preferred_focus_areas": ["Career", "Finance"]
        }
        
        response = self.make_api_request(
            'PATCH', 
            'profile', 
            token=free_token,
            data=profile_data
        )
        
        if response is not None and response.status_code == 403:
            try:
                error_data = response.json()
                if "Premium membership" in error_data.get("detail", ""):
                    self.log_test("Profile Update - Free User Blocked", True, 
                                f"Correctly returned 403 with message: {error_data.get('detail')}")
                else:
                    self.log_test("Profile Update - Free User Blocked", False, 
                                f"Got 403 but wrong message: {error_data.get('detail')}")
                    return False
            except:
                self.log_test("Profile Update - Free User Blocked", True, "Got 403 status")
        else:
            status = response.status_code if response else "No response"
            self.log_test("Profile Update - Free User Blocked", False, 
                        f"Expected 403, got {status}")
            return False
        
        # Test 2: Upgrade user to premium and test again (should work)
        if not self.update_user_premium_status(free_user_id, True):
            self.log_test("Upgrade User to Premium for Profile", False, "Failed to update premium status")
            return False
        
        # Test profile update with premium user (should get 200)
        response = self.make_api_request(
            'PATCH', 
            'profile', 
            token=free_token,  # Same token, but user is now premium
            data=profile_data
        )
        
        if response is not None and response.status_code == 200:
            try:
                update_data = response.json()
                if "message" in update_data and "profile" in update_data:
                    self.log_test("Profile Update - Premium User Allowed", True, 
                                f"Profile updated successfully: {update_data.get('message')}")
                else:
                    self.log_test("Profile Update - Premium User Allowed", False, 
                                "Got 200 but invalid response structure")
                    return False
            except:
                self.log_test("Profile Update - Premium User Allowed", False, 
                            "Got 200 but invalid JSON response")
                return False
        else:
            status = response.status_code if response else "No response"
            self.log_test("Profile Update - Premium User Allowed", False, 
                        f"Expected 200, got {status}")
            return False
        
        # Cleanup
        self.cleanup_test_user(free_user_id)
        return True

    def test_premium_dependency_function(self):
        """Test the require_premium dependency function behavior"""
        print("\n🔒 Testing Premium Dependency Function...")
        
        # Create premium user
        premium_user_id, premium_token = self.create_test_user(is_premium=True)
        if not premium_user_id or not premium_token:
            self.log_test("Create Premium User", False, "Failed to create premium test user")
            return False
        
        # Test that premium user can access premium endpoints
        response = self.make_api_request('GET', 'profile', token=premium_token)
        
        if response is not None and response.status_code == 200:
            self.log_test("Premium User Access - Profile Endpoint", True, 
                        "Premium user can access profile endpoint")
        else:
            status = response.status_code if response else "No response"
            self.log_test("Premium User Access - Profile Endpoint", False, 
                        f"Premium user got {status} for profile access")
            return False
        
        # Test non-premium endpoints still work for premium users
        response = self.make_api_request('GET', 'wallet/balance', token=premium_token)
        
        if response is not None and response.status_code == 200:
            try:
                wallet_data = response.json()
                is_premium = wallet_data.get('is_premium', False)
                if is_premium:
                    self.log_test("Premium User Status Verification", True, 
                                f"Wallet shows premium status: {is_premium}")
                else:
                    self.log_test("Premium User Status Verification", False, 
                                "Wallet doesn't show premium status")
                    return False
            except:
                self.log_test("Premium User Status Verification", False, 
                            "Invalid wallet response")
                return False
        else:
            status = response.status_code if response else "No response"
            self.log_test("Premium User Status Verification", False, 
                        f"Wallet endpoint returned {status}")
            return False
        
        # Cleanup
        self.cleanup_test_user(premium_user_id)
        return True

    def test_error_messages(self):
        """Test that premium enforcement returns correct error messages"""
        print("\n💬 Testing Premium Error Messages...")
        
        # Create free user
        free_user_id, free_token = self.create_test_user(is_premium=False)
        if not free_user_id or not free_token:
            self.log_test("Create Free User for Error Test", False, "Failed to create test user")
            return False
        
        # Create match for testing
        match_id = self.create_test_match(free_user_id)
        if not match_id:
            self.log_test("Create Match for Error Test", False, "Failed to create test match")
            return False
        
        # Test AI recommendation error message
        response = self.make_api_request(
            'POST', 
            'ai/recommend', 
            token=free_token,
            data={"match_id": match_id, "time_available": 30}
        )
        
        expected_message = "This feature requires Premium membership"
        if response is not None and response.status_code == 403:
            try:
                error_data = response.json()
                detail = error_data.get("detail", "")
                if expected_message in detail:
                    self.log_test("AI Recommendation Error Message", True, 
                                f"Correct error message: {detail}")
                else:
                    self.log_test("AI Recommendation Error Message", False, 
                                f"Wrong error message: {detail}")
                    return False
            except:
                self.log_test("AI Recommendation Error Message", False, 
                            "Invalid JSON in error response")
                return False
        else:
            status = response.status_code if response else "No response"
            self.log_test("AI Recommendation Error Message", False, 
                        f"Expected 403, got {status}")
            return False
        
        # Test profile update error message
        response = self.make_api_request(
            'PATCH', 
            'profile', 
            token=free_token,
            data={"primary_goal": "Health"}
        )
        
        if response is not None and response.status_code == 403:
            try:
                error_data = response.json()
                detail = error_data.get("detail", "")
                if expected_message in detail:
                    self.log_test("Profile Update Error Message", True, 
                                f"Correct error message: {detail}")
                else:
                    self.log_test("Profile Update Error Message", False, 
                                f"Wrong error message: {detail}")
                    return False
            except:
                self.log_test("Profile Update Error Message", False, 
                            "Invalid JSON in error response")
                return False
        else:
            status = response.status_code if response else "No response"
            self.log_test("Profile Update Error Message", False, 
                        f"Expected 403, got {status}")
            return False
        
        # Cleanup
        self.cleanup_test_user(free_user_id)
        return True

    def test_connectivity(self):
        """Test basic connectivity to the backend"""
        print("\n🌐 Testing Backend Connectivity...")
        
        # Test the location endpoint which doesn't require auth
        response = self.make_api_request('GET', 'users/location')
        
        if response is not None and response.status_code == 200:
            try:
                data = response.json()
                self.log_test("Backend Connectivity", True, 
                            f"Connected successfully. Detected country: {data.get('country')}")
                return True
            except:
                self.log_test("Backend Connectivity", False, "Got 200 but invalid JSON")
                return False
        else:
            status = response.status_code if response else "No response"
            self.log_test("Backend Connectivity", False, f"Got status: {status}")
            return False
        """Clean up test user and related data"""
        try:
            # Delete user's matches
            self.db.matches.delete_many({"user_id": user_id})
            
            # Delete user's tasks
            self.db.tasks.delete_many({"user_id": user_id})
            
            # Delete user
            self.db.users.delete_one({"user_id": user_id})
            
            print(f"✅ Cleaned up test user: {user_id[:8]}")
            
        except Exception as e:
            print(f"⚠️  Failed to cleanup user {user_id[:8]}: {str(e)}")

    def run_all_tests(self):
        """Run all premium enforcement tests"""
        print("🔐 Starting Premium Enforcement Testing...")
        print("=" * 60)
        
        # Test 0: Basic connectivity
        if not self.test_connectivity():
            print("❌ Backend connectivity failed. Aborting tests.")
            return False
        
        all_tests_passed = True
        
        # Test 1: AI Recommendation Premium Enforcement
        if not self.test_ai_recommendation_premium_enforcement():
            all_tests_passed = False
        
        # Test 2: Profile Update Premium Enforcement
        if not self.test_profile_update_premium_enforcement():
            all_tests_passed = False
        
        # Test 3: Premium Dependency Function
        if not self.test_premium_dependency_function():
            all_tests_passed = False
        
        # Test 4: Error Messages
        if not self.test_error_messages():
            all_tests_passed = False
        
        # Print results
        print("\n" + "=" * 60)
        print("📊 PREMIUM ENFORCEMENT TEST RESULTS")
        print("=" * 60)
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {len(self.failed_tests)}")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for failure in self.failed_tests:
                print(f"   - {failure['test']}: {failure['details']}")
        
        print("\n" + "=" * 60)
        print("🎯 FINAL ASSESSMENT")
        print("=" * 60)
        
        if all_tests_passed and len(self.failed_tests) == 0:
            print("✅ ALL PREMIUM ENFORCEMENT TESTS PASSED")
            print("✅ Free users are correctly blocked from premium features")
            print("✅ Premium users can access all premium features")
            print("✅ Error messages are correct and informative")
            print("\n🎉 Premium enforcement is working correctly!")
            return True
        else:
            print("❌ SOME PREMIUM ENFORCEMENT TESTS FAILED")
            print("❌ Premium feature gating may not be working correctly")
            return False

def main():
    """Main test execution"""
    tester = PremiumEnforcementTester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
        
    except Exception as e:
        print(f"❌ Test execution failed: {str(e)}")
        return 1
    
    finally:
        # Close MongoDB connection
        if hasattr(tester, 'mongo_client'):
            tester.mongo_client.close()

if __name__ == "__main__":
    sys.exit(main())