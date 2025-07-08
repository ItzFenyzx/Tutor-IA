from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import string
import random
from src.models.user import db

class Classroom(db.Model):
    """Modelo de turma/sala de aula"""
    __tablename__ = 'classrooms'
    
    id = db.Column(db.Integer, primary_key=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Informações básicas
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    subject = db.Column(db.String(50), nullable=True)  # Matéria principal
    
    # Código de acesso
    access_code = db.Column(db.String(10), unique=True, nullable=False)
    
    # Configurações
    is_active = db.Column(db.Boolean, default=True)
    is_public = db.Column(db.Boolean, default=False)
    max_members = db.Column(db.Integer, default=50)
    
    # Configurações de dificuldade
    difficulty_level = db.Column(db.String(20), nullable=True)
    auto_assign_challenges = db.Column(db.Boolean, default=True)
    
    # Estatísticas
    member_count = db.Column(db.Integer, default=0)
    total_challenges = db.Column(db.Integer, default=0)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    members = db.relationship('ClassroomMember', backref='classroom', lazy=True, cascade='all, delete-orphan')
    challenges = db.relationship('Challenge', backref='classroom', lazy=True, cascade='all, delete-orphan')
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.access_code:
            self.access_code = self.generate_access_code()
    
    @staticmethod
    def generate_access_code():
        """Gera um código de acesso único para a turma"""
        while True:
            # Gerar código de 6 caracteres (letras maiúsculas e números)
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            
            # Verificar se o código já existe
            if not Classroom.query.filter_by(access_code=code).first():
                return code
    
    def add_member(self, user_id, role='student'):
        """Adiciona um membro à turma"""
        # Verificar se já é membro
        existing_member = ClassroomMember.query.filter_by(
            classroom_id=self.id,
            user_id=user_id
        ).first()
        
        if existing_member:
            return existing_member
        
        # Verificar limite de membros
        if self.member_count >= self.max_members:
            return None
        
        member = ClassroomMember(
            classroom_id=self.id,
            user_id=user_id,
            role=role
        )
        
        db.session.add(member)
        self.member_count += 1
        self.updated_at = datetime.utcnow()
        db.session.commit()
        
        return member
    
    def remove_member(self, user_id):
        """Remove um membro da turma"""
        member = ClassroomMember.query.filter_by(
            classroom_id=self.id,
            user_id=user_id
        ).first()
        
        if member:
            db.session.delete(member)
            self.member_count = max(0, self.member_count - 1)
            self.updated_at = datetime.utcnow()
            db.session.commit()
            return True
        
        return False
    
    def get_members(self, role=None):
        """Retorna os membros da turma"""
        query = ClassroomMember.query.filter_by(classroom_id=self.id)
        
        if role:
            query = query.filter_by(role=role)
        
        return query.all()
    
    def is_member(self, user_id):
        """Verifica se o usuário é membro da turma"""
        return ClassroomMember.query.filter_by(
            classroom_id=self.id,
            user_id=user_id
        ).first() is not None
    
    def get_member_role(self, user_id):
        """Retorna o papel do usuário na turma"""
        member = ClassroomMember.query.filter_by(
            classroom_id=self.id,
            user_id=user_id
        ).first()
        
        return member.role if member else None
    
    def can_manage(self, user_id):
        """Verifica se o usuário pode gerenciar a turma"""
        if self.teacher_id == user_id:
            return True
        
        member_role = self.get_member_role(user_id)
        return member_role in ['teacher', 'assistant']
    
    def regenerate_access_code(self):
        """Regenera o código de acesso da turma"""
        self.access_code = self.generate_access_code()
        self.updated_at = datetime.utcnow()
        db.session.commit()
        return self.access_code
    
    def to_dict(self, include_members=False):
        """Converte a turma para dicionário"""
        data = {
            'id': self.id,
            'teacher_id': self.teacher_id,
            'name': self.name,
            'description': self.description,
            'subject': self.subject,
            'access_code': self.access_code,
            'is_active': self.is_active,
            'is_public': self.is_public,
            'max_members': self.max_members,
            'difficulty_level': self.difficulty_level,
            'auto_assign_challenges': self.auto_assign_challenges,
            'member_count': self.member_count,
            'total_challenges': self.total_challenges,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'teacher_name': self.teacher.name if self.teacher else None
        }
        
        if include_members:
            data['members'] = [member.to_dict() for member in self.members]
        
        return data
    
    def __repr__(self):
        return f'<Classroom {self.name} - {self.access_code}>'


class ClassroomMember(db.Model):
    """Modelo de membro de turma"""
    __tablename__ = 'classroom_members'
    
    id = db.Column(db.Integer, primary_key=True)
    classroom_id = db.Column(db.Integer, db.ForeignKey('classrooms.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Papel na turma
    role = db.Column(db.String(20), default='student')  # student, assistant, teacher
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    
    # Estatísticas
    challenges_completed = db.Column(db.Integer, default=0)
    total_score = db.Column(db.Integer, default=0)
    
    # Timestamps
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Constraints
    __table_args__ = (db.UniqueConstraint('classroom_id', 'user_id', name='unique_classroom_member'),)
    
    def update_activity(self):
        """Atualiza a última atividade do membro"""
        self.last_activity = datetime.utcnow()
        db.session.commit()
    
    def add_score(self, points):
        """Adiciona pontos ao membro"""
        self.total_score += points
        self.update_activity()
        db.session.commit()
    
    def complete_challenge(self, points=0):
        """Marca um desafio como completado"""
        self.challenges_completed += 1
        self.total_score += points
        self.update_activity()
        db.session.commit()
    
    def to_dict(self):
        """Converte o membro para dicionário"""
        return {
            'id': self.id,
            'classroom_id': self.classroom_id,
            'user_id': self.user_id,
            'role': self.role,
            'is_active': self.is_active,
            'challenges_completed': self.challenges_completed,
            'total_score': self.total_score,
            'joined_at': self.joined_at.isoformat(),
            'last_activity': self.last_activity.isoformat(),
            'user_name': self.user.name if self.user else None,
            'user_email': self.user.email if self.user else None
        }
    
    def __repr__(self):
        return f'<ClassroomMember {self.user_id} in {self.classroom_id}>'

