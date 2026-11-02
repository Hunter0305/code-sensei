"""
Ollama Client — Wrapper for the local Ollama REST API.
Supports both synchronous and streaming completions.
"""
import json
import logging
import urllib.request
import urllib.error
from typing import Generator

from django.conf import settings

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = getattr(settings, 'OLLAMA_BASE_URL', 'http://localhost:11434')
OLLAMA_MODEL    = getattr(settings, 'OLLAMA_MODEL',    'mistral')
TIMEOUT         = getattr(settings, 'OLLAMA_TIMEOUT',  120)


def is_ollama_available() -> bool:
    """Check whether the local Ollama server is running."""
    try:
        req = urllib.request.Request(f'{OLLAMA_BASE_URL}/api/tags', method='GET')
        with urllib.request.urlopen(req, timeout=3):
            return True
    except Exception:
        return False


def _build_request(messages: list[dict], stream: bool = False) -> urllib.request.Request:
    payload = {
        'model':    OLLAMA_MODEL,
        'messages': messages,
        'stream':   stream,
        'options':  {
            'temperature': 0.7,
            'num_predict': 1024,
        },
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        f'{OLLAMA_BASE_URL}/api/chat',
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST',
    )
    return req


def chat_completion(messages: list[dict]) -> str:
    """
    Synchronous single-response completion.
    Returns the full assistant message content as a string.
    """
    req = _build_request(messages, stream=False)
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            body = json.loads(resp.read())
            return body['message']['content']
    except urllib.error.URLError as e:
        logger.error('Ollama request failed: %s', e)
        raise ConnectionError(
            'Could not connect to Ollama. Make sure it is running with '
            f'`ollama serve` and the model `{OLLAMA_MODEL}` is pulled.'
        ) from e
    except (KeyError, json.JSONDecodeError) as e:
        logger.error('Ollama response parse error: %s', e)
        raise ValueError('Unexpected response from Ollama.') from e


def chat_completion_stream(messages: list[dict]) -> Generator[str, None, None]:
    """
    Streaming completion — yields text chunks as they arrive.
    Each yielded value is a plain-text fragment (not JSON).
    """
    req = _build_request(messages, stream=True)
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            for raw_line in resp:
                line = raw_line.decode('utf-8').strip()
                if not line:
                    continue
                try:
                    chunk = json.loads(line)
                    token = chunk.get('message', {}).get('content', '')
                    if token:
                        yield token
                    if chunk.get('done'):
                        break
                except json.JSONDecodeError:
                    continue
    except urllib.error.URLError as e:
        logger.error('Ollama streaming request failed: %s', e)
        yield '\n\n[⚠️ Could not connect to Ollama. Please ensure the local server is running.]'
