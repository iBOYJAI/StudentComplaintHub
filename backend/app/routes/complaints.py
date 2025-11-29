from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from typing import List, Optional
from datetime import datetime, timedelta
from ..database import get_db
from ..models import Complaint, User, Category, Location, TimelineEvent, Attachment, SLARule, ComplaintVote
from ..schemas import (
    ComplaintCreate, ComplaintUpdate, ComplaintResponse, 
    PaginatedResponse, ComplaintFilter, TimelineEventResponse,
    AttachmentResponse, VoteStats, VoteResponse
)
from ..utils.auth import get_current_user, is_admin, is_staff
from ..utils.audit import log_action
from ..utils.files import process_attachment

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])

def create_timeline_event(db: Session, complaint_id: int, event_type: str, description: str, actor_id: int = None):
    """Helper to create timeline events"""
    event = TimelineEvent(
        complaint_id=complaint_id,
        event_type=event_type,
        description=description,
        actor_id=actor_id
    )
    db.add(event)
    db.commit()

def calculate_sla_due_date(priority: str, created_at: datetime, db: Session) -> Optional[datetime]:
    """Calculate SLA due date based on priority"""
    sla_rule = db.query(SLARule).filter(
        SLARule.priority == priority,
        SLARule.is_active == True
    ).first()
    
    if sla_rule:
        return created_at + timedelta(minutes=sla_rule.resolution_time_minutes)
    
    # Default SLA times
    sla_defaults = {
        "Low": 10080,
        "Medium": 4320,
        "High": 1440,
        "Urgent": 240
    }
    minutes = sla_defaults.get(priority, 4320)
    return created_at + timedelta(minutes=minutes)

