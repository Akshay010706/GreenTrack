import { supabase } from './supabase-client.js';
import { auth } from './auth.js';

class IncentiveSystem {
    async addPoints(userId, points) {
        const { data, error } = await supabase
            .from('leaderboard')
            .select('points')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // Ignore 'not found' error
            console.error('Error fetching points:', error);
            return;
        }

        const currentPoints = data ? data.points : 0;
        const newPoints = currentPoints + points;

        const { error: upsertError } = await supabase
            .from('leaderboard')
            .upsert({ user_id: userId, points: newPoints }, { onConflict: 'user_id' });

        if (upsertError) {
            console.error('Error updating points:', upsertError);
        }
    }

    async fetchLeaderboard() {
        const { data, error } = await supabase
            .from('leaderboard')
            .select('*')
            .order('points', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Error fetching leaderboard:', error);
            return [];
        }
        return data;
    }

    async renderLeaderboard() {
        const users = await this.fetchLeaderboard();

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
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map((user, index) => `
                                <tr ${auth.currentUser && auth.currentUser.id === user.user_id ? 'style="background: var(--accent-color); color: white;"' : ''}>
                                    <td>
                                        ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                    </td>
                                    <td>${user.user_id}</td>
                                    <td>${user.points || 0}</td>
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
