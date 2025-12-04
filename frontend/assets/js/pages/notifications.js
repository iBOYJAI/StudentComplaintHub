import { BasePage } from './base-page.js';
import { Toast } from '../components/toast.js';

export class NotificationsPage extends BasePage {
  constructor(params) {
    super(params);
    this.notifications = [];
  }

  async getContent() {
    await this.loadData();

    return `
      <div class="main-content">
        <div class="page-header">
          <h1 class="page-title">Notifications</h1>
          <p class="page-description">Stay updated with your activities</p>
        </div>

        <div class="management-toolbar">
          <button class="btn btn-secondary" id="markAllReadBtn">Mark All as Read</button>
        </div>

        ${this.renderNotifications()}
      </div>
    `;
  }

  renderNotifications() {
    if (this.notifications.length === 0) {
      return `
        <div class="card">
          <div class="card-body">
            <div class="empty-state">
              <div class="empty-state-icon">🔔</div>
              <h3 class="empty-state-title">No notifications</h3>
              <p class="empty-state-description">You're all caught up!</p>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="timeline">
        ${this.notifications.map(notif => `
          <div class="timeline-item ${notif.is_read ? '' : 'unread'}" data-notif-id="${notif.id}">
            <div class="timeline-content" style="${notif.is_read ? '' : 'background-color: var(--color-primary-lightest);'}">
              <div class="timeline-time">${this.formatDateTime(notif.created_at)}</div>
              <h4 class="mb-2 font-semibold">${this.getNotificationIcon(notif.type)} ${this.escapeHtml(notif.title)}</h4>
              <p class="mb-2">${this.escapeHtml(notif.message)}</p>
              ${notif.related_id && notif.related_type === 'complaint' ? `<a href="/student/complaints/${notif.related_id}" class="btn btn-sm btn-primary" data-link>View Complaint</a>` : ''}
              ${!notif.is_read ? `<button class="btn btn-sm btn-ghost mt-2" data-action="mark-read" data-id="${notif.id}">Mark as Read</button>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  async loadData() {
    try {
      const response = await this.api.getNotifications();
      this.notifications = response.notifications || response.data || [];
    } catch (error) {
      console.error('Error loading notifications:', error);
      Toast.error('Failed to load notifications');
      this.notifications = [];
    }
  }

  async afterRender() {
    document.getElementById('markAllReadBtn')?.addEventListener('click', () => this.markAllAsRead());

    document.querySelectorAll('[data-action="mark-read"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        await this.markAsRead(id);
      });
    });
  }

  async markAsRead(id) {
    try {
      await this.api.markNotificationRead(id);
      Toast.success('Notification marked as read');
      await this.render();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      Toast.error('Failed to mark as read');
    }
  }

  async markAllAsRead() {
    try {
      // Mark all unread notifications
      const unreadIds = this.notifications.filter(n => !n.is_read).map(n => n.id);
      await Promise.all(unreadIds.map(id => this.api.markNotificationRead(id)));
      Toast.success('All notifications marked as read');
      await this.render();
    } catch (error) {
      console.error('Error marking all as read:', error);
      Toast.error('Failed to mark all as read');
    }
  }

  getNotificationIcon(type) {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      comment: '💬',
      status: '🔄',
      assignment: '📋'
    };
    return icons[type] || 'ℹ️';
  }

  formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // Less than a minute
    if (diff < 60000) return 'Just now';
    
    // Less than an hour
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `${mins} minute${mins > 1 ? 's' : ''} ago`;
    }
    
    // Less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    // More than a day
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
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
