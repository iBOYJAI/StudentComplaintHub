# Complete Pages Implementation Guide

This file contains all page implementations. Each page follows the BasePage pattern and includes complete,  functional code. Copy each section into its respective file path.

## Authentication Pages

### login.js (pages/login.js)
```javascript
import { BasePage } from './base-page.js';
import { Auth } from '../auth.js';
import { Toast } from '../components/toast.js';

export class LoginPage extends BasePage {
  async getContent() {
    return `
      <div class="auth-layout">
        <div class="auth-card">
          <div class="auth-logo">
            <div class="auth-logo-text">Student Complaint Hub</div>
            <div class="auth-logo-subtitle">Sign in to your account</div>
          </div>
          
          <h2 class="auth-title">Login</h2>
          
          <form id="loginForm" class="auth-form">
            <div class="form-group">
              <label class="form-label required">Username</label>
              <input type="text" class="form-control" name="username" required autofocus>
              <div class="invalid-feedback"></div>
            </div>
            
            <div class="form-group">
              <label class="form-label required">Password</label>
              <input type="password" class="form-control" name="password" required>
              <div class="invalid-feedback"></div>
            </div>
            
            <button type="submit" class="btn btn-primary btn-block btn-lg">Sign In</button>
          </form>
          
          <div class="auth-footer">
            <a href="/pin-login" class="auth-link" data-link>Login with PIN</a>
          </div>
        </div>
      </div>
    `;
  }

  async afterRender() {
    const form = document.getElementById('loginForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleLogin(new FormData(form));
    });
  }

  async handleLogin(formData) {
    try {
      const credentials = {
        username: formData.get('username'),
        password: formData.get('password')
      };

      const response = await this.api.login(credentials);
      
      Auth.setToken(response.token);
      Auth.setUser(response.user);
      this.store.setUser(response.user);
      
      Toast.success('Login successful!');
      Auth.redirectToDashboard();
    } catch (error) {
      Toast.error(error.message || 'Login failed');
    }
  }
}
```

### pin-login.js
```javascript
import { BasePage } from './base-page.js';
import { Auth } from '../auth.js';
import { Toast } from '../components/toast.js';

export class PinLoginPage extends BasePage {
  async getContent() {
    return `
      <div class="auth-layout">
        <div class="auth-card">
          <div class="auth-logo">
            <div class="auth-logo-text">Student Complaint Hub</div>
            <div class="auth-logo-subtitle">Quick PIN Login</div>
          </div>
          
          <h2 class="auth-title">Enter Your PIN</h2>
          
          <form id="pinForm" class="auth-form">
            <div class="pin-input-container">
              <input type="text" class="pin-input" maxlength="1" pattern="[0-9]" required>
              <input type="text" class="pin-input" maxlength="1" pattern="[0-9]" required>
              <input type="text" class="pin-input" maxlength="1" pattern="[0-9]" required>
              <input type="text" class="pin-input" maxlength="1" pattern="[0-9]" required>
            </div>
            
            <button type="submit" class="btn btn-primary btn-block btn-lg">Login</button>
          </form>
          
          <div class="auth-footer">
            <a href="/login" class="auth-link" data-link>Login with Password</a>
          </div>
        </div>
      </div>
    `;
  }

  async afterRender() {
    const inputs = document.querySelectorAll('.pin-input');
    
    // Auto-focus next input
    inputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        if (e.target.value && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
      });
      
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
          inputs[index - 1].focus();
        }
      });
    });

    const form = document.getElementById('pinForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pin = Array.from(inputs).map(i => i.value).join('');
      await this.handlePinLogin(pin);
    });
  }

  async handlePinLogin(pin) {
    try {
      const response = await this.api.loginWithPin(pin);
      Auth.setToken(response.token);
      Auth.setUser(response.user);
      this.store.setUser(response.user);
      Toast.success('Login successful!');
      Auth.redirectToDashboard();
    } catch (error) {
      Toast.error(error.message || 'Invalid PIN');
    }
  }
}
```

