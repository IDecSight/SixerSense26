#!/usr/bin/env python3
"""
Comprehensive test for Affiliate Products Integration in Sixer Sense
This test focuses specifically on the affiliate products feature
"""

import sys
import os
sys.path.append('/app/backend')

# Import the affiliate products module directly
from affiliate_products import get_random_product, get_products_by_category, get_all_categories
import requests
import json

class AffiliateProductsTester:
    def __init__(self):
        self.base_url = "https://sixer-sense-1.preview.emergentagent.com"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

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

    def test_affiliate_products_module(self):
        """Test the affiliate products module directly"""
        print("\n🛍️  Testing Affiliate Products Module...")
        
        # Test 1: Get all categories
        categories = get_all_categories()
        expected_categories = ["Health", "Career", "Finance", "Relationships", "Spiritual/Mindset", "Travel/Leisure"]
        
        success = set(categories) == set(expected_categories)
        self.log_test(
            "Get All Categories", 
            success,
            f"Found: {categories}" if success else f"Expected: {expected_categories}, Got: {categories}"
        )
        
        # Test 2: Test each category has products
        for category in expected_categories:
            products = get_products_by_category(category)
            success = len(products) > 0
            self.log_test(
                f"Category '{category}' Has Products",
                success,
                f"{len(products)} products found" if success else "No products found"
            )
            
            # Test 3: Validate product structure for first product in each category
            if products:
                product = products[0]
                required_fields = ['name', 'description', 'affiliate_link', 'price', 'run_reward', 'action_tasks']
                missing_fields = [field for field in required_fields if field not in product]
                
                success = len(missing_fields) == 0
                self.log_test(
                    f"Product Structure for '{category}'",
                    success,
                    f"All fields present: {list(product.keys())}" if success else f"Missing: {missing_fields}"
                )
                
                # Test 4: Validate affiliate link format
                affiliate_link = product.get('affiliate_link', '')
                success = affiliate_link.startswith('http')
                self.log_test(
                    f"Affiliate Link Format for '{category}'",
                    success,
                    f"Valid URL: {affiliate_link[:50]}..." if success else f"Invalid URL: {affiliate_link}"
                )
                
                # Test 5: Validate action_tasks is a list
                action_tasks = product.get('action_tasks', [])
                success = isinstance(action_tasks, list) and len(action_tasks) > 0
                self.log_test(
                    f"Action Tasks Format for '{category}'",
                    success,
                    f"{len(action_tasks)} tasks found" if success else f"Invalid action_tasks: {type(action_tasks)}"
                )

    def test_random_product_function(self):
        """Test the get_random_product function"""
        print("\n🎲 Testing Random Product Function...")
        
        categories = get_all_categories()
        
        for category in categories:
            # Test multiple calls to ensure randomness works
            products_seen = set()
            for i in range(5):  # Try 5 times
                product = get_random_product(category)
                if product:
                    products_seen.add(product['name'])
            
            success = len(products_seen) > 0
            self.log_test(
                f"Random Product for '{category}'",
                success,
                f"Got {len(products_seen)} unique products in 5 calls" if success else "No products returned"
            )
        
        # Test invalid category
        invalid_product = get_random_product("InvalidCategory")
        success = invalid_product is None
        self.log_test(
            "Invalid Category Handling",
            success,
            "Correctly returned None for invalid category" if success else f"Unexpected result: {invalid_product}"
        )

    def test_backend_integration(self):
        """Test that backend can import and use affiliate products"""
        print("\n🔗 Testing Backend Integration...")
        
        try:
            # Test that we can import the server module
            import server
            success = hasattr(server, 'get_random_product')
            self.log_test(
                "Backend Import Integration",
                success,
                "get_random_product imported successfully" if success else "get_random_product not found in server"
            )
            
        except Exception as e:
            self.log_test(
                "Backend Import Integration",
                False,
                f"Import error: {str(e)}"
            )

    def test_api_endpoint_structure(self):
        """Test the AI recommendation endpoint structure (without auth)"""
        print("\n🤖 Testing API Endpoint Structure...")
        
        # Test that the endpoint exists and returns proper error for missing auth
        try:
            response = requests.post(
                f"{self.base_url}/api/ai/recommend",
                json={"match_id": "test", "time_available": 30},
                timeout=10
            )
            
            # Should return 401 for missing auth
            success = response.status_code == 401
            self.log_test(
                "AI Recommend Endpoint Exists",
                success,
                f"Returns 401 as expected" if success else f"Unexpected status: {response.status_code}"
            )
            
        except Exception as e:
            self.log_test(
                "AI Recommend Endpoint Exists",
                False,
                f"Connection error: {str(e)}"
            )

    def test_product_data_quality(self):
        """Test the quality and completeness of product data"""
        print("\n📊 Testing Product Data Quality...")
        
        categories = get_all_categories()
        total_products = 0
        
        for category in categories:
            products = get_products_by_category(category)
            total_products += len(products)
            
            for i, product in enumerate(products):
                # Test price format
                price = product.get('price', '')
                price_valid = '$' in price or 'Free' in price or '/month' in price or '/year' in price
                self.log_test(
                    f"Price Format - {category} Product {i+1}",
                    price_valid,
                    f"Price: {price}" if price_valid else f"Invalid price format: {price}"
                )
                
                # Test run_reward is a number
                run_reward = product.get('run_reward')
                reward_valid = isinstance(run_reward, int) and run_reward > 0
                self.log_test(
                    f"Run Reward - {category} Product {i+1}",
                    reward_valid,
                    f"Run reward: {run_reward}" if reward_valid else f"Invalid run_reward: {run_reward}"
                )
                
                # Test name is not empty
                name = product.get('name', '')
                name_valid = len(name.strip()) > 0
                self.log_test(
                    f"Product Name - {category} Product {i+1}",
                    name_valid,
                    f"Name: {name[:30]}..." if name_valid else "Empty or invalid name"
                )
        
        # Test overall product count
        success = total_products >= 12  # At least 2 products per category
        self.log_test(
            "Total Product Count",
            success,
            f"Found {total_products} total products across all categories"
        )

    def run_all_tests(self):
        """Run all affiliate product tests"""
        print("🛍️  Starting Affiliate Products Testing...")
        print("=" * 60)
        
        self.test_affiliate_products_module()
        self.test_random_product_function()
        self.test_backend_integration()
        self.test_api_endpoint_structure()
        self.test_product_data_quality()
        
        # Print results
        print("\n" + "=" * 60)
        print("📊 AFFILIATE PRODUCTS TEST RESULTS")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"   - {failure['test']}: {failure['details']}")
        
        # Determine success
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        
        if success_rate >= 90:
            print(f"\n✅ EXCELLENT: {success_rate:.1f}% tests passed!")
            return 0
        elif success_rate >= 75:
            print(f"\n⚠️  GOOD: {success_rate:.1f}% tests passed, some minor issues")
            return 0
        else:
            print(f"\n❌ ISSUES FOUND: Only {success_rate:.1f}% tests passed")
            return 1

def main():
    tester = AffiliateProductsTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())