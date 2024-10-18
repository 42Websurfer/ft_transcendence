import { getCookie, displayMessages } from './utils.js';
import { selectedListItem, setSelectedListItem, handleFriendRequest, showSection } from './index.js';
import { ctx } from './GameSystem.js';

function addFormItem(formDiv, result) {

    if (!formDiv)
        return;

    const item = document.createElement('div');

    item.classList.add('dashboard-form-item');

    if (result === 'win')
    {
        item.style.background = 'linear-gradient(to bottom, rgba(7, 136, 7, 0.5), rgba(7, 136, 7, 0.5) 100%)';
        item.innerHTML = "<span>W</span>";
    }
    else if (result === 'loss')
    {
        item.style.background = 'linear-gradient(to bottom, rgba(242, 7, 7, 0.5), rgba(242, 7, 7, 0.5) 100%)';
        item.innerHTML = "<span>L</span>";
    }
    else //next
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

function displayForm(response)
{
    // const matches = response.matches;

    // MAXIMAL 7 FORM-ELEMENTE (wobei das letzte immer ? ist)!

    const formDiv = document.getElementById('formContainer');
    if (formDiv)
        formDiv.innerHTML = '';

    // Das hier als for-loop von 1-6 //

    addFormItem(formDiv, 'win');
    addFormItem(formDiv, 'loss');
    addFormItem(formDiv, 'win');
    addFormItem(formDiv, 'loss');
    addFormItem(formDiv, 'win');
    addFormItem(formDiv, 'win');
    
    // Und dann standardmäßig das hier als 7. (oder erstes wenn es noch kein spiel gibt)
    
    addFormItem(formDiv, 'next');




    // for (let index = 0; index < matches.length; index++) {
        
    //     const match = matches[index];
        
    //     let player_home = match.player_home;
    //     let player_away = match.player_away;
    //     let score = '';

    //     if (match.home == -1 || match.away == -1)
    //         score = "-:-";
    //     else
    //         score = match.score_home + ":" + match.score_away;
    //     let status = match.status;

    //     addMatchItem(playedMatches, player_home, player_away, score, status);
    // }
}

function displayMatches(response)
{
    // const matches = response.matches;

    const playedMatches = document.getElementById('playedMatches');
    if (playedMatches)
        playedMatches.innerHTML = '';

    // for (let index = 0; index < matches.length; index++) {
        
    //     const match = matches[index];
        
    //     let player_home = match.player_home;
    //     let player_away = match.player_away;
    //     let score = '';

    //     if (match.home == -1 || match.away == -1)
    //         score = "-:-";
    //     else
    //         score = match.score_home + ":" + match.score_away;
    //     let status = match.status;

    //     addMatchItem(playedMatches, player_home, player_away, score, status);
    // }
    addMatchItem(playedMatches, "fwechslefwechsle", "fwechslefwechsle", "6:0", "2024-10-18 12:15", "win");
    addMatchItem(playedMatches, "fwechslefwechsle", "fwechslefwechsle", "6:0", "2024-10-18 12:15", "loss");
    addMatchItem(playedMatches, "fheid", "fwechsle", "6:0", "2024-10-18 12:15", "win");
    addMatchItem(playedMatches, "fwechslefwechsle", "fwechslefwechsle", "6:0", "2024-10-18 12:15", "win");
    addMatchItem(playedMatches, "fwechslefwechsle", "fwechslefwechsle", "6:0", "2024-10-18 12:15", "loss");
    addMatchItem(playedMatches, "fwechslefwechsle", "fwechslefwechsle", "6:0", "2024-10-18 12:15", "win");
    addMatchItem(playedMatches, "fwechslefwechsle", "fwechslefwechsle", "6:0", "2024-10-18 12:15", "");
}

export function renderDashboard() {

    const app = document.getElementById('app');

    app.innerHTML = `
    <div class="menu">
        <div class="dashboard-container">

            <div class="dashboard-container-header">
                <p>Dashboard</p>
            </div>
            
            <hr class="dashboard-container-divider">

            <div class="dashboard-grid-container">

                <div id="chartGames" class="grid-item item1"><p class="graph-title">Games</p></div>
                <div id="chartGoals" class="grid-item item2"><p class="graph-title">Goals</p></div>
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
                                <span id="infoUsername">7:0 vs fwechslefwechsle</span>
                            </div>
                        </div>
                        <div class="dashboard-highlight-item">
                            <div>
                                <span style="color: #b7b6bb;">Biggest loss:</span>
                                <span id="infoGames">6:7 vs nsassenb</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="" class="grid-item item6"></div>
                <div id="" class="grid-item item7">
                    <p class="graph-title" style="margin-bottom: 0.8em;">General information</p>
                    <div class="dashboard-information-container">
                        <div class="dashboard-information-item">
                            <div>
                                <span style="color: #b7b6bb;">Username:</span>
                                <span id="infoUsername">fheid</span>
                            </div>
                        </div>
                        <div class="dashboard-information-item">
                            <div>
                                <span style="color: #b7b6bb;">Games played:</span>
                                <span id="infoGames">42</span>
                            </div>
                        </div>
                        <div class="dashboard-information-item">
                            <div>
                                <span style="color: #b7b6bb;">Tournaments won:</span>
                                <span id="infoTournaments">4</span>
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

    displayMatches();
    displayForm();

    const canvas1 = document.createElement('canvas'); // Create a canvas element
    canvas1.id = 'myChart';  // Set an id
    // canvas1.height = 400;
    document.getElementById('chartGames').appendChild(canvas1);  // Append to the app div
    
    const myChart1 = new Chart(canvas1, {
        type: 'bar',  // Example chart type: bar, line, etc.
        data: {
            labels: ['Losses', 'Wins'],
            datasets: [{
                data: [12, 13],
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
    canvas2.id = 'myChart';  // Set an id
    // canvas2.height = 400;
    document.getElementById('chartGoals').appendChild(canvas2);  // Append to the app div
    
    const myChart2 = new Chart(canvas2, {
        type: 'bar',  // Example chart type: bar, line, etc.
        data: {
            labels: ['Against', 'For'],
            datasets: [{
                data: [9, 42],
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
                borderColor: 'rgba(75, 192, 192, 0.5)',
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

}
