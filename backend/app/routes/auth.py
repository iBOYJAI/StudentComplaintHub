from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..models import User, Role
from ..schemas import UserCreate, UserLogin, UserPinLogin, Token, UserResponse
from ..utils.auth import (
    get_password_hash, authenticate_user, authenticate_with_pin,
    create_access_token, get_current_user, get_pin_hash
)
from ..utils.audit import log_action

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register new user (requires admin approval)"""
    
    # Check if username exists
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Check if email exists
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        password_hash=get_password_hash(user_data.password),
        is_approved=False  # Requires admin approval
    )
    
    # Assign roles
    if user_data.role_ids:
        roles = db.query(Role).filter(Role.id.in_(user_data.role_ids)).all()
        user.roles = roles
    else:
        # Default to Student role
        student_role = db.query(Role).filter(Role.name == "Student").first()
        if student_role:
            user.roles = [student_role]
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    log_action(db, None, "USER_REGISTERED", "User", user.id, new_values={"username": user.username})
    
    result = UserResponse.from_orm(user)
    result.roles = [role.name for role in user.roles]
    return result

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login with username and password"""
    
    user = authenticate_user(db, credentials.username, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create access token
    access_token = create_access_token(data={"sub": user.username})
    
    log_action(db, user.id, "USER_LOGIN", "User", user.id)
    
    user_response = UserResponse.from_orm(user)
    user_response.roles = [role.name for role in user.roles]
    
    return Token(access_token=access_token, user=user_response)

@router.post("/login/pin", response_model=Token)
def login_with_pin(credentials: UserPinLogin, db: Session = Depends(get_db)):
    """Login with username and PIN (quick unlock)"""
    
    user = authenticate_with_pin(db, credentials.username, credentials.pin)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or PIN"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create access token
    access_token = create_access_token(data={"sub": user.username})
    
    log_action(db, user.id, "USER_PIN_LOGIN", "User", user.id)
    
    user_response = UserResponse.from_orm(user)
    user_response.roles = [role.name for role in user.roles]
    
    return Token(access_token=access_token, user=user_response)

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    user_response = UserResponse.from_orm(current_user)
    user_response.roles = [role.name for role in current_user.roles]
    return user_response

@router.post("/pin/setup")
async def setup_pin(
    pin: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Setup or update user PIN"""
    
    if len(pin) < 4 or len(pin) > 8:
        raise HTTPException(status_code=400, detail="PIN must be 4-8 characters")
    
    current_user.pin_hash = get_pin_hash(pin)
    db.commit()
    
    log_action(db, current_user.id, "PIN_SETUP", "User", current_user.id)
    
    return {"message": "PIN setup successful"}

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Logout user"""
    log_action(db, current_user.id, "USER_LOGOUT", "User", current_user.id)
    return {"message": "Logged out successfully"}
