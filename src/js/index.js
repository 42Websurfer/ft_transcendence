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

async function showSection(section)
{
    console.log('section:' + section);
    const isAuthenticated = await checkAuthentication();
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


function initOnlineStatus() {
    ws = new WebSocket('ws://localhost:8090/ws/online-status/');

    ws.onopen =  function() {
        console.log("Connected to WebSocket Online Status");
    };

    ws.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            console.log("Online Friends:", data.online_users);
            const onlineStats = document.getElementById('user_status')
            if (onlineStats)
            {
                onlineStats.innerHTML = '';
                onlineStats.innerHTML = `
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                `;
            }    
            else {
                console.log("ERROR");
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

wsBool = false;

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
