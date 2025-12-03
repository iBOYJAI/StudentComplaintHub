import { BasePage } from './base-page.js';
import { Toast } from '../components/toast.js';

export class AssignedComplaintsPage extends BasePage {
  constructor(params) {
    super(params);
    this.complaints = [];
    this.filters = {
      status: '',
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
          <h1 class="page-title">Assigned Complaints</h1>
          <p class="page-description">Manage complaints assigned to you</p>
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
            <option value="open" ${this.filters.status === 'open' ? 'selected' : ''}>Open</option>
            <option value="in_progress" ${this.filters.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
            <option value="resolved" ${this.filters.status === 'resolved' ? 'selected' : ''}>Resolved</option>
            <option value="escalated" ${this.filters.status === 'escalated' ? 'selected' : ''}>Escalated</option>
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
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.complaints.map(complaint => `
              <tr>
                <td>#${complaint.id}</td>
                <td>
                  <a href="/staff/complaints/${complaint.id}" data-link class="text-primary font-medium">
                    ${this.escapeHtml(complaint.title)}
                  </a>
                </td>
                <td>${complaint.category || 'N/A'}</td>
                <td><span class="badge badge-${this.getStatusBadgeColor(complaint.status)}">${complaint.status}</span></td>
                <td><span class="badge badge-${this.getPriorityBadgeColor(complaint.priority)}">${complaint.priority || 'N/A'}</span></td>
                <td>${this.formatDate(complaint.createdAt)}</td>
                <td>
                  <div class="table-actions">
                    <a href="/staff/complaints/${complaint.id}" class="btn btn-sm btn-primary" data-link>View</a>
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
      this.categories = categoriesResponse.data || categoriesResponse.categories || [];

      // Load complaints with filters
      const params = { assigned: true };
      if (this.filters.status) params.status = this.filters.status;
      if (this.filters.category) params.category = this.filters.category;
      if (this.filters.search) params.search = this.filters.search;

      const response = await this.api.getComplaints(params);
      this.complaints = response.data || response.complaints || [];
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
    const categoryFilter = document.getElementById('categoryFilter');

    searchInput?.addEventListener('input', (e) => {
      this.filters.search = e.target.value;
      this.debounce(() => this.applyFilters(), 500);
    });

    statusFilter?.addEventListener('change', (e) => {
      this.filters.status = e.target.value;
      this.applyFilters();
    });

    categoryFilter?.addEventListener('change', (e) => {
      this.filters.category = e.target.value;
      this.applyFilters();
    });
  }

  async applyFilters() {
    await this.render();
  }

  debounce(func, wait) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(func, wait);
  }

  getStatusBadgeColor(status) {
    const colors = {
      'open': 'warning',
      'in_progress': 'info',
      'resolved': 'success',
      'closed': 'gray',
      'escalated': 'error'
    };
    return colors[status] || 'gray';
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
