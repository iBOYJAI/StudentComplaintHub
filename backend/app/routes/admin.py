from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
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
