export class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
    }
    
    addRoute(path, handler) {
        this.routes[path] = handler;
    }
    
    navigate(path) {
        window.history.pushState({}, '', path);
        this.handleRoute(path);
    }
    
    handleRoute(path) {
        const handler = this.routes[path] || this.routes['/404'];
        if (handler) {
            handler();
        }
    }
    
    init() {
        // Register routes
        this.addRoute('/', () => this.loadPage('home'));
        this.addRoute('/login', () => this.loadPage('login'));
        this.addRoute('/complaints', () => this.loadPage('complaints'));
        
        // Handle initial load
        this.handleRoute(window.location.pathname);
        
        // Handle back/forward
        window.addEventListener('popstate', () => {
            this.handleRoute(window.location.pathname);
        });
    }
    
    loadPage(page) {
        document.getElementById('app').innerHTML = `<h1>${page}</h1>`;
    }
}
