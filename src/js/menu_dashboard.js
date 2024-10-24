import { getCookie, displayMessages, fetch_get } from './utils.js';
import { selectedListItem, setSelectedListItem, handleFriendRequest, showSection, addListItem } from './index.js';
import { CollisionSystem, ctx } from './GameSystem.js';

let myGamesChart;
let myGoalsChart;

function displayGamesChart(dataset)
{
    if (!myGamesChart)
        return;

    myGamesChart.data.datasets[0].data = dataset;
    myGamesChart.update();
}

function displayGoalsChart(dataset)
{
    if (!myGoalsChart)
        return;

    myGoalsChart.data.datasets[0].data = dataset;
    myGoalsChart.update();
}

function displayGeneralInformation(username, games, tournament_wins)
{
    const usernameSpan = document.getElementById('infoUsername');
    const gamesSpan = document.getElementById('infoGames');
    const tournamentWinsSpan = document.getElementById('infoTournamentWins');

    usernameSpan.textContent = username;
    gamesSpan.textContent = games;
    tournamentWinsSpan.textContent = tournament_wins;
}

function displayForm(form)
{
    const formDiv = document.getElementById('formContainer');
    if (formDiv)
        formDiv.innerHTML = '';

    for (let index = 0; index < form.length && index < 6; index++)
        addFormItem(formDiv, form[index]);

    addFormItem(formDiv, 'next');
}

function displayMatches(matches)
{
    const list = document.getElementById('playedMatches');
    if (list)
        list.innerHTML = '';

    for (let index = 0; index < matches.length; index++)
    {
        const m = matches[index];
        addMatchItem(list, m.player_home, m.player_away, m.score_home + ":" + m.score_away, m.date, m.result);
    }

    // addMatchItem(playedMatches, "fwechslefwechsle", "fwechslefwechsle", "6:0", "2024-10-18 12:15", "win");
    // addMatchItem(playedMatches, "fwechslefwechsle", "fwechslefwechsle", "6:0", "2024-10-18 12:15", "loss");
    // addMatchItem(playedMatches, "fheid", "fwechsle", "6:0", "2024-10-18 12:15", "win");
    // addMatchItem(playedMatches, "fwechslefwechsle", "fwechslefwechsle", "6:0", "2024-10-18 12:15", "win");
    // addMatchItem(playedMatches, "fwechslefwechsle", "fwechslefwechsle", "6:0", "2024-10-18 12:15", "loss");
    // addMatchItem(playedMatches, "fwechslefwechsle", "fwechslefwechsle", "6:0", "2024-10-18 12:15", "win");
    // addMatchItem(playedMatches, "fwechslefwechsle", "fwechslefwechsle", "6:0", "2024-10-18 12:15", "");
}

function displayDashboardData(data)
{
    displayGamesChart([data.wins, data.losses]);
    displayGoalsChart([data.goals_for, data.goals_against]);
    displayGeneralInformation(data.username, data.wins + data.losses, data.tournament_wins);
    displayForm(data.form);
    displayMatches(data.matches);

    data.wins;
    data.losses;
    data.goals_for;
    data.goals_against;
    data.username;
    data.tournament_wins;
    data.last_tournament; // liste dahinter
    data.matches; // liste dahinter
    data.form; // string dahinter

    {
        const tournamentStandingsTable = document.getElementById("tournamentStandingsTable");
        if (!tournamentStandingsTable) 
            return;
        
        const tableBody = document.getElementById('tournamentStandingsTableBody');
        if (!tableBody)
            return;

        tableBody.innerHTML = '';

        const results = data.results;
        for (let index = 0; index < results.length; index++) {

            if (data.user_id === user.user_id && user.role != 'admin')
            {
                const startButton = document.getElementById('tournamentStartButton');
                if (startButton)
                    startButton.remove();
            }
            else if (data.user_id == user.user_id && user.role == 'admin')
                admin = true;
            
            let rank = user.rank;
            let player = user.player;
            let games = user.games;
            let wins = user.won;
            let losses = user.lost;
            let goals = user.goals + ":" + user.goals_against;
            let diff = user.diff;
            let points = user.points;
            
            addRowToStandingsTable(rank, player, games, wins, losses, goals, diff, points);
        }
    }
}

