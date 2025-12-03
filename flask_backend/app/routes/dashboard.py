from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from ..extensions import db
from ..models import Complaint, User

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
