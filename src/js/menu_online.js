import { displayToast } from './utils.js';
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
        </div>
        
    </div>
    `;

    async function joinOnlineLobby(lobby_id) {
        try {
            const token = localStorage.getItem('access_token'); 

            const response = await fetch(`/api/tm/join_online_lobby/${lobby_id}/`, {
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
                const response = await joinOnlineLobby(lobbyId);
                if (response.type === 'success')
                {
                    displayToast('You have successfully joined a lobby', 'success');
                    showSection('menu_online_lobby', lobbyId);
                }
                else if (response.type === 'error')
                    displayToast(response.message, 'error')
            }
        }
    });

    async function createOnlineLobby() {
        try {
            const token = localStorage.getItem('access_token'); 

            const response = await fetch(`/api/tm/create/?type=match`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });            
            return await response.json();
        } catch (error) {
            return { 'type': 'request_error', 'message': 'Failed to tournament create request.' };
        }

    }

   
    const createLobbyButton = document.getElementById('onlineItemLobby');
    createLobbyButton.addEventListener('click', async () => {
        const response = await createOnlineLobby();
        if (response?.type === 'error') {
            displayToast(response.message, 'error');
            return;
        }
        else if (response.type === 'success')
            displayToast('You have successfully created a lobby', 'success');
        showSection('menu_online_lobby', response.lobby.id);
    });

}
