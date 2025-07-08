from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import requests
import json
import time
import logging
from datetime import datetime

from src.models.user import User, db
from src.models.chat import Chat
from src.models.message import Message

ai_bp = Blueprint('ai', __name__)
logger = logging.getLogger(__name__)

@ai_bp.route('/chat', methods=['POST'])
@jwt_required()
def chat_with_ai():
    """Envia mensagem para a IA e retorna resposta"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        data = request.get_json()
        chat_id = data.get('chat_id')
        message = data.get('message', '').strip()
        
        if not message:
            return jsonify({'error': 'Mensagem é obrigatória'}), 400
        
        if not chat_id:
            return jsonify({'error': 'ID do chat é obrigatório'}), 400
        
        # Buscar chat
        chat = Chat.query.filter_by(id=chat_id, user_id=user_id).first()
        if not chat:
            return jsonify({'error': 'Chat não encontrado'}), 404
        
        # Verificar limite diário
        if not user.can_create_chat():
            return jsonify({
                'error': 'Limite diário de chats atingido',
                'upgrade_required': True
            }), 429
        
        start_time = time.time()
        
        # Adicionar mensagem do usuário
        user_message = chat.add_message(message, 'user')
        
        # Obter contexto do chat
        context = chat.get_context_for_ai()
        
        # Gerar resposta da IA
        ai_response = generate_ai_response(context, message)
        
        if not ai_response:
            return jsonify({'error': 'Erro ao gerar resposta da IA'}), 500
        
        response_time = int((time.time() - start_time) * 1000)
        
        # Adicionar resposta da IA
        ai_message = chat.add_message(
            ai_response['content'],
            'ai',
            ai_model=ai_response['model'],
            tokens_used=ai_response.get('tokens_used', 0)
        )
        ai_message.response_time_ms = response_time
        
        # Analisar sentimento da mensagem do usuário
        sentiment = analyze_sentiment(message)
        if sentiment:
            user_message.update_sentiment(sentiment['score'], sentiment['label'])
        
        # Incrementar uso diário
        user.increment_daily_usage()
        
        # Atualizar atividade do usuário
        user.update_activity()
        
        return jsonify({
            'user_message': user_message.to_dict(),
            'ai_message': ai_message.to_dict(include_metadata=True),
            'response_time_ms': response_time,
            'remaining_chats': get_remaining_chats(user)
        }), 200
        
    except Exception as e:
        logger.error(f"Erro no chat com IA: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@ai_bp.route('/generate-challenge', methods=['POST'])
@jwt_required()
def generate_challenge():
    """Gera um novo desafio usando IA"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        # Verificar permissões (apenas desenvolvedores e professores)
        if user.role not in ['developer', 'teacher']:
            return jsonify({'error': 'Permissão negada'}), 403
        
        data = request.get_json()
        subject = data.get('subject')
        difficulty = data.get('difficulty')
        challenge_type = data.get('type', 'multiple_choice')
        topic = data.get('topic', '')
        
        if not subject or not difficulty:
            return jsonify({'error': 'Matéria e dificuldade são obrigatórias'}), 400
        
        # Gerar desafio usando IA
        challenge_data = generate_challenge_with_ai(subject, difficulty, challenge_type, topic)
        
        if not challenge_data:
            return jsonify({'error': 'Erro ao gerar desafio'}), 500
        
        return jsonify({
            'challenge': challenge_data,
            'message': 'Desafio gerado com sucesso'
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao gerar desafio: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@ai_bp.route('/analyze-sentiment', methods=['POST'])
@jwt_required()
def analyze_message_sentiment():
    """Analisa o sentimento de uma mensagem"""
    try:
        data = request.get_json()
        text = data.get('text', '').strip()
        
        if not text:
            return jsonify({'error': 'Texto é obrigatório'}), 400
        
        sentiment = analyze_sentiment(text)
        
        if not sentiment:
            return jsonify({'error': 'Erro ao analisar sentimento'}), 500
        
        return jsonify({'sentiment': sentiment}), 200
        
    except Exception as e:
        logger.error(f"Erro na análise de sentimento: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

def generate_ai_response(context, message):
    """Gera resposta usando IA (Gemini ou OpenAI)"""
    try:
        primary_api = current_app.config.get('CHAT_PRIMARY_API', 'gemini')
        
        if primary_api == 'gemini':
            response = call_gemini_api(context, message)
            if response:
                return response
        
        # Fallback para OpenAI
        secondary_api = current_app.config.get('CHAT_SECONDARY_API', 'openai')
        if secondary_api == 'openai':
            response = call_openai_api(context, message)
            if response:
                return response
        
        # Fallback para resposta padrão
        return generate_fallback_response(context, message)
        
    except Exception as e:
        logger.error(f"Erro ao gerar resposta da IA: {str(e)}")
        return generate_fallback_response(context, message)

def call_gemini_api(context, message):
    """Chama a API do Google Gemini"""
    try:
        api_key = current_app.config.get('GEMINI_API_KEY')
        if not api_key:
            logger.warning("Chave da API Gemini não configurada")
            return None
        
        # Construir prompt
        prompt = build_tutor_prompt(context, message)
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}"
        
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 1024,
            }
        }
        
        response = requests.post(url, json=payload, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            content = result['candidates'][0]['content']['parts'][0]['text']
            
            return {
                'content': content.strip(),
                'model': 'gemini-pro',
                'tokens_used': len(content.split()) * 1.3  # Estimativa
            }
        else:
            logger.error(f"Erro na API Gemini: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        logger.error(f"Erro ao chamar API Gemini: {str(e)}")
        return None

def call_openai_api(context, message):
    """Chama a API da OpenAI"""
    try:
        api_key = current_app.config.get('OPENAI_API_KEY')
        if not api_key:
            logger.warning("Chave da API OpenAI não configurada")
            return None
        
        # Construir mensagens
        messages = build_openai_messages(context, message)
        
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "gpt-3.5-turbo",
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 1024
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            content = result['choices'][0]['message']['content']
            tokens_used = result['usage']['total_tokens']
            
            return {
                'content': content.strip(),
                'model': 'gpt-3.5-turbo',
                'tokens_used': tokens_used
            }
        else:
            logger.error(f"Erro na API OpenAI: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        logger.error(f"Erro ao chamar API OpenAI: {str(e)}")
        return None

def generate_challenge_with_ai(subject, difficulty, challenge_type, topic):
    """Gera desafio usando IA (IA3 ou fallback)"""
    try:
        # Tentar usar IA3 API primeiro
        IA3_response = call_IA3_api_for_challenge(subject, difficulty, challenge_type, topic)
        if IA3_response:
            return IA3_response
        
        # Fallback para geração local
        return generate_fallback_challenge(subject, difficulty, challenge_type, topic)
        
    except Exception as e:
        logger.error(f"Erro ao gerar desafio: {str(e)}")
        return generate_fallback_challenge(subject, difficulty, challenge_type, topic)

def call_IA3_api_for_challenge(subject, difficulty, challenge_type, topic):
    """Chama a API do IA3 para gerar desafio"""
    try:
        api_key = current_app.config.get('IA3_API_KEY')
        if not api_key:
            logger.warning("Chave da API IA3 não configurada")
            return None
        
        # TODO: Implementar chamada real para API IA3
        # Por enquanto, retorna None para usar fallback
        return None
        
    except Exception as e:
        logger.error(f"Erro ao chamar API IA3: {str(e)}")
        return None

def analyze_sentiment(text):
    """Analisa sentimento do texto (implementação simplificada)"""
    try:
        # Implementação básica de análise de sentimento
        positive_words = ['bom', 'ótimo', 'excelente', 'legal', 'gostei', 'obrigado', 'parabéns']
        negative_words = ['ruim', 'péssimo', 'horrível', 'não gostei', 'difícil', 'complicado']
        
        text_lower = text.lower()
        
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        if positive_count > negative_count:
            return {'score': 0.7, 'label': 'positive'}
        elif negative_count > positive_count:
            return {'score': -0.7, 'label': 'negative'}
        else:
            return {'score': 0.0, 'label': 'neutral'}
            
    except Exception as e:
        logger.error(f"Erro na análise de sentimento: {str(e)}")
        return {'score': 0.0, 'label': 'neutral'}

def build_tutor_prompt(context, message):
    """Constrói prompt para o tutor IA"""
    subject_info = {
        'matematica': 'Matemática (álgebra, geometria, cálculo)',
        'portugues': 'Português (gramática, literatura, redação)',
        'historia': 'História (Brasil e mundial)',
        'geografia': 'Geografia (física e humana)',
        'ciencias': 'Ciências (biologia, física, química básica)',
        'ingles': 'Inglês (gramática, vocabulário, conversação)',
        'fisica': 'Física (mecânica, termodinâmica, eletromagnetismo)',
        'quimica': 'Química (orgânica, inorgânica, físico-química)',
        'biologia': 'Biologia (genética, ecologia, anatomia)',
        'filosofia': 'Filosofia (ética, lógica, história da filosofia)',
        'sociologia': 'Sociologia (sociedade, cultura, relações sociais)',
        'artes': 'Artes (história da arte, técnicas, expressão artística)',
        'informatica': 'Informática (programação, algoritmos, tecnologia)',
        'educacao-fisica': 'Educação Física (esportes, saúde, atividade física)'
    }
    
    subject_name = subject_info.get(context['subject'], context['subject'])
    user_name = context['user_info']['name']
    difficulty = context['difficulty_level']
    
    prompt = f"""Você é um tutor especializado em {subject_name}, conversando com {user_name}.

Nível de dificuldade: {difficulty}
Idade do estudante: {context['user_info'].get('age', 'não informada')}

Instruções:
1. Seja didático e paciente
2. Adapte a linguagem ao nível de dificuldade
3. Use exemplos práticos e relevantes
4. Incentive o aprendizado
5. Seja claro e objetivo
6. Se não souber algo, seja honesto

Pergunta do estudante: {message}

Responda de forma educativa e encorajadora:"""
    
    return prompt

def build_openai_messages(context, message):
    """Constrói mensagens para OpenAI"""
    system_message = build_tutor_prompt(context, "")
    
    messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": message}
    ]
    
    # Adicionar contexto de mensagens recentes
    for msg in context['recent_messages'][-5:]:  # Últimas 5 mensagens
        if msg['sender'] == 'user':
            messages.append({"role": "user", "content": msg['content']})
        else:
            messages.append({"role": "assistant", "content": msg['content']})
    
    return messages

def generate_fallback_response(context, message):
    """Gera resposta padrão quando APIs não estão disponíveis"""
    subject_responses = {
        'matematica': 'Ótima pergunta sobre matemática! Vou explicar passo a passo para você entender melhor.',
        'portugues': 'Excelente dúvida sobre português! Vamos esclarecer isso juntos.',
        'historia': 'Interessante questão histórica! Deixe-me contextualizar isso para você.',
        'geografia': 'Boa pergunta sobre geografia! Vou explicar de forma clara e didática.',
        'ciencias': 'Pergunta muito boa sobre ciências! Vamos explorar esse conceito.',
        'ingles': 'Great question about English! Let me explain this clearly.',
        'fisica': 'Excelente pergunta sobre física! Vou demonstrar com exemplos práticos.',
        'quimica': 'Ótima dúvida sobre química! Vamos analisar isso detalhadamente.',
        'biologia': 'Interessante questão sobre biologia! Vou explicar de forma didática.',
        'filosofia': 'Profunda questão filosófica! Vamos refletir sobre isso juntos.',
        'sociologia': 'Importante questão sociológica! Vou contextualizar para você.',
        'artes': 'Bela pergunta sobre artes! Vamos explorar esse aspecto criativo.',
        'informatica': 'Excelente pergunta sobre informática! Vou explicar tecnicamente.',
        'educacao-fisica': 'Boa pergunta sobre educação física! Vamos abordar isso praticamente.'
    }
    
    subject = context.get('subject', 'geral')
    response = subject_responses.get(subject, 'Ótima pergunta! Vou ajudá-lo a entender melhor.')
    
    return {
        'content': response,
        'model': 'fallback',
        'tokens_used': 0
    }

def generate_fallback_challenge(subject, difficulty, challenge_type, topic):
    """Gera desafio padrão quando IA não está disponível"""
    challenges = {
        'matematica': {
            'title': 'Operações Básicas',
            'description': 'Resolva a operação matemática',
            'question_data': {
                'question': 'Quanto é 15 + 27?',
                'options': ['40', '42', '44', '46'],
                'type': 'multiple_choice'
            },
            'correct_answer': {'correct_option': 1},
            'explanation': '15 + 27 = 42'
        },
        'portugues': {
            'title': 'Gramática Básica',
            'description': 'Identifique a classe gramatical',
            'question_data': {
                'question': 'Na frase "O gato subiu no telhado", qual é o sujeito?',
                'options': ['O gato', 'subiu', 'no telhado', 'telhado'],
                'type': 'multiple_choice'
            },
            'correct_answer': {'correct_option': 0},
            'explanation': 'O sujeito é "O gato", pois é quem pratica a ação de subir.'
        }
    }
    
    default_challenge = challenges.get(subject, challenges['matematica'])
    default_challenge['subject'] = subject
    default_challenge['difficulty_level'] = difficulty
    default_challenge['challenge_type'] = challenge_type
    
    return default_challenge

def get_remaining_chats(user):
    """Retorna o número de chats restantes para o usuário"""
    if user.is_pro:
        return 'unlimited'
    
    from src.models.user import DailyUsage
    today = datetime.utcnow().date()
    usage = DailyUsage.query.filter_by(user_id=user.id, date=today).first()
    
    used = usage.chats_created if usage else 0
    return max(0, 5 - used)

