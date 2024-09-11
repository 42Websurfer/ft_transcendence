export function runWebsocket(socket, user) {

    socket.onopen = function(e) {
        console.log("WebSocket connection established");
        socket.send(JSON.stringify({
            'type': 'welcome',
            'user': user,
            'message': 'Hello, Server!'
        }));
    };

    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        if (data.type == 'game')
            {
            console.log('Message from user: ', data.user);
            console.log(data.player1_posX);
            console.log(data.player1_posY);
            console.log(data.player2_posX);
            console.log(data.player2_posY);
        }
        else if (data.type == 'welcome_message')
        {
            console.log('Message from server:', data.message);
        }
    };
    
    socket.onclose = function(event) {
        
        console.log('WebSocket connection closed');
    };
    document.addEventListener('keydown', function(event) {
        if (event.code === 'Space') {
            const message = {
                type: 'game',
                user: user,
                player1_posX: 1,
                player1_posY: 0.3,
                player2_posX: 4,
                player2_posY: 0.7,
                ball_posX: 12,
                ball_posY: 0.02,
                message: 'Spacebar pressed' 
            };
            socket.send(JSON.stringify(message));
            //console.log('Message sent to server:', message);
        }
    });
}

export function renderWebsocket() {
    
    const app = document.getElementById('app');
    app.innerHTML = `
        <h1>Press Space to Send a Message</h1>
    `;
    const groupName = prompt("Please enter the group name:");
    const user = prompt("Which user are you?");
    const socket = new WebSocket(`ws://10.13.9.1:8090/ws/pong/${groupName}/`);
    runWebsocket(socket, user);
    // document.addEventListener('DOMContentLoaded', (event) => {
    //     const socket = new WebSocket('ws://localhost:8001/ws/pong/');
    
    //     socket.onopen = function(event) {
    //         console.log('WebSocket connection opened');
    //     };
    
    //     socket.onmessage = function(event) {
    //         const data = JSON.parse(event.data);
    //         console.log('Message from server:', data.message);
    //     };
    
    //     socket.onclose = function(event) {
    //         console.log('WebSocket connection closed');
    //     };
    
    //     document.addEventListener('keydown', function(event) {
    //         if (event.code === 'Space') {
    //             const message = { message: 'Spacebar pressed' };
    //             socket.send(JSON.stringify(message));
    //             console.log('Message sent to server:', message);
    //         }
    //     });
    // });
}