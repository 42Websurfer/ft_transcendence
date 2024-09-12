import { handleLogoutSubmit } from './utils.js';

export function renderWelcome() {
    const app = document.getElementById('app');

    app.innerHTML = `
    MOIN BRATAN
    <button id="logoutButton">LOOOOGOUT</button>
	<button id="start">Start Pong</button>

    `;
    const form = document.getElementById('logoutButton');
    const pong = document.getElementById('start');
    form.addEventListener('click', handleLogoutSubmit);
    pong.addEventListener('click', showSection('pong'));
}
