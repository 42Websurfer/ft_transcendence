import { getCookie, displayMessages } from './utils.js';
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
            <div id="joinMessage" class="join-message"></div>
        </div> 
    </div>
    `;

    async function joinTournamentLobby(lobby_id) {
        try {
            const response = await fetch(`/tm/join_tournament_lobby/${lobby_id}/`, {
                method: 'GET',
                credentials: 'include'
            });
            return await response.json();
        } catch (error) {
            return { error: 'Failed to tournament create request.' };
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
                    showSection('menu_tournament_roundrobin', lobbyId);
                else
                {
                    displayErrorMessage(response.message)
                }
            }
        }
    });

    async function createTournamentLobby() {
        try {
            const response = await fetch(`/tm/create/tournament`, {
                method: 'GET',
                credentials: 'include'
            });            
            return await response.json();
        } catch (error) {
            return { error: 'Failed to tournament create request.' };
        }

    }

    function displayErrorMessage(message)
    {
        const joinMessage = document.getElementById('joinMessage');
        joinMessage.textContent = message;
        joinMessage.style.color = 'red';
        joinMessage.style.animation = 'none';
        joinMessage.offsetHeight;
        joinMessage.style.animation = 'wiggle 0.5s ease-in-out';

    }

    const tournamentRRButton = document.getElementById('tournamentItemRR');
    tournamentRRButton.addEventListener('click', async () => {
        const response = await createTournamentLobby();
        if (response.type === 'error')
            displayErrorMessage(response.message)
        else
            showSection('menu_tournament_roundrobin', response.lobby.id);
    });

}
