from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import AuditLog, User
from ..utils.decorators import admin_required

audit_log_bp = Blueprint('audit_log', __name__)

@audit_log_bp.route('', methods=['GET'])
@audit_log_bp.route('/', methods=['GET'])
@jwt_required()
@admin_required
def get_audit_logs():
    """Get audit logs (admin only)"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    action = request.args.get('action')
    resource_type = request.args.get('resource_type')
    user_id = request.args.get('user_id', type=int)
    
    query = AuditLog.query
    
    if action:
        query = query.filter_by(action=action)
    if resource_type:
        query = query.filter_by(resource_type=resource_type)
    if user_id:
        query = query.filter_by(user_id=user_id)
    
    pagination = query.order_by(AuditLog.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    # Include user info in response
    logs = []
    for log in pagination.items:
        log_dict = log.to_dict()
        if log.user_id:
            user = User.query.get(log.user_id)
            if user:
                log_dict['user'] = {
                    'id': user.id,
                    'username': user.username,
                    'full_name': user.full_name
                }
        logs.append(log_dict)
    
    return jsonify({
        'items': logs,
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'total_pages': pagination.pages
    }), 200