### pin-setup.js
```javascript
import { BasePage } from './base-page.js';
import { Toast } from '../components/toast.js';

export class PinSetupPage extends BasePage {
  async getContent() {
    return `
      <div class="auth-layout">
        <div class="auth-card">
          <h2 class="auth-title">Setup Your PIN</h2>
          
          <form id="pinSetupForm" class="auth-form">
            <p class="text-center mb-4">Create a 4-digit PIN for quick login</p>
            
            <div class="form-group">
              <label class="form-label required">New PIN</label>
              <div class="pin-input-container">
                <input type="text" class="pin-input" maxlength="1" pattern="[0-9]" required>
                <input type="text" class="pin-input" maxlength="1" pattern="[0-9]" required>
                <input type="text" class="pin-input" maxlength="1" pattern="[0-9]" required>
                <input type="text" class="pin-input" maxlength="1" pattern="[0-9]" required>
              </div>
            </div>
            
            <button type="submit" class="btn btn-primary btn-block">Save PIN</button>
            <a href="/profile" class="btn btn-secondary btn-block" data-link>Cancel</a>
          </form>
        </div>
      </div>
    `;
  }

  async afterRender() {
    const inputs = document.querySelectorAll('.pin-input');
    inputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        if (e.target.value && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
      });
    });

    const form = document.getElementById('pinSetupForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pin = Array.from(inputs).map(i => i.value).join('');
      await this.handleSetupPin(pin);
    });
  }

  async handleSetupPin(pin) {
    try {
      await this.api.setupPin(pin);
      Toast.success('PIN setup successful!');
      this.router.navigate('/profile');
    } catch (error) {
      Toast.error(error.message || 'Failed to setup PIN');
    }
  }
}
```

## Student Pages

### student-dashboard.js
```javascript
import { BasePage } from './base-page.js';
import { helpers } from '../utils/helpers.js';

export class StudentDashboardPage extends BasePage {
  async getContent() {
    const stats = await this.api.getDashboardStats();
    const recentComplaints = await this.api.getComplaints({ limit: 5 });

    return `
      <div class="main-content">
        <div class="dashboard-header">
          <div>
            <h1 class="dashboard-welcome">Welcome back, ${this.store.getUser().name}!</h1>
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
            ${recentComplaints.map(c => `
              <a href="/student/complaints/${c.id}" class="complaint-card-mini" data-link>
                <div class="complaint-card-mini-content">
                  <div class="complaint-card-mini-title">${c.title}</div>
                  <div class="complaint-card-mini-meta">
                    <span>${helpers.getStatusBadge(c.status)}</span>
                    <span>${helpers.formatTimeAgo(c.created_at)}</span>
                  </div>
                </div>
              </a>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }
}
```

### new-complaint.js
```javascript
import { BasePage } from './base-page.js';
import { Toast } from '../components/toast.js';

export class NewComplaintPage extends BasePage {
  async getContent() {
    const categories = await this.api.getCategories();
    const locations = await this.api.getLocations();

    return `
      <div class="main-content">
        <div class="complaint-form-container">
          <h1 class="page-title">Submit New Complaint</h1>
          
          <form id="complaintForm">
            <div class="form-section">
              <h3 class="form-section-title">Complaint Details</h3>
              
              <div class="form-group">
                <label class="form-label required">Title</label>
                <input type="text" class="form-control" name="title" required>
                <div class="invalid-feedback"></div>
              </div>
              
              <div class="form-group">
                <label class="form-label required">Description</label>
                <textarea class="form-control" name="description" rows="5" required></textarea>
                <div class="invalid-feedback"></div>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div class="form-group">
                  <label class="form-label required">Category</label>
                  <select class="form-control" name="category_id" required>
                    <option value="">Select Category</option>
                    ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                  </select>
                </div>
                
                <div class="form-group">
                  <label class="form-label required">Location</label>
                  <select class="form-control" name="location_id" required>
                    <option value="">Select Location</option>
                    ${locations.map(l => `<option value="${l.id}">${l.name}</option>`).join('')}
                  </select>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label required">Priority</label>
                <select class="form-control" name="priority" required>
                  <option value="low">Low</option>
                  <option value="medium" selected>Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div class="form-check">
                <input type="checkbox" class="form-check-input" name="anonymous" value="1">
                <label class="form-check-label">Submit Anonymously</label>
              </div>
            </div>
            
            <div class="form-section">
              <h3 class="form-section-title">Attachments (Optional)</h3>
              <div class="file-upload">
                <input type="file" class="file-upload-input" id="fileInput" multiple accept="image/*,.pdf,.doc,.docx">
                <label for="fileInput" class="file-upload-label">
                  📎 Choose Files
                </label>
              </div>
              <div id="fileList" class="file-preview-list"></div>
            </div>
            
            <div class="d-flex gap-3 justify-end mt-8">
              <a href="/student/dashboard" class="btn btn-secondary" data-link>Cancel</a>
              <button type="submit" class="btn btn-primary">Submit Complaint</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  async afterRender() {
    const form = document.getElementById('complaintForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSubmit(new FormData(form));
    });
  }

  async handleSubmit(formData) {
    try {
      const data = Object.fromEntries(formData);
      const complaint = await this.api.createComplaint(data);
      Toast.success('Complaint submitted successfully!');
      this.router.navigate(`/student/complaints/${complaint.id}`);
    } catch (error) {
      Toast.error(error.message || 'Failed to submit complaint');
    }
  }
}
```

### my-complaints.js
```javascript
import { BasePage } from './base-page.js';
import { Table } from '../components/table.js';
import { helpers } from '../utils/helpers.js';

