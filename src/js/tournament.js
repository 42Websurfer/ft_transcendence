import { getCookie, displayMessages } from './utils.js';
import { selectedListItem, setSelectedListItem, handleFriendRequest, showSection } from './index.js';

export function renderTournament() {

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
            const response = await fetch(`/tm/join/${lobby_id}/`, {
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
                    showSection('tournamentRR', lobbyId);
                else 
                    console.log(response.type); //Need to be shown at frontend
            }
        }
    });

    async function createTournamentLobby() {
        try {
            const response = await fetch(`/tm/create/`, {
                method: 'GET',
                credentials: 'include'
            });            
            return await response.json();
        } catch (error) {
            return { error: 'Failed to tournament create request.' };
        }

    }

    const tournamentRRButton = document.getElementById('tournamentItemRR');
    tournamentRRButton.addEventListener('click', async () => {
        const response = await createTournamentLobby();
        showSection('tournamentRR', response.lobby.id);
    });

}
