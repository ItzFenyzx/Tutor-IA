import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import timedelta
import logging

# Importar modelos
from src.models.user import db
from src.models.chat import Chat
from src.models.message import Message
from src.models.classroom import Classroom
from src.models.challenge import Challenge
from src.models.submission import Submission

# Importar rotas
from src.routes.auth import auth_bp
from src.routes.user import user_bp
from src.routes.chat import chat_bp
from src.routes.classroom import classroom_bp
from src.routes.challenge import challenge_bp
from src.routes.ai import ai_bp
from src.routes.study import study_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# Configurações
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'tutor-ia-3.0-secret-key-super-secure')
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-tutor-ia')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

# Configuração do banco de dados
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configurações de APIs externas
app.config['GEMINI_API_KEY'] = os.environ.get('GEMINI_API_KEY', '')
app.config['OPENAI_API_KEY'] = os.environ.get('OPENAI_API_KEY', '')
app.config['MANUS_API_KEY'] = os.environ.get('MANUS_API_KEY', '')
app.config['GOOGLE_CLIENT_ID'] = os.environ.get('GOOGLE_CLIENT_ID', '')
app.config['GOOGLE_CLIENT_SECRET'] = os.environ.get('GOOGLE_CLIENT_SECRET', '')

# Configurações de IA
app.config['CHAT_PRIMARY_API'] = os.environ.get('CHAT_PRIMARY_API', 'gemini')
app.config['CHAT_SECONDARY_API'] = os.environ.get('CHAT_SECONDARY_API', 'openai')
app.config['CHALLENGE_API'] = os.environ.get('CHALLENGE_API', 'manus')

# Inicializar extensões
CORS(app, origins="*", supports_credentials=True)
jwt = JWTManager(app)
db.init_app(app)

# Registrar blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(user_bp, url_prefix='/api/users')
app.register_blueprint(chat_bp, url_prefix='/api/chats')
app.register_blueprint(classroom_bp, url_prefix='/api/classrooms')
app.register_blueprint(challenge_bp, url_prefix='/api/challenges')
app.register_blueprint(ai_bp, url_prefix='/api/ai')
app.register_blueprint(study_bp, url_prefix='/api/study')

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inicializar banco de dados
with app.app_context():
    db.create_all()
    
    # Criar conta de desenvolvedor se não existir
    from src.models.user import User
    from werkzeug.security import generate_password_hash
    
    dev_user = User.query.filter_by(email='itzfenyzx@outlook.com').first()
    if not dev_user:
        dev_user = User(
            name='Desenvolvedor',
            email='itzfenyzx@outlook.com',
            password_hash=generate_password_hash('Dev/evolperItz'),
            role='developer',
            is_pro=True,
            age=25,
            difficulty_level='dificil'
        )
        db.session.add(dev_user)
        db.session.commit()
        logger.info("Conta de desenvolvedor criada com sucesso!")

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    """Servir arquivos estáticos do frontend"""
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

@app.errorhandler(404)
def not_found(error):
    """Manipulador de erro 404"""
    return {"error": "Endpoint não encontrado"}, 404

@app.errorhandler(500)
def internal_error(error):
    """Manipulador de erro 500"""
    logger.error(f"Erro interno do servidor: {error}")
    return {"error": "Erro interno do servidor"}, 500

@app.route('/api/health')
def health_check():
    """Endpoint de verificação de saúde"""
    return {
        "status": "healthy",
        "message": "Tutor IA 3.0 Backend está funcionando!",
        "version": "3.0.0"
    }

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

