from flask import Blueprint, request, jsonify
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
