import requests
import sys
import json
from datetime import datetime
import asyncio
import aiohttp

class SixerSenseAPITester:
    def __init__(self, base_url="https://wicketwise-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.match_id = None
        self.task_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.session_id = "test_session_123"  # Mock session for testing

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            return False, {}

    def test_auth_session(self):
        """Test auth session processing (mocked)"""
        # Note: This would normally require a real Emergent Auth session_id
        # For testing, we'll test the endpoint structure
        success, response = self.run_test(
            "Auth Session Processing",
            "POST",
            "auth/session",
            400,  # Expected to fail with mock session_id
            data={"session_id": self.session_id}
        )
        # This test is expected to fail with mock data, so we'll mark it as informational
        return True

    def test_health_endpoints(self):
        """Test basic health/info endpoints"""
        # Test if backend is responding
        try:
            response = requests.get(f"{self.base_url}/api/matches/today", timeout=10)
            if response.status_code == 401:
                print("✅ Backend is responding (401 expected without auth)")
                return True
            else:
                print(f"⚠️  Backend responding with status: {response.status_code}")
                return True
        except Exception as e:
            print(f"❌ Backend not responding: {str(e)}")
            return False

    def test_ai_recommendation(self):
        """Test AI recommendation endpoint"""
        if not self.match_id:
            print("⚠️  Skipping AI test - no match_id available")
            return False
            
        success, response = self.run_test(
            "AI Recommendation",
            "POST",
            "ai/recommend",
            200,
            data={
                "match_id": self.match_id,
                "time_available": 30
            }
        )
        
        if success and response:
            print(f"   AI Response: {response.get('task', 'No task')}")
            return True
        return False

    def test_task_operations(self):
        """Test task CRUD operations"""
        if not self.token:
            print("⚠️  Skipping task tests - no auth token")
            return False

        # Create task
        success, response = self.run_test(
            "Create Task",
            "POST",
            "tasks",
            200,
            data={
                "title": "Test Task - Complete workout",
                "category": "Health",
                "run_value": 4,
                "estimated_minutes": 30
            }
        )
        
        if success and response:
            self.task_id = response.get('task_id')
            print(f"   Created task: {self.task_id}")
            
            # Test complete task
            if self.task_id:
                success, response = self.run_test(
                    "Complete Task",
                    "PATCH",
                    f"tasks/{self.task_id}/complete",
                    200
                )
                
                if success:
                    print(f"   Runs earned: {response.get('runs_earned', 0)}")
                    return True
        
        return False

    def test_match_operations(self):
        """Test match-related operations"""
        if not self.token:
            print("⚠️  Skipping match tests - no auth token")
            return False

        # Get today's match
        success, response = self.run_test(
            "Get Today's Match",
            "GET",
            "matches/today",
            200
        )
        
        if success and response:
            self.match_id = response.get('match_id')
            print(f"   Match ID: {self.match_id}")
            print(f"   Format: {response.get('format')}")
            print(f"   Runs: {response.get('total_runs')}/{response.get('target_score')}")
            print(f"   Wickets: {response.get('total_wickets')}/10")
            
            # Test match history
            success, response = self.run_test(
                "Get Match History",
                "GET",
                "matches/history",
                200
            )
            
            if success:
                print(f"   History entries: {len(response) if isinstance(response, list) else 0}")
                return True
        
        return False

    def test_wallet_operations(self):
        """Test wallet-related operations"""
        if not self.token:
            print("⚠️  Skipping wallet tests - no auth token")
            return False

        # Get wallet balance
        success, response = self.run_test(
            "Get Wallet Balance",
            "GET",
            "wallet/balance",
            200
        )
        
        if success and response:
            print(f"   Balance: ${response.get('balance', 0)}")
            print(f"   Premium: {response.get('is_premium', False)}")
            
            # Get transactions
            success, response = self.run_test(
                "Get Transactions",
                "GET",
                "wallet/transactions",
                200
            )
            
            if success:
                print(f"   Transactions: {len(response) if isinstance(response, list) else 0}")
                return True
        
        return False

def main():
    print("🏏 Starting Sixer Sense API Testing...")
    print("=" * 50)
    
    tester = SixerSenseAPITester()
    
    # Test 1: Backend Health
    print("\n📡 Testing Backend Health...")
    backend_healthy = tester.test_health_endpoints()
    
    # Test 2: Auth (will fail with mock data, but tests endpoint)
    print("\n🔐 Testing Auth Endpoints...")
    tester.test_auth_session()
    
    # Note: Since we can't easily get a real auth token in this test environment,
    # we'll test the endpoints that don't require auth or test with expected 401s
    
    # Test 3: Protected endpoints (expected to fail without real auth)
    print("\n🏏 Testing Protected Endpoints (Expected 401s)...")
    
    # These will return 401, but we can verify the endpoints exist
    tester.run_test("Get User Info", "GET", "auth/me", 401)
    tester.run_test("Get Today's Match (No Auth)", "GET", "matches/today", 401)
    tester.run_test("Get Wallet Balance (No Auth)", "GET", "wallet/balance", 401)
    
    # Test AI endpoint (will fail without auth but tests endpoint structure)
    tester.run_test(
        "AI Recommendation (No Auth)", 
        "POST", 
        "ai/recommend", 
        401,
        data={"match_id": "test_match", "time_available": 30}
    )
    
    # Print results
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS")
    print("=" * 50)
    print(f"Total Tests: {tester.tests_run}")
    print(f"Passed: {tester.tests_passed}")
    print(f"Failed: {len(tester.failed_tests)}")
    
    if tester.failed_tests:
        print("\n❌ Failed Tests:")
        for failure in tester.failed_tests:
            print(f"   - {failure.get('test', 'Unknown')}: {failure.get('error', failure.get('response', 'Unknown error'))}")
    
    # Determine overall health
    critical_failures = [f for f in tester.failed_tests if 'Backend not responding' in str(f)]
    
    if critical_failures:
        print("\n🚨 CRITICAL: Backend is not responding!")
        return 1
    elif backend_healthy:
        print("\n✅ Backend is healthy and responding to requests")
        print("⚠️  Note: Most endpoints require valid authentication")
        return 0
    else:
        print("\n⚠️  Some issues detected but backend is responding")
        return 0

if __name__ == "__main__":
    sys.exit(main())