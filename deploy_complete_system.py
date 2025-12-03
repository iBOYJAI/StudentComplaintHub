#!/usr/bin/env python3
"""
Complete System Deployment Script
Generates all remaining Flask backend and modern frontend files
Run this once to create the entire application structure
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).parent

# File templates
FILES = {
    # ===== BACKEND MODELS =====
    'flask_backend/app/models/comment.py': '''from datetime import datetime
from ..extensions import db


class Comment(db.Model):
    __tablename__ = 'comments'
    
    id = db.Column(db.Integer, primary_key=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey('complaints.id', ondelete='CASCADE'), nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('comments.id'))
    content = db.Column(db.Text, nullable=False)
    is_internal = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_deleted = db.Column(db.Boolean, default=False)
    like_count = db.Column(db.Integer, default=0)
    
    # Relationships
    complaint = db.relationship('Complaint', back_populates='comments')
    author = db.relationship('User', back_populates='comments')
    
    def to_dict(self):
        return {
            'id': self.id,
            'complaint_id': self.complaint_id,
            'author_id': self.author_id,
            'author_name': self.author.full_name if self.author else 'Unknown',
            'content': self.content,
            'is_internal': self.is_internal,
            'like_count': self.like_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
''',

    'flask_backend/app/models/extended.py': '''from datetime import datetime
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
''',

    'flask_backend/app/models/__init__.py': '''from .user import User, Role, UserProfile, UserSettings, user_roles
from .complaint import Complaint, Category, Location, SLARule
from .comment import Comment
from .extended import UserFollow, ComplaintLike, CommentLike, Poll, PollOption

__all__ = [
    'User', 'Role', 'UserProfile', 'UserSettings', 'user_roles',
    'Complaint', 'Category', 'Location', 'SLARule',
    'Comment',
    'UserFollow', 'ComplaintLike', 'CommentLike', 'Poll', 'PollOption'
]
''',

    # ===== BACKEND ROUTES =====
    'flask_backend/app/routes/__init__.py': '''from flask import Blueprint
from .auth import auth_bp
from .complaints import complaints_bp
from .users import users_bp
from .admin import admin_bp
from .dashboard import dashboard_bp

# Main API blueprint
api_v1 = Blueprint('api', __name__)

# Register sub-blueprints
api_v1.register_blueprint(auth_bp, url_prefix='/auth')
api_v1.register_blueprint(complaints_bp, url_prefix='/complaints')
api_v1.register_blueprint(users_bp, url_prefix='/users')
api_v1.register_blueprint(admin_bp, url_prefix='/admin')
api_v1.register_blueprint(dashboard_bp, url_prefix='/dashboard')
''',

    # ===== BACKEND UTILS =====
    'flask_backend/app/utils/__init__.py': '''from .auth import *
from .decorators import *
from .validators import *
''',

    'flask_backend/app/utils/decorators.py': '''from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from ..models import User


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or not user.is_admin():
            return jsonify({'error': 'Admin access required'}), 403
        return fn(*args, **kwargs)
    return wrapper


def staff_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or not user.is_staff():
            return jsonify({'error': 'Staff access required'}), 403
        return fn(*args, **kwargs)
    return wrapper
''',

    'flask_backend/app/utils/validators.py': '''import re

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    return len(password) >= 6

def validate_username(username):
    return len(username) >= 3 and username.isalnum()
''',

    # ===== FRONTEND CORE =====
    'flask_frontend/index.html': '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Complaint Hub</title>
    <link rel="stylesheet" href="/assets/css/main.css">
    <link rel="manifest" href="/manifest.json">
</head>
<body>
    <div id="app">
        <div id="loading" class="loading-screen">
            <div class="spinner"></div>
            <p>Loading...</p>
        </div>
    </div>
    
    <script type="module" src="/assets/js/app.js"></script>
</body>
</html>
''',

    'flask_frontend/assets/css/main.css': '''/* Modern Design System */
:root {
    --primary: #2563eb;
    --primary-dark: #1d4ed8;
    --secondary: #64748b;
    --success: #10b981;
    --danger: #ef4444;
    --warning: #f59e0b;
    --bg-primary: #ffffff;
    --bg-secondary: #f8fafc;
    --text-primary: #0f172a;
    --text-secondary: #64748b;
    --border: #e2e8f0;
    --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    --radius: 0.5rem;
    --spacing: 1rem;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: var(--bg-secondary);
    color: var(--text-primary);
    line-height: 1.6;
}

/* Layout */
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--spacing);
}

/* Components */
.card {
    background: var(--bg-primary);
    border-radius: var(--radius);
    padding: calc(var(--spacing) * 1.5);
    box-shadow: var(--shadow);
    margin-bottom: var(--spacing);
}

.btn {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: var(--radius);
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-primary {
    background: var(--primary);
    color: white;
}

.btn-primary:hover {
    background: var(--primary-dark);
}

/* Loading */
.loading-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
}

.spinner {
    width: 50px;
    height: 50px;
    border: 4px solid var(--border);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
    .container {
        padding: 0.5rem;
    }
}
''',

    'flask_frontend/assets/js/app.js': '''import { Router } from './router.js';
import { API } from './api.js';
import { Store } from './store.js';

class App {
    constructor() {
        this.router = new Router();
        this.api = new API();
        this.store = new Store();
        this.init();
    }
    
    async init() {
        // Check authentication
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const user = await this.api.get('/auth/me');
                this.store.setUser(user);
            } catch (error) {
                localStorage.removeItem('token');
            }
        }
        
        // Initialize router
        this.router.init();
        
        // Hide loading
        document.getElementById('loading').style.display = 'none';
    }
}

// Initialize app
new App();
''',

    'flask_frontend/assets/js/config.js': '''export const CONFIG = {
    API_BASE_URL: 'http://127.0.0.1:5000/api',
    APP_NAME: 'Student Complaint Hub',
    VERSION: '2.0.0'
};
''',

    'flask_frontend/assets/js/api.js': '''import { CONFIG } from './config.js';

export class API {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
    }
    
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            ...options,
            headers
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return response.json();
    }
    
    get(endpoint) {
        return this.request(endpoint);
    }
    
    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
}
''',

    'flask_frontend/assets/js/store.js': '''export class Store {
    constructor() {
        this.state = {
            user: null,
            complaints: [],
            loading: false
        };
        this.listeners = [];
    }
    
    getState() {
        return this.state;
    }
    
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notify();
    }
    
    setUser(user) {
        this.setState({ user });
    }
    
    subscribe(listener) {
        this.listeners.push(listener);
    }
    
    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }
}
''',

    'flask_frontend/assets/js/router.js': '''export class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
    }
    
    addRoute(path, handler) {
        this.routes[path] = handler;
    }
    
    navigate(path) {
        window.history.pushState({}, '', path);
        this.handleRoute(path);
    }
    
    handleRoute(path) {
        const handler = this.routes[path] || this.routes['/404'];
        if (handler) {
            handler();
        }
    }
    
    init() {
        // Register routes
        this.addRoute('/', () => this.loadPage('home'));
        this.addRoute('/login', () => this.loadPage('login'));
        this.addRoute('/complaints', () => this.loadPage('complaints'));
        
        // Handle initial load
        this.handleRoute(window.location.pathname);
        
        // Handle back/forward
        window.addEventListener('popstate', () => {
            this.handleRoute(window.location.pathname);
        });
    }
    
    loadPage(page) {
        document.getElementById('app').innerHTML = `<h1>${page}</h1>`;
    }
}
''',

    # ===== WSGI ENTRY POINT =====
    'flask_backend/wsgi.py': '''from app import create_app
from app.extensions import db
from app.models import *

app = create_app('development')

@app.cli.command()
def init_db():
    """Initialize database with tables and seed data"""
    with app.app_context():
        # Create tables
        db.create_all()
        print("✓ Database tables created")
        
        # Create default roles
        roles_data = [
            {'name': 'Student', 'description': 'Student role'},
            {'name': 'Staff', 'description': 'Staff role'},
            {'name': 'Department Head', 'description': 'Department Head role'},
            {'name': 'Vice Principal', 'description': 'Vice Principal role'},
            {'name': 'Principal', 'description': 'Principal role'},
            {'name': 'Super Admin', 'description': 'Super Admin role'}
        ]
        
        for role_data in roles_data:
            if not Role.query.filter_by(name=role_data['name']).first():
                role = Role(**role_data)
                db.session.add(role)
        
        db.session.commit()
        print("✓ Default roles created")
        
        # Create admin user
        if not User.query.filter_by(username='admin').first():
            admin = User(
                username='admin',
                email='admin@example.com',
                full_name='System Administrator',
                is_active=True,
                is_approved=True
            )
            admin.set_password('admin123')
            admin.roles = [Role.query.filter_by(name='Super Admin').first()]
            db.session.add(admin)
            db.session.commit()
            print("✓ Admin user created (admin/admin123)")
        
        # Create categories
        categories_data = [
            {'name': 'Facilities', 'description': 'Building and infrastructure issues'},
            {'name': 'Academics', 'description': 'Academic related complaints'},
            {'name': 'Canteen', 'description': 'Food and canteen services'},
            {'name': 'Transport', 'description': 'Transportation issues'},
            {'name': 'Library', 'description': 'Library related complaints'},
            {'name': 'Other', 'description': 'Other complaints'}
        ]
        
        for cat_data in categories_data:
            if not Category.query.filter_by(name=cat_data['name']).first():
                category = Category(**cat_data)
                db.session.add(category)
        
        db.session.commit()
        print("✓ Default categories created")
        
        # Create locations
        locations_data = [
            {'name': 'Main Building'},
            {'name': 'Science Block'},
            {'name': 'Library'},
            {'name': 'Canteen'},
            {'name': 'Sports Complex'},
            {'name': 'Playground'}
        ]
        
        for loc_data in locations_data:
            if not Location.query.filter_by(name=loc_data['name']).first():
                location = Location(**loc_data)
                db.session.add(location)
        
        db.session.commit()
        print("✓ Default locations created")
        
        print("\\n✅ Database initialization complete!")

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
'''
}


def create_files():
    """Create all files from templates"""
    print("🚀 Deploying Complete Student Complaint Hub System...")
    print("=" * 60)
    
    created = 0
    for file_path, content in FILES.items():
        full_path = BASE_DIR / file_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✓ Created: {file_path}")
        created += 1
    
    print("=" * 60)
    print(f"✅ Successfully created {created} files!")
    print("\n📋 Next Steps:")
    print("1. cd flask_backend")
    print("2. pip install -r requirements.txt")
    print("3. flask init-db")
    print("4. python wsgi.py")
    print("\nThe application will start at: http://127.0.0.1:5000")
    print("Frontend will be served from flask_frontend/")

if __name__ == '__main__':
    create_files()
