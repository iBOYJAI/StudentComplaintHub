import { Router } from './router.js';
import { API } from './api.js';
import { Store } from './store.js';

class App {
    constructor() {
        this.router = new Router();
        this.api = new API();
        this.store = new Store();
        this.init();
    }
    
    async init() {
        // Hide loading screen as soon as possible (if present)
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }

        // Check authentication
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const user = await this.api.get('/auth/me');
                this.store.setUser(user);
            } catch (error) {
                localStorage.removeItem('token');
            }
        }
        
        // Initialize router (may replace #app contents)
        this.router.init();
    }
}

// Initialize app
new App();
