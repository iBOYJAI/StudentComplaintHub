export class BasePage {
  constructor(params = {}) {
    this.params = params;
    this.api = window.api;
    this.store = window.store;
    this.router = window.router;
  }

  async render() {
    const app = document.getElementById('app');
    if (!app) {
      console.error('App container not found');
      return;
    }

    try {
      const content = await this.getContent();
      app.innerHTML = content;
      await this.afterRender();
    } catch (error) {
      console.error('Error rendering page:', error);
      app.innerHTML = this.getErrorContent(error.message);
    }
  }

  async getContent() {
    return '<div>Page content</div>';
  }

  async afterRender() {
    // Override in child classes to attach event listeners, etc.
  }

  destroy() {
    // Override in child classes to cleanup
  }

  getErrorContent(message) {
    return `
      <div class="main-content">
        <div class="alert alert-error">
          <strong>Error:</strong> ${message}
        </div>
      </div>
    `;
  }

  showLoading() {
    return '<div class="loading-inline"><div class="spinner-sm"></div></div>';
  }
}
