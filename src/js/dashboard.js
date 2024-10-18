import { getCookie, displayMessages } from './utils.js';
import { selectedListItem, setSelectedListItem, handleFriendRequest, showSection } from './index.js';
import { ctx } from './GameSystem.js';

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

                <div id="dashboardGraph1" class="grid-item item1"><p class="graph-title">Games</p></div>
                <div id="dashboardGraph2" class="grid-item item2"><p class="graph-title">Goals</p></div>
                <div id="" class="grid-item item3"></div>
                <div id="" class="grid-item item4"></div>
                <div id="" class="grid-item item5"></div>

            </div>
        </div>
    </div>
    `;

    const canvas1 = document.createElement('canvas'); // Create a canvas element
    canvas1.id = 'myChart';  // Set an id
    // canvas1.height = 400;
    document.getElementById('dashboardGraph1').appendChild(canvas1);  // Append to the app div
    
    const myChart1 = new Chart(canvas1, {
        type: 'bar',  // Example chart type: bar, line, etc.
        data: {
            labels: ['Losses', 'Wins'],
            datasets: [{
                label: 'Games',
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
    document.getElementById('dashboardGraph2').appendChild(canvas2);  // Append to the app div
    
    const myChart2 = new Chart(canvas2, {
        type: 'bar',  // Example chart type: bar, line, etc.
        data: {
            labels: ['Against', 'For'],
            datasets: [{
                label: 'Games',
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
    document.getElementById('dashboardGraph3').appendChild(ctx2);  // Append to the app div
    
    const myChart3 = new Chart(ctx2, {
        type: 'line',  // Example chart type: bar, line, etc.
        data: {
            labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
            datasets: [{
                label: '# of Votes',
                data: [12, 19, 3, 5, 2, 3],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(153, 102, 255, 0.5)',
                    'rgba(255, 159, 64, 0.5)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
    options: {
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.4)', // Strong black grid lines
                    borderColor: 'rgba(0, 0, 0, 1)' // Strong black border
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.8)' // Strong black tick labels
                }
            },
            x: {
                grid: {
                    color: 'rgba(0, 0, 0, 0)', // Strong black grid lines
                    borderColor: 'rgba(0, 0, 0, 1)' // Strong black border
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.8)' // Strong black tick labels
                }
            }
        },
        plugins: {
            legend: {
                labels: {
                    color: 'rgba(0, 0, 0, 1)' // Strong black legend labels
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 1)', // Strong black tooltip background
                titleColor: 'rgba(255, 255, 255, 1)', // White tooltip title
                bodyColor: 'rgba(255, 255, 255, 1)' // White tooltip body
            }
        }
    }
    });

}
