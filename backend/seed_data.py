"""
Seed data script for Student Complaint Hub
Creates initial users, roles, categories, and locations
"""
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import db
from app.models import User, Role, Category, Location, SLARule
from werkzeug.security import generate_password_hash

def create_roles():
    """Create default roles"""
    roles_data = [
        {'name': 'Super Admin', 'description': 'Full system access'},
        {'name': 'Principal', 'description': 'School principal'},
        {'name': 'Vice Principal', 'description': 'Vice principal'},
        {'name': 'Department Head', 'description': 'Department head'},
        {'name': 'Staff', 'description': 'Staff member'},
        {'name': 'Student', 'description': 'Student'}
    ]
    
    roles = []
    for role_data in roles_data:
        role = Role.query.filter_by(name=role_data['name']).first()
        if not role:
            role = Role(**role_data)
            db.session.add(role)
            roles.append(role)
            print(f"Created role: {role_data['name']}")
        else:
            roles.append(role)
            print(f"Role already exists: {role_data['name']}")
    
    db.session.commit()
    return roles

def create_users(roles):
    """Create default users"""
    # Find roles by name
    super_admin_role = next((r for r in roles if r.name == 'Super Admin'), None)
    principal_role = next((r for r in roles if r.name == 'Principal'), None)
    staff_role = next((r for r in roles if r.name == 'Staff'), None)
    student_role = next((r for r in roles if r.name == 'Student'), None)
    
    users_data = [
        {
            'username': 'admin',
            'email': 'admin@school.edu',
            'full_name': 'System Administrator',
            'password': 'admin123',
            'is_approved': True,
            'roles': [super_admin_role] if super_admin_role else []
        },
        {
            'username': 'principal',
            'email': 'principal@school.edu',
            'full_name': 'School Principal',
            'password': 'principal123',
            'is_approved': True,
            'roles': [principal_role] if principal_role else []
        },
        {
            'username': 'staff1',
            'email': 'staff1@school.edu',
            'full_name': 'John Staff',
            'password': 'staff123',
            'is_approved': True,
            'roles': [staff_role] if staff_role else []
        },
        {
            'username': 'staff2',
            'email': 'staff2@school.edu',
            'full_name': 'Jane Staff',
            'password': 'staff123',
            'is_approved': True,
            'roles': [staff_role] if staff_role else []
        },
        {
            'username': 'student1',
            'email': 'student1@school.edu',
            'full_name': 'Alice Student',
            'password': 'student123',
            'is_approved': True,
            'roles': [student_role] if student_role else []
        },
        {
            'username': 'student2',
            'email': 'student2@school.edu',
            'full_name': 'Bob Student',
            'password': 'student123',
            'is_approved': True,
            'roles': [student_role] if student_role else []
        },
        {
            'username': 'student3',
            'email': 'student3@school.edu',
            'full_name': 'Charlie Student',
            'password': 'student123',
            'is_approved': True,
            'roles': [student_role] if student_role else []
        }
    ]
    
    users = []
    for user_data in users_data:
        user = User.query.filter_by(username=user_data['username']).first()
        if not user:
            password = user_data.pop('password')
            roles_list = user_data.pop('roles')
            user = User(**user_data)
            user.set_password(password)
            user.roles = roles_list
            db.session.add(user)
            users.append(user)
            print(f"Created user: {user_data['username']}")
        else:
            users.append(user)
            print(f"User already exists: {user_data['username']}")
    
    db.session.commit()
    return users

