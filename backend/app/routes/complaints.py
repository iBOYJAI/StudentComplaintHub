from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Complaint, Category, Location, User, Comment, ComplaintLike, SLARule
from ..utils.decorators import staff_required

complaints_bp = Blueprint('complaints', __name__)


@complaints_bp.route('/', methods=['GET'])
@jwt_required()
def list_complaints():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = Complaint.query.filter_by(is_deleted=False)

    # Filter by role
    if not user.is_staff():
        query = query.filter_by(created_by=user_id)

    # Filters
    if status := request.args.get('status'):
        query = query.filter_by(status=status)
    if priority := request.args.get('priority'):
        query = query.filter_by(priority=priority)
    if category_id := request.args.get('category_id'):
        query = query.filter_by(category_id=category_id)
    if search := request.args.get('search'):
        query = query.filter(
            (Complaint.title.ilike(f'%{search}%')) |
            (Complaint.description.ilike(f'%{search}%'))
        )

    pagination = query.order_by(Complaint.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'items': [c.to_dict() for c in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'total_pages': pagination.pages
    }), 200


@complaints_bp.route('/', methods=['POST'])
@jwt_required()
def create_complaint():
    user_id = get_jwt_identity()
    data = request.get_json()

    # Validate category
    category = Category.query.get(data.get('category_id'))
    if not category:
        return jsonify({'error': 'Invalid category'}), 400

    # Calculate SLA
    priority = data.get('priority', 'Medium')
    sla_rule = SLARule.query.filter_by(priority=priority, is_active=True).first()

    complaint = Complaint(
        title=data['title'],
        description=data['description'],
        category_id=data['category_id'],
        location_id=data.get('location_id'),
        priority=priority,
        is_anonymous=data.get('is_anonymous', False),
        privacy_mode=data.get('privacy_mode', 'public'),
        created_by=user_id,
        status='New'
    )

    # Set SLA due date
    if sla_rule:
        complaint.sla_minutes = sla_rule.resolution_time_minutes
        complaint.due_date = datetime.utcnow() + timedelta(minutes=sla_rule.resolution_time_minutes)

    db.session.add(complaint)
    db.session.commit()

    return jsonify(complaint.to_dict()), 201


@complaints_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_complaint(id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    complaint = Complaint.query.filter_by(id=id, is_deleted=False).first()
    if not complaint:
        return jsonify({'error': 'Complaint not found'}), 404

    # Check permissions
    if not user.is_staff() and complaint.created_by != user_id:
        return jsonify({'error': 'Access denied'}), 403

    # Increment view count
    complaint.view_count += 1
    db.session.commit()

    return jsonify(complaint.to_dict()), 200


@complaints_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_complaint(id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()

    complaint = Complaint.query.get(id)
    if not complaint:
        return jsonify({'error': 'Complaint not found'}), 404

    # Check permissions
    is_owner = complaint.created_by == user_id
    if not (is_owner or user.is_staff()):
        return jsonify({'error': 'Access denied'}), 403

    # Update fields
    if 'title' in data and (is_owner or user.is_staff()):
        complaint.title = data['title']
    if 'description' in data and (is_owner or user.is_staff()):
        complaint.description = data['description']
    if 'status' in data and user.is_staff():
        complaint.status = data['status']
        if data['status'] == 'Resolved':
            complaint.resolved_at = datetime.utcnow()
            complaint.resolved_by = user_id
    if 'priority' in data and user.is_staff():
        complaint.priority = data['priority']
    if 'assigned_to' in data and user.is_staff():
        complaint.assigned_to = data['assigned_to']

    db.session.commit()
    return jsonify(complaint.to_dict()), 200


@complaints_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_complaint(id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    complaint = Complaint.query.get(id)
    if not complaint:
        return jsonify({'error': 'Complaint not found'}), 404

    # Check permissions
    if not (complaint.created_by == user_id or user.is_admin()):
        return jsonify({'error': 'Access denied'}), 403

    complaint.is_deleted = True
    complaint.deleted_at = datetime.utcnow()
    db.session.commit()

    return jsonify({'message': 'Complaint deleted'}), 200


@complaints_bp.route('/<int:id>/like', methods=['POST'])
@jwt_required()
def toggle_like(id):
    user_id = get_jwt_identity()

    complaint = Complaint.query.filter_by(id=id, is_deleted=False).first()
    if not complaint:
        return jsonify({'error': 'Complaint not found'}), 404

    like = ComplaintLike.query.filter_by(complaint_id=id, user_id=user_id).first()

    if like:
        db.session.delete(like)
        liked = False
    else:
        like = ComplaintLike(complaint_id=id, user_id=user_id)
        db.session.add(like)
        liked = True

    db.session.commit()

    like_count = ComplaintLike.query.filter_by(complaint_id=id).count()
    return jsonify({'liked': liked, 'like_count': like_count}), 200


@complaints_bp.route('/<int:id>/comments', methods=['GET'])
@jwt_required()
def get_comments(id):
    complaint = Complaint.query.filter_by(id=id, is_deleted=False).first()
    if not complaint:
        return jsonify({'error': 'Complaint not found'}), 404

    comments = Comment.query.filter_by(complaint_id=id, is_deleted=False).order_by(Comment.created_at).all()
    return jsonify([c.to_dict() for c in comments]), 200


@complaints_bp.route('/<int:id>/comments', methods=['POST'])
@jwt_required()
def add_comment(id):
    user_id = get_jwt_identity()
    data = request.get_json()

    complaint = Complaint.query.filter_by(id=id, is_deleted=False).first()
    if not complaint:
        return jsonify({'error': 'Complaint not found'}), 404

    comment = Comment(
        complaint_id=id,
        author_id=user_id,
        content=data['content'],
        is_internal=data.get('is_internal', False)
    )
    db.session.add(comment)
    db.session.commit()

    return jsonify(comment.to_dict()), 201
