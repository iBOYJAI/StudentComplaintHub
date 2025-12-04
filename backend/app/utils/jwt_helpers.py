"""JWT helper utilities"""
from functools import wraps
from flask_jwt_extended import get_jwt_identity

def get_user_id():
    """Get user ID from JWT token and convert to int"""
    user_id = get_jwt_identity()
    if user_id:
        # Convert to int if it's a string (from JWT)
        return int(user_id) if isinstance(user_id, str) else user_id
    return None

