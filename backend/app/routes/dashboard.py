from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import datetime, timedelta
from ..database import get_db
from ..models import Complaint, User, Category
from ..schemas import DashboardStats
from ..utils.auth import get_current_user, is_staff

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics"""
    
    # Base query
    query = db.query(Complaint).filter(Complaint.is_deleted == False)
    
    # Filter by role
    if not is_staff(current_user):
        query = query.filter(Complaint.created_by == current_user.id)
    
    # Total complaints
    total_complaints = query.count()
    
    # Open complaints (not closed)
    open_complaints = query.filter(Complaint.status != "Closed").count()
    
    # Closed complaints
    closed_complaints = query.filter(Complaint.status == "Closed").count()
    
    # Overdue complaints
    overdue_complaints = query.filter(Complaint.is_overdue == True).count()
    
    # My complaints (created by current user)
    my_complaints = db.query(Complaint).filter(
        Complaint.created_by == current_user.id,
        Complaint.is_deleted == False
    ).count()
    
    # Average resolution time
    resolved_complaints = query.filter(
        Complaint.resolved_at.isnot(None)
    ).all()
    
    avg_resolution_time = 0.0
    if resolved_complaints:
        total_time = sum([
            (c.resolved_at - c.created_at).total_seconds() / 3600  # Hours
            for c in resolved_complaints
        ])
        avg_resolution_time = total_time / len(resolved_complaints)
    
    # Complaints by status
    status_counts = db.query(
        Complaint.status,
        func.count(Complaint.id)
    ).filter(
        Complaint.is_deleted == False
    ).group_by(Complaint.status).all()
    
    complaints_by_status = {status: count for status, count in status_counts}
    
    # Complaints by priority
    priority_counts = db.query(
        Complaint.priority,
        func.count(Complaint.id)
    ).filter(
        Complaint.is_deleted == False
    ).group_by(Complaint.priority).all()
    
    complaints_by_priority = {priority: count for priority, count in priority_counts}
    
    # Complaints by category
    category_counts = db.query(
        Category.name,
        func.count(Complaint.id)
    ).join(Complaint).filter(
        Complaint.is_deleted == False
    ).group_by(Category.name).all()
    
    complaints_by_category = {category: count for category, count in category_counts}
    
    return DashboardStats(
        total_complaints=total_complaints,
        open_complaints=open_complaints,
        closed_complaints=closed_complaints,
        overdue_complaints=overdue_complaints,
        my_complaints=my_complaints,
        avg_resolution_time=round(avg_resolution_time, 2),
        complaints_by_status=complaints_by_status,
        complaints_by_priority=complaints_by_priority,
        complaints_by_category=complaints_by_category
    )
