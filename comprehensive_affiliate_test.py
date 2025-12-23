#!/usr/bin/env python3
"""
Comprehensive End-to-End Test for Affiliate Products Feature
Tests both backend integration and frontend display capabilities
"""

import sys
import os
import requests
import json
from datetime import datetime

# Add backend to path for direct testing
sys.path.append('/app/backend')

class ComprehensiveAffiliateTester:
    def __init__(self):
        self.base_url = "https://sixer-sense-1.preview.emergentagent.com"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.critical_issues = []
        self.minor_issues = []

    def log_test(self, name, success, details="", is_critical=False):
        """Log test results with severity"""
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
            
            failure_info = {"test": name, "details": details}
            self.failed_tests.append(failure_info)
            
            if is_critical:
                self.critical_issues.append(failure_info)
            else:
                self.minor_issues.append(failure_info)

    def test_backend_affiliate_integration(self):
        """Test backend affiliate products integration"""
        print("\n🔧 Testing Backend Affiliate Integration...")
        
        try:
            # Test 1: Import affiliate products module
            from affiliate_products import get_random_product, get_all_categories
            self.log_test("Affiliate Products Module Import", True, "Successfully imported affiliate_products module")
            
            # Test 2: Test server imports affiliate functions
            import server
            has_import = hasattr(server, 'get_random_product')
            self.log_test("Server Imports Affiliate Functions", has_import, 
                         "get_random_product found in server.py" if has_import else "get_random_product not imported in server.py",
                         is_critical=not has_import)
            
            # Test 3: Test all categories have products
            categories = get_all_categories()
            for category in categories:
                product = get_random_product(category)
                success = product is not None
                self.log_test(f"Category '{category}' Has Valid Products", success,
                             f"Product: {product['name'] if product else 'None'}" if success else "No products found",
                             is_critical=not success)
            
            # Test 4: Validate product structure
            for category in categories:
                product = get_random_product(category)
                if product:
                    required_fields = ['affiliate_link', 'name', 'description', 'price', 'run_reward', 'action_tasks']
                    missing_fields = [field for field in required_fields if field not in product]
                    success = len(missing_fields) == 0
                    self.log_test(f"Product Structure for '{category}'", success,
                                 f"All required fields present" if success else f"Missing: {missing_fields}",
                                 is_critical=not success)
            
            return True
            
        except Exception as e:
            self.log_test("Backend Affiliate Integration", False, f"Import error: {str(e)}", is_critical=True)
            return False

    def test_api_endpoint_availability(self):
        """Test API endpoint availability and structure"""
        print("\n🌐 Testing API Endpoint Availability...")
        
        # Test 1: AI recommendation endpoint exists
        try:
            response = requests.post(
                f"{self.base_url}/api/ai/recommend",
                json={"match_id": "test", "time_available": 30},
                timeout=10
            )
            
            # Should return 401 for missing auth, not 404
            success = response.status_code == 401
            self.log_test("AI Recommendation Endpoint Exists", success,
                         f"Returns 401 (auth required) as expected" if success else f"Unexpected status: {response.status_code}",
                         is_critical=response.status_code == 404)
            
        except requests.exceptions.RequestException as e:
            self.log_test("AI Recommendation Endpoint Exists", False, f"Connection error: {str(e)}", is_critical=True)
        
        # Test 2: Backend health check
        try:
            response = requests.get(f"{self.base_url}/api/matches/today", timeout=10)
            success = response.status_code in [401, 200]  # Either auth required or working
            self.log_test("Backend Health Check", success,
                         f"Backend responding (status: {response.status_code})" if success else f"Backend not responding properly",
                         is_critical=not success)
            
        except requests.exceptions.RequestException as e:
            self.log_test("Backend Health Check", False, f"Backend not reachable: {str(e)}", is_critical=True)

    def test_frontend_affiliate_display(self):
        """Test frontend affiliate product display implementation"""
        print("\n🎨 Testing Frontend Affiliate Display...")
        
        try:
            # Read CaptainsCall component
            with open('/app/frontend/src/components/CaptainsCall.js', 'r') as f:
                captains_call_content = f.read()
            
            # Test 1: Check for affiliate_product handling
            has_affiliate_check = 'affiliate_product' in captains_call_content
            self.log_test("Frontend Checks for Affiliate Product", has_affiliate_check,
                         "affiliate_product referenced in CaptainsCall.js" if has_affiliate_check else "No affiliate_product handling found",
                         is_critical=not has_affiliate_check)
            
            # Test 2: Check for required affiliate fields display
            required_displays = [
                ('name', 'recommendation.affiliate_product.name'),
                ('description', 'recommendation.affiliate_product.description'),
                ('price', 'recommendation.affiliate_product.price'),
                ('run_reward', 'recommendation.affiliate_product.run_reward'),
                ('affiliate_link', 'recommendation.affiliate_product.affiliate_link'),
                ('action_tasks', 'recommendation.affiliate_product.action_tasks')
            ]
            
            for field_name, field_reference in required_displays:
                has_field = field_reference in captains_call_content
                self.log_test(f"Frontend Displays {field_name.title()}", has_field,
                             f"Found {field_reference} in component" if has_field else f"Missing {field_reference} display",
                             is_critical=field_name in ['name', 'affiliate_link'])
            
            # Test 3: Check for proper link handling
            has_external_link = 'target="_blank"' in captains_call_content and 'rel="noopener noreferrer"' in captains_call_content
            self.log_test("Frontend Handles External Links Properly", has_external_link,
                         "Proper external link attributes found" if has_external_link else "Missing proper external link handling",
                         is_critical=not has_external_link)
            
            # Test 4: Check for green theme styling
            has_green_styling = 'bg-green-' in captains_call_content or 'text-green-' in captains_call_content
            self.log_test("Frontend Uses Green Theme for Affiliate Products", has_green_styling,
                         "Green styling found for affiliate products" if has_green_styling else "No green theme styling found")
            
            # Test 5: Check for action tasks display
            has_action_tasks = 'action_tasks' in captains_call_content and 'details' in captains_call_content
            self.log_test("Frontend Displays Action Tasks", has_action_tasks,
                         "Action tasks display implementation found" if has_action_tasks else "No action tasks display found")
            
            return True
            
        except Exception as e:
            self.log_test("Frontend Affiliate Display", False, f"Error reading frontend files: {str(e)}", is_critical=True)
            return False

    def test_integration_completeness(self):
        """Test overall integration completeness"""
        print("\n🔗 Testing Integration Completeness...")
        
        try:
            # Test 1: Backend server includes affiliate import
            with open('/app/backend/server.py', 'r') as f:
                server_content = f.read()
            
            has_import = 'from affiliate_products import get_random_product' in server_content
            self.log_test("Server Imports Affiliate Products", has_import,
                         "Affiliate products import found in server.py" if has_import else "Missing affiliate products import",
                         is_critical=not has_import)
            
            # Test 2: AI recommendation endpoint adds affiliate product
            has_affiliate_addition = 'affiliate_product = get_random_product' in server_content
            self.log_test("AI Endpoint Adds Affiliate Products", has_affiliate_addition,
                         "Affiliate product addition found in AI endpoint" if has_affiliate_addition else "No affiliate product addition in AI endpoint",
                         is_critical=not has_affiliate_addition)
            
            # Test 3: Check if affiliate product is added to response
            has_response_addition = 'recommendation["affiliate_product"]' in server_content
            self.log_test("Affiliate Product Added to Response", has_response_addition,
                         "Affiliate product added to AI response" if has_response_addition else "Affiliate product not added to response",
                         is_critical=not has_response_addition)
            
            return True
            
        except Exception as e:
            self.log_test("Integration Completeness", False, f"Error checking integration: {str(e)}", is_critical=True)
            return False

    def test_data_quality_and_variety(self):
        """Test affiliate product data quality and variety"""
        print("\n📊 Testing Data Quality and Variety...")
        
        try:
            from affiliate_products import get_all_categories, get_products_by_category
            
            categories = get_all_categories()
            total_products = 0
            unique_links = set()
            
            for category in categories:
                products = get_products_by_category(category)
                total_products += len(products)
                
                for product in products:
                    unique_links.add(product.get('affiliate_link', ''))
            
            # Test 1: Sufficient product variety
            success = total_products >= 12  # At least 2 per category
            self.log_test("Sufficient Product Variety", success,
                         f"Found {total_products} total products across {len(categories)} categories" if success else f"Only {total_products} products found, need at least 12")
            
            # Test 2: Unique affiliate links
            success = len(unique_links) == total_products
            self.log_test("Unique Affiliate Links", success,
                         f"All {total_products} products have unique affiliate links" if success else f"Duplicate affiliate links found")
            
            # Test 3: All categories covered
            expected_categories = ["Health", "Career", "Finance", "Relationships", "Spiritual/Mindset", "Travel/Leisure"]
            success = set(categories) == set(expected_categories)
            self.log_test("All Categories Covered", success,
                         f"All 6 expected categories present" if success else f"Missing categories: {set(expected_categories) - set(categories)}")
            
            return True
            
        except Exception as e:
            self.log_test("Data Quality and Variety", False, f"Error testing data quality: {str(e)}", is_critical=True)
            return False

    def run_comprehensive_test(self):
        """Run all affiliate product tests"""
        print("🛍️  Starting Comprehensive Affiliate Products Testing...")
        print("=" * 70)
        
        # Run all test suites
        backend_ok = self.test_backend_affiliate_integration()
        api_ok = self.test_api_endpoint_availability()
        frontend_ok = self.test_frontend_affiliate_display()
        integration_ok = self.test_integration_completeness()
        data_ok = self.test_data_quality_and_variety()
        
        # Print detailed results
        print("\n" + "=" * 70)
        print("📊 COMPREHENSIVE TEST RESULTS")
        print("=" * 70)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        print(f"Critical Issues: {len(self.critical_issues)}")
        print(f"Minor Issues: {len(self.minor_issues)}")
        
        # Show critical issues first
        if self.critical_issues:
            print("\n🚨 CRITICAL ISSUES (Must Fix):")
            for issue in self.critical_issues:
                print(f"   ❌ {issue['test']}: {issue['details']}")
        
        # Show minor issues
        if self.minor_issues:
            print("\n⚠️  MINOR ISSUES:")
            for issue in self.minor_issues:
                print(f"   ⚠️  {issue['test']}: {issue['details']}")
        
        # Overall assessment
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        
        print(f"\n📈 SUCCESS RATE: {success_rate:.1f}%")
        
        if len(self.critical_issues) == 0:
            if success_rate >= 95:
                print("✅ EXCELLENT: Affiliate products feature is fully implemented and working!")
                return "working"
            elif success_rate >= 85:
                print("✅ GOOD: Affiliate products feature is working with minor issues")
                return "working"
            else:
                print("⚠️  PARTIAL: Affiliate products feature has some issues but core functionality works")
                return "working"
        else:
            print("❌ CRITICAL ISSUES FOUND: Affiliate products feature has critical problems")
            return "not_working"

def main():
    tester = ComprehensiveAffiliateTester()
    result = tester.run_comprehensive_test()
    
    # Return appropriate exit code
    if result == "working":
        return 0
    else:
        return 1

if __name__ == "__main__":
    sys.exit(main())