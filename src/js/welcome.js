import { getCookie } from './utils.js';

export function renderWelcome() {
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
    `;
    const friendRequestButton = document.getElementById('sendFriendRequest');
    const responseDisplay = document.getElementById('responseDisplay');
    const friendRequests = document.getElementById('friendRequests');
    const checkRequestsButton = document.getElementById('checkRequests');
    const acceptedRequests = document.getElementById('acceptedFriend');
    const acceptedFriendButton = document.getElementById('acceptedFriendButton');

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

    async function sendFriendRequest(friendId) {
        try {
            const csrftoken = getCookie('csrftoken');
            const response = await fetch(`/send_friend_request/${friendId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
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
}
