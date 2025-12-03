from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel
from ..database import get_db
from ..models import Complaint, User
from ..models.extended_models import Poll, PollOption, PollVote
from ..utils.auth import get_current_user, is_staff, is_admin
from ..utils.audit import log_action

router = APIRouter(prefix="/api/polls", tags=["Polls"])

# Poll schemas
class PollCreate(BaseModel):
    question: str
    options: List[str]  # ["Low", "Medium", "High", "Urgent"]
    expires_at: Optional[str] = None

class PollOptionResponse(BaseModel):
    id: int
    option_text: str
    vote_count: int
    percentage: float = 0.0
    
    class Config:
        from_attributes = True

class PollResponse(BaseModel):
    id: int
    complaint_id: int
    question: str
    is_active: bool
    total_votes: int
    user_voted: bool = False
    user_vote_option_id: Optional[int] = None
    options: List[PollOptionResponse] = []
    
    class Config:
        from_attributes = True

@router.post("/complaints/{complaint_id}/poll", response_model=PollResponse, status_code=status.HTTP_201_CREATED)
async def create_poll(
    complaint_id: int,
    poll_data: PollCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a poll for a complaint (staff/admin only)"""
    
    if not (is_staff(current_user) or is_admin(current_user)):
        raise HTTPException(status_code=403, detail="Staff or admin access required")
    
    complaint = db.query(Complaint).filter(
        Complaint.id == complaint_id,
        Complaint.is_deleted == False
    ).first()
    
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # Check if poll already exists
    existing_poll = db.query(Poll).filter(Poll.complaint_id == complaint_id).first()
    if existing_poll:
        raise HTTPException(status_code=400, detail="Poll already exists for this complaint")
    
    # Create poll
    from datetime import datetime
    expires_at = None
    if poll_data.expires_at:
        try:
            expires_at = datetime.fromisoformat(poll_data.expires_at.replace('Z', '+00:00'))
        except:
            pass
    
    poll = Poll(
        complaint_id=complaint_id,
        question=poll_data.question,
        expires_at=expires_at
    )
    db.add(poll)
    db.flush()
    
    # Create poll options
    for idx, option_text in enumerate(poll_data.options):
        option = PollOption(
            poll_id=poll.id,
            option_text=option_text,
            order=idx
        )
        db.add(option)
    
    db.commit()
    db.refresh(poll)
    
    # Update complaint priority based on poll (if needed)
    # This can be done automatically when votes come in
    
    log_action(db, current_user.id, "POLL_CREATED", "Poll", poll.id)
    
    # Build response
    options = db.query(PollOption).filter(PollOption.poll_id == poll.id).order_by(PollOption.order).all()
    option_responses = []
    for opt in options:
        option_responses.append(PollOptionResponse(
            id=opt.id,
            option_text=opt.option_text,
            vote_count=opt.vote_count,
            percentage=0.0
        ))
    
    response = PollResponse(
        id=poll.id,
        complaint_id=poll.complaint_id,
        question=poll.question,
        is_active=poll.is_active,
        total_votes=0,
        user_voted=False,
        options=option_responses
    )
    
    return response

@router.post("/{poll_id}/vote")
async def vote_poll(
    poll_id: int,
    option_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Vote on a poll option"""
    
    poll = db.query(Poll).filter(Poll.id == poll_id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    if not poll.is_active:
        raise HTTPException(status_code=400, detail="Poll is not active")
    
    # Check if poll expired
    from datetime import datetime
    if poll.expires_at and poll.expires_at < datetime.utcnow():
        poll.is_active = False
        db.commit()
        raise HTTPException(status_code=400, detail="Poll has expired")
    
    # Verify option belongs to poll
    option = db.query(PollOption).filter(
        PollOption.id == option_id,
        PollOption.poll_id == poll_id
    ).first()
    
    if not option:
        raise HTTPException(status_code=404, detail="Poll option not found")
    
    # Check if user already voted
    existing_vote = db.query(PollVote).filter(
        PollVote.poll_id == poll_id,
        PollVote.user_id == current_user.id
    ).first()
    
    if existing_vote:
        # Update existing vote
        old_option_id = existing_vote.option_id
        existing_vote.option_id = option_id
        
        # Update vote counts
        old_option = db.query(PollOption).filter(PollOption.id == old_option_id).first()
        if old_option and old_option.vote_count > 0:
            old_option.vote_count -= 1
        
        option.vote_count += 1
    else:
        # Create new vote
        vote = PollVote(
            poll_id=poll_id,
            option_id=option_id,
            user_id=current_user.id
        )
        db.add(vote)
        option.vote_count += 1
    
    db.commit()
    
    # Update complaint priority based on winning option
    complaint = db.query(Complaint).filter(Complaint.id == poll.complaint_id).first()
    if complaint:
        # Get option with most votes
        winning_option = db.query(PollOption).filter(
            PollOption.poll_id == poll_id
        ).order_by(PollOption.vote_count.desc()).first()
        
        if winning_option:
            # Map option text to priority
            priority_map = {
                "Low": "Low",
                "Medium": "Medium",
                "High": "High",
                "Urgent": "Urgent"
            }
            new_priority = priority_map.get(winning_option.option_text, complaint.priority)
            if new_priority != complaint.priority:
                complaint.priority = new_priority
                db.commit()
    
    # Get updated poll data
    total_votes = db.query(func.sum(PollOption.vote_count)).filter(
        PollOption.poll_id == poll_id
    ).scalar() or 0
    
    options = db.query(PollOption).filter(PollOption.poll_id == poll_id).order_by(PollOption.order).all()
    option_responses = []
    for opt in options:
        percentage = (opt.vote_count / total_votes * 100) if total_votes > 0 else 0.0
        option_responses.append(PollOptionResponse(
            id=opt.id,
            option_text=opt.option_text,
            vote_count=opt.vote_count,
            percentage=round(percentage, 1)
        ))
    
    # Get user's vote
    user_vote = db.query(PollVote).filter(
        PollVote.poll_id == poll_id,
        PollVote.user_id == current_user.id
    ).first()
    
    response = PollResponse(
        id=poll.id,
        complaint_id=poll.complaint_id,
        question=poll.question,
        is_active=poll.is_active,
        total_votes=int(total_votes),
        user_voted=user_vote is not None,
        user_vote_option_id=user_vote.option_id if user_vote else None,
        options=option_responses
    )
    
    return response

@router.get("/complaints/{complaint_id}/poll", response_model=PollResponse)
async def get_poll(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get poll for a complaint"""
    
    complaint = db.query(Complaint).filter(
        Complaint.id == complaint_id,
        Complaint.is_deleted == False
    ).first()
    
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    poll = db.query(Poll).filter(Poll.complaint_id == complaint_id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    # Get total votes
    total_votes = db.query(func.sum(PollOption.vote_count)).filter(
        PollOption.poll_id == poll.id
    ).scalar() or 0
    
    # Get options
    options = db.query(PollOption).filter(PollOption.poll_id == poll.id).order_by(PollOption.order).all()
    option_responses = []
    for opt in options:
        percentage = (opt.vote_count / total_votes * 100) if total_votes > 0 else 0.0
        option_responses.append(PollOptionResponse(
            id=opt.id,
            option_text=opt.option_text,
            vote_count=opt.vote_count,
            percentage=round(percentage, 1)
        ))
    
    # Get user's vote
    user_vote = db.query(PollVote).filter(
        PollVote.poll_id == poll.id,
        PollVote.user_id == current_user.id
    ).first()
    
    response = PollResponse(
        id=poll.id,
        complaint_id=poll.complaint_id,
        question=poll.question,
        is_active=poll.is_active,
        total_votes=int(total_votes),
        user_voted=user_vote is not None,
        user_vote_option_id=user_vote.option_id if user_vote else None,
        options=option_responses
    )
    
    return response

