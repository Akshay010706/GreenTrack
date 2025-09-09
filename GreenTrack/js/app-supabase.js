// GreenTrack Application - Supabase Integrated Version
console.log('GreenTrack app-supabase.js loading...');

// Environment configuration
const SUPABASE_URL = window.ENV?.VITE_SUPABASE_URL || 'https://ncbqpmlwqernubikpcry.supabase.co';
const SUPABASE_ANON_KEY = window.ENV?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jYnFwbWx3cWVybnViaWtwY3J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNDEyMzQsImV4cCI6MjA3MjkxNzIzNH0.k6odDMLIrTzBhXNy7KOK2yjQKK7zJTwz-e0QIRlywW0';

// Initialize Supabase
let supabase = null;

function initializeSupabase() {
    if (typeof Supabase === 'undefined') {
        console.error('Supabase not loaded!');
        showToast('Loading database connection...', 'error');
        return false;
    } else {
        console.log('Supabase loaded successfully');
        supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client created');
        return true;
    }
}

// Try to initialize immediately
initializeSupabase();

// Also try after page load
window.addEventListener('load', function() {
    if (!supabase) {
        console.log('Retrying Supabase initialization...');
        initializeSupabase();
    }
});

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

// Auth Class - Supabase Integration
class Auth {
    constructor() {
        console.log('Auth constructor');
        this.currentUser = null;
        this.init();
    }

    async init() {
        if (!supabase) return;
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            await this.setCurrentUser(session.user);
        }

        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event);
            if (event === 'SIGNED_IN' && session?.user) {
                await this.setCurrentUser(session.user);
                window.router.navigate('/dashboard');
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                window.router.navigate('/login');
            }
        });
    }

    async setCurrentUser(authUser) {
        // Get user profile from our users table
        const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();

        if (userData) {
            this.currentUser = {
                id: userData.id,
                email: userData.email,
                name: userData.name || authUser.email.split('@')[0],
                role: userData.role || 'citizen',
                points: userData.points || 0,
                trained: userData.trained || false
            };
        } else {
            // Create user profile if it doesn't exist
            const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert([
                    {
                        id: authUser.id,
                        email: authUser.email,
                        name: authUser.user_metadata?.name || authUser.email.split('@')[0],
                        role: 'citizen'
                    }
                ])
                .select()
                .single();

            if (newUser) {
                this.currentUser = {
                    id: newUser.id,
                    email: newUser.email,
                    name: newUser.name,
                    role: newUser.role,
                    points: newUser.points || 0,
                    trained: newUser.trained || false
                };
            }
        }
    }

    async signUp(email, password, name, role = 'citizen') {
        if (!supabase) {
            // For demo purposes, create a mock user
            console.log('Demo signup:', { email, password, name, role });
            return { success: true, data: { user: { email, id: 'demo-' + Date.now() } } };
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name, role }
            }
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data };
    },

    async signIn(email, password) {
        if (!supabase) return { success: false, error: 'Supabase not available' };

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data };
    }

    async signInWithGoogle() {
        if (!supabase) return { success: false, error: 'Supabase not available' };

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data };
    }

    async signOut() {
        if (!supabase) return;
        await supabase.auth.signOut();
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }

    requireRole(role) {
        if (!this.isAuthenticated()) {
            window.router.navigate('/login');
            return false;
        }
        if (!this.hasRole(role)) {
            showToast('Access denied', 'error');
            return false;
        }
        return true;
    }

    requireAuth() {
        if (!this.isAuthenticated()) {
            window.router.navigate('/login');
            return false;
        }
        return true;
    }
}

