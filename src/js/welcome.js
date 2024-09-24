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
    </div>
    `;
    const friendRequestButton = document.getElementById('sendFriendRequest');
    const responseDisplay = document.getElementById('responseDisplay');
    const friendRequests = document.getElementById('friendRequests');
    const checkRequestsButton = document.getElementById('checkRequests');
    const acceptedRequests = document.getElementById('acceptedFriend');
    const acceptedFriendButton = document.getElementById('acceptedFriendButton');
    const formdata = document.getElementById('matchForm');
    const messages = document.getElementById('messages');
    const matchHistoryButton = document.getElementById('matchHistoryButton');
    const matchHistory = document.getElementById('matchHistory');

    formdata.addEventListener('submit', handleMatchFormSubmit);

    friendRequestButton.addEventListener('click', async () => {
        const friendId = prompt("Enter the friend's user ID:");
        if (friendId) {
            const response = await sendFriendRequest(friendId);
            displayResponse(response);
        }
    });

    checkRequestsButton.addEventListener('click', async () => {
        const response = await checkRequests();
        displayFriendResponse(response);
    })

    acceptedFriendButton.addEventListener('click', async () => {
        const response = await friendList();
        displayFriendListResponse(response);
    })

    matchHistoryButton.addEventListener('click', async () => {
        const response = await getMatchHistory();
        displayMatchHistory(response);
    })

    async function handleMatchFormSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const data = {
            player1_id: formData.get('player1'),
            player2_id: formData.get('player2'),
            score_player1: formData.get('score_player1'),
            score_player2: formData.get('score_player2'),
        };
    
        const csrftoken = getCookie('csrftoken');
    
        const response = await fetch(`/match_result/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify(data)
        });
    
        const result = await response.json();
        displayMatchResponse(result);
    
    }

    async function sendFriendRequest(friendId) {
        try {
            const csrftoken = getCookie('csrftoken');
            const response = await fetch(`/send_friend_request/${friendId}/`, {
                method: 'GET',
                credentials: 'include'
            });
            return await response.json();
        } catch (error) {
            console.error('Error sending friend request:', error);
            return { error: 'Failed to send friend request.' };
        }
    }

    async function checkRequests() {
        try {
            const response = await fetch(`/friend_requests/`, {
                method: 'GET',
                credentials: 'include'
            });
            return await response.json();
        } catch (error) {
            return { error: 'Failed to send friend request.' };
        }
    }

    async function friendList() {
        try {
            const response = await fetch(`/friend_list/`, {
                method: 'GET',
                credentials: 'include'
            });
            return await response.json();
        } catch (error) {
            return { error: 'Failed to send friend request.' };
        }
    }

    async function getMatchHistory() {
        try {
            const response = await fetch(`/match_history/`, {
                method: 'GET',
                credentials: 'include'
            });
            return await response.json();
        } catch (error) {
            return { error: 'Failed to get match histroy.' };
        }
    }

    function displayResponse(response) {
        responseDisplay.innerHTML = `
            <pre>${JSON.stringify(response, null, 2)}</pre>
        `;
    }

    function displayFriendResponse(response) {
        friendRequests.innerHTML = `
            <pre>${JSON.stringify(response, null, 2)}</pre>
        `;
    }
    function displayFriendListResponse(response) {
        acceptedRequests.innerHTML = `
            <pre>${JSON.stringify(response, null, 2)}</pre>
        `;
    }

    function displayMatchResponse(response) {
        messages.innerHTML = `
            <pre>${JSON.stringify(response, null, 2)}</pre>
        `;
    }
    function displayMatchHistory(response) {
        matchHistory.innerHTML = `
            <pre>${JSON.stringify(response, null, 2)}</pre>
        `;
    }
}
