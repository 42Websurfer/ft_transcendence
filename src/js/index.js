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
    const isAuthenticated = await checkAuthentication();
    if (section === 'register')
        import('./register.js').then(module => {
            module.renderRegister();
        });
    else if (section === 'login')
        import('./login.js').then(module => {
            module.renderLogin();    
        });
    else if (section === 'welcome')
        if (isAuthenticated) {
            import('./welcome.js').then(module => {
                module.renderWelcome();
            });
        }
        else
            import('./login.js').then(module => {
                module.renderLogin();    
            });
    else if (section === 'websocket')
        import('./test.js').then(module => {
            module.renderWebsocket();
        });
    else if (section === 'pong')
        import('./pong.js').then(module => {
            module.renderPong();
        });        
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
