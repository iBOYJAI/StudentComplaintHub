import { BasePage } from './base-page.js';
import { Toast } from '../components/toast.js';
import { Table } from '../components/table.js';
import { helpers } from '../utils/helpers.js';

export class AdminComplaintsPage extends BasePage {
  constructor(params) {
    super(params);
    this.complaints = [];
    this.filters = {
      status: '',
      priority: '',
      category: '',
      search: ''
    };
    this.categories = [];
  }

  async getContent() {
    await this.loadData();

    return `
      <div class="main-content">
        <div class="page-header">
          <h1 class="page-title">All Complaints</h1>
          <p class="page-description">Manage and monitor all system complaints</p>
        </div>

        ${this.renderFilters()}
        ${this.renderComplaintsTable()}
      </div>
    `;
  }

  renderFilters() {
    return `
      <div class="filters-bar">
        <div class="filters-grid">
          <div class="search-box">
            <span class="search-box-icon">🔍</span>
            <input 
              type="text" 
              class="form-control" 
              placeholder="Search complaints..." 
              id="searchInput"
              value="${this.filters.search}"
            >
          </div>
          
          <select class="form-control" id="statusFilter">
            <option value="">All Statuses</option>
            <option value="New" ${this.filters.status === 'New' ? 'selected' : ''}>New</option>
            <option value="Open" ${this.filters.status === 'Open' ? 'selected' : ''}>Open</option>
            <option value="In Progress" ${this.filters.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Resolved" ${this.filters.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
            <option value="Closed" ${this.filters.status === 'Closed' ? 'selected' : ''}>Closed</option>
            <option value="Escalated" ${this.filters.status === 'Escalated' ? 'selected' : ''}>Escalated</option>
          </select>

          <select class="form-control" id="priorityFilter">
            <option value="">All Priorities</option>
            <option value="Low" ${this.filters.priority === 'Low' ? 'selected' : ''}>Low</option>
            <option value="Medium" ${this.filters.priority === 'Medium' ? 'selected' : ''}>Medium</option>
            <option value="High" ${this.filters.priority === 'High' ? 'selected' : ''}>High</option>
          </select>

          <select class="form-control" id="categoryFilter">
            <option value="">All Categories</option>
            ${this.categories.map(cat => `
              <option value="${cat.id}" ${this.filters.category === cat.id ? 'selected' : ''}>${cat.name}</option>
            `).join('')}
          </select>
        </div>
      </div>
    `;
  }

  renderComplaintsTable() {
    if (this.complaints.length === 0) {
      return `
        <div class="card">
          <div class="card-body">
            <div class="empty-state">
              <div class="empty-state-icon">📋</div>
              <h3 class="empty-state-title">No complaints found</h3>
              <p class="empty-state-description">There are no complaints matching your filters.</p>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Category</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Created By</th>
              <th>Assigned To</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.complaints.map(complaint => `
              <tr>
                <td>#${complaint.id}</td>
                <td>
                  <a href="/admin/complaints/${complaint.id}" data-link class="text-primary font-medium">
                    ${this.escapeHtml(complaint.title)}
                  </a>
                </td>
                <td>${complaint.category_name || 'N/A'}</td>
                <td><span class="badge badge-${this.getStatusBadgeColor(complaint.status)}">${complaint.status}</span></td>
                <td><span class="badge badge-${this.getPriorityBadgeColor(complaint.priority)}">${complaint.priority || 'N/A'}</span></td>
                <td>${complaint.creator?.full_name || complaint.creator?.username || (complaint.is_anonymous ? 'Anonymous' : 'N/A')}</td>
                <td>${complaint.assignee?.full_name || complaint.assignee?.username || 'Unassigned'}</td>
                <td>${this.formatDate(complaint.created_at)}</td>
                <td>
                  <div class="table-actions">
                    <a href="/admin/complaints/${complaint.id}" class="btn btn-sm btn-primary" data-link>View</a>
                    <button class="btn btn-sm btn-secondary" data-id="${complaint.id}" data-action="assign">Assign</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  async loadData() {
    try {
      // Load categories
      const categoriesResponse = await this.api.getCategories();
      this.categories = Array.isArray(categoriesResponse) ? categoriesResponse : (categoriesResponse.items || categoriesResponse.data || []);

      // Load complaints with filters
      const params = {};
      if (this.filters.status) params.status = this.filters.status;
      if (this.filters.priority) params.priority = this.filters.priority;
      if (this.filters.category) params.category_id = this.filters.category;
      if (this.filters.search) params.search = this.filters.search;

      const response = await this.api.getComplaints(params);
      this.complaints = response.items || response.data || [];
    } catch (error) {
      console.error('Error loading complaints:', error);
      Toast.error('Failed to load complaints');
      this.complaints = [];
    }
  }

  async afterRender() {
    // Attach filter event listeners
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    const categoryFilter = document.getElementById('categoryFilter');

    searchInput?.addEventListener('input', (e) => {
      this.filters.search = e.target.value;
      this.debounce(() => this.applyFilters(), 500);
    });

    statusFilter?.addEventListener('change', (e) => {
      this.filters.status = e.target.value;
      this.applyFilters();
    });

    priorityFilter?.addEventListener('change', (e) => {
      this.filters.priority = e.target.value;
      this.applyFilters();
    });

    categoryFilter?.addEventListener('change', (e) => {
      this.filters.category = e.target.value;
      this.applyFilters();
    });

    // Assign button handlers
    document.querySelectorAll('[data-action="assign"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const complaintId = e.target.dataset.id;
        this.showAssignModal(complaintId);
      });
    });
  }

  async applyFilters() {
    await this.render();
  }

  debounce(func, wait) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(func, wait);
  }

  showAssignModal(complaintId) {
    // TODO: Implement assign modal with user selection
    Toast.info('Assign functionality coming soon');
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
    if (!priority) return 'gray';
    const priorityLower = priority.toLowerCase();
    const colors = {
      'low': 'info',
      'medium': 'warning',
      'high': 'error'
    };
    return colors[priorityLower] || 'gray';
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

