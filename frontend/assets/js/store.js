export class Store {
    constructor() {
        this.state = {
            user: null,
            complaints: [],
            loading: false
        };
        this.listeners = [];
    }
    
    getState() {
        return this.state;
    }
    
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notify();
    }
    
    setUser(user) {
        this.setState({ user });
    }
    
    subscribe(listener) {
        this.listeners.push(listener);
    }
    
    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }
}
