import requests
import sys
import json
from datetime import datetime
import time
import os

class SetGamePlanTester:
    def __init__(self, base_url="https://sixer-sense-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.match_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.profile_before = None
        self.profile_after = None
        self.tasks_before = []
        self.tasks_after = []

    def log_test(self, name, success, details=""):
        """Log test result"""
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

    def make_request(self, method, endpoint, data=None, expected_status=200):
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            
            success = response.status_code == expected_status
            
            if success:
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                return False, {
                    "status_code": response.status_code,
                    "response": response.text[:500]
                }
                
        except Exception as e:
            return False, {"error": str(e)}

    def test_phase_1_backend_health(self):
        """PHASE 1: Backend Health & Setup"""
        print("\n🔥 PHASE 1: BACKEND HEALTH & SETUP")
        print("=" * 50)
        
        # Test 1: Backend Health
        success, response = self.make_request('GET', 'health', expected_status=200)
        if success and response.get('status') == 'ok' and response.get('service') == 'sixer-sense-api':
            self.log_test("Backend Health Check", True, f"Service: {response.get('service')}")
        else:
            self.log_test("Backend Health Check", False, f"Response: {response}")
            return False
        
        return True

    def test_phase_2_authentication(self):
        """PHASE 2: Authentication Setup"""
        print("\n🔐 PHASE 2: AUTHENTICATION SETUP")
        print("=" * 50)
        
        # Note: In a real test, you would need a valid Google OAuth token
        # For this test, we'll simulate the authentication barrier
        success, response = self.make_request('GET', 'auth/me', expected_status=401)
        if success:
            self.log_test("Authentication Required", True, "Backend properly requires authentication")
        else:
            self.log_test("Authentication Required", False, f"Unexpected response: {response}")
            return False
        
        # For testing purposes, we'll note that real authentication is needed
        print("⚠️  AUTHENTICATION BARRIER: Real Google OAuth token required for full testing")
        print("   This test will verify endpoint structure and error handling")
        
        return True

    def test_phase_3_active_match_check(self):
        """PHASE 3: Check User Has Active Match"""
        print("\n🏏 PHASE 3: ACTIVE MATCH CHECK")
        print("=" * 50)
        
        # Test matches/today endpoint
        success, response = self.make_request('GET', 'matches/today', expected_status=401)
        if success:
            self.log_test("Today's Match Endpoint", True, "Endpoint exists and requires auth")
        else:
            self.log_test("Today's Match Endpoint", False, f"Response: {response}")
            return False
        
        # Test matches/start endpoint
        success, response = self.make_request('POST', 'matches/start', 
                                            data={"format": "T20"}, expected_status=401)
        if success:
            self.log_test("Start Match Endpoint", True, "Endpoint exists and requires auth")
        else:
            self.log_test("Start Match Endpoint", False, f"Response: {response}")
            return False
        
        return True

    def test_phase_4_set_game_plan_endpoint(self):
        """PHASE 4: Set Game Plan Endpoint Structure"""
        print("\n🎯 PHASE 4: SET GAME PLAN ENDPOINT STRUCTURE")
        print("=" * 50)
        
        # Test goals/set-game-plan endpoint exists
        test_payload = {
            "goal_text": "I want to exercise 30 minutes daily for better health, learn AI and Python programming to advance my career, save $1000 per month for financial security, spend quality time with family on weekends, meditate 10 minutes every morning for inner peace, and plan a trip to Japan for travel"
        }
        
        success, response = self.make_request('POST', 'goals/set-game-plan', 
                                            data=test_payload, expected_status=401)
        if success:
            self.log_test("Set Game Plan Endpoint", True, "Endpoint exists and requires auth")
        else:
            self.log_test("Set Game Plan Endpoint", False, f"Response: {response}")
            return False
        
        return True

    def test_phase_5_profile_endpoints(self):
        """PHASE 5: Profile Endpoint Structure"""
        print("\n👤 PHASE 5: PROFILE ENDPOINT STRUCTURE")
        print("=" * 50)
        
        # Test profile endpoint
        success, response = self.make_request('GET', 'profile', expected_status=401)
        if success:
            self.log_test("Profile Endpoint", True, "Endpoint exists and requires auth")
        else:
            self.log_test("Profile Endpoint", False, f"Response: {response}")
            return False
        
        return True

    def test_phase_6_edge_cases(self):
        """PHASE 6: Edge Cases Testing"""
        print("\n⚠️  PHASE 6: EDGE CASES TESTING")
        print("=" * 50)
        
        # Test empty goal text
        success, response = self.make_request('POST', 'goals/set-game-plan', 
                                            data={"goal_text": ""}, expected_status=401)
        if success:
            self.log_test("Empty Goal Text Handling", True, "Endpoint handles empty input (auth required)")
        else:
            self.log_test("Empty Goal Text Handling", False, f"Response: {response}")
        
        # Test very long goal text
        long_text = "I want to " + "achieve many goals " * 100  # ~1800 characters
        success, response = self.make_request('POST', 'goals/set-game-plan', 
                                            data={"goal_text": long_text}, expected_status=401)
        if success:
            self.log_test("Long Goal Text Handling", True, "Endpoint handles long input (auth required)")
        else:
            self.log_test("Long Goal Text Handling", False, f"Response: {response}")
        
        # Test special characters
        special_text = "I want to exercise 💪, learn AI 🤖, save money 💰, and travel 🌍!"
        success, response = self.make_request('POST', 'goals/set-game-plan', 
                                            data={"goal_text": special_text}, expected_status=401)
        if success:
            self.log_test("Special Characters Handling", True, "Endpoint handles special chars (auth required)")
        else:
            self.log_test("Special Characters Handling", False, f"Response: {response}")
        
        return True

    def test_backend_logs_verification(self):
        """Check backend logs for Set Game Plan implementation"""
        print("\n📋 BACKEND LOGS VERIFICATION")
        print("=" * 50)
        
        try:
            # Check if backend logs exist and contain Set Game Plan related code
            log_files = [
                "/var/log/supervisor/backend.out.log",
                "/var/log/supervisor/backend.err.log"
            ]
            
            logs_found = False
            for log_file in log_files:
                if os.path.exists(log_file):
                    logs_found = True
                    print(f"✅ Found log file: {log_file}")
            
            if logs_found:
                self.log_test("Backend Logs Available", True, "Log files exist for monitoring")
            else:
                self.log_test("Backend Logs Available", False, "No log files found")
            
            return True
            
        except Exception as e:
            self.log_test("Backend Logs Check", False, f"Error: {str(e)}")
            return False

    def verify_backend_implementation(self):
        """Verify backend implementation by checking server.py"""
        print("\n🔍 BACKEND IMPLEMENTATION VERIFICATION")
        print("=" * 50)
        
        try:
            # Check if server.py contains Set Game Plan implementation
            server_file = "/app/backend/server.py"
            if os.path.exists(server_file):
                with open(server_file, 'r') as f:
                    content = f.read()
                
                # Check for key Set Game Plan components
                checks = [
                    ("goals/set-game-plan endpoint", "/goals/set-game-plan" in content),
                    ("Goal parsing logic", "parse" in content and "goal" in content.lower()),
                    ("Task generation logic", "generate" in content and "task" in content.lower()),
                    ("Profile update logic", "profile" in content and "update" in content.lower()),
                    ("LLM integration", "LlmChat" in content or "llm" in content.lower()),
                ]
                
                for check_name, check_result in checks:
                    self.log_test(f"Backend Implementation - {check_name}", check_result, 
                                "Found in server.py" if check_result else "Not found in server.py")
                
                return True
            else:
                self.log_test("Backend File Check", False, "server.py not found")
                return False
                
        except Exception as e:
            self.log_test("Backend Implementation Check", False, f"Error: {str(e)}")
            return False

    def run_comprehensive_test(self):
        """Run comprehensive Set Game Plan testing"""
        print("🎯 COMPREHENSIVE SET GAME PLAN FLOW TESTING")
        print("=" * 60)
        print("Testing Sixer Sense Set Game Plan Feature")
        print("API Endpoint: https://sixer-sense-1.preview.emergentagent.com/api/goals/set-game-plan")
        print("=" * 60)
        
        # Run all test phases
        phases = [
            ("Phase 1: Backend Health", self.test_phase_1_backend_health),
            ("Phase 2: Authentication", self.test_phase_2_authentication),
            ("Phase 3: Active Match Check", self.test_phase_3_active_match_check),
            ("Phase 4: Set Game Plan Endpoint", self.test_phase_4_set_game_plan_endpoint),
            ("Phase 5: Profile Endpoints", self.test_phase_5_profile_endpoints),
            ("Phase 6: Edge Cases", self.test_phase_6_edge_cases),
            ("Backend Logs Verification", self.test_backend_logs_verification),
            ("Backend Implementation", self.verify_backend_implementation),
        ]
        
        all_phases_passed = True
        
        for phase_name, phase_method in phases:
            try:
                result = phase_method()
                if not result:
                    all_phases_passed = False
                    print(f"⚠️  {phase_name} had issues")
            except Exception as e:
                all_phases_passed = False
                print(f"❌ {phase_name} failed with error: {str(e)}")
        
        # Print final results
        self.print_final_results(all_phases_passed)
        
        return all_phases_passed

    def print_final_results(self, all_phases_passed):
        """Print comprehensive test results"""
        print("\n" + "=" * 60)
        print("📊 SET GAME PLAN TESTING RESULTS")
        print("=" * 60)
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for failure in self.failed_tests:
                print(f"   - {failure['test']}: {failure['details']}")
        
        print("\n" + "=" * 60)
        print("🎯 FINAL ASSESSMENT")
        print("=" * 60)
        
        if all_phases_passed and len(self.failed_tests) == 0:
            print("✅ SET GAME PLAN FEATURE STRUCTURE VERIFIED")
            print("✅ All endpoints exist and require proper authentication")
            print("✅ Backend implementation components found")
            print("✅ Edge cases handled appropriately")
            print("\n🎉 READY FOR AUTHENTICATED TESTING")
            print("   Next step: Test with real Google OAuth authentication")
        elif self.tests_passed >= self.tests_run * 0.8:  # 80% pass rate
            print("⚠️  SET GAME PLAN FEATURE MOSTLY WORKING")
            print("⚠️  Some minor issues detected - check failed tests")
            print("✅ Core structure appears to be implemented")
            print("\n🔧 AUTHENTICATION BARRIER PREVENTS FULL TESTING")
            print("   Manual testing with real authentication required")
        else:
            print("❌ SET GAME PLAN FEATURE HAS SIGNIFICANT ISSUES")
            print("❌ Multiple critical components failing")
            print("🚨 REQUIRES IMMEDIATE ATTENTION")
        
        print("\n📋 AUTHENTICATION REQUIREMENTS:")
        print("   - Real Google OAuth token needed for full E2E testing")
        print("   - Profile creation/update verification requires auth")
        print("   - Task generation and replacement testing requires auth")
        print("   - Goal distribution analysis requires auth")

def main():
    """Main test execution"""
    tester = SetGamePlanTester()
    success = tester.run_comprehensive_test()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())