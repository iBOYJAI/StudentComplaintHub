import { BasePage } from './base-page.js';
import { Toast } from '../components/toast.js';

export class AdminDashboardPage extends BasePage {
  constructor(params) {
    super(params);
    this.stats = null;
    this.chartData = null;
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
            <a href="/admin/complaints" class="btn btn-primary" data-link>View All Complaints</a>
            <a href="/admin/users" class="btn btn-secondary" data-link>Manage Users</a>
          </div>
        </div>

        ${this.renderStats()}
        ${this.renderCharts()}
        ${this.renderRecentActivityHTML}
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
    if (!this.chartData) return '<div class="charts-grid"><div class="chart-card"><div class="chart-placeholder">Loading charts...</div></div></div>';
    
    return `
      <div class="charts-grid">
        <div class="chart-card">
          <h3 class="card-title">Complaints by Status</h3>
          <div class="chart-container" id="statusChart"></div>
        </div>

        <div class="chart-card">
          <h3 class="card-title">Complaints by Category</h3>
          <div class="chart-container" id="categoryChart"></div>
        </div>

        <div class="chart-card">
          <h3 class="card-title">Monthly Trends</h3>
          <div class="chart-container" id="monthlyChart"></div>
        </div>

        <div class="chart-card">
          <h3 class="card-title">Response Time</h3>
          <div class="chart-container" id="responseTimeChart"></div>
        </div>
      </div>
    `;
  }

  async loadRecentActivity() {
    try {
      // Get recent complaints
      const complaintsResponse = await this.api.getComplaints({ per_page: 5 });
      const recentComplaints = complaintsResponse.items || [];
      
      if (recentComplaints.length === 0) {
        this.renderRecentActivityHTML = `
          <div class="dashboard-section">
            <h2 class="dashboard-section-title">Recent System Activity</h2>
            <div class="card">
              <div class="card-body">
                <p class="text-muted">No recent activity</p>
              </div>
            </div>
          </div>
        `;
        return;
      }
      
      this.renderRecentActivityHTML = `
        <div class="dashboard-section">
          <h2 class="dashboard-section-title">Recent Complaints</h2>
          <div class="card">
            <div class="card-body">
              <div class="timeline">
                ${recentComplaints.map(complaint => `
                  <div class="timeline-item">
                    <div class="timeline-content">
                      <div class="timeline-time">${this.formatTimeAgo(complaint.created_at)}</div>
                      <p class="mb-0">
                        <a href="/admin/complaints/${complaint.id}" data-link class="text-primary">
                          Complaint #${complaint.id}: ${this.escapeHtml(complaint.title)}
                        </a>
                        <span class="badge badge-${this.getStatusBadgeColor(complaint.status)} ml-2">${complaint.status}</span>
                      </p>
                      <p class="text-secondary text-sm mt-1">
                        By: ${this.escapeHtml(complaint.creator?.full_name || complaint.creator?.username || 'Anonymous')}
                      </p>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error loading recent activity:', error);
      this.renderRecentActivityHTML = `
        <div class="dashboard-section">
          <h2 class="dashboard-section-title">Recent System Activity</h2>
          <div class="card">
            <div class="card-body">
              <p class="text-muted">Unable to load recent activity</p>
            </div>
          </div>
        </div>
      `;
    }
  }
  
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  getStatusBadgeColor(status) {
    if (!status) return 'gray';
    const statusLower = status.toLowerCase();
    const colors = {
      'new': 'primary',
      'open': 'warning',
      'in progress': 'info',
      'in_progress': 'info',
      'resolved': 'success',
      'closed': 'gray',
      'escalated': 'error'
    };
    return colors[statusLower] || 'gray';
  }

  formatTimeAgo(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `${mins} minute${mins > 1 ? 's' : ''} ago`;
    }
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    const days = Math.floor(diff / 86400000);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  async loadData() {
    try {
      const response = await this.api.getDashboardStats();
      this.stats = response;
      this.chartData = {
        by_status: response.by_status || {},
        by_category: response.by_category || {},
        monthly_trends: response.monthly_trends || [],
        avgResponseTime: response.avgResponseTime || 'N/A'
      };
      
      // Load recent activity
      await this.loadRecentActivity();
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      Toast.error('Failed to load dashboard data');
      this.stats = {
        totalComplaints: 0,
        activeUsers: 0,
        resolutionRate: 0,
        avgResponseTime: 'N/A'
      };
      this.chartData = {
        by_status: {},
        by_category: {},
        monthly_trends: [],
        avgResponseTime: 'N/A'
      };
      this.renderRecentActivityHTML = '<div class="dashboard-section"><h2 class="dashboard-section-title">Recent System Activity</h2><div class="card"><div class="card-body"><p class="text-muted">Unable to load recent activity</p></div></div></div>';
    }
  }
  
