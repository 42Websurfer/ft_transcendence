import { displayToast, getCookie } from './utils.js';
import { selectedListItem, setSelectedListItem, handleFriendRequest, showSection } from './index.js';

export function renderMenuTournament() {

    const app = document.getElementById('app');

    app.innerHTML = `
    <div class="menu">
        <div class="menu-friends"></div>
        <div class="menu-gamemodes">
            <div class="menu-item" id="tournamentItemRR">
                <h1>Round-Robin-Tournament</h1>
                <p>Each player plays against each player<p>
            </div>  
            <div class="menu-item" id="tournamentItemKO">
                <h1>K.O.-Tournament</h1>
                <p>Players are eliminated after losing a match<p>
            </div>
            <div class="tournament-or-text">
				<p>OR</p>
			</div>
            <div class="tournament-enter-lobby">
                <input type="text" id="tournamentLobbyId" placeholder="Enter a lobby-id and hit enter...">
            </div>
        </div> 
    </div>
    `;

    async function joinTournamentLobby(lobby_id) {
        try {
            const token = localStorage.getItem('access_token'); 

            const response = await fetch(`/api/tm/join_lobby/${lobby_id}/?type=tournament`, {
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

    const tournamentLobbyInput = document.getElementById('tournamentLobbyId');
    tournamentLobbyInput.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter') {
            const lobbyId = tournamentLobbyInput.value.trim();
            if (lobbyId) {
                console.log(`Trying to enter lobby with id: ${lobbyId}`);
                const response = await joinTournamentLobby(lobbyId);
                if (response.type === 'success')
                {
                    displayToast('You have successfully joined a lobby', 'success');
                    showSection('menu_tournament_roundrobin', lobbyId);
                }
                else if (response.type === 'error')
                {
                    displayToast(response.message, 'error');
                }
            }
        }
    });

    async function createTournamentLobby() {
        try {
            const token = localStorage.getItem('access_token'); 

            const response = await fetch(`/api/tm/create/?type=tournament`, {
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

    const tournamentRRButton = document.getElementById('tournamentItemRR');
    tournamentRRButton.addEventListener('click', async () => {
        const response = await createTournamentLobby();
        if (response.type === 'error')
            displayToast(response.message, 'error');
        else if (response.type === 'success')
        {
            displayToast('You have successfully created a lobby', 'success');
            showSection('menu_tournament_roundrobin', response.lobby.id);
        }
    });

}
