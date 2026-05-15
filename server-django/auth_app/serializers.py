from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import Conversation, ConversationMessage, UserReport

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, label='Confirm password')

    class Meta:
        model = User
        fields = ['email', 'password', 'password2']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'is_email_verified']
        read_only_fields = fields


class ConversationMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConversationMessage
        fields = ['id', 'role', 'content', 'created_at']


class UserReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserReport
        fields = ['id', 'recommended_domain', 'domain_confidence', 'key_themes', 
                  'strengths', 'suggested_majors', 'problem_solving_style', 
                  'career_pathways', 'exploration_suggestions', 'summary_insight', 'created_at']


class ConversationSerializer(serializers.ModelSerializer):
    messages = ConversationMessageSerializer(many=True, read_only=True)
    report = UserReportSerializer(read_only=True)  # Now UserReportSerializer is defined
    
    class Meta:
        model = Conversation
        fields = ['id', 'created_at', 'updated_at', 'is_active', 'essay_structure', 
                  'current_stage', 'user_message_count', 'completed', 'messages', 'report']
        read_only_fields = ['id', 'created_at', 'updated_at']


class SyncConversationSerializer(serializers.Serializer):
    messages = serializers.ListField(child=serializers.DictField(), required=True)
    essay_structure = serializers.DictField(required=False, allow_null=True)
    current_stage = serializers.IntegerField(min_value=0, max_value=4)
    user_message_count = serializers.IntegerField(min_value=0)