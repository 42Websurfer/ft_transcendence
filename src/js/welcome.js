import { getCookie, displayMessages } from './utils.js';

export function renderWelcome() {

    const app = document.getElementById('app');

    app.innerHTML = `
    <div class="menu">
        <div class="menu-friends">
            <div class="menu-friends-container">
                <div class="menu-friends-header">
                    <p>FRIENDS</p>
                </div>
                <hr class="friends-divider">
                <div id="friendsOnline" class="friends-online">
                    <div class="friends-online-header">
                        <p>ONLINE</p>
                    </div>
                    <ul id="friendsOnlineList" class="friends-online-list"></ul>
                    <hr class="friends-divider">
                </div>
                <div id="friendsOffline" class="friends-offline">
                    <div class="friends-offline-header">
                        <p>OFFLINE</p>
                    </div>
                    <ul id="friendsOfflineList" class="friends-offline-list"></ul>
                    <hr class="friends-divider">
                </div>
                <div class="friends-options">
                    <div class="friends-options-add">
                        <button id="friends-options-add-button">ADD</button>
                    </div>
                    <div class="friends-options-remove">
                        <button id="friends-options-remove-button">REMOVE</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="menu-gamemodes">
            <div class="menu-item" id="menu-item-local">
                <h1>Local</h1>
                <p>Play local - alone or with a friend<p>
            </div>  
            <div class="menu-item" id="menu-item-online">
                <h1>Online</h1>
                <p>Play online with friends<p>
            </div>
            <div class="menu-item" id="menu-item-tournament">
                <h1>Tournament</h1>
                <p>Play an exciting Tournament<p>
            </div>
            <div class="menu-item" id="menu-item-multiplayer">
                <h1>Multiplayer</h1>
                <p>Play online in multiplayer mode<p>
            </div>
            <div class="menu-item" id="menu-item-dashboard">
                <h1>Dashboard</h1>
                <p>Check your game stats<p>
            </div>
        </div>
        <div class="modal" id="friendsAddModal">
            <div class="modal-content">
                <span class="close-button" id="closeModalButton">&times;</span>
                <div class="friends-add-header">
                    <p>ADD A FRIEND</p>
                </div>
                <hr class="friends-add-divider1">
                <div class="friends-add-input-container">
                    <input type="text" id="friendUsername" placeholder="Enter username">
                    <button id="sendInvitationButton">INVITE</button>
                </div>

                <div class="friends-add-lists">
                <div id="friendsRequests" class="friends-add-list-item">
                    <div class="friends-add-list-header">
                        <p>REQUESTS</p>
                    </div>
                    <hr class="friends-add-divider2">
                    <ul id="friendsRequestsList" class="friends-add-list"></ul>
                </div>
                    <div id="friendsPending" class="friends-add-list-item">
                        <div class="friends-add-list-header">
                            <p>PENDING</p>
                        </div>
                        <hr class="friends-add-divider2">
                        <ul id="friendsPendingList" class="friends-add-list"></ul>
                    </div>
                    <div id="friendsBlocked" class="friends-add-list-item">
                        <div class="friends-add-list-header">
                            <p>BLOCKED</p>
                        </div>
                        <hr class="friends-add-divider2">
                        <ul id="friendsBlockedList" class="friends-add-list"></ul>
                    </div>
                </div>

            </div>
        </div>
    </div>
    `;
    
    const addButton = document.getElementById('friends-options-add-button');
    const friendsAddModal = document.getElementById('friendsAddModal');
    const closeModalButton = document.getElementById('closeModalButton');

    addButton.addEventListener('click', () => {
        friendsAddModal.style.display = 'block';
    });

    closeModalButton.addEventListener('click', () => {
        friendsAddModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === friendsAddModal) {
            friendsAddModal.style.display = 'none';
        }
    });

}