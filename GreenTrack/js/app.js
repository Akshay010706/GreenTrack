// GreenTrack Application - Complete Bundled Version
console.log('GreenTrack app.js loading...');

// Supabase Configuration
const SUPABASE_URL = 'https://ncbqpmlwqernubikpcry.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jYnFwbWx3cWVybnViaWtwY3J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNDEyMzQsImV4cCI6MjA3MjkxNzIzNH0.k6odDMLIrTzBhXNy7KOK2yjQKK7zJTwz-e0QIRlywW0';

// Check if Supabase is loaded
let supabase = null;
if (typeof Supabase === 'undefined') {
    console.error('Supabase not loaded!');
} else {
    console.log('Supabase loaded successfully');
    supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Utils
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showModal(title, content, buttons = []) {
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modal-content');

    modalContent.innerHTML = `
        <h2>${title}</h2>
        <div style="margin: 1rem 0;">${content}</div>
        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
            ${buttons.map(btn => `
                <button class="btn ${btn.class || ''}" onclick="${btn.onclick}">${btn.text}</button>
            `).join('')}
            <button class="btn btn-secondary" onclick="hideModal()">Close</button>
        </div>
    `;

    modal.classList.add('show');
}

function hideModal() {
    document.getElementById('modal').classList.remove('show');
}

function formatDate(date) {
    return new Date(date).toLocaleDateString();
}

function formatDateTime(date) {
    return new Date(date).toLocaleString();
}

// Database
class Database {
    constructor() {
        console.log('Database constructor');
        this.init();
    }

    init() {
        console.log('Database init');
        if (!localStorage.getItem('greentrack_initialized')) {
            console.log('Seeding users');
            this.seedUsers();
            localStorage.setItem('greentrack_initialized', 'true');
        }
    }

    seedUsers() {
        console.log('seedUsers called');
        // Seed users
        const users = [
            {
                id: 'admin-1',
                role: 'admin',
                name: 'Admin User',
                email: 'admin@demo',
                password: '1234',
                points: 0,
                trained: false
            },
            {
                id: 'worker-1',
                role: 'worker',
                name: 'Worker User',
                email: 'worker@demo',
                password: '1234',
                points: 0,
                trained: false
            },
            {
                id: 'citizen-1',
                role: 'citizen',
                name: 'Citizen User',
                email: 'citizen@demo',
                password: '1234',
                points: 50,
                trained: true
            }
        ];
        localStorage.setItem('users', JSON.stringify(users));
    }

    getAll(collection) {
        console.log(`getAll ${collection}`);
        const data = localStorage.getItem(collection);
        return data ? JSON.parse(data) : [];
    }

    add(collection, item) {
        const items = this.getAll(collection);
        item.id = item.id || this.generateId();
        items.push(item);
        localStorage.setItem(collection, JSON.stringify(items));
        return item;
    }

    updateById(collection, id, updates) {
        const items = this.getAll(collection);
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...updates };
            localStorage.setItem(collection, JSON.stringify(items));
            return items[index];
        }
        return null;
    }

    remove(collection, id) {
        const items = this.getAll(collection);
        const filtered = items.filter(item => item.id !== id);
        localStorage.setItem(collection, JSON.stringify(filtered));
        return true;
    }

    findById(collection, id) {
        const items = this.getAll(collection);
        return items.find(item => item.id === id);
    }

    findBy(collection, predicate) {
        const items = this.getAll(collection);
        return items.filter(predicate);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    exportData() {
        const data = {};
        ['users', 'reports', 'facilities', 'trainingProgress'].forEach(collection => {
            data[collection] = this.getAll(collection);
        });
        return JSON.stringify(data, null, 2);
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            Object.keys(data).forEach(collection => {
                localStorage.setItem(collection, JSON.stringify(data[collection]));
            });
            return true;
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    }
}

// Auth
class Auth {
    constructor() {
        console.log('Auth constructor');
        this.currentUser = null;
        this.loadSession();
    }

