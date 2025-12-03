from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import User, Role, Complaint
from ..models.extended_models import UserFollow, UserProfile, UserSettings, Bookmark
from ..schemas import UserResponse, UserUpdate, RoleResponse, RoleCreate
from typing import Optional
from pydantic import BaseModel
from ..utils.auth import get_current_user, is_admin, get_password_hash
from ..utils.audit import log_action

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("/", response_model=List[UserResponse])
async def list_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all users (admin only)"""
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = db.query(User).all()
    
    result = []
    for user in users:
        user_response = UserResponse.from_orm(user)
        user_response.roles = [role.name for role in user.roles]
        result.append(user_response)
    
    return result

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user by ID"""
    
    # Users can view their own profile, admins can view all
    if user_id != current_user.id and not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Access denied")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_response = UserResponse.from_orm(user)
    user_response.roles = [role.name for role in user.roles]
    return user_response

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user"""
    
    # Users can update their own profile, admins can update all
    if user_id != current_user.id and not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Access denied")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields
    if user_data.full_name:
        user.full_name = user_data.full_name
    
    if user_data.email:
        # Check if email already exists
        existing = db.query(User).filter(User.email == user_data.email, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = user_data.email
    
    # Only admins can change active status and roles
    if is_admin(current_user):
        if user_data.is_active is not None:
            user.is_active = user_data.is_active
        
        if user_data.role_ids is not None:
            roles = db.query(Role).filter(Role.id.in_(user_data.role_ids)).all()
            user.roles = roles
    
    db.commit()
    db.refresh(user)
    
    log_action(db, current_user.id, "USER_UPDATED", "User", user.id)
    
    user_response = UserResponse.from_orm(user)
    user_response.roles = [role.name for role in user.roles]
    return user_response

@router.post("/{user_id}/approve")
async def approve_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Approve user registration (admin only)"""
    
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_approved = True
    db.commit()
    
    log_action(db, current_user.id, "USER_APPROVED", "User", user.id)
    
    return {"message": "User approved successfully"}

@router.get("/roles/list", response_model=List[RoleResponse])
async def list_roles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all roles"""
    roles = db.query(Role).all()
    return [RoleResponse.from_orm(role) for role in roles]

@router.post("/roles/", response_model=RoleResponse)
async def create_role(
    role_data: RoleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new role (admin only)"""
    
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if role exists
    if db.query(Role).filter(Role.name == role_data.name).first():
        raise HTTPException(status_code=400, detail="Role already exists")
    
    role = Role(
        name=role_data.name,
        description=role_data.description,
        permissions=role_data.permissions
    )
    
    db.add(role)
    db.commit()
    db.refresh(role)
    
    log_action(db, current_user.id, "ROLE_CREATED", "Role", role.id)
    
    return RoleResponse.from_orm(role)

