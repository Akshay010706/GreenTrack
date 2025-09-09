import { renderLogin, handleLogin, quickLogin } from './login.js';
import { training } from './training.js';
import { reportSystem } from './report-system.js';
import { mapSystem } from './map-system.js';
import { dashboard } from './dashboard.js';
import { facilitySystem } from './facility-system.js';
import { incentiveSystem } from './incentive-system.js';
import { renderProfile } from './profile.js';
import { auth } from './auth.js';
import { db } from './db.js';
import { showModal, showToast, formatDate, formatDateTime } from './utils.js';

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

document.addEventListener('DOMContentLoaded', () => {
    console.log('GreenTrack initialized');

    const router = new Router();

    // Make functions and objects available globally
    window.handleLogin = handleLogin;
    window.quickLogin = quickLogin;
    window.training = training;
    window.reportSystem = reportSystem;
    window.mapSystem = mapSystem;
    window.dashboard = dashboard;
    window.facilitySystem = facilitySystem;
    window.incentiveSystem = incentiveSystem;
    window.auth = auth;
    window.router = router;

    function viewWorkerReport(reportId) {
        const report = db.findById('reports', reportId);
        if (!report) return;

        const user = db.findById('users', report.createdByUserId);

        showModal('Report Details', `
            <div style="max-height: 400px; overflow-y: auto;">
                <p><strong>Category:</strong> ${report.category}</p>
                <p><strong>Reporter:</strong> ${user ? user.name : 'Unknown'}</p>
                <p><strong>Date:</strong> ${formatDateTime(report.createdAt)}</p>
                <p><strong>Status:</strong> ${report.status}</p>
                <p><strong>Location:</strong> ${report.lat.toFixed(6)}, ${report.lng.toFixed(6)}</p>
                ${report.note ? `<p><strong>Note:</strong> ${report.note}</p>` : ''}
                ${report.buildingNonSegregating ? '<p><strong>⚠️ Non-segregating building reported</strong></p>' : ''}
                <p><strong>Photo:</strong></p>
                <img src="${report.photoBase64}" style="width: 100%; max-width: 300px; height: auto;">
            </div>
        `);
    }

    function assignReport(reportId) {
        db.updateById('reports', reportId, { status: 'assigned' });
        showToast('Report assigned successfully');
        router.handleRoute(); // Refresh
    }

    window.viewWorkerReport = viewWorkerReport;
    window.assignReport = assignReport;

    // Register routes
    router.register('/login', () => {
        document.getElementById('app').innerHTML = renderLogin();
    });

    router.register('/training', () => {
        document.getElementById('app').innerHTML = training.renderTraining();
    });

    router.register('/report', () => {
        document.getElementById('app').innerHTML = reportSystem.renderReportForm();
        // Add photo preview functionality
        setTimeout(() => {
            const photoInput = document.querySelector('input[name="photo"]');
            if (photoInput) {
                photoInput.addEventListener('change', function(e) {
                    const file = e.target.files[0];
                    const preview = document.getElementById('photo-preview');
                    if (file && preview) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            preview.innerHTML = `<img src="${e.target.result}" style="max-width: 200px; height: auto; border-radius: 4px;">`;
                        };
                        reader.readAsDataURL(file);
                    }
                });
            }
        }, 100);
    });

    router.register('/map', () => {
        document.getElementById('app').innerHTML = mapSystem.renderMap();
        setTimeout(() => mapSystem.initMap(), 100);
    });

    router.register('/dashboard', () => {
        document.getElementById('app').innerHTML = dashboard.renderDashboard();
        dashboard.initCharts();
    });

    router.register('/facilities', () => {
        document.getElementById('app').innerHTML = facilitySystem.renderFacilities();
        facilitySystem.initMap();
    });

    router.register('/leaderboard', () => {
        document.getElementById('app').innerHTML = incentiveSystem.renderLeaderboard();
    });

    router.register('/profile', () => {
        if (!auth.requireAuth()) {
            router.navigate('/login');
            return;
        };
        document.getElementById('app').innerHTML = renderProfile();
    });

    router.register('/reports', () => {
        if (!auth.requireRole('worker')) {
            router.navigate('/login');
            return;
        }

        const reports = db.getAll('reports').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        document.getElementById('app').innerHTML = `
            <div class="card">
                <h1>📋 Waste Reports</h1>

                <div class="table-container" style="overflow-x: auto;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Reporter</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${reports.map(report => {
                                const user = db.findById('users', report.createdByUserId);
                                return `
                                    <tr>
                                        <td>${formatDate(report.createdAt)}</td>
                                        <td><span class="badge">${report.category}</span></td>
                                        <td>${user ? user.name : 'Unknown'}</td>
                                        <td>${report.lat.toFixed(4)}, ${report.lng.toFixed(4)}</td>
                                        <td><span class="badge ${report.status === 'resolved' ? 'success' : report.status === 'assigned' ? 'warning' : ''}">${report.status}</span></td>
                                        <td>
                                            <button class="btn btn-secondary" onclick="viewWorkerReport('${report.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.875rem;">View</button>
                                            ${report.status === 'new' ? `<button class="btn btn-warning" onclick="assignReport('${report.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.875rem; margin-left: 0.5rem;">Assign</button>` : ''}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });

    // Initial route handling
    router.handleRoute();
});

// Service Worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
