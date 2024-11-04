import { getCookie, displayMessages } from './utils.js';
import { selectedListItem, setSelectedListItem, handleFriendRequest, showSection } from './index.js';
import { renderPong } from './pong.js';

export function runWebsocket(socket) {


    socket.onopen = function() {
        console.log("Connected to Websocket of a Tournament")
    };

    socket.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);

            if (data.type === 'send_online_users')
            {
                const matchPlayers = document.getElementById("matchPlayers");
                if (!matchPlayers) 
                    return;

                matchPlayers.innerHTML = '';

                const li = document.createElement('li');

                li.innerHTML = `<span class="list-item-content"><span>${data.admin_username}</span><span style="color: red; font-size: 0.8em"> (*)</span></span>`;

                matchPlayers.appendChild(li);

                const startMatchButton = document.getElementById('matchStartButton');

                if (data.member_id != -1)
                {
                    const li = document.createElement('li');
                    startMatchButton.style.display = 'block';
                    li.className = 'friends-add-list-user';
                    li.innerHTML = `<span class="list-item-content">${data.member_username}</span>`;
    
                    matchPlayers.appendChild(li);
                }
                else
                    startMatchButton.style.display = 'none';
            }
            else if (data.type === 'match_list')
            {
                if (!data.matches)
                    return;

                console.log("data: ", data);
                console.log("matches: ", data.matches);
                
                displayMatches(data.matches);
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

function displayMatches(matches)
{
    const historicMatchesList = document.getElementById('historicMatches');
    if (historicMatchesList)
        historicMatchesList.innerHTML = '';

    for (let index = 0; index < matches.length; index++) {
        
        const match = matches[index];
        
        let player_home = match.player_home;
        let player_away = match.player_away;
        let score = '';

        if (match.home == -1 || match.away == -1)
            score = "-:-";
        else
            score = match.score_home + ":" + match.score_away;
        let status = match.status;

        addMatchItem(historicMatchesList, player_home, player_away, score, status);
    }
}

function addMatchItem(historicMatchesList, player_home, player_away, score, status) {

    if (!historicMatchesList)
        return;

    const li = document.createElement('li');

    li.style = `
        border: 1px solid #ccc;
        border-radius: 0.6em;
        margin-bottom: 0.6em;
        width: 100%;
    `;

    let item;

    item = '<svg class="check-symbol" xmlns="http://www.w3.org/2000/svg" viewBox="2 1.5 20 20" fill="#4740a8" width="4em" height="4em" style="margin: 0; padding: 0;"><path d="M0 0h24v24H0z" fill="none"/><path d="M9 16.2l-3.5-3.5 1.4-1.4L9 13.4l7.1-7.1 1.4 1.4z"/></svg>';
    li.style.background = 'linear-gradient(to bottom, rgba(26, 158, 37, 0.8), rgba(15, 126, 24, 0.8) 100%)';

    let free_color_home = '';
    let free_color_away = '';
    if (player_home[0] === "Free from play")
        free_color_home = ' color: grey;';
    if (player_away[0] === "Free from play")
        free_color_away = ' color: grey;';

    li.innerHTML = `
    <div class="tournament-match">
        <div class="tournament-match-item" style="width: 38%;${free_color_home}">${player_home}</div>
        <div class="tournament-match-item" style="font-size: 1em; width: 12%;">${score}</div>
        <div class="tournament-match-item" style="width: 38%;${free_color_away}">${player_away}</div>
        <div class="tournament-match-item" style="width: 12%;">${item}</div>
    </div>
    `;

    historicMatchesList.appendChild(li);
}

function closeWebsocket(socket) {
    const logoutButton = document.getElementById('logoutButton');
    const homeButton = document.getElementById('webpong-button');
    homeButton.addEventListener('click', () => {socket.close(1000)})
    logoutButton.addEventListener('click', () => {socket.close(1000)});
}

let g_socket;

export function renderMenuOnlineLobby(lobbyId) {

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
                            <p id="lobbyId" style="color: #4740a8; margin: 0 0.4em;">${lobbyId}</p>
                            <button id="copyLobbyIdButton"><span class="button-text">&#x2398;</span></button>
                        </div>
                    </div>
                    <button id="controlsButton"><span class="button-text">Controls</span></button>
                    <button id="matchStartButton" class="start-match-button"><span id="matchStartButtonSpan">Start match</span></button>
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
                    <p>paddle up: up-arrow key</p>
                    <p>paddle down: down-arrow key</p>
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
        g_socket = new WebSocket(`ws://${window.location.host}/ws/match/${lobbyId}/`);
        runWebsocket(g_socket);
        closeWebsocket(g_socket);
    } else {
        fetch(`/tm/get_online_lobby_data/${lobbyId}/`, {
            method: 'GET',
            credentials: 'include'
        }).then((response) => response.json())
        .then((data) => {
            if (data.type === 'error') {
                console.log(data.message);
            }
        }).catch((error) => console.log("Error:", error));
    }

    function copyToClipboard() {
        var copyText = document.getElementById("lobbyId");


        console.log("lobbyID: ", lobbyId);
        console.log("copyText.textContent ", copyText.textContent);

        var textToCopy = copyText.tagName === 'INPUT' || copyText.tagName === 'TEXTAREA' ? copyText.value : copyText.textContent;

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                showCopyMessage();
            }).catch(err => {
                console.error("Failed to copy text: ", err);
            });
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = textToCopy;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();

            try {
                document.execCommand('copy');
                showCopyMessage();
            } catch (err) {
                console.error('Fallback: Oops, unable to copy', err);
            }

            document.body.removeChild(textarea);
        }

    }

    const copyLobbyIdButton = document.getElementById('copyLobbyIdButton');
    copyLobbyIdButton.addEventListener('click', () => {
        copyToClipboard();
    });

    function showCopyMessage() {
        var copyMessage = document.getElementById("copyMessage");
        copyMessage.style.display = "block";
        setTimeout(() => {
            copyMessage.style.display = "none";
        }, 2000);
    }

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

    const matchStartButton = document.getElementById('matchStartButton');

    matchStartButton.addEventListener('click', async() => {
        try {
            const response = await fetch(`/tm/start_game/${lobbyId}/`, {
                method: 'GET',
                credentials: 'include'
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
