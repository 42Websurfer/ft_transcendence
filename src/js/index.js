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

function renderLoginLogoutButton(isAuthenticated) {

    const app = document.getElementById('LoginLogoutButton');
    if (!app)
        return;
        
    if (isAuthenticated)
    {
        app.innerHTML = `
        <div class="col-5">
            <button id="LogoutButton" type="button" class="btn btn-primary login-logout-button">Logout</button>
        </div>
        `;
    }
    else
    {
        app.innerHTML = `
        <div class="col-5">
            <button id="LoginButton" type="button" class="btn btn-primary login-logout-button">Login</button>
        </div>
        `;
    }
}

async function showSection(section)
{
    console.log('section:' + section);
    const isAuthenticated = await checkAuthentication();
    renderLoginLogoutButton(isAuthenticated);
    if (section === 'register')
        import('./register.js').then(module => {
            module.renderRegister();
        });
    else if (section === 'login')
        import('./login.js').then(module => {
            module.renderLogin();    
        });
    if (isAuthenticated) {
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
    import('./header.js').then(module => {
        module.renderHeader(section);
    });
    import('./footer.js').then(module => {
        module.renderFooter(section);
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
