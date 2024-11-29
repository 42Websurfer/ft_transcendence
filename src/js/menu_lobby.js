import { displayToast } from './utils.js';
import { selectedListItem, setSelectedListItem, handleFriendRequest, showSection } from './index.js';

export function renderMenuLobby(type) {
    let header = 'New lobby';
    let description = 'This is just a template';
    if (type === 'tournament')
    {
        header = 'Round-Robin-Tournament';
        description = 'Each player plays against each player';
    }
    else if (type == 'online')
    {
        header = 'Create Lobby';
        description = 'Play 1 vs 1 with a friend';
    }
    else if (type == 'multiple')
    {
        header = 'Create Lobby';
        description = 'Play with 4 players free for all';
    }

    const app = document.getElementById('app');

    app.innerHTML = `
    <div class="menu">
        <div class="menu-friends"></div>
        <div class="menu-gamemodes">
            <div class="menu-item" id="onlineItemLobby">
                <h1>${header}</h1>
                <p>${description}<p>
            </div>  
            <div class="tournament-or-text">
				<p>OR</p>
			</div>
            <div class="tournament-enter-lobby">
                <input type="text" id="lobbyId" placeholder="Enter a lobby-id and hit enter...">
            </div>
        </div>
        
    </div>
    `;


    const lobbyIdInput = document.getElementById('lobbyId');
    
    lobbyIdInput.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter') {
            const lobbyId = lobbyIdInput.value.trim();
            if (/[^A-Za-z0-9]/.test(lobbyId)) {
                displayToast('Invalid characters in lobby id!', 'error');
                return;
            }
            if (lobbyId) {
                const response = await joinLobby(lobbyId, type);
                if (response.type === 'success')
                {
                    displayToast('You have successfully joined a lobby', 'success');
                    showSection(`menu_${type}_lobby`, lobbyId);
                }
                else if (response.type === 'error')
                    displayToast(response.message, 'error')
            }
            else
                displayToast('You have to enter a lobby id.', 'error');
        }
    });



   //will be just seperated with showSection!
    const createLobbyButton = document.getElementById('onlineItemLobby');
    createLobbyButton.addEventListener('click', async () => {
        const response = await createLobby(type);
        if (response?.type === 'error') {
            displayToast(response.message, 'error');
            return;
        }
        else if (response?.type === 'success')
            displayToast('You have successfully created a lobby', 'success');
        showSection(`menu_${type}_lobby`, response.lobby.id);
    });

}

async function joinLobby(lobby_id, type) {
    try {
        const token = localStorage.getItem('access_token'); 

        const response = await fetch(`/api/tm/join_lobby/${lobby_id}/?type=${type}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });
        return await response.json();
    } catch (error) {
        return {'type': 'request_error', 'message': 'Failed to \"join_lobby\" request.' };
    }
};

async function createLobby(type) {
    try {
        const token = localStorage.getItem('access_token'); 

        const response = await fetch(`/api/tm/create/?type=${type}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });            
        return await response.json();
    } catch (error) {
        return { 'type': 'request_error', 'message': 'Failed to \"create\" Lobby request.' };
    }
}
