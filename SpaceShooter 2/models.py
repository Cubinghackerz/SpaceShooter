from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Score(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    player_name = db.Column(db.String(64), nullable=True)
    score = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'player_name': self.player_name,
            'score': self.score,
            'created_at': self.created_at.isoformat()
        }
