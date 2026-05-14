import json
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from services.llm import get_chat_response
from services.stt import transcribe_audio
from services.tts import synthesize_speech
from config import settings
from .auth_utils import jwt_required 


@csrf_exempt
@require_http_methods(["POST"])
async def chat(request):
    try:
        body = json.loads(request.body)
        messages_data = body.get('messages', [])

        if not messages_data:
            return JsonResponse({'detail': 'messages array cannot be empty'}, status=400)

        class Msg:
            def __init__(self, d):
                self.role = d['role']
                self.content = d['content']

        messages = [Msg(m) for m in messages_data]
        message, essay_structure = await get_chat_response(messages)

        return JsonResponse({
            'message': message,
            'essay_structure': essay_structure.model_dump() if essay_structure else None,
        })

    except Exception as e:
        return JsonResponse({'detail': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
async def speech_to_text(request):
    ALLOWED_TYPES = {"audio/webm", "audio/mp4", "audio/wav", "audio/ogg", "audio/mpeg"}

    audio_file = request.FILES.get('audio')
    if not audio_file:
        return JsonResponse({'detail': 'No audio file provided'}, status=400)

    if audio_file.content_type and audio_file.content_type not in ALLOWED_TYPES:
        return JsonResponse(
            {'detail': f'Unsupported audio type: {audio_file.content_type}'},
            status=415
        )

    try:
        audio_bytes = audio_file.read()
        transcript = await transcribe_audio(
            audio_bytes,
            filename=audio_file.name or 'audio.webm'
        )
        return JsonResponse({'transcript': transcript})
    except Exception as e:
        return JsonResponse({'detail': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
async def text_to_speech(request):
    try:
        body = json.loads(request.body)
        text = body.get('text', '').strip()

        if not text:
            return JsonResponse({'detail': 'text cannot be empty'}, status=400)

        audio_bytes = await synthesize_speech(text)

        if audio_bytes is None:
            return HttpResponse(status=204)

        return HttpResponse(audio_bytes, content_type='audio/mpeg')

    except Exception as e:
        return JsonResponse({'detail': str(e)}, status=500)


async def health(request):
    return JsonResponse({'status': 'ok', 'tts_provider': settings.TTS_PROVIDER})