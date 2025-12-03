import re

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    return len(password) >= 6

def validate_username(username):
    # Allow alphanumeric characters and underscores, minimum 3 characters
    if not username or len(username) < 3:
        return False
    # Check if username contains only alphanumeric characters and underscores
    return all(c.isalnum() or c == '_' for c in username)
