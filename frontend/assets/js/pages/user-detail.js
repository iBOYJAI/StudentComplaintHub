import { BasePage } from './base-page.js';
import { Toast } from '../components/toast.js';

export class UserDetailPage extends BasePage {
  constructor(params) {
    super(params);
    this.userId = params.id;
    this.user = null;
    this.isEditing = false;
  }

  async getContent() {
    await this.loadData();

    if (!this.user) {
      return `
        <div class="main-content">
          <div class="alert alert-error">User not found</div>
        </div>
      `;
    }

    return `
      <div class="main-content">
        <div class="profile-container">
          ${this.renderHeader()}
          ${this.renderDetails()}
        </div>
      </div>
    `;
  }

  renderHeader() {
    return `
      <div class="profile-header">
        <div class="profile-avatar">
          ${this.getInitials(this.user.name || this.user.username)}
        </div>
        <div class="profile-info">
          <h1 class="profile-name">${this.escapeHtml(this.user.name || this.user.username)}</h1>
          <p class="profile-role">
            <span class="badge badge-${this.getRoleBadgeColor(this.user.role)}">${this.user.role}</span>
          </p>
        </div>
        <div>
          <a href="/admin/users" class="btn btn-secondary" data-link>← Back to Users</a>
        </div>
      </div>
    `;
  }

  renderDetails() {
    return `
      <div class="profile-sections">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">User Information</h3>
            <button class="btn btn-primary" id="editBtn">Edit</button>
          </div>
          <div class="card-body">
            <form id="userForm">
              <div class="form-group">
                <label class="form-label">Username</label>
                <input type="text" class="form-control" id="username" value="${this.user.username}" disabled>
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" class="form-control" id="email" value="${this.user.email}" disabled>
              </div>
              <div class="form-group">
                <label class="form-label">Name</label>
                <input type="text" class="form-control" id="name" value="${this.user.name || ''}" disabled>
              </div>
              <div class="form-group">
                <label class="form-label">Role</label>
                <select class="form-control" id="role" disabled>
                  <option value="student" ${this.user.role === 'student' ? 'selected' : ''}>Student</option>
                  <option value="staff" ${this.user.role === 'staff' ? 'selected' : ''}>Staff</option>
                  <option value="admin" ${this.user.role === 'admin' ? 'selected' : ''}>Admin</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Status</label>
                <select class="form-control" id="active" disabled>
                  <option value="true" ${this.user.active ? 'selected' : ''}>Active</option>
                  <option value="false" ${!this.user.active ? 'selected' : ''}>Inactive</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Created At</label>
                <input type="text" class="form-control" value="${this.formatDate(this.user.createdAt)}" disabled>
              </div>
              <div id="formActions" class="crud-form-actions" style="display: none;">
                <button type="button" class="btn btn-secondary" id="cancelBtn">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  async loadData() {
    try {
      const response = await this.api.getUser(this.userId);
      this.user = response.data || response.user || response;
    } catch (error) {
      console.error('Error loading user:', error);
      Toast.error('Failed to load user details');
    }
  }

  async afterRender() {
    const editBtn = document.getElementById('editBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const userForm = document.getElementById('userForm');
    const formActions = document.getElementById('formActions');

    editBtn?.addEventListener('click', () => {
      this.isEditing = true;
      document.querySelectorAll('#userForm input, #userForm select').forEach(el => {
        if (el.id !== 'username') el.disabled = false;
      });
      editBtn.style.display = 'none';
      formActions.style.display = 'flex';
    });

    cancelBtn?.addEventListener('click', () => {
      this.isEditing = false;
      document.querySelectorAll('#userForm input, #userForm select').forEach(el => {
        el.disabled = true;
      });
      editBtn.style.display = 'block';
      formActions.style.display = 'none';
      this.render();
    });

    userForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveUser();
    });
  }

  async saveUser() {
    try {
      const data = {
        email: document.getElementById('email').value,
        name: document.getElementById('name').value,
        role: document.getElementById('role').value,
        active: document.getElementById('active').value === 'true'
      };

      await this.api.updateUser(this.userId, data);
      Toast.success('User updated successfully');
      this.isEditing = false;
      await this.render();
    } catch (error) {
      console.error('Error updating user:', error);
      Toast.error('Failed to update user');
    }
  }

  getInitials(name) {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getRoleBadgeColor(role) {
    const colors = { student: 'primary', staff: 'info', admin: 'error' };
    return colors[role] || 'gray';
  }

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
