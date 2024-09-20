export function runWebsocket(socket) {

    socket.onopen = function() {
        console.log("Connected to Websocket of a Tournament")
    };

    socket.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            const joinedUser = document.getElementById('joinedUser');
            joinedUser.innerHTML = `
                <pre>${JSON.stringify(data,null,2)}</pre>
            `;
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

    logoutButton.addEventListener('click', () => {
        socket.close(1000);
    });
}

export function renderLobby(groupName) {
    
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class=container>
        <h1>Welcome in Lobby ${groupName}</h1>
        <div id="joinedUser"></div>
        </div>
    `;    
    
    const socket = new WebSocket(`ws://localhost:8090/ws/tm/${groupName}/`);
    runWebsocket(socket);
    closeWebsocket(socket);
}
