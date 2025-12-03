import { BasePage } from './base-page.js';
import { Toast } from '../components/toast.js';

export class AuditLogPage extends BasePage {
  constructor(params) {
    super(params);
    this.logs = [];
    this.filters = {
      action: '',
      user: '',
      dateFrom: '',
      dateTo: ''
    };
  }

  async getContent() {
    await this.loadData();

    return `
      <div class="main-content">
        <div class="page-header">
          <h1 class="page-title">Audit Log</h1>
          <p class="page-description">View system activity and changes</p>
        </div>

        ${this.renderFilters()}
        ${this.renderLogsTable()}
      </div>
    `;
  }

  renderFilters() {
    return `
      <div class="filters-bar">
        <div class="filters-grid">
          <div class="search-box">
            <span class="search-box-icon">🔍</span>
            <input type="text" class="form-control" placeholder="Search user..." id="userSearch" value="${this.filters.user}">
          </div>
          <select class="form-control" id="actionFilter">
            <option value="">All Actions</option>
            <option value="create" ${this.filters.action === 'create' ? 'selected' : ''}>Create</option>
            <option value="update" ${this.filters.action === 'update' ? 'selected' : ''}>Update</option>
            <option value="delete" ${this.filters.action === 'delete' ? 'selected' : ''}>Delete</option>
            <option value="login" ${this.filters.action === 'login' ? 'selected' : ''}>Login</option>
            <option value="logout" ${this.filters.action === 'logout' ? 'selected' : ''}>Logout</option>
          </select>
          <input type="date" class="form-control" id="dateFrom" value="${this.filters.dateFrom}">
          <input type="date" class="form-control" id="dateTo" value="${this.filters.dateTo}">
        </div>
      </div>
    `;
  }

  renderLogsTable() {
    if (this.logs.length === 0) {
      return `
        <div class="card">
          <div class="card-body">
            <div class="empty-state">
              <div class="empty-state-icon">📝</div>
              <h3 class="empty-state-title">No logs found</h3>
              <p class="empty-state-description">No activity logs match your filters.</p>
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
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Details</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            ${this.logs.map(log => `
              <tr>
                <td>${this.formatDateTime(log.timestamp)}</td>
                <td>${this.escapeHtml(log.username || log.user || 'System')}</td>
                <td><span class="badge badge-${this.getActionColor(log.action)}">${log.action}</span></td>
                <td>${this.escapeHtml(log.resource || 'N/A')}</td>
                <td>${this.escapeHtml(log.details || 'N/A')}</td>
                <td>${this.escapeHtml(log.ipAddress || 'N/A')}</td>
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
      if (this.filters.action) params.action = this.filters.action;
      if (this.filters.user) params.user = this.filters.user;
      if (this.filters.dateFrom) params.dateFrom = this.filters.dateFrom;
      if (this.filters.dateTo) params.dateTo = this.filters.dateTo;

      const response = await this.api.getAuditLog(params);
      this.logs = response.data || response.logs || [];
    } catch (error) {
      console.error('Error loading audit logs:', error);
      Toast.error('Failed to load audit logs');
      this.logs = [];
    }
  }

  async afterRender() {
    document.getElementById('actionFilter')?.addEventListener('change', (e) => {
      this.filters.action = e.target.value;
      this.render();
    });

    document.getElementById('userSearch')?.addEventListener('input', (e) => {
      this.filters.user = e.target.value;
      this.debounce(() => this.render(), 500);
    });

    document.getElementById('dateFrom')?.addEventListener('change', (e) => {
      this.filters.dateFrom = e.target.value;
      this.render();
    });

    document.getElementById('dateTo')?.addEventListener('change', (e) => {
      this.filters.dateTo = e.target.value;
      this.render();
    });
  }

  debounce(func, wait) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(func, wait);
  }

  getActionColor(action) {
    const colors = {
      create: 'success',
      update: 'info',
      delete: 'error',
      login: 'primary',
      logout: 'gray'
    };
    return colors[action] || 'gray';
  }

  formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
