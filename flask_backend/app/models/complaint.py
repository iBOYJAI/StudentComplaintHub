from datetime import datetime, timedelta
from ..extensions import db


class Category(db.Model):
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    complaints = db.relationship('Complaint', back_populates='category')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'is_active': self.is_active
        }


class Location(db.Model):
    __tablename__ = 'locations'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    complaints = db.relationship('Complaint', back_populates='location')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'is_active': self.is_active
        }


class Complaint(db.Model):
    __tablename__ = 'complaints'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(500), nullable=False, index=True)
    description = db.Column(db.Text, nullable=False)
    
    # Status and priority
    status = db.Column(db.String(50), default='New', index=True)
    priority = db.Column(db.String(20), default='Medium', index=True)
    
    # Privacy
    is_anonymous = db.Column(db.Boolean, default=False)
    privacy_mode = db.Column(db.String(20), default='public')
    
    # Foreign keys
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'))
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), index=True)
    
    # SLA tracking
    sla_minutes = db.Column(db.Integer)
    due_date = db.Column(db.DateTime)
    is_overdue = db.Column(db.Boolean, default=False, index=True)
    is_escalated = db.Column(db.Boolean, default=False)
    escalated_at = db.Column(db.DateTime)
    
    # Resolution
    resolution_notes = db.Column(db.Text)
    resolved_at = db.Column(db.DateTime)
    resolved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    acknowledged_at = db.Column(db.DateTime)
    closed_at = db.Column(db.DateTime)
    
    # Soft delete
    is_deleted = db.Column(db.Boolean, default=False)
    deleted_at = db.Column(db.DateTime)
    
    # Engagement metrics
    vote_count = db.Column(db.Integer, default=0)
    view_count = db.Column(db.Integer, default=0)
    
    # Relationships
    category = db.relationship('Category', back_populates='complaints')
    location = db.relationship('Location', back_populates='complaints')
    creator = db.relationship('User', foreign_keys=[created_by], back_populates='complaints')
    assignee = db.relationship('User', foreign_keys=[assigned_to], back_populates='assigned_complaints')
    comments = db.relationship('Comment', back_populates='complaint', cascade='all, delete-orphan')
    
    def to_dict(self, include_creator=True):
        data = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'is_anonymous': self.is_anonymous,
            'privacy_mode': self.privacy_mode,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'location_id': self.location_id,
            'location_name': self.location.name if self.location else None,
            'is_overdue': self.is_overdue,
            'is_escalated': self.is_escalated,
            'vote_count': self.vote_count,
            'view_count': self.view_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None
        }
        
        if include_creator and not self.is_anonymous:
            data['creator'] = {
                'id': self.creator.id,
                'username': self.creator.username,
                'full_name': self.creator.full_name
            } if self.creator else None
        else:
            data['creator'] = {'full_name': 'Anonymous'}
        
        if self.assignee:
            data['assignee'] = {
                'id': self.assignee.id,
                'username': self.assignee.username,
                'full_name': self.assignee.full_name
            }
        else:
            data['assignee'] = None
        
        return data


class SLARule(db.Model):
    __tablename__ = 'sla_rules'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    priority = db.Column(db.String(20), nullable=False)
    response_time_minutes = db.Column(db.Integer, nullable=False)
    resolution_time_minutes = db.Column(db.Integer, nullable=False)
    escalation_time_minutes = db.Column(db.Integer)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'priority': self.priority,
            'response_time_minutes': self.response_time_minutes,
            'resolution_time_minutes': self.resolution_time_minutes,
            'escalation_time_minutes': self.escalation_time_minutes,
            'is_active': self.is_active
        }
