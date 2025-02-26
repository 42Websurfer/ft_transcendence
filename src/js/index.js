import { handleLogoutSubmit, displayToast, AvatarLoader } from './utils.js';
import { renderWaiting } from './waiting.js';
import { renderAuth2FALogin } from './auth_2fa_login.js';
import { renderAuth2FARegister } from './auth_2fa_register.js';

let onlineWebSocket = undefined;

async function checkAuthentication() {
    const token = localStorage.getItem('access_token'); 
    try {
        const response = await fetch('/api/user/checkauth/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });
        if (response.status === 401)
        {
            return false;
        }
        else if (response.status === 200)
        {
            const result = await response.json();
            return result.authenticated;
        }

    }
    catch(error) {
        console.error(error);
        return false;
    }

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
			AvatarLoader.deleteLocal();
            handleLogoutSubmit(onlineWebSocket);
        });
    }
    else
    {
        if (section === 'auth_register')
        {
            app.innerHTML = `
            <div class="col-5">
            <button id="loginButton" type="button" class="btn btn-primary login-logout-button">Login</button>
            </div>
            `;
            const loginButton = document.getElementById('loginButton')
            loginButton.addEventListener('click', () => {
                showSection('auth_login');
            });
        }
        else //(section === 'auth_login')
        {
            app.innerHTML = `
            <div class="col-5">
            <button id="registerButton" type="button" class="btn btn-primary login-logout-button">Sign up</button>
            </div>
            `;
            const registerButton = document.getElementById('registerButton')
            registerButton.addEventListener('click', () => {
                showSection('auth_register');
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
        const token = localStorage.getItem('access_token'); 

        const response = await fetch(`/api/user/${url}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },        
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
	const showProfile = document.getElementById('showUserProfile');
    
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
            acceptFriendButton.style.display = 'none';
            denyFriendButton.style.display = 'none';
            withdrawFriendButton.style.display = 'none';
            unblockFriendButton.style.display = 'none';
            friendsModifyModalUsername.textContent = "\"" + content + "\"";
			showProfile.style.display = 'block';
			showProfile.onclick = () => {
				showSection('menu_dashboard', content);
			};
            selectedListItem = li;
        });

        closeModalButton.addEventListener('click', () => {
            friendsModifyModal.style.display = 'none';
        });
    
        window.addEventListener('click', (event) => {
            if (event.target === friendsModifyModal) {
                friendsModifyModal.style.display = 'none';
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
            removeFriendButton.style.display = 'none';
            withdrawFriendButton.style.display = 'none';
            unblockFriendButton.style.display = 'none';
            friendsModifyModalUsername.textContent = "\"" + content + "\"";
			showProfile.style.display = 'block';
			showProfile.onclick = () => {
				showSection('menu_dashboard', content);
			};
            selectedListItem = li;
        });

        closeModalButton.addEventListener('click', () => {
            friendsModifyModal.style.display = 'none';
        });
    
        window.addEventListener('click', (event) => {
            if (event.target === friendsModifyModal) {
                friendsModifyModal.style.display = 'none';
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
            blockFriendButton.style.display = 'block';
            withdrawFriendButton.style.display = 'block';
            removeFriendButton.style.display = 'none';
            acceptFriendButton.style.display = 'none';
            denyFriendButton.style.display = 'none';
            unblockFriendButton.style.display = 'none';
            friendsModifyModalUsername.textContent = "\"" + content + "\"";
			showProfile.style.display = 'block';
			showProfile.onclick = () => {
				showSection('menu_dashboard', content);
			};
            selectedListItem = li;
        });

        closeModalButton.addEventListener('click', () => {
            friendsModifyModal.style.display = 'none';
        });
    
        window.addEventListener('click', (event) => {
            if (event.target === friendsModifyModal) {
                friendsModifyModal.style.display = 'none';
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
            removeFriendButton.style.display = 'none';
            blockFriendButton.style.display = 'none';
            acceptFriendButton.style.display = 'none';
            denyFriendButton.style.display = 'none';
            withdrawFriendButton.style.display = 'none';
            friendsModifyModalUsername.textContent = "\"" + content + "\"";
			showProfile.style.display = 'block';
			showProfile.onclick = () => {
				showSection('menu_dashboard', content);
			};
            selectedListItem = li;
        });

        closeModalButton.addEventListener('click', () => {
            friendsModifyModal.style.display = 'none';
        });
    
        window.addEventListener('click', (event) => {
            if (event.target === friendsModifyModal) {
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
    const token = localStorage.getItem('access_token');
    onlineWebSocket = new WebSocket(`wss://${window.location.host}/ws/user/online-status/?token=${token}`);

    onlineWebSocket.onopen =  function() {};

    onlineWebSocket.onmessage = function(event) {
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
                else if (freundesliste[i].status === 'PENDING' && freundesliste[i].type === 'sender')
                    addListItem(freundesliste[i].username, friendsPendingList, 'pending');
                else if (freundesliste[i].status === 'PENDING' && freundesliste[i].type === 'receiver')
                    addListItem(freundesliste[i].username, friendsRequestsList, 'request');
                else
                    addListItem(freundesliste[i].username, friendsBlockedList, 'blocked');
            }
            const alertRequests = document.querySelector('#friendsOptionsAlert');
            if (friendsRequestsList.children.length > 0) {
                alertRequests.style.display = 'block';
            } else {
                alertRequests.style.display = 'none';
            }
        }
        catch (error){
            console.error("Error Parsing online status", error);
        }
    };

    onlineWebSocket.onclose = function() {};
}

export async function showSection(section, lobbyId, pushState = true)
{
	
	const settingsButton = document.getElementById('settings-button')
    const isAuthenticated = await checkAuthentication();
    renderLoginLogoutButton(isAuthenticated, section);
    if (section === 'auth_register')
        import('./auth_register.js').then(module => {
            module.renderAuthRegister(pushState);
        });
    else if (section === 'auth_login')
        import('./auth_login.js').then(module => {
            module.renderAuthLogin();    
        });
	if (settingsButton)
		settingsButton.style.display = 'none';

    if (isAuthenticated) {
        if (settingsButton)
        {
            if (section == 'menu')
                settingsButton.style.display = 'block';
            else 
                settingsButton.style.display = 'none';
        }

		AvatarLoader.loadData();

        if (!onlineWebSocket || onlineWebSocket?.readyState == WebSocket.CLOSED)
            initOnlineStatus();

        if (section === 'menu') {
            import('./menu.js').then(module => {
                module.renderMenu();
            });
            if (onlineWebSocket?.readyState == WebSocket.OPEN) {
                onlineWebSocket.send(JSON.stringify({type: 'resend'}));
            }
        }
        else if (section === 'menu_local')
            import('./menu_local.js').then(module => {
                module.renderMenuLocal(lobbyId);
            });
        else if (section === 'menu_online')
            import('./menu_lobby.js').then(module => {
                module.renderMenuLobby('online');
            });
        else if (section === 'menu_tournament')
            import('./menu_lobby.js').then(module => {
                module.renderMenuLobby('tournament');
            });
        else if (section === 'menu_multiplayer')
            import('./menu_lobby.js').then(module => {
                module.renderMenuLobby('multiple');
            });
		else if (section === 'menu_multiple_lobby')
			import('./menu_multiple_lobby.js').then(module => {
				module.renderMultiplayerLobby(lobbyId);
			});
        else if (section === 'menu_dashboard')
            import('./menu_dashboard.js').then(module => {
                module.renderMenuDashboard(lobbyId);
            });
        else if (section === 'menu_online_lobby')
            import('./menu_online_lobby.js').then(module => {
                module.renderMenuOnlineLobby(lobbyId);
            });
        else if (section === 'menu_tournament_lobby')
            import('./menu_tournament_roundrobin.js').then(module => {
                module.renderMenuTournamentRoundRobin(lobbyId);
            });
        else if (section === 'settings')
            import('./settings.js').then(module => {
                module.renderSettings();
            });
        else if (section === 'pong')
            import('./pong.js').then(module => {
                module.renderPong(lobbyId);
            });
        else if (section === 'waiting')
            import('./waiting.js').then(module => {
                module.renderWaiting();
            });
		else {
			section = 'menu'; 
			import('./menu.js').then(module => {
				module.renderMenu();
			});
		}
    }
    else if (section != 'auth_login' && section != 'auth_register' && section != 'auth_42') {
        AvatarLoader.deleteLocal();
        import('./auth_login.js').then(module => {
            module.renderAuthLogin();    
        });
        section = 'auth_login';
    }
    const currentState = history.state
    if (pushState && section != 'waiting' && (!currentState || currentState.section != section))
        history.pushState({ section, lobbyId }, '', `/${section}${lobbyId ? `?lobbyId=${lobbyId}` : ''}`);

}

async function initApp() {
    const isAuthenticated = await checkAuthentication();
    if (isAuthenticated) {
		const section = window.location.pathname.substring(1);
		const urlParams = new URLSearchParams(window.location.search);
		const id = urlParams.get('lobbyId');
		if (section) {
			showSection(section, id);
		} else {
			showSection('menu');
		}
    } else {
        showSection('auth_login');
    }
}

window.addEventListener('popstate', (event) => {
    if (event.state && event.state.section) {
        showSection(event.state.section, event.state.lobbyId, false);
    }
});

async function sendCodeToBackend(code) {
    try {        
        const response = await fetch(`/api/user/callback/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
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
	  return (authCode);
	} else {
		return (null);
	}
}


window.onload = async function() {
    renderWaiting();
    let code = "";
    if (code = getAuthorizationCode())
    {
        const response = await sendCodeToBackend(code);
        window.history.replaceState({}, document.title, window.location.pathname);
        if (response.type === 'pending')
        {
            displayToast('You need to setup 2FA.', 'warning');
            renderAuth2FARegister(response)
        }
        else if (response.type === 'success')
        {
			if ('tokens' in response) {
				localStorage.setItem('access_token', response.tokens.access);
				localStorage.setItem('refresh_token', response.tokens.refresh);
				showSection('menu');
			} else {
				renderAuth2FALogin(response.user);
			}
        }
        else if (response.type === 'error')
        {
            displayToast(response.message, 'error')
            showSection('login');
        }
    }
    else
    {
        initApp();
    }
}
