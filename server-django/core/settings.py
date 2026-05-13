from pathlib import Path
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('DJANGO_SECRET_KEY', default='dev-secret-key-change-in-prod')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.staticfiles',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
]

ROOT_URLCONF = 'core.urls'
ASGI_APPLICATION = 'core.asgi.application'

CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'https://reach-ivy.vercel.app',
]

DATABASES = {}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'