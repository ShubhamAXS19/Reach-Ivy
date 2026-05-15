import uuid
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_email_verified', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    # Remove username as the login field — use email instead
    username = models.CharField(max_length=150, blank=True)
    email = models.EmailField(unique=True)
    is_email_verified = models.BooleanField(default=False)
    # Single-use UUID token for email verification
    email_verification_token = models.UUIDField(default=uuid.uuid4, editable=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  # removes email from REQUIRED_FIELDS since it's USERNAME_FIELD

    objects = UserManager()

    def __str__(self):
        return self.email


# ========== NEW MODELS - Add these at the bottom ==========

class Conversation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)  # Only one active conversation per user
    essay_structure = models.JSONField(null=True, blank=True)
    current_stage = models.IntegerField(default=0)  # 0-4 (0=start, 4=essay ready)
    user_message_count = models.IntegerField(default=0)
    completed = models.BooleanField(default=False)  # Essay structure generated
    
    class Meta:
        ordering = ['-updated_at']
        # NO constraints here - SQLite doesn't support conditional unique constraints
    
    def __str__(self):
        return f"Conversation {self.id} - {self.user.email} ({'active' if self.is_active else 'archived'})"


class ConversationMessage(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=[('user', 'User'), ('assistant', 'Assistant')])
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."

class UserReport(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports')
    conversation = models.OneToOneField(Conversation, on_delete=models.CASCADE, related_name='report')
    recommended_domain = models.CharField(max_length=200)
    domain_confidence = models.FloatField()
    key_themes = models.JSONField()
    strengths = models.JSONField()
    suggested_majors = models.JSONField()
    problem_solving_style = models.CharField(max_length=500, blank=True, null=True)
    career_pathways = models.JSONField(default=list)
    exploration_suggestions = models.JSONField(default=list)
    summary_insight = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Report for {self.user.email} - {self.recommended_domain}"