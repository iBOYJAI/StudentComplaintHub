import { BasePage } from './base-page.js';
import { Toast } from '../components/toast.js';

export class SearchPage extends BasePage {
  constructor(params) {
    super(params);
    this.results = [];
    this.query = '';
    this.filters = {
      type: 'all', // all, complaints, users
      status: '',
      category: '',
      dateFrom: '',
      dateTo: ''
    };
  }

  async getContent() {
    return `
      <div class="main-content">
        <div class="search-page-header">
          <h1 class="page-title">Search</h1>
          <p class="page-description">Search across complaints, users, and more</p>
          
          <div class="search-box mt-6">
            <span class="search-box-icon">🔍</span>
            <input type="text" class="form-control search-input-large" placeholder="Search..." id="searchQuery" value="${this.query}" autofocus>
          </div>
        </div>

        ${this.renderFilters()}
        ${this.renderResults()}
      </div>
    `;
  }

  renderFilters() {
    return `
      <div class="filters-bar">
        <div class="filters-grid">
          <select class="form-control" id="typeFilter">
            <option value="all" ${this.filters.type === 'all' ? 'selected' : ''}>All</option>
            <option value="complaints" ${this.filters.type === 'complaints' ? 'selected' : ''}>Complaints</option>
            <option value="users" ${this.filters.type === 'users' ? 'selected' : ''}>Users</option>
          </select>
          
          <select class="form-control" id="statusFilter">
            <option value="">Any Status</option>
            <option value="open" ${this.filters.status === 'open' ? 'selected' : ''}>Open</option>
            <option value="in_progress" ${this.filters.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
            <option value="resolved" ${this.filters.status === 'resolved' ? 'selected' : ''}>Resolved</option>
            <option value="closed" ${this.filters.status === 'closed' ? 'selected' : ''}>Closed</option>
          </select>
          
          <input type="date" class="form-control" id="dateFrom" placeholder="From" value="${this.filters.dateFrom}">
          <input type="date" class="form-control" id="dateTo" placeholder="To" value="${this.filters.dateTo}">
        </div>
      </div>
    `;
  }

  renderResults() {
    if (!this.query) {
      return `
        <div class="card mt-6">
          <div class="card-body">
            <div class="empty-state">
              <div class="empty-state-icon">🔍</div>
              <h3 class="empty-state-title">Start searching</h3>
              <p class="empty-state-description">Enter a query above to search across the system.</p>
            </div>
          </div>
        </div>
      `;
    }

    if (this.results.length === 0) {
      return `
        <div class="card mt-6">
          <div class="card-body">
            <div class="empty-state">
              <div class="empty-state-icon">🔍</div>
              <h3 class="empty-state-title">No results found</h3>
              <p class="empty-state-description">Try adjusting your search query or filters.</p>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="search-results mt-6">
        <p class="text-secondary mb-4">Found ${this.results.length} result(s) for "${this.escapeHtml(this.query)}"</p>
        
        ${this.results.map(result => `
          <div class="search-result-item" data-type="${result.type}" data-id="${result.id}">
            <h3 class="search-result-title">${this.escapeHtml(result.title)}</h3>
            <p class="search-result-description">${this.escapeHtml(result.description || result.excerpt || '')}</p>
            <div class="search-result-meta">
              <span class="badge badge-primary">${result.type}</span>
              ${result.status ? `<span class="badge badge-${this.getStatusColor(result.status)}">${result.status}</span>` : ''}
              ${result.category ? `<span>${result.category}</span>` : ''}
              <span>📅 ${this.formatDate(result.createdAt || result.date)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  async searchData() {
    if (!this.query || this.query.trim().length < 2) {
      this.results = [];
      return;
    }

    try {
      const response = await this.api.search(this.query, this.filters);
      this.results = response.data || response.results || [];
    } catch (error) {
      console.error('Error searching:', error);
      Toast.error('Search failed');
      this.results = [];
    }
  }

  async afterRender() {
    const searchInput = document.getElementById('searchQuery');
    
    searchInput?.addEventListener('input', (e) => {
      this.query = e.target.value;
      this.debounce(async () => {
        await this.searchData();
        await this.render();
      }, 500);
    });

    document.getElementById('typeFilter')?.addEventListener('change', async (e) => {
      this.filters.type = e.target.value;
      await this.searchData();
      await this.render();
    });

    document.getElementById('statusFilter')?.addEventListener('change', async (e) => {
      this.filters.status = e.target.value;
      await this.searchData();
      await this.render();
    });

    document.getElementById('dateFrom')?.addEventListener('change', async (e) => {
      this.filters.dateFrom = e.target.value;
      await this.searchData();
      await this.render();
    });

    document.getElementById('dateTo')?.addEventListener('change', async (e) => {
      this.filters.dateTo = e.target.value;
      await this.searchData();
      await this.render();
    });

    // Click handlers for results
    document.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const type = item.dataset.type;
        const id = item.dataset.id;
        this.navigateToResult(type, id);
      });
    });
  }

  navigateToResult(type, id) {
    const user = this.store.getUser();
    if (!user) return;

    const routes = {
      complaint: `/${user.role}/complaints/${id}`,
      user: `/admin/users/${id}`
    };

    const route = routes[type];
    if (route) {
      this.router.navigate(route);
    }
  }

  debounce(func, wait) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(func, wait);
  }

  getStatusColor(status) {
    const colors = {
      'open': 'warning',
      'in_progress': 'info',
      'resolved': 'success',
      'closed': 'gray',
      'escalated': 'error'
    };
    return colors[status] || 'gray';
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
