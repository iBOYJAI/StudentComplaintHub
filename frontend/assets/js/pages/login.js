import { BasePage } from './base-page.js';
import { Auth } from '../auth.js';
import { Toast } from '../components/toast.js';

export class LoginPage extends BasePage {
  async getContent() {
    return `
      <div class="auth-layout">
        <div class="auth-card">
          <div class="auth-logo">
            <div class="auth-logo-text">Student Complaint Hub</div>
            <div class="auth-logo-subtitle">Sign in to your account</div>
          </div>
          
          <h2 class="auth-title">Login</h2>
          
          <form id="loginForm" class="auth-form">
            <div class="form-group">
              <label class="form-label required">Username</label>
              <input type="text" class="form-control" name="username" required autofocus>
              <div class="invalid-feedback"></div>
            </div>
            
            <div class="form-group">
              <label class="form-label required">Password</label>
              <input type="password" class="form-control" name="password" required>
              <div class="invalid-feedback"></div>
            </div>
            
            <button type="submit" class="btn btn-primary btn-block btn-lg">Sign In</button>
          </form>
          
          <div class="auth-footer">
            <a href="/pin-login" class="auth-link" data-link>Login with PIN</a>
          </div>
        </div>
      </div>
    `;
  }

  async afterRender() {
    const form = document.getElementById('loginForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleLogin(new FormData(form));
    });
  }

  async handleLogin(formData) {
    try {
      const credentials = {
        username: formData.get('username').trim(),
        password: formData.get('password').trim()
      };

      const response = await this.api.login(credentials);
      
      Auth.setToken(response.access_token);
      Auth.setUser(response.user);
      this.store.setUser(response.user);
      
      Toast.success('Login successful!');
      Auth.redirectToDashboard();
    } catch (error) {
      Toast.error(error.message || 'Login failed');
    }
  }
}
