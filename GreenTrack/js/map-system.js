import { supabase } from './supabase-client.js';
import { formatDate, showToast } from './utils.js';
import { reportSystem } from './report-system.js';
import { facilitySystem } from './facility-system.js';

class MapSystem {
    constructor() {
        this.map = null;
        this.reportLayer = null;
        this.facilityLayer = null;
        this.truckMarker = null;
        this.truckPath = [
            [26.8467, 80.9462],
            [26.8500, 80.9500],
            [26.8400, 80.9400],
            [26.8467, 80.9462]
        ];
        this.truckPosition = 0;
        this.truckInterval = null;
    }

    renderMap() {
        return `
            <div class="card">
                <div class="card-header">
                    <h1>🗺️ Waste Management Map</h1>
                    <div>
                        <button class="btn btn-secondary" onclick="mapSystem.toggleTruck()">
                            <span id="truck-btn-text">Start Truck</span>
                        </button>
                        <button class="btn btn-secondary" onclick="mapSystem.refreshMap()">Refresh</button>
                    </div>
                </div>

                <div class="tabs">
                    <div class="tab-nav">
                        <button class="tab-btn active" data-tab="reports">Reports</button>
                        <button class="tab-btn" data-tab="facilities">Facilities</button>
                    </div>
                </div>

                <div id="map" class="map-container"></div>

                <div class="grid grid-2" style="margin-top: 1rem;">
                    <div class="card">
                        <h3>Legend</h3>
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            <span>🔴 New Reports</span>
                            <span>🟡 Assigned Reports</span>
                            <span>🟢 Resolved Reports</span>
                            <span>🚛 Waste Collection Truck</span>
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

    initMap() {
        if (this.map) {
            this.map.remove();
        }

        this.map = L.map('map').setView([26.8467, 80.9462], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        this.reportLayer = L.layerGroup().addTo(this.map);
        this.facilityLayer = L.layerGroup().addTo(this.map);

        this.loadReports();
        this.loadFacilities();
        this.updateStats();
        this.initTabs();
        this.subscribeToReportChanges();
    }

    subscribeToReportChanges() {
        supabase.channel('public:reports')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, payload => {
                console.log('Change received!', payload);
                this.refreshMap();
            })
            .subscribe();
    }

    initTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const tab = btn.dataset.tab;
                if (tab === 'reports') {
                    this.showReports();
                } else if (tab === 'facilities') {
                    this.showFacilities();
                }
            });
        });
    }

    showReports() {
        this.facilityLayer.clearLayers();
        this.loadReports();
    }

    showFacilities() {
        this.reportLayer.clearLayers();
        this.loadFacilities();
    }

    async loadReports() {
        this.reportLayer.clearLayers();
        const reports = await reportSystem.loadReports();

        reports.forEach(report => {
            let color = 'red';
            if (report.status === 'assigned') color = 'orange';
            if (report.status === 'resolved') color = 'green';

            const marker = L.circleMarker([report.lat, report.lng], {
                color: color,
                radius: 8
            }).addTo(this.reportLayer);

            marker.bindPopup(`
                <strong>${report.category.toUpperCase()}</strong><br>
                Date: ${formatDate(report.created_at)}<br>
                Status: ${report.status}<br>
                ${report.note ? `Note: ${report.note}<br>` : ''}
                <img src="${report.photo_url}" style="width:200px;height:auto;margin-top:5px;">
            `);
        });
    }

    async loadFacilities() {
        this.facilityLayer.clearLayers();
        const facilities = await facilitySystem.loadFacilities();

        facilities.forEach(facility => {
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
    }

    toggleTruck() {
        const btnText = document.getElementById('truck-btn-text');

        if (this.truckInterval) {
            clearInterval(this.truckInterval);
            this.truckInterval = null;
            btnText.textContent = 'Start Truck';
            if (this.truckMarker) {
                this.map.removeLayer(this.truckMarker);
            }
        } else {
            btnText.textContent = 'Stop Truck';
            this.startTruckSimulation();
        }
    }

    startTruckSimulation() {
        this.truckPosition = 0;

        this.truckInterval = setInterval(() => {
            if (this.truckMarker) {
                this.map.removeLayer(this.truckMarker);
            }

            const position = this.truckPath[this.truckPosition];
            this.truckMarker = L.marker(position, {
                icon: L.divIcon({
                    html: '🚛',
                    className: 'truck-icon',
                    iconSize: [30, 30]
                })
            }).addTo(this.map);

            this.truckMarker.bindPopup('Waste Collection Truck');

            this.truckPosition = (this.truckPosition + 1) % this.truckPath.length;
        }, 2000);
    }

    async updateStats() {
        const reports = await reportSystem.loadReports();
        const statsEl = document.getElementById('map-stats');

        if (!statsEl) return;

        const stats = {
            total: reports.length,
            new: reports.filter(r => r.status === 'new').length,
            assigned: reports.filter(r => r.status === 'assigned').length,
            resolved: reports.filter(r => r.status === 'resolved').length
        };

        statsEl.innerHTML = `
            <p>Total Reports: ${stats.total}</p>
            <p>New: ${stats.new}</p>
            <p>Assigned: ${stats.assigned}</p>
            <p>Resolved: ${stats.resolved}</p>
        `;
    }

    refreshMap() {
        this.loadReports();
        this.loadFacilities();
        this.updateStats();
        showToast('Map refreshed');
    }
}

const mapSystem = new MapSystem();
export { mapSystem };