// Report System Class - Supabase Integration
class ReportSystem {
    async loadReports() {
        if (!supabase) return [];

        const { data, error } = await supabase
            .from('reports')
            .select(`
                *,
                users!reports_user_id_fkey (
                    name,
                    email
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading reports:', error);
            return [];
        }

        return data || [];
    }

    async createReport(reportData) {
        if (!supabase || !window.auth.currentUser) return null;

        const { data, error } = await supabase
            .from('reports')
            .insert([{
                user_id: window.auth.currentUser.id,
                category: reportData.category,
                lat: reportData.lat,
                lng: reportData.lng,
                photo_url: reportData.photo_url,
                note: reportData.note,
                building_non_segregating: reportData.buildingNonSegregating || false
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating report:', error);
            return null;
        }

        return data;
    }

    async updateReportStatus(reportId, status) {
        if (!supabase) return false;

        const { error } = await supabase
            .from('reports')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', reportId);

        if (error) {
            console.error('Error updating report:', error);
            return false;
        }

        return true;
    }

    renderReportForm() {
        if (!window.auth.requireRole('citizen')) return '';
        
        return `
            <div class="card">
                <h1>📋 Report Waste Issue</h1>
                <p>Help keep your community clean by reporting waste-related issues.</p>
                
                <form id="report-form" onsubmit="submitReport(event)">
                    <div class="form-group">
                        <label class="form-label">Category</label>
                        <select name="category" class="form-control" required>
                            <option value="">Select category</option>
                            <option value="illegal_dumping">Illegal Dumping</option>
                            <option value="overflowing_bin">Overflowing Bin</option>
                            <option value="littering">Littering</option>
                            <option value="hazardous_waste">Hazardous Waste</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Photo</label>
                        <input type="file" name="photo" class="form-control" accept="image/*" capture="camera" required>
                        <small class="form-text">Take a photo of the waste issue</small>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Location</label>
                        <button type="button" class="btn btn-secondary" onclick="getCurrentLocation()">Use Current Location</button>
                        <div id="location-info" style="margin-top: 0.5rem; color: var(--text-secondary);"></div>
                        <input type="hidden" name="lat" id="report-lat" required>
                        <input type="hidden" name="lng" id="report-lng" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Additional Notes</label>
                        <textarea name="note" class="form-control" rows="3" placeholder="Describe the issue in detail"></textarea>
                    </div>

                    <div class="form-group">
                        <label class="form-checkbox">
                            <input type="checkbox" name="buildingNonSegregating">
                            This is a non-segregating building
                        </label>
                    </div>

                    <button type="submit" class="btn" id="submit-report-btn">Submit Report</button>
                </form>
            </div>
        `;
    }
}

// Dashboard Class - Supabase Integration
class Dashboard {
    async renderDashboard() {
        if (!window.auth.requireRole('admin')) return '';

        const reports = await window.reportSystem.loadReports();
        
        const stats = {
            total: reports.length,
            new: reports.filter(r => r.status === 'new').length,
            assigned: reports.filter(r => r.status === 'assigned').length,
            resolved: reports.filter(r => r.status === 'resolved').length
        };

        return `
            <div class="card">
                <h1>📊 Admin Dashboard</h1>
                
                <div class="grid grid-3" style="margin: 2rem 0;">
                    <div class="card" style="text-align: center; border-left: 4px solid var(--primary-color);">
                        <h2>${stats.total}</h2>
                        <p>Total Reports</p>
                    </div>
                    <div class="card" style="text-align: center; border-left: 4px solid var(--warning-color);">
                        <h2>${stats.new}</h2>
                        <p>New Reports</p>
                    </div>
                    <div class="card" style="text-align: center; border-left: 4px solid var(--success-color);">
                        <h2>${stats.resolved}</h2>
                        <p>Resolved</p>
                    </div>
                </div>

                <div class="card">
                    <h2>Recent Reports</h2>
                    <div class="table-container" style="overflow-x: auto;">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Category</th>
                                    <th>Reporter</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${reports.slice(0, 10).map(report => `
                                    <tr>
                                        <td>${formatDate(report.created_at)}</td>
                                        <td><span class="badge">${report.category}</span></td>
                                        <td>${report.users?.name || 'Unknown'}</td>
                                        <td><span class="badge ${report.status === 'resolved' ? 'success' : report.status === 'assigned' ? 'warning' : ''}">${report.status}</span></td>
                                        <td>
                                            <button class="btn btn-secondary" onclick="viewReport('${report.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.875rem;">View</button>
                                            ${report.status === 'new' ? `<button class="btn btn-warning" onclick="assignReport('${report.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.875rem; margin-left: 0.5rem;">Assign</button>` : ''}
                                            ${report.status === 'assigned' ? `<button class="btn btn-success" onclick="resolveReport('${report.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.875rem; margin-left: 0.5rem;">Resolve</button>` : ''}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
}

// Map System Class - Enhanced with Supabase
class MapSystem {
    constructor() {
        this.map = null;
        this.reportLayer = null;
        this.facilityLayer = null;
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

                <div class="tabs">
                    <div class="tab-nav">
                        <button class="tab-btn active" onclick="window.mapSystem.showReports()">Reports</button>
                        <button class="tab-btn" onclick="window.mapSystem.showFacilities()">Facilities</button>
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
                            <span>♻️ Recycling Centers</span>
                            <span>🌿 Compost Facilities</span>
                            <span>🔧 Scrap Shops</span>
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
            this.map = L.map('map').setView(this.currentLocation, 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.map);

            this.reportLayer = L.layerGroup().addTo(this.map);
            this.facilityLayer = L.layerGroup().addTo(this.map);

            await this.loadReports();
            await this.loadFacilities();
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

                marker.bindPopup(`
                    <div style="min-width: 200px;">
                        <strong>${report.category.toUpperCase().replace('_', ' ')}</strong><br>
                        <strong>Date:</strong> ${formatDate(report.created_at)}<br>
                        <strong>Status:</strong> <span style="color: ${color}">${report.status}</span><br>
                        <strong>Reporter:</strong> ${report.users?.name || 'Unknown'}<br>
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

    async loadFacilities() {
        if (!this.facilityLayer) return;
        
        this.facilityLayer.clearLayers();
        
        try {
            const { data: facilities, error } = await supabase
                .from('facilities')
                .select('*');

            if (error) {
                console.error('Error loading facilities:', error);
                return;
            }

            facilities?.forEach(facility => {
                let icon = '♻️';
                if (facility.type === 'compost') icon = '🌿';
                if (facility.type === 'scrap') icon = '🔧';

                const marker = L.marker([facility.lat, facility.lng], {
                    icon: L.divIcon({
                        html: icon,
                        className: 'facility-icon',
                        iconSize: [25, 25]
                    })
                }).addTo(this.facilityLayer);

                marker.bindPopup(`
                    <strong>${facility.name}</strong><br>
                    Type: ${facility.type}<br>
                    Address: ${facility.address}<br>
                    Hours: ${facility.hours}
                `);
            });
        } catch (error) {
            console.error('Error loading facilities on map:', error);
        }
    }

    showReports() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => btn.classList.remove('active'));
        tabBtns[0].classList.add('active');
        
        this.facilityLayer.clearLayers();
        this.loadReports();
    }

    showFacilities() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => btn.classList.remove('active'));
        tabBtns[1].classList.add('active');
        
        this.reportLayer.clearLayers();
        this.loadFacilities();
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

    async refreshMap() {
        await this.loadReports();
        await this.loadFacilities();
        this.updateStats();
        showToast('Map refreshed');
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
                { href: '#/report', text: 'Report Waste', icon: '📋' },
                { href: '#/map', text: 'Map', icon: '🗺️' },
                { href: '#/profile', text: 'Profile', icon: '👤' }
            ];
        } else if (role === 'worker') {
            links = [
                { href: '#/reports', text: 'Reports', icon: '📋' },
                { href: '#/map', text: 'Map', icon: '🗺️' },
                { href: '#/profile', text: 'Profile', icon: '👤' }
            ];
        } else if (role === 'admin') {
            links = [
                { href: '#/dashboard', text: 'Dashboard', icon: '📊' },
                { href: '#/reports', text: 'All Reports', icon: '📋' },
                { href: '#/map', text: 'Map', icon: '🗺️' },
                { href: '#/profile', text: 'Profile', icon: '👤' }
            ];
        }

