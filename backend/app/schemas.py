from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Any
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    email: str  # Changed from EmailStr to allow .local domains
    full_name: str = Field(..., min_length=1, max_length=255)

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    role_ids: Optional[List[int]] = []

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None  # Changed from EmailStr to allow .local domains
    is_active: Optional[bool] = None
    pin: Optional[str] = None
    role_ids: Optional[List[int]] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserPinLogin(BaseModel):
    username: str
    pin: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_approved: bool
    created_at: datetime
    last_login: Optional[datetime]
    roles: List[str] = []
    
    @field_validator('roles', mode='before')
    @classmethod
    def extract_role_names(cls, v: Any) -> List[str]:
        if isinstance(v, list):
            return [role.name if hasattr(role, 'name') else str(role) for role in v]
        return []
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Role schemas
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleCreate(RoleBase):
    permissions: Optional[str] = None

class RoleResponse(RoleBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Category schemas
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Location schemas
class LocationBase(BaseModel):
    name: str
    description: Optional[str] = None

class LocationCreate(LocationBase):
    pass

class LocationResponse(LocationBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Complaint schemas
class ComplaintBase(BaseModel):
    title: str = Field(..., min_length=5, max_length=500)
    description: str = Field(..., min_length=10)
    category_id: int
    location_id: Optional[int] = None
    priority: str = "Medium"
    is_anonymous: bool = False
    privacy_mode: str = "public"  # public, private, staff_only

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    location_id: Optional[int] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[int] = None
    resolution_notes: Optional[str] = None

class ComplaintResponse(ComplaintBase):
    id: int
    status: str
    created_by: int
    assigned_to: Optional[int]
    is_overdue: bool
    is_escalated: bool
    created_at: datetime
    updated_at: datetime
    acknowledged_at: Optional[datetime]
    resolved_at: Optional[datetime]
    closed_at: Optional[datetime]
    due_date: Optional[datetime]
    category_name: Optional[str] = None
    location_name: Optional[str] = None
    creator_name: Optional[str] = None
    assignee_name: Optional[str] = None
    vote_count: int = 0
    user_voted: bool = False  # Computed field for current user
    
    class Config:
        from_attributes = True

# Comment schemas
class CommentBase(BaseModel):
    content: str = Field(..., min_length=1)
    is_internal: bool = False
    parent_id: Optional[int] = None

class CommentCreate(CommentBase):
    complaint_id: int

class CommentResponse(CommentBase):
    id: int
    complaint_id: int
    author_id: int
    author_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    liked: bool = False
    like_count: int = 0
    
    class Config:
        from_attributes = True

# Attachment schemas
class AttachmentResponse(BaseModel):
    id: int
    filename: str
    file_size: int
    mime_type: str
    uploaded_at: datetime
    uploaded_by: int
    thumbnail_path: Optional[str] = None
    
    class Config:
        from_attributes = True

# Timeline Event schemas
class TimelineEventResponse(BaseModel):
    id: int
    event_type: str
    description: str
    actor_id: Optional[int]
    actor_name: Optional[str] = None
    created_at: datetime
    event_metadata: Optional[str] = None
    
    class Config:
        from_attributes = True

# Routing Rule schemas
class RoutingRuleBase(BaseModel):
    name: str
    category_id: Optional[int] = None
    location_id: Optional[int] = None
    priority: Optional[str] = None
    role_id: Optional[int] = None
    user_id: Optional[int] = None
    order_priority: int = 0

class RoutingRuleCreate(RoutingRuleBase):
    pass

class RoutingRuleResponse(RoutingRuleBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# SLA Rule schemas
class SLARuleBase(BaseModel):
    name: str
    priority: str
    response_time_minutes: int
    resolution_time_minutes: int
    escalation_time_minutes: Optional[int] = None

class SLARuleCreate(SLARuleBase):
    pass

class SLARuleResponse(SLARuleBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Statistics/Dashboard schemas
class DashboardStats(BaseModel):
    total_complaints: int
    open_complaints: int
    closed_complaints: int
    overdue_complaints: int
    my_complaints: int
    avg_resolution_time: float
    complaints_by_status: dict
    complaints_by_priority: dict
    complaints_by_category: dict

# Search and filter schemas
class ComplaintFilter(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    category_id: Optional[int] = None
    location_id: Optional[int] = None
    assigned_to: Optional[int] = None
    created_by: Optional[int] = None
    is_overdue: Optional[bool] = None
    is_escalated: Optional[bool] = None
    search: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    page: int = 1
    page_size: int = 20

class PaginatedResponse(BaseModel):
    items: List[ComplaintResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

# Voting schemas
class VoteResponse(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class VoteStats(BaseModel):
    vote_count: int
    user_voted: bool
    recent_voters: List[VoteResponse] = []
