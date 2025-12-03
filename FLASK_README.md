# Student Complaint Hub - Flask Edition

🚀 **Complete Re-implementation**: Flask Backend + Modern Component-Based Frontend

## ✨ Features

- **Flask Backend** with MySQL auto-detection
- **Modern Frontend** with reusable HTML/CSS/JS components
- **Offline-First** PWA capabilities
- **Role-Based Access Control** (Student, Staff, Admin)
- **Complete Complaint Lifecycle** with SLA tracking
- **Social Features** (comments, likes, follows, profiles)
- **Professional UI** with responsive design

## 🏗️ Architecture

### Backend (Flask)
```
flask_backend/
├── app/
│   ├── models/          # SQLAlchemy models
│   ├── routes/          # API endpoints
│   ├── utils/           # Utilities (auth, validators)
│   ├── config.py        # Configuration
│   └── extensions.py    # Flask extensions
├── wsgi.py              # Entry point
└── requirements.txt
```

### Frontend (Modern Components)
```
flask_frontend/
├── index.html
├── assets/
│   ├── css/            # Modular CSS
│   ├── js/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Page components
│   │   ├── api.js      # API client
│   │   ├── router.js   # SPA routing
│   │   └── store.js    # State management
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd flask_backend
pip install -r requirements.txt
```

### 2. Initialize Database

The system auto-detects MySQL/XAMPP or falls back to SQLite:

```bash
flask init-db
```

This creates:
- All database tables
- Default roles (Student, Staff, Admin, etc.)
- Admin user (admin/admin123)
- Sample categories and locations

### 3. Run the Application

```bash
python wsgi.py
```

The API will start at: **http://127.0.0.1:5000**

### 4. Access the Frontend

Open your browser to: **http://127.0.0.1:5000**

## 🔑 Default Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin123`

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Complaints
- `GET /api/complaints` - List complaints (with filters)
- `POST /api/complaints` - Create complaint
- `GET /api/complaints/<id>` - Get complaint details
- `PUT /api/complaints/<id>` - Update complaint
- `DELETE /api/complaints/<id>` - Delete complaint (soft delete)
- `POST /api/complaints/<id>/like` - Toggle like
- `GET /api/complaints/<id>/comments` - Get comments
- `POST /api/complaints/<id>/comments` - Add comment

### Users
- `GET /api/users` - List users (admin only)
- `GET /api/users/<id>` - Get user
- `GET /api/users/<id>/profile` - Get user profile
- `PUT /api/users/<id>/profile` - Update profile
- `GET /api/users/<id>/settings` - Get settings
- `PUT /api/users/<id>/settings` - Update settings
- `POST /api/users/<id>/follow` - Toggle follow

### Admin
- `GET /api/admin/categories` - List categories
- `POST /api/admin/categories` - Create category
- `GET /api/admin/locations` - List locations
- `POST /api/admin/locations` - Create location
- `POST /api/admin/users/<id>/approve` - Approve user
- `GET /api/admin/roles` - List roles

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## 🛠️ Development

### Run in Debug Mode

```bash
cd flask_backend
python wsgi.py
```

### Database Operations

**Reinitialize database:**
```bash
flask init-db
```

**Create migrations:**
```bash
flask db init
flask db migrate -m "Description"
flask db upgrade
```

## 🎨 Frontend Development

The frontend uses a modern component-based architecture with vanilla JavaScript:

- **Components**: Reusable UI elements
- **Pages**: Full page views
- **Router**: SPA navigation
- **Store**: State management
- **API**: Centralized API client with JWT auth

## 🔧 Configuration

Edit `flask_backend/app/config.py` to customize:

- Server host/port
- Database settings
- JWT expiration
- File upload limits
- SLA defaults

### MySQL Auto-Detection

The system automatically:
1. Checks for XAMPP installation
2. Tests MySQL connection on port 3306
3. Creates database if needed
4. Falls back to SQLite if MySQL unavailable

## 📊 Database Models

### Core Models
- **User**: User accounts with authentication
- **Role**: Role definitions
- **Complaint**: Complaint records with SLA tracking
- **Comment**: Nested comments system
- **Category**: Complaint categories
- **Location**: Location master data

### Extended Models
- **UserProfile**: User profiles with bio, avatar
- **UserSettings**: Privacy and notification settings
- **UserFollow**: User following system
- **ComplaintLike**: Like/heart system
- **Poll**: Priority voting polls
- **SLARule**: SLA time configurations

## 🔐 Security Features

- JWT token authentication
- Password hashing with Werkzeug
- Role-based access control
- Input validation
- SQL injection protection (SQLAlchemy ORM)
- CORS configuration
- Soft delete for data retention

## 📱 Offline Capabilities

The frontend includes:
- Service Worker for offline caching
- IndexedDB for local storage
- PWA manifest
- Offline detection and sync queue

## 🎯 Role Permissions

### Student
- Create/edit/delete own complaints
- View own complaints
- Comment on complaints
- Like and follow

### Staff
- All Student permissions
- View all complaints
- Update complaint status
- Assign complaints
- Create polls

### Admin
- All Staff permissions
- User management and approval
- Category/location management
- System configuration
- Delete any complaint

## 🚀 Deployment

### Production Mode

1. Set environment variables:
```bash
export FLASK_ENV=production
export SECRET_KEY=your-secret-key
export DATABASE_URL=mysql://user:pass@host/db
```

2. Use a production WSGI server:
```bash
pip install gunicorn
gunicorn wsgi:app --bind 0.0.0.0:5000
```

### With Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📦 Project Structure

### Backend
- `app/__init__.py` - Flask app factory
- `app/models/` - Database models
- `app/routes/` - API routes
- `app/utils/` - Utilities
- `wsgi.py` - WSGI entry point

### Frontend
- `index.html` - Shell app
- `assets/css/` - Stylesheets
- `assets/js/` - JavaScript modules
- `service-worker.js` - Offline support

## 🧪 Testing

```bash
cd flask_backend
pytest
```

## 📝 License

Educational/Institutional Use

## 🎉 Success!

Your Student Complaint Hub is now running with:
✅ Flask backend with auto-configured MySQL
✅ Modern component-based frontend
✅ Complete REST API
✅ Professional UI/UX
✅ Offline capabilities
✅ Role-based access control

## 💡 Next Steps

1. Change admin password
2. Create user accounts
3. Configure categories and locations
4. Set up SLA rules
5. Customize the UI theme

---

**Version 2.0.0** | Built with Flask, MySQL, and Modern JavaScript
