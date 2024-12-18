import { renderPong } from './pong.js';
import { copyToClipboard } from './utils.js';

export function runWebsocket(socket) {


    socket.onopen = function() {
        console.log("Connected to Websocket of a Tournament")
    };

    socket.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);

            if (data.type === 'user_list')
            {
                const matchPlayers = document.getElementById("matchPlayers");
                if (!matchPlayers) 
                    return;

                matchPlayers.innerHTML = '';
                const startMatchButton = document.getElementById('startOnlineMatch');

				for (let user of data.users) {
					const li = document.createElement('li');
					if (user.role === 'admin') {
						li.innerHTML = `<span class="list-item-content"><span${user.username === data.username ? ' class="local-player"' : ''}>${user.username}</span><span style="color: red; font-size: 0.8em"> (*)</span></span>`;
						if (data.users.length == 4 && data.username == user.username)
							startMatchButton.style.display = 'block';
					} else {
						li.innerHTML = `<span class="list-item-content${user.username === data.username ? ' local-player' : ''}">${user.username}</span>`;
					}
					matchPlayers.append(li);
				}
            }
            else if (data.type === 'match_list')
            {
                if (!data.winners)
                    return;

                console.log("data: ", data);
                console.log("matches: ", data.matches);
                
                displayWinners(data.winners);
            }
            else if (data.type === 'start_match')
            {
                console.log('Looop_id = ', data.match_id);
                if (data.match_id)
                    renderPong(data.match_id)
            }
        }
        catch (error) {
            console.error("Error with Parsing Tournament user:", error);
        }
    };
    
    socket.onclose = function(event) {
        console.log('WebSocket connection closed');
        g_socket = undefined;
        const lobbyClosedModal = document.getElementById('lobbyClosedModal');
        if (!lobbyClosedModal)
            return;

        lobbyClosedModal.style.display = 'block';
    };

}

function displayWinners(winners)
{
    const historicMatchesList = document.getElementById('historicMatches');
    if (historicMatchesList)
        historicMatchesList.innerHTML = '';

	for (let winner of winners) {
		const li = document.createElement('li');
		li.innerHTML = `${winner}`
		historicMatchesList.appendChild(li);
	}
}

function closeWebsocket(socket) {
    const logoutButton = document.getElementById('logoutButton');
	const homeButton = document.getElementById('webpong-button');

	const closeSocket = () => {
		socket.close();
		homeButton.removeEventListener('click', closeSocket);
		logoutButton.removeEventListener('click', closeSocket);
        window.removeEventListener('popstate', closeSocket);
	}

	homeButton.addEventListener('click', closeSocket)
	logoutButton.addEventListener('click', closeSocket);
    window.addEventListener('popstate', closeSocket);
}

let g_socket;

