# Player Model System for Sixer Sense
# Each user has 11 virtual players representing life roles

from typing import List, Dict

# Player archetypes by category
PLAYER_ARCHETYPES = {
    "Health": [
        {"name": "Fitness Captain", "run_potential": 6, "specialty": "High-intensity workouts"},
        {"name": "Nutrition Guardian", "run_potential": 4, "specialty": "Meal prep & healthy eating"},
        {"name": "Sleep Keeper", "run_potential": 4, "specialty": "Rest & recovery"},
        {"name": "Wellness Scout", "run_potential": 1, "specialty": "Quick health checks"},
    ],
    "Career": [
        {"name": "Deep Work Specialist", "run_potential": 6, "specialty": "Complex projects"},
        {"name": "Meeting Manager", "run_potential": 4, "specialty": "Communication & coordination"},
        {"name": "Skill Builder", "run_potential": 4, "specialty": "Learning & upskilling"},
        {"name": "Task Executor", "run_potential": 1, "specialty": "Quick wins"},
    ],
    "Finance": [
        {"name": "Investment Strategist", "run_potential": 6, "specialty": "Long-term planning"},
        {"name": "Budget Master", "run_potential": 4, "specialty": "Expense tracking"},
        {"name": "Income Optimizer", "run_potential": 4, "specialty": "Revenue generation"},
        {"name": "Money Monitor", "run_potential": 1, "specialty": "Quick checks"},
    ],
    "Relationships": [
        {"name": "Connection Builder", "run_potential": 6, "specialty": "Deep conversations"},
        {"name": "Family Guardian", "run_potential": 4, "specialty": "Quality time"},
        {"name": "Friend Nurturer", "run_potential": 4, "specialty": "Social bonding"},
        {"name": "Quick Connector", "run_potential": 1, "specialty": "Check-ins"},
    ],
    "Spiritual/Mindset": [
        {"name": "Meditation Master", "run_potential": 6, "specialty": "Deep reflection"},
        {"name": "Mindfulness Guide", "run_potential": 4, "specialty": "Present moment"},
        {"name": "Gratitude Keeper", "run_potential": 4, "specialty": "Positive mindset"},
        {"name": "Breath Monitor", "run_potential": 1, "specialty": "Quick centering"},
    ],
    "Travel/Leisure": [
        {"name": "Adventure Seeker", "run_potential": 6, "specialty": "New experiences"},
        {"name": "Hobby Champion", "run_potential": 4, "specialty": "Creative pursuits"},
        {"name": "Recreation Manager", "run_potential": 4, "specialty": "Fun activities"},
        {"name": "Break Taker", "run_potential": 1, "specialty": "Quick refreshers"},
    ],
}


def generate_playing_xi(user_profile: Dict) -> List[Dict]:
    """
    Generate 11 players for user based on their profile
    
    Args:
        user_profile: User's profile with primary_goal, life_stage, preferred_focus_areas
    
    Returns:
        List of 11 player objects
    """
    primary_goal = user_profile.get("primary_goal", "Balanced Life")
    focus_areas = user_profile.get("preferred_focus_areas", [])
    
    # Determine player distribution based on goals
    distribution = calculate_player_distribution(primary_goal, focus_areas)
    
    # Build the playing XI
    playing_xi = []
    player_id = 1
    
    for category, count in distribution.items():
        archetypes = PLAYER_ARCHETYPES.get(category, [])
        # Select diverse archetypes for this category
        selected = []
        for i in range(min(count, len(archetypes))):
            archetype = archetypes[i % len(archetypes)]
            player = {
                "player_id": player_id,
                "category": category,
                "name": archetype["name"],
                "run_potential": archetype["run_potential"],
                "specialty": archetype["specialty"],
                "position": player_id,  # Batting order
                "form": 100,  # 0-100, starts at 100
            }
            selected.append(player)
            player_id += 1
        
        playing_xi.extend(selected)
    
    return playing_xi[:11]  # Ensure exactly 11 players


