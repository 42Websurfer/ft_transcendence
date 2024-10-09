import { getCookie, displayMessages } from './utils.js';
import { selectedListItem, setSelectedListItem, handleFriendRequest } from './index.js';

export function renderTournament() {

    const app = document.getElementById('app');

    app.innerHTML = `
    <div class="menu">
        <div class="menu-friends"></div>
        <div class="menu-gamemodes">
            <div class="menu-item" id="menu-item-local">
                <h1>Robin blabla</h1>
                <p>Play local - alone or with a friend<p>
            </div>  
            <div class="menu-item" id="menu-item-online">
                <h1>KO-Tournament</h1>
                <p>Play 1 vs 1 with a friend<p>
            </div>
            <div class="tournament-or-text">
				<p>OR</p>
			</div>
            <div class="tournament-enter-lobby">
                <input type="text" id="tournamentLobbyId" placeholder="Enter a lobby-id and hit enter...">
            </div>
        </div>
        <div class="modal" id="friendsAddModal">
            <div class="modal-content">
                <span class="close-button" id="closeModal1Button">&times;</span>
                <div class="friends-add-header">
                    <p>ADD A FRIEND</p>
                </div>
                <hr class="friends-add-divider1">
                <div class="friends-add-input-container">
                    <input type="text" id="friendUsername" placeholder="Enter username">
                    <button id="sendInvitationButton">INVITE</button>
                </div>

                <div id="invitationMessage" class="invitation-message"></div>

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
        
        <div class="modal-modify" id="friendsModifyModal">
            <div class="modal-content-modify">
                <span class="close-button" id="closeFriendsModifyModalButton">&times;</span>
                <div class="friends-add-header">
                    <p>MODIFY FRIENDSHIP</p>
                </div>
                <hr class="friends-add-divider3">

                <div class="friends-modify-username">
                    <p>FRIEND: </p>
                    <p id="friendsModifyModalUsername"></p>
                </div>

                <div class="friends-modify-button">
                    <button id="removeFriendButton">REMOVE FRIEND</button>
                </div>
                
                <div class="friends-modify-button">
                <button id="acceptFriendButton">ACCEPT FRIEND REQUEST</button>
                </div>
                
                <div class="friends-modify-button">
                <button id="denyFriendButton">DENY FRIEND REQUEST</button>
                </div>
                
                <div class="friends-modify-button">
                <button id="withdrawFriendButton">WITHDRAW FRIEND REQUEST</button>
                </div>
                
                <div class="friends-modify-button">
                <button id="unblockFriendButton">UNBLOCK USER</button>
                </div>
                
                <div class="friends-modify-button">
                    <button id="blockFriendButton">BLOCK USER</button>
                </div>

            </div>
        </div>
    </div>
    `;
}
