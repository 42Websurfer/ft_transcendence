import { getCookie, displayMessages } from './utils.js';
import { selectedListItem, setSelectedListItem, handleFriendRequest, showSection } from './index.js';

export function renderDashboard() {

    const app = document.getElementById('app');

    app.innerHTML = `
    <div class="menu">
        <button id="userIdInput" class="signin-button btn btn-primary py-2">Get score</button>
        <div id="userScore" style="background-color: grey; margin-left: 1em;"></div>
    </div>
    <div class="menu">
        <input type="text" style=" width: 25em;" id="userScoreInput" placeholder="Enter userScore to update score...">
        <div id="updateScore" style="background-color: grey; margin-left: 1em;"></div>
    </div>
    <div class="menu">
        <button id="deleteScoreInput" class="signin-button btn btn-primary py-2">Delete score</button>
        <div id="deleteScore" style="background-color: grey; margin-left: 1em;"></div>
    </div>
    `;


    const userIdInput = document.getElementById('userIdInput');
    const userScore = document.getElementById('userScore');

    userIdInput.addEventListener('click', async () => {
        try {
            const response = await fetch(`/tm/bc_get_score/`, {
                method: 'GET',
                credentials: 'include'
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
    
                const csrftoken = getCookie('csrftoken');
        
                const response = await fetch('/tm/bc_update_score/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken
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
            const response = await fetch(`/tm/bc_delete_score/`, {
                method: 'GET',
                credentials: 'include'
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
