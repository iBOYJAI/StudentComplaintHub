from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from ..database import Base

# ==================== USER PROFILE & SETTINGS ====================

class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    cover_url = Column(String(500), nullable=True)
    phone = Column(String(20), nullable=True)
    department = Column(String(100), nullable=True)
    year = Column(String(20), nullable=True)
    profile_completion = Column(Integer, default=0)  # Percentage 0-100
    is_verified = Column(Boolean, default=False)
    theme_preference = Column(String(10), default="light")  # light, dark
    language = Column(String(10), default="en")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="profile")

class UserSettings(Base):
    __tablename__ = "user_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Privacy Settings
    show_real_name = Column(Boolean, default=False)  # Show real name or use anonymous
    profile_visibility = Column(String(20), default="public")  # public, friends, private
    show_email = Column(Boolean, default=False)
    show_phone = Column(Boolean, default=False)
    
    # Notification Settings
    email_notifications = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=True)
    notify_on_comment = Column(Boolean, default=True)
    notify_on_status_change = Column(Boolean, default=True)
    notify_on_like = Column(Boolean, default=True)
    notify_on_share = Column(Boolean, default=False)
    
    # Activity Settings
    show_activity = Column(Boolean, default=True)
    show_likes = Column(Boolean, default=True)
    show_shares = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="settings")

# ==================== STORIES ====================

class Story(Base):
    __tablename__ = "stories"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=True)
    
    content = Column(Text, nullable=False)
    media_url = Column(String(500), nullable=True)
    media_type = Column(String(20), nullable=True)  # image, video
    background_color = Column(String(20), default="#667eea")
    
    view_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime, nullable=False)  # Auto-expire after 24 hours
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User", backref="stories")
    complaint = relationship("Complaint", backref="stories")
    views = relationship("StoryView", back_populates="story", cascade="all, delete-orphan")

class StoryView(Base):
    __tablename__ = "story_views"
    
    id = Column(Integer, primary_key=True, index=True)
    story_id = Column(Integer, ForeignKey("stories.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    viewed_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    story = relationship("Story", back_populates="views")
    user = relationship("User", backref="story_views")

# ==================== ENGAGEMENT TRACKING ====================

class ComplaintView(Base):
    __tablename__ = "complaint_views"
    
    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(500), nullable=True)
    viewed_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    complaint = relationship("Complaint", backref="views")
    user = relationship("User", backref="complaint_views")

class ComplaintShare(Base):
    __tablename__ = "complaint_shares"
    
    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    platform = Column(String(50), nullable=True)  # link, email, social
    shared_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    complaint = relationship("Complaint", backref="shares")
    user = relationship("User", backref="complaint_shares")

class ComplaintLike(Base):
    __tablename__ = "complaint_likes"
    
    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    liked_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    complaint = relationship("Complaint", backref="likes")
    user = relationship("User", backref="complaint_likes")

# ==================== ARCHIVE SYSTEM ====================

class ArchivedComplaint(Base):
    __tablename__ = "archived_complaints"
    
    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    archived_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    archive_reason = Column(Text, nullable=True)
    archived_at = Column(DateTime, default=datetime.utcnow, index=True)
    can_restore = Column(Boolean, default=True)
    
    # Relationships
    complaint = relationship("Complaint", backref="archive_record")
    archiver = relationship("User", backref="archived_complaints")

# ==================== ADVANCED PERMISSIONS ====================

class Permission(Base):
    __tablename__ = "permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(50), unique=True, nullable=False)  # e.g., "complaint.create"
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False)  # complaint, user, system, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    roles = relationship("RolePermission", back_populates="permission")

class RolePermission(Base):
    __tablename__ = "role_permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True)
    permission_id = Column(Integer, ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False, index=True)
    granted = Column(Boolean, default=True)
    granted_at = Column(DateTime, default=datetime.utcnow)
    granted_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    role = relationship("Role", backref="role_permissions")
    permission = relationship("Permission", back_populates="roles")
    granter = relationship("User", backref="granted_permissions")

# ==================== ACTIVITY LOG ====================

class UserActivity(Base):
    __tablename__ = "user_activities"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_type = Column(String(50), nullable=False, index=True)  # login, logout, post, like, share, etc.
    entity_type = Column(String(50), nullable=True)  # complaint, comment, story
    entity_id = Column(Integer, nullable=True)
    metadata = Column(JSON, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User", backref="activities")

# ==================== NOTIFICATIONS ====================

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    type = Column(String(50), nullable=False)  # like, comment, status_change, mention, etc.
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    # Reference to related entity
    entity_type = Column(String(50), nullable=True)  # complaint, comment, story
    entity_id = Column(Integer, nullable=True)
    
    # Actor who triggered the notification
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    is_read = Column(Boolean, default=False, index=True)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], backref="notifications")
    actor = relationship("User", foreign_keys=[actor_id], backref="triggered_notifications")

# ==================== REAL IDENTITY PROTECTION ====================

class IdentityReveal(Base):
    """Track when admin/staff views real identity of anonymous posts"""
    __tablename__ = "identity_reveals"
    
    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    revealed_to = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reason = Column(Text, nullable=True)
    revealed_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    complaint = relationship("Complaint", backref="identity_reveals")
    revealer = relationship("User", backref="revealed_identities")

# ==================== STATUS UPDATES ====================

class StatusUpdate(Base):
    """Detailed status updates with notes"""
    __tablename__ = "status_updates"
    
    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    old_status = Column(String(50), nullable=False)
    new_status = Column(String(50), nullable=False)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    notes = Column(Text, nullable=True)
    is_public = Column(Boolean, default=True)  # Public or internal note
    updated_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    complaint = relationship("Complaint", backref="status_updates")
    updater = relationship("User", backref="status_updates")

# ==================== USER FOLLOWING ====================

class UserFollow(Base):
    """Users can follow other users to see their complaints"""
    __tablename__ = "user_follows"
    
    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    following_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    followed_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    follower = relationship("User", foreign_keys=[follower_id], backref="following")
    following = relationship("User", foreign_keys=[following_id], backref="followers")

# ==================== BOOKMARKS ====================

class Bookmark(Base):
    """Users can bookmark complaints for later"""
    __tablename__ = "bookmarks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    collection = Column(String(100), nullable=True)  # Organize bookmarks
    bookmarked_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User", backref="bookmarks")
    complaint = relationship("Complaint", backref="bookmarks")
