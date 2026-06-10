"""
RAG Pipeline — ingestion and retrieval using LangChain + Pinecone
"""
import io
import logging
from typing import List, Optional, Dict, Any

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain.schema import Document

from core.config import settings

logger = logging.getLogger(__name__)

def _get_embeddings_model(brand_id: Optional[str] = None, user_id: Optional[str] = None) -> GoogleGenerativeAIEmbeddings:
    """Helper to resolve the correct Gemini API key and instantiate embeddings model."""
    api_key = settings.GEMINI_API_KEY
    try:
        from db.database import SessionLocal
        from models.user import User
        from models.brand import Brand
        
        with SessionLocal() as db:
            if not user_id and brand_id:
                brand = db.query(Brand).filter(Brand.id == brand_id).first()
                if brand:
                    user_id = brand.user_id
            
            if user_id:
                user = db.query(User).filter(User.id == user_id).first()
                if user and user.gemini_api_key:
                    api_key = user.gemini_api_key
    except Exception as e:
        logger.error(f"Error resolving user API key in RAG pipeline: {e}")
        
    return GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",
        google_api_key=api_key,
    )

# Initialize Pinecone lazily
_pinecone_index = None


def _get_pinecone_index():
    global _pinecone_index
    if _pinecone_index is None:
        try:
            from pinecone import Pinecone
            pc = Pinecone(api_key=settings.PINECONE_API_KEY)
            _pinecone_index = pc.Index(settings.PINECONE_INDEX_NAME)
        except Exception as e:
            logger.error(f"Pinecone init error: {e}")
            _pinecone_index = None
    return _pinecone_index


def _extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF bytes."""
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text
    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
        return ""


async def ingest_brand_document(
    brand_id: str,
    doc_content: str,
    doc_type: str = "brand_doc",
    platform: Optional[str] = None,
    is_pdf: bool = False,
    file_bytes: Optional[bytes] = None,
) -> bool:
    """
    Ingest a brand document into Pinecone.
    Splits text, generates embeddings, stores with metadata.
    """
    index = _get_pinecone_index()
    if index is None:
        logger.warning("Pinecone not available — skipping ingestion")
        return False

    # Extract text if PDF
    if is_pdf and file_bytes:
        doc_content = _extract_text_from_pdf(file_bytes)

    if not doc_content.strip():
        logger.warning("Empty document — skipping ingestion")
        return False

    # Split into chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_text(doc_content)
    logger.info(f"Split document into {len(chunks)} chunks for brand {brand_id}")

    # Generate embeddings
    try:
        embeddings_model = _get_embeddings_model(brand_id=brand_id)
        chunk_embeddings = embeddings_model.embed_documents(chunks)
    except Exception as e:
        logger.error(f"Embedding error: {e}")
        return False

    # Upsert to Pinecone
    from datetime import datetime
    vectors = []
    for i, (chunk, embedding) in enumerate(zip(chunks, chunk_embeddings)):
        vector_id = f"{brand_id}_{doc_type}_{i}"
        metadata = {
            "brand_id": brand_id,
            "doc_type": doc_type,
            "platform": platform or "general",
            "text": chunk,
            "timestamp": datetime.utcnow().isoformat(),
        }
        vectors.append({
            "id": vector_id,
            "values": embedding,
            "metadata": metadata,
        })

    try:
        index.upsert(vectors=vectors)
        logger.info(f"Upserted {len(vectors)} vectors for brand {brand_id}")
        return True
    except Exception as e:
        logger.error(f"Pinecone upsert error: {e}")
        return False


async def retrieve_brand_context(
    brand_id: str,
    query: str,
    top_k: int = 5,
) -> str:
    """
    Retrieve relevant brand context from Pinecone.
    Returns concatenated text chunks.
    """
    index = _get_pinecone_index()
    if index is None:
        return ""

    try:
        embeddings_model = _get_embeddings_model(brand_id=brand_id)
        query_embedding = embeddings_model.embed_query(query)
        results = index.query(
            vector=query_embedding,
            top_k=top_k,
            filter={"brand_id": {"$eq": brand_id}},
            include_metadata=True,
        )
        chunks = [match["metadata"]["text"] for match in results.get("matches", [])]
        return "\n\n".join(chunks)
    except Exception as e:
        logger.error(f"Pinecone retrieval error: {e}")
        return ""


async def retrieve_competitor_context(
    industry: str,
    query: str,
    top_k: int = 5,
    user_id: Optional[str] = None,
) -> str:
    """
    Retrieve competitor content from Pinecone filtered by industry.
    """
    index = _get_pinecone_index()
    if index is None:
        return ""

    try:
        embeddings_model = _get_embeddings_model(user_id=user_id)
        query_embedding = embeddings_model.embed_query(query)
        results = index.query(
            vector=query_embedding,
            top_k=top_k,
            filter={"doc_type": {"$eq": "competitor"}},
            include_metadata=True,
        )
        chunks = [match["metadata"]["text"] for match in results.get("matches", [])]
        return "\n\n".join(chunks)
    except Exception as e:
        logger.error(f"Competitor retrieval error: {e}")
        return ""
