from django.core.management.base import BaseCommand
from api.rag_service import debug_rag_service

class Command(BaseCommand):
    help = 'Test the RAG service functionality'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting RAG service test...'))
        debug_rag_service()
        self.stdout.write(self.style.SUCCESS('RAG service test completed')) 