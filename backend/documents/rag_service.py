"""
Term Sheet RAG (Retrieval-Augmented Generation) Service

This module provides advanced RAG functionality for term sheet validation:
1. Loading reference term sheet data from CSV
2. Converting data to vector embeddings with spaCy
3. Storing and retrieving vectors with FAISS
4. Validation using OpenRouter LLM with reference data
"""

import os
import csv
import json
import pandas as pd
import numpy as np
import re
import spacy
import faiss
from django.conf import settings
import logging
from .llm_client import generate_content

logger = logging.getLogger(__name__)

# Initialize the spaCy model for embeddings (en_core_web_md = 300-dim GloVe vectors)
MODEL_NAME = 'en_core_web_md'
embedding_dim = 300  # Dimension of en_core_web_md word vectors

try:
    nlp = spacy.load(MODEL_NAME)
    logger.info(f"spaCy model '{MODEL_NAME}' loaded successfully")
except OSError:
    logger.warning(f"spaCy model '{MODEL_NAME}' not found. Run: python -m spacy download {MODEL_NAME}")
    nlp = None

# Global variables for vector store
index = None
reference_data = None
reference_embeddings = None


def _encode_texts(texts):
    """Encode a list of strings into numpy embedding matrix using spaCy."""
    vectors = []
    for text in texts:
        doc = nlp(text)
        vec = doc.vector  # 300-dim averaged word vector
        vectors.append(vec)
    return np.array(vectors, dtype='float32')


def _encode_single(text):
    """Encode a single string to a 1×300 float32 array."""
    return nlp(text).vector.astype('float32').reshape(1, -1)


def initialize_vector_store():
    """
    Initialize a vector store with reference data from CSV.
    Uses spaCy for creating embeddings and FAISS for indexing.
    """
    global index, reference_data, reference_embeddings

    if nlp is None:
        logger.error("spaCy model not loaded; cannot initialize vector store.")
        return False

    try:
        csv_path = os.path.join(settings.BASE_DIR, 'data', 'Validated_Term_Sheet_Data.csv')

        reference_data = pd.read_csv(csv_path)

        column_mapping = {
            'Trade Id': 'trade_id',
            'Trade Date': 'trade_date',
            'Reference Spot Price': 'reference_spot_price',
            'Notional Amount': 'notional_amount',
            'Strike Price': 'strike_price',
            'Call/Put': 'option_type',
            'Buying/Selling': 'position_type',
            'Expiry Date': 'expiry_date',
            'Business Calendar': 'business_calendar',
            'Delivery Date': 'delivery_date',
            'Premium Rate': 'premium_rate',
            'Transaction Currency (Transaction CCY)': 'transaction_currency',
            'Counter Currency (Counter CCY)': 'counter_currency',
            'Underlying Currency': 'underlying_currency'
        }

        reference_data.rename(columns=column_mapping, inplace=True)

        text_documents = []
        for idx, row in reference_data.iterrows():
            doc_content = row.to_json()
            text_documents.append(doc_content)

        reference_embeddings = _encode_texts(text_documents)

        index = faiss.IndexFlatL2(embedding_dim)
        index.add(reference_embeddings)

        logger.info(f"Vector store initialized with {len(reference_data)} reference documents")
        return True
    except Exception as e:
        logger.error(f"Error initializing vector store: {str(e)}")
        return False


# Initialize the vector store on module import
initialize_vector_store()


def search_similar_term_sheets(structured_data, top_k=3):
    """
    Search for similar trading term sheets in the reference data.
    """
    global index, reference_data, reference_embeddings

    if index is None or reference_data is None or reference_embeddings is None:
        logger.warning("Vector store not initialized, initializing now...")
        if not initialize_vector_store():
            return []

    try:
        trading_fields = {
            k: structured_data.get(k, "Not specified")
            for k in [
                "trade_id", "trade_date", "reference_spot_price",
                "notional_amount", "strike_price", "option_type",
                "position_type", "expiry_date", "business_calendar",
                "delivery_date", "premium_rate", "transaction_currency",
                "counter_currency", "underlying_currency"
            ]
        }

        query_text = json.dumps(trading_fields)
        query_embedding = _encode_single(query_text)

        distances, indices = index.search(query_embedding, top_k)

        results = []
        for i, (distance, idx) in enumerate(zip(distances[0], indices[0])):
            similarity = 1.0 / (1.0 + distance)
            ref_row = reference_data.iloc[idx]
            ref_data_dict = ref_row.to_dict()
            results.append({
                'reference_data': ref_data_dict,
                'reference_id': f'ref_{idx}',
                'similarity_score': float(similarity),
                'rank': i + 1
            })

        return results
    except Exception as e:
        logger.error(f"Error searching similar term sheets: {str(e)}")
        return []


