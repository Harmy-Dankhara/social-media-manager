"""
LangGraph Social Media Agent
Orchestrates: brand context fetch → competitor analysis → content generation → format → stream
"""
import json
import logging
from typing import TypedDict, List, Optional, Any
from datetime import datetime

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import SystemMessage, HumanMessage, BaseMessage
from langgraph.graph import StateGraph, END

from core.config import settings
from agents.rag_pipeline import retrieve_brand_context, retrieve_competitor_context

logger = logging.getLogger(__name__)

# Platform-specific constraints
PLATFORM_RULES = {
    "instagram": {
        "max_chars": 2200,
        "max_hashtags": 30,
        "style": "Visual, engaging, story-driven. Use emojis. Start with a hook.",
        "format": "Caption + line breaks + hashtags at end",
    },
    "linkedin": {
        "max_chars": 3000,
        "max_hashtags": 5,
        "style": "Professional, insightful, thought leadership. Minimal emojis.",
        "format": "Hook → Story/Insight → CTA → Hashtags",
    },
    "twitter": {
        "max_chars": 280,
        "max_hashtags": 3,
        "style": "Punchy, witty, conversational. Trending hooks.",
        "format": "Single impactful tweet. Max 280 characters.",
    },
    "facebook": {
        "max_chars": 500,
        "max_hashtags": 5,
        "style": "Conversational, community-focused, relatable.",
        "format": "Short paragraph + question or CTA",
    },
}


class AgentState(TypedDict):
    brand_id: str
    brand_name: str
    brand_industry: str
    brand_context: str
    platforms: List[str]
    content_type: str
    topic: str
    num_posts: int
    competitor_insights: str
    generated_posts: List[dict]
    current_step: str
    messages: List[BaseMessage]
    user_id: str
    websocket_manager: Any


async def fetch_brand_context_node(state: AgentState) -> AgentState:
    """Node 1: Retrieve brand context from Pinecone."""
    await _send_step(state, "🔍 Analyzing brand voice and guidelines...")
    
    context = await retrieve_brand_context(
        brand_id=state["brand_id"],
        query=f"brand voice guidelines {state['topic']}",
        top_k=5,
    )
    
    # If no RAG context, use brand basics
    if not context:
        context = f"""
Brand: {state['brand_name']}
Industry: {state['brand_industry']}
Topic Focus: {state['topic']}
Brand Voice: Create compelling content that resonates with the target audience.
"""
    
    await _send_step(state, "✅ Brand intelligence loaded")
    return {**state, "brand_context": context, "current_step": "brand_context_loaded"}


async def analyze_competitors_node(state: AgentState) -> AgentState:
    """Node 2: Retrieve competitor insights from Pinecone."""
    await _send_step(state, "🔎 Searching competitor content patterns...")
    
    competitor_insights = await retrieve_competitor_context(
        industry=state["brand_industry"],
        query=f"{state['topic']} social media content {state['brand_industry']}",
        top_k=5,
        user_id=state["user_id"],
    )
    
    if not competitor_insights:
        competitor_insights = f"""
Industry: {state['brand_industry']}
Common patterns: Educational content, behind-the-scenes, user testimonials, 
product highlights, trending topics, interactive polls.
Popular hashtags: #{state['brand_industry'].lower().replace(' ', '')} #business #growth
"""
    
    await _send_step(state, "✅ Competitor patterns analyzed")
    return {**state, "competitor_insights": competitor_insights, "current_step": "competitors_analyzed"}


