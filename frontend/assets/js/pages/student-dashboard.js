import { BasePage } from './base-page.js';
import { helpers } from '../utils/helpers.js';

export class StudentDashboardPage extends BasePage {
  async getContent() {
    try {
      const stats = await this.api.getDashboardStats();
      const recentComplaints = await this.api.getComplaints({ limit: 5 });

      return `
        <div class="main-content">
          <div class="dashboard-header">
            <div>
              <h1 class="dashboard-welcome">Welcome back, ${this.store.getUser()?.name || 'Student'}!</h1>
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
                    <div class="complaint-card-mini-title">${c.title}</div>
                    <div class="complaint-card-mini-meta">
                      <span>${helpers.getStatusBadge(c.status)}</span>
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
      return this.getErrorContent(error.message);
    }
  }
}
