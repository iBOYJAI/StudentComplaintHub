import { BasePage } from './base-page.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';

export class SLARulesPage extends BasePage {
  constructor(params) {
    super(params);
    this.rules = [];
  }

  async getContent() {
    await this.loadData();

    return `
      <div class="main-content">
        <div class="admin-header">
          <div>
            <h1 class="page-title">SLA Rules</h1>
            <p class="page-description">Configure Service Level Agreement rules</p>
          </div>
          <button class="btn btn-primary" id="addRuleBtn">➕ Add SLA Rule</button>
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
              <div class="empty-state-icon">⏱️</div>
              <h3 class="empty-state-title">No SLA rules found</h3>
              <p class="empty-state-description">Create your first SLA rule to set response time requirements.</p>
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
              <th>Priority</th>
              <th>Response Time</th>
              <th>Resolution Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.rules.map(rule => `
              <tr>
                <td>#${rule.id}</td>
                <td><strong>${this.escapeHtml(rule.name)}</strong></td>
                <td><span class="badge badge-${this.getPriorityColor(rule.priority)}">${rule.priority || 'N/A'}</span></td>
                <td>${rule.response_time_minutes ? Math.round(rule.response_time_minutes / 60) : 'N/A'} hours</td>
                <td>${rule.resolution_time_minutes ? Math.round(rule.resolution_time_minutes / 60) : 'N/A'} hours</td>
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
      const response = await this.api.getSLARules();
      this.rules = Array.isArray(response) ? response : (response.items || response.data || response.rules || []);
    } catch (error) {
      console.error('Error loading SLA rules:', error);
      Toast.error('Failed to load SLA rules');
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
      title: isEdit ? 'Edit SLA Rule' : 'Add New SLA Rule',
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
            <label class="form-label required">Priority</label>
            <select class="form-control" id="itemPriority" required>
              <option value="low" ${item && item.priority === 'low' ? 'selected' : ''}>Low</option>
              <option value="medium" ${item && item.priority === 'medium' ? 'selected' : ''}>Medium</option>
              <option value="high" ${item && item.priority === 'high' ? 'selected' : ''}>High</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Response Time (hours)</label>
            <input type="number" class="form-control" id="itemResponseTime" min="1" value="${item ? item.responseTime : 24}" required>
            <small class="form-text">Maximum time to first response</small>
          </div>
          <div class="form-group">
            <label class="form-label required">Resolution Time (hours)</label>
            <input type="number" class="form-control" id="itemResolutionTime" min="1" value="${item ? item.resolutionTime : 72}" required>
            <small class="form-text">Maximum time to resolve the complaint</small>
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
          priority: document.getElementById('itemPriority').value,
          responseTime: parseInt(document.getElementById('itemResponseTime').value),
          resolutionTime: parseInt(document.getElementById('itemResolutionTime').value),
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
      await this.api.createSLARule(data);
      Toast.success('SLA rule created successfully');
      await this.render();
    } catch (error) {
      console.error('Error creating SLA rule:', error);
      Toast.error('Failed to create SLA rule');
    }
  }

  async updateItem(id, data) {
    try {
      await this.api.updateSLARule(id, data);
      Toast.success('SLA rule updated successfully');
      await this.render();
    } catch (error) {
      console.error('Error updating SLA rule:', error);
      Toast.error('Failed to update SLA rule');
    }
  }

  deleteItem(id) {
    Modal.confirm(
      'Delete SLA Rule',
      'Are you sure you want to delete this SLA rule?',
      async () => {
        try {
          await this.api.deleteSLARule(id);
          Toast.success('SLA rule deleted successfully');
          await this.render();
        } catch (error) {
          console.error('Error deleting SLA rule:', error);
          Toast.error('Failed to delete SLA rule');
        }
      }
    );
  }

  getPriorityColor(priority) {
    const colors = { low: 'info', medium: 'warning', high: 'error' };
    return colors[priority] || 'gray';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
