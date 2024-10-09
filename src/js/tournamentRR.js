import { getCookie, displayMessages } from './utils.js';
import { selectedListItem, setSelectedListItem, handleFriendRequest, showSection } from './index.js';

export function renderTournamentRR() {

    const app = document.getElementById('app');

    app.innerHTML = `
    <div class="menu">
        <div class="tournament-container">
                <div class="tournament-container-header">
                    <p>Round-Robin-Tournament</p>
                </div>

                <hr class="tournament-container-divider">

                <div class="tournament-lobby-id">
                    <p>Lobby-ID: </p>
                    <p>XP5G9</p>
                <div>

            </div>
    </div>
    `;
}
