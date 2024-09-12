function addListItem(user, content, ul)
{
    const li = document.createElement('li');
    li.textContent = user + ': ' + content;
    ul.appendChild(li);
    scrollToBottom();

}

function scrollToBottom() {
    const chatRoom = document.getElementById('chatRoom');
    requestAnimationFrame(() => {
        chatRoom.scrollTop = chatRoom.scrollHeight;
        console.log('Height = ' + chatRoom.scrollHeight);
    });
}

function isWhitespaceOrEmpty(str) {
    const buffer = str
    return !buffer.trim().length;
}

export function runWebsocket(socket, user, app) {

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
        else if (data.type == 'chat_message')
        {
            var ulElement = document.getElementById('testId');
            addListItem(data.user, data.message, ulElement);
        }
        

        const height = document.getElementById('chatRoom');
        console.log('HEIGHT AFTER DOING EVERYTHING: ' + height.scrollHeight);
    };
    
    socket.onclose = function(event) {
        
        console.log('WebSocket connection closed');
    };
/*     document.addEventListener('keydown', function(event) {
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
    }); */

    const inputField = document.getElementById('enterMessage');
    inputField.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !isWhitespaceOrEmpty(inputField.value)) {
            const message = {
                type: 'chat_message',
                user: user,
                message: inputField.value
            };
            socket.send(JSON.stringify(message));
            inputField.value = ''; // Clear the input field after sending the message
        }
    });
}

export function renderWebsocket() {
    
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class=container>
        <h1>Press Space to Send a Message</h1>
            <div id=chatRoom class="chat-room">
                <ul id=testId ></ul>
                <div class="input-container">
                    <input id="enterMessage" type="text" placeholder="Please enter your message"></input>
                </div>
            </div>
        </div>
    `;
    const groupName = prompt("Please enter the group name:");
    
    if (!groupName)
    {
        alert("You have to enter a group Name!");
        renderWebsocket();
    }
    const user = prompt("Which user are you?");
    if (!user)
    {
        alert("You have to enter a User!");
        renderWebsocket();
    }
    const socket = new WebSocket(`ws://10.13.9.1:8090/ws/pong/${groupName}/`);
    runWebsocket(socket, user, app);
}