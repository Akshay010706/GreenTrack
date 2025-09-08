import { db } from './db.js';
import { auth } from './auth.js';
import { router } from './router.js';
import { showToast, showModal, hideModal, formatDate, formatDateTime } from './utils.js';

class Dashboard {
    constructor() {
        this.charts = {};
    }

    renderDashboard() {
        if (!auth.requireRole('admin')) return;

        const reports = db.getAll('reports');
        const users = db.getAll('users');
        const trainedUsers = users.filter(u => u.trained).length;
        const nonSegregatingReports = reports.filter(r => r.buildingNonSegregating).length;

        return `
            <div class="card">
                <h1>📊 Admin Dashboard</h1>

                <div class="grid grid-3 mb-2">
                    <div class="card" style="text-align: center; background: var(--success-color); color: white;">
                        <h2>${reports.length}</h2>
                        <p>Total Reports</p>
                    </div>
                    <div class="card" style="text-align: center; background: var(--primary-color); color: white;">
                        <h2>${trainedUsers}</h2>
                        <p>Trained Citizens</p>
                    </div>
                    <div class="card" style="text-align: center; background: var(--warning-color); color: white;">
                        <h2>${nonSegregatingReports}</h2>
                        <p>Non-Segregating Buildings</p>
                    </div>
                </div>

                <div class="grid grid-2">
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
                    <h3>Recent Reports</h3>
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
                                ${reports.slice(-10).reverse().map(report => {
                                    const user = db.findById('users', report.createdByUserId);
                                    return `
                                        <tr>
                                            <td>${formatDate(report.createdAt)}</td>
                                            <td><span class="badge">${report.category}</span></td>
                                            <td>${user ? user.name : 'Unknown'}</td>
                                            <td><span class="badge ${report.status === 'resolved' ? 'success' : report.status === 'assigned' ? 'warning' : ''}">${report.status}</span></td>
                                            <td>
                                                <button class="btn btn-secondary" onclick="dashboard.viewReport('${report.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.875rem;">View</button>
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

    createCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        const reports = db.getAll('reports');
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

    createTrendChart() {
        const ctx = document.getElementById('trendChart');
        if (!ctx) return;

        const reports = db.getAll('reports');
        const last7Days = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const count = reports.filter(r =>
                r.createdAt.split('T')[0] === dateStr
            ).length;
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

    viewReport(reportId) {
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

                <div style="margin-top: 1rem;">
                    <label class="form-label">Update Status:</label>
                    <select id="status-update" class="form-control" style="margin-bottom: 1rem;">
                        <option value="new" ${report.status === 'new' ? 'selected' : ''}>New</option>
                        <option value="assigned" ${report.status === 'assigned' ? 'selected' : ''}>Assigned</option>
                        <option value="resolved" ${report.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                    </select>
                    <button class="btn btn-success" onclick="dashboard.updateReportStatus('${reportId}')">Update Status</button>
                </div>
            </div>
        `);
    }

    updateReportStatus(reportId) {
        const newStatus = document.getElementById('status-update').value;
        db.updateById('reports', reportId, { status: newStatus });
        showToast('Report status updated');
        hideModal();
        router.handleRoute(); // Refresh dashboard
    }

    exportData() {
        const data = db.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'greentrack-data.json';
        a.click();
        URL.revokeObjectURL(url);
        showToast('Data exported successfully');
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const success = db.importData(e.target.result);
            if (success) {
                showToast('Data imported successfully');
                router.handleRoute();
            } else {
                showToast('Import failed - invalid data format', 'error');
            }
        };
        reader.readAsText(file);
    }
}

const dashboard = new Dashboard();
export { dashboard };
