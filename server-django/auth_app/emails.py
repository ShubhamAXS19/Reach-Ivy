from django.conf import settings
from django.core.mail import send_mail


def send_verification_email(user):
    token = str(user.email_verification_token)
    url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    send_mail(
        subject='Verify your HelloIvy email',
        message=f'Hi! Click the link below to verify your email:\n\n{url}\n\nThis link does not expire.',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


def send_password_reset_email(user, uid, token):
    url = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
    send_mail(
        subject='Reset your HelloIvy password',
        message=f'Click the link below to reset your password:\n\n{url}\n\nThis link expires in 1 hour.',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )