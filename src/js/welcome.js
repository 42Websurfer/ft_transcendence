import { handleLogoutSubmit } from './utils.js';

export function renderWelcome() {
    const app = document.getElementById('app');

    app.innerHTML = `
    MOIN BRATAN
    <button id="logoutButton">LOOOOGOUT</button>

    `;
    const form = document.getElementById('logoutButton');
    form.addEventListener('click', handleLogoutSubmit);
}