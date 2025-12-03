from flask import Blueprint, request, jsonify
from datetime import datetime
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from ..extensions import db
from ..models import User, Role, UserProfile, UserSettings
from ..utils.validators import validate_email, validate_password, validate_username

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register new user"""
    data = request.get_json()
    
    # Validate input
    if not validate_username(data.get('username', '')):
        return jsonify({'error': 'Invalid username'}), 400
    
    if not validate_email(data.get('email', '')):
        return jsonify({'error': 'Invalid email'}), 400
    
    if not validate_password(data.get('password', '')):
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    # Check if user exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    # Create user
    user = User(
        username=data['username'],
        email=data['email'],
        full_name=data['full_name'],
        is_active=True,
        is_approved=False  # Requires admin approval
    )
    user.set_password(data['password'])
    
    # Assign Student role by default
    student_role = Role.query.filter_by(name='Student').first()
    if student_role:
        user.roles = [student_role]
    
    db.session.add(user)
    db.session.commit()
    
    # Create profile and settings
    profile = UserProfile(user_id=user.id)
    settings = UserSettings(user_id=user.id)
    db.session.add(profile)
    db.session.add(settings)
    db.session.commit()
    
    return jsonify({
        'message': 'Registration successful. Waiting for admin approval.',
        'user': user.to_dict()
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login with username and password"""
    data = request.get_json()
    
    user = User.query.filter_by(username=data.get('username')).first()
    
    if not user or not user.check_password(data.get('password', '')):
        return jsonify({'error': 'Invalid username or password'}), 401
    
    if not user.is_active:
        return jsonify({'error': 'Account is inactive'}), 403
    
    if not user.is_approved:
        return jsonify({'error': 'Account is not approved yet'}), 403
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.session.commit()
    
    # Create access token
    access_token = create_access_token(identity=user.id)
    
    return jsonify({
        'access_token': access_token,
        'token_type': 'bearer',
        'user': user.to_dict()
    }), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user information"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_dict()), 200


@auth_bp.route('/pin/setup', methods=['POST'])
@jwt_required()
def setup_pin():
    """Setup or update PIN for quick login"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()
    
    pin = data.get('pin', '')
    if len(pin) < 4 or len(pin) > 8:
        return jsonify({'error': 'PIN must be 4-8 characters'}), 400
    
    user.set_pin(pin)
    db.session.commit()
    
    return jsonify({'message': 'PIN setup successful'}), 200


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user"""
    return jsonify({'message': 'Logged out successfully'}), 200
