from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
from src.models.user import db

class Challenge(db.Model):
    """Modelo de desafio educacional"""
    __tablename__ = 'challenges'
    
    id = db.Column(db.Integer, primary_key=True)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    classroom_id = db.Column(db.Integer, db.ForeignKey('classrooms.id'), nullable=True)  # Null = desafio global
    
    # Informações básicas
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    subject = db.Column(db.String(50), nullable=False)
    
    # Configurações
    difficulty_level = db.Column(db.String(20), nullable=False)
    challenge_type = db.Column(db.String(30), default='multiple_choice')  # multiple_choice, open_question, coding, etc.
    
    # Conteúdo do desafio
    question_data = db.Column(db.JSON, nullable=False)  # Pergunta e opções
    correct_answer = db.Column(db.JSON, nullable=False)  # Resposta correta
    explanation = db.Column(db.Text, nullable=True)  # Explicação da resposta
    
    # Pontuação
    max_points = db.Column(db.Integer, default=100)
    time_limit_minutes = db.Column(db.Integer, nullable=True)  # Null = sem limite
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    is_global = db.Column(db.Boolean, default=False)  # Desafio global (visível para todos)
    
    # Agendamento
    start_date = db.Column(db.DateTime, nullable=True)
    end_date = db.Column(db.DateTime, nullable=True)
    
    # Estatísticas
    total_submissions = db.Column(db.Integer, default=0)
    correct_submissions = db.Column(db.Integer, default=0)
    average_score = db.Column(db.Float, default=0.0)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    creator = db.relationship('User', backref='created_challenges')
    submissions = db.relationship('Submission', backref='challenge', lazy=True, cascade='all, delete-orphan')
    
    def is_available(self):
        """Verifica se o desafio está disponível"""
        if not self.is_active:
            return False
        
        now = datetime.utcnow()
        
        if self.start_date and now < self.start_date:
            return False
        
        if self.end_date and now > self.end_date:
            return False
        
        return True
    
    def is_expired(self):
        """Verifica se o desafio expirou"""
        if not self.end_date:
            return False
        
        return datetime.utcnow() > self.end_date
    
    def get_time_remaining(self):
        """Retorna o tempo restante em minutos"""
        if not self.end_date:
            return None
        
        remaining = self.end_date - datetime.utcnow()
        return max(0, int(remaining.total_seconds() / 60))
    
    def can_submit(self, user_id):
        """Verifica se o usuário pode submeter uma resposta"""
        if not self.is_available():
            return False
        
        # Verificar se já submeteu
        existing_submission = Submission.query.filter_by(
            challenge_id=self.id,
            user_id=user_id
        ).first()
        
        # Por enquanto, permitir apenas uma submissão por usuário
        return existing_submission is None
    
    def submit_answer(self, user_id, answer_data, time_taken_minutes=None):
        """Submete uma resposta para o desafio"""
        if not self.can_submit(user_id):
            return None
        
        # Calcular pontuação
        score = self.calculate_score(answer_data)
        is_correct = score >= self.max_points * 0.8  # 80% ou mais = correto
        
        submission = Submission(
            challenge_id=self.id,
            user_id=user_id,
            answer_data=answer_data,
            score=score,
            is_correct=is_correct,
            time_taken_minutes=time_taken_minutes
        )
        
        db.session.add(submission)
        
        # Atualizar estatísticas
        self.total_submissions += 1
        if is_correct:
            self.correct_submissions += 1
        
        # Recalcular média
        all_scores = [s.score for s in self.submissions] + [score]
        self.average_score = sum(all_scores) / len(all_scores)
        
        self.updated_at = datetime.utcnow()
        db.session.commit()
        
        return submission
    
    def calculate_score(self, answer_data):
        """Calcula a pontuação baseada na resposta"""
        if self.challenge_type == 'multiple_choice':
            return self.calculate_multiple_choice_score(answer_data)
        elif self.challenge_type == 'open_question':
            return self.calculate_open_question_score(answer_data)
        else:
            # Implementar outros tipos de desafio
            return 0
    
    def calculate_multiple_choice_score(self, answer_data):
        """Calcula pontuação para múltipla escolha"""
        user_answer = answer_data.get('selected_option')
        correct_answer = self.correct_answer.get('correct_option')
        
        if user_answer == correct_answer:
            return self.max_points
        else:
            return 0
    
    def calculate_open_question_score(self, answer_data):
        """Calcula pontuação para questão aberta (simplificado)"""
        # Por enquanto, retorna pontuação parcial
        # TODO: Implementar análise de texto mais sofisticada
        user_answer = answer_data.get('text_answer', '').lower().strip()
        correct_keywords = self.correct_answer.get('keywords', [])
        
        if not user_answer or not correct_keywords:
            return 0
        
        matches = sum(1 for keyword in correct_keywords if keyword.lower() in user_answer)
        score_percentage = matches / len(correct_keywords)
        
        return int(self.max_points * score_percentage)
    
    def get_leaderboard(self, limit=10):
        """Retorna o ranking dos melhores resultados"""
        return (Submission.query
                .filter_by(challenge_id=self.id)
                .order_by(Submission.score.desc(), Submission.created_at.asc())
                .limit(limit)
                .all())
    
    def to_dict(self, include_answer=False, include_stats=False):
        """Converte o desafio para dicionário"""
        data = {
            'id': self.id,
            'creator_id': self.creator_id,
            'classroom_id': self.classroom_id,
            'title': self.title,
            'description': self.description,
            'subject': self.subject,
            'difficulty_level': self.difficulty_level,
            'challenge_type': self.challenge_type,
            'question_data': self.question_data,
            'max_points': self.max_points,
            'time_limit_minutes': self.time_limit_minutes,
            'is_active': self.is_active,
            'is_global': self.is_global,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'creator_name': self.creator.name if self.creator else None,
            'is_available': self.is_available(),
            'is_expired': self.is_expired(),
            'time_remaining_minutes': self.get_time_remaining()
        }
        
        if include_answer:
            data['correct_answer'] = self.correct_answer
            data['explanation'] = self.explanation
        
        if include_stats:
            data['total_submissions'] = self.total_submissions
            data['correct_submissions'] = self.correct_submissions
            data['average_score'] = self.average_score
            data['success_rate'] = (self.correct_submissions / self.total_submissions * 100) if self.total_submissions > 0 else 0
        
        return data
    
    def __repr__(self):
        return f'<Challenge {self.title} - {self.subject}>'


