import { Router } from './router.js';
import { API } from './api.js';
import { Store } from './store.js';
import { Navbar } from './components/navbar.js';
import { Sidebar } from './components/sidebar.js';
import { Toast } from './components/toast.js';

class App {
  constructor() {
    this.router = new Router();
    this.api = new API();
    this.store = new Store();
    this.navbar = new Navbar();
    this.sidebar = new Sidebar();

    // Make instances globally available
    window.app = this;
    window.api = this.api;
    window.store = this.store;
    window.router = this.router;

    this.init();
  }

  async init() {
    // Hide loading screen
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
      loadingEl.style.display = 'none';
    }

    // Initialize Toast
    Toast.init();

    // Check authentication and load user (only if token exists and not on public pages)
    const token = localStorage.getItem('token');
    const publicPaths = ['/login', '/pin-login', '/register'];
    const currentPath = window.location.pathname;
    
    if (token && !publicPaths.includes(currentPath)) {
      try {
        const user = await this.api.getCurrentUser();
        this.store.setUser(user);
      } catch (error) {
        console.error('Failed to load user:', error);
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect to login if not already there
        if (!publicPaths.includes(currentPath)) {
          window.location.href = '/login';
        }
      }
    }

    // Subscribe to store changes to update navbar/sidebar
    this.store.subscribe((state) => {
      this.updateLayout(state.user);
    });

    // Initialize router
    this.router.init();

    // Initial layout update
    this.updateLayout(this.store.getUser());
  }

  updateLayout(user) {
    // Update navbar
    const existingNavbar = document.querySelector('.navbar');
    if (existingNavbar) {
      existingNavbar.remove();
    }

    if (user || window.location.pathname === '/login' || window.location.pathname === '/pin-login') {
      document.body.insertAdjacentHTML('afterbegin', this.navbar.render(user));
      this.navbar.attachEvents();
    }

    // Update sidebar
    const existingSidebar = document.querySelector('.sidebar');
    if (existingSidebar) {
      existingSidebar.remove();
    }

    if (user && !['/login', '/pin-login', '/pin-setup', '/404'].includes(window.location.pathname)) {
      document.body.insertAdjacentHTML('afterbegin', this.sidebar.render(user));
      
      // Add sidebar class to app layout if needed
      const app = document.getElementById('app');
      if (app && user) {
        app.classList.add('with-sidebar');
      }
    } else {
      const app = document.getElementById('app');
      if (app) {
        app.classList.remove('with-sidebar');
      }
    }
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new App());
} else {
  new App();
}
