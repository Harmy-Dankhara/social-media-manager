"""
Agent helper tools — web search stubs + content analysis functions.
These are utility functions used by the LangGraph agent nodes.
"""
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


def analyze_hashtag_performance(hashtags: List[str], platform: str) -> Dict[str, Any]:
    """
    Analyze hashtag performance for a given platform.
    Returns estimated reach scores (mock data for MVP).
    """
    platform_multipliers = {
        "instagram": 1.0,
        "linkedin": 0.6,
        "twitter": 0.8,
        "facebook": 0.5,
    }
    multiplier = platform_multipliers.get(platform, 0.7)

    results = {}
    for tag in hashtags:
        # Estimate based on hashtag length — shorter = broader reach
        base_score = max(100, 10000 - (len(tag) * 200))
        results[tag] = {
            "estimated_posts": int(base_score * multiplier * 1000),
            "competition": "high" if base_score > 5000 else "medium" if base_score > 2000 else "low",
            "recommended": len(tag) < 15,
        }
    return results


def extract_content_themes(text: str) -> List[str]:
    """
    Extract key themes/topics from a text block.
    Simple keyword extraction for MVP.
    """
    import re
    # Remove punctuation, lowercase
    clean = re.sub(r'[^\w\s]', '', text.lower())
    words = clean.split()

    # Common stop words to filter
    stop_words = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'can', 'our', 'we', 'they', 'it', 'this',
        'that', 'these', 'those', 'your', 'my', 'their', 'its',
    }

    # Count word frequencies
    freq: Dict[str, int] = {}
    for word in words:
        if word not in stop_words and len(word) > 3:
            freq[word] = freq.get(word, 0) + 1

    # Return top themes
    sorted_themes = sorted(freq.items(), key=lambda x: x[1], reverse=True)
    return [theme for theme, count in sorted_themes[:10] if count > 1]


def format_platform_post(
    caption: str,
    hashtags: List[str],
    platform: str,
) -> Dict[str, str]:
    """
    Format a post according to platform-specific rules.
    Returns formatted caption string and any warnings.
    """
    limits = {
        "instagram": {"max_chars": 2200, "max_hashtags": 30},
        "linkedin": {"max_chars": 3000, "max_hashtags": 5},
        "twitter": {"max_chars": 280, "max_hashtags": 3},
        "facebook": {"max_chars": 500, "max_hashtags": 5},
    }

    rules = limits.get(platform, limits["instagram"])
    warnings = []

    # Limit hashtags
    hashtags_trimmed = hashtags[:rules["max_hashtags"]]
    if len(hashtags) > rules["max_hashtags"]:
        warnings.append(f"Trimmed hashtags to {rules['max_hashtags']} for {platform}")

    hashtag_str = " ".join(hashtags_trimmed)
    full_text = f"{caption}\n\n{hashtag_str}" if hashtags_trimmed else caption

    # Trim caption if over limit
    if len(full_text) > rules["max_chars"]:
        available = rules["max_chars"] - len(hashtag_str) - 5
        caption = caption[:available] + "..."
        full_text = f"{caption}\n\n{hashtag_str}" if hashtags_trimmed else caption
        warnings.append(f"Caption trimmed to fit {platform} limit of {rules['max_chars']} chars")

    return {
        "formatted_caption": full_text,
        "caption": caption,
        "hashtags": hashtags_trimmed,
        "char_count": len(full_text),
        "max_chars": rules["max_chars"],
        "warnings": warnings,
    }


def get_trending_topics(industry: str) -> List[str]:
    """
    Get trending topics for an industry (mock data for MVP).
    In production, this would call a social listening API.
    """
    industry_topics = {
        "technology": ["AI revolution", "sustainable tech", "remote work tools", "cybersecurity", "cloud computing"],
        "fashion": ["sustainable fashion", "vintage revival", "minimalism", "streetwear", "seasonal trends"],
        "food": ["plant-based recipes", "fusion cuisine", "local sourcing", "meal prep", "food sustainability"],
        "fitness": ["home workouts", "mental wellness", "wearable tech", "nutrition science", "recovery"],
        "finance": ["crypto insights", "personal finance tips", "investing basics", "economic trends", "fintech"],
        "healthcare": ["mental health awareness", "preventive care", "telemedicine", "wellness trends", "nutrition"],
        "education": ["online learning", "skill development", "EdTech tools", "lifelong learning", "STEM"],
        "real estate": ["housing market trends", "smart homes", "sustainable building", "interior design", "investing"],
    }

    industry_lower = industry.lower()
    for key, topics in industry_topics.items():
        if key in industry_lower or industry_lower in key:
            return topics

    return ["brand storytelling", "community building", "product launches", "behind the scenes", "customer success"]


def suggest_posting_times(platform: str) -> List[Dict[str, str]]:
    """
    Suggest optimal posting times for each platform.
    Based on industry research averages.
    """
    optimal_times = {
        "instagram": [
            {"day": "Monday", "time": "11:00 AM", "reason": "Start-of-week engagement peak"},
            {"day": "Wednesday", "time": "11:00 AM", "reason": "Mid-week highest engagement"},
            {"day": "Friday", "time": "10:00 AM", "reason": "Pre-weekend activity surge"},
        ],
        "linkedin": [
            {"day": "Tuesday", "time": "10:00 AM", "reason": "Professional morning browsing"},
            {"day": "Wednesday", "time": "12:00 PM", "reason": "Lunch break peak"},
            {"day": "Thursday", "time": "10:00 AM", "reason": "High B2B engagement day"},
        ],
        "twitter": [
            {"day": "Wednesday", "time": "9:00 AM", "reason": "Morning news consumption"},
            {"day": "Thursday", "time": "9:00 AM", "reason": "High tweet volume"},
            {"day": "Friday", "time": "9:00 AM", "reason": "End-of-week trending topics"},
        ],
        "facebook": [
            {"day": "Wednesday", "time": "1:00 PM", "reason": "Afternoon engagement peak"},
            {"day": "Thursday", "time": "8:00 AM", "reason": "Morning scroll habits"},
            {"day": "Friday", "time": "1:00 PM", "reason": "Friday leisure browsing"},
        ],
    }
    return optimal_times.get(platform, optimal_times["instagram"])
