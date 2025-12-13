# Location-based Affiliate Product Database
# Products organized by country with local affiliate links and pricing

CURRENCY_MAP = {
    "IN": "INR",  # India
    "US": "USD",  # United States
    "GB": "GBP",  # United Kingdom
    "AU": "AUD",  # Australia
    "CA": "CAD",  # Canada
    "SG": "SGD",  # Singapore
    "AE": "AED",  # UAE
}

CURRENCY_SYMBOLS = {
    "INR": "₹",
    "USD": "$",
    "GBP": "£",
    "AUD": "A$",
    "CAD": "C$",
    "SGD": "S$",
    "AED": "AED",
}

# Affiliate products by country
affiliate_products_by_country = {
    "IN": {  # India
        "Health": [
            {
                "name": "Fitbit Charge 6 Fitness Tracker",
                "description": "Track your health metrics, workouts, and sleep patterns",
                "affiliate_link": "https://www.amazon.in/dp/B0CC5XRNFG?tag=sixersense-21",
                "price": 13299,
                "currency": "INR",
                "run_reward": 10,
            },
            {
                "name": "Yoga Mat - Extra Thick Exercise Mat",
                "description": "High-density foam yoga mat for home workouts",
                "affiliate_link": "https://www.amazon.in/dp/B07HNSVV8K?tag=sixersense-21",
                "price": 2499,
                "currency": "INR",
                "run_reward": 6,
            },
        ],
        "Career": [
            {
                "name": "Udemy Course - Complete Python Bootcamp",
                "description": "Master Python programming from beginner to advanced",
                "affiliate_link": "https://www.udemy.com/course/complete-python-bootcamp/?couponCode=INDIA",
                "price": 499,
                "currency": "INR",
                "run_reward": 15,
            },
            {
                "name": "Kindle Unlimited India",
                "description": "Access millions of books and audiobooks",
                "affiliate_link": "https://www.amazon.in/kindle-dbs/hz/subscribe/ku?tag=sixersense-21",
                "price": 169,
                "currency": "INR",
                "run_reward": 8,
            },
        ],
        "Finance": [
            {
                "name": "The Intelligent Investor Book",
                "description": "Classic book on value investing by Benjamin Graham",
                "affiliate_link": "https://www.amazon.in/dp/0060555661?tag=sixersense-21",
                "price": 599,
                "currency": "INR",
                "run_reward": 8,
            },
        ],
    },
    "US": {  # United States
        "Health": [
            {
                "name": "Fitbit Charge 6 Fitness Tracker",
                "description": "Track your health metrics, workouts, and sleep patterns",
                "affiliate_link": "https://www.amazon.com/dp/B0CC5XRNFG?tag=sixersense-20",
                "price": 159.95,
                "currency": "USD",
                "run_reward": 10,
            },
            {
                "name": "Yoga Mat - Extra Thick Exercise Mat",
                "description": "High-density foam yoga mat for home workouts",
                "affiliate_link": "https://www.amazon.com/dp/B07HNSVV8K?tag=sixersense-20",
                "price": 29.99,
                "currency": "USD",
                "run_reward": 6,
            },
        ],
        "Career": [
            {
                "name": "Udemy Course - Complete Python Bootcamp",
                "description": "Master Python programming from beginner to advanced",
                "affiliate_link": "https://www.udemy.com/course/complete-python-bootcamp/",
                "price": 89.99,
                "currency": "USD",
                "run_reward": 15,
            },
            {
                "name": "Kindle Unlimited",
                "description": "Access millions of books and audiobooks",
                "affiliate_link": "https://www.amazon.com/kindle-dbs/hz/subscribe/ku?tag=sixersense-20",
                "price": 11.99,
                "currency": "USD",
                "run_reward": 8,
            },
        ],
        "Finance": [
            {
                "name": "The Intelligent Investor Book",
                "description": "Classic book on value investing by Benjamin Graham",
                "affiliate_link": "https://www.amazon.com/dp/0060555661?tag=sixersense-20",
                "price": 24.99,
                "currency": "USD",
                "run_reward": 8,
            },
        ],
    },
    "GB": {  # United Kingdom
        "Health": [
            {
                "name": "Fitbit Charge 6 Fitness Tracker",
                "description": "Track your health metrics, workouts, and sleep patterns",
                "affiliate_link": "https://www.amazon.co.uk/dp/B0CC5XRNFG?tag=sixersense-21",
                "price": 139.99,
                "currency": "GBP",
                "run_reward": 10,
            },
        ],
        "Career": [
            {
                "name": "Udemy Course - Complete Python Bootcamp",
                "description": "Master Python programming from beginner to advanced",
                "affiliate_link": "https://www.udemy.com/course/complete-python-bootcamp/",
                "price": 74.99,
                "currency": "GBP",
                "run_reward": 15,
            },
        ],
    },
}

# Default to India if country not found
DEFAULT_COUNTRY = "IN"


def get_products_for_country(country_code: str):
    """Get affiliate products for a specific country"""
    return affiliate_products_by_country.get(country_code, affiliate_products_by_country[DEFAULT_COUNTRY])


def format_price(price: float, currency: str) -> str:
    """Format price with currency symbol"""
    symbol = CURRENCY_SYMBOLS.get(currency, "")
    
    if currency == "INR":
        # Indian format: ₹1,299
        return f"{symbol}{price:,.0f}"
    else:
        # International format: $12.99
        return f"{symbol}{price:,.2f}"


def get_currency_for_country(country_code: str) -> str:
    """Get currency code for a country"""
    return CURRENCY_MAP.get(country_code, "INR")