class Submission(db.Model):
    """Modelo de submissão de desafio"""
    __tablename__ = 'submissions'
    
    id = db.Column(db.Integer, primary_key=True)
    challenge_id = db.Column(db.Integer, db.ForeignKey('challenges.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Resposta do usuário
    answer_data = db.Column(db.JSON, nullable=False)
    
    # Resultado
    score = db.Column(db.Integer, nullable=False)
    is_correct = db.Column(db.Boolean, nullable=False)
    time_taken_minutes = db.Column(db.Integer, nullable=True)
    
    # Feedback
    feedback = db.Column(db.Text, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Constraints
    __table_args__ = (db.UniqueConstraint('challenge_id', 'user_id', name='unique_challenge_submission'),)
    
    def get_score_percentage(self):
        """Retorna a pontuação em porcentagem"""
        if self.challenge.max_points == 0:
            return 0
        return (self.score / self.challenge.max_points) * 100
    
    def to_dict(self, include_answer=False):
        """Converte a submissão para dicionário"""
        data = {
            'id': self.id,
            'challenge_id': self.challenge_id,
            'user_id': self.user_id,
            'score': self.score,
            'is_correct': self.is_correct,
            'time_taken_minutes': self.time_taken_minutes,
            'feedback': self.feedback,
            'created_at': self.created_at.isoformat(),
            'score_percentage': self.get_score_percentage(),
            'user_name': self.user.name if self.user else None,
            'challenge_title': self.challenge.title if self.challenge else None
        }
        
        if include_answer:
            data['answer_data'] = self.answer_data
        
        return data
    
    def __repr__(self):
        return f'<Submission {self.id} - Score: {self.score}>'

