from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import logging
import traceback
import json
import math

from .repository import (
    create_document, get_document, list_documents,
    update_document, delete_document, delete_all_documents,
    normalise_doc,
)
from .services import extract_text_from_file, process_extracted_text, validate_term_sheet

logger = logging.getLogger(__name__)


# ─── Helpers ─────────────────────────────────────────────────────────────────

def make_json_safe(obj):
    """Recursively sanitise an object so it is JSON-serialisable."""
    if isinstance(obj, dict):
        return {k: make_json_safe(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [make_json_safe(i) for i in obj]
    elif isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return str(obj)
    elif obj is None or isinstance(obj, (str, int, bool, float)):
        return obj
    else:
        return str(obj)


# ─── Document list / create ───────────────────────────────────────────────────

class DocumentListCreateView(APIView):
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get(self, request):
        """List all documents."""
        try:
            docs = list_documents()
            return Response([normalise_doc(d) for d in docs])
        except Exception as e:
            logger.error(f"Error listing documents: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        """Create a document from extracted text (or a file upload)."""
        try:
            has_file = 'file' in request.data and request.data['file']
            has_text = 'extracted_text' in request.data and request.data['extracted_text']

            if not (has_file or has_text):
                return Response(
                    {'error': 'Either a file or extracted_text must be provided'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            extracted_text = ''

            if has_file:
                file_obj = request.data['file']
                extracted_text = extract_text_from_file(file_obj)
            else:
                extracted_text = request.data['extracted_text']

            title = request.data.get('title', '').strip() or 'Untitled'
            file_type = request.data.get('file_type', 'txt')

            doc = create_document({
                'title': title,
                'file_type': file_type,
                'extracted_text': extracted_text,
            })

            return Response(normalise_doc(doc), status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error creating document: {e}\n{traceback.format_exc()}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request):
        """Delete ALL documents."""
        try:
            count = delete_all_documents()
            return Response({'message': f'Successfully deleted {count} documents'})
        except Exception as e:
            logger.error(f"Error deleting all documents: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─── Document detail / delete ─────────────────────────────────────────────────

class DocumentDetailView(APIView):
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def _get_or_404(self, doc_id):
        doc = get_document(doc_id)
        if doc is None:
            return None
        return doc

    def get(self, request, pk):
        doc = self._get_or_404(pk)
        if doc is None:
            return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(normalise_doc(doc))

    def delete(self, request, pk):
        deleted = delete_document(pk)
        if not deleted:
            return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Process ──────────────────────────────────────────────────────────────────

class DocumentProcessView(APIView):

    def post(self, request, pk):
        doc = get_document(pk)
        if doc is None:
            return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)

        # Return cached result if already processed
        if doc.get('status') in ('processed', 'validated') and doc.get('structured_data'):
            logger.info(f"Document {pk} already processed, returning cached data")
            return Response({'structured_data': doc['structured_data']})

        extracted_text = doc.get('extracted_text', '')
        if not extracted_text or len(extracted_text.strip()) < 20:
            return Response(
                {'error': 'No extracted text available for processing'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            structured_data = process_extracted_text(extracted_text)

            updates = {
                'structured_data': structured_data,
                'status': 'processed',
            }
            # Use trade_id as title if available
            trade_id = structured_data.get('trade_id', '')
            if trade_id and trade_id != 'Not specified':
                updates['title'] = trade_id

            update_document(pk, updates)

            if 'error' in structured_data:
                return Response(
                    {'structured_data': structured_data, 'warning': structured_data['error']}
                )
            return Response({'structured_data': structured_data})

        except Exception as e:
            logger.error(f"Error processing document {pk}: {e}\n{traceback.format_exc()}")
            error_data = {'error': f'Processing error: {str(e)}'}
            update_document(pk, {'status': 'error', 'structured_data': error_data})
            return Response(
                {'error': str(e), 'structured_data': error_data},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ─── Validate ─────────────────────────────────────────────────────────────────

class DocumentValidateView(APIView):

    def post(self, request, pk):
        doc = get_document(pk)
        if doc is None:
            return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)

        structured_data = doc.get('structured_data')
        if not structured_data:
            return Response(
                {'error': 'Document must be processed first'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validation_results = validate_term_sheet(structured_data)
            safe_results = make_json_safe(validation_results)

            # Simplified version for storage
            simplified = {
                'overall_status': str(safe_results.get('overall_status', 'uncertain')),
                'explanation': str(safe_results.get('explanation', '')),
                'recommendations': str(safe_results.get('recommendations', '')),
                'issues': [
                    {
                        'field': str(i.get('field', '')),
                        'description': str(i.get('description', '')),
                        'severity': str(i.get('severity', 'medium')),
                    }
                    for i in safe_results.get('issues', [])
                    if isinstance(i, dict)
                ],
            }

            update_document(pk, {
                'validation_results': simplified,
                'status': 'validated',
            })

            return Response({
                'document_id': pk,
                'validation_results': safe_results,
            })

        except Exception as e:
            logger.error(f"Error validating document {pk}: {e}\n{traceback.format_exc()}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─── Delete-all convenience endpoint ─────────────────────────────────────────

class DocumentDeleteAllView(APIView):

    def delete(self, request):
        try:
            count = delete_all_documents()
            return Response({'message': f'Successfully deleted {count} documents'})
        except Exception as e:
            logger.error(f"Error deleting all documents: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
