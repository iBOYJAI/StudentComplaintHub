import { BasePage } from './base-page.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';

export class LocationsManagementPage extends BasePage {
  constructor(params) {
    super(params);
    this.locations = [];
  }

  async getContent() {
    await this.loadData();

    return `
      <div class="main-content">
        <div class="admin-header">
          <div>
            <h1 class="page-title">Locations Management</h1>
            <p class="page-description">Manage campus locations</p>
          </div>
          <button class="btn btn-primary" id="addLocationBtn">➕ Add Location</button>
        </div>

        ${this.renderTable()}
      </div>
    `;
  }

  renderTable() {
    if (this.locations.length === 0) {
      return `
        <div class="card">
          <div class="card-body">
            <div class="empty-state">
              <div class="empty-state-icon">📍</div>
              <h3 class="empty-state-title">No locations found</h3>
              <p class="empty-state-description">Create your first location to get started.</p>
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
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.locations.map(loc => `
              <tr>
                <td>#${loc.id}</td>
                <td><strong>${this.escapeHtml(loc.name)}</strong></td>
                <td>${this.escapeHtml(loc.description || 'N/A')}</td>
                <td><span class="badge badge-${loc.active ? 'success' : 'gray'}">${loc.active ? 'Active' : 'Inactive'}</span></td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn-sm btn-secondary" data-id="${loc.id}" data-action="edit">Edit</button>
                    <button class="btn btn-sm btn-error" data-id="${loc.id}" data-action="delete">Delete</button>
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
      const response = await this.api.getLocations();
      this.locations = response.data || response.locations || [];
    } catch (error) {
      console.error('Error loading locations:', error);
      Toast.error('Failed to load locations');
      this.locations = [];
    }
  }

  async afterRender() {
    document.getElementById('addLocationBtn')?.addEventListener('click', () => this.showModal());

    document.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        const item = this.locations.find(l => l.id == id);
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
      title: isEdit ? 'Edit Location' : 'Add New Location',
      content: `
        <form>
          <div class="form-group">
            <label class="form-label required">Name</label>
            <input type="text" class="form-control" id="itemName" value="${item ? item.name : ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-control" id="itemDescription" rows="3">${item ? item.description || '' : ''}</textarea>
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
      await this.api.createLocation(data);
      Toast.success('Location created successfully');
      await this.render();
    } catch (error) {
      console.error('Error creating location:', error);
      Toast.error('Failed to create location');
    }
  }

  async updateItem(id, data) {
    try {
      await this.api.updateLocation(id, data);
      Toast.success('Location updated successfully');
      await this.render();
    } catch (error) {
      console.error('Error updating location:', error);
      Toast.error('Failed to update location');
    }
  }

  deleteItem(id) {
    Modal.confirm(
      'Delete Location',
      'Are you sure you want to delete this location?',
      async () => {
        try {
          await this.api.deleteLocation(id);
          Toast.success('Location deleted successfully');
          await this.render();
        } catch (error) {
          console.error('Error deleting location:', error);
          Toast.error('Failed to delete location');
        }
      }
    );
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
