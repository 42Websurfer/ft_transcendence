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
                console.log('SOCKET MESSAGE: ' + data.matches);  
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

    console.log(matches);
    const tournamentMatchesList = document.getElementById('tournamentMatches');
    if (tournamentMatchesList)
        tournamentMatchesList.innerHTML = '';
    for (let index = 0; index < matches.length; index++) {
        
        const match = matches[index];
        
        let player_home = match.player_home;
        let player_away = match.player_away;
        let score = '';
        console.log('Match_home = ' + match.home);
        console.log('Match_away = ' + match.away);

        if (match.home == -1 || match.away == -1)
            score = "-:-";
        else
            score = match.score_home + ":" + match.score_away;
        let status = match.status;
        
        addMatchItem(tournamentMatchesList, player_home, player_away, score, status);
    }
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
        background: linear-gradient(to bottom, rgba(133, 129, 199, 0.8), rgba(71, 64, 168, 0.8) 100%);
        border: 1px solid #ccc;
        border-radius: 0.6em;
        margin-bottom: 0.6em;
    `;

    li.innerHTML = `
    <div class="tournament-match">
        <div class="tournament-match-item">${player_home}</div>
        <div class="tournament-match-item" style="font-size: 1em;">${score}</div>
        <div class="tournament-match-item">${player_away}</div>
        <div class="tournament-match-item">${status}</div>
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

export function renderTournamentRR(lobbyId) {

    const app = document.getElementById('app');

    app.innerHTML = `
    <div class="menu">
        <div class="tournament-container">

            <div class="tournament-container-header">
                <p>Round-Robin-Tournament</p>
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
                                <p>ROUND X</p>
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
                    <button id="tournamentStartButton"><span class="button-text">Start tournament</span></button>
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


    </div>
    `;


    // <table id="tournamentMatches" class="tournament-matches">
    // <colgroup>
    //     <col style="width: 35%;">
    //     <col style="width: 20%;">
    //     <col style="width: 35%;">
    //     <col style="width: 10%;">
    // </colgroup>
    // <tbody id="tournamentRoundTableBody" class="tournament-table-body"></tbody>
    // </table>

    const socket = new WebSocket(`ws://${window.location.host}/ws/tm/${lobbyId}/`);
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

    tournamentStartButton.addEventListener('click', async() => {
        const response = await showTournamentMatches();
        displayMatches(response);
    });
}
