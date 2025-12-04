from flask import Blueprint
from .auth import auth_bp
from .complaints import complaints_bp
from .users import users_bp
from .admin import admin_bp
from .dashboard import dashboard_bp
from .notifications import notifications_bp
from .profile import profile_bp
from .docs import docs_bp
from .audit_log import audit_log_bp

# Main API blueprint
api_v1 = Blueprint('api', __name__)

# Register sub-blueprints
api_v1.register_blueprint(auth_bp, url_prefix='/auth')
api_v1.register_blueprint(complaints_bp, url_prefix='/complaints')
api_v1.register_blueprint(users_bp, url_prefix='/users')
api_v1.register_blueprint(admin_bp, url_prefix='/admin')
api_v1.register_blueprint(dashboard_bp, url_prefix='/dashboard')
api_v1.register_blueprint(notifications_bp, url_prefix='/notifications')
api_v1.register_blueprint(profile_bp, url_prefix='/profile')
api_v1.register_blueprint(docs_bp, url_prefix='/docs')
api_v1.register_blueprint(audit_log_bp, url_prefix='/audit-log')
