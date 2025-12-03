from datetime import datetime
from ..extensions import db


class UserFollow(db.Model):
    __tablename__ = 'user_follows'
    
    id = db.Column(db.Integer, primary_key=True)
    follower_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    following_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    followed_at = db.Column(db.DateTime, default=datetime.utcnow)


class ComplaintLike(db.Model):
    __tablename__ = 'complaint_likes'
    
    id = db.Column(db.Integer, primary_key=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey('complaints.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    liked_at = db.Column(db.DateTime, default=datetime.utcnow)


class CommentLike(db.Model):
    __tablename__ = 'comment_likes'
    
    id = db.Column(db.Integer, primary_key=True)
    comment_id = db.Column(db.Integer, db.ForeignKey('comments.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    liked_at = db.Column(db.DateTime, default=datetime.utcnow)


class Poll(db.Model):
    __tablename__ = 'polls'
    
    id = db.Column(db.Integer, primary_key=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey('complaints.id', ondelete='CASCADE'), unique=True)
    question = db.Column(db.String(500), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)


class PollOption(db.Model):
    __tablename__ = 'poll_options'
    
    id = db.Column(db.Integer, primary_key=True)
    poll_id = db.Column(db.Integer, db.ForeignKey('polls.id', ondelete='CASCADE'))
    option_text = db.Column(db.String(100), nullable=False)
    vote_count = db.Column(db.Integer, default=0)
    order = db.Column(db.Integer, default=0)
