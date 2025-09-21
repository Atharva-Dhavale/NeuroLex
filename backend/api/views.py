from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import os
import tempfile
from django.conf import settings
import logging
import traceback
import mimetypes
import time
import json
from datetime import datetime
import math

from .models import TermSheetDocument, ExtractedTermSheet, ValidationResult, Document
from .serializers import (
    TermSheetDocumentSerializer, 
    ExtractedTermSheetSerializer, 
    ValidationResultSerializer,
    TermSheetDocumentDetailSerializer,
    DocumentSerializer
)
from .services import extract_text_from_file, process_extracted_text, validate_term_sheet

logger = logging.getLogger(__name__)

def get_file_extension(file):
    # Handle both filename and content-type approaches
    name = file.name.lower()
    content_type = file.content_type.lower() if hasattr(file, 'content_type') else ''
    
    # Try to get extension from filename first
    if '.' in name:
        return name.split('.')[-1]
    
    # If that fails, try to determine from content-type
    if content_type:
        ext = mimetypes.guess_extension(content_type)
        if ext:
            return ext.lstrip('.').lower()
    
    # Default fallback
    return 'unknown'

class DocumentViewSet(viewsets.ModelViewSet):
    """Document API view."""
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    
    def create(self, request, *args, **kwargs):
        """Create a new document with file or extracted text."""
        try:
            # Handle either file upload or extracted text
            has_file = 'file' in request.data and request.data['file']
            has_extracted_text = 'extracted_text' in request.data and request.data['extracted_text']
            
            if not (has_file or has_extracted_text):
                return Response(
                    {"error": "Either a file or extracted text must be provided"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            logger.info(f"Creating document: has_file={has_file}, has_extracted_text={has_extracted_text}")
                
            # Create serializer with data
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            
            headers = self.get_success_headers(serializer.data)
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED,
                headers=headers
            )
        except Exception as e:
            logger.error(f"Error creating document: {str(e)}")
            logger.error(traceback.format_exc())
            return Response(
                {"error": f"Error creating document: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def perform_create(self, serializer):
        """Save the document and handle file extraction if uploaded."""
        try:
            # Check if there's an uploaded file
            file = self.request.data.get('file', None)
            extracted_text = self.request.data.get('extracted_text', None)
            
            if file:
                # Save with file and set status to uploaded
                document = serializer.save(status='uploaded')
                logger.info(f"Document {document.id} created with file: {document.file.name}")
                
                # Attempt to extract text in a separate process
                try:
                    document.extracted_text = extract_text_from_file(file)
                    document.status = 'extracted'
                    document.save()
                    logger.info(f"Text extracted for document {document.id}: {len(document.extracted_text)} chars")
                except Exception as extract_error:
                    logger.error(f"Error extracting text: {str(extract_error)}")
            elif extracted_text:
                # Save with already extracted text and set status to extracted
                document = serializer.save(
                    extracted_text=extracted_text,
                    status='extracted'
                )
                logger.info(f"Document {document.id} created with extracted text: {len(extracted_text)} chars")
            else:
                # This shouldn't happen due to validation in create()
                document = serializer.save(status='uploaded')
                logger.warning(f"Document {document.id} created without file or extracted text")
                
        except Exception as e:
            logger.error(f"Error in perform_create: {str(e)}")
            logger.error(traceback.format_exc())
            # Let the error propagate to create() for handling
            raise
    
    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """Process the document to extract structured data."""
        document = self.get_object()
        
        try:
            # Return existing data if already processed or validated
            if document.status in ['processed', 'validated'] and document.structured_data:
                # If the document has already been processed, return the structured data
                logger.info(f"Document {document.id} already processed, returning existing structured data")
                return Response({
                    'structured_data': document.structured_data
                }, status=status.HTTP_200_OK)
            
            # If document is not ready for processing
            if document.status not in ['extracted']:
                if not document.extracted_text:
                    logger.warning(f"Document {document.id} has no extracted text for processing")
                    return Response({
                        'error': "No extracted text available for processing"
                    }, status=status.HTTP_400_BAD_REQUEST)
                logger.info(f"Document {document.id} status is {document.status}, but proceeding with extracted text")
            
            # Check if extracted text is too short
            if len(document.extracted_text) < 20:
                error_message = "Extracted text is too short for meaningful processing"
                logger.warning(f"Document {document.id}: {error_message}")
                return Response({
                    'error': error_message,
                    'structured_data': {
                        'company_name': 'Not specified',
                        'error': error_message
                    }
                }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
                
            logger.info(f"Processing document {document.id} with {len(document.extracted_text)} chars of text")
            
            # Process the extracted text to structure it
            try:
                logger.info(f"Processing extracted text for document {document.id}")
                structured_data = process_extracted_text(document.extracted_text)
                
                # Update document with structured data
                document.structured_data = structured_data
                document.status = 'processed'
                
                # Set document title to trade_id if available
                if 'trade_id' in structured_data and structured_data['trade_id'] and structured_data['trade_id'] != 'Not specified':
                    logger.info(f"Setting document title to Trade ID: {structured_data['trade_id']}")
                    document.title = structured_data['trade_id']
                
                document.save()
                
                logger.info(f"Document {document.id} processed successfully")
                
                # Check if there was an error during processing
                if 'error' in structured_data:
                    logger.warning(f"Document {document.id} processed with errors: {structured_data.get('error')}")
                    return Response({
                        'structured_data': structured_data,
                        'warning': structured_data.get('error')
                    }, status=status.HTTP_200_OK)
                    
                return Response({
                    'structured_data': structured_data
                }, status=status.HTTP_200_OK)
                
            except Exception as processing_error:
                logger.error(f"Error processing document {document.id}: {str(processing_error)}")
                logger.error(traceback.format_exc())
                
                # Create default structured data with error
                default_data = {
                    'company_name': 'Not specified',
                    'funding_round': 'Not specified',
                    'pre_money_valuation': 'Not specified',
                    'amount_raised': 'Not specified',
                    'lead_investor': 'Not specified',
                    'error': f"Processing error: {str(processing_error)}"
                }
                
                # Update document with partial data and error status
                document.structured_data = default_data
                document.status = 'error'
                document.save()
                
                return Response({
                    'error': str(processing_error),
                    'structured_data': default_data
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            logger.error(f"Error in process action: {str(e)}")
            logger.error(traceback.format_exc())
            return Response({
                'error': f"Error processing document: {str(e)}",
                'structured_data': {
                    'company_name': 'Not specified',
                    'error': f"System error: {str(e)}"
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def validate(self, request, pk=None):
        """Validate a structured term sheet"""
        document = self.get_object()
        
        if document.status != 'processed' or not document.structured_data:
            return Response({
                "error": "Document must be processed first to extract structured data"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            structured_data = document.structured_data
            
            # Call the validation service
            validation_results = validate_term_sheet(structured_data)
            
            # Create a simplified version guaranteed to be SQLite-compatible
            simplified_results = {
                "overall_status": str(validation_results.get("overall_status", "uncertain")),
                "explanation": str(validation_results.get("explanation", "Validation completed")),
                "issues": [],
                "recommendations": str(validation_results.get("recommendations", ""))
            }
            
            # If there are issues, convert them to a simplified format
            if "issues" in validation_results and isinstance(validation_results["issues"], list):
                for issue in validation_results["issues"]:
                    if isinstance(issue, dict):
                        simplified_results["issues"].append({
                            "field": str(issue.get("field", "")),
                            "description": str(issue.get("description", "")),
                            "severity": str(issue.get("severity", "medium"))
                        })
            
            # Store as string first, then parse back to ensure SQLite compatibility
            json_string = json.dumps(simplified_results)
            document.validation_results = json.loads(json_string)
            document.status = 'validated'
            document.save()
            
            # Ensure the original validation results are also serializable (handle NaN values)
            def make_json_safe(obj):
                if isinstance(obj, dict):
                    return {k: make_json_safe(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [make_json_safe(item) for item in obj]
                elif isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
                    return str(obj)  # Convert NaN or Infinity to string
                elif obj is None or isinstance(obj, (str, int, bool, float)):
                    return obj
                else:
                    return str(obj)  # Convert any other non-serializable types to string
            
            safe_validation_results = make_json_safe(validation_results)
            
            # Test that the results are serializable
            try:
                json.dumps(safe_validation_results)
            except (TypeError, ValueError):
                # If serialization still fails despite our efforts, return a simpler response
                logger.error("Failed to serialize validation results despite sanitization")
                safe_validation_results = simplified_results
            
            # Return the sanitized validation results
            return Response({
                "document_id": document.id,
                "validation_results": safe_validation_results
            })
            
        except Exception as e:
            logger.error(f"Error validating document: {str(e)}")
            logger.error(traceback.format_exc())
            return Response({
                "error": f"Error validating document: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def destroy(self, request, pk=None, *args, **kwargs):
        """
        Delete a document if pk is provided, or all documents if pk is None and DELETE request is made to the list endpoint.
        """
        if pk is None and request.method == 'DELETE':
            # This is a DELETE request to the list endpoint - delete all documents
            try:
                logger.info("Deleting all documents")
                count, details = Document.objects.all().delete()
                logger.info(f"Deleted {count} documents: {details}")
                return Response(
                    {"message": f"Successfully deleted {count} documents"},
                    status=status.HTTP_200_OK
                )
            except Exception as e:
                logger.error(f"Error deleting all documents: {str(e)}")
                logger.error(traceback.format_exc())
                return Response(
                    {"error": f"Error deleting all documents: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            # This is a DELETE request to a specific document
            return super().destroy(request, *args, **kwargs)


class TermSheetDocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for term sheet documents"""
    queryset = TermSheetDocument.objects.all().order_by('-uploaded_at')
    parser_classes = (MultiPartParser, FormParser)
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TermSheetDocumentDetailSerializer
        return TermSheetDocumentSerializer
    
    def create(self, request, *args, **kwargs):
        # Get the uploaded file and its details
        file_obj = request.data.get('file')
        title = request.data.get('title', file_obj.name)
        
        # Get file extension from filename
        file_name = file_obj.name
        file_ext = file_name.split('.')[-1].lower() if '.' in file_name else ''
        
        # Create serializer with the file and detected type
        serializer = self.get_serializer(data={
            'title': title,
            'file': file_obj,
            'file_type': file_ext
        })
        
        if serializer.is_valid():
            document = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """Process a document to extract and structure its content"""
        document = self.get_object()
        
        # Update document status to processing
        document.status = 'processing'
        document.save()
        
        try:
            # Get the file path
            file_path = document.file.path
            file_type = document.file_type
            
            # Extract text from the file
            extracted_text = extract_text_from_file(file_path, file_type)
            
            # Process the text using Gemini API
            structured_data = process_extracted_text(extracted_text)
            
            # Create ExtractedTermSheet instance
            extracted_term_sheet = ExtractedTermSheet.objects.create(
                document=document,
                structured_data=structured_data
            )
            
            # Update document status to completed
            document.status = 'completed'
            
            # Set document title to trade_id if available
            if 'trade_id' in structured_data and structured_data['trade_id'] and structured_data['trade_id'] != 'Not specified':
                logger.info(f"Setting document title to Trade ID: {structured_data['trade_id']}")
                document.title = structured_data['trade_id']
                
            document.save()
            
            # Return the structured data
            return Response({
                'id': extracted_term_sheet.id,
                'structured_data': structured_data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            # Update document status to failed
            document.status = 'failed'
            document.save()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def validate(self, request, pk=None):
        """Validate a structured term sheet"""
        document = self.get_object()
        
        try:
            # Get the most recent extracted term sheet
            extracted_term_sheet = document.extracted_data.latest('extracted_at')
            structured_data = extracted_term_sheet.structured_data
            
            # Validate the structured data
            validation_results = validate_term_sheet(structured_data)
            
            # Create a simplified version for storage that's guaranteed to be SQLite-compatible
            simplified_results = {
                "overall_status": str(validation_results.get("overall_status", "uncertain")),
                "explanation": str(validation_results.get("explanation", "Validation completed")),
                "issues": [],
                "recommendations": str(validation_results.get("recommendations", ""))
            }
            
            # If there are issues, convert them to a simplified format
            if "issues" in validation_results and isinstance(validation_results["issues"], list):
                for issue in validation_results["issues"]:
                    if isinstance(issue, dict):
                        simplified_results["issues"].append({
                            "field": str(issue.get("field", "")),
                            "description": str(issue.get("description", "")),
                            "severity": str(issue.get("severity", "medium"))
                        })
            
            # Store as string first, then parse back to ensure SQLite compatibility
            json_string = json.dumps(simplified_results)
            parsed_json = json.loads(json_string)
            
            # Create ValidationResult instance
            validation_result = ValidationResult.objects.create(
                term_sheet=extracted_term_sheet,
                status=simplified_results.get('overall_status', 'uncertain'),
                validation_details=parsed_json
            )
            
            # Ensure the original validation results are also serializable (handle NaN values)
            def make_json_safe(obj):
                if isinstance(obj, dict):
                    return {k: make_json_safe(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [make_json_safe(item) for item in obj]
                elif isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
                    return str(obj)  # Convert NaN or Infinity to string
                elif obj is None or isinstance(obj, (str, int, bool, float)):
                    return obj
                else:
                    return str(obj)  # Convert any other non-serializable types to string
            
            safe_validation_results = make_json_safe(validation_results)
            
            # Test that the results are serializable
            try:
                json.dumps(safe_validation_results)
            except (TypeError, ValueError):
                # If serialization still fails despite our efforts, return a simpler response
                logger.error("Failed to serialize validation results despite sanitization")
                safe_validation_results = simplified_results
            
            # Return the sanitized validation results
            return Response({
                'id': validation_result.id,
                'validation_results': safe_validation_results
            }, status=status.HTTP_200_OK)
            
        except ExtractedTermSheet.DoesNotExist:
            return Response(
                {'error': 'No extracted term sheet data found for this document'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error validating document: {str(e)}")
            logger.error(traceback.format_exc())
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ExtractedTermSheetViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for extracted term sheets (read-only)"""
    queryset = ExtractedTermSheet.objects.all().order_by('-extracted_at')
    serializer_class = ExtractedTermSheetSerializer


class ValidationResultViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for validation results (read-only)"""
    queryset = ValidationResult.objects.all().order_by('-validated_at')
    serializer_class = ValidationResultSerializer
