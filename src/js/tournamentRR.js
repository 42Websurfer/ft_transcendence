import { getCookie, displayMessages } from './utils.js';
import { selectedListItem, setSelectedListItem, handleFriendRequest, showSection } from './index.js';

export function renderTournamentRR() {

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

                    <div class="tournament-lobby">
                        <div id="tournamentLobby">
                            <div class="tournament-lobby-header">
                                <p>LOBBY</p>
                            </div>
                            <ul id="tournamentLobbyList" class="tournament-lobby-list"></ul>
                        </div>
                    </div>
                    
                    <hr class="tournament-vertical-divider">
                    
                    <div class="tournament-controls">
                        <div class="tournament-controls-header">
                            <p>CONTROLS</p>
                        </div>
                        <div class="tournament-controls-header">
                            <p style="color: white; font-size: 1em;">paddle up: up-arrow key</p>
                            <p style="color: white; font-size: 1em;">paddle down: down-arrow key</p>
                        </div>
                    </div>

                </div>

                <div class="tournament-buttons">
                    <div class="tournament-lobby-id">
                        <div>
                            <p style="color: white; margin-bottom: 0.2em">Lobby-ID</p>
                        </div>
                        <div style="display: flex; flex-direction: row; justify-content: center;">
                            <p id="lobbyId" style="color: #4740a8; margin: 0 0.4em;">XP5G9</p>
                            <button id="copyLobbyIdButton"><span class="button-text">&#x2398;</span></button>
                        </div>
                    </div>
                    <button id="tournamentStartButton"><span class="button-text">Start tournament</span></button>
                    <div id="copyMessage" class="copy-message">Copied to clipboard!</div>  
                </div>  
            </div>
        </div>
    </div>
    `;

    function copyToClipboard() {
        var copyText = document.getElementById("lobbyId");
        navigator.clipboard.writeText(copyText.textContent);
        showCopyMessage();
        // alert("Copied the text: " + copyText.textContent);
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
}
