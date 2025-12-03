export class Sidebar {
  constructor() {
    this.isOpen = false;
  }

  render(user) {
    if (!user) return '';
    
    const menuItems = this.getMenuItems(user.role);

    return `
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <h3 class="text-lg font-semibold">${this.getRoleTitle(user.role)}</h3>
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
    if (sidebar) {
      sidebar.classList.toggle('open');
    }
  }
}
