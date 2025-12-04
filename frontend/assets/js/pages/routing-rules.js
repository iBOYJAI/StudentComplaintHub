import { BasePage } from './base-page.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';

export class RoutingRulesPage extends BasePage {
  constructor(params) {
    super(params);
    this.rules = [];
    this.categories = [];
    this.locations = [];
  }

  async getContent() {
    await this.loadData();

    return `
      <div class="main-content">
        <div class="admin-header">
          <div>
            <h1 class="page-title">Routing Rules</h1>
            <p class="page-description">Configure automatic complaint routing rules</p>
          </div>
          <button class="btn btn-primary" id="addRuleBtn">➕ Add Rule</button>
        </div>

        ${this.renderTable()}
      </div>
    `;
  }

  renderTable() {
    if (this.rules.length === 0) {
      return `
        <div class="card">
          <div class="card-body">
            <div class="empty-state">
              <div class="empty-state-icon">🔄</div>
              <h3 class="empty-state-title">No routing rules found</h3>
              <p class="empty-state-description">Create your first routing rule to automate complaint assignment.</p>
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
              <th>Name</th>
              <th>Condition</th>
              <th>Assign To</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.rules.map(rule => `
              <tr>
                <td>#${rule.id}</td>
                <td><strong>${this.escapeHtml(rule.name)}</strong></td>
                <td>${this.escapeHtml(rule.condition || 'N/A')}</td>
                <td>${this.escapeHtml(rule.assignTo || 'N/A')}</td>
                <td><span class="badge badge-${this.getPriorityColor(rule.priority)}">${rule.priority || 0}</span></td>
                <td><span class="badge badge-${rule.is_active ? 'success' : 'gray'}">${rule.is_active ? 'Active' : 'Inactive'}</span></td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn-sm btn-secondary" data-id="${rule.id}" data-action="edit">Edit</button>
                    <button class="btn btn-sm btn-error" data-id="${rule.id}" data-action="delete">Delete</button>
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
      const [rulesResponse, categoriesResponse, locationsResponse] = await Promise.all([
        this.api.getRoutingRules(),
        this.api.getCategories(),
        this.api.getLocations()
      ]);
      
      this.rules = Array.isArray(rulesResponse) ? rulesResponse : (rulesResponse.items || rulesResponse.data || rulesResponse.rules || []);
      this.categories = Array.isArray(categoriesResponse) ? categoriesResponse : (categoriesResponse.items || categoriesResponse.data || categoriesResponse.categories || []);
      this.locations = Array.isArray(locationsResponse) ? locationsResponse : (locationsResponse.items || locationsResponse.data || locationsResponse.locations || []);
    } catch (error) {
      console.error('Error loading data:', error);
      Toast.error('Failed to load routing rules');
      this.rules = [];
    }
  }

  async afterRender() {
    document.getElementById('addRuleBtn')?.addEventListener('click', () => this.showModal());

    document.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        const item = this.rules.find(r => r.id == id);
        this.showModal(item);
      });
    });

    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        this.deleteItem(id);
      });
    });
  }

  showModal(item = null) {
    const isEdit = !!item;
    const modal = new Modal({
      title: isEdit ? 'Edit Routing Rule' : 'Add New Routing Rule',
      size: 'lg',
      content: `
        <form>
          <div class="form-group">
            <label class="form-label required">Rule Name</label>
            <input type="text" class="form-control" id="itemName" value="${item ? item.name : ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-control" id="itemDescription" rows="2">${item ? item.description || '' : ''}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label required">Priority (0-100)</label>
            <input type="number" class="form-control" id="itemPriority" min="0" max="100" value="${item ? item.priority : 0}" required>
            <small class="form-text">Higher priority rules are evaluated first</small>
          </div>
          <div class="form-group">
            <div class="form-check">
              <input type="checkbox" class="form-check-input" id="itemActive" ${item ? (item.active ? 'checked' : '') : 'checked'}>
              <label class="form-check-label" for="itemActive">Active</label>
            </div>
          </div>
        </form>
      `,
      confirmText: isEdit ? 'Update' : 'Create',
      onConfirm: async () => {
        const data = {
          name: document.getElementById('itemName').value,
          description: document.getElementById('itemDescription').value,
          priority: parseInt(document.getElementById('itemPriority').value),
          active: document.getElementById('itemActive').checked
        };
        if (isEdit) {
          await this.updateItem(item.id, data);
        } else {
          await this.createItem(data);
        }
      }
    });
    modal.show();
  }

  async createItem(data) {
    try {
      await this.api.createRoutingRule(data);
      Toast.success('Routing rule created successfully');
      await this.render();
    } catch (error) {
      console.error('Error creating routing rule:', error);
      Toast.error('Failed to create routing rule');
    }
  }

  async updateItem(id, data) {
    try {
      await this.api.updateRoutingRule(id, data);
      Toast.success('Routing rule updated successfully');
      await this.render();
    } catch (error) {
      console.error('Error updating routing rule:', error);
      Toast.error('Failed to update routing rule');
    }
  }

  deleteItem(id) {
    Modal.confirm(
      'Delete Routing Rule',
      'Are you sure you want to delete this routing rule?',
      async () => {
        try {
          await this.api.deleteRoutingRule(id);
          Toast.success('Routing rule deleted successfully');
          await this.render();
        } catch (error) {
          console.error('Error deleting routing rule:', error);
          Toast.error('Failed to delete routing rule');
        }
      }
    );
  }

  getPriorityColor(priority) {
    if (priority >= 75) return 'error';
    if (priority >= 50) return 'warning';
    if (priority >= 25) return 'info';
    return 'gray';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