def make_json_serializable(obj):
    """Recursively convert object to JSON-serializable types."""
    if isinstance(obj, dict):
        return {k: make_json_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [make_json_serializable(item) for item in obj]
    elif isinstance(obj, (str, int, float, bool, type(None))):
        return obj
    else:
        return str(obj)


def validate_term_sheet_with_rag(structured_data):
    """
    Validate a structured term sheet by finding similar reference term sheets
    and comparing key fields.
    """
    try:
        if not structured_data or not isinstance(structured_data, dict):
            return {
                "overall_status": "uncertain",
                "explanation": "No valid structured data provided for validation",
                "issues": []
            }

        similar_sheets = search_similar_term_sheets(structured_data, top_k=1)

        if not similar_sheets:
            return {
                "overall_status": "uncertain",
                "explanation": "No similar reference documents found for validation",
                "issues": []
            }

        best_match = similar_sheets[0]
        result_json = best_match['reference_data']
        reference_id = best_match['reference_id']
        similarity_score = best_match['similarity_score']

        comparison_summary = []
        ignored_fields = ['id']

        critical_fields = [
            "trade_id", "reference_spot_price", "notional_amount",
            "strike_price", "option_type", "position_type",
            "expiry_date", "transaction_currency", "counter_currency"
        ]

        def normalize_value(value):
            if value is None:
                return None

            if isinstance(value, str) and ("[TEXT CUTOFF]" in value or "[missing text]" in value):
                return "not_specified"

            if isinstance(value, str) and value.lower().strip() in ["not specified", "n/a", "none", "unknown", "-", ""]:
                return "not_specified"

            str_value = str(value).lower().strip()

            for char in [',', '$', '%', '(', ')', '"', "'", '£', '€', '¥', '[', ']']:
                str_value = str_value.replace(char, '')

            date_patterns = [
                (r'\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b', r'\3-\1-\2'),
                (r'\b(\d{4})[/-](\d{1,2})[/-](\d{1,2})\b', r'\1-\2-\3'),
                (r'\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b',
                 lambda m: f"{m.group(3)}-{month_to_num(m.group(1))}-{m.group(2).zfill(2)}")
            ]

            def month_to_num(month_name):
                month_map = {
                    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
                    'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
                    'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
                }
                return month_map.get(month_name[:3].lower(), '01')

            for pattern, replacement in date_patterns:
                if re.search(pattern, str_value):
                    try:
                        if callable(replacement):
                            str_value = re.sub(pattern, replacement, str_value)
                        else:
                            str_value = re.sub(pattern, replacement, str_value)
                        break
                    except Exception as e:
                        logger.warning(f"Date normalization error: {e}")

            if str_value in ["call", "c"]:
                str_value = "call"
            elif str_value in ["put", "p"]:
                str_value = "put"

            if str_value in ["buying", "buy", "long"]:
                str_value = "buying"
            elif str_value in ["selling", "sell", "short"]:
                str_value = "selling"

            str_value = ' '.join(str_value.split())
            return str_value

        def is_numeric(value):
            if value is None:
                return False
            clean_value = str(value)
            for char in [',', '$', '%', '(', ')', '"', "'", '£', '€', '¥', ' ']:
                clean_value = clean_value.replace(char, '')
            try:
                float(clean_value)
                return True
            except (ValueError, TypeError):
                return False

        def extract_numeric_value(value):
            if value is None:
                return None
            str_value = str(value)
            unit_pattern = r'^([\d,.]+)\s*[A-Za-z]+$'
            unit_match = re.match(unit_pattern, str_value.strip())
            if unit_match:
                str_value = unit_match.group(1)
            for char in [',', '$', '(', ')', '"', "'", '£', '€', '¥', ' ']:
                str_value = str_value.replace(char, '')
            if '%' in str_value:
                str_value = str_value.replace('%', '')
                try:
                    return float(str_value) / 100
                except (ValueError, TypeError):
                    return None
            try:
                return float(str_value)
            except (ValueError, TypeError):
                return None

        def numeric_match(val1, val2, tolerance=0.01):
            num1 = extract_numeric_value(val1)
            num2 = extract_numeric_value(val2)
            logger.debug(f"Comparing numeric values: {val1} -> {num1} vs {val2} -> {num2}")
            if num1 is None or num2 is None:
                return False
            if num1 == 0 and num2 == 0:
                return True
            if abs(num1 - num2) < 0.0000001:
                return True
            larger = max(abs(num1), abs(num2))
            diff = abs(num1 - num2)
            if larger < 0.001:
                return diff < 0.0001
            relative_diff = (diff / larger)
            logger.debug(f"Numeric comparison: diff={diff}, relative_diff={relative_diff:.4f}, tolerance={tolerance}")
            return relative_diff <= tolerance

        def semantic_similarity(str1, str2):
            if str1 is None or str2 is None:
                return False
            str1 = str(str1).lower().strip()
            str2 = str(str2).lower().strip()
            logger.debug(f"Comparing text values: '{str1}' vs '{str2}'")
            trading_synonyms = {
                "nyse": ["new york stock exchange", "new york", "us market"],
                "lse": ["london stock exchange", "london", "uk market"],
                "usd": ["dollar", "dollars", "us dollar", "us dollars", "$"],
                "eur": ["euro", "euros", "€"],
                "gbp": ["pound", "pounds", "british pound", "sterling", "£"],
                "jpy": ["yen", "japanese yen", "¥"],
                "call": ["c", "call option"],
                "put": ["p", "put option"],
                "buying": ["buy", "long", "purchase"],
                "selling": ["sell", "short", "writer"]
            }
            for key, synonyms in trading_synonyms.items():
                if (str1 == key and str2 in synonyms) or (str2 == key and str1 in synonyms):
                    logger.debug(f"Synonym match found: '{str1}' ~ '{str2}'")
                    return True
            if str1 == str2:
                return True
            if str1 in str2 or str2 in str1:
                logger.debug(f"Substring match found between '{str1}' and '{str2}'")
                return True
            common_chars = set(str1) & set(str2)
            similarity_ratio = len(common_chars) / min(len(str1), len(str2)) if min(len(str1), len(str2)) > 0 else 0
            if similarity_ratio > 0.7:
                logger.debug(f"Character similarity match found: '{str1}' ~ '{str2}' (ratio: {similarity_ratio:.2f})")
                return True
            return False

        match_count = 0
        mismatch_count = 0
        total_comparisons = 0

        trading_fields = [
            "trade_id", "trade_date", "reference_spot_price", "notional_amount",
            "strike_price", "option_type", "position_type", "expiry_date",
            "business_calendar", "delivery_date", "premium_rate",
            "transaction_currency", "counter_currency", "underlying_currency"
        ]

        logger.info("Starting field-by-field comparison")
        for key in trading_fields:
            extracted_value = structured_data.get(key)
            reference_value = result_json.get(key)

            logger.info(f"Comparing field '{key}': '{extracted_value}' vs '{reference_value}'")

            is_matched = False
            match_method = "unknown"

            if key in ignored_fields:
                is_matched = True
                match_method = "ignored field"
            elif normalize_value(extracted_value) == "not_specified" and normalize_value(reference_value) == "not_specified":
                is_matched = True
                match_method = "both not specified"
            elif extracted_value is None or reference_value is None:
                is_matched = extracted_value == reference_value
                match_method = "null comparison"
            elif key == "trade_id":
                extracted_clean = str(extracted_value).lower().strip()
                reference_clean = str(reference_value).lower().strip()
                is_matched = extracted_clean == reference_clean
                match_method = "trade_id exact match"
            elif key == "option_type":
                extracted_clean = str(extracted_value).lower().strip()
                reference_clean = str(reference_value).lower().strip()
                is_call = extracted_clean in ["call", "c", "call option", "callvar"]
                is_put = extracted_clean in ["put", "p", "put option", "putvar"]
                ref_is_call = reference_clean in ["call", "c", "call option", "callvar"]
                ref_is_put = reference_clean in ["put", "p", "put option", "putvar"]
                logger.debug(f"Option type normalization: '{extracted_value}' -> is_call={is_call}, is_put={is_put}")
                logger.debug(f"Reference normalization: '{reference_value}' -> is_call={ref_is_call}, is_put={ref_is_put}")
                is_matched = (is_call and ref_is_call) or (is_put and ref_is_put)
                if not is_matched:
                    is_matched = extracted_clean == reference_clean
                match_method = "option type match"
            elif key == "position_type":
                extracted_clean = str(extracted_value).lower().strip()
                reference_clean = str(reference_value).lower().strip()
                is_buying = extracted_clean in ["buying", "buy", "long", "purchase", "buyer"]
                is_selling = extracted_clean in ["selling", "sell", "short", "writer", "seller"]
                ref_is_buying = reference_clean in ["buying", "buy", "long", "purchase", "buyer"]
                ref_is_selling = reference_clean in ["selling", "sell", "short", "writer", "seller"]
                logger.debug(f"Position type normalization: '{extracted_value}' -> is_buying={is_buying}, is_selling={is_selling}")
                logger.debug(f"Reference normalization: '{reference_value}' -> is_buying={ref_is_buying}, is_selling={ref_is_selling}")
                is_matched = (is_buying and ref_is_buying) or (is_selling and ref_is_selling)
                if not is_matched:
                    is_matched = extracted_clean == reference_clean
                match_method = "position type match"
            elif key == "notional_amount":
                extracted_num = None
                reference_num = None
                if isinstance(extracted_value, str) and extracted_value:
                    extracted_match = re.search(r'([\d,\.]+)', extracted_value)
                    if extracted_match:
                        try:
                            extracted_num = float(extracted_match.group(1).replace(',', ''))
                        except ValueError:
                            pass
                if isinstance(reference_value, str) and reference_value:
                    reference_match = re.search(r'([\d,\.]+)', reference_value)
                    if reference_match:
                        try:
                            reference_num = float(reference_match.group(1).replace(',', ''))
                        except ValueError:
                            pass
                if extracted_num is not None and reference_num is not None:
                    logger.debug(f"Notional amount comparison: {extracted_value} -> {extracted_num} vs {reference_value} -> {reference_num}")
                    if abs(extracted_num - reference_num) < 0.01 * max(abs(extracted_num), abs(reference_num)):
                        is_matched = True
                        match_method = "numeric match with tolerance"
                else:
                    is_matched = (str(extracted_value).strip().lower() == str(reference_value).strip().lower())
                    match_method = "direct string match"
            elif key in ["reference_spot_price", "strike_price"] and is_numeric(extracted_value) and is_numeric(reference_value):
                is_matched = numeric_match(extracted_value, reference_value, tolerance=0.01)
                match_method = "numeric comparison"
            elif key == "premium_rate" and isinstance(extracted_value, str) and isinstance(reference_value, str):
                extracted_clean = str(extracted_value).replace(" ", "").lower()
                reference_clean = str(reference_value).replace(" ", "").lower()
                has_percent = "%" in extracted_clean and "%" in reference_clean
                if has_percent:
                    ext_num = extract_numeric_value(extracted_clean)
                    ref_num = extract_numeric_value(reference_clean)
                    if ext_num is not None and ref_num is not None:
                        is_matched = numeric_match(ext_num, ref_num, tolerance=0.01)
                        match_method = "percentage comparison"
                    else:
                        is_matched = semantic_similarity(extracted_clean, reference_clean)
                        match_method = "string similarity"
                else:
                    is_matched = semantic_similarity(extracted_clean, reference_clean)
                    match_method = "string similarity"
            elif key in ["trade_date", "expiry_date", "delivery_date"]:
                normalized_extracted = normalize_value(extracted_value)
                normalized_reference = normalize_value(reference_value)
                is_matched = normalized_extracted == normalized_reference
                match_method = "date comparison"
            else:
                normalized_extracted = normalize_value(extracted_value)
                normalized_reference = normalize_value(reference_value)
                is_matched = (normalized_extracted == normalized_reference or
                              semantic_similarity(normalized_extracted, normalized_reference))
                match_method = "semantic comparison"

            if is_matched:
                match_count += 1
                log_msg = f"✅ Field '{key}' MATCHED via {match_method}"
                if key in ["reference_spot_price", "notional_amount", "strike_price", "premium_rate"]:
                    log_msg += f" → extracted: {extracted_value} (type: {type(extracted_value).__name__}), reference: {reference_value} (type: {type(reference_value).__name__})"
                logger.info(log_msg)
            else:
                mismatch_count += 1
                log_msg = f"❌ Field '{key}' MISMATCHED: '{extracted_value}' (type: {type(extracted_value).__name__}) ≠ '{reference_value}' (type: {type(reference_value).__name__})"
                if key in ["reference_spot_price", "notional_amount", "strike_price", "premium_rate"]:
                    if isinstance(extracted_value, str) and isinstance(reference_value, str):
                        ext_num = extract_numeric_value(extracted_value)
                        ref_num = extract_numeric_value(reference_value)
                        log_msg += f"\n    Parsed numeric values: {ext_num} vs {ref_num}"
                        if ext_num is not None and ref_num is not None:
                            diff = abs(ext_num - ref_num)
                            rel_diff = diff / max(abs(ext_num), abs(ref_num)) if max(abs(ext_num), abs(ref_num)) > 0 else 0
                            log_msg += f"\n    Absolute difference: {diff}, Relative difference: {rel_diff:.6f}"
                logger.warning(log_msg)
            total_comparisons += 1

            comparison_summary.append({
                "field": key,
                "extracted_value": extracted_value,
                "reference_value": reference_value,
                "is_matched": is_matched,
                "match_method": match_method,
                "is_critical": key in critical_fields
            })

        refined_similarity = match_count / total_comparisons if total_comparisons > 0 else 0
        overall_similarity = (refined_similarity * 0.7) + (similarity_score * 0.3)

        validation_prompt = f"""
        You are a trading term sheet validator API. Compare the extracted term sheet data with reference data.

        EXTRACTED TERM SHEET: {json.dumps(structured_data, indent=2)}

        REFERENCE TERM SHEET: {json.dumps(result_json, indent=2)}

        COMPARISON SUMMARY: {json.dumps(comparison_summary, indent=2)}

        Additional Context:
        - Match Rate: {match_count}/{total_comparisons} fields match ({refined_similarity:.2%})
        - Vector Similarity Score: {similarity_score:.2%}
        - Overall Similarity: {overall_similarity:.2%}

        Based on the comparison:
        1. What is the overall validation status? (valid, invalid, uncertain)
        2. Provide a detailed explanation of your assessment.
        3. List any validation issues found (high, medium, low severity).
        4. Provide recommendations for addressing discrepancies.

        Important Guidelines:
        - Only count actual mismatches that would affect business decisions, not formatting differences.
        - For numeric values that are slightly different (within 1% tolerance), treat as valid.
        - For text fields that have minor variations or synonyms, treat as valid.
        - For each issue, explain exactly what was mismatched and how it should be corrected.

        Pay special attention to the following critical trading fields:
        - trade_id: Must match exactly (case-insensitive)
        - reference_spot_price: Critical price point, should match with minimal tolerance
        - notional_amount: Principal amount, must match within tolerance
        - strike_price: Critical for option pricing, must match within tolerance
        - option_type: Must be correctly identified as Call or Put
        - position_type: Must be correctly identified as Buying or Selling
        - expiry_date: Critical date that must match exactly

        You MUST return ONLY a valid JSON object with no other text, markdown formatting, or comments.
        Return your analysis as a JSON object with the following structure:
        {{
          "overall_status": "valid|invalid|uncertain",
          "explanation": "detailed explanation",
          "issues": [
            {{
              "field": "field_name",
              "description": "issue description - include both extracted and reference values",
              "severity": "high|medium|low",
              "correction": "how the field should be corrected"
            }}
          ],
          "recommendations": "recommendations to address issues"
        }}

        IMPORTANT: Return ONLY the JSON without any formatting, markdown code blocks, or additional text.
        """

        try:
            response_text_raw = generate_content(validation_prompt)

            try:
                response_text = response_text_raw.strip()
                if response_text.startswith("```json"):
                    response_text = response_text.split("```json")[1]
                if response_text.startswith("```"):
                    response_text = response_text.split("```")[1]
                if response_text.endswith("```"):
                    response_text = response_text.rsplit("```", 1)[0]

                response_text = response_text.strip()
                logger.debug(f"Cleaned response text: {response_text}")

                validation_result = json.loads(response_text)

                validation_result["rag_metadata"] = {
                    "reference_sheet_id": reference_id,
                    "similarity_score": overall_similarity,
                    "match_rate": f"{match_count}/{total_comparisons}",
                    "match_percentage": refined_similarity,
                    "comparison_summary": comparison_summary
                }

                try:
                    sanitized_result = make_json_serializable(validation_result)
                    json.dumps(sanitized_result)
                    return sanitized_result
                except (TypeError, ValueError) as json_err:
                    logger.error(f"Validation result not JSON serializable: {json_err}")
                    return {
                        "overall_status": validation_result.get("overall_status", "uncertain"),
                        "explanation": str(validation_result.get("explanation", "Validation completed but results aren't fully serializable")),
                        "issues": [],
                        "recommendations": "Review the term sheet details manually",
                        "rag_metadata": {
                            "reference_sheet_id": reference_id,
                            "similarity_score": float(overall_similarity),
                            "match_rate": f"{match_count}/{total_comparisons}",
                            "match_percentage": float(refined_similarity)
                        }
                    }
            except json.JSONDecodeError as json_err:
                logger.error(f"Failed to parse JSON from model response: {json_err}")
                logger.error(f"Raw response: {response_text_raw}")

                try:
                    lines = response_text_raw.split('\n')
                    overall_status = "uncertain"
                    explanation = "Validation processing error"

                    for line in lines:
                        if "valid" in line.lower():
                            overall_status = "valid"
                            break
                        elif "invalid" in line.lower():
                            overall_status = "invalid"
                            break

                    for i, line in enumerate(lines):
                        if "explanation" in line.lower() and i < len(lines) - 1:
                            explanation = lines[i + 1].strip()
                            break

                    return {
                        "overall_status": overall_status,
                        "explanation": explanation or "Unable to validate due to processing error",
                        "issues": [],
                        "raw_response": response_text_raw[:1000],
                        "rag_metadata": {
                            "reference_sheet_id": reference_id,
                            "similarity_score": similarity_score,
                            "comparison_summary": comparison_summary
                        }
                    }
                except Exception as extract_err:
                    logger.error(f"Error extracting from non-JSON response: {extract_err}")
                    return {
                        "overall_status": "uncertain",
                        "explanation": "Unable to validate due to processing error",
                        "issues": [],
                        "rag_metadata": {
                            "reference_sheet_id": reference_id,
                            "similarity_score": similarity_score,
                            "comparison_summary": comparison_summary
                        }
                    }

        except Exception as e:
            logger.error(f"Error generating validation with OpenRouter: {str(e)}")
            return {
                "overall_status": "uncertain",
                "explanation": f"Unable to validate due to AI service error: {str(e)}",
                "issues": []
            }

    except Exception as e:
        logger.error(f"Error in RAG validation: {str(e)}")
        return {
            "overall_status": "uncertain",
            "explanation": f"Error during validation process: {str(e)}",
            "issues": []
        }


def debug_rag_service():
    """Debug function to test RAG service functionality"""
    print("=== RAG Service Debug ===")

    print("\n1. Testing vector store initialization...")
    success = initialize_vector_store()
    if not success:
        print("Vector store initialization failed!")
        return

    print("\n2. Testing sample search...")
    sample_data = {
        "trade_id": "FX20240620",
        "trade_date": "2024-06-20",
        "reference_spot_price": "1.1050",
        "notional_amount": "2000000",
        "strike_price": "1.1100",
        "option_type": "Call",
        "position_type": "Buying",
        "expiry_date": "2024-09-20",
        "business_calendar": "NYSE",
        "delivery_date": "2024-09-22",
        "premium_rate": "2.2%",
        "transaction_currency": "EUR",
        "counter_currency": "USD",
        "underlying_currency": "EUR/USD"
    }

    similar_sheets = search_similar_term_sheets(sample_data, top_k=2)
    print(f"Found {len(similar_sheets)} similar term sheets")
    for i, sheet in enumerate(similar_sheets):
        print(f"Match {i+1}: Trade ID: {sheet['reference_data'].get('trade_id')} (Score: {sheet['similarity_score']:.4f})")

    print("\n3. Testing validation...")
    try:
        validation_results = validate_term_sheet_with_rag(sample_data)
        print(f"Validation status: {validation_results.get('overall_status', 'error')}")
        if 'error' in validation_results:
            print(f"Error: {validation_results['error']}")
        if 'explanation' in validation_results:
            print(f"Explanation: {validation_results['explanation']}")
        if 'issues' in validation_results and validation_results['issues']:
            print("Issues:")
            for issue in validation_results['issues']:
                print(f"  - {issue.get('field')}: {issue.get('description')} (Severity: {issue.get('severity')})")
    except Exception as e:
        print(f"Validation error: {str(e)}")

    print("\n=== Debug Complete ===")


if __name__ == "__main__":
    debug_rag_service()
