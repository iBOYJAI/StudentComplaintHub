from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash, generate_password_hash
from ..extensions import db
from ..models import User, UserProfile

profile_bp = Blueprint('profile', __name__)


@profile_bp.route('', methods=['GET'])
@profile_bp.route('/', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user's profile"""
    user_id = get_jwt_identity()
    user_id = int(user_id) if isinstance(user_id, str) else user_id
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    profile = UserProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        profile = UserProfile(user_id=user_id)
        db.session.add(profile)
        db.session.commit()
    
    return jsonify({
        'user': user.to_dict(),
        'profile': profile.to_dict()
    }), 200


@profile_bp.route('', methods=['PUT'])
@profile_bp.route('/', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update current user's profile"""
    user_id = get_jwt_identity()
    user_id = int(user_id) if isinstance(user_id, str) else user_id
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json() or {}
    
    # Update user fields
    if 'full_name' in data:
        user.full_name = data['full_name'].strip()
    if 'email' in data:
        user.email = data['email'].strip()
    
    # Update or create profile
    profile = UserProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        profile = UserProfile(user_id=user_id)
        db.session.add(profile)
    
    for key in ['bio', 'avatar_url', 'phone', 'department']:
        if key in data:
            setattr(profile, key, data[key])
    
    db.session.commit()
    
    return jsonify({
        'user': user.to_dict(),
        'profile': profile.to_dict()
    }), 200


@profile_bp.route('/password', methods=['PUT'])
@jwt_required()
def change_password():
    """Change current user's password"""
    user_id = get_jwt_identity()
    user_id = int(user_id) if isinstance(user_id, str) else user_id
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json() or {}
    
    if not data.get('current_password'):
        return jsonify({'error': 'Current password is required'}), 400
    
    if not data.get('new_password'):
        return jsonify({'error': 'New password is required'}), 400
    
    if len(data['new_password']) < 6:
        return jsonify({'error': 'New password must be at least 6 characters'}), 400
    
    # Verify current password
    if not check_password_hash(user.password_hash, data['current_password']):
        return jsonify({'error': 'Current password is incorrect'}), 400
    
    # Update password
    user.set_password(data['new_password'])
    db.session.commit()
    
    return jsonify({'message': 'Password updated successfully'}), 200

