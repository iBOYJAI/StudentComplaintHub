import { BasePage } from './base-page.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';

export class StaffComplaintDetailPage extends BasePage {
  constructor(params) {
    super(params);
    this.complaintId = params.id;
    this.complaint = null;
    this.comments = [];
  }

  async getContent() {
    await this.loadData();

    if (!this.complaint) {
      return `
        <div class="main-content">
          <div class="alert alert-error">Complaint not found</div>
        </div>
      `;
    }

    return `
      <div class="main-content">
        <div class="complaint-detail-container">
          ${this.renderHeader()}
          ${this.renderBody()}
        </div>
      </div>
    `;
  }

  renderHeader() {
    return `
      <div class="complaint-detail-header">
        <div class="d-flex justify-between align-center mb-4">
          <h1 class="page-title mb-0">${this.escapeHtml(this.complaint.title)}</h1>
          <span class="badge badge-${this.getStatusBadgeColor(this.complaint.status)}">${this.complaint.status}</span>
        </div>
        <p class="text-secondary">${this.escapeHtml(this.complaint.description || '')}</p>
        
        <div class="complaint-detail-meta">
          <div class="complaint-detail-meta-item">
            <span class="complaint-detail-meta-label">ID</span>
            <span class="complaint-detail-meta-value">#${this.complaint.id}</span>
          </div>
          <div class="complaint-detail-meta-item">
            <span class="complaint-detail-meta-label">Category</span>
            <span class="complaint-detail-meta-value">${this.complaint.category_name || 'N/A'}</span>
          </div>
          <div class="complaint-detail-meta-item">
            <span class="complaint-detail-meta-label">Priority</span>
            <span class="complaint-detail-meta-value">
              <span class="badge badge-${this.getPriorityBadgeColor(this.complaint.priority)}">${this.complaint.priority || 'N/A'}</span>
            </span>
          </div>
          <div class="complaint-detail-meta-item">
            <span class="complaint-detail-meta-label">Location</span>
            <span class="complaint-detail-meta-value">${this.complaint.location_name || 'N/A'}</span>
          </div>
          <div class="complaint-detail-meta-item">
            <span class="complaint-detail-meta-label">Submitted By</span>
            <span class="complaint-detail-meta-value">${this.complaint.creator?.full_name || this.complaint.creator?.username || (this.complaint.is_anonymous ? 'Anonymous' : 'N/A')}</span>
          </div>
          <div class="complaint-detail-meta-item">
            <span class="complaint-detail-meta-label">Created</span>
            <span class="complaint-detail-meta-value">${this.formatDate(this.complaint.created_at)}</span>
          </div>
        </div>
      </div>
    `;
  }

  renderBody() {
    return `
      <div class="complaint-detail-body">
        <div class="complaint-detail-main">
          ${this.renderComments()}
        </div>
        <div class="complaint-detail-sidebar">
          ${this.renderActions()}
        </div>
      </div>
    `;
  }

  renderActions() {
    return `
      <div class="complaint-actions-card">
        <h3 class="card-title">Actions</h3>
        
        ${this.complaint.status && this.complaint.status.toLowerCase() !== 'resolved' && this.complaint.status.toLowerCase() !== 'closed' ? `
          <button class="btn btn-primary complaint-action-btn" id="updateStatusBtn">
            Update Status
          </button>
          <button class="btn btn-success complaint-action-btn" id="resolveBtn">
            Mark as Resolved
          </button>
        ` : ''}
        
        ${this.complaint.status && this.complaint.status.toLowerCase() !== 'escalated' ? `
          <button class="btn btn-warning complaint-action-btn" id="escalateBtn">
            Escalate Complaint
          </button>
        ` : ''}
        
        <a href="/staff/complaints" class="btn btn-secondary complaint-action-btn" data-link>
          Back to List
        </a>
      </div>
    `;
  }