        nav.innerHTML = links.map(link => `
            <a href="${link.href}" class="${this.currentRoute === link.href.slice(1) ? 'active' : ''}">
                ${link.icon} ${link.text}
            </a>
        `).join('') + `<button class="btn" onclick="signOut()" style="margin-left: 1rem;">Sign Out</button>`;
    }
}

// Login functions
function renderLogin() {
    return `
        <div style="max-width: 500px; margin: 2rem auto; text-align: center;">
            <div class="card" style="padding: 2.5rem; background: linear-gradient(135deg, rgba(45, 90, 39, 0.1) 0%, rgba(56, 142, 60, 0.1) 100%); border: 1px solid rgba(45, 90, 39, 0.2);">
                <div style="margin-bottom: 2rem;">
                    <span style="font-size: 3.5rem; display: block; margin-bottom: 0.5rem;">🌱</span>
                    <h1 style="margin: 0 0 0.5rem 0; font-size: 2.2rem; color: var(--primary-color);">Welcome to GreenTrack</h1>
                    <p style="color: var(--text-secondary); margin-bottom: 0; font-size: 1rem; line-height: 1.5;">
                        Your digital platform for a cleaner, greener community
                    </p>
                </div>

                <div class="tabs" style="margin-bottom: 2rem;">
                    <div class="tab-nav" style="justify-content: center; background: rgba(0,0,0,0.05); border-radius: 8px; padding: 4px;">
                        <button class="tab-btn active" onclick="showLoginTab()" style="border-radius: 6px; padding: 0.75rem 1.5rem;">Sign In</button>
                        <button class="tab-btn" onclick="showSignUpTab()" style="border-radius: 6px; padding: 0.75rem 1.5rem;">Sign Up</button>
                    </div>
                </div>

                <div id="login-tab" class="tab-content active">
                    <form id="login-form" onsubmit="handleLogin(event)" style="text-align: left;">
                        <div class="form-group">
                            <label class="form-label" style="font-weight: 600;">Email Address</label>
                            <input type="email" class="form-control" name="email" required placeholder="Enter your email" style="padding: 0.875rem; border-radius: 8px;">
                        </div>

                        <div class="form-group">
                            <label class="form-label" style="font-weight: 600;">Password</label>
                            <input type="password" class="form-control" name="password" required placeholder="Enter your password" style="padding: 0.875rem; border-radius: 8px;">
                        </div>

                        <button type="submit" class="btn" style="width: 100%; margin-bottom: 1rem; padding: 0.875rem; border-radius: 8px; font-weight: 600; background: linear-gradient(135deg, var(--primary-color) 0%, #388e3c 100%); border: none; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='translateY(0)'">
                            🔐 Sign In
                        </button>
                    </form>

                    <div style="margin: 1rem 0; color: var(--text-secondary); font-size: 0.9rem;">or</div>

                    <button class="btn btn-secondary" onclick="signInWithDemo()" style="width: 100%; padding: 0.875rem; border-radius: 8px; margin-bottom: 0.5rem; background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); border: none; color: white; font-weight: 600;">
                        <span style="margin-right: 0.5rem;">👤</span>
                        Try Demo Account
                    </button>
                </div>

                <div id="signup-tab" class="tab-content" style="display: none;">
                    <form id="signup-form" onsubmit="handleSignUp(event)" style="text-align: left;">
                        <div class="form-group">
                            <label class="form-label" style="font-weight: 600;">Full Name</label>
                            <input type="text" class="form-control" name="name" required placeholder="Enter your full name" style="padding: 0.875rem; border-radius: 8px;">
                        </div>

                        <div class="form-group">
                            <label class="form-label" style="font-weight: 600;">Email Address</label>
                            <input type="email" class="form-control" name="email" required placeholder="Enter your email" style="padding: 0.875rem; border-radius: 8px;">
                        </div>

                        <div class="form-group">
                            <label class="form-label" style="font-weight: 600;">Password</label>
                            <input type="password" class="form-control" name="password" required minlength="6" placeholder="Create a strong password" style="padding: 0.875rem; border-radius: 8px;">
                        </div>

                        <div class="form-group">
                            <label class="form-label" style="font-weight: 600;">Role</label>
                            <select name="role" class="form-control" required style="padding: 0.875rem; border-radius: 8px;">
                                <option value="">Select your role</option>
                                <option value="citizen">🏠 Citizen - Report waste issues</option>
                                <option value="worker">👷 Worker - Manage waste collection</option>
                                <option value="admin">👑 Admin - Full access</option>
                            </select>
                        </div>

                        <button type="submit" class="btn" style="width: 100%; padding: 0.875rem; border-radius: 8px; font-weight: 600; background: linear-gradient(135deg, var(--primary-color) 0%, #388e3c 100%); border: none;">
                            ✨ Create Account
                        </button>
                    </form>
                </div>

                <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid rgba(0,0,0,0.1); font-size: 0.9rem; color: var(--text-secondary);">
                    <p style="margin: 0;">🔒 Your data is secure and protected</p>
                </div>
            </div>
        </div>
    `;
}

