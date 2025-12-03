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
        
        // Initialize router
        this.router.init();
        
        // Hide loading
        document.getElementById('loading').style.display = 'none';
    }
}

// Initialize app
new App();