  renderComments() {
    return `
      <div class="comments-section">
        <h3 class="card-title">Comments & Updates</h3>
        
        ${this.comments.length > 0 ? `
          <div class="comments-list">
            ${this.comments.map(comment => `
              <div class="comment-item">
                <div class="comment-header">
                  <span class="comment-author">${this.escapeHtml(comment.author_name || 'Unknown')}</span>
                  <span class="comment-time">${this.formatDate(comment.created_at)}</span>
                </div>
                <div class="comment-body">${this.escapeHtml(comment.content || '')}</div>
              </div>
            `).join('')}
          </div>
        ` : '<p class="text-secondary">No comments yet</p>'}
        
        <div class="mt-6">
          <h4 class="text-lg font-semibold mb-3">Add Comment</h4>
          <textarea class="form-control" id="commentText" rows="4" placeholder="Type your comment..."></textarea>
          <button class="btn btn-primary mt-3" id="addCommentBtn">Add Comment</button>
        </div>
      </div>
    `;
  }

  async loadData() {
    try {
      const response = await this.api.getComplaint(this.complaintId);
      // Backend returns the complaint directly, not wrapped in data/complaint
      this.complaint = response;
      this.comments = this.complaint.comments || [];
      
      // Debug: log the complaint data to see what we're getting
      console.log('Complaint data:', this.complaint);
      console.log('Comments:', this.comments);
    } catch (error) {
      console.error('Error loading complaint:', error);
      Toast.error('Failed to load complaint details');
    }
  }

  async afterRender() {
    // Update Status button
    const updateStatusBtn = document.getElementById('updateStatusBtn');
    updateStatusBtn?.addEventListener('click', () => this.showUpdateStatusModal());

    // Resolve button
    const resolveBtn = document.getElementById('resolveBtn');
    resolveBtn?.addEventListener('click', () => this.resolveComplaint());

    // Escalate button
    const escalateBtn = document.getElementById('escalateBtn');
    escalateBtn?.addEventListener('click', () => this.escalateComplaint());

    // Add comment button
    const addCommentBtn = document.getElementById('addCommentBtn');
    addCommentBtn?.addEventListener('click', () => this.addComment());
  }

  showUpdateStatusModal() {
    const modal = new Modal({
      title: 'Update Status',
      content: `
        <div class="form-group">
          <label class="form-label">Select Status</label>
          <select class="form-control" id="newStatus">
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      `,
      confirmText: 'Update',
      onConfirm: async () => {
        const newStatus = document.getElementById('newStatus').value;
        await this.updateStatus(newStatus);
      }
    });
    modal.show();
  }

  async updateStatus(status) {
    try {
      await this.api.updateComplaint(this.complaintId, { status });
      Toast.success('Status updated successfully');
      await this.render();
    } catch (error) {
      console.error('Error updating status:', error);
      Toast.error(error.message || 'Failed to update status');
    }
  }

  async resolveComplaint() {
    Modal.confirm(
      'Resolve Complaint',
      'Are you sure you want to mark this complaint as resolved?',
      async () => {
        try {
          await this.api.updateComplaint(this.complaintId, { status: 'Resolved' });
          Toast.success('Complaint marked as resolved');
          await this.render();
        } catch (error) {
          console.error('Error resolving complaint:', error);
          Toast.error(error.message || 'Failed to resolve complaint');
        }
      }
    );
  }

  async escalateComplaint() {
    const reason = prompt('Please provide a reason for escalation:');
    if (!reason || !reason.trim()) {
      Toast.error('Escalation reason is required');
      return;
    }
    
    Modal.confirm(
      'Escalate Complaint',
      `Are you sure you want to escalate this complaint?\n\nReason: ${reason}`,
      async () => {
        try {
          await this.api.escalateComplaint(this.complaintId, reason.trim());
          Toast.success('Complaint escalated successfully');
          await this.render();
        } catch (error) {
          console.error('Error escalating complaint:', error);
          Toast.error(error.message || 'Failed to escalate complaint');
        }
      }
    );
  }

  async addComment() {
    const commentText = document.getElementById('commentText');
    if (!commentText || !commentText.value.trim()) {
      Toast.warning('Please enter a comment');
      return;
    }

    try {
      await this.api.addComment(this.complaintId, commentText.value.trim());
      Toast.success('Comment added successfully');
      commentText.value = '';
      await this.render();
    } catch (error) {
      console.error('Error adding comment:', error);
      Toast.error(error.message || 'Failed to add comment');
    }
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

  getPriorityBadgeColor(priority) {
    const colors = {
      'low': 'info',
      'medium': 'warning',
      'high': 'error'
    };
    return colors[priority] || 'gray';
  }

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
