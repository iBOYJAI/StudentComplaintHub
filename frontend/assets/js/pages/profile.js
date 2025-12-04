import { BasePage } from './base-page.js';
import { Toast } from '../components/toast.js';

export class ProfilePage extends BasePage {
  constructor(params) {
    super(params);
    this.user = null;
    this.isEditing = false;
  }

  async getContent() {
    this.user = this.store.getUser();

    if (!this.user) {
      return `
        <div class="main-content">
          <div class="alert alert-error">Unable to load profile</div>
        </div>
      `;
    }

    return `
      <div class="main-content">
        <div class="profile-container">
          ${this.renderHeader()}
          ${this.renderProfileInfo()}
          ${this.renderPasswordChange()}
          ${this.renderPINSection()}
        </div>
      </div>
    `;
  }

  renderHeader() {
    return `
      <div class="profile-header">
        <div class="profile-avatar">
          ${this.getInitials(this.user.name || this.user.username)}
        </div>
        <div class="profile-info">
          <h1 class="profile-name">${this.escapeHtml(this.user.name || this.user.username)}</h1>
          <p class="profile-role">
            <span class="badge badge-${this.getRoleBadgeColor(this.user.role)}">${this.user.role}</span>
          </p>
          <p class="text-secondary">${this.escapeHtml(this.user.email)}</p>
        </div>
      </div>
    `;
  }

  renderProfileInfo() {
    return `
      <div class="profile-sections">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Profile Information</h3>
            <button class="btn btn-primary" id="editBtn">Edit</button>
          </div>
          <div class="card-body">
            <form id="profileForm">
              <div class="form-group">
                <label class="form-label">Username</label>
                <input type="text" class="form-control" id="username" value="${this.user.username}" disabled>
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" class="form-control" id="email" value="${this.user.email}" disabled>
              </div>
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-control" id="name" value="${this.user.name || ''}" disabled>
              </div>
              <div id="formActions" class="crud-form-actions" style="display: none;">
                <button type="button" class="btn btn-secondary" id="cancelBtn">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  renderPasswordChange() {
    return `
      <div class="card mt-6">
        <div class="card-header">
          <h3 class="card-title">Change Password</h3>
        </div>
        <div class="card-body">
          <form id="passwordForm">
            <div class="form-group">
              <label class="form-label required">Current Password</label>
              <input type="password" class="form-control" id="currentPassword" required>
            </div>
            <div class="form-group">
              <label class="form-label required">New Password</label>
              <input type="password" class="form-control" id="newPassword" required minlength="8">
              <small class="form-text">Minimum 8 characters</small>
            </div>
            <div class="form-group">
              <label class="form-label required">Confirm New Password</label>
              <input type="password" class="form-control" id="confirmPassword" required>
            </div>
            <button type="submit" class="btn btn-primary">Change Password</button>
          </form>
        </div>
      </div>
    `;
  }

  renderPINSection() {
    return `
      <div class="card mt-6">
        <div class="card-header">
          <h3 class="card-title">Quick Login PIN</h3>
        </div>
        <div class="card-body">
          <p class="text-secondary mb-4">Set up a 4-digit PIN for quick login access.</p>
          ${this.user.hasPin ? `
            <p class="text-success mb-4">✓ PIN is set up</p>
            <button class="btn btn-secondary" id="changePinBtn">Change PIN</button>
          ` : `
            <button class="btn btn-primary" id="setupPinBtn">Set Up PIN</button>
          `}
        </div>
      </div>
    `;
  }

  async afterRender() {
    const editBtn = document.getElementById('editBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const profileForm = document.getElementById('profileForm');
    const passwordForm = document.getElementById('passwordForm');
    const formActions = document.getElementById('formActions');

    // Edit profile
    editBtn?.addEventListener('click', () => {
      this.isEditing = true;
      document.querySelectorAll('#profileForm input:not([disabled])').forEach(el => {
        if (el.id !== 'username') el.disabled = false;
      });
      document.getElementById('email').disabled = false;
      document.getElementById('name').disabled = false;
      editBtn.style.display = 'none';
      formActions.style.display = 'flex';
    });

    cancelBtn?.addEventListener('click', () => {
      this.render();
    });

    profileForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveProfile();
    });

    // Change password
    passwordForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.changePassword();
    });

    // PIN buttons
    document.getElementById('setupPinBtn')?.addEventListener('click', () => {
      this.router.navigate('/pin-setup');
    });

    document.getElementById('changePinBtn')?.addEventListener('click', () => {
      this.router.navigate('/pin-setup');
    });
  }

  async saveProfile() {
    try {
      const data = {
        email: document.getElementById('email').value,
        name: document.getElementById('name').value
      };

      await this.api.updateProfile(data);
      
      // Update stored user
      const updatedUser = { ...this.user, ...data };
      this.store.setUser(updatedUser);
      
      Toast.success('Profile updated successfully');
      this.isEditing = false;
      await this.render();
    } catch (error) {
      console.error('Error updating profile:', error);
      Toast.error('Failed to update profile');
    }
  }

  async changePassword() {
    const currentPasswordEl = document.getElementById('currentPassword');
    const newPasswordEl = document.getElementById('newPassword');
    const confirmPasswordEl = document.getElementById('confirmPassword');
    const passwordForm = document.getElementById('passwordForm');

    if (!currentPasswordEl || !newPasswordEl || !confirmPasswordEl) {
      Toast.error('Password form fields not found');
      return;
    }

    const currentPassword = currentPasswordEl.value.trim();
    const newPassword = newPasswordEl.value.trim();
    const confirmPassword = confirmPasswordEl.value.trim();

    // Validate current password
    if (!currentPassword) {
      Toast.error('Current password is required');
      currentPasswordEl.focus();
      return;
    }

    // Validate new password
    if (!newPassword) {
      Toast.error('New password is required');
      newPasswordEl.focus();
      return;
    }

    if (newPassword.length < 6) {
      Toast.error('Password must be at least 6 characters');
      newPasswordEl.focus();
      return;
    }

    // Validate confirm password
    if (!confirmPassword) {
      Toast.error('Please confirm your new password');
      confirmPasswordEl.focus();
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.error('New passwords do not match');
      confirmPasswordEl.focus();
      return;
    }

    try {
      await this.api.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });

      Toast.success('Password changed successfully');
      if (passwordForm) {
        passwordForm.reset();
      }
    } catch (error) {
      console.error('Error changing password:', error);
      const errorMessage = error.message || 'Failed to change password';
      Toast.error(errorMessage);
    }
  }

  getInitials(name) {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getRoleBadgeColor(role) {
    const colors = { student: 'primary', staff: 'info', admin: 'error' };
    return colors[role] || 'gray';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
