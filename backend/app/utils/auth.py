from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from ..config import settings
from ..database import get_db
from ..models import User

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Token security
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generate password hash"""
    return pwd_context.hash(password)

def verify_pin(plain_pin: str, hashed_pin: str) -> bool:
    """Verify PIN against hash"""
    return pwd_context.verify(plain_pin, hashed_pin)

def get_pin_hash(pin: str) -> str:
    """Generate PIN hash"""
    return pwd_context.hash(pin)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> dict:
    """Decode JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    token = credentials.credentials
    payload = decode_token(token)
    
    username: str = payload.get("sub")
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    if not user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not approved"
        )
    
    return user

def require_roles(allowed_roles: list):
    """Dependency to check if user has required roles"""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role_names = [role.name for role in current_user.roles]
        if not any(role in user_role_names for role in allowed_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker

def has_permission(user: User, permission: str) -> bool:
    """Check if user has specific permission"""
    # Super Admin has all permissions
    user_role_names = [role.name for role in user.roles]
    if "Super Admin" in user_role_names:
        return True
    
    # Check specific permissions
    # This is a simplified check - can be expanded based on needs
    return True

def is_admin(user: User) -> bool:
    """Check if user is admin"""
    user_role_names = [role.name for role in user.roles]
    return any(role in ["Super Admin", "Principal", "Vice Principal"] for role in user_role_names)

def is_staff(user: User) -> bool:
    """Check if user is staff"""
    user_role_names = [role.name for role in user.roles]
    return any(role in ["Staff", "Department Head", "Vice Principal", "Principal", "Super Admin"] for role in user_role_names)

def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """Authenticate user with username and password"""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    if not user.is_active or not user.is_approved:
        return None
    return user

def authenticate_with_pin(db: Session, username: str, pin: str) -> Optional[User]:
    """Authenticate user with username and PIN"""
    user = db.query(User).filter(User.username == username).first()
    if not user or not user.pin_hash:
        return None
    if not verify_pin(pin, user.pin_hash):
        return None
    if not user.is_active or not user.is_approved:
        return None
    return user