async def generate_content_node(state: AgentState) -> AgentState:
    """Node 3: Generate content using Gemini 2.5 Flash."""
    await _send_step(state, "🤖 Generating content with Gemini 2.5 Flash...")
    
    # Retrieve user's custom Gemini API key if present, fallback to settings
    api_key = settings.GEMINI_API_KEY
    try:
        from db.database import SessionLocal
        from models.user import User
        with SessionLocal() as db:
            user = db.query(User).filter(User.id == state["user_id"]).first()
            if user and user.gemini_api_key:
                api_key = user.gemini_api_key
    except Exception as e:
        logger.error(f"Error reading user API key from database: {e}")

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.8,
        google_api_key=api_key,
    )
    
    platforms_info = "\n".join([
        f"- {p.upper()}: {PLATFORM_RULES.get(p, {}).get('style', 'Engaging content')}"
        for p in state["platforms"]
    ])
    
    system_prompt = """You are an expert social media strategist and copywriter with 10+ years of experience 
    building viral brand content. You create platform-native content that drives engagement, builds brand 
    identity, and converts followers into customers. You deeply understand brand voice, audience psychology, 
    and platform algorithms."""
    
    is_calendar_request = state.get("topic", "").strip().lower() == "generate content for next 30 days"
    
    if is_calendar_request:
        user_prompt = f"""Generate a 30-day social media content calendar for EACH of the following platforms.

BRAND CONTEXT:
{state['brand_context']}

COMPETITOR INSIGHTS:
{state['competitor_insights']}

PLATFORMS TO CREATE FOR:
{platforms_info}

CONTENT DETAILS:
- Topic/Campaign: {state['topic']}
- Content Type: {state['content_type']}
- Brand: {state['brand_name']} ({state['brand_industry']})

INSTRUCTIONS:
1. Create a 30-day content calendar outline.
2. The calendar MUST be formatted exactly as:
Day 1 → [Post Type/Topic]
Day 3 → [Post Type/Topic]
Day 5 → [Post Type/Topic]
Day 7 → [Post Type/Topic]
...
(continue up to Day 29 or 30).
3. The format of each line must start with "Day X → " where X is the day number.
4. Each entry should specify a short post description/idea tailored to the brand voice and competitor insights.
5. Create exactly ONE calendar block per platform, returned in the JSON structure below.

OUTPUT FORMAT (JSON):
Return a JSON object with this exact structure:
{{
  "posts": [
    {{
      "platform": "instagram",
      "post_number": 1,
      "caption": "Day 1 → Educational Post\\nDay 3 → Industry News\\nDay 5 → Customer Story\\nDay 7 → Promotion\\n...",
      "hashtags": ["#contentcalendar", "#socialmediastrategy"],
      "emojis": ["📅", "✨"],
      "hook": "Day 1 → Educational Post"
    }}
  ]
}}

Generate the calendar now:"""
    else:
        user_prompt = f"""Generate {state['num_posts']} social media post(s) for EACH of the following platforms.

BRAND CONTEXT:
{state['brand_context']}

COMPETITOR INSIGHTS:
{state['competitor_insights']}

PLATFORMS TO CREATE FOR:
{platforms_info}

CONTENT DETAILS:
- Topic/Campaign: {state['topic']}
- Content Type: {state['content_type']}
- Brand: {state['brand_name']} ({state['brand_industry']})

INSTRUCTIONS:
1. Create {state['num_posts']} unique posts per platform
2. Each post must be platform-native and follow the platform's best practices
3. Include relevant hashtags for each platform
4. Include 3-5 relevant emojis per post
5. Make each post engaging, on-brand, and actionable

OUTPUT FORMAT (JSON):
Return a JSON object with this exact structure:
{{
  "posts": [
    {{
      "platform": "instagram",
      "post_number": 1,
      "caption": "Full post caption here",
      "hashtags": ["#hashtag1", "#hashtag2"],
      "emojis": ["🚀", "✨", "💡"],
      "hook": "Opening line of the post"
    }}
  ]
}}

Generate all posts now:"""

    try:
        response = await llm.ainvoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt),
        ])
        
        # Parse JSON response
        content_text = response.content
        # Extract JSON from potential markdown code blocks
        if "```json" in content_text:
            content_text = content_text.split("```json")[1].split("```")[0].strip()
        elif "```" in content_text:
            content_text = content_text.split("```")[1].split("```")[0].strip()
        
        import uuid
        parsed = json.loads(content_text)
        generated_posts = parsed.get("posts", [])
        for post in generated_posts:
            if "id" not in post:
                post["id"] = str(uuid.uuid4())
        
        await _send_step(state, f"✅ Generated {len(generated_posts)} posts successfully")
        return {**state, "generated_posts": generated_posts, "current_step": "content_generated"}
    
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}")
        # Fallback: generate basic posts
        generated_posts = _generate_fallback_posts(state)
        return {**state, "generated_posts": generated_posts, "current_step": "content_generated"}
    except Exception as e:
        logger.error(f"Content generation error: {e}")
        generated_posts = _generate_fallback_posts(state)
        return {**state, "generated_posts": generated_posts, "current_step": "content_generated"}


def _generate_fallback_posts(state: AgentState) -> List[dict]:
    """Generate basic fallback posts when Gemini 2.5 Flash is unavailable."""
    import uuid
    posts = []
    is_calendar_request = state.get("topic", "").strip().lower() == "generate content for next 30 days"
    
    for platform in state["platforms"]:
        if is_calendar_request:
            caption = (
                "Day 1 → Educational Post\n"
                "Day 3 → Industry News\n"
                "Day 5 → Customer Story\n"
                "Day 7 → Promotion\n"
                "Day 9 → Behind the Scenes\n"
                "Day 11 → FAQ / Q&A\n"
                "Day 13 → Customer Story\n"
                "Day 15 → Interactive Poll\n"
                "Day 17 → Industry News\n"
                "Day 19 → Product Highlight\n"
                "Day 21 → Educational Post\n"
                "Day 23 → Promotion\n"
                "Day 25 → Customer Story\n"
                "Day 27 → Behind the Scenes\n"
                "Day 29 → Quick Tip/Quote"
            )
            posts.append({
                "id": str(uuid.uuid4()),
                "platform": platform,
                "post_number": 1,
                "caption": caption,
                "hashtags": ["#contentcalendar", "#socialmediastrategy", "#marketingtips"],
                "emojis": ["📅", "✨", "💡"],
                "hook": "Day 1 → Educational Post",
            })
        else:
            for i in range(state["num_posts"]):
                posts.append({
                    "id": str(uuid.uuid4()),
                    "platform": platform,
                    "post_number": i + 1,
                    "caption": f"Exciting news from {state['brand_name']}! {state['topic']} 🚀\n\nStay tuned for more updates and insights from our team.",
                    "hashtags": [f"#{state['brand_industry'].lower().replace(' ', '')}", "#business", "#growth", "#innovation"],
                    "emojis": ["🚀", "✨", "💡"],
                    "hook": f"Exciting news from {state['brand_name']}!",
                })
    return posts


