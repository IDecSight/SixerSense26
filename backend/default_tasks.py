# Default Task Recommendations by Category
# Each category has 3 task recommendations with different run values (1, 4, 6)

DEFAULT_TASKS_BY_CATEGORY = {
    "Health": [
        {
            "title": "Complete a 30-minute workout session",
            "run_value": 6,
            "description": "Full workout routine - cardio or strength training",
            "estimated_minutes": 30
        },
        {
            "title": "Prepare a healthy meal from scratch",
            "run_value": 4,
            "description": "Cook a nutritious meal with fresh ingredients",
            "estimated_minutes": 25
        },
        {
            "title": "Take a 10-minute walk outside",
            "run_value": 1,
            "description": "Quick outdoor walk for fresh air and movement",
            "estimated_minutes": 10
        }
    ],
    "Career": [
        {
            "title": "Complete a major project milestone or presentation",
            "run_value": 6,
            "description": "Significant work achievement that moves projects forward",
            "estimated_minutes": 45
        },
        {
            "title": "Learn a new skill or complete a course module",
            "run_value": 4,
            "description": "Professional development through learning",
            "estimated_minutes": 30
        },
        {
            "title": "Clear your email inbox and respond to messages",
            "run_value": 1,
            "description": "Quick inbox maintenance and communication",
            "estimated_minutes": 15
        }
    ],
    "Finance": [
        {
            "title": "Review and optimize your investment portfolio",
            "run_value": 6,
            "description": "Comprehensive financial planning and investment analysis",
            "estimated_minutes": 40
        },
        {
            "title": "Create or update your monthly budget",
            "run_value": 4,
            "description": "Track expenses and plan financial goals",
            "estimated_minutes": 25
        },
        {
            "title": "Check your bank accounts and recent transactions",
            "run_value": 1,
            "description": "Quick financial health check",
            "estimated_minutes": 10
        }
    ],
    "Relationships": [
        {
            "title": "Plan and execute a special date night or family activity",
            "run_value": 6,
            "description": "Quality time with loved ones through planned activity",
            "estimated_minutes": 60
        },
        {
            "title": "Have a meaningful conversation with a friend or family member",
            "run_value": 4,
            "description": "Deep connection through intentional dialogue",
            "estimated_minutes": 30
        },
        {
            "title": "Send a thoughtful message to someone you care about",
            "run_value": 1,
            "description": "Quick check-in to maintain connections",
            "estimated_minutes": 5
        }
    ],
    "Spiritual/Mindset": [
        {
            "title": "Complete a 30-minute meditation or mindfulness practice",
            "run_value": 6,
            "description": "Extended spiritual or mental wellness session",
            "estimated_minutes": 30
        },
        {
            "title": "Journal about your goals and gratitude",
            "run_value": 4,
            "description": "Reflective writing for mental clarity",
            "estimated_minutes": 20
        },
        {
            "title": "Do a 5-minute breathing exercise",
            "run_value": 1,
            "description": "Quick mindfulness reset",
            "estimated_minutes": 5
        }
    ],
    "Travel/Leisure": [
        {
            "title": "Plan your next vacation or weekend getaway",
            "run_value": 6,
            "description": "Research and book travel plans",
            "estimated_minutes": 45
        },
        {
            "title": "Enjoy a hobby or creative activity for 30 minutes",
            "run_value": 4,
            "description": "Engage in a leisure activity you enjoy",
            "estimated_minutes": 30
        },
        {
            "title": "Read a chapter of a book or listen to a podcast",
            "run_value": 1,
            "description": "Quick leisure learning or entertainment",
            "estimated_minutes": 15
        }
    ]
}

def get_default_tasks_for_category(category: str, run_value: int = None):
    """
    Get default task recommendations for a category
    
    Args:
        category: The task category (Health, Career, Finance, etc.)
        run_value: Optional filter by run value (1, 4, or 6)
    
    Returns:
        List of default tasks or single task if run_value specified
    """
    tasks = DEFAULT_TASKS_BY_CATEGORY.get(category, [])
    
    if run_value:
        # Filter by run value
        matching_tasks = [task for task in tasks if task["run_value"] == run_value]
        return matching_tasks[0] if matching_tasks else None
    
    return tasks

def get_all_default_tasks():
    """Get all default tasks across all categories"""
    all_tasks = []
    for category, tasks in DEFAULT_TASKS_BY_CATEGORY.items():
        for task in tasks:
            task_with_category = task.copy()
            task_with_category["category"] = category
            all_tasks.append(task_with_category)
    return all_tasks

def get_categories():
    """Get all available categories"""
    return list(DEFAULT_TASKS_BY_CATEGORY.keys())
