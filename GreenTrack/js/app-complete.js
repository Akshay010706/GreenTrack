// GreenTrack Application - Complete Bundled Version with Supabase
console.log('GreenTrack app-complete.js loading...');

// Supabase Configuration
const SUPABASE_URL = 'https://ncbqpmlwqernubikpcry.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jYnFwbWx3cWVybnViaWtwY3J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNDEyMzQsImV4cCI6MjA3MjkxNzIzNH0.k6odDMLIrTzBhXNy7KOK2yjQKK7zJTwz-e0QIRlywW0';

// Initialize Supabase
let supabase = null;
if (typeof Supabase === 'undefined') {
    console.error('Supabase not loaded!');
} else {
    console.log('Supabase loaded successfully');
    supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Utility Functions
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

// Database Class (Local storage + Supabase hybrid)
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

    findById(collection, id) {
        const items = this.getAll(collection);
        return items.find(item => item.id === id);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Supabase methods
    async getReportsFromSupabase() {
        if (!supabase) return [];
        const { data, error } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
        if (error) {
            console.error('Error loading reports:', error);
            return [];
        }
        return data || [];
    }

    async updateReportStatus(reportId, status) {
        if (!supabase) {
            console.error('Supabase not available');
            return false;
        }
        const { data, error } = await supabase
            .from('reports')
            .update({ status })
            .eq('id', reportId);
        
        if (error) {
            console.error('Error updating report:', error);
            return false;
        }
        return true;
    }
}

// Auth Class
class Auth {
    constructor() {
        console.log('Auth constructor');
        this.currentUser = null;
        this.loadSession();
    }

    login(email, password) {
        console.log(`Attempting to login with email: ${email}`);
        const users = window.db.getAll('users');
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

// Report System Class
class ReportSystem {
    constructor() {
        this.categories = ['litter', 'overflow', 'burning', 'hazardous'];
    }

    renderReportForm() {
        return `
            <div class="card">
                <h1>📋 Report Waste Issue</h1>
                <form id="report-form" onsubmit="reportSystem.submitReport(event)">
                    <div class="form-group">
                        <label class="form-label">Category *</label>
                        <select class="form-control" name="category" required>
                            <option value="">Select category</option>
                            <option value="litter">Litter</option>
                            <option value="overflow">Bin Overflow</option>
                            <option value="burning">Illegal Burning</option>
                            <option value="hazardous">Hazardous Waste</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Photo *</label>
                        <input type="file" class="form-control" name="photo" accept="image/*" required>
                        <div id="photo-preview" style="margin-top: 1rem;"></div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Description</label>
                        <textarea class="form-control" name="note" rows="4" placeholder="Describe the issue..."></textarea>
                    </div>

                    <div class="form-group">
                        <label class="form-checkbox">
                            <input type="checkbox" name="buildingNonSegregating">
                            Building is not segregating waste
                        </label>
                    </div>

                    <button type="submit" class="btn btn-success">Submit Report</button>
                </form>
            </div>
        `;
    }

    async submitReport(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const photoFile = formData.get('photo');
        const user = window.auth.currentUser;

        if (!photoFile) {
            showToast('Please select a photo', 'error');
            return;
        }

        try {
            // Convert image to base64 for demo (in real app, would upload to Supabase Storage)
            const reader = new FileReader();
            reader.onload = async (e) => {
                const photoBase64 = e.target.result;
                
                // Simulate getting location
                const lat = 26.8467 + (Math.random() - 0.5) * 0.1;
                const lng = 80.9462 + (Math.random() - 0.5) * 0.1;

                const report = {
                    category: formData.get('category'),
                    photo_url: photoBase64,
                    note: formData.get('note'),
                    lat: lat,
                    lng: lng,
                    status: 'new',
                    user_id: user.id,
                    created_at: new Date().toISOString(),
                    buildingNonSegregating: formData.get('buildingNonSegregating') ? true : false
                };

                // Try to submit to Supabase first
                if (supabase) {
                    const { data, error } = await supabase
                        .from('reports')
                        .insert([report])
                        .select();
                    
                    if (!error) {
                        showToast('Report submitted successfully!', 'success');
                        // Award points
                        user.points += 5;
                        window.db.updateById('users', user.id, { points: user.points });
                        window.router.navigate('/map');
                        return;
                    } else {
                        console.error('Supabase error:', error);
                    }
                }

                // Fallback to localStorage
                window.db.add('reports', report);
                showToast('Report submitted successfully (offline)!', 'success');
                user.points += 5;
                window.db.updateById('users', user.id, { points: user.points });
                form.reset();
            };
            reader.readAsDataURL(photoFile);
        } catch (error) {
            console.error('Error submitting report:', error);
            showToast('Error submitting report', 'error');
        }
    }

    async loadReports() {
        if (supabase) {
            return await window.db.getReportsFromSupabase();
        }
        return window.db.getAll('reports');
    }
}

// Dashboard Class
class Dashboard {
    constructor() {
        this.charts = {};
    }

    async renderDashboard() {
        if (!window.auth.requireRole('admin')) return;

        const reports = await window.reportSystem.loadReports();
        const users = window.db.getAll('users');
        const trainedUsers = users.filter(u => u.trained).length;
        const nonSegregatingReports = reports.filter(r => r.buildingNonSegregating).length;

        return `
            <div class="card">
                <h1>📊 Admin Dashboard</h1>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 2rem 0;">
                    <div class="metric-card" style="background: var(--success-color); color: white; text-align: center; padding: 1rem;">
                        <h2>${reports.length}</h2>
                        <p>Total Reports</p>
                    </div>
                    <div class="metric-card" style="background: var(--primary-color); color: white; text-align: center; padding: 1rem;">
                        <h2>${trainedUsers}</h2>
                        <p>Trained Citizens</p>
                    </div>
                    <div class="metric-card" style="background: var(--warning-color); color: white; text-align: center; padding: 1rem;">
                        <h2>${nonSegregatingReports}</h2>
                        <p>Non-Segregating Buildings</p>
                    </div>
                    <div class="metric-card" style="background: var(--info-color); color: white; text-align: center; padding: 1rem;">
                        <h2>${reports.filter(r => r.status === 'new').length}</h2>
                        <p>New Reports</p>
                    </div>
                </div>

                <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 1rem; margin: 2rem 0;">
                    <div class="card">
                        <h3>Reports by Category</h3>
                        <canvas id="categoryChart" width="400" height="200"></canvas>
                    </div>
                    <div class="card">
                        <h3>Weekly Report Trend</h3>
                        <canvas id="trendChart" width="400" height="200"></canvas>
                    </div>
                </div>

                <div class="card">
                    <h3>All Reports Management</h3>
                    <div class="table-container" style="overflow-x: auto;">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Category</th>
                                    <th>User</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${reports.slice(0, 10).map(report => {
                                    const user = window.db.findById('users', report.user_id || report.createdByUserId);
                                    return `
                                        <tr>
                                            <td>${formatDate(report.created_at || report.createdAt)}</td>
                                            <td><span class="badge">${report.category}</span></td>
                                            <td>${user ? user.name : 'Unknown'}</td>
                                            <td><span class="badge ${report.status === 'resolved' ? 'success' : report.status === 'assigned' ? 'warning' : ''}">${report.status}</span></td>
                                            <td>
                                                <button class="btn btn-secondary" onclick="dashboard.viewReport('${report.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.875rem;">View</button>
                                                ${report.status === 'new' ? `<button class="btn btn-warning" onclick="dashboard.assignReport('${report.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.875rem; margin-left: 0.5rem;">Assign</button>` : ''}
                                                ${report.status === 'assigned' ? `<button class="btn btn-success" onclick="dashboard.resolveReport('${report.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.875rem; margin-left: 0.5rem;">Resolve</button>` : ''}
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="card">
                    <h3>Data Export/Import</h3>
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                        <button class="btn btn-secondary" onclick="dashboard.exportData()">Export Data</button>
                        <input type="file" id="import-file" accept=".json" style="display: none;" onchange="dashboard.importData(event)">
                        <button class="btn btn-secondary" onclick="document.getElementById('import-file').click()">Import Data</button>
                    </div>
                </div>
            </div>
        `;
    }

    initCharts() {
        setTimeout(() => {
            this.createCategoryChart();
            this.createTrendChart();
        }, 100);
    }

    async createCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        const reports = await window.reportSystem.loadReports();
        const categories = ['litter', 'overflow', 'burning', 'hazardous'];
        const data = categories.map(cat =>
            reports.filter(r => r.category === cat).length
        );

        if (this.charts.category) {
            this.charts.category.destroy();
        }

        this.charts.category = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Litter', 'Overflow', 'Burning', 'Hazardous'],
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#ff6384',
                        '#36a2eb',
                        '#ffce56',
                        '#4bc0c0'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    async createTrendChart() {
        const ctx = document.getElementById('trendChart');
        if (!ctx) return;

        const reports = await window.reportSystem.loadReports();
        const last7Days = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const count = reports.filter(r => {
                const reportDate = (r.created_at || r.createdAt).split('T')[0];
                return reportDate === dateStr;
            }).length;
            last7Days.push({
                date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                count: count
            });
        }

        if (this.charts.trend) {
            this.charts.trend.destroy();
        }

        this.charts.trend = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: last7Days.map(d => d.date),
                datasets: [{
                    label: 'Reports',
                    data: last7Days.map(d => d.count),
                    backgroundColor: '#4caf50'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    async viewReport(reportId) {
        const reports = await window.reportSystem.loadReports();
        const report = reports.find(r => r.id === reportId);
        if (!report) return;

        const user = window.db.findById('users', report.user_id || report.createdByUserId);

        showModal('Report Details', `
            <div style="max-height: 400px; overflow-y: auto;">
                <p><strong>Category:</strong> ${report.category}</p>
                <p><strong>Reporter:</strong> ${user ? user.name : 'Unknown'}</p>
                <p><strong>Date:</strong> ${formatDateTime(report.created_at || report.createdAt)}</p>
                <p><strong>Status:</strong> ${report.status}</p>
                <p><strong>Location:</strong> ${report.lat.toFixed(6)}, ${report.lng.toFixed(6)}</p>
                ${report.note ? `<p><strong>Note:</strong> ${report.note}</p>` : ''}
                ${report.buildingNonSegregating ? '<p><strong>⚠️ Non-segregating building reported</strong></p>' : ''}
                <p><strong>Photo:</strong></p>
                <img src="${report.photo_url}" style="width: 100%; max-width: 300px; height: auto;">
            </div>
        `);
    }

    async assignReport(reportId) {
        const success = await window.db.updateReportStatus(reportId, 'assigned');
        if (success || !supabase) {
            // Update local storage too
            window.db.updateById('reports', reportId, { status: 'assigned' });
            showToast('Report assigned successfully');
            window.router.handleRoute(); // Refresh
        } else {
            showToast('Error assigning report', 'error');
        }
    }

    async resolveReport(reportId) {
        const success = await window.db.updateReportStatus(reportId, 'resolved');
        if (success || !supabase) {
            // Update local storage too
            window.db.updateById('reports', reportId, { status: 'resolved' });
            showToast('Report resolved successfully');
            window.router.handleRoute(); // Refresh
        } else {
            showToast('Error resolving report', 'error');
        }
    }

    exportData() {
        const data = window.db.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `greentrack-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Data exported successfully');
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const success = window.db.importData(e.target.result);
                if (success) {
                    showToast('Data imported successfully');
                    window.router.handleRoute();
                } else {
                    showToast('Error importing data', 'error');
                }
            } catch (error) {
                showToast('Invalid file format', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Training Class (simplified but functional)
class Training {
    renderTraining() {
        if (!window.auth.requireRole('citizen')) return '';
        
        const user = window.auth.currentUser;
        return `
            <div class="card">
                <h1>🎓 Training Center</h1>
                <p>Complete training modules to become Green Certified!</p>
                
                <div style="margin: 2rem 0;">
                    ${user.trained ? `
                        <div class="card" style="border: 2px solid var(--success-color);">
                            <h3>🏆 Congratulations!</h3>
                            <p>You are <strong>Green Certified</strong>!</p>
                            <p>Points: ${user.points}</p>
                        </div>
                    ` : `
                        <div class="card">
                            <h3>📚 Module 1: Waste Segregation</h3>
                            <p>Learn about proper waste segregation techniques.</p>
                            <button class="btn" onclick="completeTraining()">Complete Training</button>
                        </div>
                    `}
                </div>
            </div>
        `;
    }
}

// Router Class
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

    async handleRoute() {
        console.log('handleRoute called');
        const hash = window.location.hash.slice(1) || '/login';
        console.log(`Current hash: ${hash}`);
        this.currentRoute = hash;

        if (this.routes[hash]) {
            console.log(`Routing to ${hash}`);
            const content = await this.routes[hash]();
            if (content) {
                document.getElementById('app').innerHTML = content;
            }
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
                { href: '#/report', text: 'Report Waste', icon: '📋' },
                { href: '#/map', text: 'Map', icon: '🗺️' }
            ];
        } else if (role === 'worker') {
            links = [
                { href: '#/reports', text: 'Reports', icon: '📋' },
                { href: '#/map', text: 'Map', icon: '🗺️' }
            ];
        } else if (role === 'admin') {
            links = [
                { href: '#/dashboard', text: 'Dashboard', icon: '📊' },
                { href: '#/reports', text: 'All Reports', icon: '📋' },
                { href: '#/map', text: 'Map', icon: '🗺️' }
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

// Login functions
function renderLogin() {
    console.log('renderLogin called');
    return `
        <div style="max-width: 450px; margin: 4rem auto; text-align: center;">
            <div class="card" style="padding: 2.5rem;">
                <span style="font-size: 4rem; display: block;">🌱</span>
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
            window.router.navigate('/reports');
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
            window.router.navigate('/reports');
        } else if (role === 'admin') {
            window.router.navigate('/dashboard');
        }
    }
}

// Global functions
function logout() {
    window.auth.logout();
    window.router.navigate('/login');
}

function completeTraining() {
    const user = window.auth.currentUser;
    user.trained = true;
    user.points += 20;
    window.db.updateById('users', user.id, { trained: true, points: user.points });
    showToast('Training completed! You are now Green Certified! +20 points');
    window.router.navigate('/report');
}

// Profile render function
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
                <p><strong>Training:</strong> ${user.trained ? '✅ Green Certified' : '❌ Not certified'}</p>
            </div>
        </div>
    `;
}

// Worker reports view
async function renderWorkerReports() {
    if (!window.auth.requireRole('worker')) return '';

    const reports = await window.reportSystem.loadReports();

    return `
        <div class="card">
            <h1>📋 Waste Reports (Worker View)</h1>

            <div class="table-container" style="overflow-x: auto;">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Category</th>
                            <th>Location</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reports.map(report => {
                            return `
                                <tr>
                                    <td>${formatDate(report.created_at || report.createdAt)}</td>
                                    <td><span class="badge">${report.category}</span></td>
                                    <td>${report.lat.toFixed(4)}, ${report.lng.toFixed(4)}</td>
                                    <td><span class="badge ${report.status === 'resolved' ? 'success' : report.status === 'assigned' ? 'warning' : ''}">${report.status}</span></td>
                                    <td>
                                        <button class="btn btn-secondary" onclick="viewWorkerReport('${report.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.875rem;">View</button>
                                        ${report.status === 'new' ? `<button class="btn btn-warning" onclick="assignWorkerReport('${report.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.875rem; margin-left: 0.5rem;">Assign to Me</button>` : ''}
                                        ${report.status === 'assigned' ? `<button class="btn btn-success" onclick="resolveWorkerReport('${report.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.875rem; margin-left: 0.5rem;">Mark Resolved</button>` : ''}
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function viewWorkerReport(reportId) {
    const reports = await window.reportSystem.loadReports();
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    const user = window.db.findById('users', report.user_id || report.createdByUserId);

    showModal('Report Details', `
        <div style="max-height: 400px; overflow-y: auto;">
            <p><strong>Category:</strong> ${report.category}</p>
            <p><strong>Reporter:</strong> ${user ? user.name : 'Unknown'}</p>
            <p><strong>Date:</strong> ${formatDateTime(report.created_at || report.createdAt)}</p>
            <p><strong>Status:</strong> ${report.status}</p>
            <p><strong>Location:</strong> ${report.lat.toFixed(6)}, ${report.lng.toFixed(6)}</p>
            ${report.note ? `<p><strong>Note:</strong> ${report.note}</p>` : ''}
            ${report.buildingNonSegregating ? '<p><strong>⚠️ Non-segregating building reported</strong></p>' : ''}
            <p><strong>Photo:</strong></p>
            <img src="${report.photo_url}" style="width: 100%; max-width: 300px; height: auto;">
        </div>
    `);
}

async function assignWorkerReport(reportId) {
    const success = await window.db.updateReportStatus(reportId, 'assigned');
    if (success || !supabase) {
        window.db.updateById('reports', reportId, { status: 'assigned' });
        showToast('Report assigned to you successfully');
        window.router.handleRoute();
    } else {
        showToast('Error assigning report', 'error');
    }
}

async function resolveWorkerReport(reportId) {
    const success = await window.db.updateReportStatus(reportId, 'resolved');
    if (success || !supabase) {
        window.db.updateById('reports', reportId, { status: 'resolved' });
        showToast('Report marked as resolved');
        window.router.handleRoute();
    } else {
        showToast('Error resolving report', 'error');
    }
}

// Map System Class
class MapSystem {
    constructor() {
        this.map = null;
        this.reportLayer = null;
        this.currentLocation = [26.8467, 80.9462]; // Default to Lucknow
    }

    renderMap() {
        return `
            <div class="card">
                <div class="card-header">
                    <h1>🗺️ Waste Management Map</h1>
                    <div>
                        <button class="btn btn-secondary" onclick="window.mapSystem.refreshMap()">Refresh</button>
                        <button class="btn btn-secondary" onclick="window.mapSystem.centerOnUser()">My Location</button>
                    </div>
                </div>

                <div id="map" class="map-container" style="height: 500px; margin: 1rem 0;"></div>

                <div class="grid grid-2" style="margin-top: 1rem;">
                    <div class="card">
                        <h3>Legend</h3>
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            <span>🔴 New Reports</span>
                            <span>🟡 Assigned Reports</span>
                            <span>🟢 Resolved Reports</span>
                            <span>📍 Your Location</span>
                        </div>
                    </div>

                    <div class="card">
                        <h3>Statistics</h3>
                        <div id="map-stats">Loading...</div>
                    </div>
                </div>
            </div>
        `;
    }

    async initMap() {
        // Wait a bit for DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const mapElement = document.getElementById('map');
        if (!mapElement) {
            console.error('Map element not found');
            return;
        }

        if (this.map) {
            this.map.remove();
        }

        try {
            // Create map centered on current location
            this.map = L.map('map').setView(this.currentLocation, 13);

            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.map);

            // Create layer for reports
            this.reportLayer = L.layerGroup().addTo(this.map);

            // Load reports on map
            await this.loadReports();
            this.updateStats();

            console.log('Map initialized successfully');
        } catch (error) {
            console.error('Error initializing map:', error);
            showToast('Error loading map', 'error');
        }
    }

    async loadReports() {
        if (!this.reportLayer) return;
        
        this.reportLayer.clearLayers();
        
        try {
            const reports = await window.reportSystem.loadReports();

            reports.forEach(report => {
                if (!report.lat || !report.lng) return;

                let color = '#dc3545'; // red for new
                if (report.status === 'assigned') color = '#fd7e14'; // orange
                if (report.status === 'resolved') color = '#28a745'; // green

                const marker = L.circleMarker([report.lat, report.lng], {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.8,
                    radius: 8,
                    weight: 2
                }).addTo(this.reportLayer);

                const reportDate = report.created_at || report.createdAt;
                const formattedDate = reportDate ? formatDate(reportDate) : 'Unknown date';
                
                marker.bindPopup(`
                    <div style="min-width: 200px;">
                        <strong>${report.category.toUpperCase()}</strong><br>
                        <strong>Date:</strong> ${formattedDate}<br>
                        <strong>Status:</strong> <span style="color: ${color}">${report.status}</span><br>
                        <strong>Location:</strong> ${report.lat.toFixed(4)}, ${report.lng.toFixed(4)}<br>
                        ${report.note ? `<strong>Note:</strong> ${report.note}<br>` : ''}
                        ${report.photo_url ? `<img src="${report.photo_url}" style="width:100%; max-width:200px; height:auto; margin-top:5px; border-radius:4px;">` : ''}
                    </div>
                `);
            });

            console.log(`Loaded ${reports.length} reports on map`);
        } catch (error) {
            console.error('Error loading reports on map:', error);
        }
    }

    async updateStats() {
        const statsEl = document.getElementById('map-stats');
        if (!statsEl) return;

        try {
            const reports = await window.reportSystem.loadReports();
            const stats = {
                total: reports.length,
                new: reports.filter(r => r.status === 'new').length,
                assigned: reports.filter(r => r.status === 'assigned').length,
                resolved: reports.filter(r => r.status === 'resolved').length
            };

            statsEl.innerHTML = `
                <p><strong>Total Reports:</strong> ${stats.total}</p>
                <p><strong>New:</strong> ${stats.new}</p>
                <p><strong>Assigned:</strong> ${stats.assigned}</p>
                <p><strong>Resolved:</strong> ${stats.resolved}</p>
            `;
        } catch (error) {
            console.error('Error updating map stats:', error);
            statsEl.innerHTML = '<p>Error loading statistics</p>';
        }
    }

    centerOnUser() {
        if ('geolocation' in navigator) {
            showToast('Getting your location...');
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    this.currentLocation = [lat, lng];
                    
                    if (this.map) {
                        this.map.setView([lat, lng], 15);
                        
                        // Add user location marker
                        L.marker([lat, lng], {
                            icon: L.divIcon({
                                html: '📍',
                                className: 'user-location-icon',
                                iconSize: [25, 25]
                            })
                        }).addTo(this.map).bindPopup('Your Location');
                        
                        showToast('Centered on your location');
                    }
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    showToast('Could not get your location', 'error');
                }
            );
        } else {
            showToast('Geolocation not supported', 'error');
        }
    }

    async refreshMap() {
        await this.loadReports();
        this.updateStats();
        showToast('Map refreshed');
    }
}

// Updated map render function
function renderMap() {
    const mapSystem = new MapSystem();
    window.mapSystem = mapSystem; // Make it globally accessible
    
    // Initialize map after a short delay to ensure DOM is ready
    setTimeout(() => {
        mapSystem.initMap();
    }, 100);
    
    return mapSystem.renderMap();
}

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded fired');
    
    // Hide the fallback message since JS is loading
    const fallback = document.getElementById('js-fallback');
    if (fallback) {
        fallback.style.display = 'none';
    }
    
    try {
        // Initialize global instances
        window.db = new Database();
        window.auth = new Auth();
        window.reportSystem = new ReportSystem();
        window.dashboard = new Dashboard();
        window.training = new Training();
        window.router = new Router();

        // Make functions global for onclick handlers
        window.handleLogin = handleLogin;
        window.quickLogin = quickLogin;
        window.logout = logout;
        window.completeTraining = completeTraining;
        window.viewWorkerReport = viewWorkerReport;
        window.assignWorkerReport = assignWorkerReport;
        window.resolveWorkerReport = resolveWorkerReport;

        // Register routes
        window.router.register('/login', () => {
            return renderLogin();
        });

        window.router.register('/training', () => {
            if (!window.auth.requireAuth()) {
                window.router.navigate('/login');
                return;
            }
            return window.training.renderTraining();
        });

        window.router.register('/report', () => {
            if (!window.auth.requireAuth()) {
                window.router.navigate('/login');
                return;
            }
            return window.reportSystem.renderReportForm();
        });

        window.router.register('/dashboard', async () => {
            if (!window.auth.requireRole('admin')) {
                window.router.navigate('/login');
                return;
            }
            const content = await window.dashboard.renderDashboard();
            // Initialize charts after content is rendered
            setTimeout(() => window.dashboard.initCharts(), 100);
            return content;
        });

        window.router.register('/profile', () => {
            if (!window.auth.requireAuth()) {
                window.router.navigate('/login');
                return;
            }
            return renderProfile();
        });

        window.router.register('/reports', async () => {
            if (!window.auth.requireAuth()) {
                window.router.navigate('/login');
                return;
            }
            
            if (window.auth.hasRole('admin')) {
                const content = await window.dashboard.renderDashboard();
                setTimeout(() => window.dashboard.initCharts(), 100);
                return content;
            } else if (window.auth.hasRole('worker')) {
                return await renderWorkerReports();
            } else {
                showToast('Access denied', 'error');
                return;
            }
        });

        window.router.register('/map', () => {
            return renderMap();
        });

        // Initial route handling
        await window.router.handleRoute();
        
        console.log('GreenTrack initialized successfully');

    } catch (error) {
        console.error('Error initializing GreenTrack:', error);
        document.getElementById('js-fallback').style.display = 'block';
        document.getElementById('js-fallback').textContent = `Error: ${error.message}`;
    }
});

console.log('app-complete.js loaded successfully');
