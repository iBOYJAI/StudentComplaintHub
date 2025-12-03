// ============================================
// Modern Student Complaint Hub - JavaScript
// ============================================

// Development mode flag
const DEV_MODE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Console log helper (only logs in development)
const devLog = (...args) => {
    if (DEV_MODE) console.log(...args);
};

const devWarn = (...args) => {
    if (DEV_MODE) console.warn(...args);
};

const devError = (...args) => {
    if (DEV_MODE) console.error(...args);
};

// Offline Detection
const OfflineManager = {
    isOnline: navigator.onLine,
    
    init() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            Utils.showToast('Connection restored', 'success');
            this.checkServerConnection();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            Utils.showToast('Working offline', 'info');
        });
        
        // Check server on load
        this.checkServerConnection();
    },
    
    async checkServerConnection() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/health`, { 
                method: 'GET',
                signal: AbortSignal.timeout(3000)
            });
            if (response.ok) {
                this.isOnline = true;
                return true;
            }
        } catch (error) {
            this.isOnline = false;
            devWarn('Server not reachable, working offline');
        }
        return false;
    }
};

// Notification Manager
const NotificationManager = {
    permission: null,
    
    async init() {
        if ('Notification' in window) {
            this.permission = Notification.permission;
            
            if (this.permission === 'default') {
                // Request permission on first interaction
                document.addEventListener('click', () => {
                    this.requestPermission();
                }, { once: true });
            }
        }
    },
    
    async requestPermission() {
        if ('Notification' in window && this.permission === 'default') {
            this.permission = await Notification.requestPermission();
        }
    },
    
    show(title, options = {}) {
        // System notification
        if ('Notification' in window && this.permission === 'granted') {
            const notification = new Notification(title, {
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: options.tag || 'complaint-hub',
                requireInteraction: options.requireInteraction || false,
                ...options
            });
            
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
            
            // Auto close after 5 seconds
            setTimeout(() => notification.close(), 5000);
        }
        
        // Web app notification (toast)
        Utils.showToast(title, options.type || 'info');
    },
    
    notifyNewComplaint(complaint) {
        const message = `New post from ${complaint.creator_name || 'Unknown User'}`;
        this.show(message, {
            body: complaint.title,
            type: 'info',
            tag: `complaint-${complaint.id}`,
            requireInteraction: false
        });
        
        // Store in IndexedDB for offline viewing
        this.storeNotification({
            type: 'new_post',
            title: message,
            body: complaint.title,
            entity_id: complaint.id,
            created_at: new Date().toISOString()
        });
    },
    
    async storeNotification(notification) {
        // Store notification in IndexedDB for offline access
        if ('indexedDB' in window) {
            try {
                const db = await this.getDB();
                const tx = db.transaction(['notifications'], 'readwrite');
                await tx.objectStore('notifications').add(notification);
            } catch (error) {
                devError('Failed to store notification:', error);
            }
        }
    },
    
    async getDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('ComplaintHubDB', 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('notifications')) {
                    db.createObjectStore('notifications', { keyPath: 'id', autoIncrement: true });
                }
            };
        });
    },
    
    notifyStatusUpdate(complaint, newStatus) {
        this.show(`Complaint Updated: ${complaint.title}`, {
            body: `Status changed to ${newStatus}`,
            type: 'success',
            tag: `complaint-${complaint.id}`
        });
    }
};

// API Configuration
const API_BASE_URL = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1') 
    ? 'http://localhost:8000' 
    : window.location.origin;
const API_ENDPOINTS = {
    auth: {
        login: '/api/auth/login',
        register: '/api/auth/register',
        me: '/api/auth/me'
    },
    complaints: {
        list: '/api/complaints',
        create: '/api/complaints',
        get: (id) => `/api/complaints/${id}`,
        update: (id) => `/api/complaints/${id}`,
        vote: (id) => `/api/complaints/${id}/vote`,
        like: (id) => `/api/complaints/${id}/like`,
        comments: (id) => `/api/complaints/${id}/comments`
    },
    users: {
        get: (id) => `/api/users/${id}`,
        follow: (id) => `/api/users/${id}/follow`,
        followers: (id) => `/api/users/${id}/followers`,
        following: (id) => `/api/users/${id}/following`,
        settings: (id) => `/api/users/${id}/settings`
    },
    dashboard: {
        stats: '/api/dashboard/stats'
    },
    admin: {
        categories: '/api/admin/categories',
        locations: '/api/admin/locations'
    }
};

// ============================================
// State Management
// ============================================

const AppState = {
    currentUser: null,
    token: null,
    currentPage: 'dashboard',
    complaints: [],
    categories: [],
    locations: [],
    dashboardStats: null,
    filters: {
        status: null,
        priority: null,
        category: null,
        search: ''
    }
};

// ============================================
// Utility Functions
// ============================================

const Utils = {
    // API Request Helper
    async apiRequest(url, options = {}) {
        // Check if we have a token
        if (!AppState.token && url !== API_ENDPOINTS.auth.login && url !== API_ENDPOINTS.auth.register) {
            // Try to get token from localStorage
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                AppState.token = storedToken;
            } else {
                // No token, redirect to login
                Auth.navigateToLogin();
                throw new Error('Not authenticated. Please login.');
            }
        }

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (AppState.token) {
            headers['Authorization'] = `Bearer ${AppState.token}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${url}`, {
                ...options,
                headers
            });

            // Handle 401 Unauthorized
            if (response.status === 401) {
                // Token expired or invalid, clear and redirect to login
                AppState.token = null;
                AppState.currentUser = null;
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                Auth.navigateToLogin();
                throw new Error('Session expired. Please login again.');
            }

            if (!response.ok) {
                // Handle 404 gracefully for missing endpoints
                if (response.status === 404) {
                    devWarn(`API endpoint not found: ${url}`);
                    // Return empty/default data instead of throwing
                    if (url.includes('/followers') || url.includes('/following')) {
                        return { count: 0, items: [] };
                    }
                    if (url.includes('/comments')) {
                        return { items: [] };
                    }
                    if (url.includes('/like')) {
                        return { success: false, message: 'Like endpoint not available' };
                    }
                    // For other 404s, return null or empty object
                    return null;
                }
                const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
                throw new Error(error.detail || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            // Network error - check if offline
            if (!navigator.onLine || error.name === 'TypeError') {
                Utils.showToast('Cannot connect to server. Working offline.', 'warning');
                // Return default data for offline mode
                if (url.includes('/followers') || url.includes('/following')) {
                    return { count: 0, items: [] };
                }
                if (url.includes('/comments')) {
                    return { items: [] };
                }
                return null;
            }
            // For 404 errors, don't show error toast, just log
            if (error.message && error.message.includes('404')) {
                devWarn('API endpoint not available:', url);
                return null;
            }
            devError('API Request Error:', error);
            throw error;
        }
    },

    // File Upload Helper
    async uploadFile(url, formData) {
        const headers = {};
        if (AppState.token) {
            headers['Authorization'] = `Bearer ${AppState.token}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${url}`, {
                method: 'POST',
                headers,
                body: formData
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
                throw new Error(error.detail || `HTTP ${response.status}`);
            }

            return await response.json();
            } catch (error) {
                devError('Upload Error:', error);
            throw error;
        }
    },

    // Format Date
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    },

    // Format Relative Time
    formatRelativeTime(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return this.formatDate(dateString);
    },

    // Get User Initials
    getUserInitials(name) {
        if (!name) return 'U';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    },

    // Show Toast Notification
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        }[type] || 'ℹ';

        toast.innerHTML = `
            <span style="font-size: 20px; color: var(--${type === 'success' ? 'success' : type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'info'});">${icon}</span>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Show Loading
    showLoading(show = true) {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.style.display = show ? 'flex' : 'none';
        }
    },

    // Debounce Function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// ============================================
// Authentication
// ============================================

