import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
load_dotenv()

from core.config import settings
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain.schema import HumanMessage

print("Testing Gemini 2.5 Flash...")
try:
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=settings.GEMINI_API_KEY
    )
    res = llm.invoke([HumanMessage(content="Hello! State in 3 words that you are online.")])
    print(f"Success! Response: {res.content.strip()}")
except Exception as e:
    print(f"Error LLM: {e}")

print("\nTesting GoogleGenerativeAIEmbeddings with models/gemini-embedding-001...")
try:
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",
        google_api_key=settings.GEMINI_API_KEY
    )
    query_result = embeddings.embed_query("This is a test query to verify embeddings generation.")
    print(f"Success! Dimension: {len(query_result)}")
except Exception as e:
    print(f"Error embeddings: {e}")






