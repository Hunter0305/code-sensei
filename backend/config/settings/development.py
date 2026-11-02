"""Development settings — uses SQLite for quick local dev without Docker."""
from .base import *  # noqa

DEBUG = True

# Allow all hosts in development
ALLOWED_HOSTS = ['*']

# Optionally override to SQLite for development without Docker
# Set USE_SQLITE=true in backend/.env
from decouple import config as _config
import os as _os
_USE_SQLITE = _config('USE_SQLITE', default='false').lower() == 'true'
if _USE_SQLITE:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Show SQL queries in console
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {'class': 'logging.StreamHandler'},
    },
    'loggers': {
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'WARNING',
        },
        'codesensei': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
