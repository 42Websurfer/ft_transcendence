import { getCookie, displayMessages } from './utils.js';
import { selectedListItem, setSelectedListItem, handleFriendRequest, showSection } from './index.js';

export function renderMenuOnline() {

    const app = document.getElementById('app');

    app.innerHTML = `
    <div class="menu">
        <div class="menu-friends"></div>
        <div class="menu-gamemodes">
            <div class="menu-item" id="onlineItemLobby">
                <h1>Create Lobby</h1>
                <p>Play 1 vs 1 with a friend<p>
            </div>  
            <div class="tournament-or-text">
				<p>OR</p>
			</div>
            <div class="tournament-enter-lobby">
                <input type="text" id="onlineLobbyId" placeholder="Enter a lobby-id and hit enter...">
            </div>
            <div id="joinMessage" class="join-message" style="top: 19.2em;"></div>
        </div>
        
    </div>
    `;

    async function joinOnlineLobby(lobby_id) {
        try {
            const response = await fetch(`/tm/join_online_lobby/${lobby_id}/`, {
                method: 'GET',
                credentials: 'include'
            });
            return await response.json();
        } catch (error) {
            return { error: 'Failed to tournament create request.' };
        }
    };

    const onlineLobbyInput = document.getElementById('onlineLobbyId');
    
    onlineLobbyInput.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter') {
            const lobbyId = onlineLobbyInput.value.trim();
            if (lobbyId) {
                console.log(`Trying to enter lobby with id: ${lobbyId}`);
                const response = await joinOnlineLobby(lobbyId);
                if (response.type === 'success')
                    showSection('menu_online_lobby', lobbyId);
                else
                {
                    displayErrorMessage(response.message);
                }
            }
        }
    });

    async function createOnlineLobby() {
        try {
            const response = await fetch(`/tm/create/match`, {
                method: 'GET',
                credentials: 'include'
            });            
            return await response.json();
        } catch (error) {
            return { error: 'Failed to tournament create request.' };
        }

    }

    function displayErrorMessage(message) {
        const joinMessage = document.getElementById('joinMessage');
        if (!joinMessage)
            return;
        joinMessage.textContent = message;
        joinMessage.style.color = 'red';
        joinMessage.style.animation = 'none';
        joinMessage.offsetHeight;
        joinMessage.style.animation = 'wiggle 0.5s ease-in-out';
    }

    const createLobbyButton = document.getElementById('onlineItemLobby');
    createLobbyButton.addEventListener('click', async () => {
        const response = await createOnlineLobby();
        if (response?.type === 'error') {
            displayErrorMessage(response.message);
            return;
        }
        showSection('menu_online_lobby', response.lobby.id);
    });

}
