import { getCookie, displayMessages } from './utils.js';
import { selectedListItem, setSelectedListItem, handleFriendRequest, showSection } from './index.js';

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
                        <button id="friends-options-add-button">ADD FRIEND</button>
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
                <p>Play 1 vs 1 with a friend<p>
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
    
    const addButton = document.getElementById('friends-options-add-button');
    const friendsAddModal = document.getElementById('friendsAddModal');
    const closeModalButton = document.getElementById('closeModal1Button');
    const inviteButton = document.getElementById('sendInvitationButton');
    const invitationMessage = document.getElementById('invitationMessage');

    async function sendFriendRequest(username) {
        try {
            if (!username)
                return;
            const csrftoken = getCookie('csrftoken');
            const response = await fetch(`/send_friend_request/${username}/`, {
                method: 'GET',
                credentials: 'include'
            });
            return await response.json();
        } catch (error) {
            return { 'type': 'error', 'message': 'User does not exist!' };
        }
    }

    inviteButton.addEventListener('click', async () => {
        const friendUsername = document.getElementById('friendUsername');
        if (!friendUsername.value)
            return;
        var response = await sendFriendRequest(friendUsername.value);
        console.log("Response_type: "+ response.type);            
        console.log("Response_msg: "+ response.message);  
        invitationMessage.textContent = response.message;

        if (response.type === 'Success Request')
            invitationMessage.style.color = 'green';
        else
            invitationMessage.style.color = 'red';
        
        invitationMessage.style.animation = 'none'; // Reset animation
        invitationMessage.offsetHeight; // Trigger reflow
        invitationMessage.style.animation = 'wiggle 0.5s ease-in-out';
    });

    addButton.addEventListener('click', () => {
        friendsAddModal.style.display = 'block';
        // friendSelectOnlineOffline.style.display = 'block';   
    });

    closeModalButton.addEventListener('click', () => {
        friendsAddModal.style.display = 'none';
        invitationMessage.textContent = '';
    });

    window.addEventListener('click', (event) => {
        if (event.target === friendsAddModal) {
            friendsAddModal.style.display = 'none';
            invitationMessage.textContent = '';
        }
    });

    const friendsModifyModal = document.getElementById('friendsModifyModal');
    const removeFriendButton = document.getElementById('removeFriendButton');
    const blockFriendButton = document.getElementById('blockFriendButton');
    const acceptFriendButton = document.getElementById('acceptFriendButton');
    const denyFriendButton = document.getElementById('denyFriendButton');
    const withdrawFriendButton = document.getElementById('withdrawFriendButton');
    const unblockFriendButton = document.getElementById('unblockFriendButton');
    
    removeFriendButton.addEventListener('click', async () => {
        if (selectedListItem) {
            const content = selectedListItem.textContent;
            setSelectedListItem(null);
            friendsModifyModal.style.display = 'none';
            console.log(`/remove_friendship/${content}/`)
            const response = await handleFriendRequest(`/remove_friendship/${content}/`)
            console.log(response.type + ' + ' + response.message);
        }
    });

    blockFriendButton.addEventListener('click', async () => {
        if (selectedListItem) {
            const content = selectedListItem.textContent;
            setSelectedListItem(null);
            friendsModifyModal.style.display = 'none';
            console.log(`/block_friend_request/${content}/`)
            const response = await handleFriendRequest(`/block_friend_request/${content}/`)
            console.log(response.type + ' + ' + response.message);
        }
    });

    acceptFriendButton.addEventListener('click', async () => {
        if (selectedListItem) {
            const content = selectedListItem.textContent;
            setSelectedListItem(null);
            friendsModifyModal.style.display = 'none';
            console.log(`/accept_friend_request/${content}/`)
            const response = await handleFriendRequest(`/accept_friend_request/${content}/`)
            console.log(response.type + ' + ' + response.message);
        }
    });

    denyFriendButton.addEventListener('click', async () => {
        if (selectedListItem) {
            const content = selectedListItem.textContent;
            setSelectedListItem(null);
            friendsModifyModal.style.display = 'none';
            console.log(`/remove_friendship/${content}/`)
            const response = await handleFriendRequest(`/remove_friendship/${content}/`)
            console.log(response.type + ' + ' + response.message);
        }
    });

    withdrawFriendButton.addEventListener('click', async () => {
        if (selectedListItem) {
            const content = selectedListItem.textContent;
            setSelectedListItem(null);
            friendsModifyModal.style.display = 'none';
            console.log(`/remove_friendship/${content}/`)
            const response = await handleFriendRequest(`/remove_friendship/${content}/`)
            console.log(response.type + ' + ' + response.message);
        }
    });

    unblockFriendButton.addEventListener('click', async () => {
        if (selectedListItem) {
            const content = selectedListItem.textContent;
            setSelectedListItem(null);
            friendsModifyModal.style.display = 'none';
            console.log(`/remove_friendship/${content}/`)
            const response = await handleFriendRequest(`/remove_friendship/${content}/`)
            console.log(response.type + ' + ' + response.message);
        }
    });

    const tournamentButton = document.getElementById('menu-item-tournament');
    tournamentButton.addEventListener('click', () => {
        console.log("clicked");
        showSection('tournament');
    });

    const lobbyButton = document.getElementById('menu-item-local');
    lobbyButton.addEventListener('click', () => {
        console.log("clicked");
        showSection('lobby', 'PVEJ');
    });
}