const Auth = {
    async login(username, password) {
        try {
            const response = await Utils.apiRequest(API_ENDPOINTS.auth.login, {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });

            AppState.token = response.access_token;
            AppState.currentUser = response.user;
            
            localStorage.setItem('token', response.access_token);
            localStorage.setItem('user', JSON.stringify(response.user));

            this.updateUI();
            this.navigateToMain();
            
            // Show notifications
            Utils.showToast('Login successful!', 'success');
            NotificationManager.show('Welcome back!', {
                body: `Logged in as ${response.user.full_name || response.user.username}`,
                type: 'success'
            });
            
            return true;
        } catch (error) {
            Utils.showToast(error.message || 'Login failed', 'error');
            return false;
        }
    },

    logout() {
        AppState.token = null;
        AppState.currentUser = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.navigateToLogin();
        Utils.showToast('Logged out successfully', 'info');
    },

    async checkAuth() {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
            AppState.token = token;
            try {
                AppState.currentUser = JSON.parse(userStr);
            } catch (e) {
                // Invalid JSON, clear and show login
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                this.navigateToLogin();
                return false;
            }
            
            // Verify token is still valid by calling /api/auth/me
            try {
                const userInfo = await Utils.apiRequest(API_ENDPOINTS.auth.me);
                AppState.currentUser = userInfo;
                localStorage.setItem('user', JSON.stringify(userInfo));
                this.updateUI();
                this.navigateToMain();
                return true;
            } catch (error) {
                // Token invalid, clear and show login
                AppState.token = null;
                AppState.currentUser = null;
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                this.navigateToLogin();
                return false;
            }
        }
        this.navigateToLogin();
        return false;
    },

    updateUI() {
        if (AppState.currentUser) {
            const userNameEl = document.getElementById('user-name');
            const userRoleEl = document.getElementById('user-role');
            const userInitialsEl = document.getElementById('user-initials');
            
            if (userNameEl) userNameEl.textContent = AppState.currentUser.full_name || AppState.currentUser.username;
            if (userRoleEl) {
                const roles = AppState.currentUser.roles || [];
                userRoleEl.textContent = roles[0] || 'User';
            }
            if (userInitialsEl) {
                userInitialsEl.textContent = Utils.getUserInitials(AppState.currentUser.full_name || AppState.currentUser.username);
            }

            // Role-based navigation visibility
            const userRoles = AppState.currentUser.roles || [];
            const isAdmin = userRoles.some(r => ['Admin', 'Super Admin'].includes(r));
            const isStaff = userRoles.some(r => ['Staff', 'Department Head', 'Vice Principal', 'Principal'].includes(r));
            const isStudent = userRoles.includes('Student') && !isStaff && !isAdmin;

            // Show/hide admin nav
            const adminNav = document.querySelector('.admin-only');
            if (adminNav) {
                adminNav.style.display = isAdmin ? 'flex' : 'none';
            }

            // Update sidebar based on role
            const feedNav = document.querySelector('[data-page="feed"]');
            const profileNav = document.querySelector('[data-page="profile"]');
            
            // All roles can see feed and profile
            if (feedNav) feedNav.style.display = 'flex';
            if (profileNav) profileNav.style.display = 'flex';

            // Update user card styling based on role
            const userCard = document.querySelector('.user-card');
            if (userCard) {
                if (isAdmin) {
                    userCard.style.borderLeft = '3px solid var(--error)';
                } else if (isStaff) {
                    userCard.style.borderLeft = '3px solid var(--warning)';
                } else {
                    userCard.style.borderLeft = '3px solid var(--primary)';
                }
            }
        }
    },

    navigateToLogin() {
        const loginPage = document.getElementById('login-page');
        const mainApp = document.getElementById('main-app');
        if (loginPage) {
            loginPage.classList.add('active');
            loginPage.style.display = 'flex';
        }
        if (mainApp) {
            mainApp.classList.remove('active');
            mainApp.style.display = 'none';
        }
        // Prevent body scroll when on login page
        document.body.style.overflow = 'hidden';
    },

    navigateToMain() {
        const loginPage = document.getElementById('login-page');
        const mainApp = document.getElementById('main-app');
        if (loginPage) {
            loginPage.classList.remove('active');
            loginPage.style.display = 'none';
        }
        if (mainApp) {
            mainApp.classList.add('active');
            mainApp.style.display = 'flex';
        }
        // Allow body scroll when in main app
        document.body.style.overflow = '';
    }
};

// ============================================
// Page Navigation
// ============================================

const Navigation = {
    init() {
        // Nav item clicks
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.navigateToPage(page);
            });
        });

        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                document.getElementById('sidebar').classList.toggle('active');
            });
        }
    },

    navigateToPage(page) {
        AppState.currentPage = page;
        
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            complaints: 'All Complaints',
            'my-complaints': 'My Complaints',
            feed: 'Feed',
            profile: 'Profile',
            admin: 'Admin Panel'
        };
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) pageTitle.textContent = titles[page] || 'Dashboard';

        // Load page content
        this.loadPageContent(page);
    },

    async loadPageContent(page) {
        Utils.showLoading(true);
        const contentArea = document.getElementById('content-area');
        
        try {
            switch (page) {
                case 'dashboard':
                    await Dashboard.render();
                    break;
                case 'complaints':
                    await Complaints.render();
                    break;
                case 'my-complaints':
                    await Complaints.render(true);
                    break;
                case 'feed':
                    await Feed.render();
                    break;
                case 'profile':
                    await Profile.render();
                    break;
                case 'admin':
                    await Admin.render();
                    break;
                default:
                    contentArea.innerHTML = '<p>Page not found</p>';
            }
        } catch (error) {
            contentArea.innerHTML = `<div class="card"><p style="color: var(--error);">Error loading page: ${error.message}</p></div>`;
            Utils.showToast('Failed to load page', 'error');
        } finally {
            Utils.showLoading(false);
        }
    }
};

// ============================================
// Dashboard
// ============================================

const Dashboard = {
    async render() {
        const contentArea = document.getElementById('content-area');
        const userRoles = AppState.currentUser?.roles || [];
        const isStudent = userRoles.includes('Student') && !userRoles.some(r => ['Staff', 'Admin'].includes(r));
        const isStaff = userRoles.includes('Staff') || userRoles.includes('Department Head') || userRoles.includes('Vice Principal') || userRoles.includes('Principal');
        const isAdmin = userRoles.includes('Admin') || userRoles.includes('Super Admin');
        
        try {
            // Load stats
            const stats = await Utils.apiRequest(API_ENDPOINTS.dashboard.stats).catch(() => ({
                total_complaints: 0,
                open_complaints: 0,
                closed_complaints: 0,
                overdue_complaints: 0,
                my_complaints: 0
            }));
            AppState.dashboardStats = stats;

            // Load recent complaints
            const complaintsResponse = await Utils.apiRequest(
                `${API_ENDPOINTS.complaints.list}?page=1&page_size=5`
            ).catch(() => ({ items: [] }));

            if (isAdmin) {
                contentArea.innerHTML = this.renderAdminDashboard(stats, complaintsResponse.items || []);
            } else if (isStaff) {
                contentArea.innerHTML = this.renderStaffDashboard(stats, complaintsResponse.items || []);
            } else {
                contentArea.innerHTML = this.renderStudentDashboard(stats, complaintsResponse.items || []);
            }
        } catch (error) {
            contentArea.innerHTML = `
                <div class="card">
                    <p style="color: var(--error);">Error loading dashboard: ${error.message}</p>
                </div>
            `;
        }
    },

    renderStudentDashboard(stats, recentComplaints) {
        return `
            <div class="dashboard-header">
                <h2>Welcome back, ${AppState.currentUser?.full_name || 'User'}!</h2>
                <p class="text-sm" style="color: var(--gray-500);">Here's what's happening with your complaints</p>
            </div>

            <div class="grid grid-4" style="margin-bottom: var(--spacing-xl);">
                <div class="stat-card">
                    <div class="stat-value">${stats.my_complaints || 0}</div>
                    <div class="stat-label">My Complaints</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.open_complaints || 0}</div>
                    <div class="stat-label">Open</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.closed_complaints || 0}</div>
                    <div class="stat-label">Resolved</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.overdue_complaints || 0}</div>
                    <div class="stat-label">Pending</div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">My Recent Complaints</h3>
                    <a href="#my-complaints" class="link" onclick="Navigation.navigateToPage('my-complaints')">View All</a>
                </div>
                <div id="recent-complaints">
                    ${this.renderComplaintsList(recentComplaints)}
                </div>
            </div>
        `;
    },

    renderStaffDashboard(stats, recentComplaints) {
        return `
            <div class="dashboard-header">
                <h2>Staff Dashboard</h2>
                <p class="text-sm" style="color: var(--gray-500);">Manage assigned complaints and track resolution progress</p>
            </div>

            <div class="grid grid-4" style="margin-bottom: var(--spacing-xl);">
                <div class="stat-card">
                    <div class="stat-value">${stats.total_complaints || 0}</div>
                    <div class="stat-label">Total Complaints</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.open_complaints || 0}</div>
                    <div class="stat-label">Assigned to Me</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.closed_complaints || 0}</div>
                    <div class="stat-label">Resolved</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.overdue_complaints || 0}</div>
                    <div class="stat-label">Overdue</div>
                </div>
            </div>

            <div class="grid grid-2" style="margin-bottom: var(--spacing-xl);">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Assigned Complaints</h3>
                        <a href="#complaints" class="link" onclick="Navigation.navigateToPage('complaints')">View All</a>
                    </div>
                    <div id="assigned-complaints">
                        ${this.renderComplaintsList(recentComplaints.filter(c => c.assigned_to === AppState.currentUser?.id))}
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Recent Activity</h3>
                    </div>
                    <div style="padding: var(--spacing-md);">
                        <p style="color: var(--gray-500);">Activity feed coming soon</p>
                    </div>
                </div>
            </div>
        `;
    },

    renderAdminDashboard(stats, recentComplaints) {
        return `
            <div class="dashboard-header">
                <h2>Admin Dashboard</h2>
                <p class="text-sm" style="color: var(--gray-500);">Complete system overview and management</p>
            </div>

            <div class="grid grid-4" style="margin-bottom: var(--spacing-xl);">
                <div class="stat-card">
                    <div class="stat-value">${stats.total_complaints || 0}</div>
                    <div class="stat-label">Total Complaints</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.open_complaints || 0}</div>
                    <div class="stat-label">Open</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.closed_complaints || 0}</div>
                    <div class="stat-label">Closed</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.overdue_complaints || 0}</div>
                    <div class="stat-label">Overdue</div>
                </div>
            </div>

            <div class="grid grid-3" style="margin-bottom: var(--spacing-xl);">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Recent Complaints</h3>
                        <a href="#complaints" class="link" onclick="Navigation.navigateToPage('complaints')">View All</a>
                    </div>
                    <div id="recent-complaints">
                        ${this.renderComplaintsList(recentComplaints)}
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Quick Actions</h3>
                    </div>
                    <div style="padding: var(--spacing-md); display: flex; flex-direction: column; gap: var(--spacing-sm);">
                        <button class="btn btn-primary" onclick="Navigation.navigateToPage('admin')">
                            Manage Categories
                        </button>
                        <button class="btn btn-secondary" onclick="Admin.showUsers()">
                            Manage Users
                        </button>
                        <button class="btn btn-secondary" onclick="Admin.showSystemSettings()">
                            System Settings
                        </button>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">System Status</h3>
                    </div>
                    <div style="padding: var(--spacing-md);">
                        <div style="margin-bottom: var(--spacing-sm);">
                            <strong>Status:</strong> <span style="color: var(--success);">●</span> Online
                        </div>
                        <div style="margin-bottom: var(--spacing-sm);">
                            <strong>Users:</strong> Active
                        </div>
                        <div>
                            <strong>Last Sync:</strong> ${new Date().toLocaleTimeString()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderComplaintsList(complaints) {
        if (complaints.length === 0) {
            return '<p style="color: var(--gray-500); text-align: center; padding: var(--spacing-xl);">No complaints found</p>';
        }

        return complaints.map(complaint => `
            <div class="complaint-card" onclick="Complaints.showDetail(${complaint.id})">
                <div class="complaint-header">
                    <div style="flex: 1;">
                        <div class="complaint-title">${complaint.title}</div>
                        <div class="complaint-meta">
                            <span>${Utils.formatRelativeTime(complaint.created_at)}</span>
                            <span class="badge badge-status-${complaint.status.toLowerCase().replace(' ', '-')}">${complaint.status}</span>
                            <span class="badge badge-priority-${complaint.priority.toLowerCase()}">${complaint.priority}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }
};

