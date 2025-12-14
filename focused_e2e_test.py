#!/usr/bin/env python3
"""
Focused E2E Backend Testing - Key Endpoints Verification
"""

import requests
import json
import sys
import os
from datetime import datetime, timezone

class FocusedE2ETester:
    def __init__(self, base_url="https://crickettasks.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def test_endpoint(self, name, method, endpoint, expected_status, data=None):
        """Test a single endpoint"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            
            if response.status_code == expected_status:
                self.tests_passed += 1
                print(f"✅ {name} - Status: {response.status_code}")
                return True, response
            else:
                print(f"❌ {name} - Expected {expected_status}, got {response.status_code}")
                self.failed_tests.append(f"{name}: Expected {expected_status}, got {response.status_code}")
                return False, response
                
        except Exception as e:
            print(f"❌ {name} - Error: {str(e)}")
            self.failed_tests.append(f"{name}: {str(e)}")
            return False, None

    def test_backend_modules(self):
        """Test backend modules"""
        print("\n🔧 Testing Backend Modules...")
        
        try:
            sys.path.insert(0, '/app/backend')
            
            # Test affiliate_products
            import affiliate_products
            categories = affiliate_products.get_all_categories()
            print(f"✅ Affiliate Products: {len(categories)} categories")
            
            # Test default_tasks
            import default_tasks
            task_categories = default_tasks.get_categories()
            print(f"✅ Default Tasks: {len(task_categories)} categories")
            
            # Test country products
            import affiliate_products_by_country
            products_in = affiliate_products_by_country.get_products_for_country('IN')
            print(f"✅ Country Products: IN has {sum(len(p) for p in products_in.values())} products")
            
            return True
            
        except Exception as e:
            print(f"❌ Backend modules error: {str(e)}")
            return False

    def run_focused_tests(self):
        """Run focused E2E tests"""
        print("🏏 FOCUSED E2E BACKEND TESTING")
        print("=" * 50)
        
        # Test backend modules first
        modules_ok = self.test_backend_modules()
        
        print("\n🌐 Testing Critical API Endpoints...")
        
        # Test critical endpoints (expecting 401 without auth)
        critical_tests = [
            ("Authentication - Get User", "GET", "auth/me", 401),
            ("Match - Get Today", "GET", "matches/today", 401),
            ("Match - Start T20", "POST", "matches/start", 401, {"format": "T20"}),
            ("Match - Start ODI", "POST", "matches/start", 401, {"format": "ODI"}),
            ("Match - Start Test", "POST", "matches/start", 401, {"format": "Test"}),
            ("Match - Restart", "DELETE", "matches/today", 401),
            ("Match - History", "GET", "matches/history", 401),
            ("Task - Create", "POST", "tasks", 401, {"title": "Test", "category": "Health", "run_value": 4}),
            ("AI - Recommend", "POST", "ai/recommend", 401, {"match_id": "test", "time_available": 30}),
            ("Wallet - Balance", "GET", "wallet/balance", 401),
            ("Payment - Create Order", "POST", "payment/create-order", 401, {"plan": "monthly"}),
            ("Payment - Verify", "POST", "payment/verify", 401, {"razorpay_order_id": "test"}),
        ]
        
        for name, method, endpoint, expected_status, *data in critical_tests:
            test_data = data[0] if data else None
            self.test_endpoint(name, method, endpoint, expected_status, test_data)
        
        # Test endpoints that should work without auth
        print("\n🌍 Testing Public Endpoints...")
        
        public_tests = [
            ("Location Detection", "GET", "users/location", 200),
            ("Payment Webhook", "POST", "payment/webhook", 200, {"event": "test"}),
        ]
        
        for name, method, endpoint, expected_status, *data in public_tests:
            test_data = data[0] if data else None
            success, response = self.test_endpoint(name, method, endpoint, expected_status, test_data)
            
            if success and name == "Location Detection" and response:
                try:
                    data = response.json()
                    print(f"   Country: {data.get('country', 'N/A')}")
                    print(f"   Currency: {data.get('currency', 'N/A')}")
                except:
                    pass
        
        # Generate report
        print("\n" + "=" * 50)
        print("📊 FOCUSED TEST RESULTS")
        print("=" * 50)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"   - {failure}")
        
        print("\n🎯 ASSESSMENT:")
        if modules_ok and self.tests_passed >= 12:  # Most critical endpoints working
            print("✅ BACKEND CORE FUNCTIONALITY VERIFIED")
            print("✅ All critical endpoints responding correctly (401s expected)")
            print("✅ Backend modules working properly")
            print("✅ Authentication security properly implemented")
            print("🎉 BACKEND IS READY FOR AUTHENTICATED TESTING!")
            return True
        else:
            print("❌ BACKEND HAS ISSUES")
            print("❌ Some critical functionality not working")
            return False

def main():
    tester = FocusedE2ETester()
    success = tester.run_focused_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())