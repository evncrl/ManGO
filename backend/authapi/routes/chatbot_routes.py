from flask import Blueprint, current_app, request, jsonify
import requests
import os

chatbot_bp = Blueprint('chatbot', __name__)

SYSTEM_PROMPT = """You are the official ManGO AI Assistant, an agricultural expert specialized strictly in Philippine mangoes (such as Carabao/Manila Super Mango, Pico, and Indian mango).

Your scope is exclusively:
- Mango cultivation, tree care, fertilization, irrigation, and flower induction.
- Pest and disease management (e.g., Anthracnose, Stem-end rot, Fruit flies, Mango leafhoppers).
- Philippine National Standards (PNS/BAFS) for grading, maturity stages, defect tolerances, and export quality.
- Features of the ManGO application (Scanner, Market Shop, Forum).

STRICT RESPONSE RULES:
1. LANGUAGE AND TONE:
   - Always respond in clear, professional, and accessible ENGLISH whenever answering valid mango-related topics or ManGO app questions.
   - Do NOT start valid mango answers with an apology or refusal phrase. Answer the question directly and helpfully.

2. TOPIC GUARDRAIL & REFUSAL:
   - ONLY decline if the user asks about non-mango topics (e.g., coding, gaming, politics, math, general trivia, or unrelated fruits).
   - If declining, politely state: "I apologize, but I am specifically designed to assist only with Philippine mango cultivation, disease management, grading standards, and ManGO app features. How can I help you with your mangoes today?"

3. FORMATTING RESTRICTIONS:
   - NEVER use markdown tables (do NOT use '|' pipes or '---' dividers). The React Native chat interface cannot render tables properly.
   - Use structured bullet points (- or •) with bold headings for steps, lists, and key points.
   - Keep answers practical, actionable, and concise.

4. FACTUAL ACCURACY:
   - Use verified agricultural guidelines from the Bureau of Agriculture and Fisheries Standards (DA-BAFS) and DOST-PCAARRD.
   - Standard export harvesting maturity for Carabao mango is 110–120 days after flower induction (DAFI) with an optimal ripe sweetness of 12–16 °Brix."""


@chatbot_bp.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json(silent=True)
        if not isinstance(data, dict) or not isinstance(data.get('messages'), list):
            return jsonify({
                'success': False,
                'error': 'Request must contain a messages array'
            }), 400

        messages = []
        for message in data['messages']:
            if not isinstance(message, dict):
                return jsonify({
                    'success': False,
                    'error': 'Each message must be an object'
                }), 400
            role = message.get('role')
            content = message.get('content')
            if role not in ('user', 'assistant') or not isinstance(content, str):
                return jsonify({
                    'success': False,
                    'error': 'Each message must have a user or assistant role and text content'
                }), 400
            messages.append({'role': role, 'content': content})

        if not any(message['role'] == 'user' for message in messages):
            return jsonify({
                'success': False,
                'error': 'At least one user message is required'
            }), 400
        
        # Get Groq API key from environment
        api_key = os.getenv('GROQ_API_KEY')
        if not api_key:
            current_app.logger.warning('GROQ_API_KEY is not configured')
            return jsonify({
                'success': False,
                'error': 'Chat service is not configured. Please contact support.'
            }), 500
        
        # Call Groq API
        response = requests.post(
            'https://api.groq.com/openai/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            },
            json={
                'model': 'openai/gpt-oss-20b',
                'messages': [
                    {'role': 'system', 'content': SYSTEM_PROMPT},
                    *messages
                ],
                'max_tokens': 1000,
                'temperature': 0.7
            },
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            return jsonify({
                'success': True,
                'message': result['choices'][0]['message']['content']
            })
        else:
            current_app.logger.error(
                'Chat provider returned HTTP %s: %s',
                response.status_code,
                response.text
            )
            return jsonify({
                'success': False,
                'error': (
                    f'Chat provider request failed (HTTP {response.status_code}). '
                    'Please try again later.'
                )
            }), 502
            
    except requests.RequestException:
        current_app.logger.exception('Chat provider request failed')
        return jsonify({
            'success': False,
            'error': 'Chat service is temporarily unavailable. Please try again later.'
        }), 502
    except Exception:
        current_app.logger.exception('Unexpected chatbot error')
        return jsonify({
            'success': False,
            'error': 'Chat service encountered an unexpected error'
        }), 500
