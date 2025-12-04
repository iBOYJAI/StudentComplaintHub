# Token Fix Instructions

## Problem
The 422 "Subject must be a string" error occurs because you have an **old token** in your browser's localStorage that was created before the fix. The fix is already applied to the code, but you need to get a new token.

## Solution

### Option 1: Automatic (Recommended)
1. **Refresh the page** - The app will now automatically detect invalid tokens and redirect you to login
2. **Log in again** - This will create a new token with the correct format

### Option 2: Manual Clear
1. Open your browser's Developer Console (F12)
2. Go to the Console tab
3. Type: `localStorage.clear()` and press Enter
4. Refresh the page and log in again

### Option 3: Use Clear Token Page
1. Navigate to: `http://localhost:8080/clear-token.html`
2. Click "Clear Token & Redirect to Login"
3. Log in again

## What Was Fixed

1. **Token Creation**: All tokens are now created with string identity (`str(user.id)`) instead of integer
2. **Token Validation**: Added automatic detection and cleanup of invalid tokens
3. **Error Handling**: The app now automatically clears invalid tokens and redirects to login

## Files Changed

- `backend/app/routes/auth.py` - Token creation now uses `str(user.id)`
- `frontend/assets/js/api.js` - Automatic token cleanup on 422 errors
- `frontend/assets/js/app.js` - Improved token validation error handling

## After Fixing

Once you log in again with a new token, all API calls should work correctly. The sidebar will also show the correct menu items based on your user role.

