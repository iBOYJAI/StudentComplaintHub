import { BasePage } from './base-page.js';
import { Toast } from '../components/toast.js';

export class AdminDashboardPage extends BasePage {
  constructor(params) {
    super(params);
    this.stats = null;
  }

  async getContent() {
    await this.loadData();

    return `
      <div class="main-content">
        <div class="dashboard-header">
          <div>
            <h1 class="dashboard-welcome">Admin Dashboard</h1>
            <p class="dashboard-subtitle">System Overview & Management</p>
          </div>
          <div class="quick-actions">
            <a href="/admin/users" class="btn btn-primary" data-link>Manage Users</a>
            <a href="/admin/categories" class="btn btn-secondary" data-link>Settings</a>
          </div>
        </div>

        ${this.renderStats()}
        ${this.renderCharts()}
        ${this.renderRecentActivity()}
      </div>
    `;
  }

  renderStats() {
    if (!this.stats) return this.showLoading();

    return `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card-header">
            <h3 class="stat-card-title">Total Complaints</h3>
            <div class="stat-card-icon">📋</div>
          </div>
          <div class="stat-card-value">${this.stats.totalComplaints || 0}</div>
          <div class="stat-card-footer">All time complaints</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <h3 class="stat-card-title">Active Users</h3>
            <div class="stat-card-icon" style="background-color: var(--color-success-light); color: var(--color-success-dark);">👥</div>
          </div>
          <div class="stat-card-value">${this.stats.activeUsers || 0}</div>
          <div class="stat-card-footer">Registered users</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <h3 class="stat-card-title">Resolution Rate</h3>
            <div class="stat-card-icon" style="background-color: var(--color-info-light); color: var(--color-info-dark);">✓</div>
          </div>
          <div class="stat-card-value">${this.stats.resolutionRate || 0}%</div>
          <div class="stat-card-footer">Last 30 days</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">
            <h3 class="stat-card-title">Avg Response Time</h3>
            <div class="stat-card-icon" style="background-color: var(--color-warning-light); color: var(--color-warning-dark);">⏱️</div>
          </div>
          <div class="stat-card-value">${this.stats.avgResponseTime || 'N/A'}</div>
          <div class="stat-card-footer">Hours</div>
        </div>
      </div>
    `;
  }

  renderCharts() {
    return `
      <div class="charts-grid">
        <div class="chart-card">
          <h3 class="card-title">Complaints by Status</h3>
          <div class="chart-placeholder">
            📊 Chart visualization will appear here
          </div>
        </div>

        <div class="chart-card">
          <h3 class="card-title">Complaints by Category</h3>
          <div class="chart-placeholder">
            📊 Chart visualization will appear here
          </div>
        </div>

        <div class="chart-card">
          <h3 class="card-title">Monthly Trends</h3>
          <div class="chart-placeholder">
            📈 Chart visualization will appear here
          </div>
        </div>

        <div class="chart-card">
          <h3 class="card-title">Response Time Trends</h3>
          <div class="chart-placeholder">
            📉 Chart visualization will appear here
          </div>
        </div>
      </div>
    `;
  }

  renderRecentActivity() {
    return `
      <div class="dashboard-section">
        <h2 class="dashboard-section-title">Recent System Activity</h2>
        <div class="card">
          <div class="card-body">
            <div class="timeline">
              <div class="timeline-item">
                <div class="timeline-content">
                  <div class="timeline-time">2 minutes ago</div>
                  <p class="mb-0">New complaint submitted by Student #123</p>
                </div>
              </div>
              <div class="timeline-item">
                <div class="timeline-content">
                  <div class="timeline-time">15 minutes ago</div>
                  <p class="mb-0">Complaint #456 marked as resolved</p>
                </div>
              </div>
              <div class="timeline-item">
                <div class="timeline-content">
                  <div class="timeline-time">1 hour ago</div>
                  <p class="mb-0">New user registered: John Doe</p>
                </div>
              </div>
              <div class="timeline-item">
                <div class="timeline-content">
                  <div class="timeline-time">2 hours ago</div>
                  <p class="mb-0">System backup completed successfully</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async loadData() {
    try {
      const response = await this.api.getDashboardStats();
      this.stats = response.data || response;
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      Toast.error('Failed to load dashboard data');
      this.stats = {
        totalComplaints: 0,
        activeUsers: 0,
        resolutionRate: 0,
        avgResponseTime: 'N/A'
      };
    }
  }
}
