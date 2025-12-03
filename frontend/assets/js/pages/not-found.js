import { BasePage } from './base-page.js';

export class NotFoundPage extends BasePage {
  async getContent() {
    return `
      <div class="error-page">
        <div>
          <div class="error-code">404</div>
          <h1 class="error-title">Page Not Found</h1>
          <p class="error-description">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div class="d-flex gap-3 justify-center">
            <a href="/" class="btn btn-primary" data-link>Go Home</a>
            <button class="btn btn-secondary" id="goBackBtn">Go Back</button>
          </div>
        </div>
      </div>
    `;
  }

  async afterRender() {
    document.getElementById('goBackBtn')?.addEventListener('click', () => {
      window.history.back();
    });
  }
}
