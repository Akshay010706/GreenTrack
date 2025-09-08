import { db } from './db.js';
import { showToast } from './utils.js';

class Auth {
    constructor() {
        console.log('Auth constructor');
        this.currentUser = null;
        this.loadSession();
    }

    login(email, password) {
        console.log(`Attempting to login with email: ${email}`);
        const users = db.getAll('users');
        console.log('Users from db:', users);
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            console.log('Login successful for user:', user);
            this.currentUser = user;
            localStorage.setItem('currentSession', JSON.stringify(user));
            return { success: true, user };
        }

        console.log('Login failed');
        return { success: false, error: 'Invalid credentials' };
    }

    logout() {
        console.log('Logging out');
        this.currentUser = null;
        localStorage.removeItem('currentSession');
        // The router will handle the navigation to the login page
    }

    loadSession() {
        console.log('Loading session');
        const session = localStorage.getItem('currentSession');
        if (session) {
            this.currentUser = JSON.parse(session);
            console.log('Session loaded for user:', this.currentUser);
        }
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }

    requireAuth() {
        if (!this.isAuthenticated()) {
            console.log('Auth required, but user not authenticated');
            return false;
        }
        return true;
    }

    requireRole(role) {
        if (!this.requireAuth() || !this.hasRole(role)) {
            showToast('Access denied', 'error');
            return false;
        }
        return true;
    }
}

const auth = new Auth();
export { auth };
