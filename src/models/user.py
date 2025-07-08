from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    """Modelo de usuário do sistema"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=True)  # Nullable para login social
    
    # Informações do perfil
    profile_picture = db.Column(db.String(255), nullable=True)
    age = db.Column(db.Integer, nullable=True)
    difficulty_level = db.Column(db.String(20), default='auto')  # auto, muito-facil, facil, medio-facil, medio, medio-dificil, dificil
    
    # Configurações
    theme = db.Column(db.String(10), default='light')  # light, dark
    language = db.Column(db.String(5), default='pt-BR')
    
    # Status da conta
    role = db.Column(db.String(20), default='student')  # student, teacher, developer
    is_pro = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    
    # Login social
    google_id = db.Column(db.String(100), nullable=True, unique=True)
    
    # Estatísticas
    total_chats = db.Column(db.Integer, default=0)
    total_messages = db.Column(db.Integer, default=0)
    study_time_minutes = db.Column(db.Integer, default=0)
    consecutive_days = db.Column(db.Integer, default=0)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    chats = db.relationship('Chat', backref='user', lazy=True, cascade='all, delete-orphan')
    messages = db.relationship('Message', backref='user', lazy=True, cascade='all, delete-orphan')
    classrooms_owned = db.relationship('Classroom', backref='teacher', lazy=True, cascade='all, delete-orphan')
    classroom_memberships = db.relationship('ClassroomMember', backref='user', lazy=True, cascade='all, delete-orphan')
    challenge_submissions = db.relationship('Submission', backref='user', lazy=True, cascade='all, delete-orphan')
    daily_usage = db.relationship('DailyUsage', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Define a senha do usuário"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verifica a senha do usuário"""
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)
    
    def get_difficulty_level(self):
        """Retorna o nível de dificuldade baseado na idade ou configuração"""
        if self.difficulty_level != 'auto':
            return self.difficulty_level
        
        if not self.age:
            return 'medio'
        
        if self.age <= 10:
            return 'muito-facil'
        elif self.age <= 12:
            return 'facil'
        elif self.age <= 14:
            return 'medio-facil'
        elif self.age <= 16:
            return 'medio'
        elif self.age <= 18:
            return 'medio-dificil'
        else:
            return 'dificil'
    
    def can_create_chat(self):
        """Verifica se o usuário pode criar um novo chat"""
        if self.is_pro:
            return True
        
        # Verificar limite diário para usuários gratuitos
        from src.models.daily_usage import DailyUsage
        today = datetime.utcnow().date()
        usage = DailyUsage.query.filter_by(user_id=self.id, date=today).first()
        
        if not usage:
            return True
        
        return usage.chats_created < 5
    
    def increment_daily_usage(self):
        """Incrementa o uso diário do usuário"""
        from src.models.daily_usage import DailyUsage
        today = datetime.utcnow().date()
        usage = DailyUsage.query.filter_by(user_id=self.id, date=today).first()
        
        if not usage:
            usage = DailyUsage(user_id=self.id, date=today)
            db.session.add(usage)
        
        usage.chats_created += 1
        db.session.commit()
    
    def update_activity(self):
        """Atualiza a última atividade do usuário"""
        self.last_activity = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self, include_sensitive=False):
        """Converte o usuário para dicionário"""
        data = {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'profile_picture': self.profile_picture,
            'age': self.age,
            'difficulty_level': self.get_difficulty_level(),
            'theme': self.theme,
            'language': self.language,
            'role': self.role,
            'is_pro': self.is_pro,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'total_chats': self.total_chats,
            'total_messages': self.total_messages,
            'study_time_minutes': self.study_time_minutes,
            'consecutive_days': self.consecutive_days,
            'last_activity': self.last_activity.isoformat() if self.last_activity else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        if include_sensitive:
            data['google_id'] = self.google_id
        
        return data
    
    def __repr__(self):
        return f'<User {self.email}>'


class DailyUsage(db.Model):
    """Modelo para controle de uso diário"""
    __tablename__ = 'daily_usage'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    chats_created = db.Column(db.Integer, default=0)
    messages_sent = db.Column(db.Integer, default=0)
    study_time_minutes = db.Column(db.Integer, default=0)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('user_id', 'date', name='unique_user_date'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'date': self.date.isoformat(),
            'chats_created': self.chats_created,
            'messages_sent': self.messages_sent,
            'study_time_minutes': self.study_time_minutes,
            'created_at': self.created_at.isoformat()
        }

