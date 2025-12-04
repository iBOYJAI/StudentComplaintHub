import { BasePage } from './base-page.js';
import { helpers } from '../utils/helpers.js';

export class StudentDashboardPage extends BasePage {
  async getContent() {
    try {
      const stats = await this.api.getDashboardStats();
      const complaintsResponse = await this.api.getComplaints({ per_page: 5 });
      
      // API returns { items: [], total: ..., page: ..., per_page: ..., total_pages: ... }
      // Extract the items array from the response
      const recentComplaints = Array.isArray(complaintsResponse) 
        ? complaintsResponse 
        : (complaintsResponse.items || complaintsResponse.data || []);

      const user = this.store.getUser();
      const userName = user?.full_name || user?.name || user?.username || 'Student';

      return `
        <div class="main-content">
          <div class="dashboard-header">
            <div>
              <h1 class="dashboard-welcome">Welcome back, ${this.escapeHtml(userName)}!</h1>
              <p class="dashboard-subtitle">Here's your complaint overview</p>
            </div>
            <div class="quick-actions">
              <a href="/student/new-complaint" class="btn btn-primary" data-link>
                ➕ New Complaint
              </a>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-card-header">
                <h3 class="stat-card-title">Total Complaints</h3>
                <div class="stat-card-icon">📋</div>
              </div>
              <div class="stat-card-value">${stats.total || 0}</div>
            </div>

            <div class="stat-card">
              <div class="stat-card-header">
                <h3 class="stat-card-title">Open</h3>
                <div class="stat-card-icon">📂</div>
              </div>
              <div class="stat-card-value">${stats.open || 0}</div>
            </div>

            <div class="stat-card">
              <div class="stat-card-header">
                <h3 class="stat-card-title">In Progress</h3>
                <div class="stat-card-icon">⏳</div>
              </div>
              <div class="stat-card-value">${stats.in_progress || 0}</div>
            </div>

            <div class="stat-card">
              <div class="stat-card-header">
                <h3 class="stat-card-title">Resolved</h3>
                <div class="stat-card-icon">✅</div>
              </div>
              <div class="stat-card-value">${stats.resolved || 0}</div>
            </div>
          </div>

          <div class="dashboard-section">
            <h2 class="dashboard-section-title">Recent Complaints</h2>
            <div class="recent-complaints-list">
              ${recentComplaints.length > 0 ? recentComplaints.map(c => `
                <a href="/student/complaints/${c.id}" class="complaint-card-mini" data-link>
                  <div class="complaint-card-mini-content">
                    <div class="complaint-card-mini-title">${this.escapeHtml(c.title || 'Untitled')}</div>
                    <div class="complaint-card-mini-meta">
                      <span>${helpers.getStatusBadge(c.status || 'New')}</span>
                      <span>${helpers.formatTimeAgo(c.created_at)}</span>
                    </div>
                  </div>
                </a>
              `).join('') : '<p class="text-muted">No complaints yet. Create your first one!</p>'}
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error loading dashboard:', error);
      return this.getErrorContent(error.message);
    }
  }
}
