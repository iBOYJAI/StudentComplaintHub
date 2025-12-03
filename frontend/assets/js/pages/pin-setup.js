import { BasePage } from './base-page.js';
import { Toast } from '../components/toast.js';

export class PinSetupPage extends BasePage {
  async getContent() {
    return `
      <div class="auth-layout">
        <div class="auth-card">
          <h2 class="auth-title">Setup Your PIN</h2>
          
          <form id="pinSetupForm" class="auth-form">
            <p class="text-center mb-4">Create a 4-digit PIN for quick login</p>
            
            <div class="form-group">
              <label class="form-label required">New PIN</label>
              <div class="pin-input-container">
                <input type="text" class="pin-input" maxlength="1" pattern="[0-9]" required>
                <input type="text" class="pin-input" maxlength="1" pattern="[0-9]" required>
                <input type="text" class="pin-input" maxlength="1" pattern="[0-9]" required>
                <input type="text" class="pin-input" maxlength="1" pattern="[0-9]" required>
              </div>
            </div>
            
            <button type="submit" class="btn btn-primary btn-block">Save PIN</button>
            <a href="/profile" class="btn btn-secondary btn-block" data-link>Cancel</a>
          </form>
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
    });

    const form = document.getElementById('pinSetupForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pin = Array.from(inputs).map(i => i.value).join('');
      await this.handleSetupPin(pin);
    });
  }

  async handleSetupPin(pin) {
    try {
      await this.api.setupPin(pin);
      Toast.success('PIN setup successful!');
      this.router.navigate('/profile');
    } catch (error) {
      Toast.error(error.message || 'Failed to setup PIN');
    }
  }
}
