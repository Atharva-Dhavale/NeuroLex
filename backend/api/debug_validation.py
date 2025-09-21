"""
Debug script for testing term sheet extraction and validation

This script helps identify issues in the term sheet extraction and validation process
by providing verbose output and detailed logging.

Usage:
python manage.py shell < api/debug_validation.py
"""

import json
import os
import sys
import logging
import django
from datetime import datetime

# Set up Django environment
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(f'validation_debug_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log')
    ]
)

logger = logging.getLogger('validation_debug')

# Import required modules
try:
    from api.services import process_extracted_text
    from api.rag_service import validate_term_sheet_with_rag, initialize_vector_store
    from api.models import Document, ExtractedTermSheet
    logger.info("Successfully imported required modules")
except ImportError as e:
    logger.error(f"Error importing modules: {e}")
    sys.exit(1)

# Now import from Django app
from backend.api.rag_service import RAGService, search_similar_term_sheets, validate_term_sheet_with_rag

# Sample term sheet data for testing
sample_term_sheet = {
    "trade_id": "T001",
    "trade_date": "2025-04-01",
    "reference_spot_price": "1.1472",
    "notional_amount": "371410 USD",
    "strike_price": "1.5027",
    "option_type": "Put",
    "position_type": "Buying",
    "expiry_date": "2025-04-28",
    "business_calendar": "Following New York Business Calendar",
    "delivery_date": "2025-04-30",
    "premium_rate": "0.0464",
    "transaction_currency": "USD",
    "counter_currency": "EUR",
    "underlying_currency": "GBP"
}

def test_extraction_and_validation(text=None, document_id=None):
    """
    Test the extraction and validation process with a sample text or document ID
    
    Args:
        text (str, optional): Text to process
        document_id (int, optional): Document ID to retrieve
    """
    logger.info("=" * 80)
    logger.info("STARTING EXTRACTION AND VALIDATION TEST")
    logger.info("=" * 80)
    
    # Initialize RAG service
    logger.info("Initializing vector store...")
    if not initialize_vector_store():
        logger.error("Failed to initialize vector store! Aborting test.")
        return
    logger.info("Vector store initialized successfully.")
    
    # Get input text
    if document_id:
        try:
            document = Document.objects.get(id=document_id)
            text = document.extracted_text
            logger.info(f"Using text from document ID {document_id}, {len(text)} chars")
        except Document.DoesNotExist:
            logger.error(f"Document with ID {document_id} not found")
            return
        except Exception as e:
            logger.error(f"Error retrieving document: {e}")
            return
    elif not text:
        # Use sample text if none provided
        text = """
        TRADE CONFIRMATION
        
        Trade ID: FX20240615
        Trade Date: June 15, 2024
        
        TRADE DETAILS
        Reference Spot Price: 0.9250
        Notional Amount: 1,500,000
        Strike Price: 0.9300
        Option Type: Call
        Position: Selling
        
        SETTLEMENT INFORMATION
        Expiry Date: September 15, 2024
        Business Calendar: SIX
        Delivery Date: September 17, 2024
        Premium Rate: 1.5%
        
        CURRENCIES
        Transaction Currency: CHF
        Counter Currency: USD
        Underlying Currency Pair: USD/CHF
        """
        logger.info("Using sample text for testing")
    
    # Step 1: Extract structured data
    logger.info("-" * 80)
    logger.info("STEP 1: EXTRACTING STRUCTURED DATA")
    logger.info("-" * 80)
    
    structured_data = process_extracted_text(text)
    logger.info(f"Extraction complete. Found {len(structured_data)} fields.")
    logger.info(f"Structured data: {json.dumps(structured_data, indent=2)}")
    
    # Check for extraction issues
    missing_critical_fields = []
    for field in ['trade_id', 'reference_spot_price', 'notional_amount', 
                 'strike_price', 'option_type', 'position_type', 'expiry_date']:
        if field not in structured_data or structured_data[field] == "Not specified":
            missing_critical_fields.append(field)
    
    if missing_critical_fields:
        logger.warning(f"⚠️ Missing critical fields: {', '.join(missing_critical_fields)}")
    
    if "error" in structured_data:
        logger.error(f"❌ Extraction error: {structured_data['error']}")
    
    # Step 2: Validate the structured data
    logger.info("-" * 80)
    logger.info("STEP 2: VALIDATING STRUCTURED DATA")
    logger.info("-" * 80)
    
    validation_results = validate_term_sheet_with_rag(structured_data)
    logger.info(f"Validation complete. Status: {validation_results.get('overall_status', 'unknown')}")
    
    # Print validation summary
    logger.info(f"\nValidation explanation: {validation_results.get('explanation', 'No explanation provided')}")
    
    if 'issues' in validation_results and validation_results['issues']:
        logger.info("\nValidation issues:")
        for i, issue in enumerate(validation_results['issues'], 1):
            severity = issue.get('severity', 'unknown').upper()
            severity_marker = "🔴" if severity == "HIGH" else "🟠" if severity == "MEDIUM" else "🟡"
            logger.info(f"{severity_marker} Issue {i} ({severity}): {issue.get('field', 'unknown')} - {issue.get('description', 'No description')}")
            if 'correction' in issue:
                logger.info(f"   Correction: {issue['correction']}")
    else:
        logger.info("\nNo validation issues found.")
    
    if 'recommendations' in validation_results:
        logger.info(f"\nRecommendations: {validation_results['recommendations']}")
    
    # Print match summary
    if 'rag_metadata' in validation_results:
        metadata = validation_results['rag_metadata']
        logger.info(f"\nMatch rate: {metadata.get('match_rate', 'unknown')}")
        logger.info(f"Match percentage: {metadata.get('match_percentage', 0) * 100:.2f}%")
        logger.info(f"Similarity score: {metadata.get('similarity_score', 0) * 100:.2f}%")
        
        if 'comparison_summary' in metadata:
            logger.info("\nDetailed field comparison:")
            for comparison in metadata['comparison_summary']:
                field_name = comparison.get('field', 'unknown')
                is_matched = comparison.get('is_matched', False)
                is_critical = comparison.get('is_critical', False)
                status = "✅" if is_matched else "❌"
                critical_marker = "⭐" if is_critical else ""
                
                logger.info(f"{status} {critical_marker}{field_name}:")
                logger.info(f"   Extracted: {comparison.get('extracted_value', 'None')}")
                logger.info(f"   Reference: {comparison.get('reference_value', 'None')}")
                if 'match_method' in comparison:
                    logger.info(f"   Method: {comparison.get('match_method', 'unknown')}")
    
    logger.info("=" * 80)
    logger.info("TEST COMPLETE")
    logger.info("=" * 80)
    
    return {
        "structured_data": structured_data,
        "validation_results": validation_results
    }

