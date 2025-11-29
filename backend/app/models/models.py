from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum, Float, Table, Index
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database import Base

# Association table for user roles (many-to-many)
user_roles = Table(
    'user_roles',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE')),
    Column('role_id', Integer, ForeignKey('roles.id', ondelete='CASCADE'))
)

class RoleEnum(str, enum.Enum):
    STUDENT = "Student"
    STAFF = "Staff"
    DEPT_HEAD = "Department Head"
    VICE_PRINCIPAL = "Vice Principal"
    PRINCIPAL = "Principal"
    SUPER_ADMIN = "Super Admin"

class ComplaintStatus(str, enum.Enum):
    NEW = "New"
    ACKNOWLEDGED = "Acknowledged"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"
    CLOSED = "Closed"

class Priority(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    URGENT = "Urgent"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    pin_hash = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Relationships
    roles = relationship("Role", secondary=user_roles, back_populates="users")
    complaints = relationship("Complaint", back_populates="creator", foreign_keys="Complaint.created_by")
    assigned_complaints = relationship("Complaint", back_populates="assignee", foreign_keys="Complaint.assigned_to")
    comments = relationship("Comment", back_populates="author")
    audit_logs = relationship("AuditLog", back_populates="user")
    votes = relationship("ComplaintVote", back_populates="user")

class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    permissions = Column(Text, nullable=True)  # JSON string of permissions
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    users = relationship("User", secondary=user_roles, back_populates="roles")
    routing_rules = relationship("RoutingRule", back_populates="role")

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    complaints = relationship("Complaint", back_populates="category")
    routing_rules = relationship("RoutingRule", back_populates="category")

class Location(Base):
    __tablename__ = "locations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    complaints = relationship("Complaint", back_populates="location")
    routing_rules = relationship("RoutingRule", back_populates="location")

class Complaint(Base):
    __tablename__ = "complaints"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    description = Column(Text, nullable=False)
    status = Column(String(50), default=ComplaintStatus.NEW.value, index=True)
    priority = Column(String(20), default=Priority.MEDIUM.value, index=True)
    is_anonymous = Column(Boolean, default=False)
    privacy_mode = Column(String(20), default="public")  # public, private, staff_only
    vote_count = Column(Integer, default=0)
    
    # Foreign keys
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    
    # SLA tracking
    sla_minutes = Column(Integer, nullable=True)
    due_date = Column(DateTime, nullable=True)
    is_overdue = Column(Boolean, default=False, index=True)
    is_escalated = Column(Boolean, default=False)
    escalated_at = Column(DateTime, nullable=True)
    
    # Resolution
    resolution_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    acknowledged_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    
    # Soft delete
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    
    # Relationships
    category = relationship("Category", back_populates="complaints")
    location = relationship("Location", back_populates="complaints")
    creator = relationship("User", back_populates="complaints", foreign_keys=[created_by])
    assignee = relationship("User", back_populates="assigned_complaints", foreign_keys=[assigned_to])
    comments = relationship("Comment", back_populates="complaint", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="complaint", cascade="all, delete-orphan")
    timeline_events = relationship("TimelineEvent", back_populates="complaint", cascade="all, delete-orphan")
    votes = relationship("ComplaintVote", back_populates="complaint", cascade="all, delete-orphan")

class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    content = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False)  # Private/internal notes
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_deleted = Column(Boolean, default=False)
    
    # Relationships
    complaint = relationship("Complaint", back_populates="comments")
    author = relationship("User", back_populates="comments")
    parent = relationship("Comment", remote_side=[id], backref="replies")
    attachments = relationship("Attachment", back_populates="comment", cascade="all, delete-orphan")

class Attachment(Base):
    __tablename__ = "attachments"
    
    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=True)
    comment_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)  # Hashed filename
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    thumbnail_path = Column(String(500), nullable=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    complaint = relationship("Complaint", back_populates="attachments")
    comment = relationship("Comment", back_populates="attachments")

class ComplaintVote(Base):
    __tablename__ = "complaint_votes"
    
    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    complaint = relationship("Complaint", back_populates="votes")
    user = relationship("User", back_populates="votes")
    
    # Unique constraint: one vote per user per complaint
    __table_args__ = (
        Index('ix_vote_user_complaint', 'user_id', 'complaint_id', unique=True),
    )

class TimelineEvent(Base):
    __tablename__ = "timeline_events"
    
    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(100), nullable=False)  # created, status_changed, assigned, etc.
    description = Column(Text, nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    event_metadata = Column(Text, nullable=True)  # JSON for additional data
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    complaint = relationship("Complaint", back_populates="timeline_events")

class RoutingRule(Base):
    __tablename__ = "routing_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    priority = Column(String(20), nullable=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    order_priority = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    category = relationship("Category", back_populates="routing_rules")
    location = relationship("Location", back_populates="routing_rules")
    role = relationship("Role", back_populates="routing_rules")

class SLARule(Base):
    __tablename__ = "sla_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    priority = Column(String(20), nullable=False)
    response_time_minutes = Column(Integer, nullable=False)
    resolution_time_minutes = Column(Integer, nullable=False)
    escalation_time_minutes = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=True)
    old_values = Column(Text, nullable=True)  # JSON
    new_values = Column(Text, nullable=True)  # JSON
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")

class SystemConfig(Base):
    __tablename__ = "system_config"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
