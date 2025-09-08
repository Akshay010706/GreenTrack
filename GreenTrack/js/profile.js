import { db } from './db.js';
import { auth } from './auth.js';
import { training } from './training.js';
import { formatDate } from './utils.js';

function renderProfile() {
    const user = auth.currentUser;
    const reports = db.findBy('reports', r => r.createdByUserId === user.id);
    const progress = training.getProgress(user.id);

    return `
        <div class="card">
            <h1>👤 Profile</h1>

            <div class="grid grid-2">
                <div class="card">
                    <h3>Personal Information</h3>
                    <p><strong>Name:</strong> ${user.name}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Role:</strong> ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                    <p><strong>Points:</strong> ${user.points || 0}</p>
                    <p><strong>Status:</strong>
                        ${user.trained ? '<span class="badge success">Green Certified</span>' : '<span class="badge">Not Certified</span>'}
                    </p>
                </div>

                <div class="card">
                    <h3>Activity Summary</h3>
                    ${user.role === 'citizen' ? `
                        <p><strong>Reports Submitted:</strong> ${reports.length}</p>
                        <p><strong>Training Progress:</strong> ${progress.modulesCompleted.length}/3 modules</p>
                        ${progress.quizScore !== null ? `<p><strong>Quiz Score:</strong> ${progress.quizScore.toFixed(1)}%</p>` : ''}
                    ` : ''}
                    <p><strong>Member Since:</strong> ${formatDate(new Date())}</p>
                </div>
            </div>

            ${user.role === 'citizen' && reports.length > 0 ? `
                <div class="card">
                    <h3>Recent Reports</h3>
                    <div class="table-container" style="overflow-x: auto;">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Category</th>
                                    <th>Status</th>
                                    <th>Points Earned</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${reports.slice(-5).reverse().map(report => `
                                    <tr>
                                        <td>${formatDate(report.createdAt)}</td>
                                        <td><span class="badge">${report.category}</span></td>
                                        <td><span class="badge ${report.status === 'resolved' ? 'success' : report.status === 'assigned' ? 'warning' : ''}">${report.status}</span></td>
                                        <td>+5</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

export { renderProfile };
