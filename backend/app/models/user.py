from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from ..extensions import db

# Association table for user roles (many-to-many)
user_roles = db.Table('user_roles',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    db.Column('role_id', db.Integer, db.ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True)
)


class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False, index=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    full_name = db.Column(db.String(255), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    pin_hash = db.Column(db.String(255))
    
    is_active = db.Column(db.Boolean, default=True)
    is_approved = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # Relationships
    roles = db.relationship('Role', secondary=user_roles, back_populates='users', lazy='joined')
    complaints = db.relationship('Complaint', back_populates='creator', foreign_keys='Complaint.created_by', lazy='dynamic')
    assigned_complaints = db.relationship('Complaint', back_populates='assignee', foreign_keys='Complaint.assigned_to', lazy='dynamic')
    comments = db.relationship('Comment', back_populates='author', lazy='dynamic')
    
    # Social relationships
    profile = db.relationship('UserProfile', back_populates='user', uselist=False, cascade='all, delete-orphan')
    settings = db.relationship('UserSettings', back_populates='user', uselist=False, cascade='all, delete-orphan')
    
    # Methods
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def set_pin(self, pin):
        self.pin_hash = generate_password_hash(pin)
    
    def check_pin(self, pin):
        if not self.pin_hash:
            return False
        return check_password_hash(self.pin_hash, pin)
    
    def has_role(self, role_name):
        return any(role.name == role_name for role in self.roles)
    
    def is_admin(self):
        admin_roles = ['Super Admin', 'Principal', 'Vice Principal']
        return any(role.name in admin_roles for role in self.roles)
    
    def is_staff(self):
        staff_roles = ['Staff', 'Department Head', 'Vice Principal', 'Principal', 'Super Admin']
        return any(role.name in staff_roles for role in self.roles)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'is_active': self.is_active,
            'is_approved': self.is_approved,
            'roles': [role.name for role in self.roles],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }


class Role(db.Model):
    __tablename__ = 'roles'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text)
    permissions = db.Column(db.Text)  # JSON string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    users = db.relationship('User', secondary=user_roles, back_populates='roles')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class UserProfile(db.Model):
    __tablename__ = 'user_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    
    bio = db.Column(db.Text)
    avatar_url = db.Column(db.String(500))
    cover_url = db.Column(db.String(500))
    phone = db.Column(db.String(20))
    department = db.Column(db.String(100))
    year = db.Column(db.String(20))
    
    is_verified = db.Column(db.Boolean, default=False)
    theme_preference = db.Column(db.String(10), default='light')
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', back_populates='profile')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'bio': self.bio,
            'avatar_url': self.avatar_url,
            'cover_url': self.cover_url,
            'phone': self.phone,
            'department': self.department,
            'year': self.year,
            'is_verified': self.is_verified,
            'theme_preference': self.theme_preference
        }


class UserSettings(db.Model):
    __tablename__ = 'user_settings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    
    # Privacy
    show_real_name = db.Column(db.Boolean, default=False)
    profile_visibility = db.Column(db.String(20), default='public')
    show_email = db.Column(db.Boolean, default=False)
    
    # Notifications
    email_notifications = db.Column(db.Boolean, default=True)
    push_notifications = db.Column(db.Boolean, default=True)
    notify_on_comment = db.Column(db.Boolean, default=True)
    notify_on_status_change = db.Column(db.Boolean, default=True)
    notify_on_like = db.Column(db.Boolean, default=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', back_populates='settings')
    
    def to_dict(self):
        return {
            'show_real_name': self.show_real_name,
            'profile_visibility': self.profile_visibility,
            'show_email': self.show_email,
            'email_notifications': self.email_notifications,
            'push_notifications': self.push_notifications,
            'notify_on_comment': self.notify_on_comment,
            'notify_on_status_change': self.notify_on_status_change,
            'notify_on_like': self.notify_on_like
        }
