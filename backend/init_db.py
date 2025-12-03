#!/usr/bin/env python3
"""
Initialize SQLite database with tables and seed data
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta

from app.database import Base
from app.models import (
    User, Role, Category, Location, SLARule, RoutingRule,
    UserProfile, UserSettings
)

# Database configuration
DATABASE_URL = "sqlite:///./database/complaints.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_database():
    """Initialize database with tables and seed data"""
    print("="*60)
    print("Initializing Student Complaint Hub Database")
    print("="*60)
    
    # Create all tables
    print("\n1. Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("   ✓ Tables created")
    
    db = SessionLocal()
    
    try:
        # Create roles
        print("\n2. Creating roles...")
        roles_data = [
            {'name': 'Student', 'description': 'Student role'},
            {'name': 'Staff', 'description': 'Staff role'},
            {'name': 'Department Head', 'description': 'Department Head role'},
            {'name': 'Vice Principal', 'description': 'Vice Principal role'},
            {'name': 'Principal', 'description': 'Principal role'},
            {'name': 'Super Admin', 'description': 'Super Admin role'}
        ]
        
        for role_data in roles_data:
            if not db.query(Role).filter_by(name=role_data['name']).first():
                role = Role(**role_data)
                db.add(role)
        
        db.commit()
        print("   ✓ Roles created")
        
        # Create admin user
        print("\n3. Creating admin user...")
        if not db.query(User).filter_by(username='admin').first():
            admin_role = db.query(Role).filter_by(name='Super Admin').first()
            
            admin = User(
                username='admin',
                email='admin@example.com',
                full_name='System Administrator',
                is_active=True,
                is_approved=True
            )
            admin.set_password('admin123')
            admin.roles = [admin_role]
            
            db.add(admin)
            db.commit()
            
            # Create admin profile and settings
            admin_profile = UserProfile(user_id=admin.id)
            admin_settings = UserSettings(user_id=admin.id)
            db.add(admin_profile)
            db.add(admin_settings)
            db.commit()
            
            print("   ✓ Admin user created (admin/admin123)")
        else:
            print("   ℹ Admin user already exists")
        
        # Create sample staff and student users
        print("\n4. Creating sample users...")
        
        # Student
        if not db.query(User).filter_by(username='john_student').first():
            student_role = db.query(Role).filter_by(name='Student').first()
            student = User(
                username='john_student',
                email='john@example.com',
                full_name='John Doe',
                is_active=True,
                is_approved=True
            )
            student.set_password('student123')
            student.roles = [student_role]
            db.add(student)
            db.commit()
            
            # Create profile and settings
            student_profile = UserProfile(user_id=student.id)
            student_settings = UserSettings(user_id=student.id)
            db.add(student_profile)
            db.add(student_settings)
            
            print("   ✓ Sample student user created (john_student/student123)")
        
        # Staff
        if not db.query(User).filter_by(username='sarah_staff').first():
            staff_role = db.query(Role).filter_by(name='Staff').first()
            staff = User(
                username='sarah_staff',
                email='sarah@example.com',
                full_name='Sarah Smith',
                is_active=True,
                is_approved=True
            )
            staff.set_password('staff123')
            staff.roles = [staff_role]
            db.add(staff)
            db.commit()
            
            # Create profile and settings
            staff_profile = UserProfile(user_id=staff.id)
            staff_settings = UserSettings(user_id=staff.id)
            db.add(staff_profile)
            db.add(staff_settings)
            
            print("   ✓ Sample staff user created (sarah_staff/staff123)")
        
        db.commit()
        
        # Create categories
        print("\n5. Creating categories...")
        categories_data = [
            {'name': 'Facilities', 'description': 'Building and infrastructure issues'},
            {'name': 'Academics', 'description': 'Academic related complaints'},
            {'name': 'Canteen', 'description': 'Food and canteen services'},
            {'name': 'Transport', 'description': 'Transportation issues'},
            {'name': 'Library', 'description': 'Library related complaints'},
            {'name': 'Sports', 'description': 'Sports and recreation facilities'},
            {'name': 'IT Services', 'description': 'Computer lab and network issues'},
            {'name': 'Safety', 'description': 'Safety and security concerns'},
            {'name': 'Other', 'description': 'Other complaints'}
        ]
        
        for cat_data in categories_data:
            if not db.query(Category).filter_by(name=cat_data['name']).first():
                category = Category(**cat_data)
                db.add(category)
        
        db.commit()
        print("   ✓ Categories created")
        
        # Create locations
        print("\n6. Creating locations...")
        locations_data = [
            {'name': 'Main Building'},
            {'name': 'Science Block'},
            {'name': 'Library'},
            {'name': 'Canteen'},
            {'name': 'Sports Complex'},
            {'name': 'Playground'},
            {'name': 'Computer Lab'},
            {'name': 'Auditorium'},
            {'name': 'Parking Area'},
            {'name': 'Entrance Gate'}
        ]
        
        for loc_data in locations_data:
            if not db.query(Location).filter_by(name=loc_data['name']).first():
                location = Location(**loc_data)
                db.add(location)
        
        db.commit()
        print("   ✓ Locations created")
        
        # Create SLA rules
        print("\n7. Creating SLA rules...")
        sla_rules_data = [
            {
                'name': 'Low Priority SLA',
                'priority': 'Low',
                'response_time_minutes': 2880,  # 2 days
                'resolution_time_minutes': 10080,  # 7 days
                'escalation_time_minutes': 14400  # 10 days
            },
            {
                'name': 'Medium Priority SLA',
                'priority': 'Medium',
                'response_time_minutes': 1440,  # 1 day
                'resolution_time_minutes': 4320,  # 3 days
                'escalation_time_minutes': 5760  # 4 days
            },
            {
                'name': 'High Priority SLA',
                'priority': 'High',
                'response_time_minutes': 480,  # 8 hours
                'resolution_time_minutes': 1440,  # 1 day
                'escalation_time_minutes': 2160  # 1.5 days
            },
            {
                'name': 'Urgent Priority SLA',
                'priority': 'Urgent',
                'response_time_minutes': 120,  # 2 hours
                'resolution_time_minutes': 240,  # 4 hours
                'escalation_time_minutes': 360  # 6 hours
            }
        ]
        
        for sla_data in sla_rules_data:
            if not db.query(SLARule).filter_by(name=sla_data['name']).first():
                sla_rule = SLARule(**sla_data)
                db.add(sla_rule)
        
        db.commit()
        print("   ✓ SLA rules created")
        
        # Create sample routing rules
        print("\n8. Creating routing rules...")
        staff_user = db.query(User).filter_by(username='sarah_staff').first()
        staff_role = db.query(Role).filter_by(name='Staff').first()
        facilities_category = db.query(Category).filter_by(name='Facilities').first()
        
        if facilities_category and staff_role:
            if not db.query(RoutingRule).filter_by(name='Facilities Auto-Assignment').first():
                routing_rule = RoutingRule(
                    name='Facilities Auto-Assignment',
                    category_id=facilities_category.id,
                    assign_to_role_id=staff_role.id,
                    is_active=True,
                    execution_order=1
                )
                db.add(routing_rule)
        
        db.commit()
        print("   ✓ Routing rules created")
        
        print("\n" + "="*60)
        print("✅ Database initialization complete!")
        print("="*60)
        print("\nDefault credentials:")
        print("  Admin:   username=admin, password=admin123")
        print("  Student: username=john_student, password=student123")
        print("  Staff:   username=sarah_staff, password=staff123")
        print("\n⚠️  Please change default passwords after first login!")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Error during initialization: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_database()
