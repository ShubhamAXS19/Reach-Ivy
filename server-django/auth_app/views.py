from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .emails import send_password_reset_email, send_verification_email
from .serializers import RegisterSerializer, UserSerializer

User = get_user_model()


# ── Sign up ───────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = serializer.save()
    try:
        send_verification_email(user)
    except Exception as e:
        # Don't fail registration if email sending fails — log and continue
        print(f'[email] Failed to send verification email: {e}')

    return Response(
        {'message': 'Account created. Please check your email to verify your account.'},
        status=status.HTTP_201_CREATED,
    )


# ── Login ─────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '')

    if not email or not password:
        return Response({'detail': 'Email and password are required.'}, status=400)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'detail': 'Invalid email or password.'}, status=401)

    if not user.check_password(password):
        return Response({'detail': 'Invalid email or password.'}, status=401)

    if not user.is_email_verified:
        return Response({'detail': 'Please verify your email before logging in.'}, status=403)

    refresh = RefreshToken.for_user(user)
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data,
    })


# ── Logout ────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    refresh_token = request.data.get('refresh')
    if not refresh_token:
        return Response({'detail': 'Refresh token is required.'}, status=400)
    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
    except TokenError:
        # Token already invalid — treat as successful logout
        pass
    return Response({'message': 'Logged out successfully.'})


# ── Current user ──────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


# ── Email verification ────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    token = request.data.get('token', '').strip()
    if not token:
        return Response({'detail': 'Token is required.'}, status=400)

    try:
        user = User.objects.get(email_verification_token=token)
    except (User.DoesNotExist, Exception):
        return Response({'detail': 'Invalid or expired verification link.'}, status=400)

    if user.is_email_verified:
        return Response({'message': 'Email already verified.'})

    user.is_email_verified = True
    user.save(update_fields=['is_email_verified'])
    return Response({'message': 'Email verified successfully. You can now log in.'})


# ── Forgot password ───────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    email = request.data.get('email', '').strip().lower()
    if not email:
        return Response({'detail': 'Email is required.'}, status=400)

    # Always return success to avoid leaking which emails are registered
    try:
        user = User.objects.get(email=email)
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        send_password_reset_email(user, uid, token)
    except User.DoesNotExist:
        pass
    except Exception as e:
        print(f'[email] Failed to send password reset email: {e}')

    return Response({'message': 'If that email is registered, a reset link has been sent.'})


# ── Reset password ────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    uid = request.data.get('uid', '')
    token = request.data.get('token', '')
    password = request.data.get('password', '')

    if not all([uid, token, password]):
        return Response({'detail': 'uid, token and password are required.'}, status=400)

    try:
        user_pk = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_pk)
    except Exception:
        return Response({'detail': 'Invalid reset link.'}, status=400)

    if not default_token_generator.check_token(user, token):
        return Response({'detail': 'Reset link has expired. Please request a new one.'}, status=400)

    user.set_password(password)
    user.save(update_fields=['password'])
    return Response({'message': 'Password reset successfully. You can now log in.'})