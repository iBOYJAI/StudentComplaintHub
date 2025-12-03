from app import create_app
from app.extensions import db
from app.models import *

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
            print("✓ Admin user created (admin/admin123)")
        
        # Create categories
        categories_data = [
            {'name': 'Facilities', 'description': 'Building and infrastructure issues'},
            {'name': 'Academics', 'description': 'Academic related complaints'},
            {'name': 'Canteen', 'description': 'Food and canteen services'},
            {'name': 'Transport', 'description': 'Transportation issues'},
            {'name': 'Library', 'description': 'Library related complaints'},
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
            {'name': 'Playground'}
        ]
        
        for loc_data in locations_data:
            if not Location.query.filter_by(name=loc_data['name']).first():
                location = Location(**loc_data)
                db.session.add(location)
        
        db.session.commit()
        print("✓ Default locations created")
        
        print("\n✅ Database initialization complete!")

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
