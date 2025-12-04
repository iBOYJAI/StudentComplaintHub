from flask import Blueprint, jsonify, request, render_template_string
from ..config import config

docs_bp = Blueprint('docs', __name__)

def get_documentation():
    """Get API documentation data"""
    base_url = '/api'
    
    documentation = {
        'app': config['default'].APP_NAME,
        'version': config['default'].APP_VERSION,
        'base_url': base_url,
        'authentication': {
            'type': 'JWT Bearer Token',
            'header': 'Authorization: Bearer <token>',
            'note': 'Most endpoints require authentication. Get token from /api/auth/login or /api/auth/pin/login'
        },
        'endpoints': {
            'auth': {
                'base': f'{base_url}/auth',
                'routes': [
                    {
                        'method': 'POST',
                        'path': f'{base_url}/auth/register',
                        'description': 'Register a new user account',
                        'auth_required': False,
                        'body': {
                            'username': 'string (required)',
                            'email': 'string (required)',
                            'password': 'string (required, min 6 chars)',
                            'full_name': 'string (optional)'
                        },
                        'response': 'Returns user object with approval status'
                    },
                    {
                        'method': 'POST',
                        'path': f'{base_url}/auth/login',
                        'description': 'Login with username and password',
                        'auth_required': False,
                        'body': {
                            'username': 'string (required)',
                            'password': 'string (required)'
                        },
                        'response': 'Returns access_token and user object'
                    },
                    {
                        'method': 'POST',
                        'path': f'{base_url}/auth/pin/login',
                        'description': 'Login with username and PIN (quick login)',
                        'auth_required': False,
                        'body': {
                            'username': 'string (required)',
                            'pin': 'string (required, 4-8 chars)'
                        },
                        'response': 'Returns access_token and user object'
                    },
                    {
                        'method': 'POST',
                        'path': f'{base_url}/auth/pin/setup',
                        'description': 'Setup or update PIN for quick login',
                        'auth_required': True,
                        'body': {
                            'pin': 'string (required, 4-8 chars)'
                        },
                        'response': 'Returns success message'
                    },
                    {
                        'method': 'GET',
                        'path': f'{base_url}/auth/me',
                        'description': 'Get current authenticated user information',
                        'auth_required': True,
                        'response': 'Returns current user object'
                    },
                    {
                        'method': 'POST',
                        'path': f'{base_url}/auth/logout',
                        'description': 'Logout user (client should discard token)',
                        'auth_required': True,
                        'response': 'Returns success message'
                    }
                ]
            },
            'complaints': {
                'base': f'{base_url}/complaints',
                'routes': [
                    {
                        'method': 'GET',
                        'path': f'{base_url}/complaints',
                        'description': 'List all complaints (filtered by role)',
                        'auth_required': True,
                        'query_params': {
                            'page': 'integer (default: 1)',
                            'per_page': 'integer (default: 20)',
                            'status': 'string (optional: New, In Progress, Resolved, Closed)',
                            'priority': 'string (optional: Low, Medium, High, Urgent)',
                            'category_id': 'integer (optional)',
                            'search': 'string (optional: search in title/description)'
                        },
                        'response': 'Returns paginated list of complaints'
                    },
                    {
                        'method': 'POST',
                        'path': f'{base_url}/complaints',
                        'description': 'Create a new complaint',
                        'auth_required': True,
                        'body': {
                            'title': 'string (required)',
                            'description': 'string (required)',
                            'category_id': 'integer (required)',
                            'location_id': 'integer (optional)',
                            'priority': 'string (optional: Low, Medium, High, Urgent, default: Medium)',
                            'is_anonymous': 'boolean (optional, default: false)',
                            'privacy_mode': 'string (optional: public, private, default: public)'
                        },
                        'response': 'Returns created complaint object'
                    },
                    {
                        'method': 'GET',
                        'path': f'{base_url}/complaints/<id>',
                        'description': 'Get complaint details by ID',
                        'auth_required': True,
                        'response': 'Returns complaint object with full details'
                    },
                    {
                        'method': 'PUT',
                        'path': f'{base_url}/complaints/<id>',
                        'description': 'Update complaint (owner can update title/description, staff can update status/priority/assignment)',
                        'auth_required': True,
                        'body': {
                            'title': 'string (optional)',
                            'description': 'string (optional)',
                            'status': 'string (optional, staff only)',
                            'priority': 'string (optional, staff only)',
                            'assigned_to': 'integer (optional, staff only)'
                        },
                        'response': 'Returns updated complaint object'
                    },
                    {
                        'method': 'DELETE',
                        'path': f'{base_url}/complaints/<id>',
                        'description': 'Delete complaint (soft delete)',
                        'auth_required': True,
                        'response': 'Returns success message'
                    },
                    {
                        'method': 'POST',
                        'path': f'{base_url}/complaints/<id>/like',
                        'description': 'Toggle like on a complaint',
                        'auth_required': True,
                        'response': 'Returns liked status and like_count'
                    },
                    {
                        'method': 'POST',
                        'path': f'{base_url}/complaints/<id>/vote',
                        'description': 'Toggle vote on a complaint',
                        'auth_required': True,
                        'response': 'Returns voted status and vote_count'
                    },
                    {
                        'method': 'GET',
                        'path': f'{base_url}/complaints/<id>/comments',
                        'description': 'Get all comments for a complaint',
                        'auth_required': True,
                        'response': 'Returns list of comments'
                    },
                    {
                        'method': 'POST',
                        'path': f'{base_url}/complaints/<id>/comments',
                        'description': 'Add a comment to a complaint',
                        'auth_required': True,
                        'body': {
                            'content': 'string (required)',
                            'is_internal': 'boolean (optional, default: false)'
                        },
                        'response': 'Returns created comment object'
                    },
                    {
                        'method': 'POST',
                        'path': f'{base_url}/complaints/<id>/escalate',
                        'description': 'Escalate a complaint to higher authority',
                        'auth_required': True,
                        'body': {
                            'escalated_to': 'integer (required: user ID)',
                            'reason': 'string (required)',
                            'level': 'integer (optional, default: 1)'
                        },
                        'response': 'Returns escalation object'
                    },
                    {
                        'method': 'GET',
                        'path': f'{base_url}/complaints/<id>/escalations',
                        'description': 'Get all escalations for a complaint',
                        'auth_required': True,
                        'response': 'Returns list of escalations'
                    }
                ]
            },
            'users': {
                'base': f'{base_url}/users',
                'routes': [
                    {
                        'method': 'GET',
                        'path': f'{base_url}/users',
                        'description': 'List all users (admin only)',
                        'auth_required': True,
                        'admin_required': True,
                        'response': 'Returns list of all users'
                    },
                    {
                        'method': 'GET',
                        'path': f'{base_url}/users/<id>',
                        'description': 'Get user details by ID',
                        'auth_required': True,
                        'response': 'Returns user object'
                    },
                    {
                        'method': 'GET',
                        'path': f'{base_url}/users/<id>/profile',
                        'description': 'Get user profile',
                        'auth_required': True,
                        'response': 'Returns user profile object'
                    },
                    {
                        'method': 'PUT',
                        'path': f'{base_url}/users/<id>/profile',
                        'description': 'Update user profile (own profile only)',
                        'auth_required': True,
                        'body': {
                            'bio': 'string (optional)',
                            'avatar_url': 'string (optional)',
                            'phone': 'string (optional)',
                            'department': 'string (optional)'
                        },
                        'response': 'Returns updated profile object'
                    },
                    {
                        'method': 'GET',
                        'path': f'{base_url}/users/<id>/settings',
                        'description': 'Get user settings (own settings only)',
                        'auth_required': True,
                        'response': 'Returns user settings object'
                    },
                    {
                        'method': 'PUT',
                        'path': f'{base_url}/users/<id>/settings',
                        'description': 'Update user settings (own settings only)',
                        'auth_required': True,
                        'body': {
                            'show_real_name': 'boolean (optional)',
                            'email_notifications': 'boolean (optional)',
                            'push_notifications': 'boolean (optional)'
                        },
                        'response': 'Returns updated settings object'
                    },
                    {
                        'method': 'POST',
                        'path': f'{base_url}/users/<id>/follow',
                        'description': 'Toggle follow status for a user',
                        'auth_required': True,
                        'response': 'Returns following status and follower_count'
                    }
                ]
            },
            'admin': {
                'base': f'{base_url}/admin',
                'routes': [
                    {
                        'method': 'GET',
                        'path': f'{base_url}/admin/categories',
                        'description': 'List all active categories',
                        'auth_required': True,
                        'response': 'Returns list of categories'
                    },
                    {
                        'method': 'POST',
                        'path': f'{base_url}/admin/categories',
                        'description': 'Create a new category (admin only)',
                        'auth_required': True,
                        'admin_required': True,
                        'body': {
                            'name': 'string (required)',
                            'description': 'string (optional)'
                        },
                        'response': 'Returns created category object'
                    },
                    {
                        'method': 'GET',
                        'path': f'{base_url}/admin/locations',
                        'description': 'List all active locations',
                        'auth_required': True,
                        'response': 'Returns list of locations'
                    },
                    {
                        'method': 'POST',
                        'path': f'{base_url}/admin/locations',
                        'description': 'Create a new location (admin only)',
                        'auth_required': True,
                        'admin_required': True,
                        'body': {
                            'name': 'string (required)',
                            'description': 'string (optional)'
                        },
                        'response': 'Returns created location object'
                    },
                    {
                        'method': 'POST',
                        'path': f'{base_url}/admin/users/<id>/approve',
                        'description': 'Approve a user account (admin only)',
                        'auth_required': True,
                        'admin_required': True,
                        'response': 'Returns success message'
                    },
                    {
                        'method': 'GET',
                        'path': f'{base_url}/admin/roles',
                        'description': 'List all roles',
                        'auth_required': True,
                        'response': 'Returns list of roles'
                    },
                    {
                        'method': 'GET',
                        'path': f'{base_url}/admin/routing-rules',
                        'description': 'List all routing rules (admin only)',
                        'auth_required': True,
                        'admin_required': True,
                        'response': 'Returns list of routing rules'
                    },
                    {
                        'method': 'POST',
                        'path': f'{base_url}/admin/routing-rules',
                        'description': 'Create a new routing rule (admin only)',
                        'auth_required': True,
                        'admin_required': True,
                        'body': {
                            'name': 'string (required)',
                            'category_id': 'integer (optional)',
                            'location_id': 'integer (optional)',
                            'priority': 'string (optional)',
                            'assign_to_user_id': 'integer (optional)',
                            'assign_to_role_id': 'integer (optional)',
                            'execution_order': 'integer (optional, default: 0)'
                        },
                        'response': 'Returns created routing rule object'
                    },
                    {
                        'method': 'PUT',
                        'path': f'{base_url}/admin/routing-rules/<id>',
                        'description': 'Update a routing rule (admin only)',
                        'auth_required': True,
                        'admin_required': True,
                        'body': {
                            'name': 'string (optional)',
                            'category_id': 'integer (optional)',
                            'location_id': 'integer (optional)',
                            'priority': 'string (optional)',
                            'assign_to_user_id': 'integer (optional)',
                            'assign_to_role_id': 'integer (optional)',
                            'execution_order': 'integer (optional)',
                            'is_active': 'boolean (optional)'
                        },
                        'response': 'Returns updated routing rule object'
                    },
                    {
                        'method': 'DELETE',
                        'path': f'{base_url}/admin/routing-rules/<id>',
                        'description': 'Delete a routing rule (admin only)',
                        'auth_required': True,
                        'admin_required': True,
                        'response': 'Returns success message'
                    },
                    {
                        'method': 'GET',
                        'path': f'{base_url}/admin/sla-rules',
                        'description': 'List all active SLA rules',
                        'auth_required': True,
                        'response': 'Returns list of SLA rules'
                    },
                    {
                        'method': 'POST',
                        'path': f'{base_url}/admin/sla-rules',
                        'description': 'Create a new SLA rule (admin only)',
                        'auth_required': True,
                        'admin_required': True,
                        'body': {
                            'name': 'string (required)',
                            'priority': 'string (required: Low, Medium, High, Urgent)',
                            'response_time_minutes': 'integer (required)',
                            'resolution_time_minutes': 'integer (required)',
                            'escalation_time_minutes': 'integer (optional)'
                        },
                        'response': 'Returns created SLA rule object'
                    },
                    {
                        'method': 'PUT',
                        'path': f'{base_url}/admin/sla-rules/<id>',
                        'description': 'Update an SLA rule (admin only)',
                        'auth_required': True,
                        'admin_required': True,
                        'body': {
                            'name': 'string (optional)',
                            'priority': 'string (optional)',
                            'response_time_minutes': 'integer (optional)',
                            'resolution_time_minutes': 'integer (optional)',
                            'escalation_time_minutes': 'integer (optional)',
                            'is_active': 'boolean (optional)'
                        },
                        'response': 'Returns updated SLA rule object'
                    }
                ]
            },
            'dashboard': {
                'base': f'{base_url}/dashboard',
                'routes': [
                    {
                        'method': 'GET',
                        'path': f'{base_url}/dashboard/stats',
                        'description': 'Get dashboard statistics (filtered by role)',
                        'auth_required': True,
                        'response': 'Returns statistics including total, open, closed, overdue complaints and breakdowns by status/priority'
                    }
                ]
            },
            'notifications': {
                'base': f'{base_url}/notifications',
                'routes': [
                    {
                        'method': 'GET',
                        'path': f'{base_url}/notifications',
                        'description': 'Get notifications for current user',
                        'auth_required': True,
                        'response': 'Returns list of notifications and unread count'
                    },
                    {
                        'method': 'POST',
                        'path': f'{base_url}/notifications/<id>/read',
                        'description': 'Mark a notification as read',
                        'auth_required': True,
                        'response': 'Returns success message'
                    }
                ]
            }
        },
        'system': {
            'base': '/',
            'routes': [
                {
                    'method': 'GET',
                    'path': '/',
                    'description': 'Root endpoint - API information',
                    'auth_required': False,
                    'response': 'Returns app name, version, status, and docs URL'
                },
                {
                    'method': 'GET',
                    'path': '/health',
                    'description': 'Health check endpoint',
                    'auth_required': False,
                    'response': 'Returns health status and version'
                }
            ]
        }
    }
    
    return documentation