def create_categories():
    """Create default categories"""
    categories_data = [
        {'name': 'Facilities', 'description': 'Building, maintenance, and infrastructure issues'},
        {'name': 'Academic', 'description': 'Course-related complaints and academic issues'},
        {'name': 'Administrative', 'description': 'Administrative and bureaucratic issues'},
        {'name': 'Safety', 'description': 'Safety and security concerns'},
        {'name': 'Technology', 'description': 'IT and technology-related issues'},
        {'name': 'Food Service', 'description': 'Cafeteria and food service complaints'},
        {'name': 'Transportation', 'description': 'Bus and transportation issues'},
        {'name': 'Other', 'description': 'Other miscellaneous complaints'}
    ]
    
    categories = []
    for cat_data in categories_data:
        category = Category.query.filter_by(name=cat_data['name']).first()
        if not category:
            category = Category(**cat_data)
            db.session.add(category)
            categories.append(category)
            print(f"Created category: {cat_data['name']}")
        else:
            categories.append(category)
            print(f"Category already exists: {cat_data['name']}")
    
    db.session.commit()
    return categories

def create_locations():
    """Create default locations"""
    locations_data = [
        {'name': 'Main Building', 'description': 'Main school building'},
        {'name': 'Library', 'description': 'School library'},
        {'name': 'Cafeteria', 'description': 'School cafeteria'},
        {'name': 'Gymnasium', 'description': 'School gym'},
        {'name': 'Parking Lot', 'description': 'School parking area'},
        {'name': 'Playground', 'description': 'School playground'},
        {'name': 'Science Lab', 'description': 'Science laboratory'},
        {'name': 'Computer Lab', 'description': 'Computer laboratory'},
        {'name': 'Administration Office', 'description': 'Administrative offices'},
        {'name': 'Other', 'description': 'Other locations'}
    ]
    
    locations = []
    for loc_data in locations_data:
        location = Location.query.filter_by(name=loc_data['name']).first()
        if not location:
            location = Location(**loc_data)
            db.session.add(location)
            locations.append(location)
            print(f"Created location: {loc_data['name']}")
        else:
            locations.append(location)
            print(f"Location already exists: {loc_data['name']}")
    
    db.session.commit()
    return locations

def create_sla_rules():
    """Create default SLA rules"""
    sla_rules_data = [
        {
            'name': 'High Priority SLA',
            'priority': 'High',
            'response_time_minutes': 60,  # 1 hour
            'resolution_time_minutes': 1440,  # 24 hours
            'escalation_time_minutes': 720,  # 12 hours
            'is_active': True
        },
        {
            'name': 'Medium Priority SLA',
            'priority': 'Medium',
            'response_time_minutes': 240,  # 4 hours
            'resolution_time_minutes': 4320,  # 72 hours (3 days)
            'escalation_time_minutes': 2160,  # 36 hours
            'is_active': True
        },
        {
            'name': 'Low Priority SLA',
            'priority': 'Low',
            'response_time_minutes': 480,  # 8 hours
            'resolution_time_minutes': 10080,  # 7 days
            'escalation_time_minutes': 5040,  # 3.5 days
            'is_active': True
        }
    ]
    
    sla_rules = []
    for rule_data in sla_rules_data:
        rule = SLARule.query.filter_by(
            name=rule_data['name'],
            priority=rule_data['priority']
        ).first()
        if not rule:
            rule = SLARule(**rule_data)
            db.session.add(rule)
            sla_rules.append(rule)
            print(f"Created SLA rule: {rule_data['name']}")
        else:
            sla_rules.append(rule)
            print(f"SLA rule already exists: {rule_data['name']}")
    
    db.session.commit()
    return sla_rules

def main():
    """Main function to seed the database"""
    app = create_app()
    
    with app.app_context():
        print("Starting database seeding...")
        print("=" * 50)
        
        # Create all data
        roles = create_roles()
        users = create_users(roles)
        categories = create_categories()
        locations = create_locations()
        sla_rules = create_sla_rules()
        
        print("=" * 50)
        print("Database seeding completed!")
        print(f"Created/Found: {len(roles)} roles, {len(users)} users, {len(categories)} categories, {len(locations)} locations, {len(sla_rules)} SLA rules")
        print("\nDefault login credentials:")
        print("Admin: admin / admin123")
        print("Principal: principal / principal123")
        print("Staff: staff1 / staff123")
        print("Student: student1 / student123")

if __name__ == '__main__':
    main()

