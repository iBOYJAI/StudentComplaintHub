import { BasePage } from './base-page.js';
import { helpers } from '../utils/helpers.js';
import { Toast } from '../components/toast.js';

export class ComplaintDetailPage extends BasePage {
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async getContent() {
    try {
      const complaint = await this.api.getComplaint(this.params.id);

      return `
        <div class="main-content">
          <div class="complaint-detail-container">
            <div class="complaint-detail-header">
              <div class="d-flex justify-between align-center mb-4">
                <h1 class="page-title mb-0">${complaint.title}</h1>
                ${helpers.getStatusBadge(complaint.status)}
              </div>
              
              <p>${complaint.description}</p>
              
              <div class="complaint-detail-meta">
                <div class="complaint-detail-meta-item">
                  <span class="complaint-detail-meta-label">ID</span>
                  <span class="complaint-detail-meta-value">#${complaint.id}</span>
                </div>
                <div class="complaint-detail-meta-item">
                  <span class="complaint-detail-meta-label">Priority</span>
                  <span>${helpers.getPriorityBadge(complaint.priority)}</span>
                </div>
                <div class="complaint-detail-meta-item">
                  <span class="complaint-detail-meta-label">Category</span>
                  <span class="complaint-detail-meta-value">${complaint.category_name || '-'}</span>
                </div>
                <div class="complaint-detail-meta-item">
                  <span class="complaint-detail-meta-label">Location</span>
                  <span class="complaint-detail-meta-value">${complaint.location_name || '-'}</span>
                </div>
                <div class="complaint-detail-meta-item">
                  <span class="complaint-detail-meta-label">Views</span>
                  <span class="complaint-detail-meta-value">👁️ ${complaint.view_count || 0}</span>
                </div>
                <div class="complaint-detail-meta-item">
                  <span class="complaint-detail-meta-label">Votes</span>
                  <span class="complaint-detail-meta-value">👍 ${complaint.votes?.count || complaint.vote_count || 0}</span>
                </div>
                <div class="complaint-detail-meta-item">
                  <span class="complaint-detail-meta-label">Created</span>
                  <span class="complaint-detail-meta-value">${helpers.formatDateTime(complaint.created_at)}</span>
                </div>
              </div>
            </div>

            <div class="complaint-detail-body">
              <div class="complaint-detail-main">
                <div class="comments-section">
                  <h3 class="card-title">Comments & Updates (${(complaint.comments || []).length})</h3>
                  <div class="comments-list">
                    ${(complaint.comments || []).length > 0 ? complaint.comments.map(c => `
                      <div class="comment-item">
                        <div class="comment-header">
                          <span class="comment-author">${this.escapeHtml(c.author_name || 'Anonymous')}</span>
                          <span class="comment-time">${helpers.formatTimeAgo(c.created_at)}</span>
                        </div>
                        <div class="comment-body">${this.escapeHtml(c.content)}</div>
                        ${c.parent_id ? '<div class="comment-reply-indicator">↳ Reply</div>' : ''}
                      </div>
                    `).join('') : '<p class="text-muted">No comments yet</p>'}
                  </div>
                  
                  <form id="commentForm" class="mt-4">
                    <div class="form-group">
                      <textarea class="form-control" name="comment" placeholder="Add a comment..." required></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Add Comment</button>
                  </form>
                </div>
              </div>

              <div class="complaint-detail-sidebar">
                <div class="complaint-actions-card">
                  <h4 class="card-title">Actions</h4>
                  <button class="btn btn-primary complaint-action-btn" id="voteBtn" data-voted="${complaint.user_has_voted || false}">
                    ${complaint.user_has_voted ? '👍 Voted' : '👍 Vote'} (${complaint.votes?.count || complaint.vote_count || 0})
                  </button>
                  <button class="btn btn-warning complaint-action-btn" id="escalateBtn">
                    ⚠️ Escalate
                  </button>
                </div>
                ${complaint.votes?.voters && complaint.votes.voters.length > 0 ? `
                <div class="complaint-voters-card mt-4">
                  <h4 class="card-title">Voters (${complaint.votes.voters.length})</h4>
                  <div class="voters-list">
                    ${complaint.votes.voters.map(v => `
                      <div class="voter-item">${this.escapeHtml(v.username || 'Unknown')}</div>
                    `).join('')}
                  </div>
                </div>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      return this.getErrorContent(error.message);
    }
  }

  async afterRender() {
    document.getElementById('commentForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const comment = formData.get('comment')?.trim();
      
      if (!comment) {
        Toast.error('Comment cannot be empty');
        return;
      }
      
      try {
        await this.api.addComment(this.params.id, comment);
        Toast.success('Comment added!');
        e.target.reset(); // Clear the form
        this.render(); // Re-render to show the new comment
      } catch (error) {
        Toast.error(error.message || 'Failed to add comment');
      }
    });

    const voteBtn = document.getElementById('voteBtn');
    voteBtn?.addEventListener('click', async () => {
      try {
        const response = await this.api.voteComplaint(this.params.id);
        Toast.success(response.voted ? 'Voted!' : 'Vote removed!');
        
        // Update button text immediately
        if (voteBtn) {
          voteBtn.textContent = `${response.voted ? '👍 Voted' : '👍 Vote'} (${response.vote_count || 0})`;
          voteBtn.dataset.voted = response.voted;
        }
        
        // Re-render to update all data
        await this.render();
      } catch (error) {
        Toast.error(error.message || 'Failed to vote');
      }
    });

    document.getElementById('escalateBtn')?.addEventListener('click', async () => {
      const reason = prompt('Please provide a reason for escalation:');
      if (!reason || !reason.trim()) {
        Toast.error('Escalation reason is required');
        return;
      }
      
      try {
        await this.api.escalateComplaint(this.params.id, reason.trim());
        Toast.success('Complaint escalated!');
        this.render();
      } catch (error) {
        Toast.error(error.message);
      }
    });
  }
}
