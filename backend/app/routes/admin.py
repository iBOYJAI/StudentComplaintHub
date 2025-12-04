from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime
from ..extensions import db
from ..models import Category, Location, User, Role, RoutingRule, SLARule
from ..utils.decorators import admin_required

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/categories', methods=['GET'])
@jwt_required()
def list_categories():
    categories = Category.query.filter_by(is_active=True).all()
    return jsonify([c.to_dict() for c in categories]), 200

@admin_bp.route('/categories', methods=['POST'])
@jwt_required()
@admin_required
def create_category():
    data = request.get_json()
    category = Category(name=data['name'], description=data.get('description'))
    db.session.add(category)
    db.session.commit()
    return jsonify(category.to_dict()), 201

@admin_bp.route('/locations', methods=['GET'])
@jwt_required()
def list_locations():
    locations = Location.query.filter_by(is_active=True).all()
    return jsonify([l.to_dict() for l in locations]), 200

@admin_bp.route('/locations', methods=['POST'])
@jwt_required()
@admin_required
def create_location():
    data = request.get_json()
    location = Location(name=data['name'], description=data.get('description'))
    db.session.add(location)
    db.session.commit()
    return jsonify(location.to_dict()), 201

@admin_bp.route('/users/<int:id>/approve', methods=['POST'])
@jwt_required()
@admin_required
def approve_user(id):
    user = User.query.get(id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user.is_approved = True
    db.session.commit()
    return jsonify({'message': 'User approved'}), 200

@admin_bp.route('/roles', methods=['GET'])
@jwt_required()
def list_roles():
    roles = Role.query.all()
    return jsonify([r.to_dict() for r in roles]), 200


@admin_bp.route('/routing-rules', methods=['GET'])
@jwt_required()
@admin_required
def list_routing_rules():
    rules = RoutingRule.query.order_by(RoutingRule.execution_order).all()
    return jsonify([r.to_dict() for r in rules]), 200


@admin_bp.route('/routing-rules', methods=['POST'])
@jwt_required()
@admin_required
def create_routing_rule():
    data = request.get_json()
    
    rule = RoutingRule(
        name=data['name'],
        category_id=data.get('category_id'),
        location_id=data.get('location_id'),
        priority=data.get('priority'),
        assign_to_user_id=data.get('assign_to_user_id'),
        assign_to_role_id=data.get('assign_to_role_id'),
        execution_order=data.get('execution_order', 0)
    )
    
    db.session.add(rule)
    db.session.commit()
    
    return jsonify(rule.to_dict()), 201


@admin_bp.route('/routing-rules/<int:id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_routing_rule(id):
    rule = RoutingRule.query.get(id)
    if not rule:
        return jsonify({'error': 'Routing rule not found'}), 404
    
    data = request.get_json()
    
    if 'name' in data:
        rule.name = data['name']
    if 'category_id' in data:
        rule.category_id = data['category_id']
    if 'location_id' in data:
        rule.location_id = data['location_id']
    if 'priority' in data:
        rule.priority = data['priority']
    if 'assign_to_user_id' in data:
        rule.assign_to_user_id = data['assign_to_user_id']
    if 'assign_to_role_id' in data:
        rule.assign_to_role_id = data['assign_to_role_id']
    if 'execution_order' in data:
        rule.execution_order = data['execution_order']
    if 'is_active' in data:
        rule.is_active = data['is_active']
    
    db.session.commit()
    return jsonify(rule.to_dict()), 200


@admin_bp.route('/routing-rules/<int:id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_routing_rule(id):
    rule = RoutingRule.query.get(id)
    if not rule:
        return jsonify({'error': 'Routing rule not found'}), 404
    
    db.session.delete(rule)
    db.session.commit()
    
    return jsonify({'message': 'Routing rule deleted'}), 200


@admin_bp.route('/sla-rules', methods=['GET'])
@jwt_required()
def list_sla_rules():
    rules = SLARule.query.filter_by(is_active=True).all()
    return jsonify([r.to_dict() for r in rules]), 200


@admin_bp.route('/sla-rules', methods=['POST'])
@jwt_required()
@admin_required
def create_sla_rule():
    data = request.get_json()
    
    rule = SLARule(
        name=data['name'],
        priority=data['priority'],
        response_time_minutes=data['response_time_minutes'],
        resolution_time_minutes=data['resolution_time_minutes'],
        escalation_time_minutes=data.get('escalation_time_minutes')
    )
    
    db.session.add(rule)
    db.session.commit()
    
    return jsonify(rule.to_dict()), 201


@admin_bp.route('/sla-rules/<int:id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_sla_rule(id):
    rule = SLARule.query.get(id)
    if not rule:
        return jsonify({'error': 'SLA rule not found'}), 404
    
    data = request.get_json()
    
    if 'name' in data:
        rule.name = data['name']
    if 'priority' in data:
        rule.priority = data['priority']
    if 'response_time_minutes' in data:
        rule.response_time_minutes = data['response_time_minutes']
    if 'resolution_time_minutes' in data:
        rule.resolution_time_minutes = data['resolution_time_minutes']
    if 'escalation_time_minutes' in data:
        rule.escalation_time_minutes = data['escalation_time_minutes']
    if 'is_active' in data:
        rule.is_active = data['is_active']
    
    db.session.commit()
    return jsonify(rule.to_dict()), 200

@admin_bp.route('/sla-rules/<int:id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_sla_rule(id):
    rule = SLARule.query.get(id)
    if not rule:
        return jsonify({'error': 'SLA rule not found'}), 404
    
    db.session.delete(rule)
    db.session.commit()
    return jsonify({'message': 'SLA rule deleted'}), 200

@admin_bp.route('/categories/<int:id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_category(id):
    category = Category.query.get(id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404
    
    data = request.get_json()
    if 'name' in data:
        category.name = data['name']
    if 'description' in data:
        category.description = data.get('description')
    if 'is_active' in data:
        category.is_active = data['is_active']
    
    db.session.commit()
    return jsonify(category.to_dict()), 200

@admin_bp.route('/categories/<int:id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_category(id):
    category = Category.query.get(id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404
    
    category.is_active = False
    db.session.commit()
    return jsonify({'message': 'Category deleted'}), 200

@admin_bp.route('/locations/<int:id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_location(id):
    location = Location.query.get(id)
    if not location:
        return jsonify({'error': 'Location not found'}), 404
    
    data = request.get_json()
    if 'name' in data:
        location.name = data['name']
    if 'description' in data:
        location.description = data.get('description')
    if 'is_active' in data:
        location.is_active = data['is_active']
    
    db.session.commit()
    return jsonify(location.to_dict()), 200

@admin_bp.route('/locations/<int:id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_location(id):
    location = Location.query.get(id)
    if not location:
        return jsonify({'error': 'Location not found'}), 404
    
    location.is_active = False
    db.session.commit()
    return jsonify({'message': 'Location deleted'}), 200

@admin_bp.route('/backups', methods=['GET'])
@jwt_required()
@admin_required
def list_backups():
    """List available backups"""
    import os
    backup_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'backups')
    
    backups = []
    if os.path.exists(backup_dir):
        for filename in os.listdir(backup_dir):
            if filename.endswith('.db'):
                filepath = os.path.join(backup_dir, filename)
                stat = os.stat(filepath)
                backups.append({
                    'filename': filename,
                    'size': stat.st_size,
                    'created_at': datetime.fromtimestamp(stat.st_mtime).isoformat()
                })
    
    return jsonify({'backups': backups}), 200

@admin_bp.route('/backup', methods=['POST'])
@jwt_required()
@admin_required
def create_backup():
    """Create a database backup"""
    import os
    import shutil
    from datetime import datetime
    
    backup_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'backups')
    os.makedirs(backup_dir, exist_ok=True)
    
    db_path = db.engine.url.database
    if db_path and os.path.exists(db_path):
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f'backup_{timestamp}.db'
        backup_path = os.path.join(backup_dir, backup_filename)
        
        shutil.copy2(db_path, backup_path)
        
        return jsonify({
            'message': 'Backup created successfully',
            'filename': backup_filename
        }), 200
    else:
        return jsonify({'error': 'Database file not found'}), 404

@admin_bp.route('/restore', methods=['POST'])
@jwt_required()
@admin_required
def restore_backup():
    """Restore from a backup"""
    import os
    import shutil
    
    data = request.get_json() or {}
    filename = data.get('filename')
    
    if not filename:
        return jsonify({'error': 'Filename is required'}), 400
    
    backup_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'backups')
    backup_path = os.path.join(backup_dir, filename)
    
    if not os.path.exists(backup_path):
        return jsonify({'error': 'Backup file not found'}), 404
    
    db_path = db.engine.url.database
    if db_path:
        # Create a safety backup before restoring
        safety_backup = f'{db_path}.safety_backup'
        if os.path.exists(db_path):
            shutil.copy2(db_path, safety_backup)
        
        shutil.copy2(backup_path, db_path)
        
        return jsonify({'message': 'Database restored successfully'}), 200
    else:
        return jsonify({'error': 'Database file not found'}), 404