// ============================================
// Complaints
// ============================================

const Complaints = {
    async render(myComplaintsOnly = false) {
        const contentArea = document.getElementById('content-area');
        
        try {
            // Build query string
            const params = new URLSearchParams({
                page: '1',
                page_size: '20'
            });

            if (myComplaintsOnly) {
                params.append('created_by', AppState.currentUser.id);
            }

            if (AppState.filters.status) params.append('status', AppState.filters.status);
            if (AppState.filters.priority) params.append('priority', AppState.filters.priority);
            if (AppState.filters.category) params.append('category_id', AppState.filters.category);
            if (AppState.filters.search) params.append('search', AppState.filters.search);

            const response = await Utils.apiRequest(`${API_ENDPOINTS.complaints.list}?${params}`);
            AppState.complaints = response.items || [];

            contentArea.innerHTML = `
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">${myComplaintsOnly ? 'My Complaints' : 'All Complaints'}</h3>
                        <div style="display: flex; gap: var(--spacing-md);">
                            <select id="filter-status" class="input-wrapper" style="padding: var(--spacing-sm); border: 2px solid var(--gray-200); border-radius: var(--radius-md);">
                                <option value="">All Status</option>
                                <option value="New">New</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                                <option value="Closed">Closed</option>
                            </select>
                            <select id="filter-priority" class="input-wrapper" style="padding: var(--spacing-sm); border: 2px solid var(--gray-200); border-radius: var(--radius-md);">
                                <option value="">All Priority</option>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Urgent">Urgent</option>
                            </select>
                        </div>
                    </div>
                    <div id="complaints-list">
                        ${this.renderComplaintsList(AppState.complaints, myComplaintsOnly)}
                    </div>
                </div>
            `;

            // Attach filter listeners
            document.getElementById('filter-status')?.addEventListener('change', (e) => {
                AppState.filters.status = e.target.value || null;
                this.render(myComplaintsOnly);
            });

            document.getElementById('filter-priority')?.addEventListener('change', (e) => {
                AppState.filters.priority = e.target.value || null;
                this.render(myComplaintsOnly);
            });
        } catch (error) {
            contentArea.innerHTML = `
                <div class="card">
                    <p style="color: var(--error);">Error loading complaints: ${error.message}</p>
                </div>
            `;
        }
    },

    renderComplaintsList(complaints, showActions = false) {
        if (complaints.length === 0) {
            return '<p style="color: var(--gray-500); text-align: center; padding: var(--spacing-xl);">No complaints found</p>';
        }

        const isAdmin = AppState.currentUser?.roles?.includes('Admin') || AppState.currentUser?.roles?.includes('Staff');

        return complaints.map(complaint => {
            const isOwner = complaint.created_by === AppState.currentUser?.id;
            const canEdit = isOwner || isAdmin;
            const canDelete = isOwner || isAdmin;

            return `
            <div class="complaint-card" data-complaint-id="${complaint.id}">
                <div class="complaint-header">
                    <div style="flex: 1; cursor: pointer;" onclick="Complaints.showDetail(${complaint.id})">
                        <div class="complaint-title">${complaint.title}</div>
                        <div class="complaint-meta">
                            <span>${complaint.category_name || 'Uncategorized'}</span>
                            <span>•</span>
                            <span>${Utils.formatRelativeTime(complaint.created_at)}</span>
                            <span>•</span>
                            <span onclick="event.stopPropagation(); Profile.render(${complaint.created_by})" 
                                  style="cursor: pointer; color: var(--primary);">${complaint.creator_name || 'Anonymous'}</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: var(--spacing-sm); align-items: center;">
                        <span class="badge badge-status-${complaint.status.toLowerCase().replace(' ', '-')}">${complaint.status}</span>
                        <span class="badge badge-priority-${complaint.priority.toLowerCase()}">${complaint.priority}</span>
                        ${showActions && canEdit ? `
                            <button class="btn-icon complaint-action-btn" onclick="event.stopPropagation(); Complaints.editComplaint(${complaint.id})" title="Edit">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                        ` : ''}
                        ${showActions && canDelete ? `
                            <button class="btn-icon complaint-action-btn" onclick="event.stopPropagation(); Complaints.deleteComplaint(${complaint.id})" title="Delete" style="color: var(--error);">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        ` : ''}
                    </div>
                </div>
                <p style="color: var(--gray-600); margin-top: var(--spacing-md); line-height: 1.5; cursor: pointer;" onclick="Complaints.showDetail(${complaint.id})">
                    ${complaint.description?.substring(0, 150)}${complaint.description?.length > 150 ? '...' : ''}
                </p>
            </div>
        `;
        }).join('');
    },

    async showDetail(id) {
        try {
            const complaint = await Utils.apiRequest(API_ENDPOINTS.complaints.get(id));
            const isAdmin = AppState.currentUser?.roles?.includes('Admin') || AppState.currentUser?.roles?.includes('Staff');
            
            const modal = document.getElementById('detail-modal');
            const content = document.getElementById('detail-content');
            const title = document.getElementById('detail-title');

            title.textContent = complaint.title;
            content.innerHTML = `
                <div style="margin-bottom: var(--spacing-lg);">
                    <div style="display: flex; gap: var(--spacing-md); margin-bottom: var(--spacing-md);">
                        <span class="badge badge-status-${complaint.status.toLowerCase().replace(' ', '-')}">${complaint.status}</span>
                        <span class="badge badge-priority-${complaint.priority.toLowerCase()}">${complaint.priority}</span>
                    </div>
                    ${isAdmin ? `
                        <div style="margin-bottom: var(--spacing-md); padding: var(--spacing-md); background: var(--gray-50); border-radius: var(--radius-md);">
                            <h4 style="margin-bottom: var(--spacing-sm);">Admin Actions</h4>
                            <div style="display: flex; gap: var(--spacing-sm); flex-wrap: wrap; margin-bottom: var(--spacing-sm);">
                                <select id="update-status" class="input-wrapper" style="flex: 1; min-width: 150px; padding: var(--spacing-sm);">
                                    <option value="">Update Status</option>
                                    <option value="New">New</option>
                                    <option value="Acknowledged">Acknowledged</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Resolved">Resolved</option>
                                    <option value="Closed">Closed</option>
                                </select>
                                <select id="update-priority" class="input-wrapper" style="flex: 1; min-width: 150px; padding: var(--spacing-sm);">
                                    <option value="">Update Priority</option>
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Urgent">Urgent</option>
                                </select>
                                <button class="btn btn-primary" onclick="Complaints.updateStatus(${complaint.id})" style="flex: 1; min-width: 120px;">
                                    Update
                                </button>
                            </div>
                            <div style="margin-top: var(--spacing-sm);">
                                <label style="display: block; margin-bottom: var(--spacing-xs); font-size: var(--font-size-sm);">Add Poll</label>
                                <button class="btn btn-secondary" onclick="Complaints.addPoll(${complaint.id})" style="width: 100%;">
                                    Add Priority Poll
                                </button>
                            </div>
                        </div>
                    ` : ''}
                    <div style="color: var(--gray-600); font-size: var(--font-size-sm);">
                        <p><strong>Category:</strong> ${complaint.category_name || 'N/A'}</p>
                        <p><strong>Created:</strong> ${Utils.formatDate(complaint.created_at)}</p>
                        <p><strong>Created by:</strong> ${complaint.creator_name || 'Anonymous'}</p>
                        ${complaint.assigned_to_name ? `<p><strong>Assigned to:</strong> ${complaint.assigned_to_name}</p>` : ''}
                    </div>
                </div>
                <div>
                    <h4 style="margin-bottom: var(--spacing-md);">Description</h4>
                    <p style="color: var(--gray-700); line-height: 1.6;">${complaint.description || 'No description provided'}</p>
                </div>
            `;

            modal.classList.add('active');
        } catch (error) {
            Utils.showToast('Failed to load complaint details', 'error');
        }
    },

    async updateStatus(id) {
        try {
            const status = document.getElementById('update-status').value;
            const priority = document.getElementById('update-priority').value;
            
            if (!status && !priority) {
                Utils.showToast('Please select status or priority to update', 'warning');
                return;
            }

            const updateData = {};
            if (status) updateData.status = status;
            if (priority) updateData.priority = priority;

            await Utils.apiRequest(API_ENDPOINTS.complaints.update(id), {
                method: 'PUT',
                body: JSON.stringify(updateData)
            });

            Utils.showToast('Complaint updated successfully', 'success');
            document.getElementById('detail-modal').classList.remove('active');
            await this.render();
        } catch (error) {
            Utils.showToast('Failed to update complaint', 'error');
        }
    },

    async addPoll(id) {
        try {
            const response = await Utils.apiRequest(`/api/complaints/${id}/poll`, {
                method: 'POST',
                body: JSON.stringify({
                    question: 'What should be the priority of this complaint?',
                    options: ['Low', 'Medium', 'High', 'Urgent']
                })
            });

            if (response === null) {
                Utils.showToast('Poll feature coming soon', 'info');
                return;
            }

            Utils.showToast('Poll added successfully! Users can now vote.', 'success');
            document.getElementById('detail-modal').classList.remove('active');
        } catch (error) {
            Utils.showToast('Poll feature coming soon', 'info');
        }
    },

    async editComplaint(id) {
        try {
            const complaint = await Utils.apiRequest(API_ENDPOINTS.complaints.get(id)).catch(() => null);
            if (!complaint) {
                Utils.showToast('Complaint not found', 'error');
                return;
            }

            // Check permissions
            const isOwner = complaint.created_by === AppState.currentUser?.id;
            const isAdmin = AppState.currentUser?.roles?.includes('Admin') || AppState.currentUser?.roles?.includes('Staff');
            
            if (!isOwner && !isAdmin) {
                Utils.showToast('You do not have permission to edit this complaint', 'error');
                return;
            }

            // Open edit modal
            ComplaintModal.openForEdit(complaint);
        } catch (error) {
            Utils.showToast('Failed to load complaint for editing', 'error');
        }
    },

    async deleteComplaint(id) {
        if (!confirm('Are you sure you want to delete this complaint? This action cannot be undone.')) {
            return;
        }

        try {
            const complaint = await Utils.apiRequest(API_ENDPOINTS.complaints.get(id)).catch(() => null);
            if (!complaint) {
                Utils.showToast('Complaint not found', 'error');
                return;
            }

            // Check permissions
            const isOwner = complaint.created_by === AppState.currentUser?.id;
            const isAdmin = AppState.currentUser?.roles?.includes('Admin');
            
            if (!isOwner && !isAdmin) {
                Utils.showToast('You do not have permission to delete this complaint', 'error');
                return;
            }

            await Utils.apiRequest(API_ENDPOINTS.complaints.delete(id), {
                method: 'DELETE'
            });

            Utils.showToast('Complaint deleted successfully', 'success');
            
            // Refresh the list
            await this.render(AppState.currentPage === 'my-complaints');
        } catch (error) {
            // If API fails, mark as deleted in offline DB
            if (offlineDB && offlineDB.db) {
                await offlineDB.addPendingAction({
                    type: 'delete_complaint',
                    complaint_id: id
                });
                Utils.showToast('Complaint marked for deletion (offline)', 'info');
                await this.render(AppState.currentPage === 'my-complaints');
            } else {
                Utils.showToast('Failed to delete complaint', 'error');
            }
        }
    }
};

