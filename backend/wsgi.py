from pathlib import Path

from dotenv import load_dotenv
from app import create_app
from app.extensions import db
from app.models import *

# Load environment variables from .env file in the backend directory if present
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / '.env')

app = create_app('development')

@app.cli.command()
def init_db():
    """Initialize database with tables and seed data"""
    with app.app_context():
        # Create tables
        db.create_all()
        print("✓ Database tables created")
        
        # Create default roles
        roles_data = [
            {'name': 'Student', 'description': 'Student role'},
            {'name': 'Staff', 'description': 'Staff role'},
            {'name': 'Department Head', 'description': 'Department Head role'},
            {'name': 'Vice Principal', 'description': 'Vice Principal role'},
            {'name': 'Principal', 'description': 'Principal role'},
            {'name': 'Super Admin', 'description': 'Super Admin role'}
        ]
        
        for role_data in roles_data:
            if not Role.query.filter_by(name=role_data['name']).first():
                role = Role(**role_data)
                db.session.add(role)
        
        db.session.commit()
        print("✓ Default roles created")
        
        # Create admin user
        if not User.query.filter_by(username='admin').first():
            admin = User(
                username='admin',
                email='admin@example.com',
                full_name='System Administrator',
                is_active=True,
                is_approved=True
            )
            admin.set_password('admin123')
            admin.roles = [Role.query.filter_by(name='Super Admin').first()]
            db.session.add(admin)
            db.session.commit()
            
            # Create admin profile and settings
            admin_profile = UserProfile(user_id=admin.id)
            admin_settings = UserSettings(user_id=admin.id)
            db.session.add(admin_profile)
            db.session.add(admin_settings)
            db.session.commit()
            
            print("✓ Admin user created (admin/admin123)")
        
        # Create sample users
        if not User.query.filter_by(username='john_student').first():
            student_role = Role.query.filter_by(name='Student').first()
            student = User(
                username='john_student',
                email='john@example.com',
                full_name='John Doe',
                is_active=True,
                is_approved=True
            )
            student.set_password('student123')
            student.roles = [student_role]
            db.session.add(student)
            db.session.commit()
            
            student_profile = UserProfile(user_id=student.id)
            student_settings = UserSettings(user_id=student.id)
            db.session.add(student_profile)
            db.session.add(student_settings)
            print("✓ Sample student created (john_student/student123)")
        
        if not User.query.filter_by(username='sarah_staff').first():
            staff_role = Role.query.filter_by(name='Staff').first()
            staff = User(
                username='sarah_staff',
                email='sarah@example.com',
                full_name='Sarah Smith',
                is_active=True,
                is_approved=True
            )
            staff.set_password('staff123')
            staff.roles = [staff_role]
            db.session.add(staff)
            db.session.commit()
            
            staff_profile = UserProfile(user_id=staff.id)
            staff_settings = UserSettings(user_id=staff.id)
            db.session.add(staff_profile)
            db.session.add(staff_settings)
            print("✓ Sample staff created (sarah_staff/staff123)")
        
        db.session.commit()
        
        # Create categories
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
            if not Category.query.filter_by(name=cat_data['name']).first():
                category = Category(**cat_data)
                db.session.add(category)
        
        db.session.commit()
        print("✓ Default categories created")
        
        # Create locations
        locations_data = [
            {'name': 'Main Building'},
            {'name': 'Science Block'},
            {'name': 'Library'},
            {'name': 'Canteen'},
            {'name': 'Sports Complex'},
            {'name': 'Playground'},
            {'name': 'Computer Lab'},
            {'name': 'Auditorium'},
            {'name': 'Parking Area'}
        ]
        
        for loc_data in locations_data:
            if not Location.query.filter_by(name=loc_data['name']).first():
                location = Location(**loc_data)
                db.session.add(location)
        
        db.session.commit()
        print("✓ Default locations created")
        
        # Create SLA rules
        sla_rules_data = [
            {'name': 'Low Priority SLA', 'priority': 'Low', 'response_time_minutes': 2880, 'resolution_time_minutes': 10080, 'escalation_time_minutes': 14400},
            {'name': 'Medium Priority SLA', 'priority': 'Medium', 'response_time_minutes': 1440, 'resolution_time_minutes': 4320, 'escalation_time_minutes': 5760},
            {'name': 'High Priority SLA', 'priority': 'High', 'response_time_minutes': 480, 'resolution_time_minutes': 1440, 'escalation_time_minutes': 2160},
            {'name': 'Urgent Priority SLA', 'priority': 'Urgent', 'response_time_minutes': 120, 'resolution_time_minutes': 240, 'escalation_time_minutes': 360}
        ]
        
        for sla_data in sla_rules_data:
            if not SLARule.query.filter_by(name=sla_data['name']).first():
                sla_rule = SLARule(**sla_data)
                db.session.add(sla_rule)
        
        db.session.commit()
        print("✓ SLA rules created")
        
        print("\n✅ Database initialization complete!")
        print("\nDefault credentials:")
        print("  Admin:   admin/admin123")
        print("  Student: john_student/student123")
        print("  Staff:   sarah_staff/staff123")

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
