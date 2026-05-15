import json
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from services.llm import get_chat_response, analyze_conversation_for_report
from services.stt import transcribe_audio
from services.tts import synthesize_speech
from config import settings
from .auth_utils import jwt_required

from auth_app.models import Conversation, UserReport
from asgiref.sync import sync_to_async


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


@csrf_exempt
@require_http_methods(["POST"])
@jwt_required
async def generate_report(request):
    """Generate a report for the active conversation"""
    try:
        print("=== GENERATE REPORT STARTED ===")

        # Get active conversation
        try:
            conversation = await sync_to_async(Conversation.objects.get)(
                user=request.user,
                is_active=True
            )
            print(f"Found conversation: {conversation.id}")
        except Conversation.DoesNotExist:
            print("No active conversation found")
            return JsonResponse({'detail': 'No active conversation found'}, status=404)

        # Mark conversation as completed
        conversation.completed = True
        conversation.is_active = False
        await sync_to_async(conversation.save)()

        # Get messages
        messages_qs = conversation.messages.all().order_by('created_at')
        messages = await sync_to_async(list)(
            messages_qs.values('role', 'content')
        )
        print(f"Found {len(messages)} messages")

        # Validate minimum conversation length
        if len(messages) < 4:
            return JsonResponse(
                {'detail': 'Not enough conversation to generate report'},
                status=400
            )

        # Check if report already exists
        existing_report = await sync_to_async(
            UserReport.objects.filter(conversation=conversation).first
        )()

        if existing_report:
            print("Returning existing report")
            return JsonResponse({
                'id': existing_report.id,
                'recommended_domain': existing_report.recommended_domain,
                'domain_confidence': existing_report.domain_confidence,
                'key_themes': existing_report.key_themes,
                'strengths': existing_report.strengths,
                'suggested_majors': existing_report.suggested_majors,
                'problem_solving_style': existing_report.problem_solving_style,
                'career_pathways': existing_report.career_pathways,
                'exploration_suggestions': existing_report.exploration_suggestions,
                'summary_insight': existing_report.summary_insight,
                'created_at': existing_report.created_at.isoformat()
            })

        # Format messages for analysis
        formatted_messages = [
            {'role': m['role'], 'content': m['content']}
            for m in messages
        ]

        # Analyze conversation
        analysis = await analyze_conversation_for_report(formatted_messages)
        print(f"Analysis result: {analysis.get('recommended_domain', 'Unknown')}")

        # Prepare report data
        report_data = {
            'user': request.user,
            'conversation': conversation,
            'recommended_domain': analysis.get('recommended_domain', 'Exploratory Studies'),
            'domain_confidence': analysis.get('domain_confidence', 0.5),
            'key_themes': analysis.get('key_themes', []),
            'strengths': analysis.get('strengths', []),
            'suggested_majors': analysis.get('suggested_majors', []),
            'problem_solving_style': analysis.get('problem_solving_style', ''),
            'career_pathways': analysis.get('career_pathways', []),
            'exploration_suggestions': analysis.get('exploration_suggestions', []),
            'summary_insight': analysis.get('summary_insight', ''),
        }

        # Save report
        report = await sync_to_async(UserReport.objects.create)(**report_data)
        print(f"Report saved with id: {report.id}")

        return JsonResponse({
            'id': report.id,
            'recommended_domain': report.recommended_domain,
            'domain_confidence': report.domain_confidence,
            'key_themes': report.key_themes,
            'strengths': report.strengths,
            'suggested_majors': report.suggested_majors,
            'problem_solving_style': report.problem_solving_style,
            'career_pathways': report.career_pathways,
            'exploration_suggestions': report.exploration_suggestions,
            'summary_insight': report.summary_insight,
            'created_at': report.created_at.isoformat()
        })

    except Exception as e:
        print(f"UNEXPECTED ERROR: {e}")
        import traceback
        traceback.print_exc()
        return JsonResponse({'detail': f'Server error: {str(e)}'}, status=500)