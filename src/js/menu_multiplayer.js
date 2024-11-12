import { getCookie, displayToast } from './utils.js';
import { selectedListItem, setSelectedListItem, handleFriendRequest, showSection } from './index.js';

export function renderMenuMultiplayer() {

    const app = document.getElementById('app');

    app.innerHTML = `
    <div class="menu">
        <div class="menu-friends"></div>
        <div class="menu-gamemodes">
            <div class="menu-item" id="onlineItemLobby">
                <h1>Create Lobby</h1>
                <p>Play with 4 players free for all<p>
            </div>  
            <div class="tournament-or-text">
				<p>OR</p>
			</div>
            <div class="tournament-enter-lobby">
                <input type="text" id="onlineLobbyId" placeholder="Enter a lobby-id and hit enter...">
            </div>
        </div>
        
    </div>
    `;

    async function joinMultipleLobby(lobby_id) {
        try {
            const token = localStorage.getItem('access_token'); 

            const response = await fetch(`/api/tm/join_lobby/${lobby_id}/?type=multiple`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });
            return await response.json();
        } catch (error) {
            return {'type': 'request_error', 'message': 'Failed to tournament joind request.' };
        }
    };

    const onlineLobbyInput = document.getElementById('onlineLobbyId');
    
    onlineLobbyInput.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter') {
            const lobbyId = onlineLobbyInput.value.trim();
            if (lobbyId) {
                console.log(`Trying to enter lobby with id: ${lobbyId}`);
                const response = await joinMultipleLobby(lobbyId);
                if (response.type === 'success')
                {
                    displayToast('You have successfully joined a lobby', 'success');
                    showSection('menu_multiple_lobby', lobbyId);
                }
                else if (response.type === 'error')
					displayToast(response.message, response.type)
            }
        }
    });

    async function createMultipleLobby() {
        try {
            const token = localStorage.getItem('access_token'); 

            const response = await fetch(`/api/tm/create/?type=multiple`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });            
            return await response.json();
        } catch (error) {
            return {'type': 'request_error', 'message': 'Failed to tournament joind request.' };
        }

    }

    const createLobbyButton = document.getElementById('onlineItemLobby');
    createLobbyButton.addEventListener('click', async () => {
        const response = await createMultipleLobby();
        if (response?.type === 'error') {
			displayToast(response.message, response.type)
            return;
        }
        else if (response.type === 'success')
            displayToast('You have successfully created a lobby', 'success');
        showSection('menu_multiple_lobby', response.lobby.id);
    });

}
