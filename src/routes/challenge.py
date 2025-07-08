from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging

from src.models.user import User, db
from src.models.challenge import Challenge, Submission

challenge_bp = Blueprint('challenge', __name__)
logger = logging.getLogger(__name__)

@challenge_bp.route('/', methods=['GET'])
@jwt_required()
def get_challenges():
    """Retorna desafios disponíveis"""
    try:
        user_id = get_jwt_identity()
        classroom_id = request.args.get('classroom_id', type=int)
        
        # Buscar desafios globais e da turma
        query = Challenge.query.filter_by(is_active=True)
        
        if classroom_id:
            query = query.filter_by(classroom_id=classroom_id)
        else:
            query = query.filter_by(is_global=True)
        
        challenges = query.order_by(Challenge.created_at.desc()).all()
        
        return jsonify({
            'challenges': [challenge.to_dict() for challenge in challenges],
            'total': len(challenges)
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao buscar desafios: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@challenge_bp.route('/<int:challenge_id>/submit', methods=['POST'])
@jwt_required()
def submit_challenge(challenge_id):
    """Submete resposta para um desafio"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        answer_data = data.get('answer_data')
        
        if not answer_data:
            return jsonify({'error': 'Dados da resposta são obrigatórios'}), 400
        
        # Buscar desafio
        challenge = Challenge.query.get(challenge_id)
        if not challenge or not challenge.is_available():
            return jsonify({'error': 'Desafio não encontrado ou não disponível'}), 404
        
        # Submeter resposta
        submission = challenge.submit_answer(user_id, answer_data)
        if not submission:
            return jsonify({'error': 'Não foi possível submeter resposta'}), 400
        
        return jsonify({
            'message': 'Resposta submetida com sucesso',
            'submission': submission.to_dict(include_answer=True)
        }), 201
        
    except Exception as e:
        logger.error(f"Erro ao submeter desafio: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

