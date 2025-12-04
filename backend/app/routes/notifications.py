from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Notification

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('', methods=['GET'])
@notifications_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get notifications for current user"""
    user_id = get_jwt_identity()
    user_id = int(user_id) if isinstance(user_id, str) else user_id
    
    notifications = Notification.query.filter_by(user_id=user_id).order_by(
        Notification.created_at.desc()
    ).limit(50).all()
    
    unread_count = Notification.query.filter_by(
        user_id=user_id,
        is_read=False
    ).count()
    
    return jsonify({
        'notifications': [n.to_dict() for n in notifications],
        'unread_count': unread_count
    }), 200

@notifications_bp.route('/<int:id>/read', methods=['POST'])
@jwt_required()
def mark_notification_read(id):
    """Mark a notification as read"""
    user_id = get_jwt_identity()
    user_id = int(user_id) if isinstance(user_id, str) else user_id
    
    notification = Notification.query.filter_by(id=id, user_id=user_id).first()
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404
    
    notification.is_read = True
    db.session.commit()
    
    return jsonify({'message': 'Notification marked as read'}), 200

