#!/usr/bin/env python3
"""
FINAL COMPLETE DEPLOYMENT - ALL ROUTES + COMPONENTS
This generates EVERYTHING needed for the complete system
"""

from pathlib import Path
import os

BASE = Path(__file__).parent

COMPLETE_FILES = {
    'flask_backend/app/routes/complaints.py': open(__file__).read().replace("COMPLAINT_ROUTES_HERE", '''from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Complaint, Category, Location, User, Comment, ComplaintLike, SLARule
from ..utils.decorators import staff_required

complaints_bp = Blueprint('complaints', __name__)

@complaints_bp.route('/', methods=['GET'])
@jwt_required()
def list_complaints():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    query = Complaint.query.filter_by(is_deleted=False)
    
    # Filter by role
    if not user.is_staff():
        query = query.filter_by(created_by=user_id)
    
    # Filters
    if status := request.args.get('status'):
        query = query.filter_by(status=status)
    if priority := request.args.get('priority'):
        query = query.filter_by(priority=priority)
    if category_id := request.args.get('category_id'):
        query = query.filter_by(category_id=category_id)
    if search := request.args.get('search'):
        query = query.filter(
            (Complaint.title.ilike(f'%{search}%')) |
            (Complaint.description.ilike(f'%{search}%'))
        )
    
    pagination = query.order_by(Complaint.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'items': [c.to_dict() for c in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'total_pages': pagination.pages
    }), 200

@complaints_bp.route('/', methods=['POST'])
@jwt_required()
def create_complaint():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Validate category
    category = Category.query.get(data.get('category_id'))
    if not category:
        return jsonify({'error': 'Invalid category'}), 400
    
    # Calculate SLA
    priority = data.get('priority', 'Medium')
    sla_rule = SLARule.query.filter_by(priority=priority, is_active=True).first()
    
    complaint = Complaint(
        title=data['title'],
        description=data['description'],
        category_id=data['category_id'],
        location_id=data.get('location_id'),
        priority=priority,
        is_anonymous=data.get('is_anonymous', False),
        privacy_mode=data.get('privacy_mode', 'public'),
        created_by=user_id,
        status='New'
    )
    
    # Set SLA due date
    if sla_rule:
        complaint.sla_minutes = sla_rule.resolution_time_minutes
        complaint.due_date = datetime.utcnow() + timedelta(minutes=sla_rule.resolution_time_minutes)
    
    db.session.add(complaint)
    db.session.commit()
    
    return jsonify(complaint.to_dict()), 201

@complaints_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_complaint(id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    complaint = Complaint.query.filter_by(id=id, is_deleted=False).first()
    if not complaint:
        return jsonify({'error': 'Complaint not found'}), 404
    
    # Check permissions
    if not user.is_staff() and complaint.created_by != user_id:
        return jsonify({'error': 'Access denied'}), 403
    
    # Increment view count
    complaint.view_count += 1
    db.session.commit()
    
    return jsonify(complaint.to_dict()), 200

@complaints_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_complaint(id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()
    
    complaint = Complaint.query.get(id)
    if not complaint:
        return jsonify({'error': 'Complaint not found'}), 404
    
    # Check permissions
    is_owner = complaint.created_by == user_id
    if not (is_owner or user.is_staff()):
        return jsonify({'error': 'Access denied'}), 403
    
    # Update fields
    if 'title' in data and (is_owner or user.is_staff()):
        complaint.title = data['title']
    if 'description' in data and (is_owner or user.is_staff()):
        complaint.description = data['description']
    if 'status' in data and user.is_staff():
        complaint.status = data['status']
        if data['status'] == 'Resolved':
            complaint.resolved_at = datetime.utcnow()
            complaint.resolved_by = user_id
    if 'priority' in data and user.is_staff():
        complaint.priority = data['priority']
    if 'assigned_to' in data and user.is_staff():
        complaint.assigned_to = data['assigned_to']
    
    db.session.commit()
    return jsonify(complaint.to_dict()), 200

@complaints_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_complaint(id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    complaint = Complaint.query.get(id)
    if not complaint:
        return jsonify({'error': 'Complaint not found'}), 404
    
    # Check permissions
    if not (complaint.created_by == user_id or user.is_admin()):
        return jsonify({'error': 'Access denied'}), 403
    
    complaint.is_deleted = True
    complaint.deleted_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({'message': 'Complaint deleted'}), 200

@complaints_bp.route('/<int:id>/like', methods=['POST'])
@jwt_required()
def toggle_like(id):
    user_id = get_jwt_identity()
    
    complaint = Complaint.query.filter_by(id=id, is_deleted=False).first()
    if not complaint:
        return jsonify({'error': 'Complaint not found'}), 404
    
    like = ComplaintLike.query.filter_by(complaint_id=id, user_id=user_id).first()
    
    if like:
        db.session.delete(like)
        liked = False
    else:
        like = ComplaintLike(complaint_id=id, user_id=user_id)
        db.session.add(like)
        liked = True
    
    db.session.commit()
    
    like_count = ComplaintLike.query.filter_by(complaint_id=id).count()
    return jsonify({'liked': liked, 'like_count': like_count}), 200

@complaints_bp.route('/<int:id>/comments', methods=['GET'])
@jwt_required()
def get_comments(id):
    complaint = Complaint.query.filter_by(id=id, is_deleted=False).first()
    if not complaint:
        return jsonify({'error': 'Complaint not found'}), 404
    
    comments = Comment.query.filter_by(complaint_id=id, is_deleted=False).order_by(Comment.created_at).all()
    return jsonify([c.to_dict() for c in comments]), 200

@complaints_bp.route('/<int:id>/comments', methods=['POST'])
@jwt_required()
def add_comment(id):
    user_id = get_jwt_identity()
    data = request.get_json()
    
    complaint = Complaint.query.filter_by(id=id, is_deleted=False).first()
    if not complaint:
        return jsonify({'error': 'Complaint not found'}), 404
    
    comment = Comment(
        complaint_id=id,
        author_id=user_id,
        content=data['content'],
        is_internal=data.get('is_internal', False)
    )
    db.session.add(comment)
    db.session.commit()
    
    return jsonify(comment.to_dict()), 201
'''),
    
    'flask_backend/app/routes/users.py': '''from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import User, UserProfile, UserSettings, UserFollow
from ..utils.decorators import admin_required

users_bp = Blueprint('users', __name__)

@users_bp.route('/', methods=['GET'])
@jwt_required()
@admin_required
def list_users():
    users = User.query.all()
    return jsonify([u.to_dict() for u in users]), 200

@users_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_user(id):
    user = User.query.get(id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict()), 200

@users_bp.route('/<int:id>/profile', methods=['GET'])
@jwt_required()
def get_profile(id):
    profile = UserProfile.query.filter_by(user_id=id).first()
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
    return jsonify(profile.to_dict()), 200

@users_bp.route('/<int:id>/profile', methods=['PUT'])
@jwt_required()
def update_profile(id):
    user_id = get_jwt_identity()
    if user_id != id:
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.get_json()
    profile = UserProfile.query.filter_by(user_id=id).first()
    
    if not profile:
        profile = UserProfile(user_id=id)
        db.session.add(profile)
    
    for key in ['bio', 'avatar_url', 'phone', 'department']:
        if key in data:
            setattr(profile, key, data[key])
    
    db.session.commit()
    return jsonify(profile.to_dict()), 200

@users_bp.route('/<int:id>/settings', methods=['GET'])
@jwt_required()
def get_settings(id):
    user_id = get_jwt_identity()
    if user_id != id:
        return jsonify({'error': 'Access denied'}), 403
    
    settings = UserSettings.query.filter_by(user_id=id).first()
    return jsonify(settings.to_dict() if settings else {}), 200

@users_bp.route('/<int:id>/settings', methods=['PUT'])
@jwt_required()
def update_settings(id):
    user_id = get_jwt_identity()
    if user_id != id:
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.get_json()
    settings = UserSettings.query.filter_by(user_id=id).first()
    
    if not settings:
        settings = UserSettings(user_id=id)
        db.session.add(settings)
    
    for key in ['show_real_name', 'email_notifications', 'push_notifications']:
        if key in data:
            setattr(settings, key, data[key])
    
    db.session.commit()
    return jsonify(settings.to_dict()), 200

@users_bp.route('/<int:id>/follow', methods=['POST'])
@jwt_required()
def toggle_follow(id):
    user_id = get_jwt_identity()
    
    if user_id == id:
        return jsonify({'error': 'Cannot follow yourself'}), 400
    
    follow = UserFollow.query.filter_by(follower_id=user_id, following_id=id).first()
    
    if follow:
        db.session.delete(follow)
        following = False
    else:
        follow = UserFollow(follower_id=user_id, following_id=id)
        db.session.add(follow)
        following = True
    
    db.session.commit()
    
    follower_count = UserFollow.query.filter_by(following_id=id).count()
    return jsonify({'following': following, 'follower_count': follower_count}), 200
''',

    'flask_backend/app/routes/admin.py': '''from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ..extensions import db
from ..models import Category, Location, User, Role
from ..utils.decorators import admin_required

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/categories', methods=['GET'])
@jwt_required()
def list_categories():
    categories = Category.query.filter_by(is_active=True).all()
    return jsonify([c.to_dict() for c in categories]), 200

@admin_bp.route('/categories', methods=['POST'])
@jwt_required()
@admin_required
def create_category():
    data = request.get_json()
    category = Category(name=data['name'], description=data.get('description'))
    db.session.add(category)
    db.session.commit()
    return jsonify(category.to_dict()), 201

@admin_bp.route('/locations', methods=['GET'])
@jwt_required()
def list_locations():
    locations = Location.query.filter_by(is_active=True).all()
    return jsonify([l.to_dict() for l in locations]), 200

@admin_bp.route('/locations', methods=['POST'])
@jwt_required()
@admin_required
def create_location():
    data = request.get_json()
    location = Location(name=data['name'], description=data.get('description'))
    db.session.add(location)
    db.session.commit()
    return jsonify(location.to_dict()), 201

@admin_bp.route('/users/<int:id>/approve', methods=['POST'])
@jwt_required()
@admin_required
def approve_user(id):
    user = User.query.get(id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user.is_approved = True
    db.session.commit()
    return jsonify({'message': 'User approved'}), 200

@admin_bp.route('/roles', methods=['GET'])
@jwt_required()
def list_roles():
    roles = Role.query.all()
    return jsonify([r.to_dict() for r in roles]), 200
''',

    'flask_backend/app/routes/dashboard.py': '''from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from ..models import Complaint, User, Category

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    query = Complaint.query.filter_by(is_deleted=False)
    
    if not user.is_staff():
        query = query.filter_by(created_by=user_id)
    
    total = query.count()
    open_count = query.filter(Complaint.status != 'Closed').count()
    closed_count = query.filter_by(status='Closed').count()
    overdue_count = query.filter_by(is_overdue=True).count()
    
    # By status
    by_status = db.session.query(
        Complaint.status, func.count(Complaint.id)
    ).filter_by(is_deleted=False).group_by(Complaint.status).all()
    
    # By priority
    by_priority = db.session.query(
        Complaint.priority, func.count(Complaint.id)
    ).filter_by(is_deleted=False).group_by(Complaint.priority).all()
    
    return jsonify({
        'total_complaints': total,
        'open_complaints': open_count,
        'closed_complaints': closed_count,
        'overdue_complaints': overdue_count,
        'by_status': dict(by_status),
        'by_priority': dict(by_priority)
    }), 200
'''
}

def deploy():
    print("🚀 FINAL DEPLOYMENT - Creating ALL remaining files...")
    print("="*70)
    
    for path, content in COMPLETE_FILES.items():
        full_path = BASE / path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        full_path.write_text(content, encoding='utf-8')
        print(f"✓ {path}")
    
    print("="*70)
    print("✅ DEPLOYMENT COMPLETE!")
    print("\n📦 QUICK START:")
    print("   cd flask_backend")
    print("   pip install -r requirements.txt")
    print("   flask init-db")
    print("   python wsgi.py")
    print("\n🌐 Access at: http://127.0.0.1:5000")

if __name__ == '__main__':
    deploy()
