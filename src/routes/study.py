from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import logging

from src.models.user import User, DailyUsage, db

study_bp = Blueprint('study', __name__)
logger = logging.getLogger(__name__)

@study_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_study_stats():
    """Retorna estatísticas de estudo do usuário"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        # Estatísticas básicas
        stats = {
            'total_chats': user.total_chats,
            'total_messages': user.total_messages,
            'study_time_minutes': user.study_time_minutes,
            'consecutive_days': user.consecutive_days,
            'last_activity': user.last_activity.isoformat() if user.last_activity else None
        }
        
        # Uso diário dos últimos 7 dias
        today = datetime.utcnow().date()
        week_ago = today - timedelta(days=7)
        
        daily_usage = DailyUsage.query.filter(
            DailyUsage.user_id == user_id,
            DailyUsage.date >= week_ago
        ).order_by(DailyUsage.date.desc()).all()
        
        stats['daily_usage'] = [usage.to_dict() for usage in daily_usage]
        
        # Uso de hoje
        today_usage = DailyUsage.query.filter_by(user_id=user_id, date=today).first()
        stats['today'] = {
            'chats_created': today_usage.chats_created if today_usage else 0,
            'messages_sent': today_usage.messages_sent if today_usage else 0,
            'study_time_minutes': today_usage.study_time_minutes if today_usage else 0,
            'remaining_chats': max(0, 5 - (today_usage.chats_created if today_usage else 0)) if not user.is_pro else 'unlimited'
        }
        
        return jsonify({'stats': stats}), 200
        
    except Exception as e:
        logger.error(f"Erro ao buscar estatísticas: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@study_bp.route('/time', methods=['POST'])
@jwt_required()
def log_study_time():
    """Registra tempo de estudo"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        data = request.get_json()
        minutes = data.get('minutes', 0)
        
        if minutes <= 0:
            return jsonify({'error': 'Tempo deve ser maior que zero'}), 400
        
        # Atualizar tempo total do usuário
        user.study_time_minutes += minutes
        
        # Atualizar uso diário
        today = datetime.utcnow().date()
        usage = DailyUsage.query.filter_by(user_id=user_id, date=today).first()
        
        if not usage:
            usage = DailyUsage(user_id=user_id, date=today)
            db.session.add(usage)
        
        usage.study_time_minutes += minutes
        
        db.session.commit()
        
        return jsonify({
            'message': 'Tempo de estudo registrado',
            'total_minutes': user.study_time_minutes,
            'today_minutes': usage.study_time_minutes
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao registrar tempo: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

