import { db } from './db.js';
import { showToast } from './utils.js';

class Auth {
    constructor() {
        this.currentUser = null;
        this.loadSession();
    }

    login(email, password) {
        const users = db.getAll('users');
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentSession', JSON.stringify(user));
            return { success: true, user };
        }

        return { success: false, error: 'Invalid credentials' };
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentSession');
        // The router will handle the navigation to the login page
    }

    loadSession() {
        const session = localStorage.getItem('currentSession');
        if (session) {
            this.currentUser = JSON.parse(session);
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
