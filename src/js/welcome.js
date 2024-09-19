import { getCookie, displayMessages } from './utils.js';

export async function renderWelcome() {
    const app = document.getElementById('app');

    app.innerHTML = `
    MOIN BRATAN
    <button id="sendFriendRequest">Send Friend Request</button>
    <div id="responseDisplay"></div>
    <h2>Friend Requests</h2>
    <button id="checkRequests">Show Friend Requests</button>
    <div id="friendRequests"></div>
    <h2>Accpeted Friend's </h2>
    <button id="acceptedFriendButton">Show Accepted Friend's</button>
    <div id="acceptedFriend"></div>
    <br>
    <hr>
    <form id="matchForm">
        <input type="hidden" name="csrfmiddlewaretoken" value="${getCookie('csrftoken')}">
        <h2>Add Match Results</h2>
        <div class="form-floating">
            <input type="text" name="player1" class="form-control" required>
            <label for="floatingInput">Player 1</label>
        </div>
        <div class="form-floating">
            <input type="text" name="player2" class="form-control" required>
            <label for="floatingPassword">Player 2</label>
        </div>
        <div class="form-floating">
            <input type="text" name="score_player1" class="form-control" required>
            <label for="floatingPassword">Score Player 1</label>
        </div>
        <div class="form-floating">
            <input type="text" name="score_player2" class="form-control" required>
            <label for="floatingPassword">Score Player 2</label>
        </div>
        <button class="btn btn-primary w-100 py-2" type="submit">Sign in</button>
	</form>
    <div id="messages"></div>
    <h2>Show Match History</h2>
    <button id="matchHistoryButton">Show Matches</button>
    <div id="matchHistory"></div>
    <h2>Show Online Status</h2>
    <button id="getStatusButton">Show online status</button>
    <div id="user_status"></div>
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
    const getStatusButton = document.getElementById('getStatusButton');
    const response = await getOnlineStatus();
    displayStatusResponse(response);

    formdata.addEventListener('submit', handleMatchFormSubmit);

    friendRequestButton.addEventListener('click', async () => {
        const friendId = prompt("Enter the friend's user ID:");
        if (friendId) {
            const response = await sendFriendRequest(friendId);
            displayResponse(response);
        }
    });

    formdata.addEventListener('submit', handleMatchFormSubmit);

    getStatusButton.addEventListener('click', async () => {
            const response = await getOnlineStatus();
            displayStatusResponse(response);
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

    async function getOnlineStatus() {
        try {
            const response = await fetch(`/online-users/`, {
                method: 'GET',
                credentials: 'include'
            });
            return await response.json();
        } catch (error) {
            return { error: 'Failed to online-users request.' };
        }
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

export function displayStatusResponse(response, element) {
    element = document.getElementById('user_status')
    element.innerHTML = `
        <pre>${JSON.stringify(response, null, 2)}</pre>
    `;
}