// ============================================
// Admin (Placeholder)
// ============================================

const Admin = {
    async render() {
        const contentArea = document.getElementById('content-area');
        
        try {
            const categories = await Utils.apiRequest(API_ENDPOINTS.admin.categories).catch(() => []);
            const users = await Utils.apiRequest('/api/users').catch(() => []);

            contentArea.innerHTML = `
                <div class="admin-panel">
                    <div class="admin-header">
                        <h2>Admin Panel</h2>
                        <p class="text-sm" style="color: var(--gray-500);">Manage system settings, categories, and users</p>
                    </div>

                    <div class="admin-tabs">
                        <button class="admin-tab active" data-tab="categories">Categories</button>
                        <button class="admin-tab" data-tab="users">Users</button>
                        <button class="admin-tab" data-tab="settings">Settings</button>
                    </div>

                    <div id="admin-content">
                        ${this.renderCategoriesTab(categories)}
                    </div>
                </div>
            `;

            // Tab switching
            document.querySelectorAll('.admin-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    const tabName = tab.dataset.tab;
                    this.switchTab(tabName);
                });
            });
        } catch (error) {
            contentArea.innerHTML = `
                <div class="card">
                    <p style="color: var(--error);">Error loading admin panel: ${error.message}</p>
                </div>
            `;
        }
    },

    renderCategoriesTab(categories) {
        return `
            <div class="admin-tab-content" id="admin-categories">
                <div class="card">
                    <div class="card-header">
                        <h3>Complaint Categories</h3>
                        <button class="btn btn-primary" onclick="Admin.addCategory()">+ Add Category</button>
                    </div>
                    <div class="admin-list">
                        ${categories.map(cat => `
                            <div class="admin-list-item">
                                <div>
                                    <strong>${cat.name}</strong>
                                    <p style="color: var(--gray-500); font-size: var(--font-size-sm); margin-top: var(--spacing-xs);">${cat.description || 'No description'}</p>
                                </div>
                                <div style="display: flex; gap: var(--spacing-sm);">
                                    <button class="btn-icon" onclick="Admin.editCategory(${cat.id})" title="Edit">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                    </button>
                                    <button class="btn-icon" onclick="Admin.deleteCategory(${cat.id})" title="Delete" style="color: var(--error);">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        `).join('') || '<p style="color: var(--gray-500); padding: var(--spacing-md);">No categories yet</p>'}
                    </div>
                </div>
            </div>
        `;
    },

    async switchTab(tabName) {
        const content = document.getElementById('admin-content');
        if (!content) return;

        switch (tabName) {
            case 'categories':
                const categories = await Utils.apiRequest(API_ENDPOINTS.admin.categories).catch(() => []);
                content.innerHTML = this.renderCategoriesTab(categories);
                break;
            case 'users':
                await this.showUsers();
                break;
            case 'settings':
                await this.showSystemSettings();
                break;
        }
    },

    async showUsers() {
        const content = document.getElementById('admin-content');
        if (!content) {
            devError('Admin content element not found');
            return;
        }
        try {
            const users = await Utils.apiRequest('/api/users').catch(() => []);
            content.innerHTML = `
                <div class="admin-tab-content">
                    <div class="card">
                        <div class="card-header">
                            <h3>All Users</h3>
                        </div>
                        <div class="admin-list">
                            ${users.map(user => `
                                <div class="admin-list-item">
                                    <div>
                                        <strong>${user.full_name || user.username}</strong>
                                        <p style="color: var(--gray-500); font-size: var(--font-size-sm); margin-top: var(--spacing-xs);">
                                            @${user.username} • ${user.roles?.join(', ') || 'No roles'}
                                        </p>
                                    </div>
                                    <div style="display: flex; gap: var(--spacing-sm);">
                                        <button class="btn btn-secondary" onclick="Admin.editUser(${user.id})">Edit</button>
                                        ${!user.is_active ? '<span class="badge" style="background: var(--error); color: white;">Inactive</span>' : ''}
                                    </div>
                                </div>
                            `).join('') || '<p style="color: var(--gray-500); padding: var(--spacing-md);">No users found</p>'}
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            content.innerHTML = `<div class="card"><p style="color: var(--error);">Error loading users</p></div>`;
        }
    },

    async showSystemSettings() {
        const content = document.getElementById('admin-content');
        if (!content) {
            devError('Admin content element not found');
            return;
        }
        content.innerHTML = `
            <div class="admin-tab-content">
                <div class="card">
                    <h3>System Settings</h3>
                    <p style="color: var(--gray-500);">System configuration options coming soon</p>
                </div>
            </div>
        `;
    },

    async addCategory() {
        const name = prompt('Enter category name:');
        if (!name) return;

        try {
            await Utils.apiRequest(API_ENDPOINTS.admin.categories, {
                method: 'POST',
                body: JSON.stringify({ name, description: '' })
            });
            Utils.showToast('Category added', 'success');
            await this.render();
        } catch (error) {
            Utils.showToast('Failed to add category', 'error');
        }
    },

    async editCategory(id) {
        Utils.showToast('Edit category feature coming soon', 'info');
    },

    async deleteCategory(id) {
        if (!confirm('Are you sure you want to delete this category?')) return;
        Utils.showToast('Delete category feature coming soon', 'info');
    },

    async editUser(id) {
        Utils.showToast('Edit user feature coming soon', 'info');
    }
};

// ============================================
// Feed (Instagram-like Posts)
// ============================================

const Feed = {
    async render() {
        const contentArea = document.getElementById('content-area');
        
        try {
            // Initialize offline DB
            if (offlineDB && !offlineDB.db) {
                await offlineDB.init();
            }

            const response = await Utils.apiRequest(
                `${API_ENDPOINTS.complaints.list}?page=1&page_size=20&order_by=created_at&order=desc`
            ).catch(() => ({ items: [] }));
            
            let complaints = response.items || [];

            // Enhance with offline data (likes, bookmarks)
            if (offlineDB && offlineDB.db && AppState.currentUser?.id) {
                for (let complaint of complaints) {
                    const isLiked = await offlineDB.isLiked(complaint.id, AppState.currentUser.id);
                    const isBookmarked = await offlineDB.isBookmarked(complaint.id, AppState.currentUser.id);
                    const likeCount = await offlineDB.getLikeCount(complaint.id);
                    
                    complaint.user_liked = isLiked;
                    complaint.is_bookmarked = isBookmarked;
                    if (likeCount > 0) {
                        complaint.like_count = likeCount;
                    }
                }
            }

            contentArea.innerHTML = `
                <div class="feed-container">
                    ${complaints.map(complaint => this.renderPost(complaint)).join('')}
                </div>
            `;

            // Attach event listeners
            this.attachEventListeners();
        } catch (error) {
            contentArea.innerHTML = `
                <div class="card">
                    <p style="color: var(--error);">Error loading feed: ${error.message}</p>
                </div>
            `;
        }
    },

    renderPost(complaint) {
        const isLiked = complaint.user_liked || false;
        const likeCount = complaint.like_count || 0;
        const commentCount = complaint.comment_count || 0;
        const displayName = complaint.is_anonymous ? 'Unknown User' : (complaint.creator_name || 'User');
        const isRealId = !complaint.is_anonymous;
        const attachments = complaint.attachments || [];
        const hasImage = attachments.some(a => a.mime_type?.startsWith('image/'));
        const firstImage = attachments.find(a => a.mime_type?.startsWith('image/'));
        
        return `
            <div class="post-card" data-post-id="${complaint.id}">
                <div class="post-header">
                    <div class="post-user-info">
                        <div class="post-avatar ${isRealId ? 'real-id' : ''}">
                            ${isRealId ? (displayName.substring(0, 2).toUpperCase()) : '??'}
                        </div>
                        <div>
                            <div class="post-username ${isRealId ? 'real-id-highlight' : ''}">
                                ${displayName}
                                ${isRealId ? '<span class="verified-badge">✓</span>' : ''}
                            </div>
                            <div class="post-time">${Utils.formatRelativeTime(complaint.created_at)}</div>
                        </div>
                    </div>
                    <div class="post-actions-menu">
                        <button class="post-menu-btn">⋯</button>
                    </div>
                </div>
                
                ${hasImage ? `
                    <div class="post-image-container">
                        <img src="${API_BASE_URL}/api/attachments/${firstImage.id}/view" 
                             alt="${complaint.title}" 
                             class="post-image"
                             loading="lazy">
                    </div>
                ` : ''}
                
                <div class="post-content">
                    <div class="post-actions">
                        <button class="post-action-btn like-btn ${isLiked ? 'liked' : ''}" 
                                data-post-id="${complaint.id}">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                        </button>
                        <button class="post-action-btn comment-btn" data-post-id="${complaint.id}">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                        </button>
                        <button class="post-action-btn share-btn" data-post-id="${complaint.id}">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>
                            </svg>
                        </button>
                        <button class="post-action-btn bookmark-btn ${complaint.is_bookmarked ? 'bookmarked' : ''}" 
                                data-post-id="${complaint.id}" 
                                style="margin-left: auto;"
                                title="${complaint.is_bookmarked ? 'Saved' : 'Save'}">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="${complaint.is_bookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="post-likes">
                        <strong>${likeCount} ${likeCount === 1 ? 'like' : 'likes'}</strong>
                    </div>
                    
                    <div class="post-caption">
                        <span class="post-username-caption ${isRealId ? 'real-id-highlight' : ''}" 
                              onclick="event.stopPropagation(); Profile.render(${complaint.created_by})" 
                              style="cursor: pointer;">${displayName}</span>
                        <span class="post-text">${complaint.description}</span>
                    </div>
                    
                    ${complaint.poll ? this.renderPoll(complaint.poll) : ''}
                    
                    <div class="post-comments-preview" data-post-id="${complaint.id}">
                        ${commentCount > 0 ? `<button class="view-comments-btn">View all ${commentCount} comments</button>` : ''}
                    </div>
                    
                    <div class="post-comments-section" id="comments-${complaint.id}" style="display:none;">
                        <!-- Comments will be loaded here -->
                    </div>
                    
                    <div class="post-add-comment">
                        <input type="text" 
                               class="comment-input" 
                               placeholder="Add a comment..." 
                               data-post-id="${complaint.id}">
                        <button class="comment-submit-btn" data-post-id="${complaint.id}">Post</button>
                    </div>
                </div>
            </div>
        `;
    },

    renderPoll(poll) {
        if (!poll || !poll.options) return '';
        
        const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.vote_count || 0), 0);
        const userVoted = poll.user_voted || false;
        
        return `
            <div class="poll-container" data-poll-id="${poll.id}">
                <div class="poll-question">${poll.question || 'Vote on Priority'}</div>
                <div class="poll-options">
                    ${poll.options.map(option => {
                        const percentage = totalVotes > 0 ? (option.vote_count / totalVotes * 100) : 0;
                        return `
                            <div class="poll-option ${userVoted && option.user_voted ? 'user-voted' : ''}">
                                <button class="poll-option-btn" 
                                        data-poll-id="${poll.id}" 
                                        data-option-id="${option.id}"
                                        ${userVoted ? 'disabled' : ''}>
                                    <div class="poll-option-text">${option.option_text}</div>
                                    ${userVoted ? `
                                        <div class="poll-option-bar">
                                            <div class="poll-option-fill" style="width: ${percentage}%"></div>
                                        </div>
                                        <div class="poll-option-percentage">${percentage.toFixed(1)}%</div>
                                    ` : ''}
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
                ${totalVotes > 0 ? `<div class="poll-total-votes">${totalVotes} votes</div>` : ''}
            </div>
        `;
    },

    attachEventListeners() {
        // Like buttons
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const postId = parseInt(btn.dataset.postId);
                await this.toggleLike(postId, btn);
            });
        });

        // Comment buttons
        document.querySelectorAll('.comment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const postId = parseInt(btn.dataset.postId);
                this.toggleComments(postId);
            });
        });

        // Comment submit
        document.querySelectorAll('.comment-submit-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const postId = parseInt(btn.dataset.postId);
                const input = document.querySelector(`.comment-input[data-post-id="${postId}"]`);
                if (input && input.value.trim()) {
                    await this.addComment(postId, input.value.trim());
                    input.value = '';
                }
            });
        });

        // Comment input enter key
        document.querySelectorAll('.comment-input').forEach(input => {
            input.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter') {
                    const postId = parseInt(input.dataset.postId);
                    if (input.value.trim()) {
                        await this.addComment(postId, input.value.trim());
                        input.value = '';
                    }
                }
            });
        });

        // Share buttons
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const postId = parseInt(btn.dataset.postId);
                await this.sharePost(postId);
            });
        });

        // Bookmark buttons
        document.querySelectorAll('.bookmark-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const postId = parseInt(btn.closest('.post-card').dataset.postId);
                await this.toggleBookmark(postId, btn);
            });
        });

        // Three dots menu
        document.querySelectorAll('.post-menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const postCard = btn.closest('.post-card');
                const postId = parseInt(postCard.dataset.postId);
                this.showPostMenu(postId, btn);
            });
        });

        // Poll voting
        document.querySelectorAll('.poll-option-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const pollId = parseInt(btn.dataset.pollId);
                const optionId = parseInt(btn.dataset.optionId);
                await this.votePoll(pollId, optionId);
            });
        });
    },

    async toggleLike(postId, btn) {
        const userId = AppState.currentUser?.id;
        if (!userId) return;

        try {
            // Try API first
            const response = await Utils.apiRequest(`${API_ENDPOINTS.complaints.get(postId)}/like`, {
                method: 'POST'
            }).catch(() => null);
            
            // Use offline DB if API fails
            if (!response && offlineDB && offlineDB.db) {
                const result = await offlineDB.toggleLike(postId, userId);
                const likeCount = await offlineDB.getLikeCount(postId);
                
                btn.classList.toggle('liked', result.liked);
                const likesCountEl = btn.closest('.post-content').querySelector('.post-likes strong');
                if (likesCountEl) {
                    likesCountEl.textContent = `${likeCount} ${likeCount === 1 ? 'like' : 'likes'}`;
                }
                
                // Queue for sync
                await offlineDB.addPendingAction({
                    type: 'like',
                    complaint_id: postId,
                    user_id: userId,
                    action: result.liked ? 'add' : 'remove'
                });
                return;
            }
            
            // API success
            if (response) {
                btn.classList.toggle('liked');
                const likesCountEl = btn.closest('.post-content').querySelector('.post-likes strong');
                if (likesCountEl) {
                    const currentCount = parseInt(likesCountEl.textContent) || 0;
                    const newCount = btn.classList.contains('liked') ? currentCount + 1 : currentCount - 1;
                    likesCountEl.textContent = `${newCount} ${newCount === 1 ? 'like' : 'likes'}`;
                }
            }
        } catch (error) {
            // Fallback to offline
            if (offlineDB && offlineDB.db) {
                const result = await offlineDB.toggleLike(postId, userId);
                const likeCount = await offlineDB.getLikeCount(postId);
                btn.classList.toggle('liked', result.liked);
                const likesCountEl = btn.closest('.post-content').querySelector('.post-likes strong');
                if (likesCountEl) {
                    likesCountEl.textContent = `${likeCount} ${likeCount === 1 ? 'like' : 'likes'}`;
                }
            }
        }
    },

    async toggleComments(postId) {
        const commentsSection = document.getElementById(`comments-${postId}`);
        if (!commentsSection) return;

        if (commentsSection.style.display === 'none') {
            commentsSection.style.display = 'block';
            await this.loadComments(postId);
        } else {
            commentsSection.style.display = 'none';
        }
    },

    async loadComments(postId) {
        const commentsSection = document.getElementById(`comments-${postId}`);
        if (!commentsSection) return;

        try {
            // Try API first
            let comments = [];
            try {
                const response = await Utils.apiRequest(`${API_ENDPOINTS.complaints.get(postId)}/comments`);
                comments = (response && response.items) ? response.items : [];
            } catch (error) {
                // Fallback to offline DB
                if (offlineDB && offlineDB.db) {
                    const offlineComments = await offlineDB.getComments(postId);
                    comments = offlineComments.map(c => ({
                        id: c.id,
                        content: c.content,
                        author_name: c.author_name || 'User',
                        is_anonymous: c.is_anonymous || false,
                        created_at: c.created_at,
                        like_count: 0,
                        user_liked: false
                    }));
                }
            }

            if (comments.length === 0) {
                commentsSection.innerHTML = '<p style="color: var(--gray-500); font-size: var(--font-size-sm); padding: var(--spacing-md);">No comments yet. Be the first to comment!</p>';
            } else {
                commentsSection.innerHTML = comments.map(comment => this.renderComment(comment)).join('');

                // Attach comment like listeners
                commentsSection.querySelectorAll('.comment-like-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const commentId = parseInt(btn.dataset.commentId);
                        await this.toggleCommentLike(commentId, btn);
                    });
                });
            }
        } catch (error) {
            commentsSection.innerHTML = '<p style="color: var(--gray-500); font-size: var(--font-size-sm); padding: var(--spacing-md);">Loading comments...</p>';
        }
    },

    renderComment(comment) {
        const isRealId = !comment.is_anonymous;
        const displayName = comment.is_anonymous ? 'Unknown User' : (comment.author_name || 'User');
        const isLiked = comment.user_liked || false;
        const likeCount = comment.like_count || 0;

        return `
            <div class="post-comment ${isRealId ? 'real-id-comment' : ''}">
                <div class="comment-avatar ${isRealId ? 'real-id' : ''}">
                    ${isRealId ? (displayName.substring(0, 2).toUpperCase()) : '??'}
                </div>
                <div class="comment-content">
                    <div class="comment-header">
                            <span class="comment-username ${isRealId ? 'real-id-highlight' : ''}" 
                                  onclick="event.stopPropagation(); Profile.render(${comment.author_id})" 
                                  style="cursor: pointer;">${displayName}</span>
                            <span class="comment-time">${Utils.formatRelativeTime(comment.created_at)}</span>
                    </div>
                    <div class="comment-text">${comment.content}</div>
                    <div class="comment-actions">
                        <button class="comment-like-btn ${isLiked ? 'liked' : ''}" data-comment-id="${comment.id}">
                            ${likeCount > 0 ? likeCount : ''} ${isLiked ? '❤️' : '🤍'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    async addComment(postId, content) {
        const userId = AppState.currentUser?.id;
        if (!userId) return;

        const isAnonymous = !AppState.currentUser.settings?.show_real_name;
        const authorName = isAnonymous ? 'Unknown User' : (AppState.currentUser.full_name || AppState.currentUser.username);

        try {
            // Try API first
            let response = null;
            try {
                response = await Utils.apiRequest(`${API_ENDPOINTS.complaints.get(postId)}/comments`, {
                    method: 'POST',
                    body: JSON.stringify({ 
                        complaint_id: postId,
                        content: content,
                        is_internal: false,
                        parent_id: null
                    })
                });
            } catch (error) {
                // Fallback to offline DB
                if (offlineDB && offlineDB.db) {
                    const comment = {
                        complaint_id: postId,
                        author_id: userId,
                        author_name: authorName,
                        content: content,
                        is_anonymous: isAnonymous,
                        created_at: new Date().toISOString(),
                        like_count: 0,
                        user_liked: false
                    };
                    await offlineDB.saveComment(comment);
                    
                    // Queue for sync
                    await offlineDB.addPendingAction({
                        type: 'comment',
                        complaint_id: postId,
                        content: content,
                        is_anonymous: isAnonymous
                    });
                    
                    Utils.showToast('Comment added (offline)', 'success');
                    await this.loadComments(postId);
                    return;
                }
            }

            if (response) {
                await this.loadComments(postId);
                Utils.showToast('Comment added', 'success');
            }
        } catch (error) {
            // Final fallback to offline
            if (offlineDB && offlineDB.db) {
                const comment = {
                    complaint_id: postId,
                    author_id: userId,
                    author_name: authorName,
                    content: content,
                    is_anonymous: isAnonymous,
                    created_at: new Date().toISOString()
                };
                await offlineDB.saveComment(comment);
                Utils.showToast('Comment saved offline', 'info');
                await this.loadComments(postId);
            } else {
                Utils.showToast('Failed to add comment', 'error');
            }
        }
    },

    async toggleCommentLike(commentId, btn) {
        try {
            const response = await Utils.apiRequest(`/api/comments/${commentId}/like`, {
                method: 'POST'
            });

            if (response === null) {
                // Endpoint doesn't exist, just toggle UI
                btn.classList.toggle('liked');
                return;
            }

            btn.classList.toggle('liked');
        } catch (error) {
            // Silently handle - endpoint might not exist
            btn.classList.toggle('liked');
        }
    },

    async toggleBookmark(postId, btn) {
        const userId = AppState.currentUser?.id;
        if (!userId) return;

        try {
            if (offlineDB && offlineDB.db) {
                const result = await offlineDB.toggleBookmark(postId, userId);
                btn.classList.toggle('bookmarked', result.bookmarked);
                Utils.showToast(result.bookmarked ? 'Post saved' : 'Post unsaved', 'success');
                
                // Queue for sync
                await offlineDB.addPendingAction({
                    type: 'bookmark',
                    complaint_id: postId,
                    action: result.bookmarked ? 'add' : 'remove'
                });
            }
        } catch (error) {
            devError('Bookmark error:', error);
        }
    },

    async sharePost(postId) {
        try {
            const complaint = await Utils.apiRequest(API_ENDPOINTS.complaints.get(postId)).catch(() => null);
            const shareText = complaint ? `${complaint.title}\n${complaint.description?.substring(0, 100)}...` : 'Check out this complaint';
            const shareUrl = `${window.location.origin}${window.location.pathname}#complaint-${postId}`;

            if (navigator.share) {
                await navigator.share({
                    title: complaint?.title || 'Complaint',
                    text: shareText,
                    url: shareUrl
                });
                Utils.showToast('Shared successfully', 'success');
            } else {
                // Fallback: copy to clipboard
                await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
                Utils.showToast('Link copied to clipboard', 'success');
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                // Fallback: copy to clipboard
                const shareUrl = `${window.location.origin}${window.location.pathname}#complaint-${postId}`;
                await navigator.clipboard.writeText(shareUrl);
                Utils.showToast('Link copied to clipboard', 'success');
            }
        }
    },

    showPostMenu(postId, btn) {
        // Remove existing menus
        document.querySelectorAll('.post-menu-dropdown').forEach(m => m.remove());

        const postCard = btn.closest('.post-card');
        const complaint = AppState.complaints?.find(c => c.id === postId);
        const isOwner = complaint?.created_by === AppState.currentUser?.id;
        const isAdmin = AppState.currentUser?.roles?.includes('Admin') || AppState.currentUser?.roles?.includes('Staff');

        const menu = document.createElement('div');
        menu.className = 'post-menu-dropdown';
        menu.style.cssText = 'position: absolute; background: white; border: 1px solid var(--gray-200); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); z-index: 1000; min-width: 200px;';
        
        const rect = btn.getBoundingClientRect();
        menu.style.top = `${rect.bottom + 5}px`;
        menu.style.right = '10px';

        let menuItems = [];
        if (isOwner) {
            menuItems.push('<button class="menu-item" data-action="edit">✏️ Edit Post</button>');
            menuItems.push('<button class="menu-item" data-action="delete">🗑️ Delete Post</button>');
        }
        if (isAdmin) {
            menuItems.push('<button class="menu-item" data-action="admin-edit">⚙️ Admin Edit</button>');
        }
        menuItems.push('<button class="menu-item" data-action="report">🚩 Report</button>');
        menuItems.push('<button class="menu-item" data-action="copy-link">🔗 Copy Link</button>');

        menu.innerHTML = menuItems.join('');

        // Attach event listeners
        menu.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                const action = item.dataset.action;
                menu.remove();
                
                switch (action) {
                    case 'edit':
                        await Complaints.editComplaint(postId);
                        break;
                    case 'delete':
                        if (confirm('Are you sure you want to delete this post?')) {
                            await Complaints.deleteComplaint(postId);
                        }
                        break;
                    case 'admin-edit':
                        await Complaints.showDetail(postId);
                        break;
                    case 'report':
                        Utils.showToast('Report feature coming soon', 'info');
                        break;
                    case 'copy-link':
                        const url = `${window.location.origin}${window.location.pathname}#complaint-${postId}`;
                        await navigator.clipboard.writeText(url);
                        Utils.showToast('Link copied', 'success');
                        break;
                }
            });
        });

        postCard.style.position = 'relative';
        postCard.appendChild(menu);

        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target) && e.target !== btn) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 0);
    },

    async votePoll(pollId, optionId) {
        try {
            const response = await Utils.apiRequest(`/api/polls/${pollId}/vote`, {
                method: 'POST',
                body: JSON.stringify({ option_id: optionId })
            }).catch(() => null);

            if (response === null) {
                Utils.showToast('Poll voting feature coming soon', 'info');
                return;
            }

            // Reload the feed to show updated poll results
            await this.render();
            Utils.showToast('Vote recorded! Priority will be updated automatically.', 'success');
        } catch (error) {
            Utils.showToast('Poll voting feature coming soon', 'info');
        }
    }
};

