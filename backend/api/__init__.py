default_app_config = 'api.apps.ApiConfig'

# Initialize the vector store when the app is ready
from django.apps import AppConfig

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
    
    def ready(self):
        """Initialize the RAG vector store when Django starts"""
        # Only run in main process, not in management commands or other subprocesses
        import os
        if os.environ.get('RUN_MAIN', None) != 'true':
            return
            
        # Import and initialize vector store
        from .rag_service import initialize_vector_store
        try:
            print("Initializing RAG vector store...")
            initialize_vector_store()
            print("RAG vector store initialized successfully")
        except Exception as e:
            print(f"Error initializing RAG vector store: {str(e)}")
