from functools import wraps

from asgiref.sync import sync_to_async
from django.http import JsonResponse
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


def jwt_required(view_func):
    """Decorator that protects both sync and async Django views with JWT auth."""
    @wraps(view_func)
    async def wrapper(request, *args, **kwargs):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({'detail': 'Authentication required.'}, status=401)
        try:
            token_str = auth_header.split(' ')[1]
            jwt_auth = JWTAuthentication()
            # get_validated_token is pure (no DB) — safe to call directly
            validated_token = jwt_auth.get_validated_token(token_str)
            # get_user hits the DB — wrap with sync_to_async
            request.user = await sync_to_async(jwt_auth.get_user)(validated_token)
        except (InvalidToken, TokenError):
            return JsonResponse({'detail': 'Invalid or expired token.'}, status=401)
        return await view_func(request, *args, **kwargs)

    return wrapper