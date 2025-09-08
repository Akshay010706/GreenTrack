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

export { showToast, showModal, hideModal, formatDate, formatDateTime };