    login(email, password) {
        console.log(`Attempting to login with email: ${email}`);
        const users = window.db.getAll('users');
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

// Login functions
function renderLogin() {
    console.log('renderLogin called');
    return `
        <div style="max-width: 450px; margin: 4rem auto; text-align: center;">
            <div class="card" style="padding: 2.5rem; animation: fadeIn 0.5s ease-in-out;">
                <span style="font-size: 4rem; display: block; animation: bounce 1.5s infinite;">🌱</span>
                <h1 style="margin-bottom: 1rem; font-size: 2.5rem;">Welcome to GreenTrack</h1>
                <p style="color: var(--text-secondary); margin-bottom: 2.5rem; font-size: 1.1rem;">
                    Your digital platform for a cleaner, greener community. Report issues, get trained, and earn rewards.
                </p>

                <form id="login-form" onsubmit="handleLogin(event)" style="text-align: left;">
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-control" name="email" required placeholder="e.g., citizen@demo">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input type="password" class="form-control" name="password" required placeholder="e.g., 1234">
                    </div>

                    <button type="submit" class="btn" style="width: 100%; padding: 0.8rem; font-size: 1.1rem;">Login</button>
                </form>

                <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
                    <h3 style="margin-bottom: 1rem;">Or try a demo account:</h3>
                    <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
                        <button class="btn btn-secondary" onclick="quickLogin('admin@demo', '1234')">Admin</button>
                        <button class="btn btn-secondary" onclick="quickLogin('worker@demo', '1234')">Worker</button>
                        <button class="btn btn-secondary" onclick="quickLogin('citizen@demo', '1234')">Citizen</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    const result = window.auth.login(formData.get('email'), formData.get('password'));

    if (result.success) {
        showToast('Login successful!');
        const role = result.user.role;
        if (role === 'citizen') {
            window.router.navigate('/training');
        } else if (role === 'worker') {
            window.router.navigate('/map');
        } else if (role === 'admin') {
            window.router.navigate('/dashboard');
        }
    } else {
        showToast(result.error, 'error');
    }
}

function quickLogin(email, password) {
    const result = window.auth.login(email, password);
    if (result.success) {
        showToast('Login successful!');
        const role = result.user.role;
        if (role === 'citizen') {
            window.router.navigate('/training');
        } else if (role === 'worker') {
            window.router.navigate('/map');
        } else if (role === 'admin') {
            window.router.navigate('/dashboard');
        }
    }
}

// Simple training system
const training = {
    renderTraining() {
        return `
            <div class="card">
                <h1>🎓 Training Center</h1>
                <p>Complete training modules to become Green Certified!</p>
                
                <div style="margin: 2rem 0;">
                    <button class="btn" onclick="startTraining()" style="width: 100%; padding: 1rem;">
                        Start Training
                    </button>
                </div>
                
                <div id="training-content" style="display: none;">
                    <h2>Module 1: Waste Segregation</h2>
                    <p>Learn about proper waste segregation techniques...</p>
                    <button class="btn" onclick="completeTraining()">Complete Training</button>
                </div>
            </div>
        `;
    }
};

function startTraining() {
    document.getElementById('training-content').style.display = 'block';
}

function completeTraining() {
    showToast('Training completed! +20 points');
    window.auth.currentUser.trained = true;
    window.auth.currentUser.points += 20;
    window.router.navigate('/report');
}

// Simple Router
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
        console.log('handleRoute called');
        const hash = window.location.hash.slice(1) || '/login';
        console.log(`Current hash: ${hash}`);
        this.currentRoute = hash;

        if (this.routes[hash]) {
            console.log(`Routing to ${hash}`);
            this.routes[hash]();
        } else {
            console.log(`Route not found, navigating to /login`);
            this.navigate('/login');
        }

        this.updateNav();
    }

    updateNav() {
        const nav = document.getElementById('nav');
        const isAuth = window.auth.isAuthenticated();

        if (!isAuth) {
            nav.innerHTML = '<a href="#/login">Login</a>';
            return;
        }

        const role = window.auth.currentUser.role;
        let links = [];

        if (role === 'citizen') {
            links = [
                { href: '#/training', text: 'Training', icon: '📚' },
                { href: '#/report', text: 'Report Waste', icon: '📋' }
            ];
        } else if (role === 'worker') {
            links = [
                { href: '#/reports', text: 'Reports', icon: '📋' }
            ];
        } else if (role === 'admin') {
            links = [
                { href: '#/dashboard', text: 'Dashboard', icon: '📊' }
            ];
        }

        links.push({ href: '#/profile', text: window.auth.currentUser.name, icon: '👤' });

        nav.innerHTML = links.map(link => `
            <a href="${link.href}" class="${this.currentRoute === link.href.slice(1) ? 'active' : ''}">
                ${link.icon} ${link.text}
            </a>
        `).join('') + '<button class="btn" onclick="logout()" style="margin-left: 1rem;">Logout</button>';
    }
}

function logout() {
    window.auth.logout();
    window.router.navigate('/login');
}

// Basic report system
function renderReportForm() {
    return `
        <div class="card">
            <h1>📋 Report Waste</h1>
            <form onsubmit="submitReport(event)">
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <select name="category" class="form-control" required>
                        <option value="">Select category</option>
                        <option value="organic">Organic Waste</option>
                        <option value="plastic">Plastic</option>
                        <option value="metal">Metal</option>
                        <option value="paper">Paper</option>
                        <option value="glass">Glass</option>
                        <option value="hazardous">Hazardous</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Photo</label>
                    <input type="file" name="photo" class="form-control" accept="image/*">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea name="note" class="form-control" placeholder="Describe the issue"></textarea>
                </div>
                
                <button type="submit" class="btn">Submit Report</button>
            </form>
        </div>
    `;
}

function submitReport(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    // Simulate getting location
    const lat = 40.7128 + (Math.random() - 0.5) * 0.1;
    const lng = -74.0060 + (Math.random() - 0.5) * 0.1;
    
    const report = {
        category: formData.get('category'),
        note: formData.get('note'),
        lat: lat,
        lng: lng,
        status: 'new',
        createdAt: new Date().toISOString(),
        createdByUserId: window.auth.currentUser.id
    };
    
    window.db.add('reports', report);
    showToast('Report submitted successfully! +5 points');
    
    // Update user points
    window.auth.currentUser.points += 5;
    
    form.reset();
}

// Basic dashboard
function renderDashboard() {
    const reports = window.db.getAll('reports');
    return `
        <div class="card">
            <h1>📊 Admin Dashboard</h1>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 2rem 0;">
                <div class="metric-card">
                    <h3>Total Reports</h3>
                    <div class="metric-value">${reports.length}</div>
                </div>
                <div class="metric-card">
                    <h3>New Reports</h3>
                    <div class="metric-value">${reports.filter(r => r.status === 'new').length}</div>
                </div>
                <div class="metric-card">
                    <h3>Resolved</h3>
                    <div class="metric-value">${reports.filter(r => r.status === 'resolved').length}</div>
                </div>
            </div>
            
            <div style="margin-top: 2rem;">
                <h2>Recent Reports</h2>
                <div class="table-container">
                    ${reports.length > 0 ? `
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Category</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${reports.slice(0, 5).map(report => `
                                    <tr>
                                        <td>${formatDate(report.createdAt)}</td>
                                        <td>${report.category}</td>
                                        <td><span class="badge">${report.status}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : '<p>No reports yet.</p>'}
                </div>
            </div>
        </div>
    `;
}

// Profile
function renderProfile() {
    const user = window.auth.currentUser;
    return `
        <div class="card">
            <h1>👤 Profile</h1>
            <div style="margin: 2rem 0;">
                <p><strong>Name:</strong> ${user.name}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Role:</strong> ${user.role}</p>
                <p><strong>Points:</strong> ${user.points}</p>
                <p><strong>Training:</strong> ${user.trained ? '✅ Completed' : '❌ Not completed'}</p>
            </div>
        </div>
    `;
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired');
    
    // Hide the fallback message since JS is loading
    const fallback = document.getElementById('js-fallback');
    if (fallback) {
        fallback.style.display = 'none';
    }
    
    try {
        // Initialize database and auth
        window.db = new Database();
        window.auth = new Auth();
        window.router = new Router();

        // Make functions global
        window.handleLogin = handleLogin;
        window.quickLogin = quickLogin;
        window.logout = logout;
        window.startTraining = startTraining;
        window.completeTraining = completeTraining;
        window.submitReport = submitReport;

        // Register routes
        window.router.register('/login', () => {
            document.getElementById('app').innerHTML = renderLogin();
        });

        window.router.register('/training', () => {
            if (!window.auth.requireAuth()) {
                window.router.navigate('/login');
                return;
            }
            document.getElementById('app').innerHTML = training.renderTraining();
        });

        window.router.register('/report', () => {
            if (!window.auth.requireAuth()) {
                window.router.navigate('/login');
                return;
            }
            document.getElementById('app').innerHTML = renderReportForm();
        });

        window.router.register('/dashboard', () => {
            if (!window.auth.requireRole('admin')) {
                window.router.navigate('/login');
                return;
            }
            document.getElementById('app').innerHTML = renderDashboard();
        });

        window.router.register('/profile', () => {
            if (!window.auth.requireAuth()) {
                window.router.navigate('/login');
                return;
            }
            document.getElementById('app').innerHTML = renderProfile();
        });

        window.router.register('/reports', () => {
            if (!window.auth.requireRole('worker')) {
                window.router.navigate('/login');
                return;
            }
            const reports = window.db.getAll('reports');
            document.getElementById('app').innerHTML = `
                <div class="card">
                    <h1>📋 Waste Reports</h1>
                    <div class="table-container">
                        ${reports.length > 0 ? `
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Category</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${reports.map(report => `
                                        <tr>
                                            <td>${formatDate(report.createdAt)}</td>
                                            <td>${report.category}</td>
                                            <td><span class="badge">${report.status}</span></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        ` : '<p>No reports yet.</p>'}
                    </div>
                </div>
            `;
        });

        // Initial route handling
        window.router.handleRoute();
        
        console.log('GreenTrack initialized successfully');

    } catch (error) {
        console.error('Error initializing GreenTrack:', error);
        document.getElementById('js-fallback').style.display = 'block';
        document.getElementById('js-fallback').textContent = `Error: ${error.message}`;
    }
});

console.log('app.js loaded successfully');
