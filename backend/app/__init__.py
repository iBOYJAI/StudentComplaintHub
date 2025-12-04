from flask import Flask, jsonify, request
from flask_jwt_extended.exceptions import JWTDecodeError, NoAuthorizationError
from .config import config
from .extensions import db, migrate, jwt, cors, ma
from .utils.database import get_database_uri

def create_app(config_name='default'):
    """Create and configure Flask application"""
    
    app = Flask(__name__)
    
    # Disable strict slashes to prevent redirects that break CORS preflight
    app.url_map.strict_slashes = False
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Set database URI with auto-detection
    app.config['SQLALCHEMY_DATABASE_URI'] = get_database_uri()
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # Configure CORS to allow Authorization header
    # Flask-CORS automatically handles OPTIONS preflight requests
    cors.init_app(app, 
                  origins=app.config['CORS_ORIGINS'],
                  supports_credentials=True,
                  allow_headers=['Content-Type', 'Authorization'],
                  methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    
    ma.init_app(app)
    
    # Initialize app config
    config[config_name].init_app(app)
    
    # Register JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token has expired'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        # Log the actual error for debugging
        import traceback
        auth_header = request.headers.get('Authorization', 'Not provided')
        print(f"JWT Invalid Token Error: {error}")
        print(f"Authorization header received: {auth_header[:100] if auth_header != 'Not provided' else 'Not provided'}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Invalid token', 'message': str(error)}), 422
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        # Log missing token
        print(f"JWT Missing Token Error: {error}")
        auth_header = request.headers.get('Authorization', 'Not provided')
        print(f"Authorization header: {auth_header[:50] if auth_header != 'Not provided' else 'Not provided'}")
        return jsonify({'error': 'Authorization token is missing', 'message': str(error)}), 401
    
    @jwt.needs_fresh_token_loader
    def token_not_fresh_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token is not fresh'}), 401
    
    # Global error handler to ensure JSON responses with CORS headers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Resource not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        import traceback
        print(f"Internal Server Error: {traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500
    
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'error': 'Bad request', 'message': str(error)}), 400
    
    # Register blueprints
    from .routes import api_v1
    app.register_blueprint(api_v1, url_prefix='/api')
    
    # Health check endpoint
    @app.route('/health')
    def health():
        return {'status': 'healthy', 'version': app.config['APP_VERSION']}
    
    # Root endpoint
    @app.route('/')
    def index():
        return {
            'app': app.config['APP_NAME'],
            'version': app.config['APP_VERSION'],
            'status': 'running',
            'docs': '/api/docs'
        }
    
    return app
