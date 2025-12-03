# System Diagrams - Student Complaint Hub

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Browser    │  │  Service     │  │  IndexedDB   │        │
│  │   (UI)       │  │  Worker      │  │  (Offline)   │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                  │                  │                 │
│         └──────────────────┴──────────────────┘                 │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             │ HTTP/REST API
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                         SERVER LAYER                            │
├────────────────────────────┼────────────────────────────────────┤
│                            │                                    │
│  ┌──────────────┐  ┌──────▼───────┐  ┌──────────────┐         │
│  │   FastAPI    │  │   Routes     │  │   Business   │         │
│  │   Server     │  │   (API)      │  │   Logic     │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                 │
│         └──────────────────┴──────────────────┘                 │
│                            │                                    │
│  ┌─────────────────────────▼─────────────────────────┐         │
│  │              SQLAlchemy ORM                        │         │
│  └─────────────────────────┬─────────────────────────┘         │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             │ SQL
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                      DATABASE LAYER                             │
├────────────────────────────┼────────────────────────────────────┤
│                            │                                    │
│  ┌──────────────┐  ┌──────▼───────┐  ┌──────────────┐        │
│  │   SQLite     │  │    MySQL     │  │   Tables     │        │
│  │  (Default)   │  │  (Production)│  │  (23 tables) │        │
│  └──────────────┘  └───────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Data Flow Diagram

```
┌──────────┐
│   User   │
└────┬─────┘
     │
     │ Action (Create/Update/Delete)
     │
     ▼
┌─────────────────┐
│  Frontend       │
│  (app.js)       │
└────┬────────────┘
     │
     │ Check Online Status
     │
     ├─────────────┐
     │             │
     Online      Offline
     │             │
     │             ▼
     │      ┌──────────────┐
     │      │  IndexedDB   │
     │      │  (Queue)     │
     │      └──────────────┘
     │
     ▼
┌─────────────────┐
│  API Request    │
│  (Fetch)        │
└────┬────────────┘
     │
     │ HTTP POST/GET/PUT/DELETE
     │
     ▼
┌─────────────────┐
│  Backend API    │
│  (FastAPI)      │
└────┬────────────┘
     │
     │ Validate & Process
     │
     ▼
┌─────────────────┐
│  Database       │
│  (SQLite/MySQL) │
└────┬────────────┘
     │
     │ Store/Retrieve
     │
     ▼
┌─────────────────┐
│  Response       │
│  (JSON)         │
└────┬────────────┘
     │
     │ Return Data
     │
     ▼
┌─────────────────┐
│  Update UI      │
│  (Frontend)     │
└─────────────────┘
```

## 3. Database Entity Relationships

```
                    ┌─────────────┐
                    │    users    │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                   │
        │                  │                   │
   ┌────▼────┐      ┌─────▼──────┐      ┌─────▼──────┐
   │user_    │      │user_        │      │user_       │
   │profiles │      │settings     │      │follows     │
   └─────────┘      └─────────────┘      └────────────┘
        │                  │                   │
        │                  │                   │
        └──────────────────┴───────────────────┘
                           │
                           │ created_by
                           │
                    ┌──────▼──────┐
                    │ complaints  │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                   │
   ┌────▼────┐      ┌─────▼──────┐      ┌─────▼──────┐
   │comments │      │complaint_  │      │   polls    │
   │         │      │likes       │      │             │
   └────┬────┘      └────────────┘      └─────┬───────┘
        │                                      │
   ┌────▼────┐                          ┌─────▼──────┐
   │comment_ │                          │poll_       │
   │likes    │                          │options    │
   └─────────┘                          └─────┬──────┘
                                               │
                                          ┌────▼──────┐
                                          │poll_votes │
                                          └───────────┘
```

## 4. User Role Hierarchy

```
                    ┌──────────────┐
                    │ Super Admin  │
                    │  (Highest)   │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   Principal  │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │Vice Principal│
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │Dept. Head    │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │    Staff     │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   Student    │
                    │   (Base)     │
                    └──────────────┘

Permissions cascade downward:
- Each role inherits permissions from roles below
- Additional permissions added per role level
```

## 5. Complaint Status Workflow