  async loadRecentActivity() {
    try {
      // Get recent complaints
      const complaintsResponse = await this.api.getComplaints({ per_page: 5 });
      const recentComplaints = complaintsResponse.items || [];
      
      if (recentComplaints.length === 0) {
        this.renderRecentActivityHTML = `
          <div class="dashboard-section">
            <h2 class="dashboard-section-title">Recent System Activity</h2>
            <div class="card">
              <div class="card-body">
                <p class="text-muted">No recent activity</p>
              </div>
            </div>
          </div>
        `;
        return;
      }
      
      this.renderRecentActivityHTML = `
        <div class="dashboard-section">
          <h2 class="dashboard-section-title">Recent Complaints</h2>
          <div class="card">
            <div class="card-body">
              <div class="timeline">
                ${recentComplaints.map(complaint => `
                  <div class="timeline-item">
                    <div class="timeline-content">
                      <div class="timeline-time">${this.formatTimeAgo(complaint.created_at)}</div>
                      <p class="mb-0">
                        <a href="/admin/complaints/${complaint.id}" data-link class="text-primary">
                          Complaint #${complaint.id}: ${this.escapeHtml(complaint.title)}
                        </a>
                        <span class="badge badge-${this.getStatusBadgeColor(complaint.status)} ml-2">${complaint.status}</span>
                      </p>
                      <p class="text-secondary text-sm mt-1">
                        By: ${this.escapeHtml(complaint.creator?.full_name || complaint.creator?.username || 'Anonymous')}
                      </p>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error loading recent activity:', error);
      this.renderRecentActivityHTML = `
        <div class="dashboard-section">
          <h2 class="dashboard-section-title">Recent System Activity</h2>
          <div class="card">
            <div class="card-body">
              <p class="text-muted">Unable to load recent activity</p>
            </div>
          </div>
        </div>
      `;
    }
  }

  async afterRender() {
    if (this.chartData) {
      this.renderStatusChart();
      this.renderCategoryChart();
      this.renderMonthlyChart();
      this.renderResponseTimeChart();
    }
  }

  renderStatusChart() {
    const container = document.getElementById('statusChart');
    if (!container) return;
    
    const data = this.chartData.by_status;
    const entries = Object.entries(data);
    if (entries.length === 0) {
      container.innerHTML = '<p class="text-muted">No data available</p>';
      return;
    }
    
    const maxValue = Math.max(...Object.values(data));
    const colors = {
      'New': '#3b82f6',
      'Open': '#f59e0b',
      'In Progress': '#06b6d4',
      'Resolved': '#10b981',
      'Closed': '#6b7280',
      'Escalated': '#ef4444'
    };
    
    container.innerHTML = `
      <div class="bar-chart">
        ${entries.map(([status, count]) => `
          <div class="bar-item">
            <div class="bar-label">${status}</div>
            <div class="bar-wrapper">
              <div class="bar" style="width: ${(count / maxValue) * 100}%; background-color: ${colors[status] || '#6b7280'};">
                <span class="bar-value">${count}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderCategoryChart() {
    const container = document.getElementById('categoryChart');
    if (!container) return;
    
    const data = this.chartData.by_category;
    const entries = Object.entries(data);
    if (entries.length === 0) {
      container.innerHTML = '<p class="text-muted">No data available</p>';
      return;
    }
    
    const maxValue = Math.max(...Object.values(data));
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    
    container.innerHTML = `
      <div class="bar-chart">
        ${entries.map(([category, count]) => {
          const percentage = ((count / total) * 100).toFixed(1);
          return `
            <div class="bar-item">
              <div class="bar-label">${category} (${percentage}%)</div>
              <div class="bar-wrapper">
                <div class="bar" style="width: ${(count / maxValue) * 100}%; background-color: #3b82f6;">
                  <span class="bar-value">${count}</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  renderMonthlyChart() {
    const container = document.getElementById('monthlyChart');
    if (!container) return;
    
    const data = this.chartData.monthly_trends;
    if (data.length === 0) {
      container.innerHTML = '<p class="text-muted">No data available</p>';
      return;
    }
    
    const maxValue = Math.max(...data.map(d => d.count));
    
    container.innerHTML = `
      <div class="bar-chart">
        ${data.map(item => `
          <div class="bar-item">
            <div class="bar-label">${item.month}</div>
            <div class="bar-wrapper">
              <div class="bar" style="width: ${(item.count / maxValue) * 100}%; background-color: #10b981;">
                <span class="bar-value">${item.count}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderResponseTimeChart() {
    const container = document.getElementById('responseTimeChart');
    if (!container) return;
    
    const avgTime = this.chartData.avgResponseTime;
    if (avgTime === 'N/A' || !avgTime) {
      container.innerHTML = '<p class="text-muted">No data available</p>';
      return;
    }
    
    container.innerHTML = `
      <div class="response-time-display">
        <div class="response-time-value">${avgTime}</div>
        <div class="response-time-label">Average Hours</div>
        <div class="response-time-description">Time from complaint creation to first response</div>
      </div>
    `;
  }
}