// ============================================
// Profile
// ============================================

const Profile = {
    async render(userId = null) {
        const contentArea = document.getElementById('content-area');
        const targetUserId = userId || AppState.currentUser?.id;
        const isOwnProfile = targetUserId === AppState.currentUser?.id;

        try {
            // Initialize offline DB
            if (offlineDB && !offlineDB.db) {
                await offlineDB.init();
            }

            let user = await Utils.apiRequest(`/api/users/${targetUserId}`).catch(() => null);
            if (!user) {
                user = AppState.currentUser;
            }
            if (!user) {
                throw new Error('User not found');
            }
            
            // Ensure user has roles array
            if (!user.roles || !Array.isArray(user.roles)) {
                user.roles = [];
            }
            
            const userComplaints = await Utils.apiRequest(
                `${API_ENDPOINTS.complaints.list}?created_by=${targetUserId}&page_size=20`
            ).catch(() => ({ items: [], total: 0 }));
            
            // Handle missing endpoints gracefully - use offline DB
            let followers = { count: 0, items: [] };
            let following = { count: 0, items: [] };
            
            try {
                followers = await Utils.apiRequest(`/api/users/${targetUserId}/followers`);
            } catch (error) {
                if (offlineDB && offlineDB.db) {
                    const offlineFollowers = await offlineDB.getFollowers(targetUserId);
                    followers = { count: offlineFollowers.length, items: offlineFollowers };
                }
            }

            try {
                following = await Utils.apiRequest(`/api/users/${targetUserId}/following`);
            } catch (error) {
                if (offlineDB && offlineDB.db) {
                    const offlineFollowing = await offlineDB.getFollowing(targetUserId);
                    following = { count: offlineFollowing.length, items: offlineFollowing };
                }
            }

            // Check if current user is following this user
            let isFollowing = false;
            if (!isOwnProfile && AppState.currentUser?.id && offlineDB && offlineDB.db) {
                isFollowing = await offlineDB.isFollowing(AppState.currentUser.id, targetUserId);
            }

            const userRoles = (user.roles && Array.isArray(user.roles)) ? user.roles : [];
            const roleBadges = userRoles.length > 0 
                ? userRoles.map(role => `<span class="role-badge role-${role.toLowerCase()}">${role}</span>`).join('')
                : '<span class="role-badge role-student">User</span>';

            contentArea.innerHTML = `
                <div class="profile-container">
                    <div class="profile-header-card">
                        <div class="profile-cover" style="background: linear-gradient(135deg, var(--primary), var(--primary-light)); height: 200px; border-radius: var(--radius-lg) var(--radius-lg) 0 0;"></div>
                        <div class="profile-header-content">
                            <div class="profile-avatar-large">
                                ${Utils.getUserInitials(user.full_name || user.username)}
                            </div>
                            <div class="profile-info">
                                <div class="profile-username-section">
                                    <div>
                                        <h2>${user.full_name || user.username}</h2>
                                        <div class="profile-roles">${roleBadges}</div>
                                        <div class="profile-meta">
                                            <span>@${user.username}</span>
                                            ${user.email ? `<span>•</span><span>${user.email}</span>` : ''}
                                        </div>
                                    </div>
                                    <div class="profile-actions">
                                        ${isOwnProfile ? `
                                            <button class="btn btn-secondary" onclick="Profile.openSettings()">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                </svg>
                                                Edit Profile
                                            </button>
                                        ` : `
                                            <button class="btn btn-primary follow-btn ${isFollowing ? 'following' : ''}" data-user-id="${targetUserId}">
                                                ${isFollowing ? 'Following' : 'Follow'}
                                            </button>
                                            <button class="btn btn-secondary">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>
                                                </svg>
                                                Message
                                            </button>
                                        `}
                                    </div>
                                </div>
                                <div class="profile-stats">
                                    <div class="profile-stat clickable" onclick="Profile.showPosts(${targetUserId})">
                                        <strong>${userComplaints.total || userComplaints.items?.length || 0}</strong>
                                        <span>posts</span>
                                    </div>
                                    <div class="profile-stat clickable" onclick="Profile.showFollowers(${targetUserId})">
                                        <strong>${followers.count || 0}</strong>
                                        <span>followers</span>
                                    </div>
                                    <div class="profile-stat clickable" onclick="Profile.showFollowing(${targetUserId})">
                                        <strong>${following.count || 0}</strong>
                                        <span>following</span>
                                    </div>
                                </div>
                                <div class="profile-bio">
                                    <p>${user.profile?.bio || 'No bio yet. Click "Edit Profile" to add one.'}</p>
                                    ${user.profile?.department ? `<p><strong>Department:</strong> ${user.profile.department}</p>` : ''}
                                    ${user.profile?.year ? `<p><strong>Year:</strong> ${user.profile.year}</p>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="profile-tabs">
                        <button class="profile-tab active" data-tab="posts">Posts</button>
                        <button class="profile-tab" data-tab="saved">Saved</button>
                        ${isOwnProfile ? `<button class="profile-tab" data-tab="settings">Settings</button>` : ''}
                    </div>
                    
                    <div class="profile-posts-grid" id="profile-content">
                        ${userComplaints.items?.map(complaint => `
                            <div class="profile-post-thumbnail" onclick="Complaints.showDetail(${complaint.id})">
                                ${complaint.attachments?.[0] ? `
                                    <img src="${API_BASE_URL}/api/attachments/${complaint.attachments[0].id}/view" alt="${complaint.title}" loading="lazy">
                                ` : `
                                    <div class="post-thumbnail-placeholder">
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"></path>
                                        </svg>
                                    </div>
                                `}
                                <div class="post-thumbnail-overlay">
                                    <span>❤️ ${complaint.like_count || 0}</span>
                                    <span>💬 ${complaint.comment_count || 0}</span>
                                </div>
                            </div>
                        `).join('') || '<div class="empty-state"><p>No posts yet</p></div>'}
                    </div>
                </div>
            `;

            // Attach event listeners
            if (!isOwnProfile) {
                document.querySelector('.follow-btn')?.addEventListener('click', async (e) => {
                    await this.toggleFollow(targetUserId, e.target);
                });
            }

            // Tab switching
            document.querySelectorAll('.profile-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    const tabName = tab.dataset.tab;
                    this.switchTab(tabName, targetUserId);
                });
            });
        } catch (error) {
            contentArea.innerHTML = `
                <div class="card">
                    <p style="color: var(--error);">Error loading profile: ${error.message}</p>
                </div>
            `;
        }
    },

    async toggleFollow(userId, btn) {
        const currentUserId = AppState.currentUser?.id;
        if (!currentUserId) return;

        try {
            // Initialize offline DB if needed
            if (offlineDB && !offlineDB.db) {
                await offlineDB.init();
            }

            // Try API first
            let response = null;
            try {
                response = await Utils.apiRequest(`/api/users/${userId}/follow`, {
                    method: 'POST'
                });
            } catch (error) {
                // Use offline DB
                if (offlineDB && offlineDB.db) {
                    const result = await offlineDB.toggleFollow(currentUserId, userId);
                    btn.textContent = result.following ? 'Following' : 'Follow';
                    btn.classList.toggle('following', result.following);
                    
                    // Queue for sync
                    await offlineDB.addPendingAction({
                        type: 'follow',
                        follower_id: currentUserId,
                        following_id: userId,
                        action: result.following ? 'add' : 'remove'
                    });
                    
                    Utils.showToast(result.following ? 'Now following' : 'Unfollowed', 'success');
                    return;
                }
            }

            if (response) {
                const isFollowing = btn.textContent === 'Following';
                btn.textContent = isFollowing ? 'Follow' : 'Following';
                btn.classList.toggle('following', !isFollowing);
            }
        } catch (error) {
            // Fallback to offline
            if (offlineDB && offlineDB.db) {
                const result = await offlineDB.toggleFollow(currentUserId, userId);
                btn.textContent = result.following ? 'Following' : 'Follow';
                btn.classList.toggle('following', result.following);
            }
        }
    },

    async switchTab(tabName, userId) {
        const content = document.getElementById('profile-content');
        if (!content) return;

        switch (tabName) {
            case 'posts':
                // Already shown
                break;
            case 'saved':
                // Show bookmarked posts
                if (offlineDB && offlineDB.db) {
                    try {
                        const bookmarks = await offlineDB.getBookmarks(userId);
                        // Get complaint IDs from bookmarks
                        const complaintIds = bookmarks.map(b => b.complaint_id);
                        // Fetch complaints
                        const bookmarkedComplaints = [];
                        for (const id of complaintIds) {
                            try {
                                const complaint = await Utils.apiRequest(API_ENDPOINTS.complaints.get(id)).catch(() => null);
                                if (complaint) bookmarkedComplaints.push(complaint);
                            } catch (e) {
                                // Try offline DB
                                const offlineComplaint = await offlineDB.getComplaint(id);
                                if (offlineComplaint) bookmarkedComplaints.push(offlineComplaint);
                            }
                        }
                        if (bookmarkedComplaints.length > 0) {
                            content.innerHTML = `
                                <div class="profile-posts-grid">
                                    ${bookmarkedComplaints.map(complaint => `
                                        <div class="profile-post-thumbnail" onclick="Complaints.showDetail(${complaint.id})">
                                            ${complaint.attachments?.[0] ? `
                                                <img src="${API_BASE_URL}/api/attachments/${complaint.attachments[0].id}/view" alt="${complaint.title}" loading="lazy">
                                            ` : `
                                                <div class="post-thumbnail-placeholder">
                                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"></path>
                                                    </svg>
                                                </div>
                                            `}
                                            <div class="post-thumbnail-overlay">
                                                <span>❤️ ${complaint.like_count || 0}</span>
                                                <span>💬 ${complaint.comment_count || 0}</span>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            `;
                        } else {
                            content.innerHTML = '<div class="empty-state"><p>No saved posts</p></div>';
                        }
                    } catch (error) {
                        devError('Error loading saved posts:', error);
                        content.innerHTML = '<div class="empty-state"><p>No saved posts</p></div>';
                    }
                } else {
                    content.innerHTML = '<div class="empty-state"><p>No saved posts</p></div>';
                }
                break;
                break;
            case 'settings':
                this.openSettings();
                break;
        }
    },

    async showPosts(userId) {
        // Filter to show only this user's posts
        Navigation.navigateToPage('feed');
    },

    async showFollowers(userId) {
        Utils.showToast('Followers list coming soon', 'info');
    },

    async showFollowing(userId) {
        Utils.showToast('Following list coming soon', 'info');
    },

    async openSettings() {
        // Open profile settings modal
        const modal = document.getElementById('profile-modal');
        const content = document.getElementById('profile-modal-content');
        
        content.innerHTML = `
            <div class="profile-settings">
                <h3>Profile Settings</h3>
                <form id="profile-settings-form">
                    <div class="form-group">
                        <label>Show Real ID</label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="show-real-id" ${AppState.currentUser.settings?.show_real_name ? 'checked' : ''}>
                            <span class="checkbox-custom"></span>
                            <span>Display your real name on posts and comments</span>
                        </label>
                    </div>
                    <div class="form-group">
                        <label>Bio</label>
                        <textarea id="profile-bio" rows="4" placeholder="Tell us about yourself...">${AppState.currentUser.profile?.bio || ''}</textarea>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary modal-close">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                    </div>
                </form>
            </div>
        `;

        modal.classList.add('active');

        document.getElementById('profile-settings-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveSettings();
        });
    },

    async saveSettings() {
        try {
            const showRealId = document.getElementById('show-real-id').checked;
            const bio = document.getElementById('profile-bio').value;

            await Utils.apiRequest(`/api/users/${AppState.currentUser.id}/settings`, {
                method: 'PUT',
                body: JSON.stringify({
                    show_real_name: showRealId,
                    bio: bio
                })
            });

            Utils.showToast('Settings saved', 'success');
            document.getElementById('profile-modal').classList.remove('active');
            await this.render();
        } catch (error) {
            Utils.showToast('Failed to save settings', 'error');
        }
    }
};

