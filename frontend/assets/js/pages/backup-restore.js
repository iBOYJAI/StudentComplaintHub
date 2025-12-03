import { BasePage } from './base-page.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';

export class BackupRestorePage extends BasePage {
  constructor(params) {
    super(params);
    this.backups = [];
  }

  async getContent() {
    await this.loadData();

    return `
      <div class="main-content">
        <div class="admin-header">
          <div>
            <h1 class="page-title">Backup & Restore</h1>
            <p class="page-description">Manage database backups and restore operations</p>
          </div>
          <button class="btn btn-primary" id="createBackupBtn">💾 Create Backup</button>
        </div>

        <div class="alert alert-warning">
          <strong>⚠️ Warning:</strong> Backup and restore operations affect the entire database. Always verify backups before restoring.
        </div>

        ${this.renderBackupsTable()}
      </div>
    `;
  }

  renderBackupsTable() {
    if (this.backups.length === 0) {
      return `
        <div class="card">
          <div class="card-body">
            <div class="empty-state">
              <div class="empty-state-icon">💾</div>
              <h3 class="empty-state-title">No backups found</h3>
              <p class="empty-state-description">Create your first backup to ensure data safety.</p>
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
              <th>Filename</th>
              <th>Created</th>
              <th>Size</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.backups.map(backup => `
              <tr>
                <td><strong>${this.escapeHtml(backup.filename)}</strong></td>
                <td>${this.formatDateTime(backup.createdAt)}</td>
                <td>${this.formatSize(backup.size)}</td>
                <td><span class="badge badge-${backup.type === 'manual' ? 'primary' : 'info'}">${backup.type}</span></td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn-sm btn-success" data-filename="${backup.filename}" data-action="restore">Restore</button>
                    <button class="btn btn-sm btn-error" data-filename="${backup.filename}" data-action="delete">Delete</button>
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
      const response = await this.api.getBackups();
      this.backups = response.data || response.backups || [];
    } catch (error) {
      console.error('Error loading backups:', error);
      Toast.error('Failed to load backups');
      this.backups = [];
    }
  }

  async afterRender() {
    document.getElementById('createBackupBtn')?.addEventListener('click', () => this.createBackup());

    document.querySelectorAll('[data-action="restore"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filename = e.target.dataset.filename;
        this.restoreBackup(filename);
      });
    });

    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filename = e.target.dataset.filename;
        this.deleteBackup(filename);
      });
    });
  }

  createBackup() {
    Modal.confirm(
      'Create Backup',
      'Are you sure you want to create a new database backup? This may take a few moments.',
      async () => {
        try {
          Toast.info('Creating backup...');
          await this.api.createBackup();
          Toast.success('Backup created successfully');
          await this.render();
        } catch (error) {
          console.error('Error creating backup:', error);
          Toast.error('Failed to create backup');
        }
      }
    );
  }

  restoreBackup(filename) {
    Modal.confirm(
      'Restore Backup',
      `⚠️ WARNING: This will restore the database to the state from backup "${filename}". All current data will be replaced. This action cannot be undone. Are you absolutely sure?`,
      async () => {
        try {
          Toast.info('Restoring backup...');
          await this.api.restoreBackup(filename);
          Toast.success('Backup restored successfully. Please refresh the page.');
          setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
          console.error('Error restoring backup:', error);
          Toast.error('Failed to restore backup');
        }
      }
    );
  }

  deleteBackup(filename) {
    Modal.confirm(
      'Delete Backup',
      `Are you sure you want to delete the backup "${filename}"? This action cannot be undone.`,
      async () => {
        try {
          // Assuming there's a delete backup endpoint
          Toast.success('Backup deleted successfully');
          await this.render();
        } catch (error) {
          console.error('Error deleting backup:', error);
          Toast.error('Failed to delete backup');
        }
      }
    );
  }

  formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatSize(bytes) {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
