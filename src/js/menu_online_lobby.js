import { getCookie, displayMessages } from './utils.js';
import { selectedListItem, setSelectedListItem, handleFriendRequest, showSection } from './index.js';

export function runWebsocket(socket) {


    socket.onopen = function() {
        console.log("Connected to Websocket of a Tournament")
    };

    socket.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'send_tournament_users')
            {
                
                const tournamentStandingsTable = document.getElementById("tournamentStandingsTable");
                if (!tournamentStandingsTable) 
                    return;
                
                const tableBody = document.getElementById('tournamentStandingsTableBody');
                if (tableBody)
                    tableBody.innerHTML = '';
                const results = data.results;
                for (let index = 0; index < results.length; index++) {
                    const user = results[index];
                    console.log(data);
                    console.log('User_id from from socket: ' + data.user_id);
                    console.log('User_id from from reults: ' + user.user_id);
                    console.log('Status: ' + user.role);

                    if (data.user_id == user.user_id && user.role != 'admin')
                    {
                        const startButton = document.getElementById('tournamentStartButton');
                        if (startButton)
                            startButton.remove();
                    }
                    
                    let rank = user.rank;
                    let player = user.player;
                    let games = user.games;
                    let wins = user.won;
                    let losses = user.lost;
                    let goals = user.goals + ":" + user.goals_against;
                    let diff = user.diff;
                    let points = user.points;
                    
                    addRowToStandingsTable(rank, player, games, wins, losses, goals, diff, points);
                }
            }
            else if (data.type === 'match_list')
            {
                if (!data.matches)
                    return;
                console.log(data.matches);
                if (!data.matches)
                    return;
                
                const matches = data.matches
                displayMatches(matches);
            } 
        }
        catch (error) {
            console.error("Error with Parsing Tournament user:", error);
        }
    };
    
    socket.onclose = function(event) {
        console.log('WebSocket connection closed');
    };

}

function displayMatches(response)
{
    const matches = response.matches;

    const tournamentMatchesList = document.getElementById('tournamentMatches');
    if (tournamentMatchesList)
        tournamentMatchesList.innerHTML = '';

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

        addMatchItem(tournamentMatchesList, player_home, player_away, score, status);
    }
    addMatchItem(tournamentMatchesList, "nsassenb", "fwechsle", "6:0", "running");
}

function addRowToStandingsTable(rank, player, games, wins, losses, goals, diff, points) {

    const tableBody = document.getElementById('tournamentStandingsTableBody');

    if (!tableBody)
        return;

    const row = document.createElement('tr');

    row.innerHTML = `
        <td>${rank}</td>
        <td>${player}</td>
        <td>${games}</td>
        <td>${wins}</td>
        <td>${losses}</td>
        <td>${goals}</td>
        <td>${diff}</td>
        <td>${points}</td>
    `;

    tableBody.appendChild(row);
}

function addMatchItem(tournamentMatchesList, player_home, player_away, score, status) {

    if (!tournamentMatchesList)
        return;

    const li = document.createElement('li');

    li.style = `
        border: 1px solid #ccc;
        border-radius: 0.6em;
        margin-bottom: 0.6em;
        width: 100%;
    `;

    let item;

    if (status === 'finished' || status === 'freegame')
    {
        item = '<svg class="check-symbol" xmlns="http://www.w3.org/2000/svg" viewBox="2 1.5 20 20" fill="#4740a8" width="4em" height="4em" style="margin: 0; padding: 0;"><path d="M0 0h24v24H0z" fill="none"/><path d="M9 16.2l-3.5-3.5 1.4-1.4L9 13.4l7.1-7.1 1.4 1.4z"/></svg>';
        li.style.background = 'linear-gradient(to bottom, rgba(26, 158, 37, 0.8), rgba(15, 126, 24, 0.8) 100%)';
    }
    else if (status === 'pending')
    {
        item = '<svg class="clock-symbol" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#4740a8" width="4em" height="4em" style="margin: 0; padding: 0;"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-.5-13h-2v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>';
        li.style.background = 'linear-gradient(to bottom, rgba(211, 211, 211, 0.8), rgba(169, 169, 169, 0.8) 100%)';
    }
    else //running
    {
        item = '<div class="pong-loader"><span class="ball"></span></div>'
        li.classList.add('lava-lamp');
    }

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

    tournamentMatchesList.appendChild(li);
}