function showLoginTab() {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
    
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    document.getElementById('login-tab').style.display = 'block';
}

function showSignUpTab() {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
    
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
    document.getElementById('signup-tab').style.display = 'block';
}

async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing In...';

    try {
        const result = await window.auth.signIn(
            formData.get('email'),
            formData.get('password')
        );

        if (result.success) {
            const user = window.auth.currentUser;
            showToast(`Welcome back, ${user?.name || 'User'}! (${user?.role || 'citizen'})`);
            
            // Navigate based on role
            const role = user?.role || 'citizen';
            if (role === 'citizen') {
                window.router.navigate('/report');
            } else if (role === 'worker') {
                window.router.navigate('/reports');
            } else if (role === 'admin') {
                window.router.navigate('/dashboard');
            }
        } else {
            showToast(result.error?.message || 'Login failed. Try the demo account.', 'error');
        }
    } catch (error) {
        showToast('Login error. Try the demo account.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '🔐 Sign In';
    }
}

async function handleSignUp(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    const result = await window.auth.signUp(
        formData.get('email'),
        formData.get('password'),
        formData.get('name'),
        formData.get('role')
    );

    if (result.success) {
        showToast('Account created! You can now sign in.');
        // Switch to login tab
        showLoginTab();
    } else {
        showToast(result.error?.message || 'Error creating account', 'error');
    }
}

