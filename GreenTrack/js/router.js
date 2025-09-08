import { auth } from './auth.js';

class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.init();
    }

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    }

    register(path, handler) {
        this.routes[path] = handler;
    }

    navigate(path) {
        window.location.hash = path;
    }

    handleRoute() {
        const hash = window.location.hash.slice(1) || '/login';
        this.currentRoute = hash;

        if (this.routes[hash]) {
            this.routes[hash]();
        } else {
            this.navigate('/login');
        }

        this.updateNav();
    }

    updateNav() {
        const nav = document.getElementById('nav');
        const isAuth = auth.isAuthenticated();

        if (!isAuth) {
            nav.innerHTML = '<a href="#/login">Login</a>';
            return;
        }

        const role = auth.currentUser.role;
        let links = [];

        if (role === 'citizen') {
            links = [
                { href: '#/training', text: 'Training', icon: '📚' },
                { href: '#/report', text: 'Report Waste', icon: '📋' },
                { href: '#/map', text: 'Map', icon: '🗺️' },
                { href: '#/facilities', text: 'Facilities', icon: '🏢' },
                { href: '#/leaderboard', text: 'Leaderboard', icon: '🏆' }
            ];
        } else if (role === 'worker') {
            links = [
                { href: '#/map', text: 'Map', icon: '🗺️' },
                { href: '#/reports', text: 'Reports', icon: '📋' }
            ];
        } else if (role === 'admin') {
            links = [
                { href: '#/dashboard', text: 'Dashboard', icon: '📊' },
                { href: '#/map', text: 'Map', icon: '🗺️' },
                { href: '#/facilities', text: 'Facilities', icon: '🏢' },
                { href: '#/leaderboard', text: 'Leaderboard', icon: '🏆' }
            ];
        }

        links.push({ href: '#/profile', text: auth.currentUser.name, icon: '👤' });

        nav.innerHTML = links.map(link => `
            <a href="${link.href}" class="${this.currentRoute === link.href.slice(1) ? 'active' : ''}">
                ${link.icon} ${link.text}
            </a>
        `).join('') + '<button class="btn" onclick="auth.logout()" style="margin-left: 1rem;">Logout</button>';
    }
}

const router = new Router();
export { router };
