import { BasePage } from './base-page.js';
import { Toast } from '../components/toast.js';

export class StaffDashboardPage extends BasePage {
  constructor(params) {
    super(params);
    this.stats = null;
    this.recentComplaints = [];
  }

  async getContent() {
    await this.loadData();

    return `
      <div class="main-content">
        <div class="dashboard-header">
          <div>
            <h1 class="dashboard-welcome">Staff Dashboard</h1>
            <p class="dashboard-subtitle">Manage and respond to assigned complaints</p>
          </div>
          <div class="quick-actions">
            <a href="/staff/complaints" class="btn btn-primary" data-link>View All Complaints</a>
          </div>
        </div>

        ${this.renderStats()}
        ${this.renderRecentComplaints()}
      </div>
    `;
  }

  renderStats() {
    if (!this.stats) return this.showLoading();

    return `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card-header">
            <h3 class="stat-card-title">Total Assigned</h3>
            <div class="stat-card-icon">📋</div>
          </div>
          <div class="stat-card-value">${this.stats.total || 0}</div>
          <div class="stat-card-footer">Complaints assigned to you</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <h3 class="stat-card-title">Pending</h3>
            <div class="stat-card-icon" style="background-color: var(--color-warning-light); color: var(--color-warning-dark);">⏳</div>
          </div>
          <div class="stat-card-value">${this.stats.pending || 0}</div>
          <div class="stat-card-footer">Awaiting response</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <h3 class="stat-card-title">In Progress</h3>
            <div class="stat-card-icon" style="background-color: var(--color-info-light); color: var(--color-info-dark);">🔄</div>
          </div>
          <div class="stat-card-value">${this.stats.inProgress || 0}</div>
          <div class="stat-card-footer">Currently working on</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <h3 class="stat-card-title">Resolved Today</h3>
            <div class="stat-card-icon" style="background-color: var(--color-success-light); color: var(--color-success-dark);">✓</div>
          </div>
          <div class="stat-card-value">${this.stats.resolvedToday || 0}</div>
          <div class="stat-card-footer">Completed today</div>
        </div>
      </div>
    `;
  }

  renderRecentComplaints() {
    if (!this.recentComplaints || this.recentComplaints.length === 0) {
      return `
        <div class="dashboard-section">
          <h2 class="dashboard-section-title">Recent Assigned Complaints</h2>
          <div class="empty-state">
            <div class="empty-state-icon">📋</div>
            <h3 class="empty-state-title">No complaints assigned</h3>
            <p class="empty-state-description">You don't have any complaints assigned to you at the moment.</p>
          </div>
        </div>
      `;
    }

    return `
      <div class="dashboard-section">
        <h2 class="dashboard-section-title">Recent Assigned Complaints</h2>
        <div class="recent-complaints-list">
          ${this.recentComplaints.map(complaint => `
            <a href="/staff/complaints/${complaint.id}" class="complaint-card-mini" data-link data-complaint-id="${complaint.id}">
              <div class="complaint-card-mini-content">
                <h3 class="complaint-card-mini-title">${this.escapeHtml(complaint.title)}</h3>
                <div class="complaint-card-mini-meta">
                  <span class="badge badge-${this.getStatusBadgeColor(complaint.status)}">${complaint.status}</span>
                  <span>${complaint.category_name || 'N/A'}</span>
                  <span>📅 ${this.formatDate(complaint.created_at)}</span>
                </div>
              </div>
            </a>
          `).join('')}
        </div>
      </div>
    `;
  }

  async loadData() {
    try {
      const statsResponse = await this.api.getDashboardStats();
      this.stats = statsResponse;

      const complaintsResponse = await this.api.getComplaints({ assigned: true, per_page: 5 });
      this.recentComplaints = complaintsResponse.items || complaintsResponse.data || complaintsResponse.complaints || [];
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Toast.error('Failed to load dashboard data');
      this.stats = { total: 0, pending: 0, inProgress: 0, resolvedToday: 0 };
      this.recentComplaints = [];
    }
  }

  async afterRender() {
    // Cards are now links with data-link, so router will handle them automatically
  }

  getStatusBadgeColor(status) {
    const colors = {
      'open': 'warning',
      'in_progress': 'info',
      'resolved': 'success',
      'closed': 'gray',
      'escalated': 'error'
    };
    return colors[status] || 'gray';
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
