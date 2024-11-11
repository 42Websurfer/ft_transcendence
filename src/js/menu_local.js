import { getCookie, displayMessages } from './utils.js';
import { selectedListItem, setSelectedListItem, handleFriendRequest, showSection } from './index.js';

export function renderMenuLocal() {
    const app = document.getElementById('app');

    app.innerHTML = `
    <div class="menu">
        <div class="menu-friends"></div>
        <div class="menu-gamemodes">
            <div class="menu-item" id="onlineItemLobby">
                <h1>Local PvP</h1>
                <p>Play local 1 vs 1 with a friend<p>
            </div>
            <div class="menu-item" id="tournamentItemKO">
                <h1>Local PvE</h1>
                <p>Play 1 vs 1 against AI<p>
            </div>  
        </div>
        
    </div>
    `;

    document.getElementById('onlineItemLobby')?.addEventListener('click', () => showSection('pong', 'local'));

    document.getElementById('tournamentItemKO')?.addEventListener('click', () => showSection('pong', 'local_ai'));

}
