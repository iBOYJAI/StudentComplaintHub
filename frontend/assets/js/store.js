export class Store {
  constructor() {
    this.state = {
      user: null,
      isAuthenticated: false,
      complaints: [],
      categories: [],
      locations: [],
      notifications: [],
    };
    this.listeners = [];
    
    // Load user from localStorage if available
    this.loadUserFromStorage();
  }

  loadUserFromStorage() {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        this.state.user = JSON.parse(userJson);
        this.state.isAuthenticated = true;
      } catch (error) {
        console.error('Failed to parse user from localStorage:', error);
        localStorage.removeItem('user');
      }
    }
  }

  getState() {
    return { ...this.state };
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  // User methods
  setUser(user) {
    this.state.user = user;
    this.state.isAuthenticated = !!user;
    
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
    
    this.notify();
  }

  getUser() {
    return this.state.user;
  }

  isAuthenticated() {
    return this.state.isAuthenticated;
  }

  // Complaints methods
  setComplaints(complaints) {
    this.state.complaints = complaints;
    this.notify();
  }

  addComplaint(complaint) {
    this.state.complaints = [complaint, ...this.state.complaints];
    this.notify();
  }

  updateComplaint(id, updates) {
    this.state.complaints = this.state.complaints.map(c =>
      c.id === id ? { ...c, ...updates } : c
    );
    this.notify();
  }

  deleteComplaint(id) {
    this.state.complaints = this.state.complaints.filter(c => c.id !== id);
    this.notify();
  }

  // Categories methods
  setCategories(categories) {
    this.state.categories = categories;
    this.notify();
  }

  // Locations methods
  setLocations(locations) {
    this.state.locations = locations;
    this.notify();
  }

  // Notifications methods
  setNotifications(notifications) {
    this.state.notifications = notifications;
    this.notify();
  }

  addNotification(notification) {
    this.state.notifications = [notification, ...this.state.notifications];
    this.notify();
  }

  clearNotifications() {
    this.state.notifications = [];
    this.notify();
  }

  // Clear all state (on logout)
  clear() {
    this.state = {
      user: null,
      isAuthenticated: false,
      complaints: [],
      categories: [],
      locations: [],
      notifications: [],
    };
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    this.notify();
  }
}
