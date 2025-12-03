import { BasePage } from './base-page.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';

export class UsersListPage extends BasePage {
  constructor(params) {
    super(params);
    this.users = [];
    this.filters = { role: '', search: '' };
    this.roles = [];
  }

  async getContent() {
    await this.loadData();

    return `
      <div class="main-content">
        <div class="admin-header">
          <div>
            <h1 class="page-title">Users Management</h1>
            <p class="page-description">Manage system users and their roles</p>
          </div>
          <button class="btn btn-primary" id="addUserBtn">➕ Add User</button>
        </div>

        ${this.renderFilters()}
        ${this.renderUsersTable()}
      </div>
    `;
  }

  renderFilters() {
    return `
      <div class="filters-bar">
        <div class="filters-grid">
          <div class="search-box">
            <span class="search-box-icon">🔍</span>
            <input type="text" class="form-control" placeholder="Search users..." id="searchInput" value="${this.filters.search}">
          </div>
          <select class="form-control" id="roleFilter">
            <option value="">All Roles</option>
            <option value="student" ${this.filters.role === 'student' ? 'selected' : ''}>Student</option>
            <option value="staff" ${this.filters.role === 'staff' ? 'selected' : ''}>Staff</option>
            <option value="admin" ${this.filters.role === 'admin' ? 'selected' : ''}>Admin</option>
          </select>
        </div>
      </div>
    `;
  }

  renderUsersTable() {
    if (this.users.length === 0) {
      return `
        <div class="card">
          <div class="card-body">
            <div class="empty-state">
              <div class="empty-state-icon">👥</div>
              <h3 class="empty-state-title">No users found</h3>
              <p class="empty-state-description">No users match your filters.</p>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.users.map(user => `
              <tr>
                <td>#${user.id}</td>
                <td>${this.escapeHtml(user.name || user.username)}</td>
                <td>${this.escapeHtml(user.email)}</td>
                <td><span class="badge badge-${this.getRoleBadgeColor(user.role)}">${user.role}</span></td>
                <td><span class="badge badge-${user.active ? 'success' : 'gray'}">${user.active ? 'Active' : 'Inactive'}</span></td>
                <td>${this.formatDate(user.createdAt)}</td>
                <td>
                  <div class="table-actions">
                    <a href="/admin/users/${user.id}" class="btn btn-sm btn-primary" data-link>View</a>
                    <button class="btn btn-sm btn-secondary" data-user-id="${user.id}" data-action="edit">Edit</button>
                    <button class="btn btn-sm btn-error" data-user-id="${user.id}" data-action="delete">Delete</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  async loadData() {
    try {
      const params = {};
      if (this.filters.role) params.role = this.filters.role;
      if (this.filters.search) params.search = this.filters.search;

      const response = await this.api.getUsers(params);
      this.users = response.data || response.users || [];
    } catch (error) {
      console.error('Error loading users:', error);
      Toast.error('Failed to load users');
      this.users = [];
    }
  }

  async afterRender() {
    // Filter handlers
    document.getElementById('searchInput')?.addEventListener('input', (e) => {
      this.filters.search = e.target.value;
      this.debounce(() => this.render(), 500);
    });

    document.getElementById('roleFilter')?.addEventListener('change', (e) => {
      this.filters.role = e.target.value;
      this.render();
    });

    // Add user button
    document.getElementById('addUserBtn')?.addEventListener('click', () => this.showAddUserModal());

    // Action buttons
    document.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const userId = e.target.dataset.userId;
        this.router.navigate(`/admin/users/${userId}`);
      });
    });

    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const userId = e.target.dataset.userId;
        this.deleteUser(userId);
      });
    });
  }

  showAddUserModal() {
    const modal = new Modal({
      title: 'Add New User',
      size: 'lg',
      content: `
        <form id="addUserForm">
          <div class="form-group">
            <label class="form-label required">Username</label>
            <input type="text" class="form-control" id="username" required>
          </div>
          <div class="form-group">
            <label class="form-label required">Email</label>
            <input type="email" class="form-control" id="email" required>
          </div>
          <div class="form-group">
            <label class="form-label required">Password</label>
            <input type="password" class="form-control" id="password" required>
          </div>
          <div class="form-group">
            <label class="form-label required">Role</label>
            <select class="form-control" id="role" required>
              <option value="student">Student</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </form>
      `,
      confirmText: 'Create User',
      onConfirm: async () => {
        const data = {
          username: document.getElementById('username').value,
          email: document.getElementById('email').value,
          password: document.getElementById('password').value,
          role: document.getElementById('role').value
        };
        await this.createUser(data);
      }
    });
    modal.show();
  }

  async createUser(data) {
    try {
      await this.api.createUser(data);
      Toast.success('User created successfully');
      await this.render();
    } catch (error) {
      console.error('Error creating user:', error);
      Toast.error('Failed to create user');
    }
  }

  deleteUser(userId) {
    Modal.confirm(
      'Delete User',
      'Are you sure you want to delete this user? This action cannot be undone.',
      async () => {
        try {
          await this.api.deleteUser(userId);
          Toast.success('User deleted successfully');
          await this.render();
        } catch (error) {
          console.error('Error deleting user:', error);
          Toast.error('Failed to delete user');
        }
      }
    );
  }

  debounce(func, wait) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(func, wait);
  }

  getRoleBadgeColor(role) {
    const colors = { student: 'primary', staff: 'info', admin: 'error' };
    return colors[role] || 'gray';
  }

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
