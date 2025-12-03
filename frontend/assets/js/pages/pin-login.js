import { BasePage } from './base-page.js';
import { Auth } from '../auth.js';
import { Toast } from '../components/toast.js';

export class PinLoginPage extends BasePage {
  async getContent() {
    return `
      <div class="auth-layout">
        <div class="auth-card">
          <div class="auth-logo">
            <div class="auth-logo-text">Student Complaint Hub</div>
            <div class="auth-logo-subtitle">Quick PIN Login</div>
          </div>
          
          <h2 class="auth-title">PIN Login</h2>
          
          <form id="pinForm" class="auth-form">
            <div class="form-group">
              <label class="form-label required">Username</label>
              <input type="text" class="form-control" name="username" required autofocus>
            </div>
            
            <div class="form-group">
              <label class="form-label required">PIN</label>
              <div class="pin-input-container">
                <input type="text" class="pin-input" maxlength="1" pattern="[0-9]" required>
                <input type="text" class="pin-input" maxlength="1" pattern="[0-9]" required>
                <input type="text" class="pin-input" maxlength="1" pattern="[0-9]" required>
                <input type="text" class="pin-input" maxlength="1" pattern="[0-9]" required>
              </div>
            </div>
            
            <button type="submit" class="btn btn-primary btn-block btn-lg">Login</button>
          </form>
          
          <div class="auth-footer">
            <a href="/login" class="auth-link" data-link>Login with Password</a>
          </div>
        </div>
      </div>
    `;
  }

  async afterRender() {
    const inputs = document.querySelectorAll('.pin-input');
    
    inputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        if (e.target.value && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
      });
      
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
          inputs[index - 1].focus();
        }
      });
    });

    const form = document.getElementById('pinForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pin = Array.from(inputs).map(i => i.value).join('');
      const username = form.querySelector('[name="username"]').value;
      await this.handlePinLogin(username, pin);
    });
  }

  async handlePinLogin(username, pin) {
    try {
      const response = await this.api.loginWithPin({ username, pin });
      Auth.setToken(response.access_token);
      Auth.setUser(response.user);
      this.store.setUser(response.user);
      Toast.success('Login successful!');
      Auth.redirectToDashboard();
    } catch (error) {
      Toast.error(error.message || 'Invalid PIN');
    }
  }
}
