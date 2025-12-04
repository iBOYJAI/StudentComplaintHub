from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from datetime import datetime, timedelta
from ..extensions import db
from ..models import Complaint, User, Category

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    user_id = get_jwt_identity()
    # Convert user_id to int if it's a string (from JWT)
    user_id = int(user_id) if isinstance(user_id, str) else user_id
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    query = Complaint.query.filter_by(is_deleted=False)
    
    if user.is_admin():
        # Admin sees all complaints
        pass
    elif user.is_staff():
        # Staff sees assigned complaints
        query = query.filter_by(assigned_to=user_id)
    else:
        # Students see their own complaints
        query = query.filter_by(created_by=user_id)
    
    total = query.count()
    open_count = query.filter(Complaint.status.in_(['New', 'Open'])).count()
    in_progress_count = query.filter_by(status='In Progress').count()
    resolved_count = query.filter_by(status='Resolved').count()
    overdue_count = query.filter_by(is_overdue=True).count()
    
    # For admin dashboard
    if user.is_admin():
        active_users = User.query.filter_by(is_active=True).count()
        total_users = User.query.count()
        
        # Resolution rate (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        resolved_recent = Complaint.query.filter(
            Complaint.status == 'Resolved',
            Complaint.resolved_at >= thirty_days_ago,
            Complaint.is_deleted == False
        ).count()
        total_recent = Complaint.query.filter(
            Complaint.created_at >= thirty_days_ago,
            Complaint.is_deleted == False
        ).count()
        resolution_rate = round((resolved_recent / total_recent * 100) if total_recent > 0 else 0, 1)
        
        # Get complaints by status for charts
        by_status = db.session.query(
            Complaint.status, func.count(Complaint.id)
        ).filter_by(is_deleted=False).group_by(Complaint.status).all()
        
        # Get complaints by category for charts
        by_category = db.session.query(
            Category.name, func.count(Complaint.id)
        ).join(Complaint, Category.id == Complaint.category_id).filter_by(
            is_deleted=False
        ).group_by(Category.name).all()
        
        # Get monthly trends (last 6 months)
        six_months_ago = datetime.utcnow() - timedelta(days=180)
        # Use SQLite's strftime function via text()
        from sqlalchemy import text
        try:
            monthly_trends_raw = db.session.execute(
                text("""
                    SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
                    FROM complaints
                    WHERE created_at >= :six_months_ago AND is_deleted = 0
                    GROUP BY month
                    ORDER BY month
                """),
                {'six_months_ago': six_months_ago}
            ).fetchall()
            monthly_trends = [{'month': row[0], 'count': row[1]} for row in monthly_trends_raw]
        except Exception as e:
            print(f"Error getting monthly trends: {e}")
            monthly_trends = []
        
        # Calculate average response time (time from created to updated)
        # For SQLite, use julianday for date difference
        from sqlalchemy import text
        avg_response_result = db.session.execute(
            text("""
                SELECT AVG((julianday(updated_at) - julianday(created_at)) * 24) as avg_hours
                FROM complaints
                WHERE status != 'New' AND is_deleted = 0 
                AND updated_at IS NOT NULL AND created_at IS NOT NULL
            """)
        ).scalar()
        avg_response_hours = round(avg_response_result, 1) if avg_response_result else 0
        
        return jsonify({
            'totalComplaints': total,
            'activeUsers': active_users,
            'totalUsers': total_users,
            'resolutionRate': resolution_rate,
            'avgResponseTime': round(avg_response_hours, 1) if avg_response_hours else 'N/A',
            'open_complaints': open_count,
            'in_progress_complaints': in_progress_count,
            'resolved_complaints': resolved_count,
            'overdue_complaints': overdue_count,
            'by_status': dict(by_status),
            'by_category': dict(by_category),
            'monthly_trends': [{'month': m[0], 'count': m[1]} for m in monthly_trends]
        }), 200
    
    # For staff dashboard
    if user.is_staff():
        resolved_today = query.filter(
            Complaint.status == 'Resolved',
            Complaint.resolved_at >= datetime.utcnow().date()
        ).count()
        
        return jsonify({
            'total': total,
            'pending': open_count,
            'inProgress': in_progress_count,
            'resolvedToday': resolved_today,
            'overdue': overdue_count
        }), 200
    
    # For student dashboard
    return jsonify({
        'total': total,
        'open': open_count,
        'in_progress': in_progress_count,
        'resolved': resolved_count
    }), 200