function addRowToStandingsTable(rank, player, games, wins, losses, goals, diff, points) {

    const tableBody = document.getElementById('tournamentStandingsTableBody');

    if (!tableBody)
        return;

    const row = document.createElement('tr');

    row.innerHTML = `
        <td>${rank}</td>
        <td>${player}</td>
        <td>${games}</td>
        <td>${wins}</td>
        <td>${losses}</td>
        <td>${goals}</td>
        <td>${diff}</td>
        <td>${points}</td>
    `;

    tableBody.appendChild(row);
}

function addFormItem(formDiv, result) {

    if (!formDiv)
        return;

    const item = document.createElement('div');

    item.classList.add('dashboard-form-item');

    if (result === 'W')
    {
        item.style.background = 'linear-gradient(to bottom, rgba(7, 136, 7, 0.5), rgba(7, 136, 7, 0.5) 100%)';
        item.innerHTML = "<span>W</span>";
    }
    else if (result === 'L')
    {
        item.style.background = 'linear-gradient(to bottom, rgba(242, 7, 7, 0.5), rgba(242, 7, 7, 0.5) 100%)';
        item.innerHTML = "<span>L</span>";
    }
    else
    {
        item.style.background = 'linear-gradient(to bottom, rgba(112, 111, 122, 0.5), rgba(112, 111, 122, 0.5) 100%)';
        item.innerHTML = "<span>?</span>";
    }

    formDiv.appendChild(item);
}

function addMatchItem(tournamentMatchesList, player_home, player_away, score, date, result) {

    if (!tournamentMatchesList)
        return;

    const li = document.createElement('li');

    li.style = `
        border: 1px solid rgba(0, 0, 0, 0.4);;
        border-radius: 0.4em;
        margin-bottom: 0.6em;
    `;  

    if (result === 'win')
        li.style.background = 'linear-gradient(to bottom, rgba(7, 136, 7, 0.5), rgba(7, 136, 7, 0.5) 100%)';
    else if (result === 'loss')
        li.style.background = 'linear-gradient(to bottom, rgba(242, 7, 7, 0.5), rgba(242, 7, 7, 0.5) 100%)';
    else // undefined
        li.style.background = 'linear-gradient(to bottom, rgba(112, 111, 122, 0.5), rgba(112, 111, 122, 0.5) 100%)';

    li.innerHTML = `
    <div class="dashboard-match">
        <div class="dashboard-match-item" style="width: 31%;">${player_home}</div>
        <div class="dashboard-match-item" style="font-size: 0.7em; width: 8%;">${score}</div>
        <div class="dashboard-match-item" style="width: 31%;">${player_away}</div>
        <div class="dashboard-match-item" style="width: 30%;">${date}</div>
    </div>
    `;

    tournamentMatchesList.appendChild(li);
}

