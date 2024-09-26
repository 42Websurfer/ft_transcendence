import { handleLogoutSubmit } from './utils.js';

let wsBool;
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
            wsBool = false;
            handleLogoutSubmit(ws, wsBool);
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

const settingsButton = document.getElementById('settings-button');
settingsButton.addEventListener('click', () => {
    showSection('settings');
})


function addListItem(content, ul)
{
    const li = document.createElement('li');
    li.textContent = content;
    ul.appendChild(li);
}

function initOnlineStatus() {
    ws = new WebSocket(`ws://${window.location.host}/ws/online-status/`);

    ws.onopen =  function() {
        console.log("Connected to WebSocket Online Status");
    };

    ws.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            // console.log("Online Friends:", data.online_users);
            
            const friendsOnlineList = document.getElementById('friendsOnlineList');
            const friendsOfflineList = document.getElementById('friendsOfflineList');
            const friendsPendingList = document.getElementById('friendsPendingList');
            const friendsRequestsList = document.getElementById('friendsRequestsList'); 
            const friendsBlockedList = document.getElementById('friendsBlockedList'); 
                
            if (!friendsOnlineList || !friendsOfflineList || !friendsPendingList || !friendsRequestsList || !friendsBlockedList)
                return;

            friendsOnlineList.innerHTML = "";
            friendsOfflineList.innerHTML = "";
            friendsPendingList.innerHTML = "";
            friendsRequestsList.innerHTML = "";
            friendsBlockedList.innerHTML = "";

            console.log("data: ", data.friendList);
            
            const freundesliste = data.friendList;
            
            console.log("freundesliste len: ", freundesliste.length);
            console.log("freundesliste: ", freundesliste);
            
            console.log("freund[0]: ", freundesliste[0]);
            console.log("freund[0].status: ", freundesliste[0].status);
            console.log("freund[0].username: ", freundesliste[0].username);


            for (let i = 0; i < freundesliste.length; i++)
            {
                console.log("friend: ", freundesliste[i].username);

                if (freundesliste[i].status === 'online')
                    addListItem(freundesliste[i].username, friendsOnlineList);
                else if (freundesliste[i].status === 'offline')
                    addListItem(freundesliste[i].username, friendsOfflineList);
                else if (freundesliste[i].status === 'pending' && freundesliste[i].type === 'sender')
                    addListItem(freundesliste[i].username, friendsPendingList);
                else if (freundesliste[i].status === 'pending' && freundesliste[i].type === 'receiver')
                    addListItem(freundesliste[i].username, friendsRequestsList);
                else
                    addListItem(freundesliste[i].username, friendsBlockedList);
            }
        }
        catch (error){
            console.error("Error Parsing online status");
        }
    };

    ws.onclose = function() {
        console.log("WebSocket Online Status connection closed");
    };
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
        else if (section === 'settings')
            import('./settings.js').then(module => {
                module.renderSettings();
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
