import { Auth } from './auth.js';

// Import all page modules
import { LoginPage } from './pages/login.js';
import { PinLoginPage } from './pages/pin-login.js';
import { PinSetupPage } from './pages/pin-setup.js';
import { StudentDashboardPage } from './pages/student-dashboard.js';
import { NewComplaintPage } from './pages/new-complaint.js';
import { MyComplaintsPage } from './pages/my-complaints.js';
import { ComplaintDetailPage } from './pages/complaint-detail.js';
import { StaffDashboardPage } from './pages/staff-dashboard.js';
import { AssignedComplaintsPage } from './pages/assigned-complaints.js';
import { StaffComplaintDetailPage } from './pages/staff-complaint-detail.js';
import { AdminDashboardPage } from './pages/admin-dashboard.js';
import { UsersListPage } from './pages/users-list.js';
import { UserDetailPage } from './pages/user-detail.js';
import { RolesManagementPage } from './pages/roles-management.js';
import { CategoriesManagementPage } from './pages/categories-management.js';
import { LocationsManagementPage } from './pages/locations-management.js';
import { RoutingRulesPage } from './pages/routing-rules.js';
import { SLARulesPage } from './pages/sla-rules.js';
import { SearchPage } from './pages/search.js';
import { NotificationsPage } from './pages/notifications.js';
import { ProfilePage } from './pages/profile.js';
import { AuditLogPage } from './pages/audit-log.js';
import { BackupRestorePage } from './pages/backup-restore.js';
import { AdminComplaintsPage } from './pages/admin-complaints.js';
import { NotFoundPage } from './pages/not-found.js';

export class Router {
  constructor() {
    this.routes = [];
    this.currentPage = null;
  }

  addRoute(path, pageClass, options = {}) {
    this.routes.push({ path, pageClass, ...options });
  }

  init() {
    // Authentication routes
    this.addRoute('/login', LoginPage, { public: true });
    this.addRoute('/pin-login', PinLoginPage, { public: true });
    this.addRoute('/pin-setup', PinSetupPage, { requireAuth: true });
    
    // Student routes
    this.addRoute('/student/dashboard', StudentDashboardPage, { requireAuth: true, role: 'student' });
    this.addRoute('/student/new-complaint', NewComplaintPage, { requireAuth: true, role: 'student' });
    this.addRoute('/student/complaints', MyComplaintsPage, { requireAuth: true, role: 'student' });
    this.addRoute('/student/complaints/:id', ComplaintDetailPage, { requireAuth: true, role: 'student' });
    
    // Staff routes
    this.addRoute('/staff/dashboard', StaffDashboardPage, { requireAuth: true, role: 'staff' });
    this.addRoute('/staff/complaints', AssignedComplaintsPage, { requireAuth: true, role: 'staff' });
    this.addRoute('/staff/complaints/:id', StaffComplaintDetailPage, { requireAuth: true, role: 'staff' });
    
    // Admin routes
    this.addRoute('/admin/dashboard', AdminDashboardPage, { requireAuth: true, role: 'admin' });
    this.addRoute('/admin/complaints', AdminComplaintsPage, { requireAuth: true, role: 'admin' });
    this.addRoute('/admin/complaints/:id', StaffComplaintDetailPage, { requireAuth: true, role: 'admin' });
    this.addRoute('/admin/users', UsersListPage, { requireAuth: true, role: 'admin' });
    this.addRoute('/admin/users/:id', UserDetailPage, { requireAuth: true, role: 'admin' });
    this.addRoute('/admin/roles', RolesManagementPage, { requireAuth: true, role: 'admin' });
    this.addRoute('/admin/categories', CategoriesManagementPage, { requireAuth: true, role: 'admin' });
    this.addRoute('/admin/locations', LocationsManagementPage, { requireAuth: true, role: 'admin' });
    this.addRoute('/admin/routing-rules', RoutingRulesPage, { requireAuth: true, role: 'admin' });
    this.addRoute('/admin/sla-rules', SLARulesPage, { requireAuth: true, role: 'admin' });
    this.addRoute('/admin/audit-log', AuditLogPage, { requireAuth: true, role: 'admin' });
    this.addRoute('/admin/backup', BackupRestorePage, { requireAuth: true, role: 'admin' });
    
    // Common routes
    this.addRoute('/search', SearchPage, { requireAuth: true });
    this.addRoute('/notifications', NotificationsPage, { requireAuth: true });
    this.addRoute('/profile', ProfilePage, { requireAuth: true });
    this.addRoute('/404', NotFoundPage, { public: true });
    this.addRoute('/', null, { public: true }); // Root redirects
    
    // Handle initial load
    this.handleRoute(window.location.pathname);
    
    // Handle back/forward navigation
    window.addEventListener('popstate', () => {
      this.handleRoute(window.location.pathname);
    });
    
    // Handle link clicks
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-link]')) {
        e.preventDefault();
        this.navigate(e.target.getAttribute('href'));
      }
    });
  }

  navigate(path) {
    window.history.pushState({}, '', path);
    this.handleRoute(path);
  }

  matchRoute(path) {
    for (const route of this.routes) {
      const pattern = route.path.replace(/:[\w]+/g, '([^/]+)');
      const regex = new RegExp(`^${pattern}$`);
      const match = path.match(regex);
      
      if (match) {
        const params = {};
        const paramNames = (route.path.match(/:[\w]+/g) || []).map(p => p.slice(1));
        paramNames.forEach((name, i) => {
          params[name] = match[i + 1];
        });
        return { route, params };
      }
    }
    return null;
  }

  async handleRoute(path) {
    const match = this.matchRoute(path);
    
    if (!match) {
      // No route found, show 404
      this.loadPage(NotFoundPage);
      return;
    }

    const { route, params } = match;

    // Handle root redirect
    if (route.path === '/') {
      if (Auth.isAuthenticated()) {
        Auth.redirectToDashboard();
      } else {
        this.navigate('/login');
      }
      return;
    }

    // Check authentication
    if (route.requireAuth && !Auth.isAuthenticated()) {
      this.navigate('/login');
      return;
    }

    // Check role
    if (route.role && !Auth.hasRole(route.role)) {
      this.navigate('/404');
      return;
    }

    // Redirect authenticated users from public pages
    if (route.public && Auth.isAuthenticated() && ['/login', '/pin-login'].includes(path)) {
      Auth.redirectToDashboard();
      return;
    }

    // Load the page
    if (route.pageClass) {
      await this.loadPage(route.pageClass, params);
    }
  }

  async loadPage(PageClass, params = {}) {
    if (this.currentPage && this.currentPage.destroy) {
      this.currentPage.destroy();
    }

    this.currentPage = new PageClass(params);
    await this.currentPage.render();
  }
}