// ============================================
// Complaint Modal
// ============================================

const ComplaintModal = {
    editingComplaint: null,

    async init() {
        // Load categories and locations
        try {
            const [categories, locations] = await Promise.all([
                Utils.apiRequest(API_ENDPOINTS.admin.categories),
                Utils.apiRequest(API_ENDPOINTS.admin.locations).catch(() => [])
            ]);

            AppState.categories = categories;
            AppState.locations = locations || [];

            // Populate selects
            const categorySelect = document.getElementById('complaint-category');
            const locationSelect = document.getElementById('complaint-location');

            if (categorySelect) {
                categorySelect.innerHTML = '<option value="">Select Category</option>' +
                    categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
            }

            if (locationSelect) {
                locationSelect.innerHTML = '<option value="">Select Location</option>' +
                    (locations || []).map(loc => `<option value="${loc.id}">${loc.name}</option>`).join('');
            }
        } catch (error) {
            devError('Failed to load categories/locations:', error);
        }
    },

    open() {
        this.editingComplaint = null;
        this.init();
        const modal = document.getElementById('complaint-modal');
        const form = document.getElementById('complaint-form');
        const title = modal.querySelector('h2');
        
        if (title) title.textContent = 'Submit New Complaint';
        if (form) form.reset();
        document.getElementById('upload-preview').innerHTML = '';
        modal.classList.add('active');
    },

    openForEdit(complaint) {
        this.editingComplaint = complaint;
        this.init();
        const modal = document.getElementById('complaint-modal');
        const form = document.getElementById('complaint-form');
        const title = modal.querySelector('h2');
        
        if (title) title.textContent = 'Edit Complaint';
        
        // Populate form with complaint data
        setTimeout(() => {
            document.getElementById('complaint-title').value = complaint.title || '';
            document.getElementById('complaint-description').value = complaint.description || '';
            document.getElementById('complaint-category').value = complaint.category_id || '';
            document.getElementById('complaint-location').value = complaint.location_id || '';
            document.getElementById('complaint-priority').value = complaint.priority || 'Medium';
            document.getElementById('complaint-privacy').value = complaint.privacy_mode || 'public';
            document.getElementById('complaint-anonymous').checked = complaint.is_anonymous || false;
            document.getElementById('complaint-show-real-id').checked = !complaint.is_anonymous;
        }, 100);
        
        modal.classList.add('active');
    },

    close() {
        const modal = document.getElementById('complaint-modal');
        modal.classList.remove('active');
        document.getElementById('complaint-form').reset();
        document.getElementById('upload-preview').innerHTML = '';
        this.editingComplaint = null;
    },

    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('complaint-title').value,
            description: document.getElementById('complaint-description').value,
            category_id: parseInt(document.getElementById('complaint-category').value),
            location_id: document.getElementById('complaint-location').value || null,
            priority: document.getElementById('complaint-priority').value,
            privacy_mode: document.getElementById('complaint-privacy').value,
            is_anonymous: document.getElementById('complaint-anonymous').checked
        };

        try {
            Utils.showLoading(true);
            
            if (this.editingComplaint) {
                // Update existing complaint
                await Utils.apiRequest(API_ENDPOINTS.complaints.update(this.editingComplaint.id), {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
                Utils.showToast('Complaint updated successfully!', 'success');
            } else {
                // Create new complaint
                await Utils.apiRequest(API_ENDPOINTS.complaints.create, {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
                Utils.showToast('Complaint submitted successfully!', 'success');
            }

            this.close();
            
            // Refresh current page
            if (AppState.currentPage === 'complaints' || AppState.currentPage === 'my-complaints') {
                await Complaints.render(AppState.currentPage === 'my-complaints');
            } else {
                await Navigation.loadPageContent(AppState.currentPage);
            }
        } catch (error) {
            Utils.showToast(error.message || (this.editingComplaint ? 'Failed to update complaint' : 'Failed to submit complaint'), 'error');
        } finally {
            Utils.showLoading(false);
        }
    }
};

// ============================================
// Event Listeners
// ============================================

// Register Service Worker for offline support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Only register once
        if (navigator.serviceWorker.controller) {
            return; // Already controlled by a service worker
        }

        // Try to register service worker
        navigator.serviceWorker.register('./service-worker.js', { scope: './' })
            .then((registration) => {
                devLog('Service Worker registered:', registration.scope);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'activated') {
                            devLog('New service worker activated');
                        }
                    });
                });
            })
            .catch((error) => {
                devWarn('Service Worker registration failed:', error);
            });
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize offline database
    if ('indexedDB' in window && offlineDB) {
        try {
            await offlineDB.init();
            devLog('Offline database initialized');
        } catch (error) {
            devWarn('Offline database init failed:', error);
        }
    }

    // Initialize offline manager
    OfflineManager.init();
    
    // Initialize notifications
    await NotificationManager.init();
    
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const success = await Auth.login(username, password);
            if (success) {
                // Force navigation to main app
                setTimeout(() => {
                    Auth.navigateToMain();
                }, 100);
            }
        });
    }

    // Password toggle
    const passwordToggle = document.getElementById('password-toggle');
    if (passwordToggle) {
        passwordToggle.addEventListener('click', () => {
            const passwordInput = document.getElementById('password');
            passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => Auth.logout());
    }

    // New complaint button
    const newComplaintBtn = document.getElementById('new-complaint-btn');
    if (newComplaintBtn) {
        newComplaintBtn.addEventListener('click', () => ComplaintModal.open());
    }

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('active'));
        });
    });

    // Modal backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('active'));
            }
        });
    });

    // Complaint form
    const complaintForm = document.getElementById('complaint-form');
    if (complaintForm) {
        complaintForm.addEventListener('submit', (e) => ComplaintModal.handleSubmit(e));
    }

    // File upload
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('complaint-attachments');
    const uploadPreview = document.getElementById('upload-preview');

    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--primary)';
        });
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = 'var(--gray-300)';
        });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--gray-300)';
            fileInput.files = e.dataTransfer.files;
            handleFilePreview();
        });

        fileInput.addEventListener('change', () => {
            handleFilePreview();
        });
    }

    // Global search
    const globalSearch = document.getElementById('global-search');
    if (globalSearch) {
        const debouncedSearch = Utils.debounce((value) => {
            AppState.filters.search = value;
            if (AppState.currentPage === 'complaints' || AppState.currentPage === 'my-complaints') {
                Complaints.render(AppState.currentPage === 'my-complaints');
            }
        }, 500);

        globalSearch.addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });
    }

    // User card click to profile
    const userCard = document.getElementById('user-card-clickable');
    if (userCard) {
        userCard.addEventListener('click', () => {
            Navigation.navigateToPage('profile');
        });
    }

    // Check authentication
    Navigation.init();
    const isAuthenticated = await Auth.checkAuth();
    if (isAuthenticated) {
        // Ensure main app is visible
        Auth.navigateToMain();
        await Navigation.loadPageContent('dashboard');
    } else {
        // Ensure login page is visible
        Auth.navigateToLogin();
        // Show welcome notification
        NotificationManager.show('Welcome to Student Complaint Hub', {
            body: 'Please login to continue',
            type: 'info'
        });
    }
});

