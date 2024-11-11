import { getCookie, displayMessages } from './utils.js';
import { selectedListItem, setSelectedListItem, handleFriendRequest, showSection } from './index.js';

export function renderMenuMultiplayer(lobbyId = null) {
    history.pushState({ section: 'menu_multiplayer', lobbyId }, '', `/menu_multiplayer${lobbyId ? `?lobbyId=${lobbyId}` : ''}`);

    const app = document.getElementById('app');

    app.innerHTML = `
    <div class="menu" style="padding: 0em;">
        <button id="userIdInput" class="signin-button btn btn-primary py-2">Get score</button>
        <div id="userScore" style="background-color: grey; margin-left: 1em;"></div>
    </div>
    <div class="menu" style="padding: 0em;">
        <input type="text" style=" width: 25em;" id="userScoreInput" placeholder="Enter userScore to update score...">
        <div id="updateScore" style="background-color: grey; margin-left: 1em;"></div>
    </div>
    <div class="menu" style="padding: 0em; margin-botom: 6em;">
        <button id="deleteScoreInput" class="signin-button btn btn-primary py-2">Delete score</button>
        <div id="deleteScore" style="background-color: grey; margin-left: 1em;"></div>
    </div>

    <form id="registerForm"">
        <div id="messages"></div>
        <input type="hidden" name="csrfmiddlewaretoken" value="${getCookie('csrftoken')}">

        <div class="login-instructions">
            <p>Welcome, please enter match data!</p>
        </div>
        

        <div class="login-form-field form-floating">
            <input type="text" name="match-lobbyid" class="form-control" placeholder="LobbyId..." required>
            <label for="floatingInput">LobbyID</label>
        </div>
        <div class="login-form-field form-floating">
            <input type="text" name="match-player1" class="form-control" placeholder="Player1..." required>
            <label for="floatingInput">Player1</label>
        </div>
        <div class="login-form-field form-floating">
            <input type="text" name="match-player2" class="form-control" placeholder="Player2..." required>
            <label for="floatingInput">Player2</label>
        </div>
        <div class="login-form-field form-floating">
            <input type="text" name="match-score-player1" class="form-control" placeholder="Score player1..." required>
            <label for="floatingInput">Score player1</label>
        </div>
        <div class="login-form-field form-floating">
            <input type="text" name="match-score-player2" class="form-control" placeholder="Score player2..." required>
            <label for="floatingInput">Score player2</label>
        </div>

        <button class="signin-button btn btn-primary w-100 py-2" type="submit">Sign up</button>
        
    </form>
    <div id="registerMessage" class="register-message"></div>
    <div id="registerLoader" class="loader"></div>
    `;

	const form = document.getElementById('registerForm');
    form.addEventListener('submit', handleFormSubmit);


    const userIdInput = document.getElementById('userIdInput');
    const userScore = document.getElementById('userScore');

    userIdInput.addEventListener('click', async () => {
        try {
            const token = localStorage.getItem('access_token'); 

            const response = await fetch(`/tm/bc_get_score/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });

            const result = await response.json()

            if (result.type === "error")
            {
                console.log("error: ", result.message);
                userScore.textContent = "error: " + result.message;
            }
            else
            {
                console.log("score: ", result.score);
                userScore.textContent = "Score: " + result.score;
            }

        } catch (error) {
            console.log("error: ", error);
        }
    });


    const userScoreInput = document.getElementById('userScoreInput');
    const updateScore = document.getElementById('updateScore');

    userScoreInput.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter') {
            const userScore = userScoreInput.value.trim();
            if (userScore) {
                console.log(`Trying to set score: ${userScore}`);

            try {
    
                const token = localStorage.getItem('access_token'); 
        
                const response = await fetch('/tm/bc_update_score/', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({'newScore': userScore})
                });
    
                const result = await response.json()
    
                if (result.type === "error")
                    {
                        console.log("error: ", result.message);
                        updateScore.textContent = "error: " + result.message;
                    }
                    else
                    {
                        console.log("transaction_hash: ", result.transaction_hash);
                        updateScore.textContent = "transaction_hash: " + result.transaction_hash;
                    }
    
                } catch (error) {
                    console.log("error: ", error);
                }
            }
        }
    });

    const deleteScoreInput = document.getElementById('deleteScoreInput');
    const deleteScore = document.getElementById('deleteScore');

    deleteScoreInput.addEventListener('click', async () => {
        try {
            const token = localStorage.getItem('access_token'); 

            const response = await fetch(`/tm/bc_delete_score/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });

            const result = await response.json()

            if (result.type === "error")
            {
                console.log("error: ", result.message);
                deleteScore.textContent = "error: " + result.message;
            }
            else
            {
                console.log("transaction_hash: ", result.transaction_hash);
                deleteScore.textContent = "transaction_hash: " + result.transaction_hash;
            }

        } catch (error) {
            console.log("error: ", error);
        }
    });

}

async function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    const lobby_id =  formData.get('match-lobbyid');

    const data = {
        lobby_id: formData.get('match-lobbyid'),
        player1: formData.get('match-player1'),
        player2: formData.get('match-player2'),
        score_player1: Number(formData.get('match-score-player1')),
		score_player2: Number(formData.get('match-score-player2'))
    };

    const registerMessage = document.getElementById('registerMessage');

    if (isNaN(data.score_player1) || isNaN(data.score_player2))
    {
		registerMessage.textContent = 'enter valid numbers as scores!!!';
		registerMessage.style.color = 'red';
		registerMessage.style.animation = 'none';
		registerMessage.offsetHeight;
		registerMessage.style.animation = 'wiggle 0.5s ease-in-out';
        return;
    }
	
    console.log("data sent: ", data);

    const token = localStorage.getItem('access_token'); 

    const response = await fetch('/tm/test_set_online_match/', {
		method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
	
    const result = await response.json();
	console.log("result: ", result);
	
	if (result.type === 'success')
	{
		registerMessage.textContent = '';

        console.log("SUPIDUPI!!!");

		// const registerLoader = document.getElementById('registerLoader');
		// registerLoader.style.display = 'block';

		// setTimeout(() => showSection('menu'), 2000);
	}
	else
	{
		registerMessage.textContent = result.message;
		registerMessage.style.color = 'red';
		registerMessage.style.animation = 'none';
		registerMessage.offsetHeight;
		registerMessage.style.animation = 'wiggle 0.5s ease-in-out';
	}
}
