from django.urls import path
from . import views

# Update your urlpatterns:

urlpatterns = [
    path('chat', views.chat),
    path('stt', views.speech_to_text),
    path('tts', views.text_to_speech),
    path('health', views.health),
    path('report/generate', views.generate_report),  # NEW
]