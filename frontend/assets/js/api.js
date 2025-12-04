import { config } from './config.js';

export class API {
  constructor(baseUrl = config.apiBaseUrl) {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = localStorage.getItem('token');

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      // Trim token to ensure no whitespace issues
      const cleanToken = token.trim();
      headers['Authorization'] = `Bearer ${cleanToken}`;
      // Debug: log token (first 20 chars only for security)
      console.log('Sending token:', cleanToken.substring(0, 20) + '...');
    } else {
      console.warn('No token found in localStorage');
    }

    const fetchOptions = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, fetchOptions);
      
      // Handle empty responses
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      }

      if (!response.ok) {
        // Check for both 'error' and 'message' fields in the response
        const errorMessage = data.error || data.message || `Request failed with status ${response.status}`;
        
        // If token is invalid (422), clear it and redirect to login
        const errorLower = errorMessage.toLowerCase();
        if (response.status === 422 && (
          errorLower.includes('token') || 
          errorLower.includes('invalid') ||
          errorLower.includes('subject must be a string')
        )) {
          console.warn('Invalid token detected, clearing and redirecting to login');
          if (window.Auth) {
            window.Auth.logout();
          }
          // Only redirect if not already on a public page
          const publicPaths = ['/login', '/pin-login', '/register'];
          if (!publicPaths.includes(window.location.pathname)) {
            setTimeout(() => {
              window.location.href = '/login';
            }, 100);
          }
        }
        
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      // Re-throw with more context if it's a network error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  // Auth endpoints
  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async loginWithPin(credentials) {
    return this.request('/auth/pin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async setupPin(pin) {
    return this.request('/auth/pin/setup', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
  }

  // Complaint endpoints
  async getComplaints(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/complaints?${query}`);
  }

  async getComplaint(id) {
    return this.request(`/complaints/${id}`);
  }

  async createComplaint(data) {
    return this.request('/complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateComplaint(id, data) {
    return this.request(`/complaints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteComplaint(id) {
    return this.request(`/complaints/${id}`, {
      method: 'DELETE',
    });
  }

  async voteComplaint(id) {
    return this.request(`/complaints/${id}/vote`, {
      method: 'POST',
    });
  }

  async escalateComplaint(id, reason = 'Escalated by user', escalatedTo = null, level = 1) {
    return this.request(`/complaints/${id}/escalate`, {
      method: 'POST',
      body: JSON.stringify({ 
        reason: reason,
        escalated_to: escalatedTo,
        level: level
      }),
    });
  }

  async addComment(complaintId, comment) {
    // Accept either a string or an object
    const content = typeof comment === 'string' ? comment : comment.content;
    return this.request(`/complaints/${complaintId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content: content }),
    });
  }

  // User endpoints
  async getUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/users?${query}`);
  }

  async getUser(id) {
    return this.request(`/users/${id}`);
  }

  async createUser(data) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id, data) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async updateProfile(data) {
    return this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(data) {
    return this.request('/profile/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Category endpoints
  async getCategories() {
    return this.request('/admin/categories');
  }

  async createCategory(data) {
    return this.request('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id, data) {
    return this.request(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id) {
    return this.request(`/admin/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Location endpoints
  async getLocations() {
    return this.request('/admin/locations');
  }

  async createLocation(data) {
    return this.request('/admin/locations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLocation(id, data) {
    return this.request(`/admin/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLocation(id) {
    return this.request(`/admin/locations/${id}`, {
      method: 'DELETE',
    });
  }

  // SLA Rules endpoints
  async getSLARules() {
    return this.request('/admin/sla-rules');
  }

  async createSLARule(data) {
    return this.request('/admin/sla-rules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSLARule(id, data) {
    return this.request(`/admin/sla-rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSLARule(id) {
    return this.request(`/admin/sla-rules/${id}`, {
      method: 'DELETE',
    });
  }

  // Routing Rules endpoints
  async getRoutingRules() {
    return this.request('/admin/routing-rules');
  }

  async createRoutingRule(data) {
    return this.request('/admin/routing-rules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRoutingRule(id, data) {
    return this.request(`/admin/routing-rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRoutingRule(id) {
    return this.request(`/admin/routing-rules/${id}`, {
      method: 'DELETE',
    });
  }

  // Role endpoints
  async getRoles() {
    return this.request('/admin/roles');
  }

  async createRole(data) {
    return this.request('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRole(id, data) {
    return this.request(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRole(id) {
    return this.request(`/roles/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard/Stats endpoints
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  async getAuditLog(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/audit-log?${query}`);
  }

  // Search endpoint
  async search(query, filters = {}) {
    const params = new URLSearchParams({ query, ...filters }).toString();
    return this.request(`/search?${params}`);
  }

  // Notification endpoints
  async getNotifications() {
    return this.request('/notifications');
  }

  async markNotificationRead(id) {
    return this.request(`/notifications/${id}/read`, {
      method: 'POST',
    });
  }

  // Backup endpoints
  async createBackup() {
    return this.request('/admin/backup', {
      method: 'POST',
    });
  }

  async restoreBackup(filename) {
    return this.request('/admin/restore', {
      method: 'POST',
      body: JSON.stringify({ filename }),
    });
  }

  async getBackups() {
    return this.request('/admin/backups');
  }
}
