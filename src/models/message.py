from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from src.models.user import db

class Message(db.Model):
    """Modelo de mensagem do sistema"""
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True)
    chat_id = db.Column(db.Integer, db.ForeignKey('chats.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Conteúdo da mensagem
    content = db.Column(db.Text, nullable=False)
    sender = db.Column(db.String(10), nullable=False)  # 'user' ou 'ai'
    
    # Metadados da IA
    ai_model = db.Column(db.String(50), nullable=True)  # gemini, openai, etc.
    tokens_used = db.Column(db.Integer, default=0)
    response_time_ms = db.Column(db.Integer, nullable=True)
    
    # Análise de sentimento
    sentiment_score = db.Column(db.Float, nullable=True)  # -1 a 1
    sentiment_label = db.Column(db.String(20), nullable=True)  # positive, negative, neutral
    
    # Avaliação da resposta
    user_rating = db.Column(db.Integer, nullable=True)  # 1-5 estrelas
    user_feedback = db.Column(db.Text, nullable=True)
    
    # Flags
    is_edited = db.Column(db.Boolean, default=False)
    is_deleted = db.Column(db.Boolean, default=False)
    is_flagged = db.Column(db.Boolean, default=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def update_content(self, new_content):
        """Atualiza o conteúdo da mensagem"""
        self.content = new_content
        self.is_edited = True
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def add_rating(self, rating, feedback=None):
        """Adiciona avaliação do usuário à mensagem"""
        if 1 <= rating <= 5:
            self.user_rating = rating
            self.user_feedback = feedback
            self.updated_at = datetime.utcnow()
            db.session.commit()
    
    def update_sentiment(self, score, label):
        """Atualiza a análise de sentimento"""
        self.sentiment_score = score
        self.sentiment_label = label
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def soft_delete(self):
        """Marca a mensagem como deletada sem remover do banco"""
        self.is_deleted = True
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def flag_message(self, reason=None):
        """Marca a mensagem como inadequada"""
        self.is_flagged = True
        self.updated_at = datetime.utcnow()
        
        # Criar log de moderação se necessário
        # TODO: Implementar sistema de moderação
        
        db.session.commit()
    
    def to_dict(self, include_metadata=False):
        """Converte a mensagem para dicionário"""
        data = {
            'id': self.id,
            'chat_id': self.chat_id,
            'user_id': self.user_id,
            'content': self.content if not self.is_deleted else '[Mensagem deletada]',
            'sender': self.sender,
            'is_edited': self.is_edited,
            'is_deleted': self.is_deleted,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        if include_metadata:
            data.update({
                'ai_model': self.ai_model,
                'tokens_used': self.tokens_used,
                'response_time_ms': self.response_time_ms,
                'sentiment_score': self.sentiment_score,
                'sentiment_label': self.sentiment_label,
                'user_rating': self.user_rating,
                'user_feedback': self.user_feedback,
                'is_flagged': self.is_flagged
            })
        
        return data
    
    def __repr__(self):
        return f'<Message {self.id} - {self.sender}>'


class GlobalMemory(db.Model):
    """Modelo para memória global do usuário"""
    __tablename__ = 'global_memory'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Conteúdo da memória
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    subject = db.Column(db.String(50), nullable=True)
    
    # Metadados
    source_chat_id = db.Column(db.Integer, db.ForeignKey('chats.id'), nullable=True)
    importance_score = db.Column(db.Float, default=1.0)  # 0-1
    
    # Flags
    is_active = db.Column(db.Boolean, default=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    user = db.relationship('User', backref='global_memories')
    source_chat = db.relationship('Chat', backref='derived_memories')
    
    def to_dict(self):
        """Converte a memória para dicionário"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'content': self.content,
            'subject': self.subject,
            'source_chat_id': self.source_chat_id,
            'importance_score': self.importance_score,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<GlobalMemory {self.title}>'

