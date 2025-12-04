export class Sidebar {
  constructor() {
    this.isOpen = false;
  }

  render(user) {
    if (!user) {
      console.warn('Sidebar.render: No user provided');
      return '';
    }
    
    // Get role from user.role, Auth helper, or extract from roles array
    let role = user.role;
    
    if (!role && window.Auth && window.Auth.getUserRole) {
      role = window.Auth.getUserRole();
    }
    
    // Fallback: extract role directly from roles array
    if (!role && user.roles && user.roles.length > 0) {
      const roleName = user.roles[0];
      if (roleName === 'Super Admin' || roleName === 'Principal' || roleName === 'Vice Principal') {
        role = 'admin';
      } else if (roleName === 'Staff' || roleName === 'Department Head') {
        role = 'staff';
      } else if (roleName === 'Student') {
        role = 'student';
      }
    }
    
    if (!role) {
      console.warn('Sidebar.render: Could not determine role for user:', user);
      return '';
    }
    
    const menuItems = this.getMenuItems(role);

    return `
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <button class="sidebar-toggle" id="sidebar-toggle" aria-label="Toggle sidebar">
            <span class="sidebar-toggle-icon">☰</span>
          </button>
          <h3 class="text-lg font-semibold">${this.getRoleTitle(role)}</h3>
        </div>
        <nav class="sidebar-menu">
          ${menuItems.map(item => `
            <a href="${item.path}" class="sidebar-menu-item ${item.active ? 'active' : ''}" data-link>
              <span class="sidebar-menu-icon">${item.icon}</span>
              ${item.label}
            </a>
          `).join('')}
        </nav>
      </aside>
    `;
  }

  getRoleTitle(role) {
    const titles = {
      student: 'Student Portal',
      staff: 'Staff Portal',
      admin: 'Admin Portal',
    };
    return titles[role] || 'Portal';
  }

  getMenuItems(role) {
    const currentPath = window.location.pathname;

    const menus = {
      student: [
        { path: '/student/dashboard', label: 'Dashboard', icon: '📊', active: currentPath === '/student/dashboard' },
        { path: '/student/new-complaint', label: 'New Complaint', icon: '➕', active: currentPath === '/student/new-complaint' },
        { path: '/student/complaints', label: 'My Complaints', icon: '📋', active: currentPath === '/student/complaints' },
        { path: '/profile', label: 'Profile', icon: '👤', active: currentPath === '/profile' },
      ],
      staff: [
        { path: '/staff/dashboard', label: 'Dashboard', icon: '📊', active: currentPath === '/staff/dashboard' },
        { path: '/staff/complaints', label: 'Assigned Complaints', icon: '📋', active: currentPath === '/staff/complaints' },
        { path: '/profile', label: 'Profile', icon: '👤', active: currentPath === '/profile' },
      ],
      admin: [
        { path: '/admin/dashboard', label: 'Dashboard', icon: '📊', active: currentPath === '/admin/dashboard' },
        { path: '/admin/complaints', label: 'Complaints', icon: '📋', active: currentPath === '/admin/complaints' || currentPath.startsWith('/admin/complaints/') },
        { path: '/admin/users', label: 'Users', icon: '👥', active: currentPath === '/admin/users' },
        { path: '/admin/roles', label: 'Roles', icon: '🔐', active: currentPath === '/admin/roles' },
        { path: '/admin/categories', label: 'Categories', icon: '📁', active: currentPath === '/admin/categories' },
        { path: '/admin/locations', label: 'Locations', icon: '📍', active: currentPath === '/admin/locations' },
        { path: '/admin/routing-rules', label: 'Routing Rules', icon: '🔄', active: currentPath === '/admin/routing-rules' },
        { path: '/admin/sla-rules', label: 'SLA Rules', icon: '⏱️', active: currentPath === '/admin/sla-rules' },
        { path: '/admin/audit-log', label: 'Audit Log', icon: '📝', active: currentPath === '/admin/audit-log' },
        { path: '/admin/backup', label: 'Backup & Restore', icon: '💾', active: currentPath === '/admin/backup' },
        { path: '/profile', label: 'Profile', icon: '👤', active: currentPath === '/profile' },
      ],
    };

    return menus[role] || [];
  }

  toggle() {
    this.isOpen = !this.isOpen;
    const sidebar = document.getElementById('sidebar');
    const app = document.getElementById('app');
    const navbar = document.querySelector('.navbar');
    
    if (sidebar) {
      // On mobile, use 'open' class for slide in/out
      if (window.innerWidth <= 1024) {
        sidebar.classList.toggle('open');
      } else {
        // On desktop, use 'collapsed' class for collapse/expand
        sidebar.classList.toggle('collapsed');
        if (app) {
          app.classList.toggle('sidebar-collapsed');
        }
        if (navbar) {
          navbar.classList.toggle('sidebar-collapsed');
        }
      }
    }
  }

  attachEvents() {
    // Attach toggle button event
    const toggleBtn = document.getElementById('sidebar-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.toggle();
      });
    }
  }
}