export function renderMultiplayerLobby(lobbyId) {

    const app = document.getElementById('app');

    app.innerHTML = `
    <div class="menu">
        <div class="lobby-container">

            <div class="lobby-container-header">
                <p>1v1-Online-Lobby</p>
            </div>
            
            <hr class="lobby-container-divider">

            <div class="lobby-container-inside">

                <div class="lobby-container-data">

                    <div class="lobby-table1" style="padding-right: 0.6em;">
                        <div>
                            <div class="tournament-table-header">
                                <p>PLAYERS</p>
                            </div> 

                            <ul id="matchPlayers" class="match-players-list" style="list-style-type: none; padding: 0; margin: 0;"></ul>

                        </div>
                    </div>
                    
                    <hr class="tournament-vertical-divider">

                    <div class="lobby-table2" style="padding-left: 0;">
                        <div>
                            <div class="tournament-table-header">
                                <p>MATCHES</p>
                            </div>  

                            <ul id="historicMatches" style="list-style-type: none; padding: 0; margin: 0;"></ul>

                        </div>
                    </div>

                </div>

                <div class="lobby-container-buttons">
                    <div class="lobby-id">
                        <div>
                            <p style="color: white; margin-bottom: 0.2em">Lobby-ID</p>
                        </div>
                        <div style="display: flex; flex-direction: row; justify-content: center;">
                            <p id="copyLobbyId" style="color: #4740a8; margin: 0 0.4em;">${lobbyId}</p>
                            <button id="copyLobbyIdButton"><span class="button-text">&#x2398;</span></button>
                        </div>
                    </div>
                    <button id="controlsButton"><span class="button-text">Controls</span></button>
                    <button id="startOnlineMatch" class="start-match-button"><span id="matchStartButtonSpan">Start match</span></button>
                    <div id="copyMessage" class="copy-message">Copied to clipboard!</div>  
                </div>  
            </div>
        </div>

        <div class="modal" id="controlsModal">
            <div class="modal-content-modify">
                <span class="close-controls-button" id="closeControlsModalButton">&times;</span>
                <div class="friends-add-header">
                    <p>Game controls</p>
                </div>
                <hr class="controls-divider">
                <div class="tournament-controls">
                    <p>paddle up: up-arrow or w key</p>
                    <p>paddle down: down-arrow or s key</p>
                </div>
            </div>
        </div>

        <div class="modal" id="lobbyClosedModal">
            <div class="modal-content-modify">
                <span class="close-controls-button" id="closeLobbyClosedModalButton">&times;</span>
                <div class="tournament-controls">
                    <p>This lobby was closed by its owner!</p>
                </div>
            </div>
        </div>

        <div class="countdown-container" id="countdownDisplay"></div>

    </div>
    `;
    if (!g_socket) {
        const token = localStorage.getItem('access_token');

        g_socket = new WebSocket(`wss://${window.location.host}/ws/multiple/${lobbyId}/?token=${token}`);
        runWebsocket(g_socket);
        closeWebsocket(g_socket);
    } else {
        const token = localStorage.getItem('access_token'); 

        fetch(`/api/tm/get_lobby_data/${lobbyId}/?type=multiple`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        }).then((response) => response.json())
        .then((data) => {
            if (data.type === 'error') {
                console.log(data.message);
            }
        }).catch((error) => console.log("Error:", error));
    }

    const copyLobbyIdButton = document.getElementById('copyLobbyIdButton');
    copyLobbyIdButton.addEventListener('click', () => {
        copyToClipboard();
    });

    const controlsButton = document.getElementById('controlsButton');
    const controlsModal = document.getElementById('controlsModal');
    const lobbyClosedModal = document.getElementById('lobbyClosedModal');
    const closeControlsModalButton = document.getElementById('closeControlsModalButton');
    const closeLobbyClosedModalButton = document.getElementById('closeLobbyClosedModalButton');

    controlsButton.addEventListener('click', () => {
        controlsModal.style.display = 'block';
    });

    closeControlsModalButton.addEventListener('click', () => {
        controlsModal.style.display = 'none';
    });

    closeLobbyClosedModalButton.addEventListener('click', () => {
        lobbyClosedModal.style.display = 'none';
    });

    const matchStartButton = document.getElementById('startOnlineMatch');

    matchStartButton.addEventListener('click', async() => {
        try {
            const token = localStorage.getItem('access_token'); 

            const response = await fetch(`/api/tm/start_game/${lobbyId}/?type=multiple`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });
            console.log('Response: ', response);
        } catch (error) {
            console.log('Error: ', error);
        }
    });

    // COUNTDOWN TEST

    let countdown = 3;
    let countdownInterval;

    function startGame() {
        if (roundStartButton && roundStartButton.disabled)
                disableSpanInsideButton('roundStartButton');

        document.getElementById('countdownDisplay').style.display = 'block';

        countdownInterval = setInterval(updateCountdown, 1000);
    }

    async function updateCountdown() {
        document.getElementById('countdownDisplay').textContent = countdown.toString();
        
        if (countdown > 0) {
            countdown--;
        } else {
            clearInterval(countdownInterval);
            document.getElementById('countdownDisplay').style.display = 'none';
            
            console.log('Game started!');
        }
    }

    function disableSpanInsideButton(buttonId) {
        const button = document.getElementById(buttonId);
        if (button && button.disabled) {
            const span = button.querySelector('span');
            if (span) {
                span.classList.add('disabled');
            }
        }
    }
}
