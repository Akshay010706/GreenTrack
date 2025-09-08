import { db } from './db.js';
import { auth } from './auth.js';
import { router } from './router.js';
import { showToast } from './utils.js';

class ReportSystem {
    constructor() {
        this.categories = ['litter', 'overflow', 'burning', 'hazardous'];
    }

    renderReportForm() {
        if (!auth.requireRole('citizen')) return;

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
                        <label style="display: flex; align-items: center; gap: 0.5rem;">
                            <input type="checkbox" name="buildingNonSegregating">
                            Building not following segregation rules
                        </label>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Location</label>
                        <button type="button" class="btn btn-secondary" onclick="reportSystem.getCurrentLocation()">
                            📍 Get Current Location
                        </button>
                        <div id="location-info" style="margin-top: 0.5rem; color: var(--text-secondary);"></div>
                        <input type="hidden" name="lat">
                        <input type="hidden" name="lng">
                    </div>

                    <button type="submit" class="btn btn-success">Submit Report</button>
                </form>
            </div>
        `;
    }

    getCurrentLocation() {
        const locationInfo = document.getElementById('location-info');
        const latInput = document.querySelector('input[name="lat"]');
        const lngInput = document.querySelector('input[name="lng"]');

        locationInfo.textContent = 'Getting location...';

        if (!navigator.geolocation) {
            locationInfo.textContent = 'Geolocation not supported';
            return;
        }

        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                latInput.value = lat;
                lngInput.value = lng;
                locationInfo.textContent = `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            },
            error => {
                locationInfo.textContent = 'Location access denied or unavailable';
                // Default to Lucknow coordinates
                latInput.value = 26.8467;
                lngInput.value = 80.9462;
                locationInfo.textContent = 'Using default location (Lucknow)';
            }
        );
    }

    submitReport(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        // Validate location
        if (!formData.get('lat') || !formData.get('lng')) {
            showToast('Please get your location first', 'error');
            return;
        }

        // Handle photo
        const photoFile = formData.get('photo');
        if (!photoFile) {
            showToast('Please select a photo', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const report = {
                photoBase64: e.target.result,
                lat: parseFloat(formData.get('lat')),
                lng: parseFloat(formData.get('lng')),
                note: formData.get('note'),
                category: formData.get('category'),
                buildingNonSegregating: formData.get('buildingNonSegregating') === 'on',
                createdAt: new Date().toISOString(),
                createdByUserId: auth.currentUser.id,
                status: 'new'
            };

            db.add('reports', report);

            // Award points
            const user = db.findById('users', auth.currentUser.id);
            db.updateById('users', auth.currentUser.id, {
                points: (user.points || 0) + 5
            });

            showToast('Report submitted successfully! +5 points', 'success');
            router.navigate('/map');
        };

        reader.readAsDataURL(photoFile);
    }
}

const reportSystem = new ReportSystem();
export { reportSystem };
