import { auth } from './auth.js';
import { router } from './router.js';
import { showToast } from './utils.js';

function renderLogin() {
    return `
        <div style="max-width: 450px; margin: 4rem auto; text-align: center;">
            <div class="card" style="padding: 2.5rem; animation: fadeIn 0.5s ease-in-out;">
                <span style="font-size: 4rem; display: block; animation: bounce 1.5s infinite;">🌱</span>
                <h1 style="margin-bottom: 1rem; font-size: 2.5rem;">Welcome to GreenTrack</h1>
                <p style="color: var(--text-secondary); margin-bottom: 2.5rem; font-size: 1.1rem;">
                    Your digital platform for a cleaner, greener community. Report issues, get trained, and earn rewards.
                </p>

                <form id="login-form" onsubmit="handleLogin(event)" style="text-align: left;">
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-control" name="email" required placeholder="e.g., citizen@demo">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input type="password" class="form-control" name="password" required placeholder="e.g., 1234">
                    </div>

                    <button type="submit" class="btn" style="width: 100%; padding: 0.8rem; font-size: 1.1rem;">Login</button>
                </form>

                <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
                    <h3 style="margin-bottom: 1rem;">Or try a demo account:</h3>
                    <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
                        <button class="btn btn-secondary" onclick="quickLogin('admin@demo', '1234')">Admin</button>
                        <button class="btn btn-secondary" onclick="quickLogin('worker@demo', '1234')">Worker</button>
                        <button class="btn btn-secondary" onclick="quickLogin('citizen@demo', '1234')">Citizen</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    const result = auth.login(formData.get('email'), formData.get('password'));

    if (result.success) {
        showToast('Login successful!');
        const role = result.user.role;
        if (role === 'citizen') {
            router.navigate('/training');
        } else if (role === 'worker') {
            router.navigate('/map');
        } else if (role === 'admin') {
            router.navigate('/dashboard');
        }
    } else {
        showToast(result.error, 'error');
    }
}

function quickLogin(email, password) {
    const result = auth.login(email, password);
    if (result.success) {
        showToast('Login successful!');
        const role = result.user.role;
        if (role === 'citizen') {
            router.navigate('/training');
        } else if (role === 'worker') {
            router.navigate('/map');
        } else if (role === 'admin') {
            router.navigate('/dashboard');
        }
    }
}

export { renderLogin, handleLogin, quickLogin };
