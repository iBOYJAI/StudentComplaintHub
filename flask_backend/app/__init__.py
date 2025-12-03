from flask import Flask
from .config import config
from .extensions import db, migrate, jwt, cors, ma
from .utils.database import get_database_uri

def create_app(config_name='default'):
    """Create and configure Flask application"""
    
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Set database URI with auto-detection
    app.config['SQLALCHEMY_DATABASE_URI'] = get_database_uri()
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, origins=app.config['CORS_ORIGINS'])
    ma.init_app(app)
    
    # Initialize app config
    config[config_name].init_app(app)
    
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