# Follow/Unfollow endpoints
@router.post("/{user_id}/follow")
async def toggle_follow(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Follow or unfollow a user"""
    
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already following
    existing_follow = db.query(UserFollow).filter(
        UserFollow.follower_id == current_user.id,
        UserFollow.following_id == user_id
    ).first()
    
    if existing_follow:
        # Unfollow
        db.delete(existing_follow)
        following = False
    else:
        # Follow
        follow = UserFollow(
            follower_id=current_user.id,
            following_id=user_id
        )
        db.add(follow)
        following = True
    
    db.commit()
    
    # Get counts
    follower_count = db.query(UserFollow).filter(
        UserFollow.following_id == user_id
    ).count()
    
    following_count = db.query(UserFollow).filter(
        UserFollow.follower_id == user_id
    ).count()
    
    return {
        "following": following,
        "follower_count": follower_count,
        "following_count": following_count
    }

@router.get("/{user_id}/followers")
async def get_followers(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of followers for a user"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    follows = db.query(UserFollow).filter(
        UserFollow.following_id == user_id
    ).all()
    
    followers = []
    for follow in follows:
        follower = db.query(User).filter(User.id == follow.follower_id).first()
        if follower:
            user_response = UserResponse.from_orm(follower)
            user_response.roles = [role.name for role in follower.roles]
            followers.append(user_response)
    
    return followers

@router.get("/{user_id}/following")
async def get_following(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of users that a user is following"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    follows = db.query(UserFollow).filter(
        UserFollow.follower_id == user_id
    ).all()
    
    following = []
    for follow in follows:
        following_user = db.query(User).filter(User.id == follow.following_id).first()
        if following_user:
            user_response = UserResponse.from_orm(following_user)
            user_response.roles = [role.name for role in following_user.roles]
            following.append(user_response)
    
    return following

# Profile and Settings schemas
class ProfileUpdate(BaseModel):
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_url: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    year: Optional[str] = None

class SettingsUpdate(BaseModel):
    show_real_name: Optional[bool] = None
    profile_visibility: Optional[str] = None
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    notify_on_comment: Optional[bool] = None
    notify_on_status_change: Optional[bool] = None
    notify_on_like: Optional[bool] = None

class UserProfileResponse(BaseModel):
    id: int
    user_id: int
    bio: Optional[str]
    avatar_url: Optional[str]
    cover_url: Optional[str]
    phone: Optional[str]
    department: Optional[str]
    year: Optional[str]
    is_verified: bool
    follower_count: int
    following_count: int
    posts_count: int
    settings: Optional[dict] = None
    
    class Config:
        from_attributes = True

@router.get("/{user_id}/profile", response_model=UserProfileResponse)
async def get_user_profile(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user profile with stats"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get or create profile
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        profile = UserProfile(user_id=user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    # Get stats
    follower_count = db.query(UserFollow).filter(
        UserFollow.following_id == user_id
    ).count()
    
    following_count = db.query(UserFollow).filter(
        UserFollow.follower_id == user_id
    ).count()
    
    posts_count = db.query(Complaint).filter(
        Complaint.created_by == user_id,
        Complaint.is_deleted == False
    ).count()
    
    # Get settings
    settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
    settings_dict = None
    if settings:
        settings_dict = {
            "show_real_name": settings.show_real_name,
            "profile_visibility": settings.profile_visibility,
            "email_notifications": settings.email_notifications,
            "push_notifications": settings.push_notifications,
            "notify_on_comment": settings.notify_on_comment,
            "notify_on_status_change": settings.notify_on_status_change,
            "notify_on_like": settings.notify_on_like
        }
    
    response = UserProfileResponse.from_orm(profile)
    response.follower_count = follower_count
    response.following_count = following_count
    response.posts_count = posts_count
    response.settings = settings_dict
    
    return response

@router.put("/{user_id}/settings")
async def update_user_settings(
    user_id: int,
    settings_data: SettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user settings"""
    
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only update your own settings")
    
    # Get or create settings
    settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
    if not settings:
        settings = UserSettings(user_id=user_id)
        db.add(settings)
    
    # Update fields
    if settings_data.show_real_name is not None:
        settings.show_real_name = settings_data.show_real_name
    if settings_data.profile_visibility is not None:
        settings.profile_visibility = settings_data.profile_visibility
    if settings_data.email_notifications is not None:
        settings.email_notifications = settings_data.email_notifications
    if settings_data.push_notifications is not None:
        settings.push_notifications = settings_data.push_notifications
    if settings_data.notify_on_comment is not None:
        settings.notify_on_comment = settings_data.notify_on_comment
    if settings_data.notify_on_status_change is not None:
        settings.notify_on_status_change = settings_data.notify_on_status_change
    if settings_data.notify_on_like is not None:
        settings.notify_on_like = settings_data.notify_on_like
    
    db.commit()
    db.refresh(settings)
    
    return {
        "show_real_name": settings.show_real_name,
        "profile_visibility": settings.profile_visibility,
        "email_notifications": settings.email_notifications,
        "push_notifications": settings.push_notifications,
        "notify_on_comment": settings.notify_on_comment,
        "notify_on_status_change": settings.notify_on_status_change,
        "notify_on_like": settings.notify_on_like
    }

@router.put("/{user_id}/profile")
async def update_user_profile(
    user_id: int,
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only update your own profile")
    
    # Get or create profile
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        profile = UserProfile(user_id=user_id)
        db.add(profile)
    
    # Update fields
    if profile_data.bio is not None:
        profile.bio = profile_data.bio
    if profile_data.avatar_url is not None:
        profile.avatar_url = profile_data.avatar_url
    if profile_data.cover_url is not None:
        profile.cover_url = profile_data.cover_url
    if profile_data.phone is not None:
        profile.phone = profile_data.phone
    if profile_data.department is not None:
        profile.department = profile_data.department
    if profile_data.year is not None:
        profile.year = profile_data.year
    
    db.commit()
    db.refresh(profile)
    
    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "bio": profile.bio,
        "avatar_url": profile.avatar_url,
        "cover_url": profile.cover_url,
        "phone": profile.phone,
        "department": profile.department,
        "year": profile.year,
        "is_verified": profile.is_verified
    }
