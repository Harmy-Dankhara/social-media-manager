import json
import logging
from typing import Dict, Any, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import SystemMessage, HumanMessage
from core.config import settings

logger = logging.getLogger(__name__)


async def run_competitor_agent(
    name: str,
    website: Optional[str],
    industry: Optional[str],
    notes: Optional[str],
    user_gemini_api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Analyzes competitor data and generates structured insights.
    Returns:
        Dict with keys: Overview, Strengths, Weaknesses, Popular Themes, Popular Hashtags, Opportunities, Recommendations
    """
    api_key = user_gemini_api_key or settings.GEMINI_API_KEY
    
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.7,
        google_api_key=api_key,
    )
    
    system_prompt = """You are an expert social media and competitive analysis strategist. 
Your job is to analyze competitor profiles and generate detailed, structured competitive intelligence.
You must return the output as a valid JSON object. Do not include any text before or after the JSON block."""
    
    user_prompt = f"""Analyze the following competitor information:

Competitor Name: {name}
Website: {website or "Not provided"}
Industry: {industry or "Not provided"}
Manually Entered Details/Notes: {notes or "Not provided"}

Task:
Identify and generate:
1. Overview: A concise summary of who they are and their brand positioning.
2. Strengths: What they do well (brand tone, messaging, engagement, visual style).
3. Weaknesses: Where they fall short.
4. Popular Themes: Common content topics and themes they focus on.
5. Popular Hashtags: Hashtags they use (or likely use) frequently.
6. Opportunities: Content gaps and angles we can exploit.
7. Recommendations: Strategic actionable next steps for our brand.

Return your response strictly in the following JSON format:
{{
  "Overview": "A concise overview of the competitor's presence and strategy...",
  "Strengths": ["Strength 1", "Strength 2", ...],
  "Weaknesses": ["Weakness 1", "Weakness 2", ...],
  "Popular Themes": ["Theme 1", "Theme 2", ...],
  "Popular Hashtags": ["#hashtag1", "#hashtag2", ...],
  "Opportunities": ["Opportunity 1", "Opportunity 2", ...],
  "Recommendations": ["Action 1", "Action 2", ...]
}}

Generate the structured JSON now:"""

    try:
        response = await llm.ainvoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt),
        ])
        
        content_text = response.content.strip()
        
        # Clean markdown code blocks if present
        if "```json" in content_text:
            content_text = content_text.split("```json")[1].split("```")[0].strip()
        elif "```" in content_text:
            content_text = content_text.split("```")[1].split("```")[0].strip()
            
        parsed = json.loads(content_text)
        return {
            "Overview": parsed.get("Overview", f"{name} is a key player in the {industry or 'specified'} industry."),
            "Strengths": parsed.get("Strengths", []),
            "Weaknesses": parsed.get("Weaknesses", []),
            "Popular Themes": parsed.get("Popular Themes", []),
            "Popular Hashtags": parsed.get("Popular Hashtags", []),
            "Opportunities": parsed.get("Opportunities", []),
            "Recommendations": parsed.get("Recommendations", [])
        }
    except Exception as e:
        logger.error(f"Error in competitor agent analysis: {e}")
        # Fallback response to avoid empty screens
        return {
            "Overview": f"{name} is a competitor in the {industry or 'specified'} industry.",
            "Strengths": [f"Established presence in {industry or 'their market'}"],
            "Weaknesses": ["Limited transparency on proprietary strategy"],
            "Popular Themes": ["Product updates", "Industry trends"],
            "Popular Hashtags": [f"#{name.lower().replace(' ', '')}", f"#{industry.lower().replace(' ', '') if industry else 'business'}"],
            "Opportunities": ["Create more targeted, high-value educational content"],
            "Recommendations": ["Monitor their engagement rates on new product announcements"]
        }
