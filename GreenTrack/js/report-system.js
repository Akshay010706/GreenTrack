import { supabase } from './supabase-client.js';
import { auth } from './auth.js';
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
                        <label class="form-label">Location</label>
                        <p>The location will be automatically determined from the map.</p>
                        <input type="hidden" name="lat">
                        <input type="hidden" name="lng">
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
        const user = auth.currentUser;

        if (!photoFile) {
            showToast('Please select a photo', 'error');
            return;
        }

        // 1. Upload image to Supabase Storage
        const fileName = `${user.id}/${Date.now()}_${photoFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('reports')
            .upload(fileName, photoFile);

        if (uploadError) {
            console.error('Error uploading image:', uploadError);
            showToast('Error uploading image. Please try again.', 'error');
            return;
        }

        // 2. Get public URL of the uploaded image
        const { data: urlData } = supabase.storage
            .from('reports')
            .getPublicUrl(uploadData.path);

        // 3. Insert report into Supabase database
        const report = {
            category: formData.get('category'),
            photo_url: urlData.publicUrl,
            note: formData.get('note'),
            lat: parseFloat(formData.get('lat')),
            lng: parseFloat(formData.get('lng')),
            user_id: user.id,
        };

        const { data: reportData, error: reportError } = await supabase
            .from('reports')
            .insert([report])
            .select();

        if (reportError) {
            console.error('Error creating report:', reportError);
            showToast('Error creating report. Please try again.', 'error');
            return;
        }

        // 4. Award points (optional, can be a serverless function later)
        // For now, we'll skip this to avoid direct client-side leaderboard updates

        showToast('Report submitted successfully!', 'success');
        window.router.navigate('/map');
        return reportData[0];
    }

    async loadReports() {
        const { data, error } = await supabase.from('reports').select('*');
        if (error) {
            console.error('Error loading reports:', error);
            return [];
        }
        return data;
    }
}

const reportSystem = new ReportSystem();
export { reportSystem };
