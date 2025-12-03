# Student Complaint & Resolution Hub - Complete Project Documentation

**Version 1.0.0** | **December 2024**

---

## 📋 Table of Contents

1. [Abstract & Overview](#abstract--overview)
2. [Problem Statement & Solution](#problem-statement--solution)
3. [Features List](#features-list)
4. [Database Schema & Tables](#database-schema--tables)
5. [System Architecture](#system-architecture)
6. [Workflow Diagrams](#workflow-diagrams)
7. [API Endpoints](#api-endpoints)
8. [Role-Based Permissions](#role-based-permissions)
9. [Technology Stack](#technology-stack)
10. [Deployment Guide](#deployment-guide)

---

## 📖 Abstract & Overview

### Project Summary

The **Student Complaint & Resolution Hub** is a comprehensive, offline-first complaint management system designed for educational institutions. It provides a modern, Instagram-like social interface for students to submit, track, and engage with complaints while enabling staff and administrators to efficiently manage and resolve issues.

### Key Highlights

- **100% Offline Capable**: Works without internet connection using IndexedDB and Service Workers
- **Modern Social Interface**: Instagram-inspired UI with posts, likes, comments, and profiles
- **Role-Based Access Control**: Three-tier permission system (Student, Staff, Admin)
- **Automated Workflows**: SLA tracking, auto-routing, and priority management
- **Real-Time Engagement**: Polls, voting, following system, and notifications
- **Privacy-First**: Anonymous posting with real ID reveal for authorized staff
- **Production-Ready**: Complete backend API, frontend UI, and database models

### Core Purpose

To streamline the complaint resolution process in educational institutions by:
1. Providing students with an easy, anonymous way to submit complaints
2. Enabling staff to efficiently track and resolve issues
3. Giving administrators complete oversight and control
4. Maintaining full functionality even when offline

---

## 🎯 Problem Statement & Solution

### Problems Solved

#### 1. **Offline Accessibility**
- **Problem**: Traditional web apps require constant internet connection
- **Solution**: 
  - IndexedDB for local data storage
  - Service Worker for offline caching
  - Background sync when connection restored
  - Graceful degradation for missing APIs

#### 2. **User Engagement**
- **Problem**: Students don't engage with traditional complaint systems
- **Solution**:
  - Instagram-like feed interface
  - Like, comment, and share functionality
  - User profiles and following system
  - Polls for priority voting

#### 3. **Privacy Concerns**
- **Problem**: Students fear retaliation for complaints
- **Solution**:
  - Anonymous posting option
  - Real ID only visible to authorized staff
  - Privacy settings per user
  - Identity reveal tracking

#### 4. **Workflow Management**
- **Problem**: Manual complaint tracking is inefficient
- **Solution**:
  - Automated SLA calculation
  - Auto-routing based on rules
  - Status workflow (New → Acknowledged → In Progress → Resolved → Closed)
  - Timeline and audit trail

#### 5. **Role-Based Access**
- **Problem**: Different users need different views and permissions
- **Solution**:
  - Three distinct dashboards (Student, Staff, Admin)
  - Dynamic UI based on roles
  - Permission-based feature access
  - Role-specific navigation

#### 6. **Data Persistence**
- **Problem**: Data loss when offline or server unavailable
- **Solution**:
  - IndexedDB for offline storage
  - Pending actions queue
  - Automatic sync on reconnection
  - Service Worker caching

### Solution Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (HTML/CSS/JS)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   IndexedDB  │  │ Service     │  │   Fetch     │        │
│  │   (Offline)  │  │ Worker      │  │   API       │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ HTTP/REST API
                          │
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (Python FastAPI)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Routes     │  │   Models     │  │   Utils     │        │
│  │   (API)      │  │   (SQLAlchemy)│  │  (Auth/Audit)│        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ SQL
                          │
┌─────────────────────────────────────────────────────────────┐
│              DATABASE (SQLite/MySQL)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Core       │  │  Extended    │  │   Relations │        │
│  │   Tables     │  │  Tables      │  │   & Indexes │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Features List

### Core Complaint Management

1. **Complaint Submission**
   - Title and description
   - Category selection
   - Location selection
   - Priority levels (Low, Medium, High, Urgent)
   - Anonymous posting option
   - File attachments
   - Privacy modes (public, private, staff_only)

2. **Complaint Tracking**
   - Status workflow (New → Acknowledged → In Progress → Resolved → Closed)
   - Timeline view with all events
   - SLA tracking and overdue flagging
   - Assignment to staff members
   - Resolution notes

3. **Complaint Management**
   - Edit complaints (owners and staff)
   - Delete complaints (owners and admins)
   - Status updates (staff only)
   - Priority updates (staff only)
   - Escalation (staff only)

### Social Features (Instagram-like)

4. **Feed System**
   - Instagram-style post cards
   - Image display
   - Post metadata (author, time, location)
   - Like/unlike functionality
   - Comment system
   - Share functionality
   - Bookmark/save posts

5. **User Profiles**
   - Profile page with avatar and cover
   - Bio and metadata
   - Posts grid view
   - Follower/following counts
   - Saved posts tab
   - Profile settings

6. **Engagement Features**
   - Like posts and comments
   - Comment on posts (nested replies)
   - Share posts (native share API)
   - Bookmark posts for later
   - Follow/unfollow users
   - Poll voting

7. **Privacy & Identity**
   - Anonymous posting
   - Real ID/Unknown ID display
   - Real ID highlighting (blue border)
   - Privacy settings per user
   - Identity reveal tracking (admin/staff)

### Poll System

8. **Priority Polls**
   - Create polls for complaint priority
   - Vote on priority (Low, Medium, High, Urgent)
   - Visual progress bars
   - Automatic priority update based on votes
   - Vote change capability

### Role-Based Features

9. **Student Features**
   - Create and edit own complaints
   - View own complaints
   - Comment and like posts
   - Follow other users
   - View profiles
   - Anonymous posting

10. **Staff Features**
    - All student features
    - View all complaints
    - Update complaint status
    - Update complaint priority
    - Assign complaints
    - Add polls to complaints
    - Edit any complaint
    - View assigned complaints dashboard

11. **Admin Features**
    - All staff features
    - Delete any complaint
    - Manage categories
    - Manage users
    - System settings
    - View all user data
    - Complete system control

### Offline Support

12. **Offline Functionality**
    - IndexedDB storage for all data
    - Service Worker caching
    - Offline-first architecture
    - Background sync
    - Pending actions queue
    - Graceful API fallbacks

### Administrative Features

13. **Admin Panel**
    - User management
    - Category management
    - Location management
    - System settings
    - Audit logs
    - Routing rules
    - SLA rules

### Notifications

14. **Notification System**
    - Desktop notifications
    - Web app notifications
    - Offline notification storage
    - Notification preferences
    - Real-time updates

---

## 🗄️ Database Schema & Tables

### Core Tables

#### 1. **users**
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    pin_hash VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);
```

**Relationships:**
- One-to-Many: complaints (created_by)
- One-to-Many: assigned_complaints (assigned_to)
- One-to-Many: comments
- Many-to-Many: roles (via user_roles)
- One-to-One: user_profiles
- One-to-One: user_settings

#### 2. **roles**
```sql
CREATE TABLE roles (
    id INTEGER PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions TEXT,  -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Roles:**
- Student
- Staff
- Department Head
- Vice Principal
- Principal
- Super Admin

#### 3. **user_roles** (Association Table)
```sql
CREATE TABLE user_roles (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);
```

#### 4. **categories**
```sql
CREATE TABLE categories (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 5. **locations**
```sql
CREATE TABLE locations (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 6. **complaints**
```sql
CREATE TABLE complaints (
    id INTEGER PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'New',
    priority VARCHAR(20) DEFAULT 'Medium',
    is_anonymous BOOLEAN DEFAULT FALSE,
    privacy_mode VARCHAR(20) DEFAULT 'public',
    vote_count INTEGER DEFAULT 0,
    
    -- Foreign Keys
    category_id INTEGER REFERENCES categories(id),
    location_id INTEGER REFERENCES locations(id),
    created_by INTEGER REFERENCES users(id),
    assigned_to INTEGER REFERENCES users(id),
    
    -- SLA Tracking
    sla_minutes INTEGER,
    due_date DATETIME,
    is_overdue BOOLEAN DEFAULT FALSE,
    is_escalated BOOLEAN DEFAULT FALSE,
    escalated_at DATETIME,
    
    -- Resolution
    resolution_notes TEXT,
    resolved_at DATETIME,
    resolved_by INTEGER REFERENCES users(id),
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at DATETIME,
    closed_at DATETIME,
    
    -- Soft Delete
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at DATETIME
);
```

**Status Values:**
- New
- Acknowledged
- In Progress
- Resolved
- Closed

**Priority Values:**
- Low
- Medium
- High
- Urgent

#### 7. **comments**
```sql
CREATE TABLE comments (
    id INTEGER PRIMARY KEY,
    complaint_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES users(id),
    parent_id INTEGER REFERENCES comments(id),  -- For nested replies
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);
```

#### 8. **attachments**
```sql
CREATE TABLE attachments (
    id INTEGER PRIMARY KEY,
    complaint_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
    comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    thumbnail_path VARCHAR(500),
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 9. **timeline_events**
```sql
CREATE TABLE timeline_events (
    id INTEGER PRIMARY KEY,
    complaint_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    actor_id INTEGER REFERENCES users(id),
    event_metadata TEXT,  -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Event Types:**
- created
- status_changed
- assigned
- commented
- escalated
- resolved
- closed
- voted

#### 10. **complaint_votes**
```sql
CREATE TABLE complaint_votes (
    id INTEGER PRIMARY KEY,
    complaint_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, complaint_id)
);
```

### Extended Tables (Social Features)

#### 11. **user_profiles**
```sql
CREATE TABLE user_profiles (
    id INTEGER PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    avatar_url VARCHAR(500),
    cover_url VARCHAR(500),
    phone VARCHAR(20),
    department VARCHAR(100),
    year VARCHAR(20),
    profile_completion INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    theme_preference VARCHAR(10) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'en',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 12. **user_settings**
```sql
CREATE TABLE user_settings (
    id INTEGER PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Privacy Settings
    show_real_name BOOLEAN DEFAULT FALSE,
    profile_visibility VARCHAR(20) DEFAULT 'public',
    show_email BOOLEAN DEFAULT FALSE,
    show_phone BOOLEAN DEFAULT FALSE,
    
    -- Notification Settings
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    notify_on_comment BOOLEAN DEFAULT TRUE,
    notify_on_status_change BOOLEAN DEFAULT TRUE,
    notify_on_like BOOLEAN DEFAULT TRUE,
    notify_on_share BOOLEAN DEFAULT FALSE,
    
    -- Activity Settings
    show_activity BOOLEAN DEFAULT TRUE,
    show_likes BOOLEAN DEFAULT TRUE,
    show_shares BOOLEAN DEFAULT TRUE,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 13. **user_follows**
```sql
CREATE TABLE user_follows (
    id INTEGER PRIMARY KEY,
    follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    followed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id)
);
```

#### 14. **complaint_likes**
```sql
CREATE TABLE complaint_likes (
    id INTEGER PRIMARY KEY,
    complaint_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    liked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(complaint_id, user_id)
);
```

#### 15. **comment_likes**
```sql
CREATE TABLE comment_likes (
    id INTEGER PRIMARY KEY,
    comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    liked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(comment_id, user_id)
);
```

#### 16. **bookmarks**
```sql
CREATE TABLE bookmarks (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    complaint_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
    collection VARCHAR(100),
    bookmarked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, complaint_id)
);
```

#### 17. **polls**
```sql
CREATE TABLE polls (
    id INTEGER PRIMARY KEY,
    complaint_id INTEGER UNIQUE REFERENCES complaints(id) ON DELETE CASCADE,
    question VARCHAR(500) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
);
```

#### 18. **poll_options**
```sql
CREATE TABLE poll_options (
    id INTEGER PRIMARY KEY,
    poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
    option_text VARCHAR(100) NOT NULL,  -- "Low", "Medium", "High", "Urgent"
    vote_count INTEGER DEFAULT 0,
    order INTEGER DEFAULT 0
);
```

#### 19. **poll_votes**
```sql
CREATE TABLE poll_votes (
    id INTEGER PRIMARY KEY,
    poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
    option_id INTEGER REFERENCES poll_options(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    voted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(poll_id, user_id)
);
```

### Administrative Tables

#### 20. **routing_rules**
```sql
CREATE TABLE routing_rules (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    location_id INTEGER REFERENCES locations(id),
    priority VARCHAR(20),
    role_id INTEGER REFERENCES roles(id),
    user_id INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    order_priority INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 21. **sla_rules**
```sql
CREATE TABLE sla_rules (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    response_time_minutes INTEGER NOT NULL,
    resolution_time_minutes INTEGER NOT NULL,
    escalation_time_minutes INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 22. **audit_logs**
```sql
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    old_values TEXT,  -- JSON
    new_values TEXT,  -- JSON
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 23. **system_config**
```sql
CREATE TABLE system_config (
    id INTEGER PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Entity Relationship Diagram (Text)

```
┌─────────────┐
│    users    │
└──────┬──────┘
       │
       ├───┐
       │   │
       │   ├──────────────┐
       │   │              │
       │   │              │
┌──────▼───┐    ┌─────────▼────┐    ┌──────────────┐
│complaints│───▶│   comments   │    │  attachments │
└──────┬───┘    └─────────┬─────┘    └──────────────┘
       │                 │
       │                 │
       ├─────────────────┘
       │
       ├───┐
       │   │
┌──────▼───▼────┐    ┌─────────────┐
│complaint_likes│    │complaint_   │
│               │    │votes        │
└───────────────┘    └─────────────┘

┌─────────────┐
│    users    │
└──────┬──────┘
       │
       ├───┐
       │   │
┌──────▼───▼────┐    ┌─────────────┐
│user_profiles  │    │user_settings│
└───────────────┘    └─────────────┘

┌─────────────┐         ┌─────────────┐
│    users    │────────▶│  user_follows│
└─────────────┘         └─────────────┘
  (follower)              (following)

┌─────────────┐
│  complaints │
└──────┬──────┘
       │
       │
┌──────▼──────┐    ┌─────────────┐    ┌─────────────┐
│    polls    │───▶│poll_options│───▶│ poll_votes  │
└─────────────┘    └─────────────┘    └─────────────┘
```

---

## 🏗️ System Architecture

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser Layer                         │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  index.html  │  │  styles.css │  │   app.js     │   │
│  │  (Structure) │  │  (Styling)  │  │  (Logic)     │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          │
┌─────────────────────────────────────────────────────────┐
│              Offline Storage Layer                       │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ offline-db.js│  │service-worker│  │  IndexedDB  │   │
│  │  (Wrapper)   │  │  (Caching)    │  │  (Storage)  │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          │ Fetch API
                          │
┌─────────────────────────────────────────────────────────┐
│              Backend API Layer                           │
│              (http://localhost:8000)                     │
└─────────────────────────────────────────────────────────┘
```

### Backend Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FastAPI Application                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Route Handlers                       │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐          │  │
│  │  │  auth    │ │complaints│ │  users   │          │  │
│  │  │comments  │ │  polls   │ │ dashboard│          │  │
│  │  │  admin   │            │            │          │  │
│  │  └──────────┘ └──────────┘ └──────────┘          │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Business Logic                       │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐          │  │
│  │  │  auth    │ │  audit   │ │  files   │          │  │
│  │  │  utils   │ │  utils   │ │  utils   │          │  │
│  │  └──────────┘ └──────────┘ └──────────┘          │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Data Models (SQLAlchemy)              │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐          │  │
│  │  │  models  │ │extended_ │ │ schemas  │          │  │
│  │  │  .py     │ │ models.py│ │  .py     │          │  │
│  │  └──────────┘ └──────────┘ └──────────┘          │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          │ SQLAlchemy ORM
                          │
┌─────────────────────────────────────────────────────────┐
│              Database (SQLite/MySQL)                     │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Workflow Diagrams

### 1. Complaint Submission Workflow

```
┌─────────────┐
│   Student   │
└──────┬──────┘
       │
       │ 1. Fill Complaint Form
       │    (Title, Description, Category, Location, Priority)
       │
       ▼
┌─────────────────┐
│  Submit Button  │
└──────┬──────────┘
       │
       │ 2. Validate Input
       │
       ▼
┌─────────────────┐
│  Check Online?  │
└──────┬──────────┘
       │
   ┌───┴───┐
   │       │
   YES     NO
   │       │
   │       ▼
   │  ┌─────────────────┐
   │  │ Save to         │
   │  │ IndexedDB       │
   │  │ (Pending Queue) │
   │  └─────────────────┘
   │
   ▼
┌─────────────────┐
│  POST /api/     │
│  complaints     │
└──────┬──────────┘
       │
       │ 3. Create Complaint
       │
       ▼
┌─────────────────┐
│  Calculate SLA  │
│  (Based on      │
│   Priority)     │
└──────┬──────────┘
       │
       │ 4. Auto-Route?
       │    (Check Routing Rules)
       │
       ▼
┌─────────────────┐
│  Assign to      │
│  Staff (if rule)│
└──────┬──────────┘
       │
       │ 5. Create Timeline Event
       │
       ▼
┌─────────────────┐
│  Return Success │
│  + Complaint ID │
└─────────────────┘
```

### 2. Complaint Resolution Workflow

```
┌─────────────┐
│    Staff    │
└──────┬──────┘
       │
       │ 1. View Assigned Complaints
       │
       ▼
┌─────────────────┐
│  Select         │
│  Complaint      │
└──────┬──────────┘
       │
       │ 2. Review Details
       │
       ▼
┌─────────────────┐
│  Update Status  │
│  (Acknowledged)  │
└──────┬──────────┘
       │
       │ 3. Work on Complaint
       │
       ▼
┌─────────────────┐
│  Update Status  │
│  (In Progress)  │
└──────┬──────────┘
       │
       │ 4. Add Comments/Notes
       │
       ▼
┌─────────────────┐
│  Update Status  │
│  (Resolved)     │
│  + Add          │
│  Resolution     │
│  Notes          │
└──────┬──────────┘
       │
       │ 5. Close Complaint
       │
       ▼
┌─────────────────┐
│  Status: Closed │
│  Timeline       │
│  Updated        │
└─────────────────┘
```

### 3. Offline Sync Workflow

```
┌─────────────────┐
│  User Action    │
│  (Offline)      │
└──────┬──────────┘
       │
       │ 1. Action Performed
       │    (Like, Comment, Create)
       │
       ▼
┌─────────────────┐
│  Save to        │
│  IndexedDB      │
└──────┬──────────┘
       │
       │ 2. Add to Pending Queue
       │
       ▼
┌─────────────────┐
│  Queue Action   │
│  (pending_      │
│   actions)      │
└──────┬──────────┘
       │
       │ 3. Connection Restored?
       │
       ▼
┌─────────────────┐
│  Background     │
│  Sync Triggered │
└──────┬──────────┘
       │
       │ 4. Process Queue
       │
       ▼
┌─────────────────┐
│  For each       │
│  pending action │
└──────┬──────────┘
       │
       │ 5. Send to API
       │
       ▼
┌─────────────────┐
│  Success?       │
└──────┬──────────┘
       │
   ┌───┴───┐
   │       │
  YES      NO
   │       │
   │       ▼
   │  ┌─────────────────┐
   │  │ Keep in Queue   │
   │  │ (Retry Later)   │
   │  └─────────────────┘
   │
   ▼
┌─────────────────┐
│  Remove from    │
│  Queue          │
│  Update Local   │
│  Data           │
└─────────────────┘
```

### 4. Authentication Workflow

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       │ 1. Enter Credentials
       │
       ▼
┌─────────────────┐
│  POST /api/     │
│  auth/login     │
└──────┬──────────┘
       │
       │ 2. Verify Credentials
       │
       ▼
┌─────────────────┐
│  Check User     │
│  (Active?       │
│   Approved?)    │
└──────┬──────────┘
       │
       │ 3. Generate JWT Token
       │
       ▼
┌─────────────────┐
│  Return Token  │
│  + User Data   │
└──────┬──────────┘
       │
       │ 4. Store in localStorage
       │
       ▼
┌─────────────────┐
│  Navigate to    │
│  Dashboard      │
│  (Role-based)   │
└─────────────────┘
```

### 5. Poll Voting Workflow

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       │ 1. View Poll on Complaint
       │
       ▼
┌─────────────────┐
│  Select Option  │
│  (Low/Medium/   │
│   High/Urgent)  │
└──────┬──────────┘
       │
       │ 2. Submit Vote
       │
       ▼
┌─────────────────┐
│  POST /api/     │
│  polls/{id}/vote│
└──────┬──────────┘
       │
       │ 3. Check Existing Vote
       │
       ▼
┌─────────────────┐
│  Update/        │
│  Create Vote    │
└──────┬──────────┘
       │
       │ 4. Recalculate Totals
       │
       ▼
┌─────────────────┐
│  Find Winning   │
│  Option         │
└──────┬──────────┘
       │
       │ 5. Update Complaint Priority
       │
       ▼
┌─────────────────┐
│  Return Updated │
│  Poll Data      │
└─────────────────┘
```

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |

### Complaints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/complaints` | List complaints | Yes | All |
| POST | `/api/complaints` | Create complaint | Yes | Student+ |
| GET | `/api/complaints/{id}` | Get complaint details | Yes | All |
| PUT | `/api/complaints/{id}` | Update complaint | Yes | Owner/Staff |
| DELETE | `/api/complaints/{id}` | Delete complaint | Yes | Owner/Admin |
| POST | `/api/complaints/{id}/like` | Toggle like | Yes | All |
| GET | `/api/complaints/{id}/comments` | Get comments | Yes | All |
| POST | `/api/complaints/{id}/comments` | Add comment | Yes | All |
| POST | `/api/complaints/{id}/poll` | Create poll | Yes | Staff+ |
| POST | `/api/complaints/{id}/vote` | Vote complaint | Yes | All |
| GET | `/api/complaints/{id}/votes` | Get votes | Yes | All |
| GET | `/api/complaints/{id}/timeline` | Get timeline | Yes | All |

### Comments

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/api/comments/{id}/like` | Like comment | Yes | All |

### Users

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/users` | List users | Yes | Admin |
| GET | `/api/users/{id}` | Get user | Yes | Owner/Admin |
| PUT | `/api/users/{id}` | Update user | Yes | Owner/Admin |
| POST | `/api/users/{id}/follow` | Follow/unfollow | Yes | All |
| GET | `/api/users/{id}/followers` | Get followers | Yes | All |
| GET | `/api/users/{id}/following` | Get following | Yes | All |
| GET | `/api/users/{id}/profile` | Get profile | Yes | All |
| PUT | `/api/users/{id}/profile` | Update profile | Yes | Owner |
| PUT | `/api/users/{id}/settings` | Update settings | Yes | Owner |

### Polls

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/api/polls/complaints/{id}/poll` | Create poll | Yes | Staff+ |
| POST | `/api/polls/{id}/vote` | Vote poll | Yes | All |
| GET | `/api/polls/complaints/{id}/poll` | Get poll | Yes | All |

### Dashboard

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/dashboard/stats` | Get dashboard stats | Yes | All |

### Admin

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/admin/categories` | List categories | Yes | All |
| POST | `/api/admin/categories` | Create category | Yes | Admin |
| GET | `/api/admin/locations` | List locations | Yes | All |
| POST | `/api/admin/locations` | Create location | Yes | Admin |

---

## 🔐 Role-Based Permissions

### Permission Matrix

| Feature | Student | Staff | Admin |
|---------|---------|-------|-------|
| **Complaints** |
| Create complaint | ✅ | ✅ | ✅ |
| Edit own complaint | ✅ | ✅ | ✅ |
| Delete own complaint | ✅ | ✅ | ✅ |
| View own complaints | ✅ | ✅ | ✅ |
| View all complaints | ❌ | ✅ | ✅ |
| Edit any complaint | ❌ | ✅ | ✅ |
| Delete any complaint | ❌ | ❌ | ✅ |
| Update status | ❌ | ✅ | ✅ |
| Update priority | ❌ | ✅ | ✅ |
| Assign complaints | ❌ | ✅ | ✅ |
| **Social Features** |
| Like posts/comments | ✅ | ✅ | ✅ |
| Comment on posts | ✅ | ✅ | ✅ |
| Share posts | ✅ | ✅ | ✅ |
| Bookmark posts | ✅ | ✅ | ✅ |
| Follow users | ✅ | ✅ | ✅ |
| View profiles | ✅ | ✅ | ✅ |
| **Polls** |
| Create poll | ❌ | ✅ | ✅ |
| Vote on poll | ✅ | ✅ | ✅ |
| **Administration** |
| Manage categories | ❌ | ❌ | ✅ |
| Manage locations | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| System settings | ❌ | ❌ | ✅ |
| View audit logs | ❌ | ❌ | ✅ |

---

## 🛠️ Technology Stack

### Backend

- **Framework**: FastAPI (Python 3.8+)
- **ORM**: SQLAlchemy
- **Database**: SQLite (default) / MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Validation**: Pydantic
- **Server**: Uvicorn

### Frontend

- **HTML5**: Semantic markup
- **CSS3**: Modern styling with CSS variables, flexbox, grid
- **JavaScript (ES6+)**: Vanilla JS, no frameworks
- **Offline Storage**: IndexedDB
- **Service Worker**: PWA support
- **API Communication**: Fetch API

### Database

- **Primary**: SQLite (file-based, no setup)
- **Production**: MySQL (via XAMPP or standard installation)
- **Auto-Detection**: Automatic MySQL/XAMPP detection

### Development Tools

- **Version Control**: Git
- **Documentation**: Markdown
- **API Docs**: Swagger UI (auto-generated)

---

## 🚀 Deployment Guide

### Development Setup

1. **Clone/Download Project**
2. **Install Dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
3. **Start Server**:
   ```bash
   python main.py
   ```
4. **Access Application**:
   - Frontend: `http://localhost:8000`
   - API Docs: `http://localhost:8000/api/docs`

### Production Deployment

1. **Database Setup**:
   - Configure MySQL in `backend/app/config.py`
   - Run `python init_db_mysql.py`

2. **Server Configuration**:
   - Update `HOST` and `PORT` in config
   - Set `DEBUG=False` for production

3. **Frontend Deployment**:
   - Serve static files via FastAPI or separate web server
   - Configure CORS for production domain

---

## 📊 Statistics

- **Total Database Tables**: 23
- **API Endpoints**: 30+
- **Frontend Files**: 6
- **Backend Route Files**: 7
- **Lines of Code**: ~15,000+
- **Features**: 50+

---

## 🎯 Key Achievements

✅ **100% Offline Functionality**  
✅ **Complete Backend API Implementation**  
✅ **Modern Social Interface**  
✅ **Role-Based Access Control**  
✅ **Comprehensive Database Schema**  
✅ **Production-Ready Code**  
✅ **Full Documentation**  

---

**Document Version**: 1.0.0  
**Last Updated**: December 2024  
**Status**: Production Ready

