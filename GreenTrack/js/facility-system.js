import { supabase } from './supabase-client.js';

class FacilitySystem {
    async loadFacilities() {
        const { data, error } = await supabase.from('facilities').select('*');
        if (error) {
            console.error('Error loading facilities:', error);
            return [];
        }
        return data;
    }

    async renderFacilities() {
        const facilities = await this.loadFacilities();
        const searchTerm = new URLSearchParams(window.location.hash.split('?')[1] || '').get('search') || '';

        const filtered = facilities.filter(f =>
            !searchTerm ||
            f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.address.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return `
            <div class="card">
                <h1>🏢 Waste Management Facilities</h1>

                <div class="form-group">
                    <input
                        type="text"
                        class="form-control"
                        placeholder="Search facilities..."
                        value="${searchTerm}"
                        oninput="facilitySystem.search(this.value)"
                    >
                </div>

                <div class="grid grid-2">
                    <div>
                        <h3>Facilities List</h3>
                        <div class="grid">
                            ${filtered.map(facility => `
                                <div class="card">
                                    <h4>${facility.name}</h4>
                                    <p><strong>Type:</strong> ${facility.type.charAt(0).toUpperCase() + facility.type.slice(1)}</p>
                                    <p><strong>Address:</strong> ${facility.address}</p>
                                    <p><strong>Hours:</strong> ${facility.hours}</p>
                                    <button class="btn btn-secondary" onclick="facilitySystem.showOnMap('${facility.id}')">
                                        Show on Map
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div>
                        <h3>Map View</h3>
                        <div id="facilities-map" class="map-container"></div>
                    </div>
                </div>
            </div>
        `;
    }

    initMap() {
        setTimeout(async () => {
            if (this.map) {
                this.map.remove();
            }

            this.map = L.map('facilities-map').setView([26.8467, 80.9462], 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.map);

            const facilities = await this.loadFacilities();
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
                }).addTo(this.map);

                marker.bindPopup(`
                    <strong>${facility.name}</strong><br>
                    Type: ${facility.type}<br>
                    Address: ${facility.address}<br>
                    Hours: ${facility.hours}
                `);
            });
        }, 100);
    }

    search(term) {
        const url = window.location.hash.split('?')[0];
        const newUrl = term ? `${url}?search=${encodeURIComponent(term)}` : url;
        window.location.hash = newUrl;
    }

    async showOnMap(facilityId) {
        const { data: facility, error } = await supabase
            .from('facilities')
            .select('*')
            .eq('id', facilityId)
            .single();

        if (error) {
            console.error('Error fetching facility:', error);
            return;
        }

        if (facility && this.map) {
            this.map.setView([facility.lat, facility.lng], 16);
        }
    }
}

const facilitySystem = new FacilitySystem();
export { facilitySystem };