@router.post("/", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    complaint_data: ComplaintCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new complaint"""
    
    # Verify category exists
    category = db.query(Category).filter(Category.id == complaint_data.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Verify location if provided
    if complaint_data.location_id:
        location = db.query(Location).filter(Location.id == complaint_data.location_id).first()
        if not location:
            raise HTTPException(status_code=404, detail="Location not found")
    
    # Create complaint
    complaint = Complaint(
        title=complaint_data.title,
        description=complaint_data.description,
        category_id=complaint_data.category_id,
        location_id=complaint_data.location_id,
        priority=complaint_data.priority,
        is_anonymous=complaint_data.is_anonymous,
        privacy_mode=complaint_data.privacy_mode,
        created_by=current_user.id,
        status="New"
    )
    
    # Calculate SLA
    complaint.due_date = calculate_sla_due_date(complaint.priority, datetime.utcnow(), db)
    
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    
    # Create timeline event
    create_timeline_event(
        db, complaint.id, "created", 
        f"Complaint created: {complaint.title}", 
        current_user.id
    )
    
    # Log action
    log_action(db, current_user.id, "COMPLAINT_CREATED", "Complaint", complaint.id)
    
    # Build response
    response = ComplaintResponse.from_orm(complaint)
    response.category_name = category.name
    response.creator_name = current_user.full_name if not complaint.is_anonymous else "Anonymous"
    
    return response

@router.get("/", response_model=PaginatedResponse)
async def list_complaints(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category_id: Optional[int] = None,
    location_id: Optional[int] = None,
    assigned_to: Optional[int] = None,
    created_by: Optional[int] = None,
    is_overdue: Optional[bool] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List complaints with filters and pagination"""
    
    query = db.query(Complaint).filter(Complaint.is_deleted == False)
    
    # Role-based filtering
    user_role_names = [role.name for role in current_user.roles]
    if "Student" in user_role_names and not is_staff(current_user):
        # Students only see their own complaints
        query = query.filter(Complaint.created_by == current_user.id)
    
    # Apply filters
    if status:
        query = query.filter(Complaint.status == status)
    
    if priority:
        query = query.filter(Complaint.priority == priority)
    
    if category_id:
        query = query.filter(Complaint.category_id == category_id)
    
    if location_id:
        query = query.filter(Complaint.location_id == location_id)
    
    if assigned_to:
        query = query.filter(Complaint.assigned_to == assigned_to)
    
    if created_by:
        query = query.filter(Complaint.created_by == created_by)
    
    if is_overdue is not None:
        query = query.filter(Complaint.is_overdue == is_overdue)
    
    # Search in title and description
    if search:
        search_filter = or_(
            Complaint.title.ilike(f"%{search}%"),
            Complaint.description.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    # Get total count
    total = query.count()
    
    # Pagination
    offset = (page - 1) * page_size
    complaints = query.order_by(Complaint.created_at.desc()).offset(offset).limit(page_size).all()
    
    # Build response with related data
    items = []
    for complaint in complaints:
        response = ComplaintResponse.from_orm(complaint)
        response.category_name = complaint.category.name if complaint.category else None
        response.location_name = complaint.location.name if complaint.location else None
        response.creator_name = complaint.creator.full_name if not complaint.is_anonymous else "Anonymous"
        response.assignee_name = complaint.assignee.full_name if complaint.assignee else None
        items.append(response)
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )

@router.get("/{complaint_id}", response_model=ComplaintResponse)
async def get_complaint(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get complaint details"""
    
    complaint = db.query(Complaint).filter(
        Complaint.id == complaint_id,
        Complaint.is_deleted == False
    ).first()
    
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # Check permissions
    if not is_staff(current_user) and complaint.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    response = ComplaintResponse.from_orm(complaint)
    response.category_name = complaint.category.name if complaint.category else None
    response.location_name = complaint.location.name if complaint.location else None
    response.creator_name = complaint.creator.full_name if not complaint.is_anonymous else "Anonymous"
    response.assignee_name = complaint.assignee.full_name if complaint.assignee else None
    
    return response

@router.put("/{complaint_id}", response_model=ComplaintResponse)
async def update_complaint(
    complaint_id: int,
    complaint_data: ComplaintUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update complaint"""
    
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # Check permissions
    is_creator = complaint.created_by == current_user.id
    has_staff_role = is_staff(current_user)
    
    if not (is_creator or has_staff_role):
        raise HTTPException(status_code=403, detail="Access denied")
    
    old_values = {}
    new_values = {}
    
    # Update fields
    if complaint_data.title is not None and (is_creator or has_staff_role):
        old_values["title"] = complaint.title
        complaint.title = complaint_data.title
        new_values["title"] = complaint.title
    
    if complaint_data.description is not None and (is_creator or has_staff_role):
        old_values["description"] = complaint.description
        complaint.description = complaint_data.description
        new_values["description"] = complaint.description
    
    if complaint_data.status is not None and has_staff_role:
        old_status = complaint.status
        complaint.status = complaint_data.status
        create_timeline_event(
            db, complaint.id, "status_changed",
            f"Status changed from {old_status} to {complaint.status}",
            current_user.id
        )
        
        if complaint.status == "Acknowledged" and not complaint.acknowledged_at:
            complaint.acknowledged_at = datetime.utcnow()
        elif complaint.status == "Resolved" and not complaint.resolved_at:
            complaint.resolved_at = datetime.utcnow()
            complaint.resolved_by = current_user.id
        elif complaint.status == "Closed" and not complaint.closed_at:
            complaint.closed_at = datetime.utcnow()
    
    if complaint_data.assigned_to is not None and has_staff_role:
        old_assignee_id = complaint.assigned_to
        complaint.assigned_to = complaint_data.assigned_to
        
        assignee = db.query(User).filter(User.id == complaint_data.assigned_to).first()
        create_timeline_event(
            db, complaint.id, "assigned",
            f"Assigned to {assignee.full_name if assignee else 'Unknown'}",
            current_user.id
        )
    
    if complaint_data.resolution_notes is not None and has_staff_role:
        complaint.resolution_notes = complaint_data.resolution_notes
    
    db.commit()
    db.refresh(complaint)
    
    log_action(db, current_user.id, "COMPLAINT_UPDATED", "Complaint", complaint.id, old_values, new_values)
    
    response = ComplaintResponse.from_orm(complaint)
    response.category_name = complaint.category.name if complaint.category else None
    response.location_name = complaint.location.name if complaint.location else None
    response.creator_name = complaint.creator.full_name if not complaint.is_anonymous else "Anonymous"
    response.assignee_name = complaint.assignee.full_name if complaint.assignee else None
    
    return response

@router.delete("/{complaint_id}")
async def delete_complaint(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Soft delete complaint"""
    
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    complaint.is_deleted = True
    complaint.deleted_at = datetime.utcnow()
    db.commit()
    
    log_action(db, current_user.id, "COMPLAINT_DELETED", "Complaint", complaint.id)
    
    return {"message": "Complaint deleted successfully"}

@router.post("/{complaint_id}/escalate")
async def escalate_complaint(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Escalate complaint"""
    
    if not is_staff(current_user):
        raise HTTPException(status_code=403, detail="Staff access required")
    
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    complaint.is_escalated = True
    complaint.escalated_at = datetime.utcnow()
    db.commit()
    
    create_timeline_event(
        db, complaint.id, "escalated",
        "Complaint escalated",
        current_user.id
    )
    
    log_action(db, current_user.id, "COMPLAINT_ESCALATED", "Complaint", complaint.id)
    
    return {"message": "Complaint escalated successfully"}

@router.get("/{complaint_id}/timeline", response_model=List[TimelineEventResponse])
async def get_complaint_timeline(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get complaint timeline"""
    
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # Check permissions
    if not is_staff(current_user) and complaint.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    events = db.query(TimelineEvent).filter(
        TimelineEvent.complaint_id == complaint_id
    ).order_by(TimelineEvent.created_at).all()
    
    result = []
    for event in events:
        response = TimelineEventResponse.from_orm(event)
        if event.actor_id:
            actor = db.query(User).filter(User.id == event.actor_id).first()
            response.actor_name = actor.full_name if actor else None
        result.append(response)
    
    return result

# Voting endpoints
@router.post("/{complaint_id}/vote", response_model=VoteStats)
async def vote_complaint(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Vote for a complaint (like/upvote)"""
    
    # Check if complaint exists
    complaint = db.query(Complaint).filter(
        Complaint.id == complaint_id,
        Complaint.is_deleted == False
    ).first()
    
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # Check if user already voted
    existing_vote = db.query(ComplaintVote).filter(
        ComplaintVote.complaint_id == complaint_id,
        ComplaintVote.user_id == current_user.id
    ).first()
    
    if existing_vote:
        raise HTTPException(status_code=400, detail="Already voted")
    
    # Create vote
    vote = ComplaintVote(
        complaint_id=complaint_id,
        user_id=current_user.id
    )
    db.add(vote)
    
    # Update vote count
    complaint.vote_count = complaint.vote_count + 1
    db.commit()
    
    # Create timeline event
    create_timeline_event(
        db, complaint.id, "voted",
        f"{current_user.full_name} voted for this complaint",
        current_user.id
    )
    
    # Get recent voters
    recent_votes = db.query(ComplaintVote).filter(
        ComplaintVote.complaint_id == complaint_id
    ).order_by(ComplaintVote.created_at.desc()).limit(10).all()
    
    recent_voters = []
    for vote in recent_votes:
        voter = db.query(User).filter(User.id == vote.user_id).first()
        recent_voters.append(VoteResponse(
            id=vote.id,
            user_id=vote.user_id,
            user_name=voter.full_name if voter else "Unknown",
            created_at=vote.created_at
        ))
    
    return VoteStats(
        vote_count=complaint.vote_count,
        user_voted=True,
        recent_voters=recent_voters
    )

@router.delete("/{complaint_id}/vote", response_model=VoteStats)
async def unvote_complaint(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove vote from a complaint"""
    
    # Check if complaint exists
    complaint = db.query(Complaint).filter(
        Complaint.id == complaint_id,
        Complaint.is_deleted == False
    ).first()
    
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # Find existing vote
    existing_vote = db.query(ComplaintVote).filter(
        ComplaintVote.complaint_id == complaint_id,
        ComplaintVote.user_id == current_user.id
    ).first()
    
    if not existing_vote:
        raise HTTPException(status_code=400, detail="Vote not found")
    
    # Remove vote
    db.delete(existing_vote)
    
    # Update vote count
    complaint.vote_count = max(0, complaint.vote_count - 1)
    db.commit()
    
    # Get recent voters
    recent_votes = db.query(ComplaintVote).filter(
        ComplaintVote.complaint_id == complaint_id
    ).order_by(ComplaintVote.created_at.desc()).limit(10).all()
    
    recent_voters = []
    for vote in recent_votes:
        voter = db.query(User).filter(User.id == vote.user_id).first()
        recent_voters.append(VoteResponse(
            id=vote.id,
            user_id=vote.user_id,
            user_name=voter.full_name if voter else "Unknown",
            created_at=vote.created_at
        ))
    
    return VoteStats(
        vote_count=complaint.vote_count,
        user_voted=False,
        recent_voters=recent_voters
    )

@router.get("/{complaint_id}/votes", response_model=VoteStats)
async def get_complaint_votes(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get vote statistics for a complaint"""
    
    # Check if complaint exists
    complaint = db.query(Complaint).filter(
        Complaint.id == complaint_id,
        Complaint.is_deleted == False
    ).first()
    
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # Check if current user voted
    user_voted = db.query(ComplaintVote).filter(
        ComplaintVote.complaint_id == complaint_id,
        ComplaintVote.user_id == current_user.id
    ).first() is not None
    
    # Get recent voters
    recent_votes = db.query(ComplaintVote).filter(
        ComplaintVote.complaint_id == complaint_id
    ).order_by(ComplaintVote.created_at.desc()).limit(10).all()
    
    recent_voters = []
    for vote in recent_votes:
        voter = db.query(User).filter(User.id == vote.user_id).first()
        recent_voters.append(VoteResponse(
            id=vote.id,
            user_id=vote.user_id,
            user_name=voter.full_name if voter else "Unknown",
            created_at=vote.created_at
        ))
    
    return VoteStats(
        vote_count=complaint.vote_count,
        user_voted=user_voted,
        recent_voters=recent_voters
    )
