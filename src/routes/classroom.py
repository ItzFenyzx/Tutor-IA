from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging

from src.models.user import User, db
from src.models.classroom import Classroom, ClassroomMember

classroom_bp = Blueprint('classroom', __name__)
logger = logging.getLogger(__name__)

@classroom_bp.route('/', methods=['GET'])
@jwt_required()
def get_classrooms():
    """Retorna turmas do usuário"""
    try:
        user_id = get_jwt_identity()
        
        # Turmas onde é membro
        memberships = ClassroomMember.query.filter_by(user_id=user_id, is_active=True).all()
        classrooms = [membership.classroom for membership in memberships if membership.classroom.is_active]
        
        return jsonify({
            'classrooms': [classroom.to_dict() for classroom in classrooms],
            'total': len(classrooms)
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao buscar turmas: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@classroom_bp.route('/join', methods=['POST'])
@jwt_required()
def join_classroom():
    """Entra em uma turma usando código de acesso"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        access_code = data.get('access_code', '').strip().upper()
        
        if not access_code:
            return jsonify({'error': 'Código de acesso é obrigatório'}), 400
        
        # Buscar turma
        classroom = Classroom.query.filter_by(access_code=access_code, is_active=True).first()
        if not classroom:
            return jsonify({'error': 'Código de acesso inválido'}), 404
        
        # Adicionar membro
        member = classroom.add_member(user_id)
        if not member:
            return jsonify({'error': 'Não foi possível entrar na turma (limite atingido)'}), 400
        
        return jsonify({
            'message': 'Entrou na turma com sucesso',
            'classroom': classroom.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao entrar na turma: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

