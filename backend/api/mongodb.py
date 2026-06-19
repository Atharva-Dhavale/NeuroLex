"""
MongoDB Atlas service layer for NeuroLex.

All application data (documents, validation results) is stored here.
Django's SQLite DB is kept only for auth/sessions/admin internals.
"""

import logging
from datetime import datetime, timezone
from bson import ObjectId
from pymongo import MongoClient, DESCENDING
from django.conf import settings

logger = logging.getLogger(__name__)

# ─── Connection (lazy singleton) ─────────────────────────────────────────────

_client: MongoClient = None
_db = None


def get_db():
    """Return the MongoDB database, creating the connection on first call."""
    global _client, _db
    if _db is None:
        try:
            _client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=10000)
            # Ping to verify connection
            _client.admin.command('ping')
            _db = _client[settings.MONGO_DB_NAME]
            logger.info(f"Connected to MongoDB Atlas — database: {settings.MONGO_DB_NAME}")
        except Exception as e:
            logger.error(f"MongoDB connection failed: {e}")
            raise
    return _db


def get_collection(name: str):
    return get_db()[name]


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _serialize(doc: dict) -> dict:
    """Convert ObjectId → string and datetime → ISO string for JSON responses."""
    if doc is None:
        return None
    result = {}
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            result[k] = str(v)
        elif isinstance(v, datetime):
            result[k] = v.isoformat()
        elif isinstance(v, dict):
            result[k] = _serialize(v)
        elif isinstance(v, list):
            result[k] = [_serialize(i) if isinstance(i, dict) else i for i in v]
        else:
            result[k] = v
    return result


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ─── Documents collection ─────────────────────────────────────────────────────

DOCUMENTS = 'documents'


def create_document(data: dict) -> dict:
    """Insert a new document and return the serialized result."""
    col = get_collection(DOCUMENTS)
    now = _now()
    doc = {
        'title': data.get('title', ''),
        'file_type': data.get('file_type', 'txt'),
        'status': 'extracted',
        'extracted_text': data.get('extracted_text', ''),
        'structured_data': None,
        'validation_results': None,
        'uploaded_at': now,
        'created_at': now,
        'updated_at': now,
    }
    result = col.insert_one(doc)
    doc['_id'] = result.inserted_id
    return _serialize(doc)


def get_document(doc_id: str) -> dict:
    """Fetch a single document by its string ID."""
    col = get_collection(DOCUMENTS)
    try:
        doc = col.find_one({'_id': ObjectId(doc_id)})
    except Exception:
        return None
    return _serialize(doc)


def list_documents() -> list:
    """Return all documents ordered by created_at descending."""
    col = get_collection(DOCUMENTS)
    docs = col.find({}).sort('created_at', DESCENDING)
    return [_serialize(d) for d in docs]


def update_document(doc_id: str, updates: dict) -> dict:
    """Partial update a document. Returns the updated document."""
    col = get_collection(DOCUMENTS)
    updates['updated_at'] = _now()
    col.update_one({'_id': ObjectId(doc_id)}, {'$set': updates})
    return get_document(doc_id)


def delete_document(doc_id: str) -> bool:
    """Delete a single document. Returns True if deleted."""
    col = get_collection(DOCUMENTS)
    result = col.delete_one({'_id': ObjectId(doc_id)})
    return result.deleted_count > 0


def delete_all_documents() -> int:
    """Delete all documents. Returns count deleted."""
    col = get_collection(DOCUMENTS)
    result = col.delete_many({})
    return result.deleted_count


# ─── Normalise document for API response ─────────────────────────────────────

def normalise_doc(doc: dict) -> dict:
    """
    Ensure the document dict has an 'id' field (mapped from '_id')
    and all expected fields present for the frontend.
    """
    if doc is None:
        return None
    d = dict(doc)
    # Map _id → id for DRF-style responses
    if '_id' in d:
        d['id'] = d.pop('_id')
    # Ensure all expected fields exist
    d.setdefault('title', '')
    d.setdefault('file', None)
    d.setdefault('file_type', 'txt')
    d.setdefault('status', 'uploaded')
    d.setdefault('extracted_text', None)
    d.setdefault('structured_data', None)
    d.setdefault('validation_results', None)
    d.setdefault('uploaded_at', None)
    d.setdefault('created_at', None)
    d.setdefault('updated_at', None)
    return d
