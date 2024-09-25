import { handleLogoutSubmit } from './utils.js';

wsBool = false;

let ws;
async function checkAuthentication() {
    const response = await fetch('/checkauth/', {
        method: 'GET',
        credentials: 'include'  // Ensure cookies are included in the request
    });
    const result = await response.json();
    if (result.authenticated) {
        localStorage.setItem('authenticated', 'true');
        localStorage.setItem('user', JSON.stringify(result.user));
    } else {
        localStorage.removeItem('authenticated');
        localStorage.removeItem('user');
    }
    return result.authenticated;
}

async function renderLoginLogoutButton(isAuthenticated, section) {

    const app = document.getElementById('LoginLogoutButton');
    if (!app)
        return;
        
    if (isAuthenticated)
    {
        app.innerHTML = `
        <div class="col-5">
        <button id="logoutButton" type="button" class="btn btn-primary login-logout-button">Logout</button>
        </div>
        `;
        const logoutButton = document.getElementById('logoutButton')
        logoutButton.addEventListener('click', () => {
            handleLogoutSubmit();
        });
    }
    else
    {
        if (section === 'register')
        {
            app.innerHTML = `
            <div class="col-5">
            <button id="loginButton" type="button" class="btn btn-primary login-logout-button">Login</button>
            </div>
            `;
            const loginButton = document.getElementById('loginButton')
            loginButton.addEventListener('click', () => {
                showSection('login');
            });
        }
        else //(section === 'login')
        {
            app.innerHTML = `
            <div class="col-5">
            <button id="registerButton" type="button" class="btn btn-primary login-logout-button">Sign up</button>
            </div>
            `;
            const registerButton = document.getElementById('registerButton')
            registerButton.addEventListener('click', () => {
                showSection('register');
            });
        }

    }
}

export async function showSection(section, lobbyId)
{
    console.log('section:' + section);
    const isAuthenticated = await checkAuthentication();
    renderLoginLogoutButton(isAuthenticated, section);
    if (section === 'register')
        import('./register.js').then(module => {
            module.renderRegister();
        });
    else if (section === 'login')
        import('./login.js').then(module => {
            module.renderLogin();    
        });
    if (isAuthenticated) {
        if (!wsBool)
        {
            initOnlineStatus();
            wsBool = true;
        }
        else 
            console.log("WARUM IST ES NICHT EINGELOGGT?!");
        if (section === 'welcome')
                import('./welcome.js').then(module => {
                    module.renderWelcome();
                });
        else if (section === 'websocket')
            import('./test.js').then(module => {
                module.renderWebsocket();
            });
        else if (section === 'pong')
            import('./pong.js').then(module => {
                module.renderPong();
            });
        else if (section === 'lobby') {
            import('./lobby.js').then(module => {
                module.renderLobby(lobbyId);
            });
        }
    }
    else if (section != 'login' && section != 'register') {
        import('./login.js').then(module => {
            module.renderLogin();    
        });
        section = 'login';
    }
    console.log('Header section: ' + section);
    import('./header.js').then(module => {
        module.renderHeader(section);
    });
}


async function initApp() {
    const isAuthenticated = await checkAuthentication();
    if (isAuthenticated) {
        showSection('welcome');
    } else {
        showSection('login');
    }
}

window.addEventListener('popstate', (event) => {
	if (event.state && event.state.section){
		showSection(event.state.section);
	}
});

window.onload = initApp;
