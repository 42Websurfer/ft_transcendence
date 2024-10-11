import { getCookie, displayMessages } from './utils.js';
import { selectedListItem, setSelectedListItem, handleFriendRequest, showSection } from './index.js';
import { addListItem } from './index.js';

export function runWebsocket(socket) {


    socket.onopen = function() {
        console.log("Connected to Websocket of a Tournament")
    };

    socket.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);

            const tournamentList = document.getElementById("tournamentLobbyList");
            if (!tournamentList) 
                return;
            const userList = data.tournaments_user;
            tournamentList.innerHTML = '';
            for (let index = 0; index < userList.length; index++) {
                const user = userList[index];
                let content = user.username;
                if (userList[index].role === 'admin')
                    content += ' *Game Master*';
                addListItem(content, tournamentList, 'lobby', user.role);
            }
        }
        catch (error) {
            console.error("Error with Parsing Tournament user");
        }
    };
    
    socket.onclose = function(event) {
        console.log('WebSocket connection closed');
    };

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
                                <tbody id="tournamentStandingsTableBody" class="tournament-table-body">
                                    <tr>
                                        <td>1</td>
                                        <td>fheid</td>
                                        <td>1</td>
                                        <td>1</td>
                                        <td>0</td>
                                        <td>4:0</td>
                                        <td>4</td>
                                        <td>3</td>
                                    </tr>
                                    <tr>
                                        <td>2</td>
                                        <td>fwechsle</td>
                                        <td>1</td>
                                        <td>0</td>
                                        <td>1</td>
                                        <td>0:4</td>
                                        <td>-4</td>
                                        <td>0</td>
                                    </tr>
                                </tbody>
                            </table>


                        </div>
                    </div>
                    
                    <hr class="tournament-vertical-divider">

                    <div class="tournament-table2" style="padding-left: 0;">
                        <div id="tournamentLobby">
                            <div class="tournament-table-header">
                                <p>ROUND X</p>
                            </div>  


                            <table id="tournamentRoundTable" class="tournament-round-table">
                                <colgroup>
                                    <col style="width: 35%;">
                                    <col style="width: 12.5%;">
                                    <col style="width: 5%;">
                                    <col style="width: 12.5%;">
                                    <col style="width: 35%;">
                                </colgroup>
                                <tbody id="tournamentRoundTableBody" class="tournament-table-body">
                                    <tr>
                                        <td>Team A</td>
                                        <td>2</td>
                                        <td>:</td>
                                        <td>1</td>
                                        <td>Team B</td>
                                    </tr>
                                    <tr>
                                        <td>Team C</td>
                                        <td>42</td>
                                        <td>:</td>
                                        <td>0</td>
                                        <td>Team D</td>
                                    </tr>
                                </tbody>
                            </table>


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

    const socket = new WebSocket(`ws://${window.location.host}/ws/tm/${lobbyId}/`);
    runWebsocket(socket);
    closeWebsocket(socket);

    function copyToClipboard() {
        var copyText = document.getElementById("lobbyId");
        navigator.clipboard.writeText(copyText.textContent);
        showCopyMessage();
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
}
