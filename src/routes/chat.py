from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import logging

from src.models.user import User, db
from src.models.chat import Chat
from src.models.message import Message, GlobalMemory

chat_bp = Blueprint('chat', __name__)
logger = logging.getLogger(__name__)

@chat_bp.route('/', methods=['GET'])
@jwt_required()
def get_user_chats():
    """Retorna todos os chats do usuário"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        chats = Chat.query.filter_by(user_id=user_id, is_active=True).order_by(Chat.updated_at.desc()).all()
        
        return jsonify({
            'chats': [chat.to_dict() for chat in chats],
            'total': len(chats)
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao buscar chats: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@chat_bp.route('/', methods=['POST'])
@jwt_required()
def create_chat():
    """Cria um novo chat"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        # Verificar limite diário
        if not user.can_create_chat():
            return jsonify({
                'error': 'Limite diário de chats atingido',
                'upgrade_required': True
            }), 429
        
        data = request.get_json()
        name = data.get('name', '').strip()
        subject = data.get('subject', '').strip()
        description = data.get('description', '').strip()
        
        if not name or not subject:
            return jsonify({'error': 'Nome e matéria são obrigatórios'}), 400
        
        # Criar chat
        chat = Chat(
            user_id=user_id,
            name=name,
            subject=subject,
            description=description,
            difficulty_level=data.get('difficulty_level')
        )
        
        db.session.add(chat)
        db.session.commit()
        
        # Atualizar estatísticas do usuário
        user.total_chats += 1
        user.increment_daily_usage()
        
        logger.info(f"Chat criado: {chat.id} - {name}")
        
        return jsonify({
            'message': 'Chat criado com sucesso',
            'chat': chat.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Erro ao criar chat: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@chat_bp.route('/<int:chat_id>', methods=['GET'])
@jwt_required()
def get_chat(chat_id):
    """Retorna um chat específico com suas mensagens"""
    try:
        user_id = get_jwt_identity()
        
        chat = Chat.query.filter_by(id=chat_id, user_id=user_id).first()
        if not chat:
            return jsonify({'error': 'Chat não encontrado'}), 404
        
        return jsonify({
            'chat': chat.to_dict(include_messages=True)
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao buscar chat: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@chat_bp.route('/<int:chat_id>', methods=['PUT'])
@jwt_required()
def update_chat(chat_id):
    """Atualiza informações do chat"""
    try:
        user_id = get_jwt_identity()
        
        chat = Chat.query.filter_by(id=chat_id, user_id=user_id).first()
        if not chat:
            return jsonify({'error': 'Chat não encontrado'}), 404
        
        data = request.get_json()
        
        # Atualizar campos permitidos
        if 'name' in data:
            chat.name = data['name'].strip()
        
        if 'description' in data:
            chat.description = data['description'].strip()
        
        if 'difficulty_level' in data:
            chat.difficulty_level = data['difficulty_level']
        
        chat.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Chat atualizado com sucesso',
            'chat': chat.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao atualizar chat: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@chat_bp.route('/<int:chat_id>', methods=['DELETE'])
@jwt_required()
def delete_chat(chat_id):
    """Deleta um chat"""
    try:
        user_id = get_jwt_identity()
        
        chat = Chat.query.filter_by(id=chat_id, user_id=user_id).first()
        if not chat:
            return jsonify({'error': 'Chat não encontrado'}), 404
        
        # Soft delete
        chat.is_active = False
        chat.updated_at = datetime.utcnow()
        db.session.commit()
        
        logger.info(f"Chat deletado: {chat_id}")
        
        return jsonify({'message': 'Chat deletado com sucesso'}), 200
        
    except Exception as e:
        logger.error(f"Erro ao deletar chat: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@chat_bp.route('/<int:chat_id>/messages', methods=['GET'])
@jwt_required()
def get_chat_messages(chat_id):
    """Retorna mensagens de um chat"""
    try:
        user_id = get_jwt_identity()
        
        chat = Chat.query.filter_by(id=chat_id, user_id=user_id).first()
        if not chat:
            return jsonify({'error': 'Chat não encontrado'}), 404
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        messages = Message.query.filter_by(
            chat_id=chat_id,
            is_deleted=False
        ).order_by(Message.created_at.asc()).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        return jsonify({
            'messages': [msg.to_dict() for msg in messages.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': messages.total,
                'pages': messages.pages,
                'has_next': messages.has_next,
                'has_prev': messages.has_prev
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao buscar mensagens: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@chat_bp.route('/<int:chat_id>/messages', methods=['POST'])
@jwt_required()
def add_message_to_chat(chat_id):
    """Adiciona uma mensagem ao chat"""
    try:
        user_id = get_jwt_identity()
        
        chat = Chat.query.filter_by(id=chat_id, user_id=user_id).first()
        if not chat:
            return jsonify({'error': 'Chat não encontrado'}), 404
        
        data = request.get_json()
        content = data.get('content', '').strip()
        sender = data.get('sender', 'user')
        
        if not content:
            return jsonify({'error': 'Conteúdo da mensagem é obrigatório'}), 400
        
        if sender not in ['user', 'ai']:
            return jsonify({'error': 'Sender deve ser "user" ou "ai"'}), 400
        
        # Adicionar mensagem
        message = chat.add_message(
            content=content,
            sender=sender,
            ai_model=data.get('ai_model'),
            tokens_used=data.get('tokens_used', 0)
        )
        
        return jsonify({
            'message': 'Mensagem adicionada com sucesso',
            'message_data': message.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Erro ao adicionar mensagem: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@chat_bp.route('/<int:chat_id>/memory', methods=['PUT'])
@jwt_required()
def update_chat_memory(chat_id):
    """Atualiza a memória do chat"""
    try:
        user_id = get_jwt_identity()
        
        chat = Chat.query.filter_by(id=chat_id, user_id=user_id).first()
        if not chat:
            return jsonify({'error': 'Chat não encontrado'}), 404
        
        data = request.get_json()
        memory_summary = data.get('memory_summary', '').strip()
        
        if not memory_summary:
            return jsonify({'error': 'Resumo de memória é obrigatório'}), 400
        
        chat.update_memory(memory_summary)
        
        return jsonify({
            'message': 'Memória do chat atualizada com sucesso',
            'memory_summary': memory_summary
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao atualizar memória: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@chat_bp.route('/global-memory', methods=['GET'])
@jwt_required()
def get_global_memory():
    """Retorna a memória global do usuário"""
    try:
        user_id = get_jwt_identity()
        
        memories = GlobalMemory.query.filter_by(
            user_id=user_id,
            is_active=True
        ).order_by(GlobalMemory.importance_score.desc()).all()
        
        return jsonify({
            'memories': [memory.to_dict() for memory in memories],
            'total': len(memories)
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao buscar memória global: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@chat_bp.route('/global-memory', methods=['POST'])
@jwt_required()
def add_global_memory():
    """Adiciona uma nova memória global"""
    try:
        user_id = get_jwt_identity()
        
        data = request.get_json()
        title = data.get('title', '').strip()
        content = data.get('content', '').strip()
        
        if not title or not content:
            return jsonify({'error': 'Título e conteúdo são obrigatórios'}), 400
        
        memory = GlobalMemory(
            user_id=user_id,
            title=title,
            content=content,
            subject=data.get('subject'),
            source_chat_id=data.get('source_chat_id'),
            importance_score=data.get('importance_score', 1.0)
        )
        
        db.session.add(memory)
        db.session.commit()
        
        return jsonify({
            'message': 'Memória global adicionada com sucesso',
            'memory': memory.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Erro ao adicionar memória global: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@chat_bp.route('/global-memory/<int:memory_id>', methods=['DELETE'])
@jwt_required()
def delete_global_memory(memory_id):
    """Deleta uma memória global"""
    try:
        user_id = get_jwt_identity()
        
        memory = GlobalMemory.query.filter_by(
            id=memory_id,
            user_id=user_id
        ).first()
        
        if not memory:
            return jsonify({'error': 'Memória não encontrada'}), 404
        
        # Soft delete
        memory.is_active = False
        memory.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Memória global deletada com sucesso'}), 200
        
    except Exception as e:
        logger.error(f"Erro ao deletar memória global: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@chat_bp.route('/messages/<int:message_id>/rate', methods=['POST'])
@jwt_required()
def rate_message(message_id):
    """Avalia uma mensagem da IA"""
    try:
        user_id = get_jwt_identity()
        
        message = Message.query.join(Chat).filter(
            Message.id == message_id,
            Chat.user_id == user_id,
            Message.sender == 'ai'
        ).first()
        
        if not message:
            return jsonify({'error': 'Mensagem não encontrada'}), 404
        
        data = request.get_json()
        rating = data.get('rating')
        feedback = data.get('feedback', '').strip()
        
        if not rating or not (1 <= rating <= 5):
            return jsonify({'error': 'Avaliação deve ser entre 1 e 5'}), 400
        
        message.add_rating(rating, feedback)
        
        return jsonify({
            'message': 'Avaliação adicionada com sucesso',
            'rating': rating,
            'feedback': feedback
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao avaliar mensagem: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