function signInWithDemo() {
    // Show demo account options
    showModal('Demo Accounts', `
        <div style="text-align: left;">
            <p>Choose a demo account to try different roles:</p>
            <div style="display: flex; flex-direction: column; gap: 0.5rem; margin: 1rem 0;">
                <button class="btn" onclick="demoLogin('citizen')" style="padding: 0.75rem; text-align: left;">
                    🏠 <strong>Citizen Demo</strong><br>
                    <small>Report waste issues, view map, earn points</small>
                </button>
                <button class="btn" onclick="demoLogin('worker')" style="padding: 0.75rem; text-align: left;">
                    👷 <strong>Worker Demo</strong><br>
                    <small>Manage waste reports, update statuses</small>
                </button>
                <button class="btn" onclick="demoLogin('admin')" style="padding: 0.75rem; text-align: left;">
                    👑 <strong>Admin Demo</strong><br>
                    <small>Full dashboard, manage all reports</small>
                </button>
            </div>
        </div>
    `);
}

async function demoLogin(role) {
    hideModal();
    
    // Create demo user session
    window.auth.currentUser = {
        id: 'demo-' + role,
        email: `${role}@demo.greentrack.app`,
        name: `${role.charAt(0).toUpperCase() + role.slice(1)} Demo`,
        role: role,
        points: role === 'citizen' ? 50 : 0,
        trained: role === 'citizen'
    };
    
    showToast(`Welcome! Signed in as ${role} demo account.`);
    
    // Navigate based on role
    if (role === 'citizen') {
        window.router.navigate('/report');
    } else if (role === 'worker') {
        window.router.navigate('/reports');
    } else if (role === 'admin') {
        window.router.navigate('/dashboard');
    }
}

