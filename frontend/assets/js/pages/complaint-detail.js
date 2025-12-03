import { BasePage } from './base-page.js';
import { helpers } from '../utils/helpers.js';
import { Toast } from '../components/toast.js';

export class ComplaintDetailPage extends BasePage {
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
                  <span class="complaint-detail-meta-value">${complaint.category?.name || '-'}</span>
                </div>
                <div class="complaint-detail-meta-item">
                  <span class="complaint-detail-meta-label">Location</span>
                  <span class="complaint-detail-meta-value">${complaint.location?.name || '-'}</span>
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
                  <h3 class="card-title">Comments & Updates</h3>
                  <div class="comments-list">
                    ${(complaint.comments || []).length > 0 ? complaint.comments.map(c => `
                      <div class="comment-item">
                        <div class="comment-header">
                          <span class="comment-author">${c.user?.name || 'Anonymous'}</span>
                          <span class="comment-time">${helpers.formatTimeAgo(c.created_at)}</span>
                        </div>
                        <div class="comment-body">${c.comment}</div>
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
                  <button class="btn btn-primary complaint-action-btn" id="voteBtn">
                    👍 Vote (${complaint.votes || 0})
                  </button>
                  <button class="btn btn-warning complaint-action-btn" id="escalateBtn">
                    ⚠️ Escalate
                  </button>
                </div>
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
      const comment = new FormData(e.target).get('comment');
      try {
        await this.api.addComment(this.params.id, comment);
        Toast.success('Comment added!');
        this.render();
      } catch (error) {
        Toast.error(error.message);
      }
    });

    document.getElementById('voteBtn')?.addEventListener('click', async () => {
      try {
        await this.api.voteComplaint(this.params.id);
        Toast.success('Voted!');
        this.render();
      } catch (error) {
        Toast.error(error.message);
      }
    });

    document.getElementById('escalateBtn')?.addEventListener('click', async () => {
      try {
        await this.api.escalateComplaint(this.params.id);
        Toast.success('Complaint escalated!');
        this.render();
      } catch (error) {
        Toast.error(error.message);
      }
    });
  }
}
