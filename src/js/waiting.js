import { getCookie, displayMessages } from './utils.js';
import { selectedListItem, setSelectedListItem, handleFriendRequest, showSection } from './index.js';

export function renderWaiting(lobbyId = null) {
    // history.pushState({ section: 'waiting', lobbyId }, '', `/waiting${lobbyId ? `?lobbyId=${lobbyId}` : ''}`);

    const app = document.getElementById('app');

    app.innerHTML = `
    <div class="waiting-img">
        <img src="./img/Logo.jpg" alt="Logo">
    </div>
    `;
}
