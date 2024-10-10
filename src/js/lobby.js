import { getCookie} from './utils.js';

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
        <hr>
        <button id="showMatches">Show Matches</button>
        <div id="listMatches"></div>
        </div>
        <button
    `;


    const showMatches = document.getElementById('showMatches');
    const listMatches = document.getElementById('listMatches');
    
    function displayMatches(response) {
        const tournament_id = response.tournament_id;
        listMatches.innerHTML = response.matches.map(match => `
            <div class="match">
                <h2>Match ID: ${match.match_id}, Round: ${match.round}</h2>
                <p>${match.home} vs ${match.away}</p>
                <label for="score_home_${match.match_id}">Home Score:</label>
                <input type="number" id="score_home_${match.match_id}" value="${match.score_home}">
                <label for="score_away_${match.match_id}">Away Score:</label>
                <input type="number" id="score_away_${match.match_id}" value="${match.score_away}">
                <button id="submit_score_${match.match_id}">Submit Score</button>
                <div id="satusMessages"> </div>
            </div>
        `).join('');

        response.matches.forEach(match => {
            document.getElementById(`submit_score_${match.match_id}`).addEventListener('click', () => {
                
                submitScore(match.match_id, tournament_id, match.round);
            });
        });
    }

    async function check_completion(tournament_id, round) {
        const response = await fetch(`/tm/check_completion/${tournament_id}/${round}/`, {
            method: 'GET',
            credentials: 'include'
        });
        return response;
    }



    function submitScore(match_id, tournament_id, round) {
        const score_home = document.getElementById(`score_home_${match_id}`).value;
        const score_away = document.getElementById(`score_away_${match_id}`).value;
    
        const csrftoken = getCookie('csrftoken');


        fetch('/tm/set_match/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({
                match_id: match_id,
                score_home: score_home,
                score_away: score_away,
                tournament_id: tournament_id
            }),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Score updated successfully:', data);
            console.log('Round = ' + round);
            check_completion(tournament_id, round).then(response => response.json())
            .then (data => {
                console.log(data.type);
            })
        })
        .catch(error => {
            console.error('Error updating score:', error);
        });
    }

    async function showTournamentMatches() {
        try {
            const response = await fetch(`/tm/start_tournament/${groupName}/`, {
                method: 'GET',
                credentials: 'include'
            });
            return await response.json();
        } catch (error) {
            return { error: 'Failed to tournament create request.' };
        }

    };

    showMatches.addEventListener('click', async() => {
        const response = await showTournamentMatches();
        displayMatches(response);
    });

    const socket = new WebSocket(`ws://${window.location.host}/ws/tm/${groupName}/`);
    runWebsocket(socket);
    closeWebsocket(socket);
}
