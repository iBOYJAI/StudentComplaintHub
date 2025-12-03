from flask import Blueprint
from .auth import auth_bp
from .complaints import complaints_bp
from .users import users_bp
from .admin import admin_bp
from .dashboard import dashboard_bp

# Main API blueprint
api_v1 = Blueprint('api', __name__)

# Register sub-blueprints
api_v1.register_blueprint(auth_bp, url_prefix='/auth')
api_v1.register_blueprint(complaints_bp, url_prefix='/complaints')
api_v1.register_blueprint(users_bp, url_prefix='/users')
api_v1.register_blueprint(admin_bp, url_prefix='/admin')
api_v1.register_blueprint(dashboard_bp, url_prefix='/dashboard')