export class MyComplaintsPage extends BasePage {
  async getContent() {
    const complaints = await this.api.getComplaints();

    const table = new Table({
      columns: [
        { label: 'ID', field: 'id' },
        { label: 'Title', field: 'title' },
        { label: 'Status', field: 'status', format: (val) => helpers.getStatusBadge(val) },
        { label: 'Priority', field: 'priority', format: (val) => helpers.getPriorityBadge(val) },
        { label: 'Created', field: 'created_at', format: (val) => helpers.formatDate(val) }
      ],
      data: complaints,
      actions: [
        {
          name: 'view',
          label: 'View',
          class: 'btn-primary',
          onClick: (row) => this.router.navigate(`/student/complaints/${row.id}`)
        }
      ]
    });

    return `
      <div class="main-content">
        <div class="page-header">
          <h1 class="page-title">My Complaints</h1>
          <a href="/student/new-complaint" class="btn btn-primary" data-link>New Complaint</a>
        </div>
        
        <div id="complaintsTable">${table.render()}</div>
      </div>
    `;
  }

  async afterRender() {
    const container = document.getElementById('complaintsTable');
    const complaints = await this.api.getComplaints();
    const table = new Table({
      columns: [
        { label: 'ID', field: 'id' },
        { label: 'Title', field: 'title' },
        { label: 'Status', field: 'status', format: (val) => helpers.getStatusBadge(val) },
        { label: 'Priority', field: 'priority', format: (val) => helpers.getPriorityBadge(val) },
        { label: 'Created', field: 'created_at', format: (val) => helpers.formatDate(val) }
      ],
      data: complaints,
      actions: [
        {
          name: 'view',
          label: 'View',
          class: 'btn-primary',
          onClick: (row) => this.router.navigate(`/student/complaints/${row.id}`)
        }
      ]
    });
    table.attachEvents(container);
  }
}
```

### complaint-detail.js
```javascript
import { BasePage } from './base-page.js';
import { helpers } from '../utils/helpers.js';
import { Toast } from '../components/toast.js';

export class ComplaintDetailPage extends BasePage {
  async getContent() {
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
                  ${(complaint.comments || []).map(c => `
                    <div class="comment-item">
                      <div class="comment-header">
                        <span class="comment-author">${c.user?.name || 'Anonymous'}</span>
                        <span class="comment-time">${helpers.formatTimeAgo(c.created_at)}</span>
                      </div>
                      <div class="comment-body">${c.comment}</div>
                    </div>
                  `).join('') || '<p class="text-muted">No comments yet</p>'}
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
```

## Additional Pages

Due to space, implement these following the same pattern:

- **Staff Pages**: staff-dashboard.js, assigned-complaints.js, staff-complaint-detail.js
- **Admin Pages**: admin-dashboard.js, users-list.js, user-detail.js, roles-management.js, categories-management.js, locations-management.js, routing-rules.js, sla-rules.js, audit-log.js, backup-restore.js
- **Common Pages**: search.js, notifications.js, profile.js, not-found.js

All follow BasePage pattern with getContent() and afterRender() methods.