```
    ┌─────────┐
    │   New   │
    └────┬────┘
         │
         │ Acknowledge
         │
    ┌────▼──────────┐
    │ Acknowledged  │
    └────┬──────────┘
         │
         │ Start Work
         │
    ┌────▼──────────┐
    │ In Progress   │
    └────┬──────────┘
         │
         │ Resolve
         │
    ┌────▼──────────┐
    │   Resolved    │
    └────┬──────────┘
         │
         │ Close
         │
    ┌────▼──────────┐
    │    Closed     │
    └───────────────┘

Note: Can escalate at any point
      Can go back to previous status (Staff/Admin)
```

## 6. Offline Sync Mechanism

```
┌─────────────────────────────────────────────────────────┐
│                    ONLINE MODE                           │
│                                                          │
│  User Action → API Call → Database → Response → UI      │
│                                                          │
└─────────────────────────────────────────────────────────┘
                           │
                           │ Connection Lost
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   OFFLINE MODE                          │
│                                                          │
│  User Action → IndexedDB → Queue → Local Update → UI    │
│                                                          │
└─────────────────────────────────────────────────────────┘
                           │
                           │ Connection Restored
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                 SYNC MODE                                │
│                                                          │
│  Background Sync → Process Queue → API Calls → Update   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 7. Authentication Flow

```
┌──────────┐
│   User   │
└────┬─────┘
     │
     │ Enter Credentials
     │
     ▼
┌─────────────────┐
│  POST /login    │
└────┬────────────┘
     │
     │ Validate
     │
     ▼
┌─────────────────┐
│  Check User     │
│  - Active?      │
│  - Approved?   │
│  - Roles?      │
└────┬────────────┘
     │
     │ Generate JWT
     │
     ▼
┌─────────────────┐
│  Return Token   │
│  + User Data    │
└────┬────────────┘
     │
     │ Store in localStorage
     │
     ▼
┌─────────────────┐
│  Navigate to    │
│  Dashboard      │
│  (Role-based)   │
└─────────────────┘
```

## 8. Poll Voting Flow

```
┌──────────┐
│   User   │
└────┬─────┘
     │
     │ View Poll
     │
     ▼
┌─────────────────┐
│  Select Option  │
│  (Priority)     │
└────┬────────────┘
     │
     │ Submit Vote
     │
     ▼
┌─────────────────┐
│  Check Existing │
│  Vote           │
└────┬────────────┘
     │
     ├─────────────┐
     │             │
  Exists        New
     │             │
     │             ▼
     │      ┌──────────────┐
     │      │ Create Vote  │
     │      └──────┬───────┘
     │             │
     │             │
     ▼             │
┌──────────────┐  │
│ Update Vote  │  │
└──────┬───────┘  │
       │          │
       └──────┬───┘
              │
              │ Recalculate
              │
              ▼
┌─────────────────┐
│  Update Poll    │
│  Totals         │
└────┬────────────┘
     │
     │ Find Winner
     │
     ▼
┌─────────────────┐
│  Update         │
│  Complaint      │
│  Priority       │
└─────────────────┘
```

## 9. File Upload Flow

```
┌──────────┐
│   User   │
└────┬─────┘
     │
     │ Select File
     │
     ▼
┌─────────────────┐
│  Validate File  │
│  - Type?        │
│  - Size?        │
└────┬────────────┘
     │
     │ Generate Hash
     │
     ▼
┌─────────────────┐
│  Save to        │
│  attachments/   │
└────┬────────────┘
     │
     │ Create Thumbnail
     │ (if image)
     │
     ▼
┌─────────────────┐
│  Store Metadata │
│  in Database    │
└────┬────────────┘
     │
     │ Return File Info
     │
     ▼
┌─────────────────┐
│  Update UI      │
│  (Show File)    │
└─────────────────┘
```

## 10. Notification System

```
┌─────────────────┐
│  Event Trigger  │
│  (Action)       │
└────┬────────────┘
     │
     │ Check User Settings
     │
     ▼
┌─────────────────┐
│  Create         │
│  Notification   │
└────┬────────────┘
     │
     ├─────────────┐
     │             │
  Online        Offline
     │             │
     │             ▼
     │      ┌──────────────┐
     │      │ Store in     │
     │      │ IndexedDB   │
     │      └──────────────┘
     │
     ▼
┌─────────────────┐
│  Show Desktop   │
│  Notification   │
└────┬────────────┘
     │
     │ Update Badge
     │
     ▼
┌─────────────────┐
│  User Sees      │
│  Notification   │
└─────────────────┘
```

---

**Note**: These diagrams are text-based representations. For production documentation, consider using tools like:
- Draw.io / diagrams.net
- PlantUML
- Mermaid.js
- Lucidchart

