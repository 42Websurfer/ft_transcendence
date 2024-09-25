import { getCookie, displayMessages } from './utils.js';

function addListItem(content, ul)
{
    const li = document.createElement('li');
    li.textContent = content;
    ul.appendChild(li);
}

const freundesliste = [
    
    {
        'username': 'fwechsle',
        'status': 'online'
    },

    {
        'username': 'nsassenb',
        'status': 'online'
    },

    {
        'username': 'fheid',
        'status': 'online'
    },

    {
        'username': 'jseidere',
        'status': 'offline'
    },

    {
        'username': 'caigner',
        'status': 'offline'
    }

];

export function renderWelcome() {

    const app = document.getElementById('app');

    app.innerHTML = `
    <div class="menu">
        <div class="menu-friends">
            <div class="menu-friends-container">
                <div class="menu-friends-header">
                    <p>FRIENDS</p>
                </div>
                <hr class="friends-divider">
                <div id="friendsOnline" class="friends-online">
                    <div class="friends-online-header">
                        <p>ONLINE</p>
                    </div>
                    <ul id="friendsOnlineList" class="friends-online-list"></ul>
                </div>
                <hr class="friends-divider">
                <div id="friendsOffline" class="friends-offline">
                    <div class="friends-offline-header">
                        <p>OFFLINE</p>
                    </div>
                    <ul id="friendsOfflineList" class="friends-offline-list"></ul>
                </div>
                <hr class="friends-divider">
                <div class="friends-options">
                    <div class="friends-options-add">
                        <p>ADD</p>
                    </div>
                    <div class="friends-options-remove">
                        <p>REMOVE</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="menu-gamemodes">
            <div class="menu-item" id="menu-item-local">
                <h1>Local</h1>
                <p>Play local - alone or with a friend<p>
            </div>  
            <div class="menu-item" id="menu-item-online">
                <h1>Online</h1>
                <p>Play online with friends<p>
            </div>
            <div class="menu-item" id="menu-item-tournament">
                <h1>Tournament</h1>
                <p>Play an exciting Tournament<p>
            </div>
            <div class="menu-item" id="menu-item-multiplayer">
                <h1>Multiplayer</h1>
                <p>Play online in multiplayer mode<p>
            </div>
            <div class="menu-item" id="menu-item-dashboard">
                <h1>Dashboard</h1>
                <p>Check your game stats<p>
            </div>
        </div>
    </div>
    `;

    const friendsOnlineList = document.getElementById('friendsOnlineList');
    const friendsOfflineList = document.getElementById('friendsOfflineList');
        
    for (let i = 0; i < freundesliste.length; i++)
    {
        if (freundesliste[i].status === 'online')
            addListItem(freundesliste[i].username, friendsOnlineList);
        else
            addListItem(freundesliste[i].username, friendsOfflineList);
    }
    
}