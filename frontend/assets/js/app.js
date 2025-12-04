import { Router } from './router.js';
import { API } from './api.js';
import { Store } from './store.js';
import { Auth } from './auth.js';
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
    
    // First, try to get user from localStorage (from login response)
    const storedUser = Auth.getUser();
    if (storedUser) {
      this.store.setUser(storedUser);
    }
    
    // If we have a token but no user data, fetch from API
    if (token && !storedUser && !publicPaths.includes(currentPath)) {
      try {
        const user = await this.api.getCurrentUser();
        Auth.setUser(user);
        this.store.setUser(user);
      } catch (error) {
        console.error('Failed to load user:', error);
        // Only clear token if it's a clear authentication error
        const errorMsg = (error.message || '').toLowerCase();
        // Don't logout on 422 if we're on a public page or if it might be a temporary issue
        if (errorMsg.includes('token has expired') || 
            errorMsg.includes('authorization token is missing')) {
          Auth.logout();
          if (!publicPaths.includes(currentPath)) {
            window.location.href = '/login';
          }
        } else {
          // For other errors (422, network issues), just log and continue
          console.warn('Could not validate token, but continuing with cached data if available');
        }
      }
    } else if (token && storedUser) {
      // We have both token and user from localStorage
      // Validate token in background, but clear if invalid
      this.api.getCurrentUser().then(user => {
        // Token is valid, update user data silently
        Auth.setUser(user);
        this.store.setUser(user);
      }).catch(error => {
        // Token validation failed - check if it's an invalid token error
        const errorMsg = (error.message || '').toLowerCase();
        if (errorMsg.includes('invalid token') || 
            errorMsg.includes('subject must be a string') ||
            errorMsg.includes('token') && errorMsg.includes('invalid')) {
          // Clear invalid token and redirect to login
          console.warn('Invalid token detected, clearing and redirecting to login');
          Auth.logout();
          if (!publicPaths.includes(currentPath)) {
            setTimeout(() => {
              window.location.href = '/login';
            }, 100);
          }
        } else if (errorMsg.includes('token has expired')) {
          // Only logout on actual expiration
          console.warn('Token expired, redirecting to login');
          Auth.logout();
          if (!publicPaths.includes(currentPath)) {
            setTimeout(() => {
              window.location.href = '/login';
            }, 100);
          }
        } else {
          console.warn('Token validation failed, using cached user data:', errorMsg);
        }
      });
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
      // Ensure user has role property - get it from Auth helper or extract from roles array
      if (!user.role) {
        if (window.Auth && window.Auth.getUserRole) {
          user.role = window.Auth.getUserRole();
        } else if (user.roles && user.roles.length > 0) {
          // Fallback: extract role directly from roles array
          const roleName = user.roles[0];
          if (roleName === 'Super Admin' || roleName === 'Principal' || roleName === 'Vice Principal') {
            user.role = 'admin';
          } else if (roleName === 'Staff' || roleName === 'Department Head') {
            user.role = 'staff';
          } else if (roleName === 'Student') {
            user.role = 'student';
          }
        }
      }
      
      // Only render sidebar if we have a valid role
      if (user.role) {
        const sidebarHTML = this.sidebar.render(user);
        if (sidebarHTML) {
          document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
          this.sidebar.attachEvents();
          
          // Auto-open sidebar on first login for new users
          const sidebarOpened = localStorage.getItem('sidebar_opened');
          if (!sidebarOpened && window.innerWidth <= 1024) {
            // On mobile, open sidebar on first login
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
              sidebar.classList.add('open');
              this.sidebar.isOpen = true;
              localStorage.setItem('sidebar_opened', 'true');
            }
          }
        }
      }
      
      // Add sidebar class to app layout if needed
      const app = document.getElementById('app');
      const navbar = document.querySelector('.navbar');
      if (app && user && user.role) {
        app.classList.add('with-sidebar');
        if (navbar) {
          navbar.classList.add('with-sidebar');
        }
      } else if (app) {
        app.classList.remove('with-sidebar', 'sidebar-collapsed');
        if (navbar) {
          navbar.classList.remove('with-sidebar', 'sidebar-collapsed');
        }
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
function initApp() {
  try {
    new App();
  } catch (error) {
    console.error('Failed to initialize app:', error);
    // Hide loading screen even on error
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
      loadingEl.style.display = 'none';
    }
    // Show error message
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <div class="main-content" style="padding: 2rem; text-align: center;">
          <div class="alert alert-error">
            <h2>Failed to Load Application</h2>
            <p>${error.message || 'An error occurred while loading the application.'}</p>
            <p>Please refresh the page or contact support if the problem persists.</p>
            <button onclick="window.location.reload()" class="btn btn-primary" style="margin-top: 1rem;">
              Reload Page
            </button>
          </div>
        </div>
      `;
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Also hide loading screen if modules fail to load after a timeout
setTimeout(() => {
  const loadingEl = document.getElementById('loading');
  if (loadingEl && loadingEl.style.display !== 'none' && !window.app) {
    console.warn('App initialization timeout - hiding loading screen');
    loadingEl.style.display = 'none';
  }
}, 10000); // 10 second timeout
