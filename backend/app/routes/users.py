from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import User, Role
from ..schemas import UserResponse, UserUpdate, RoleResponse, RoleCreate
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