def main():
    """Test the validation process with verbose logging"""
    print("Starting validation test...")
    
    # Initialize RAG service
    rag_service = RAGService(verbose=True)
    print(f"RAG Service initialized, vector store available: {rag_service.vector_store is not None}")
    
    # Test search function
    print("\n--- Testing search_similar_term_sheets ---")
    search_results = search_similar_term_sheets(sample_term_sheet)
    print(f"Found {len(search_results)} similar term sheets")
    
    # Inspect top match if available
    if search_results:
        top_match = search_results[0]
        print(f"Top match ID: {top_match.get('id')}")
        print(f"Similarity score: {top_match.get('similarity'):.4f}")
        
        # Check for critical fields in top match
        print("\nChecking critical fields in top match:")
        critical_fields = ['trade_id', 'reference_spot_price', 'notional_amount', 'strike_price', 
                          'option_type', 'position_type', 'expiry_date']
        for field in critical_fields:
            print(f"  {field}: {top_match.get('data', {}).get(field, 'N/A')}")
    
    # Test validation function
    print("\n--- Testing validate_term_sheet_with_rag ---")
    validation_result = validate_term_sheet_with_rag(sample_term_sheet)
    
    # Print validation status
    print(f"\nValidation status: {validation_result.get('overall_status', 'unknown')}")
    print(f"Explanation: {validation_result.get('explanation', 'No explanation provided')}")
    
    # Print issues if any
    issues = validation_result.get('issues', [])
    if issues:
        print(f"\nFound {len(issues)} issues:")
        for i, issue in enumerate(issues, 1):
            print(f"  Issue {i}: {issue.get('field')} - {issue.get('description')} (Severity: {issue.get('severity')})")
            print(f"    Correction: {issue.get('correction')}")
    else:
        print("\nNo issues found.")
    
    # Print RAG metadata
    rag_metadata = validation_result.get('rag_metadata', {})
    print("\nRAG Metadata:")
    print(f"  Reference sheet ID: {rag_metadata.get('reference_sheet_id', 'N/A')}")
    print(f"  Match rate: {rag_metadata.get('match_rate', 'N/A')}")
    print(f"  Match percentage: {rag_metadata.get('match_percentage', 0):.2%}")
    print(f"  Similarity score: {rag_metadata.get('similarity_score', 0):.2%}")
    
    # Print detailed comparison summary
    comparison_summary = rag_metadata.get('comparison_summary', [])
    if comparison_summary:
        print("\nDetailed Comparison Summary:")
        print("  Field               | Extracted Value    | Reference Value    | Match Status")
        print("  -------------------+-------------------+-------------------+-------------")
        for item in comparison_summary:
            field = item.get('field', 'unknown')
            extracted = str(item.get('extracted_value', 'N/A'))[:15]
            reference = str(item.get('reference_value', 'N/A'))[:15]
            is_matched = "✅" if item.get('is_matched', False) else "❌"
            is_critical = "*" if item.get('is_critical', False) else " "
            
            print(f"  {field:18}{is_critical} | {extracted:17} | {reference:17} | {is_matched} {item.get('match_method', '')}")

# Execute the main function if run directly
if __name__ == "__main__":
    main() 