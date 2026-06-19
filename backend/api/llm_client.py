"""
OpenRouter LLM client for NeuroLex.

Replaces the previous Gemini integration. Uses the OpenRouter chat completions
API with the configured model (default: openai/gpt-oss-120b:free).
"""

import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)


def generate_content(prompt: str, temperature: float = 0.2, timeout: int = 120) -> str:
    """
    Send a prompt to OpenRouter and return the model's text response.

    Args:
        prompt: The user prompt to send.
        temperature: Sampling temperature.
        timeout: Request timeout in seconds.

    Returns:
        The text content of the model response.

    Raises:
        RuntimeError: If the API key is missing or the request fails.
    """
    api_key = settings.OPENROUTER_API_KEY
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY is not set in settings/environment")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        # Optional attribution headers recommended by OpenRouter
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "NeuroLex Term Sheet Processor",
    }

    payload = {
        "model": settings.OPENROUTER_MODEL,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": temperature,
    }

    try:
        response = requests.post(
            settings.OPENROUTER_BASE_URL,
            headers=headers,
            json=payload,
            timeout=timeout,
        )
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        logger.error(f"OpenRouter request failed: {e}")
        # Include response body if available for easier debugging
        body = ""
        try:
            body = response.text  # noqa: F821
        except Exception:
            pass
        raise RuntimeError(f"OpenRouter API error: {e} {body}")

    try:
        data = response.json()
    except ValueError as e:
        raise RuntimeError(f"OpenRouter returned non-JSON response: {response.text[:500]}")

    # Surface API-level errors returned with a 200 status
    if "error" in data and data.get("error"):
        err = data["error"]
        msg = err.get("message", str(err)) if isinstance(err, dict) else str(err)
        raise RuntimeError(f"OpenRouter API error: {msg}")

    try:
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as e:
        raise RuntimeError(f"Unexpected OpenRouter response shape: {str(data)[:500]}")

    return content or ""
