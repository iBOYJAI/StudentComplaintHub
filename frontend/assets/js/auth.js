export class Auth {
  static isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  static getToken() {
    return localStorage.getItem('token');
  }

  static setToken(token) {
    localStorage.setItem('token', token);
  }

  static removeToken() {
    localStorage.removeItem('token');
  }

  static getUser() {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch {
        return null;
      }
    }
    return null;
  }

  static setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  static removeUser() {
    localStorage.removeItem('user');
  }

  static getUserRole() {
    const user = Auth.getUser();
    if (!user || !user.roles || !user.roles.length) return null;
    
    // Map backend roles to frontend role identifiers
    const role = user.roles[0];
    if (role === 'Super Admin' || role === 'Principal' || role === 'Vice Principal') return 'admin';
    if (role === 'Staff' || role === 'Department Head') return 'staff';
    if (role === 'Student') return 'student';
    return null;
  }

  static hasRole(requiredRole) {
    const role = Auth.getUserRole();
    return role === requiredRole;
  }

  static hasAnyRole(roles = []) {
    const role = Auth.getUserRole();
    return roles.includes(role);
  }

  static logout() {
    Auth.removeToken();
    Auth.removeUser();
  }

  static requireAuth() {
    if (!Auth.isAuthenticated()) {
      window.location.href = '/login';
      return false;
    }
    return true;
  }

  static requireRole(requiredRole) {
    if (!Auth.requireAuth()) return false;
    
    const role = Auth.getUserRole();
    if (role !== requiredRole) {
      window.location.href = '/403';
      return false;
    }
    return true;
  }

  static redirectToDashboard() {
    const role = Auth.getUserRole();
    
    const dashboards = {
      student: '/student/dashboard',
      staff: '/staff/dashboard',
      admin: '/admin/dashboard',
    };

    window.location.href = dashboards[role] || '/';
  }
}
