import { BasePage } from './base-page.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';

export class RolesManagementPage extends BasePage {
  constructor(params) {
    super(params);
    this.roles = [];
  }

  async getContent() {
    await this.loadData();

    return `
      <div class="main-content">
        <div class="admin-header">
          <div>
            <h1 class="page-title">Roles Management</h1>
            <p class="page-description">Manage user roles and permissions</p>
          </div>
          <button class="btn btn-primary" id="addRoleBtn">➕ Add Role</button>
        </div>

        ${this.renderRolesTable()}
      </div>
    `;
  }

  renderRolesTable() {
    if (this.roles.length === 0) {
      return `
        <div class="card">
          <div class="card-body">
            <div class="empty-state">
              <div class="empty-state-icon">🔐</div>
              <h3 class="empty-state-title">No roles found</h3>
              <p class="empty-state-description">Create your first role to get started.</p>
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
              <th>Permissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.roles.map(role => `
              <tr>
                <td>#${role.id}</td>
                <td><strong>${this.escapeHtml(role.name)}</strong></td>
                <td>${this.escapeHtml(role.description || 'N/A')}</td>
                <td>${role.permissions ? role.permissions.length : 0} permissions</td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn-sm btn-secondary" data-role-id="${role.id}" data-action="edit">Edit</button>
                    <button class="btn btn-sm btn-error" data-role-id="${role.id}" data-action="delete">Delete</button>
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
      const response = await this.api.getRoles();
      this.roles = response.data || response.roles || [];
    } catch (error) {
      console.error('Error loading roles:', error);
      Toast.error('Failed to load roles');
      this.roles = [];
    }
  }

  async afterRender() {
    document.getElementById('addRoleBtn')?.addEventListener('click', () => this.showRoleModal());

    document.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const roleId = e.target.dataset.roleId;
        const role = this.roles.find(r => r.id == roleId);
        this.showRoleModal(role);
      });
    });

    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const roleId = e.target.dataset.roleId;
        this.deleteRole(roleId);
      });
    });
  }

  showRoleModal(role = null) {
    const isEdit = !!role;
    const modal = new Modal({
      title: isEdit ? 'Edit Role' : 'Add New Role',
      content: `
        <form id="roleForm">
          <div class="form-group">
            <label class="form-label required">Name</label>
            <input type="text" class="form-control" id="roleName" value="${role ? role.name : ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-control" id="roleDescription" rows="3">${role ? role.description || '' : ''}</textarea>
          </div>
        </form>
      `,
      confirmText: isEdit ? 'Update' : 'Create',
      onConfirm: async () => {
        const data = {
          name: document.getElementById('roleName').value,
          description: document.getElementById('roleDescription').value
        };
        if (isEdit) {
          await this.updateRole(role.id, data);
        } else {
          await this.createRole(data);
        }
      }
    });
    modal.show();
  }

  async createRole(data) {
    try {
      await this.api.createRole(data);
      Toast.success('Role created successfully');
      await this.render();
    } catch (error) {
      console.error('Error creating role:', error);
      Toast.error('Failed to create role');
    }
  }

  async updateRole(id, data) {
    try {
      await this.api.updateRole(id, data);
      Toast.success('Role updated successfully');
      await this.render();
    } catch (error) {
      console.error('Error updating role:', error);
      Toast.error('Failed to update role');
    }
  }

  deleteRole(id) {
    Modal.confirm(
      'Delete Role',
      'Are you sure you want to delete this role?',
      async () => {
        try {
          await this.api.deleteRole(id);
          Toast.success('Role deleted successfully');
          await this.render();
        } catch (error) {
          console.error('Error deleting role:', error);
          Toast.error('Failed to delete role');
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
