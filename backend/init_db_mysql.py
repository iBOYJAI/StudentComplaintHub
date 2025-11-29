"""
MySQL Database initialization script with seed data
Run this after setting up MySQL to initialize the database
"""
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal, init_db, engine
from app.models import User, Role, Category, Location, Complaint, SLARule
from app.utils.auth import get_password_hash
from app.config import settings
from datetime import datetime, timedelta
from sqlalchemy import text

def check_mysql_connection():
    """Verify MySQL connection"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT VERSION()"))
            version = result.fetchone()[0]
            print(f"✓ Connected to MySQL Server: {version}")
            return True
    except Exception as e:
        print(f"✗ MySQL Connection Failed: {e}")
        print("\nPlease ensure:")
        print("1. MySQL Server is running")
        print("2. Database 'student_complaints' exists")
        print("3. User credentials in config.py are correct")
        return False

def create_roles(db):
    """Create default roles"""
    roles_data = [
        {"name": "Student", "description": "Student who can submit complaints"},
        {"name": "Staff", "description": "Staff member who can handle complaints"},
        {"name": "Department Head", "description": "Department head with elevated permissions"},
        {"name": "Vice Principal", "description": "Vice Principal with admin access"},
        {"name": "Principal", "description": "Principal with full admin access"},
        {"name": "Super Admin", "description": "Super administrator with all permissions"}
    ]
    
    roles = {}
    for role_data in roles_data:
        role = db.query(Role).filter(Role.name == role_data["name"]).first()
        if not role:
            role = Role(**role_data)
            db.add(role)
            db.commit()
            db.refresh(role)
            print(f"✓ Created role: {role.name}")
        else:
            print(f"  Role already exists: {role.name}")
        roles[role.name] = role
    
    return roles

def create_admin_user(db, roles):
    """Create default admin user"""
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        admin = User(
            username="admin",
            email="admin@school.local",
            full_name="System Administrator",
            password_hash=get_password_hash("admin123"),
            is_active=True,
            is_approved=True
        )
        admin.roles = [roles["Super Admin"]]
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"✓ Created admin user - Username: admin, Password: admin123")
    else:
        print(f"  Admin user already exists")
    return admin

def create_sample_users(db, roles):
    """Create sample users"""
    users_data = [
        {
            "username": "john_student",
            "email": "john@student.local",
            "full_name": "John Student",
            "password": "student123",
            "role": "Student"
        },
        {
            "username": "sarah_staff",
            "email": "sarah@staff.local",
            "full_name": "Sarah Staff",
            "password": "staff123",
            "role": "Staff"
        },
        {
            "username": "mike_dept",
            "email": "mike@dept.local",
            "full_name": "Mike Department Head",
            "password": "dept123",
            "role": "Department Head"
        }
    ]
    
    created_users = []
    for user_data in users_data:
        user = db.query(User).filter(User.username == user_data["username"]).first()
        if not user:
            user = User(
                username=user_data["username"],
                email=user_data["email"],
                full_name=user_data["full_name"],
                password_hash=get_password_hash(user_data["password"]),
                is_active=True,
                is_approved=True
            )
            user.roles = [roles[user_data["role"]]]
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"✓ Created user: {user.username} ({user_data['role']})")
            created_users.append(user)
        else:
            print(f"  User already exists: {user.username}")
            created_users.append(user)
    
    return created_users

def create_categories(db):
    """Create complaint categories"""
    categories_data = [
        {"name": "Facilities", "description": "Infrastructure and facility issues"},
        {"name": "Academics", "description": "Academic-related concerns"},
        {"name": "Harassment", "description": "Harassment or bullying complaints"},
        {"name": "Canteen", "description": "Canteen and food services"},
        {"name": "Transport", "description": "Transportation issues"},
        {"name": "Administration", "description": "Administrative matters"},
        {"name": "Library", "description": "Library services"},
        {"name": "Sports", "description": "Sports and recreation"},
        {"name": "Other", "description": "Other complaints"}
    ]
    
    categories = []
    for cat_data in categories_data:
        category = db.query(Category).filter(Category.name == cat_data["name"]).first()
        if not category:
            category = Category(**cat_data)
            db.add(category)
            db.commit()
            db.refresh(category)
            print(f"✓ Created category: {category.name}")
        else:
            print(f"  Category already exists: {category.name}")
        categories.append(category)
    
    return categories

def create_locations(db):
    """Create location options"""
    locations_data = [
        {"name": "Main Building", "description": "Primary academic building"},
        {"name": "Science Block", "description": "Science laboratories and classrooms"},
        {"name": "Sports Complex", "description": "Sports facilities and grounds"},
        {"name": "Library", "description": "School library"},
        {"name": "Canteen", "description": "School canteen"},
        {"name": "Playground", "description": "Student playground"},
        {"name": "Parking Area", "description": "Vehicle parking area"},
        {"name": "Administrative Block", "description": "Administration offices"}
    ]
    
    locations = []
    for loc_data in locations_data:
        location = db.query(Location).filter(Location.name == loc_data["name"]).first()
        if not location:
            location = Location(**loc_data)
            db.add(location)
            db.commit()
            db.refresh(location)
            print(f"✓ Created location: {location.name}")
        else:
            print(f"  Location already exists: {location.name}")
        locations.append(location)
    
    return locations

def create_sla_rules(db):
    """Create SLA rules for different priorities"""
    sla_data = [
        {
            "name": "Low Priority SLA",
            "priority": "Low",
            "response_time_minutes": 1440,
            "resolution_time_minutes": 10080,
            "escalation_time_minutes": 14400
        },
        {
            "name": "Medium Priority SLA",
            "priority": "Medium",
            "response_time_minutes": 480,
            "resolution_time_minutes": 4320,
            "escalation_time_minutes": 5760
        },
        {
            "name": "High Priority SLA",
            "priority": "High",
            "response_time_minutes": 120,
            "resolution_time_minutes": 1440,
            "escalation_time_minutes": 2160
        },
        {
            "name": "Urgent Priority SLA",
            "priority": "Urgent",
            "response_time_minutes": 30,
            "resolution_time_minutes": 240,
            "escalation_time_minutes": 360
        }
    ]
    
    for sla in sla_data:
        existing = db.query(SLARule).filter(SLARule.priority == sla["priority"]).first()
        if not existing:
            rule = SLARule(**sla)
            db.add(rule)
            db.commit()
            print(f"✓ Created SLA rule: {sla['name']}")
        else:
            print(f"  SLA rule already exists: {sla['name']}")

def create_sample_complaints(db, users, categories, locations):
    """Create sample complaints for testing"""
    if len(users) < 1:
        return
    
    student = users[0]
    
    complaints_data = [
        {
            "title": "Broken desk in classroom 101",
            "description": "The desk in the third row of classroom 101 has a broken leg and is unusable.",
            "category": "Facilities",
            "location": "Main Building",
            "priority": "Medium",
            "created_by": student.id
        },
        {
            "title": "Library AC not working",
            "description": "The air conditioning system in the library has been malfunctioning for the past week, making it difficult to study.",
            "category": "Facilities",
            "location": "Library",
            "priority": "High",
            "created_by": student.id
        },
        {
            "title": "Poor food quality in canteen",
            "description": "The food quality in the canteen has deteriorated significantly. Multiple students have complained about hygiene issues.",
            "category": "Canteen",
            "location": "Canteen",
            "priority": "Urgent",
            "created_by": student.id
        }
    ]
    
    existing_count = db.query(Complaint).count()
    if existing_count > 0:
        print(f"  Sample complaints already exist ({existing_count} total)")
        return
    
    for comp_data in complaints_data:
        category = next((c for c in categories if c.name == comp_data["category"]), categories[0])
        location = next((l for l in locations if l.name == comp_data["location"]), None)
        
        complaint = Complaint(
            title=comp_data["title"],
            description=comp_data["description"],
            category_id=category.id,
            location_id=location.id if location else None,
            priority=comp_data["priority"],
            created_by=comp_data["created_by"],
            status="New"
        )
        
        sla_minutes = {"Low": 10080, "Medium": 4320, "High": 1440, "Urgent": 240}
        complaint.due_date = datetime.utcnow() + timedelta(minutes=sla_minutes[comp_data["priority"]])
        
        db.add(complaint)
    
    db.commit()
    print(f"✓ Created {len(complaints_data)} sample complaints")

def main():
    """Main initialization function"""
    print("=" * 60)
    print("Student Complaint Hub - MySQL Database Initialization")
    print("=" * 60)
    print()
    
    # Check configuration
    if not settings.USE_MYSQL:
        print("⚠ WARNING: USE_MYSQL is set to False in config.py")
        print("Please set USE_MYSQL=True to use MySQL")
        return
    
    print(f"Database: {settings.MYSQL_DATABASE}")
    print(f"Host: {settings.MYSQL_HOST}:{settings.MYSQL_PORT}")
    print(f"User: {settings.MYSQL_USER}")
    print()
    
    # Check MySQL connection
    print("Checking MySQL connection...")
    if not check_mysql_connection():
        return
    
    print()
    
    # Initialize database tables
    print("Creating database tables...")
    try:
        init_db()
        print("✓ All tables created successfully")
    except Exception as e:
        print(f"✗ Error creating tables: {e}")
        return
    
    print()
    
    # Create session
    db = SessionLocal()
    
    try:
        # Create roles
        print("Creating roles...")
        roles = create_roles(db)
        print()
        
        # Create admin user
        print("Creating admin user...")
        admin = create_admin_user(db, roles)
        print()
        
        # Create sample users
        print("Creating sample users...")
        users = create_sample_users(db, roles)
        print()
        
        # Create categories
        print("Creating categories...")
        categories = create_categories(db)
        print()
        
        # Create locations
        print("Creating locations...")
        locations = create_locations(db)
        print()
        
        # Create SLA rules
        print("Creating SLA rules...")
        create_sla_rules(db)
        print()
        
        # Create sample complaints
        print("Creating sample complaints...")
        create_sample_complaints(db, users, categories, locations)
        print()
        
        print("=" * 60)
        print("✓ MySQL Database initialization completed successfully!")
        print("=" * 60)
        print()
        print("Default credentials:")
        print("  Admin - Username: admin, Password: admin123")
        print("  Student - Username: john_student, Password: student123")
        print("  Staff - Username: sarah_staff, Password: staff123")
        print()
        print("You can now start the application using:")
        print("  python main.py")
        print("  OR")
        print("  Double-click start_mysql.bat")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ Error during initialization: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    main()