def calculate_player_distribution(primary_goal: str, focus_areas: List[str]) -> Dict[str, int]:
    """
    Calculate how many players each category should have
    
    Returns:
        Dict with category -> player count
    """
    # Default balanced distribution
    distribution = {
        "Health": 2,
        "Career": 2,
        "Finance": 2,
        "Relationships": 2,
        "Spiritual/Mindset": 2,
        "Travel/Leisure": 1,
    }
    
    # Adjust based on primary goal
    if "career" in primary_goal.lower() or "work" in primary_goal.lower():
        distribution["Career"] = 3
        distribution["Finance"] = 2
        distribution["Health"] = 2
        distribution["Relationships"] = 2
        distribution["Spiritual/Mindset"] = 1
        distribution["Travel/Leisure"] = 1
    
    elif "health" in primary_goal.lower() or "fitness" in primary_goal.lower():
        distribution["Health"] = 4
        distribution["Career"] = 2
        distribution["Finance"] = 1
        distribution["Relationships"] = 2
        distribution["Spiritual/Mindset"] = 2
        distribution["Travel/Leisure"] = 0
    
    elif "burnout" in primary_goal.lower() or "balance" in primary_goal.lower():
        distribution["Health"] = 3
        distribution["Spiritual/Mindset"] = 3
        distribution["Career"] = 2
        distribution["Finance"] = 1
        distribution["Relationships"] = 1
        distribution["Travel/Leisure"] = 1
    
    elif "entrepreneur" in primary_goal.lower() or "business" in primary_goal.lower():
        distribution["Career"] = 3
        distribution["Finance"] = 3
        distribution["Relationships"] = 2
        distribution["Health"] = 2
        distribution["Spiritual/Mindset"] = 1
        distribution["Travel/Leisure"] = 0
    
    # Further adjust based on focus areas
    for area in focus_areas:
        if area in distribution and distribution[area] < 4:
            distribution[area] += 1
            # Reduce from least focused area
            min_category = min(distribution, key=distribution.get)
            if distribution[min_category] > 0:
                distribution[min_category] -= 1
    
    return distribution


def get_time_block_overs(current_hour: int) -> Dict:
    """
    Get over allocation for current time block
    
    Args:
        current_hour: Current hour (0-23)
    
    Returns:
        Dict with time_block name and available_overs
    """
    if 6 <= current_hour < 12:
        return {"time_block": "Morning", "available_overs": 8, "max_balls": 48}
    elif 12 <= current_hour < 18:
        return {"time_block": "Afternoon", "available_overs": 8, "max_balls": 48}
    elif 18 <= current_hour < 22:
        return {"time_block": "Evening", "available_overs": 6, "max_balls": 36}
    else:
        return {"time_block": "Night", "available_overs": 4, "max_balls": 24}


def calculate_balls_for_task(estimated_minutes: int) -> int:
    """
    Calculate how many balls a task should consume
    
    1 ball = 5-15 minutes of focused effort
    
    Args:
        estimated_minutes: Task duration in minutes
    
    Returns:
        Number of balls (1-6)
    """
    if estimated_minutes <= 15:
        return 1  # Quick task
    elif estimated_minutes <= 30:
        return 2  # Small-medium task
    elif estimated_minutes <= 45:
        return 3  # Medium task
    elif estimated_minutes <= 60:
        return 4  # Large task
    elif estimated_minutes <= 75:
        return 5  # Deep work
    else:
        return 6  # Maximum 1 over for a single task


def should_match_end_automatically(match_date: str, current_datetime) -> bool:
    """
    Check if match should end because day is over
    
    Args:
        match_date: Match date (YYYY-MM-DD format)
        current_datetime: Current datetime
    
    Returns:
        True if match should end
    """
    match_day = match_date
    current_day = current_datetime.strftime("%Y-%m-%d")
    
    return match_day != current_day
