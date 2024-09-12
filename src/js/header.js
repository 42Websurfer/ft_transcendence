import { handleLogoutSubmit } from './utils.js';

export function renderHeader(section)
{
    const app = document.getElementById('navbarHeader');
    app.innerHTML = `
    <nav class="navbar navbar-dark bg-dark fixed-top">
    <div class="container-fluid">
      <a class="navbar-brand" href="#">
        <img width="30" height="40" src="./img/Logo.jpg" alt="">
        Websurfer
      </a>
      <button class="navbar-toggler" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasDarkNavbar" aria-controls="offcanvasDarkNavbar" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="offcanvas offcanvas-end text-bg-dark" tabindex="-1" id="offcanvasDarkNavbar" aria-labelledby="offcanvasDarkNavbarLabel">
        <div class="offcanvas-header">
          <h5 class="offcanvas-title" id="offcanvasDarkNavbarLabel">Overwiew</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div class="offcanvas-body">
          <ul class="navbar-nav justify-content-end flex-grow-1 pe-3">
            <li class="nav-item">
              <a class="nav-link active" aria-current="page" href="#">Home</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#">Dashboard</a>
            </li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Games
              </a>
              <ul class="dropdown-menu dropdown-menu-dark">
                <li><a class="dropdown-item" onclick="showSection('pong')">Pong</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="#">Simon Challenge</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="#">Tetris</a></li>
              </ul>
            </li>
          </ul>
          <div id="navbarButton"></div>
        </div>
      </div>
    </div>
  </nav>
    `;
    renderNavbarButtons(section);
}

function renderNavbarButtons(section)
{
    const buttons = document.getElementById('navbarButton');
    if (section === 'login' || section === 'register')
    {
        buttons.innerHTML = `
        <div class="row justify-content-around">
            <div class="col-5">
                 <button id="signInButton" type="button" class="btn btn-primary">Sign In</button>
            </div>  
            <div class="col-5">
                <button id="signUpButton" type="button" class="btn btn-secondary">Sign Up</button>
            </div>  
        </div>
        `;
    }
    else
    {
            buttons.innerHTML = `
            <div class="row justify-content-around">
                <div class="col-5">
                    <button id="logoutButton" type="button" class="btn btn-danger">Logout</button>
                </div>  
                <div class="col-5">
                    <button id="settingsButton" type="button" class="btn btn-secondary">Settings</button>
                </div>  
            </div>
            `;
    }

    const signInButton = document.getElementById('signInButton')
    if (signInButton)
        signInButton.addEventListener('click', () => {
            showSection('login');
    });
    const signUpButton = document.getElementById('signUpButton')
    if (signUpButton)    
        signUpButton.addEventListener('click', () => {
                showSection('register');
    });
    const logoutButton = document.getElementById('logoutButton')
    if (logoutButton)
        logoutButton.addEventListener('click', () => {
            handleLogoutSubmit();
    });
    const settingsButton = document.getElementById('settingsButton')
    if (settingsButton)
        settingsButton.addEventListener('click', () => {
            showSection('websocket');
    });
}