@docs_bp.route('', methods=['GET'], strict_slashes=False)
@docs_bp.route('/', methods=['GET'], strict_slashes=False)
def api_docs():
    """API Documentation - List all available endpoints"""
    
    documentation = get_documentation()
    
    # Check format parameter first (explicit request)
    format_param = request.args.get('format', '').lower()
    if format_param == 'json':
        return jsonify(documentation), 200
    if format_param == 'html':
        return render_html_docs(documentation)
    
    # Check Accept header if no format parameter
    accept_header = request.headers.get('Accept', '')
    if 'text/html' in accept_header and 'application/json' not in accept_header:
        return render_html_docs(documentation)
    
    # Return JSON by default
    return jsonify(documentation), 200

def render_html_docs(docs):
    """Render HTML documentation page"""
    html_template = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ app }} API Documentation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            margin-bottom: 10px;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        .header {
            margin-bottom: 30px;
        }
        .header p {
            color: #666;
            margin: 5px 0;
        }
        .auth-info {
            background: #e8f4f8;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 30px;
            border-left: 4px solid #3498db;
        }
        .auth-info strong {
            color: #2c3e50;
        }
        .section {
            margin-bottom: 40px;
        }
        .section-title {
            font-size: 24px;
            color: #2c3e50;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #ecf0f1;
        }
        .endpoint {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            padding: 20px;
            margin-bottom: 20px;
            transition: box-shadow 0.2s;
        }
        .endpoint:hover {
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .method {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 14px;
            margin-right: 10px;
        }
        .method.GET { background: #28a745; color: white; }
        .method.POST { background: #007bff; color: white; }
        .method.PUT { background: #ffc107; color: #333; }
        .method.DELETE { background: #dc3545; color: white; }
        .path {
            font-family: 'Courier New', monospace;
            font-size: 16px;
            color: #495057;
            font-weight: 500;
        }
        .description {
            margin: 10px 0;
            color: #666;
        }
        .details {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #dee2e6;
        }
        .detail-item {
            margin: 8px 0;
        }
        .detail-label {
            font-weight: 600;
            color: #495057;
            display: inline-block;
            min-width: 120px;
        }
        .detail-value {
            color: #666;
        }
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: 600;
            margin-left: 5px;
        }
        .badge.auth {
            background: #ffc107;
            color: #333;
        }
        .badge.admin {
            background: #dc3545;
            color: white;
        }
        .body-params, .query-params {
            margin-top: 10px;
        }
        .params-list {
            margin-left: 20px;
            margin-top: 5px;
        }
        .params-list li {
            margin: 5px 0;
            font-family: 'Courier New', monospace;
            font-size: 14px;
        }
        .json-link {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            background: #3498db;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            transition: background 0.2s;
        }
        .json-link:hover {
            background: #2980b9;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{ app }} API Documentation</h1>
            <p><strong>Version:</strong> {{ version }}</p>
            <p><strong>Base URL:</strong> <code>{{ base_url }}</code></p>
        </div>
        
        <div class="auth-info">
            <strong>Authentication:</strong> {{ authentication.type }}<br>
            <strong>Header:</strong> <code>{{ authentication.header }}</code><br>
            <strong>Note:</strong> {{ authentication.note }}
        </div>
        
        {% for section_name, section_data in endpoints.items() %}
        <div class="section">
            <h2 class="section-title">{{ section_name|title }} Endpoints</h2>
            <p><strong>Base:</strong> <code>{{ section_data.base }}</code></p>
            
            {% for route in section_data.routes %}
            <div class="endpoint">
                <div>
                    <span class="method {{ route.method }}">{{ route.method }}</span>
                    <span class="path">{{ route.path }}</span>
                    {% if route.auth_required %}
                    <span class="badge auth">Auth Required</span>
                    {% endif %}
                    {% if route.get('admin_required') %}
                    <span class="badge admin">Admin Only</span>
                    {% endif %}
                </div>
                <div class="description">{{ route.description }}</div>
                
                <div class="details">
                    {% if route.get('body') %}
                    <div class="detail-item body-params">
                        <span class="detail-label">Request Body:</span>
                        <ul class="params-list">
                            {% for key, value in route.body.items() %}
                            <li><strong>{{ key }}:</strong> {{ value }}</li>
                            {% endfor %}
                        </ul>
                    </div>
                    {% endif %}
                    
                    {% if route.get('query_params') %}
                    <div class="detail-item query-params">
                        <span class="detail-label">Query Parameters:</span>
                        <ul class="params-list">
                            {% for key, value in route.query_params.items() %}
                            <li><strong>{{ key }}:</strong> {{ value }}</li>
                            {% endfor %}
                        </ul>
                    </div>
                    {% endif %}
                    
                    <div class="detail-item">
                        <span class="detail-label">Response:</span>
                        <span class="detail-value">{{ route.response }}</span>
                    </div>
                </div>
            </div>
            {% endfor %}
        </div>
        {% endfor %}
        
        {% if system %}
        <div class="section">
            <h2 class="section-title">System Endpoints</h2>
            {% for route in system.routes %}
            <div class="endpoint">
                <div>
                    <span class="method {{ route.method }}">{{ route.method }}</span>
                    <span class="path">{{ route.path }}</span>
                </div>
                <div class="description">{{ route.description }}</div>
                <div class="details">
                    <div class="detail-item">
                        <span class="detail-label">Response:</span>
                        <span class="detail-value">{{ route.response }}</span>
                    </div>
                </div>
            </div>
            {% endfor %}
        </div>
        {% endif %}
        
        <a href="?format=json" class="json-link">View as JSON</a>
    </div>
</body>
</html>
    """
    return render_template_string(html_template, **docs)