async def format_output_node(state: AgentState) -> AgentState:
    """Node 4: Format posts for each platform with character limit checks."""
    await _send_step(state, "✍️ Formatting posts for each platform...")
    
    is_calendar_request = state.get("topic", "").strip().lower() == "generate content for next 30 days"
    
    formatted_posts = []
    for post in state["generated_posts"]:
        platform = post.get("platform", "instagram")
        rules = PLATFORM_RULES.get(platform, PLATFORM_RULES["instagram"])
        
        caption = post.get("caption", "")
        hashtags = post.get("hashtags", [])
        
        # Apply character limits
        max_chars = 99999 if is_calendar_request else rules["max_chars"]
        max_hashtags = rules["max_hashtags"]
        
        # Limit hashtags
        hashtags = hashtags[:max_hashtags]
        
        # Trim caption if needed
        hashtag_str = " ".join(hashtags)
        if len(caption) + len(hashtag_str) + 2 > max_chars:
            available = max_chars - len(hashtag_str) - 5
            caption = caption[:available] + "..."
        
        formatted_post = {
            **post,
            "caption": caption,
            "hashtags": hashtags,
            "formatted_caption": f"{caption}\n\n{hashtag_str}" if hashtags else caption,
            "platform_rules": {
                "max_chars": max_chars,
                "char_count": len(caption),
            },
        }
        formatted_posts.append(formatted_post)
    
    await _send_step(state, "✅ Content formatted and optimized")
    return {**state, "generated_posts": formatted_posts, "current_step": "formatted"}


async def stream_results_node(state: AgentState) -> AgentState:
    """Node 5: Stream results to frontend via WebSocket."""
    ws_manager = state.get("websocket_manager")
    user_id = state.get("user_id")
    
    if ws_manager and user_id:
        # Stream each post
        for post in state["generated_posts"]:
            await ws_manager.send_to_user(user_id, {
                "type": "post",
                "platform": post["platform"],
                "data": post,
            })
        
        # Send completion
        await ws_manager.send_to_user(user_id, {
            "type": "done",
            "message": f"✅ Generation complete! {len(state['generated_posts'])} posts ready.",
            "total_posts": len(state["generated_posts"]),
        })
    
    return {**state, "current_step": "complete"}


async def _send_step(state: AgentState, message: str):
    """Helper to stream agent step messages via WebSocket."""
    ws_manager = state.get("websocket_manager")
    user_id = state.get("user_id")
    if ws_manager and user_id:
        await ws_manager.send_to_user(user_id, {
            "type": "step",
            "message": message,
        })
    logger.info(f"Agent step [{state.get('user_id')}]: {message}")


def build_social_agent():
    """Build and compile the LangGraph state machine."""
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("fetch_brand_context", fetch_brand_context_node)
    workflow.add_node("analyze_competitors", analyze_competitors_node)
    workflow.add_node("generate_content", generate_content_node)
    workflow.add_node("format_output", format_output_node)
    workflow.add_node("stream_results", stream_results_node)
    
    # Add edges
    workflow.set_entry_point("fetch_brand_context")
    workflow.add_edge("fetch_brand_context", "analyze_competitors")
    workflow.add_edge("analyze_competitors", "generate_content")
    workflow.add_edge("generate_content", "format_output")
    workflow.add_edge("format_output", "stream_results")
    workflow.add_edge("stream_results", END)
    
    return workflow.compile()


# Singleton agent
_agent = None


def get_agent():
    global _agent
    if _agent is None:
        _agent = build_social_agent()
    return _agent


async def run_social_agent(
    brand_id: str,
    brand_name: str,
    brand_industry: str,
    platforms: List[str],
    content_type: str,
    topic: str,
    num_posts: int,
    user_id: str,
    websocket_manager: Any,
) -> List[dict]:
    """
    Entry point to run the full social media agent pipeline.
    Returns list of generated posts.
    """
    agent = get_agent()
    
    initial_state: AgentState = {
        "brand_id": brand_id,
        "brand_name": brand_name,
        "brand_industry": brand_industry,
        "brand_context": "",
        "platforms": platforms,
        "content_type": content_type,
        "topic": topic,
        "num_posts": num_posts,
        "competitor_insights": "",
        "generated_posts": [],
        "current_step": "starting",
        "messages": [],
        "user_id": user_id,
        "websocket_manager": websocket_manager,
    }
    
    # Send initial step
    await websocket_manager.send_to_user(user_id, {
        "type": "step",
        "message": "🚀 Starting AI content generation pipeline...",
    })
    
    result = await agent.ainvoke(initial_state)
    return result.get("generated_posts", [])
