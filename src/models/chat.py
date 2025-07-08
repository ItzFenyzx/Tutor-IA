from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from src.models.user import db

class Chat(db.Model):
    """Modelo de chat do sistema"""
    __tablename__ = 'chats'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Informações básicas
    name = db.Column(db.String(200), nullable=False)
    subject = db.Column(db.String(50), nullable=False)  # matematica, portugues, etc.
    description = db.Column(db.Text, nullable=True)
    
    # Configurações
    difficulty_level = db.Column(db.String(20), nullable=True)  # Herda do usuário se null
    is_active = db.Column(db.Boolean, default=True)
    
    # Memória do chat
    memory_summary = db.Column(db.Text, nullable=True)  # Resumo automático das conversas
    context_data = db.Column(db.JSON, nullable=True)  # Dados de contexto adicional
    
    # Estatísticas
    message_count = db.Column(db.Integer, default=0)
    total_tokens = db.Column(db.Integer, default=0)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_message_at = db.Column(db.DateTime, nullable=True)
    
    # Relacionamentos
    messages = db.relationship('Message', backref='chat', lazy=True, cascade='all, delete-orphan', order_by='Message.created_at')
    
    def get_difficulty_level(self):
        """Retorna o nível de dificuldade do chat"""
        if self.difficulty_level:
            return self.difficulty_level
        return self.user.get_difficulty_level()
    
    def add_message(self, content, sender='user', ai_model=None, tokens_used=0):
        """Adiciona uma nova mensagem ao chat"""
        from src.models.message import Message
        
        message = Message(
            chat_id=self.id,
            user_id=self.user_id,
            content=content,
            sender=sender,
            ai_model=ai_model,
            tokens_used=tokens_used
        )
        
        db.session.add(message)
        
        # Atualizar estatísticas do chat
        self.message_count += 1
        self.total_tokens += tokens_used
        self.last_message_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        
        # Atualizar estatísticas do usuário
        if sender == 'user':
            self.user.total_messages += 1
        
        db.session.commit()
        return message
    
    def update_memory(self, new_summary):
        """Atualiza o resumo de memória do chat"""
        self.memory_summary = new_summary
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def get_recent_messages(self, limit=10):
        """Retorna as mensagens mais recentes do chat"""
        return self.messages[-limit:] if len(self.messages) > limit else self.messages
    
    def get_context_for_ai(self):
        """Retorna o contexto formatado para enviar à IA"""
        recent_messages = self.get_recent_messages(20)
        
        context = {
            'chat_id': self.id,
            'subject': self.subject,
            'difficulty_level': self.get_difficulty_level(),
            'memory_summary': self.memory_summary,
            'recent_messages': [msg.to_dict() for msg in recent_messages],
            'user_info': {
                'name': self.user.name,
                'age': self.user.age,
                'role': self.user.role
            }
        }
        
        return context
    
    def to_dict(self, include_messages=False):
        """Converte o chat para dicionário"""
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'subject': self.subject,
            'description': self.description,
            'difficulty_level': self.get_difficulty_level(),
            'is_active': self.is_active,
            'memory_summary': self.memory_summary,
            'message_count': self.message_count,
            'total_tokens': self.total_tokens,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'last_message_at': self.last_message_at.isoformat() if self.last_message_at else None
        }
        
        if include_messages:
            data['messages'] = [msg.to_dict() for msg in self.messages]
        
        return data
    
    def __repr__(self):
        return f'<Chat {self.name} - {self.subject}>'