// File preview handler
function handleFilePreview() {
    const fileInput = document.getElementById('complaint-attachments');
    const uploadPreview = document.getElementById('upload-preview');
    
    if (!fileInput || !uploadPreview) return;

    uploadPreview.innerHTML = '';
    Array.from(fileInput.files).forEach((file, index) => {
        const preview = document.createElement('div');
        preview.style.cssText = 'display: inline-flex; align-items: center; gap: var(--spacing-sm); padding: var(--spacing-sm); background: var(--gray-100); border-radius: var(--radius-md); margin-right: var(--spacing-sm); margin-bottom: var(--spacing-sm);';
        preview.innerHTML = `
            <span>${file.name}</span>
            <button type="button" onclick="removeFile(${index})" style="background: none; border: none; color: var(--error); cursor: pointer; padding: 0; font-size: 18px;">×</button>
        `;
        uploadPreview.appendChild(preview);
    });
}

function removeFile(index) {
    const fileInput = document.getElementById('complaint-attachments');
    const dt = new DataTransfer();
    Array.from(fileInput.files).forEach((file, i) => {
        if (i !== index) dt.items.add(file);
    });
    fileInput.files = dt.files;
    handleFilePreview();
}

// Make functions globally available
window.Navigation = Navigation;
window.Complaints = Complaints;
window.ComplaintModal = ComplaintModal;
window.Feed = Feed;
window.Profile = Profile;

