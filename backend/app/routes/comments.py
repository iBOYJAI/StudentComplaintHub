from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Comment, User
from ..models.extended_models import CommentLike
from ..utils.auth import get_current_user

router = APIRouter(prefix="/api/comments", tags=["Comments"])

@router.post("/{comment_id}/like")
async def toggle_comment_like(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle like on a comment"""
    
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.is_deleted == False
    ).first()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check if already liked
    existing_like = db.query(CommentLike).filter(
        CommentLike.comment_id == comment_id,
        CommentLike.user_id == current_user.id
    ).first()
    
    if existing_like:
        # Unlike
        db.delete(existing_like)
        liked = False
    else:
        # Like
        like = CommentLike(
            comment_id=comment_id,
            user_id=current_user.id
        )
        db.add(like)
        liked = True
    
    db.commit()
    
    # Get like count
    like_count = db.query(CommentLike).filter(
        CommentLike.comment_id == comment_id
    ).count()
    
    return {
        "liked": liked,
        "like_count": like_count
    }

