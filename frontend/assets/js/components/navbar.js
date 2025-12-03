export class Navbar {
  constructor() {
    this.element = null;
  }

  render(user = null) {
    const navItems = user ? this.getNavItems(user.role) : [];

    return `
      <nav class="navbar">
        <a href="/" class="navbar-brand" data-link>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
            <rect width="32" height="32" rx="6" fill="currentColor"/>
            <text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="Arial" font-size="18" fill="white">S</text>
          </svg>
          Student Complaint Hub
        </a>
        
        <div class="navbar-nav">
          ${navItems.map(item => `
            <a href="${item.path}" class="navbar-item ${item.active ? 'active' : ''}" data-link>
              ${item.label}
            </a>
          `).join('')}
          
          ${user ? `
            <div class="dropdown">
              <button class="btn btn-ghost dropdown-toggle" id="userDropdown">
                ${this.getUserInitials(user.name || user.username)}
              </button>
              <div class="dropdown-menu" id="userDropdownMenu">
                <a href="/profile" class="dropdown-item" data-link>Profile</a>
                <a href="/notifications" class="dropdown-item" data-link>Notifications</a>
                <div class="dropdown-divider"></div>
                <a href="#" class="dropdown-item" id="logoutBtn">Logout</a>
              </div>
            </div>
          ` : `
            <a href="/login" class="btn btn-primary" data-link>Login</a>
          `}
        </div>
      </nav>
    `;
  }

  getNavItems(role) {
    const currentPath = window.location.pathname;
    
    const commonItems = [
      { path: '/search', label: 'Search', active: currentPath === '/search' },
    ];

    const roleItems = {
      student: [
        { path: '/student/dashboard', label: 'Dashboard', active: currentPath === '/student/dashboard' },
        { path: '/student/complaints', label: 'My Complaints', active: currentPath === '/student/complaints' },
        { path: '/student/new-complaint', label: 'New Complaint', active: currentPath === '/student/new-complaint' },
      ],
      staff: [
        { path: '/staff/dashboard', label: 'Dashboard', active: currentPath === '/staff/dashboard' },
        { path: '/staff/complaints', label: 'Assigned Complaints', active: currentPath === '/staff/complaints' },
      ],
      admin: [
        { path: '/admin/dashboard', label: 'Dashboard', active: currentPath === '/admin/dashboard' },
        { path: '/admin/users', label: 'Users', active: currentPath === '/admin/users' },
        { path: '/admin/settings', label: 'Settings', active: currentPath.startsWith('/admin/settings') },
      ],
    };

    return [...(roleItems[role] || []), ...commonItems];
  }

  getUserInitials(name) {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  attachEvents() {
    // Dropdown toggle
    const dropdownToggle = document.getElementById('userDropdown');
    const dropdownMenu = document.getElementById('userDropdownMenu');
    
    if (dropdownToggle && dropdownMenu) {
      dropdownToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', () => {
        dropdownMenu.classList.remove('show');
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleLogout();
      });
    }
  }

  handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
}
