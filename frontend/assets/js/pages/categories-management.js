import { BasePage } from './base-page.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';

export class CategoriesManagementPage extends BasePage {
  constructor(params) {
    super(params);
    this.categories = [];
  }

  async getContent() {
    await this.loadData();

    return `
      <div class="main-content">
        <div class="admin-header">
          <div>
            <h1 class="page-title">Categories Management</h1>
            <p class="page-description">Manage complaint categories</p>
          </div>
          <button class="btn btn-primary" id="addCategoryBtn">➕ Add Category</button>
        </div>

        ${this.renderCategoriesTable()}
      </div>
    `;
  }

  renderCategoriesTable() {
    if (this.categories.length === 0) {
      return `
        <div class="card">
          <div class="card-body">
            <div class="empty-state">
              <div class="empty-state-icon">📁</div>
              <h3 class="empty-state-title">No categories found</h3>
              <p class="empty-state-description">Create your first category to get started.</p>
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
            ${this.categories.map(cat => `
              <tr>
                <td>#${cat.id}</td>
                <td><strong>${this.escapeHtml(cat.name)}</strong></td>
                <td>${this.escapeHtml(cat.description || 'N/A')}</td>
                <td><span class="badge badge-${cat.is_active ? 'success' : 'gray'}">${cat.is_active ? 'Active' : 'Inactive'}</span></td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn-sm btn-secondary" data-id="${cat.id}" data-action="edit">Edit</button>
                    <button class="btn btn-sm btn-error" data-id="${cat.id}" data-action="delete">Delete</button>
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
      const response = await this.api.getCategories();
      this.categories = Array.isArray(response) ? response : (response.items || response.data || response.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      Toast.error('Failed to load categories');
      this.categories = [];
    }
  }

  async afterRender() {
    document.getElementById('addCategoryBtn')?.addEventListener('click', () => this.showModal());

    document.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        const item = this.categories.find(c => c.id == id);
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
      title: isEdit ? 'Edit Category' : 'Add New Category',
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
      await this.api.createCategory(data);
      Toast.success('Category created successfully');
      await this.render();
    } catch (error) {
      console.error('Error creating category:', error);
      Toast.error('Failed to create category');
    }
  }

  async updateItem(id, data) {
    try {
      await this.api.updateCategory(id, data);
      Toast.success('Category updated successfully');
      await this.render();
    } catch (error) {
      console.error('Error updating category:', error);
      Toast.error('Failed to update category');
    }
  }

  deleteItem(id) {
    Modal.confirm(
      'Delete Category',
      'Are you sure you want to delete this category?',
      async () => {
        try {
          await this.api.deleteCategory(id);
          Toast.success('Category deleted successfully');
          await this.render();
        } catch (error) {
          console.error('Error deleting category:', error);
          Toast.error('Failed to delete category');
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