async function signInWithGoogle() {
    const result = await window.auth.signInWithGoogle();
    if (!result.success) {
        showToast(result.error, 'error');
    }
}

async function signOut() {
    await window.auth.signOut();
    showToast('Signed out successfully');
}

// Report functions
function getCurrentLocation() {
    if ('geolocation' in navigator) {
        showToast('Getting your location...');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                document.getElementById('report-lat').value = position.coords.latitude;
                document.getElementById('report-lng').value = position.coords.longitude;
                document.getElementById('location-info').textContent = 
                    `Location: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
                showToast('Location captured!');
            },
            (error) => {
                showToast('Could not get location. Please enable location services.', 'error');
            }
        );
    } else {
        showToast('Geolocation not supported', 'error');
    }
}

async function submitReport(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const submitBtn = document.getElementById('submit-report-btn');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        // Upload photo to Supabase storage
        const photoFile = formData.get('photo');
        let photoUrl = null;

        if (photoFile && photoFile.size > 0) {
            const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${photoFile.name.split('.').pop()}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('report-photos')
                .upload(fileName, photoFile);

            if (uploadError) {
                console.error('Upload error:', uploadError);
                showToast('Error uploading photo', 'error');
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('report-photos')
                .getPublicUrl(fileName);
            
            photoUrl = publicUrl;
        }

        // Create report
        const reportData = {
            category: formData.get('category'),
            lat: parseFloat(formData.get('lat')),
            lng: parseFloat(formData.get('lng')),
            photo_url: photoUrl,
            note: formData.get('note'),
            buildingNonSegregating: formData.has('buildingNonSegregating')
        };

        const report = await window.reportSystem.createReport(reportData);

        if (report) {
            showToast('Report submitted successfully!');
            form.reset();
            document.getElementById('location-info').textContent = '';
            
            // Award points to user
            if (window.auth.currentUser) {
                const { error } = await supabase
                    .from('users')
                    .update({ points: (window.auth.currentUser.points || 0) + 10 })
                    .eq('id', window.auth.currentUser.id);
                
                if (!error) {
                    window.auth.currentUser.points += 10;
                    showToast('You earned 10 points!');
                }
            }
        } else {
            showToast('Error submitting report', 'error');
        }
    } catch (error) {
        console.error('Error submitting report:', error);
        showToast('Error submitting report', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Report';
    }
}

// Admin functions
async function viewReport(reportId) {
    const reports = await window.reportSystem.loadReports();
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    showModal('Report Details', `
        <div style="max-height: 400px; overflow-y: auto;">
            <p><strong>Category:</strong> ${report.category.replace('_', ' ')}</p>
            <p><strong>Reporter:</strong> ${report.users?.name || 'Unknown'}</p>
            <p><strong>Date:</strong> ${formatDateTime(report.created_at)}</p>
            <p><strong>Status:</strong> ${report.status}</p>
            <p><strong>Location:</strong> ${report.lat.toFixed(6)}, ${report.lng.toFixed(6)}</p>
            ${report.note ? `<p><strong>Note:</strong> ${report.note}</p>` : ''}
            ${report.building_non_segregating ? '<p><strong>⚠️ Non-segregating building reported</strong></p>' : ''}
            ${report.photo_url ? `<p><strong>Photo:</strong></p><img src="${report.photo_url}" style="width: 100%; max-width: 300px; height: auto;">` : ''}
        </div>
    `);
}

async function assignReport(reportId) {
    const success = await window.reportSystem.updateReportStatus(reportId, 'assigned');
    if (success) {
        showToast('Report assigned successfully');
        window.router.handleRoute();
    } else {
        showToast('Error assigning report', 'error');
    }
}

async function resolveReport(reportId) {
    const success = await window.reportSystem.updateReportStatus(reportId, 'resolved');
    if (success) {
        showToast('Report marked as resolved');
        window.router.handleRoute();
    } else {
        showToast('Error resolving report', 'error');
    }
}

function renderProfile() {
    const user = window.auth.currentUser;
    if (!user) return '';

    return `
        <div class="card">
            <h1>👤 Profile</h1>
            <div class="grid grid-2">
                <div>
                    <p><strong>Name:</strong> ${user.name}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Role:</strong> ${user.role}</p>
                    <p><strong>Points:</strong> ${user.points || 0}</p>
                </div>
                <div>
                    <h3>Achievements</h3>
                    <p>${user.points >= 100 ? '🏆 Reporter Pro' : '📈 Getting Started'}</p>
                    <p>${user.trained ? '✅ Green Certified' : '📚 Training Available'}</p>
                </div>
            </div>
        </div>
    `;
}

// Map render function
function renderMap() {
    const mapSystem = new MapSystem();
    window.mapSystem = mapSystem;
    
    setTimeout(() => {
        mapSystem.initMap();
    }, 100);
    
    return mapSystem.renderMap();
}

// Worker reports function
async function renderWorkerReports() {
    if (!window.auth.requireRole('worker') && !window.auth.requireRole('admin')) return '';

    const reports = await window.reportSystem.loadReports();

    return `
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
                        ${reports.map(report => `
                            <tr>
                                <td>${formatDate(report.created_at)}</td>
                                <td><span class="badge">${report.category.replace('_', ' ')}</span></td>
                                <td>${report.users?.name || 'Unknown'}</td>
                                <td>${report.lat.toFixed(4)}, ${report.lng.toFixed(4)}</td>
                                <td><span class="badge ${report.status === 'resolved' ? 'success' : report.status === 'assigned' ? 'warning' : ''}">${report.status}</span></td>
                                <td>
                                    <button class="btn btn-secondary" onclick="viewReport('${report.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.875rem;">View</button>
                                    ${report.status === 'new' ? `<button class="btn btn-warning" onclick="assignReport('${report.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.875rem; margin-left: 0.5rem;">Assign</button>` : ''}
                                    ${report.status === 'assigned' ? `<button class="btn btn-success" onclick="resolveReport('${report.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.875rem; margin-left: 0.5rem;">Resolve</button>` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded fired');
    
    const fallback = document.getElementById('js-fallback');
    if (fallback) {
        fallback.style.display = 'none';
    }
    
    try {
        // Initialize global instances
        window.auth = new Auth();
        window.reportSystem = new ReportSystem();
        window.dashboard = new Dashboard();
        window.router = new Router();

        // Make functions global for onclick handlers
        window.handleLogin = handleLogin;
        window.handleSignUp = handleSignUp;
        window.signInWithGoogle = signInWithGoogle;
        window.signOut = signOut;
        window.showLoginTab = showLoginTab;
        window.showSignUpTab = showSignUpTab;
        window.signInWithDemo = signInWithDemo;
        window.demoLogin = demoLogin;
        window.getCurrentLocation = getCurrentLocation;
        window.submitReport = submitReport;
        window.viewReport = viewReport;
        window.assignReport = assignReport;
        window.resolveReport = resolveReport;

        // Register routes
        window.router.register('/login', () => renderLogin());
        window.router.register('/report', () => window.reportSystem.renderReportForm());
        window.router.register('/dashboard', async () => {
            if (!window.auth.requireRole('admin')) return;
            return await window.dashboard.renderDashboard();
        });
        window.router.register('/profile', () => renderProfile());
        window.router.register('/reports', async () => {
            if (window.auth.hasRole('admin')) {
                return await window.dashboard.renderDashboard();
            } else if (window.auth.hasRole('worker')) {
                return await renderWorkerReports();
            } else {
                return '';
            }
        });
        window.router.register('/map', () => renderMap());

        // Wait for auth to initialize
        await new Promise(resolve => setTimeout(resolve, 500));
        await window.router.handleRoute();
        
        console.log('GreenTrack initialized successfully');

    } catch (error) {
        console.error('Error initializing GreenTrack:', error);
        if (fallback) {
            fallback.style.display = 'block';
            fallback.textContent = `Error: ${error.message}`;
        }
    }
});

console.log('app-supabase.js loaded successfully');