export async function renderMenuDashboard() {

    //render waiting section

    const response = fetch_get("/get_dashboard");

    if (response.type === "error")
    {
        console.log("error: ", response.message);
        return;
    }

    // displayDashboardDate function callen

    console.log("response: ", response);

    const app = document.getElementById('app');

    app.innerHTML = `
    <div class="menu">
        <div class="dashboard-container">

            <div class="dashboard-container-header">
                <p>Dashboard</p>
            </div>
            
            <hr class="dashboard-container-divider">

            <div class="dashboard-grid-container">

                <div id="gamesChart" class="grid-item item1"><p class="graph-title">Games</p></div>
                <div id="goalsChart" class="grid-item item2"><p class="graph-title">Goals</p></div>
                <div id="chartPlaytime" class="grid-item item3"><p class="graph-title">Playtime [minutes]</p></div>
                <div class="grid-item item4">
                    <p class="graph-title" style="margin-bottom: 0.8em;">Matches</p>
                    <ul id="playedMatches" class="dashboard-matches-list"></ul>
                </div>
                <div id="" class="grid-item item5">
                    <p class="graph-title" style="margin-bottom: 0.8em;">Highlights</p>
                    <div class="dashboard-highlight-container">
                        <div class="dashboard-highlight-item">
                            <div>
                                <span style="color: #b7b6bb;">Highest win:</span>
                                <span id="highestWin">7:0 vs fwechslefwechsle</span>
                            </div>
                        </div>
                        <div class="dashboard-highlight-item">
                            <div>
                                <span style="color: #b7b6bb;">Biggest loss:</span>
                                <span id="biggestLoss">6:7 vs nsassenb</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="grid-item item6" style="justify-content: flex-start;">
                    <p class="graph-title" style="margin-bottom: 0.8em;">Last tournament</p>
                    <table id="tournamentStandingsTable" class="tournament-standings-table" style="font-size: 0.6em;">
                        <colgroup>
                            <col style="width: 6%;">
                            <col style="width: 29%;">
                            <col style="width: 10%;">
                            <col style="width: 10%;">
                            <col style="width: 10%;">
                            <col style="width: 15%;">
                            <col style="width: 10%;">
                            <col style="width: 10%;">
                        </colgroup>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>PLAYER</th>
                                <th>PLAYED</th>
                                <th>WON</th>
                                <th>LOST</th>
                                <th>GOALS</th>
                                <th>DIFF</th>
                                <th>POINTS</th>
                            </tr>
                        </thead>
                        <tbody id="tournamentStandingsTableBody" class="tournament-table-body"></tbody>
                    </table>
                    <button id="test123">UPDATE</button>
                </div>
                <div id="" class="grid-item item7">
                    <p class="graph-title" style="margin-bottom: 0.8em;">General information</p>
                    <div class="dashboard-information-container">
                        <div class="dashboard-information-item">
                            <div>
                                <span style="color: #b7b6bb;">Username:</span>
                                <span id="infoUsername"></span>
                            </div>
                        </div>
                        <div class="dashboard-information-item">
                            <div>
                                <span style="color: #b7b6bb;">Games played:</span>
                                <span id="infoGames"></span>
                            </div>
                        </div>
                        <div class="dashboard-information-item">
                            <div>
                                <span style="color: #b7b6bb;">Tournaments won:</span>
                                <span id="infoTournamentWins"></span>
                            </div>
                        </div>
                        <div class="dashboard-information-item">
                            <div>
                                <span style="color: #b7b6bb;">Friends:</span>
                                <span id="infoFriends">4</span>
                            </div>
                        </div>
                        <div class="dashboard-information-item">
                            <div>
                                <span style="color: #b7b6bb;">Arch enemy:</span>
                                <span id="infoArchEnemy">fwechsle</span>
                            </div>
                        </div>
                        <div class="dashboard-information-item">
                            <div>
                                <span style="color: #b7b6bb;">Registered:</span>
                                <span id="infoDate">2024-10-18 12:15</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="" class="grid-item item8">
                    <p class="graph-title" style="margin-bottom: 0.8em;">Current form</p>
                    <div id ="formContainer" class="dashboard-form-container"></div>
                </div>
                </div>
            </div>
        </div>
    </div>
    `;

    const canvas1 = document.createElement('canvas'); // Create a canvas element
    canvas1.id = 'gamesChart';  // Set an id
    // canvas1.height = 400;
    document.getElementById('gamesChart').appendChild(canvas1);  // Append to the app div
    
    myGamesChart = new Chart(canvas1, {
        type: 'bar',  // Example chart type: bar, line, etc.
        data: {
            labels: ['Losses', 'Wins'],
            datasets: [{
                data: [0, 0],
                backgroundColor: [
                    'rgba(242, 7, 7, 0.5)',
                    'rgba(7, 136, 7, 0.5)'
                ],
                borderColor: [
                   'rgba(242, 7, 7, 1)',
                    'rgba(7, 156, 7, 1)'
                ],
                borderWidth: 1
            }]
        },
    options: {
        maintainAspectRatio: false, // Allow the chart to resize freely
        aspectRatio: 2, // Adjust the aspect ratio as needed
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.2)', // Strong black grid lines
                    borderColor: 'rgba(0, 0, 0, 1)' // Strong black border
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.8)',
                    font: {
                        weight: 'bold'
                    }
                }
            },
            x: {
                grid: {
                    color: 'rgba(0, 0, 0, 0)', // Strong black grid lines
                    borderColor: 'rgba(0, 0, 0, 1)' // Strong black border
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.8)',
                    font: {
                        weight: 'bold'
                    }
                }
            }
        },
        plugins: {
            legend: {
                display: false,
                labels: {
                    color: 'rgba(255, 255, 255, 0.8)', // Strong black legend labels
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                },
                onClick: null
            },
            tooltip: {
                enabled: false,
                backgroundColor: 'rgba(0, 0, 0, 1)', // Strong black tooltip background
                titleColor: 'rgba(255, 255, 255, 1)', // White tooltip title
                bodyColor: 'rgba(255, 255, 255, 1)' // White tooltip body
            }
        }
    }
    });

    const canvas2 = document.createElement('canvas'); // Create a canvas element
    canvas2.id = 'goalsChart';  // Set an id
    // canvas2.height = 400;
    document.getElementById('goalsChart').appendChild(canvas2);  // Append to the app div
    
    myGoalsChart = new Chart(canvas2, {
        type: 'bar',  // Example chart type: bar, line, etc.
        data: {
            labels: ['Against', 'For'],
            datasets: [{
                data: [0, 0],
                backgroundColor: [
                    'rgba(242, 7, 7, 0.5)',
                    'rgba(7, 136, 7, 0.5)'
                ],
                borderColor: [
                   'rgba(242, 7, 7, 1)',
                    'rgba(7, 156, 7, 1)'
                ],
                borderWidth: 1
            }]
        },
    options: {
        maintainAspectRatio: false, // Allow the chart to resize freely
        aspectRatio: 2, // Adjust the aspect ratio as needed
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.2)', // Strong black grid lines
                    borderColor: 'rgba(0, 0, 0, 1)' // Strong black border
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.8)',
                    font: {
                        weight: 'bold'
                    }
                }
            },
            x: {
                grid: {
                    color: 'rgba(0, 0, 0, 0)', // Strong black grid lines
                    borderColor: 'rgba(0, 0, 0, 1)' // Strong black border
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.8)',
                    font: {
                        weight: 'bold'
                    }
                }
            }
        },
        plugins: {
            legend: {
                display: false,
                labels: {
                    color: 'rgba(255, 255, 255, 0.8)', // Strong black legend labels
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                },
                onClick: null
            },
            tooltip: {
                enabled: false,
                backgroundColor: 'rgba(0, 0, 0, 1)', // Strong black tooltip background
                titleColor: 'rgba(255, 255, 255, 1)', // White tooltip title
                bodyColor: 'rgba(255, 255, 255, 1)' // White tooltip body
            }
        }
    }
    });

    const ctx2 = document.createElement('canvas'); // Create a canvas element
    ctx2.id = 'myChart';  // Set an id
    // ctx2.height = 100;
    document.getElementById('chartPlaytime').appendChild(ctx2);  // Append to the app div
    
    const myChart3 = new Chart(ctx2, {
        type: 'line',  // Example chart type: bar, line, etc.
        data: {
            labels: ['05/24', '06/24', '07/24', '08/24', '09/24', '10/24'],
            datasets: [{
                data: [0, 94, 155, 290, 344, 367],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(153, 102, 255, 0.5)',
                    'rgba(255, 159, 64, 0.5)'
                ],
                borderColor: 'rgba(75, 192, 192, 0.7)',
                tension: 0.3,
                borderWidth: 2.5,
                pointRadius: 2, // Remove points
                pointHoverRadius: 0, // Disable hover effect on points
                // fill: false
            }]
        },
    options: {
        maintainAspectRatio: false, // Allow the chart to resize freely
        aspectRatio: 2, // Adjust the aspect ratio as needed
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.2)', // Strong black grid lines
                    borderColor: 'rgba(0, 0, 0, 1)' // Strong black border
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.8)',
                    font: {
                        weight: 'bold'
                    }
                }
            },
            x: {
                grid: {
                    color: 'rgba(0, 0, 0, 0)', // Strong black grid lines
                    borderColor: 'rgba(0, 0, 0, 1)' // Strong black border
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.8)',
                    font: {
                        weight: 'bold'
                    }
                }
            }
        },
        plugins: {
            legend: {
                display: false,
                labels: {
                    color: 'rgba(255, 255, 255, 0.8)', // Strong black legend labels
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                },
                onClick: null
            },
            tooltip: {
                enabled: false,
                backgroundColor: 'rgba(0, 0, 0, 1)', // Strong black tooltip background
                titleColor: 'rgba(255, 255, 255, 1)', // White tooltip title
                bodyColor: 'rgba(255, 255, 255, 1)' // White tooltip body
            }
        },
        hover: {
            mode: null
        }
    }
    });

    const addButton = document.getElementById('test123');

    addButton.addEventListener('click', () => {
        displayGamesChart([31, 2]);
        displayGoalsChart([31, 2]);
        displayGeneralInformation("fheid", "42", "4");
        displayForm("WLWLWWLLW");

        const matches = [{"player_home": "fheid", "player_away": "fwechsle", "score_home": 4, "score_away": 0, "date": "2024-10-18 12:15", "result": "win"}];

        displayMatches(matches);
    });

}
