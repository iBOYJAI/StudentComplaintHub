from datetime import datetime
from ..extensions import db


class Escalation(db.Model):
    __tablename__ = 'escalations'
    
    id = db.Column(db.Integer, primary_key=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey('complaints.id', ondelete='CASCADE'), nullable=False)
    escalated_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    escalated_to = db.Column(db.Integer, db.ForeignKey('users.id'))
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default='Pending')
    escalation_level = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    resolved_at = db.Column(db.DateTime)
    resolution_notes = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id': self.id,
            'complaint_id': self.complaint_id,
            'escalated_by': self.escalated_by,
            'escalated_to': self.escalated_to,
            'reason': self.reason,
            'status': self.status,
            'escalation_level': self.escalation_level,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None
        }


class Attachment(db.Model):
    __tablename__ = 'attachments'
    
    id = db.Column(db.Integer, primary_key=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey('complaints.id', ondelete='CASCADE'), nullable=False)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    filename = db.Column(db.String(500), nullable=False)
    original_filename = db.Column(db.String(500), nullable=False)
    file_path = db.Column(db.String(1000), nullable=False)
    file_type = db.Column(db.String(100))
    file_size = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_deleted = db.Column(db.Boolean, default=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'complaint_id': self.complaint_id,
            'filename': self.original_filename,
            'file_type': self.file_type,
            'file_size': self.file_size,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    action = db.Column(db.String(100), nullable=False, index=True)
    resource_type = db.Column(db.String(50), nullable=False)
    resource_id = db.Column(db.Integer)
    details = db.Column(db.Text)
    ip_address = db.Column(db.String(50))
    user_agent = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'action': self.action,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'details': self.details,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ComplaintVote(db.Model):
    __tablename__ = 'complaint_votes'
    
    id = db.Column(db.Integer, primary_key=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey('complaints.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    vote_type = db.Column(db.String(10), default='up')  # 'up' or 'priority'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        db.UniqueConstraint('complaint_id', 'user_id', name='unique_user_vote'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'complaint_id': self.complaint_id,
            'user_id': self.user_id,
            'vote_type': self.vote_type,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class RoutingRule(db.Model):
    __tablename__ = 'routing_rules'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'))
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'))
    priority = db.Column(db.String(20))
    assign_to_user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    assign_to_role_id = db.Column(db.Integer, db.ForeignKey('roles.id'))
    is_active = db.Column(db.Boolean, default=True)
    execution_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category_id': self.category_id,
            'location_id': self.location_id,
            'priority': self.priority,
            'assign_to_user_id': self.assign_to_user_id,
            'assign_to_role_id': self.assign_to_role_id,
            'is_active': self.is_active,
            'execution_order': self.execution_order
        }


class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    type = db.Column(db.String(50), nullable=False)  # 'new_complaint', 'comment', 'status_change', etc.
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    related_id = db.Column(db.Integer)  # ID of related resource (complaint, comment, etc.)
    related_type = db.Column(db.String(50))  # 'complaint', 'comment', etc.
    is_read = db.Column(db.Boolean, default=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'related_id': self.related_id,
            'related_type': self.related_type,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }