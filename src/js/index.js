import { handleLogoutSubmit, getCookie } from './utils.js';
import { renderUsername42 } from './username42.js';
import { renderWaiting } from './waiting.js';

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
});

const homeButton = document.getElementById('webpong-button');
homeButton.addEventListener('click', () => {
    showSection('menu');
});

export async function handleFriendRequest(url) {
    try {
        const response = await fetch(`${url}`, {
            method: 'GET',
            credentials: 'include'
        });
        return await response.json();
    } catch (error) {
        return { 'type': 'error', 'message': 'User does not exist!' };
    }
}

export let selectedListItem = null;

export function setSelectedListItem(item) {
    selectedListItem = item;
}

export async function addListItem(content, ul, list, role)
{
    const li = document.createElement('li');

    const friendsModifyModal = document.getElementById('friendsModifyModal');
    const closeModalButton = document.getElementById('closeFriendsModifyModalButton');
    const friendsModifyModalUsername = document.getElementById('friendsModifyModalUsername');
    const removeFriendButton = document.getElementById('removeFriendButton');
    const blockFriendButton = document.getElementById('blockFriendButton');
    const acceptFriendButton = document.getElementById('acceptFriendButton');
    const denyFriendButton = document.getElementById('denyFriendButton');
    const withdrawFriendButton = document.getElementById('withdrawFriendButton');
    const unblockFriendButton = document.getElementById('unblockFriendButton');
    
    if (!friendsModifyModal || !closeModalButton)
        return;

    friendsModifyModalUsername.textContent = "\"" + content + "\"";
    friendsModifyModalUsername.style.color = '#1792ca';

    if (list === 'offline' || list === 'online')
    {
        li.className = 'friends-add-list-user';
        li.innerHTML = `<span class="list-item-content">${content}</span>`;
        ul.appendChild(li);

        const textSpan = li.querySelector('.list-item-content');

        textSpan.addEventListener('click', () => {
            friendsModifyModal.style.display = 'block';
            removeFriendButton.style.display = 'block';
            blockFriendButton.style.display = 'block';
            friendsModifyModalUsername.textContent = "\"" + content + "\"";
            selectedListItem = li;
        });

        closeModalButton.addEventListener('click', () => {
            friendsModifyModal.style.display = 'none';
            removeFriendButton.style.display = 'none';
            blockFriendButton.style.display = 'none';
            acceptFriendButton.style.display = 'none';
            denyFriendButton.style.display = 'none';
            withdrawFriendButton.style.display = 'none';
            unblockFriendButton.style.display = 'none';
        });
    
        window.addEventListener('click', (event) => {
            if (event.target === friendsModifyModal) {
                friendsModifyModal.style.display = 'none';
                removeFriendButton.style.display = 'none';
                blockFriendButton.style.display = 'none';
                acceptFriendButton.style.display = 'none';
                denyFriendButton.style.display = 'none';
                withdrawFriendButton.style.display = 'none';
                unblockFriendButton.style.display = 'none';
            }
        });
    }
    else if (list === 'request')
    {
        li.className = 'friends-add-list-user';
        li.innerHTML = `<span class="list-item-content">${content}</span>`;
        ul.appendChild(li);

        const textSpan = li.querySelector('.list-item-content');

        textSpan.addEventListener('click', () => {
            friendsModifyModal.style.display = 'block';
            acceptFriendButton.style.display = 'block';
            denyFriendButton.style.display = 'block';
            blockFriendButton.style.display = 'block';
            friendsModifyModalUsername.textContent = "\"" + content + "\"";
            selectedListItem = li;
        });

        closeModalButton.addEventListener('click', () => {
            friendsModifyModal.style.display = 'none';
            removeFriendButton.style.display = 'none';
            blockFriendButton.style.display = 'none';
            acceptFriendButton.style.display = 'none';
            denyFriendButton.style.display = 'none';
            withdrawFriendButton.style.display = 'none';
            unblockFriendButton.style.display = 'none';
        });
    
        window.addEventListener('click', (event) => {
            if (event.target === friendsModifyModal) {
                friendsModifyModal.style.display = 'none';
                removeFriendButton.style.display = 'none';
                blockFriendButton.style.display = 'none';
                acceptFriendButton.style.display = 'none';
                denyFriendButton.style.display = 'none';
                withdrawFriendButton.style.display = 'none';
                unblockFriendButton.style.display = 'none';
            }
        });
    }
    else if (list === 'pending')
    {
        li.className = 'friends-add-list-user';
        li.innerHTML = `<span class="list-item-content">${content}</span>`;
        ul.appendChild(li);

        const textSpan = li.querySelector('.list-item-content');

        textSpan.addEventListener('click', () => {
            friendsModifyModal.style.display = 'block';
            withdrawFriendButton.style.display = 'block';
            blockFriendButton.style.display = 'block';
            friendsModifyModalUsername.textContent = "\"" + content + "\"";
            selectedListItem = li;
        });

        closeModalButton.addEventListener('click', () => {
            friendsModifyModal.style.display = 'none';
            removeFriendButton.style.display = 'none';
            blockFriendButton.style.display = 'none';
            acceptFriendButton.style.display = 'none';
            denyFriendButton.style.display = 'none';
            withdrawFriendButton.style.display = 'none';
            unblockFriendButton.style.display = 'none';
        });
    
        window.addEventListener('click', (event) => {
            if (event.target === friendsModifyModal) {
                friendsModifyModal.style.display = 'none';
                removeFriendButton.style.display = 'none';
                blockFriendButton.style.display = 'none';
                acceptFriendButton.style.display = 'none';
                denyFriendButton.style.display = 'none';
                withdrawFriendButton.style.display = 'none';
                unblockFriendButton.style.display = 'none';
            }
        });
    }
    else if (list === 'blocked')
    {
        li.className = 'friends-add-list-user';
        li.innerHTML = `<span class="list-item-content">${content}</span>`;
        ul.appendChild(li);

        const textSpan = li.querySelector('.list-item-content');

        textSpan.addEventListener('click', () => {
            friendsModifyModal.style.display = 'block';
            unblockFriendButton.style.display = 'block';
            friendsModifyModalUsername.textContent = "\"" + content + "\"";
            selectedListItem = li;
        });

        closeModalButton.addEventListener('click', () => {
            friendsModifyModal.style.display = 'none';
            removeFriendButton.style.display = 'none';
            blockFriendButton.style.display = 'none';
            acceptFriendButton.style.display = 'none';
            denyFriendButton.style.display = 'none';
            withdrawFriendButton.style.display = 'none';
            unblockFriendButton.style.display = 'none';
        });
    
        window.addEventListener('click', (event) => {
            if (event.target === friendsModifyModal) {
                friendsModifyModal.style.display = 'none';
                removeFriendButton.style.display = 'none';
                blockFriendButton.style.display = 'none';
                acceptFriendButton.style.display = 'none';
                denyFriendButton.style.display = 'none';
                withdrawFriendButton.style.display = 'none';
                unblockFriendButton.style.display = 'none';
            }
        });
    }
    else
    {
        li.className = 'friends-add-list-user';
        li.innerHTML = `<span class="list-item-content">${content}</span>`;
        ul.appendChild(li);
    }
}

function initOnlineStatus() {
    ws = new WebSocket(`ws://${window.location.host}/ws/online-status/`);

    ws.onopen =  function() {
        console.log("Connected to WebSocket Online Status");
    };

    ws.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            
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
            
            const freundesliste = data.friendList;
            
            for (let i = 0; i < freundesliste.length; i++)
            {
                if (freundesliste[i].status === 'online')
                    addListItem(freundesliste[i].username, friendsOnlineList, 'online');
                else if (freundesliste[i].status === 'offline')
                    addListItem(freundesliste[i].username, friendsOfflineList, 'offline');
                else if (freundesliste[i].status === 'pending' && freundesliste[i].type === 'sender')
                    addListItem(freundesliste[i].username, friendsPendingList, 'pending');
                else if (freundesliste[i].status === 'pending' && freundesliste[i].type === 'receiver')
                    addListItem(freundesliste[i].username, friendsRequestsList, 'request');
                else
                    addListItem(freundesliste[i].username, friendsBlockedList, 'blocked');
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
    else if (section === 'username42')
        import('./username42.js').then(module => {
            module.renderUsername42();    
        });
    if (isAuthenticated) {
        if (!wsBool)
        {
            initOnlineStatus();
            wsBool = true;
        }
        if (section === 'menu')
            import('./menu.js').then(module => {
                module.renderMenu();
            });
        else if (section === 'menu_local')
            import('./menu_local.js').then(module => {
                module.renderMenuLocal(lobbyId);
            });
        else if (section === 'menu_online')
            import('./menu_online.js').then(module => {
                module.renderMenuOnline();
            });
        else if (section === 'menu_tournament')
            import('./menu_tournament.js').then(module => {
                module.renderMenuTournament();
            });
        else if (section === 'menu_multiplayer')
            import('./menu_multiplayer.js').then(module => {
                module.renderMenuMultiplayer();
            });
        else if (section === 'menu_dashboard')
            import('./menu_dashboard.js').then(module => {
                module.renderMenuDashboard();
            });
        else if (section === 'settings')
            import('./settings.js').then(module => {
                module.renderSettings();
            });
        else if (section === 'tournamentRR')
            import('./tournamentRR.js').then(module => {
                module.renderTournamentRR(lobbyId);
            });
        else if (section === 'pong')
            import('./pong.js').then(module => {
                module.renderPong();
            });
        else if (section === 'waiting')
            import('./waiting.js').then(module => {
                module.renderWaiting();
            });
    }
    else if (section != 'login' && section != 'register' && section != 'username42') {
        import('./login.js').then(module => {
            module.renderLogin();    
        });
        section = 'login';
    }
}

async function initApp() {
    const isAuthenticated = await checkAuthentication();
    if (isAuthenticated) {
        showSection('menu');
    } else {
        showSection('login');
    }
}

window.addEventListener('popstate', (event) => {
	if (event.state && event.state.section){
		showSection(event.state.section);
	}
});

async function sendCodeToBackend(code) {
    console.log("NOW WE ARE SENDING THE CODE TO THE BACKEND: CODE = ", code);
    try {
        const csrftoken = getCookie('csrftoken');
        
        const response = await fetch(`/callback/`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify({ 'code': code })
        });
        return (await response.json())
    }
    catch(error) {
        console.error("Error: ", error)
        return (false)
    }
  }

function getAuthorizationCode() {
	const urlParams = new URLSearchParams(window.location.search);
	const authCode = urlParams.get('code');

	if (authCode) {
	  console.log('Authorization Code:', authCode);
	  return (authCode);
	} else {
		console.error('Authorization code not found');
		return (null);
	}
}


window.onload = async function() {
    renderWaiting();
    let code = "";
    if (code = getAuthorizationCode())
    {
        const response = await sendCodeToBackend(code);
        if (response.type === 'registration')
        {
            renderUsername42(response);
            return;
        }
        else if (response.type === 'success')
            showSection('menu');
        else if (response.type === 'error')
            showSection(login);
        console.log('Response = ', response);
        window.history.replaceState({}, document.title, window.location.pathname);

    }
    else
    {
        console.log("NOPE NO CODE");
        initApp();
    }
}
