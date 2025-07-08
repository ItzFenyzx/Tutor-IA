from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import datetime, timedelta
import requests
import logging

from src.models.user import User, db

auth_bp = Blueprint('auth', __name__)
logger = logging.getLogger(__name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Registra um novo usuário"""
    try:
        data = request.get_json()
        
        # Validar dados obrigatórios
        required_fields = ['name', 'email', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        name = data['name'].strip()
        email = data['email'].strip().lower()
        password = data['password']
        
        # Validações
        if len(name) < 2:
            return jsonify({'error': 'Nome deve ter pelo menos 2 caracteres'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Senha deve ter pelo menos 6 caracteres'}), 400
        
        # Verificar se email já existe
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email já está em uso'}), 409
        
        # Criar usuário
        user = User(
            name=name,
            email=email,
            age=data.get('age'),
            difficulty_level=data.get('difficulty_level', 'auto'),
            theme=data.get('theme', 'light')
        )
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        # Criar token de acesso
        access_token = create_access_token(identity=user.id)
        
        logger.info(f"Novo usuário registrado: {email}")
        
        return jsonify({
            'message': 'Usuário registrado com sucesso',
            'access_token': access_token,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Erro no registro: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Autentica um usuário"""
    try:
        data = request.get_json()
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email e senha são obrigatórios'}), 400
        
        # Buscar usuário
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Email ou senha incorretos'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Conta desativada'}), 403
        
        # Atualizar última atividade
        user.update_activity()
        
        # Criar token de acesso
        access_token = create_access_token(identity=user.id)
        
        logger.info(f"Login realizado: {email}")
        
        return jsonify({
            'message': 'Login realizado com sucesso',
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Erro no login: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@auth_bp.route('/google', methods=['POST'])
def google_login():
    """Autentica com Google OAuth"""
    try:
        data = request.get_json()
        google_token = data.get('token')
        
        if not google_token:
            return jsonify({'error': 'Token do Google é obrigatório'}), 400
        
        # Verificar token com Google
        google_user_info = verify_google_token(google_token)
        
        if not google_user_info:
            return jsonify({'error': 'Token do Google inválido'}), 401
        
        google_id = google_user_info['sub']
        email = google_user_info['email']
        name = google_user_info['name']
        picture = google_user_info.get('picture')
        
        # Buscar usuário existente
        user = User.query.filter_by(google_id=google_id).first()
        
        if not user:
            # Verificar se existe usuário com mesmo email
            user = User.query.filter_by(email=email).first()
            
            if user:
                # Vincular conta Google ao usuário existente
                user.google_id = google_id
                if picture:
                    user.profile_picture = picture
            else:
                # Criar novo usuário
                user = User(
                    name=name,
                    email=email,
                    google_id=google_id,
                    profile_picture=picture,
                    is_verified=True
                )
                db.session.add(user)
        
        # Atualizar informações se necessário
        if picture and user.profile_picture != picture:
            user.profile_picture = picture
        
        user.update_activity()
        db.session.commit()
        
        # Criar token de acesso
        access_token = create_access_token(identity=user.id)
        
        logger.info(f"Login Google realizado: {email}")
        
        return jsonify({
            'message': 'Login com Google realizado com sucesso',
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Erro no login Google: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required()
def refresh_token():
    """Renova o token de acesso"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.is_active:
            return jsonify({'error': 'Usuário não encontrado ou inativo'}), 404
        
        # Criar novo token
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao renovar token: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Retorna informações do usuário atual"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        user.update_activity()
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        logger.error(f"Erro ao buscar usuário atual: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout do usuário (invalidar token no frontend)"""
    try:
        # Em uma implementação real, você poderia adicionar o token a uma blacklist
        # Por enquanto, apenas retornamos sucesso
        return jsonify({'message': 'Logout realizado com sucesso'}), 200
        
    except Exception as e:
        logger.error(f"Erro no logout: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Altera a senha do usuário"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        data = request.get_json()
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Senha atual e nova senha são obrigatórias'}), 400
        
        # Verificar senha atual (apenas se o usuário tem senha definida)
        if user.password_hash and not user.check_password(current_password):
            return jsonify({'error': 'Senha atual incorreta'}), 401
        
        if len(new_password) < 6:
            return jsonify({'error': 'Nova senha deve ter pelo menos 6 caracteres'}), 400
        
        # Alterar senha
        user.set_password(new_password)
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        logger.info(f"Senha alterada para usuário: {user.email}")
        
        return jsonify({'message': 'Senha alterada com sucesso'}), 200
        
    except Exception as e:
        logger.error(f"Erro ao alterar senha: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

def verify_google_token(token):
    """Verifica token do Google OAuth"""
    try:
        # Verificar token com Google
        response = requests.get(
            f'https://oauth2.googleapis.com/tokeninfo?id_token={token}',
            timeout=10
        )
        
        if response.status_code != 200:
            return None
        
        user_info = response.json()
        
        # Verificar se o token é para nossa aplicação
        client_id = current_app.config.get('GOOGLE_CLIENT_ID')
        if client_id and user_info.get('aud') != client_id:
            return None
        
        return user_info
        
    except Exception as e:
        logger.error(f"Erro ao verificar token Google: {str(e)}")
        return None

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Solicita reset de senha (placeholder)"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        
        if not email:
            return jsonify({'error': 'Email é obrigatório'}), 400
        
        user = User.query.filter_by(email=email).first()
        
        # Por segurança, sempre retornamos sucesso mesmo se o email não existir
        return jsonify({
            'message': 'Se o email existir em nossa base, você receberá instruções para reset de senha'
        }), 200
        
    except Exception as e:
        logger.error(f"Erro no forgot password: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

