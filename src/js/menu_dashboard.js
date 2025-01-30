import { fetch_get } from './utils.js';

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
    {
        return;
    }

    myGoalsChart.data.datasets[0].data = dataset;
    myGoalsChart.update();
}

function displayGeneralInformation(username, games, tournament_games, tournament_wins, winstreak, date)
{
    const usernameSpan = document.getElementById('infoUsername');
    const gamesSpan = document.getElementById('infoGames');
    const tournamentsPlayedSpan = document.getElementById('infoTournamentsPlayed');
    const tournamentWinsSpan = document.getElementById('infoTournamentWins');
    const tournamentWinstreakSpan = document.getElementById('infoWinstreak');
    const registerDateSpan = document.getElementById('infoRegisterDate')

    usernameSpan.textContent = username;
    gamesSpan.textContent = games;
    tournamentsPlayedSpan.textContent = tournament_games;
    tournamentWinsSpan.textContent = tournament_wins;
    tournamentWinstreakSpan.textContent = winstreak;
    registerDateSpan.textContent = date;

    if (!winstreak)
        tournamentWinstreakSpan.textContent = 0;
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

function displayForm(form)
{
    const formDiv = document.getElementById('formContainer');
    if (formDiv)
        formDiv.innerHTML = '';

    for (let index = form.length - 7 > 0 ? form.length - 7 : 0; index < form.length; index++)
        addFormItem(formDiv, form[index]);
    for (let i = form.length; i < 7; i++) {
        addFormItem(formDiv, 'next');
    }
}

function addMatchItem(list, player_home, player_away, score, date, result) {

    if (!list)
        return;

    const li = document.createElement('li');

    li.style = `
        border: 1px solid rgba(0, 0, 0, 0.4);;
        border-radius: 0.4em;
        margin-bottom: 0.6em;
    `;  

    if (result === "win")
        li.style.background = 'linear-gradient(to bottom, rgba(7, 136, 7, 0.5), rgba(7, 136, 7, 0.5) 100%)'; //grün
    else
        li.style.background = 'linear-gradient(to bottom, rgba(242, 7, 7, 0.5), rgba(242, 7, 7, 0.5) 100%)'; //rot

    li.innerHTML = `
    <div class="dashboard-match">
        <div class="dashboard-match-item" style="width: 31%;">${player_home}</div>
        <div class="dashboard-match-item" style="font-size: 0.7em; width: 8%;">${score}</div>
        <div class="dashboard-match-item" style="width: 31%;">${player_away}</div>
        <div class="dashboard-match-item" style="width: 30%;">${date}</div>
    </div>
    `;

    list.appendChild(li);
}

function displayMatches(matches, username)
{
    const list = document.getElementById('playedMatches');
    if (list)
        list.innerHTML = '';

	matches.sort((lhs, rhs) => lhs.date < rhs.date);
    for (let index = 0; index < matches.length; index++)
    {
        const m = matches[index];

        // es gibt auch noch m.modus!!!
        let result = "loss";
        if (m.winner === username)
            result = "win";
        addMatchItem(list, m.player_home, m.player_away, m.score_home + ":" + m.score_away, m.date, result);
    }
}

function addTableRowItem(list, rank, player, games, wins, losses, goals, diff, points) {

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

    list.appendChild(row);
}

function displayTournament(tournament)
{
    const tournamentStandingsTable = document.getElementById("tournamentStandingsTable");
    if (!tournamentStandingsTable) 
        return;
    
    const tableBody = document.getElementById('tournamentStandingsTableBody');
    if (!tableBody)
        return;
    
    tableBody.innerHTML = "";

    if (!tournament)
    {
        addTableRowItem(tableBody, 0, "no data yet...", 0, 0, 0, "0:0", 0, 0);
        return;
    }

    for (let index = 0; index < tournament.length; index++)
    {
        const t = tournament[index];
        addTableRowItem(tableBody, t.rank, t.player, t.games, t.wins, t.losses, t.goals_for + ":" + t.goals_against, t.diff, t.points);
    }
}

function displayHighlights(highest_win, biggest_loss, username)
{
    const highestWinSpan = document.getElementById('highestWin');
    const biggestLossSpan = document.getElementById('biggestLoss');

    if (!highest_win)
        highestWinSpan.textContent = "no data yet...";
    else
    {
        if (username === highest_win.player_home)
            highestWinSpan.textContent = highest_win.score_home + ":" + highest_win.score_away + " vs " + highest_win.player_away;
        else
            highestWinSpan.textContent = highest_win.score_away + ":" + highest_win.score_home + " vs " + highest_win.player_home;
    }

        
    if (!biggest_loss)
        biggestLossSpan.textContent = "no data yet...";
    else
    {
        if (username === biggest_loss.player_home)
            biggestLossSpan.textContent = biggest_loss.score_home + ":" + biggest_loss.score_away + " vs " + biggest_loss.player_away;
        else
            biggestLossSpan.textContent = biggest_loss.score_away + ":" + biggest_loss.score_home + " vs " + biggest_loss.player_home;
    }
}

function displayAvatar(avatar_url) {
    if (avatar_url) {
        const avatarContainer = document.getElementById('avatarItem');
        const avatarImg = document.createElement('img');
        avatarImg.src = '/img' + avatar_url;
        avatarImg.alt = 'User Avatar';
        avatarImg.className = 'user-avatar'; // Add any necessary classes
        avatarContainer.appendChild(avatarImg);
    }
}

function displayDashboardData(data)
{
    displayGamesChart([data.losses, data.wins]);
    displayGoalsChart([data.goals_against, data.goals_for]);
    displayGeneralInformation(data.username, data.wins + data.losses, data.tournaments_played, data.tournament_wins, data.winstreak, data.registered);
    displayForm(data.form);
    displayMatches(data.matches, data.username);
    displayTournament(data.last_tournament);
    displayHighlights(data.highest_win, data.biggest_loss, data.username);
    displayAvatar(data.avatar_url);
}


export async function renderMenuDashboard(username) {

    //render waiting section
    const response = await fetch_get('/tm/get_dashboard/' + (username ? `${username}/` : ''));

    if (response.type === "error")
    {
        console.log("error: ", response.message);
        return;
    }

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
                <div class="grid-item item3">
                <p class="graph-title" style="margin-bottom: 0.8em;">Matches</p>
                <ul id="playedMatches" class="dashboard-matches-list"></ul>
                </div>
                <div id="avatarItem" class="grid-item item4">
                <p class="graph-title">Avatar</p></div>
                
                <div id="" class="grid-item item5">
                    <p class="graph-title" style="margin-bottom: 0.8em;">Highlights</p>
                    <div class="dashboard-highlight-container">
                        <div class="dashboard-highlight-item">
                            <div>
                                <span style="color: #b7b6bb;">Highest win:</span>
                                <span id="highestWin"></span>
                            </div>
                        </div>
                        <div class="dashboard-highlight-item">
                            <div>
                                <span style="color: #b7b6bb;">Biggest loss:</span>
                                <span id="biggestLoss"></span>
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
                                <span style="color: #b7b6bb;">Tournaments played:</span>
                                <span id="infoTournamentsPlayed"></span>
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
                                <span style="color: #b7b6bb;">Longest winstreak:</span>
                                <span id="infoWinstreak"></span>
                            </div>
                        </div>
                        <div class="dashboard-information-item">
                            <div>
                                <span style="color: #b7b6bb;">Registered:</span>
                                <span id="infoRegisterDate"></span>
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

    displayDashboardData(response);
}
