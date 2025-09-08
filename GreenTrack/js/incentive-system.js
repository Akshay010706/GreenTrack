import { db } from './db.js';
import { auth } from './auth.js';

class IncentiveSystem {
    renderLeaderboard() {
        const users = db.getAll('users')
            .filter(u => u.role === 'citizen')
            .sort((a, b) => (b.points || 0) - (a.points || 0))
            .slice(0, 10);

        return `
            <div class="card">
                <h1>🏆 Leaderboard</h1>
                <p>Top citizens making a difference in waste management!</p>

                <div class="table-container" style="overflow-x: auto;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Name</th>
                                <th>Points</th>
                                <th>Status</th>
                                <th>Badges</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map((user, index) => `
                                <tr ${auth.currentUser && auth.currentUser.id === user.id ? 'style="background: var(--accent-color); color: white;"' : ''}>
                                    <td>
                                        ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                    </td>
                                    <td>${user.name}</td>
                                    <td>${user.points || 0}</td>
                                    <td>
                                        ${user.trained ? '<span class="badge success">Green Certified</span>' : '<span class="badge">Not Certified</span>'}
                                    </td>
                                    <td>
                                        ${user.trained ? '🌱 Green Expert' : ''}
                                        ${(user.points || 0) >= 100 ? '⭐ Super Contributor' : ''}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="card" style="margin-top: 2rem;">
                    <h3>How to Earn Points</h3>
                    <ul style="margin-left: 2rem;">
                        <li>Complete training modules: +5 points each</li>
                        <li>Get Green Certified: +20 points</li>
                        <li>Submit waste reports: +5 points each</li>
                        <li>Report non-segregating buildings: +10 points</li>
                    </ul>
                </div>
            </div>
        `;
    }
}

const incentiveSystem = new IncentiveSystem();
export { incentiveSystem };
