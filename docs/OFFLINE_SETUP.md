# Offline Mode Setup Guide

## 🎯 Fully Offline Student Complaint Hub

This application is designed to work **100% offline** - no internet connection required!

## ✨ New Features

### 1. **Offline Detection**
- Automatically detects when you're offline
- Shows appropriate notifications
- Works seamlessly without internet

### 2. **System Notifications**
- Desktop notifications for important events
- Web app notifications (toast messages)
- Permission-based notification system

### 3. **Auto Database Detection**
- Automatically detects MySQL/XAMPP installations
- Auto-configures database connection
- Auto-initializes database on first run

### 4. **Clean Professional Design**
- Updated color scheme (blue-based)
- Modern, clean interface
- Better visual hierarchy

## 🚀 Quick Start (Offline Mode)

### Windows
```batch
# Double-click or run:
start_offline.bat
```

### Linux/Mac
```bash
chmod +x start_offline.sh
./start_offline.sh
```

### Manual Start
```bash
cd backend
python auto_detect_db.py  # Auto-detect and configure
python main.py             # Start server
```

## 🔧 Auto-Detection Features

The system automatically:

1. **Detects MySQL/XAMPP**
   - Checks for XAMPP installation
   - Tests MySQL service on port 3306
   - Tries common configurations

2. **Configures Database**
   - Updates `config.py` automatically
   - Tests connection
   - Creates database if needed

3. **Initializes Data**
   - Creates all tables
   - Seeds default roles, users, categories
   - Sets up SLA rules

## 📱 Notifications

### System Notifications (Desktop)
- Shows desktop notifications for:
  - Login/logout events
  - New complaints
  - Status updates
  - Important alerts

### Web App Notifications
- Toast notifications in the app
- Color-coded by type (success, error, warning, info)
- Auto-dismiss after 3 seconds

### Enable Notifications
1. Browser will prompt for permission
2. Click "Allow" to enable desktop notifications
3. Notifications work even when browser is minimized

## 🎨 Design Updates

### Color Scheme
- **Primary**: Blue (#2563eb) - Professional and clean
- **Secondary**: Slate gray (#64748b) - Neutral and modern
- **Accent**: Sky blue (#0ea5e9) - Fresh and friendly

### Removed Online Dependencies
- ✅ No Google Fonts (uses system fonts)
- ✅ No external CDN resources
- ✅ Service Worker for offline caching
- ✅ Works completely offline

## 🔐 Authentication Fixes

### Fixed Issues
- ✅ 401 Unauthorized errors resolved
- ✅ Token validation on page load
- ✅ Automatic token refresh
- ✅ Proper session management

### How It Works
1. On page load, checks for stored token
2. Validates token with `/api/auth/me`
3. Redirects to login if invalid
4. Automatically includes token in all requests

## 🗄️ Database Auto-Configuration

### Supported Configurations

1. **XAMPP (Default)**
   - User: `root`
   - Password: (empty)
   - Auto-detected and configured

2. **Standard MySQL**
   - User: `complaint_admin`
   - Password: `ComplaintDB@2024`
   - Auto-detected and configured

3. **SQLite (Fallback)**
   - Used if MySQL not detected
   - No configuration needed
   - Works out of the box

### Manual Configuration

If auto-detection fails, edit `backend/app/config.py`:

```python
USE_MYSQL: bool = True  # or False for SQLite
MYSQL_HOST: str = "localhost"
MYSQL_PORT: int = 3306
MYSQL_USER: str = "your_username"
MYSQL_PASSWORD: str = "your_password"
MYSQL_DATABASE: str = "student_complaints"
```

## 📂 File Structure

```
StudentComplaintHub/
├── start_offline.bat      # Windows startup script
├── start_offline.sh       # Linux/Mac startup script
├── backend/
│   ├── auto_detect_db.py  # Auto-detection script
│   ├── main.py            # Main server (auto-configures on startup)
│   └── app/
│       └── config.py      # Configuration (auto-updated)
└── frontend/
    ├── service-worker.js  # Offline caching
    ├── manifest.json      # PWA manifest
    └── ...
```

## 🐛 Troubleshooting

### Auto-Detection Not Working
1. Check if MySQL/XAMPP is running
2. Verify port 3306 is not blocked
3. Try manual configuration in `config.py`
4. Run `python auto_detect_db.py` manually

### Notifications Not Showing
1. Check browser notification permissions
2. Click "Allow" when prompted
3. Check browser settings for notification blocking

### 401 Errors
- Clear browser cache and localStorage
- Login again
- Check if token is being sent in requests

### Database Connection Failed
1. Ensure MySQL/XAMPP is running
2. Check credentials in `config.py`
3. Verify database exists
4. Run `python auto_detect_db.py` to re-detect

## ✅ Offline Checklist

- [x] No external dependencies
- [x] Service Worker for caching
- [x] Offline detection
- [x] System notifications
- [x] Auto database detection
- [x] Auto database initialization
- [x] Clean professional design
- [x] Fixed authentication issues

## 🎉 You're All Set!

The application now works **100% offline** with:
- ✅ Auto-detection of MySQL/XAMPP
- ✅ Auto-initialization of database
- ✅ System and web notifications
- ✅ Clean professional design
- ✅ Fixed authentication issues

Just run `start_offline.bat` (Windows) or `start_offline.sh` (Linux/Mac) and everything will be configured automatically!

