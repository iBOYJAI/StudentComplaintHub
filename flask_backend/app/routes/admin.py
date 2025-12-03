from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ..extensions import db
from ..models import Category, Location, User, Role
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
