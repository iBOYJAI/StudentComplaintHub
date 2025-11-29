# Administrator Manual

## System Administration Guide

### Initial Setup

#### 1. First Login
- Use default admin credentials: `admin` / `admin123`
- **IMMEDIATELY change this password after first login**

#### 2. User Management

**Approving New Users:**
1. Go to Admin → Users
2. Review pending registrations
3. Click "Approve" for valid users
4. Assign appropriate roles

**Creating Users:**
1. Users self-register through login page
2. Admin must approve before access granted
3. Assign roles based on user type

**User Roles:**
- **Student**: Submit and track own complaints
- **Staff**: Handle assigned complaints
- **Department Head**: Manage department complaints
- **Vice Principal**: Elevated access
- **Principal**: Full system access
- **Super Admin**: Complete system control

#### 3. Configure Categories

**Adding Categories:**
1. Go to Admin → Categories
2. Click "Add Category"
3. Enter:
   - Name (e.g., "Facilities")
   - Description
4. Save

**Default Categories:**
- Facilities
- Academics
- Harassment
- Canteen
- Transport
- Administration
- Library
- Sports
- Other

#### 4. Configure Locations

**Adding Locations:**
1. Go to Admin → Locations
2. Click "Add Location"
3. Enter location details
4. Save

**Example Locations:**
- Main Building
- Science Block
- Library
- Canteen
- Sports Complex
- Playground

### Complaint Management

#### Routing Rules

**Purpose:** Automatically assign complaints to staff based on:
- Category
- Location
- Priority

**Creating Routing Rule:**
1. Go to Admin → Routing Rules
2. Click "Add Rule"
3. Define:
   - Rule name
   - Category match
   - Location match (optional)
   - Priority match (optional)
   - Assign to: Role or specific user
4. Set priority order (lower number = higher priority)
5. Save

**Example Rules:**
```
Rule: Facilities - Main Building
Category: Facilities
Location: Main Building
Assign to: Facilities Manager
Priority: 1

Rule: Urgent Issues
Priority: Urgent
Assign to: Vice Principal
Priority: 0 (highest)
```

#### SLA Management

**Setting SLA Times:**
1. Go to Admin → SLA Rules
2. Configure for each priority:
   - **Urgent**: 4 hours resolution
   - **High**: 1 day resolution
   - **Medium**: 3 days resolution
   - **Low**: 7 days resolution

**SLA Tracking:**
- System automatically calculates due dates
- Overdue complaints flagged in red
- Dashboard shows overdue count

### Monitoring & Reports

#### Dashboard Metrics
- Total complaints
- Open vs Closed
- Overdue count
- Average resolution time
- Complaints by status
- Complaints by priority
- Complaints by category

#### Audit Trail
All actions logged:
- User logins
- Complaint creation/updates
- Status changes
- Assignment changes
- Role modifications

**Viewing Audit Log:**
- Access via Admin panel
- Filter by:
  - User
  - Action type
  - Date range
  - Entity type

### Security Administration

#### Password Policy
- Minimum 6 characters
- Recommend: Uppercase, lowercase, numbers, symbols
- Passwords hashed with bcrypt
- No plaintext storage

#### Session Management
- JWT tokens expire after 24 hours
- Users auto-logged out on token expiry
- Optional PIN for quick unlock

#### Access Control
- Role-based permissions
- Students: Own complaints only
- Staff: Assigned complaints
- Admin: All complaints

### Backup & Restore

#### Manual Backup
1. Stop the application
2. Copy entire `database` folder
3. Copy `attachments` folder
4. Store securely

#### Restore from Backup
1. Stop the application
2. Replace `database` folder with backup
3. Replace `attachments` folder
4. Restart application

**Automated Backups (Optional):**
- Setup scheduled task to copy database
- Use 7-Zip or similar for compression
- Store on external drive or network

### Database Maintenance

#### Performance Optimization
- Database automatically indexed
- No regular maintenance needed
- Compact database if needed:
  ```
  sqlite3 database/complaints.db "VACUUM;"
  ```

#### Data Cleanup
- Archive old resolved complaints
- Soft-delete removes from views
- Hard-delete via SQL if needed

### Troubleshooting

#### Common Issues

**Users Can't Login:**
- Check if account is approved
- Verify password is correct
- Check if account is active

**Complaints Not Routing:**
- Review routing rules
- Check rule priority order
- Verify category/location match

**Performance Slow:**
- Check database size
- Compact database
- Review server resources

**Files Not Uploading:**
- Check attachment storage space
- Verify file size limits
- Check file type restrictions

### System Configuration

Edit `backend/app/config.py`:

```python
# Server Settings
HOST = "127.0.0.1"  # Change for network access
PORT = 8000

# Security
SECRET_KEY = "change-this-in-production"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# File Upload
MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "pdf", "doc", "docx"}

# SLA Defaults (minutes)
DEFAULT_SLA_LOW = 10080    # 7 days
DEFAULT_SLA_MEDIUM = 4320  # 3 days
DEFAULT_SLA_HIGH = 1440    # 1 day
DEFAULT_SLA_URGENT = 240   # 4 hours
```

### Network Deployment

**Allow LAN Access:**
1. Edit `config.py`:
   ```python
   HOST = "0.0.0.0"  # Listen on all interfaces
   ```
2. Note server IP address
3. Users access via: `http://[SERVER-IP]:8000`
4. Configure firewall to allow port 8000

**Security Considerations:**
- Change default passwords
- Use strong SECRET_KEY
- Regular backups
- Monitor audit logs
- Restrict file upload types

### Best Practices

✅ **Regular Tasks:**
- Review pending user approvals daily
- Check overdue complaints
- Monitor dashboard metrics
- Backup database weekly

✅ **Security:**
- Change default passwords immediately
- Review audit logs regularly
- Keep user roles up to date
- Disable inactive accounts

✅ **Maintenance:**
- Test backup restore quarterly
- Review SLA times periodically
- Update categories as needed
- Clean up old archived data

### Support & Updates

**Getting Help:**
- Check logs in `logs/` directory
- Review API docs at `/api/docs`
- Consult README.md

**Version Updates:**
- Backup before updating
- Review changelog
- Test in development first
- Update production

---

**For technical support, refer to the main documentation or consult with IT staff.**