function closeWebsocket(socket) {
    const logoutButton = document.getElementById('logoutButton');
    const homeButton = document.getElementById('webpong-button');
    homeButton.addEventListener('click', () => {socket.close(1000)})
    logoutButton.addEventListener('click', () => {socket.close(1000)});
}

export function renderMenuOnlineLobby(lobbyId) {

    const app = document.getElementById('app');

    app.innerHTML = `
    <div class="menu">
        <div class="tournament-container">

            <div class="tournament-container-header">
                <p>1v1-Online-Lobby</p>
            </div>
            
            <hr class="tournament-container-divider">

            <div class="tournament-container-inside">

                <div class="tournament-container-left">

                    <div class="tournament-table1" style="padding-right: 0.6em;">
                        <div id="tournamentLobby">
                            <div class="tournament-table-header">
                                <p>STANDINGS</p>
                            </div>


                            <table id="tournamentStandingsTable" class="tournament-standings-table">
                                <colgroup>
                                    <col style="width: 6%;">
                                    <col style="width: 29%;">
                                    <col style="width: 10%;">
                                    <col style="width: 10%;">
                                    <col style="width: 10%;">
                                    <col style="width: 15%;">
                                    <col style="width: 10%;">
                                    <col style="width: 10%;">
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>PLAYER</th>
                                        <th>PLAYED</th>
                                        <th>WON</th>
                                        <th>LOST</th>
                                        <th>GOALS</th>
                                        <th>DIFF</th>
                                        <th>POINTS</th>
                                    </tr>
                                </thead>
                                <tbody id="tournamentStandingsTableBody" class="tournament-table-body"></tbody>
                            </table>


                        </div>
                    </div>
                    
                    <hr class="tournament-vertical-divider">

                    <div class="tournament-table2" style="padding-left: 0;">
                        <div id="tournamentLobby">
                            <div class="tournament-table-header">
                                <p>MATCHES</p>
                            </div>  

                            <ul id="tournamentMatches" style="list-style-type: none; padding: 0; margin: 0;"></ul>

                        </div>
                    </div>

                </div>

                <div class="tournament-buttons">
                    <div class="tournament-lobby-id">
                        <div>
                            <p style="color: white; margin-bottom: 0.2em">Lobby-ID</p>
                        </div>
                        <div style="display: flex; flex-direction: row; justify-content: center;">
                            <p id="lobbyId" style="color: #4740a8; margin: 0 0.4em;">${lobbyId}</p>
                            <button id="copyLobbyIdButton"><span class="button-text">&#x2398;</span></button>
                        </div>
                    </div>
                    <button id="controlsButton"><span class="button-text">Controls</span></button>
                    <button id="tournamentStartButton" class="start-button"><span id="tournamentStartButtonSpan">Start tournament</span></button>
                    <button id="roundStartButton" class="start-button"><span id="roundStartButtonSpan">Start Round</span></button>
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

        <div class="countdown-container" id="countdownDisplay"></div>

    </div>
    `;

    const socket = new WebSocket(`ws://${window.location.host}/ws/match/${lobbyId}/`);
    runWebsocket(socket);
    closeWebsocket(socket);

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
    const closeControlsModalButton = document.getElementById('closeControlsModalButton');

    controlsButton.addEventListener('click', () => {
        controlsModal.style.display = 'block';
    });

    closeControlsModalButton.addEventListener('click', () => {
        controlsModal.style.display = 'none';
    });

    async function showTournamentMatches() {
        try {
            const response = await fetch(`/tm/start_tournament/${lobbyId}/`, {
                method: 'GET',
                credentials: 'include'
            });
            return await response.json();
        } catch (error) {
            return { error: 'Failed to tournament create request.' };
        }

    };

    const tournamentStartButton = document.getElementById('tournamentStartButton');
    const roundStartButton = document.getElementById('roundStartButton');

    tournamentStartButton.addEventListener('click', async() => {
        tournamentStartButton.style.display = 'none';
        roundStartButton.style.display = 'block';
        await showTournamentMatches();
    });

    roundStartButton.addEventListener('click', async() => {
        roundStartButton.disabled = true;
        startGame();
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
