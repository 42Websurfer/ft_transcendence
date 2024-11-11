import { getCookie, displayMessages } from './utils.js';
import { showSection } from './index.js';
import { sendAuthCode } from './auth_register.js';
import { renderAuth2FARegister } from './auth_2fa_register.js';

export async function renderAuth42(session_data) {
    history.pushState({ section: 'auth_42', lobbyId }, '', `/auth_42${lobbyId ? `?lobbyId=${lobbyId}` : ''}`);
    
    const app = document.getElementById('app');
    app.innerHTML = `
	<div class="login">
		<div class="login-container">
            <input type="hidden" name="csrfmiddlewaretoken" value="${getCookie('csrftoken')}">
            
            <div class="login-instructions">
                <p>Welcome, please enter a username!</p>
            </div>
            
            <div class="login-messages" id="messages"></div>

            <div class="login-form-field form-floating">
                <input type="text" name="login-username" class="form-control-new form-control" id="usernameInput" placeholder="Username" required>
                <label for="floatingInput">Username</label>
            </div>

            <button id="usernameButton" class="signin-button btn btn-primary w-100 py-2" type="click">Sign up</button>
		</div>
	</div>
	`;
	const usernameButton = document.getElementById('usernameButton');
	usernameButton.addEventListener('click', () => handleUsernameFormSubmit(session_data));

    const usernameInput = document.getElementById('usernameInput');
    usernameInput.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter') {
            handleUsernameFormSubmit(session_data);
        }
    });
}

async function handleUsernameFormSubmit(session_data)
{
    console.log('WARUM WIRST DU GETRIGGERT?');
    const usernameElement = document.getElementById('usernameInput');
    let username = '';
    if (!usernameElement)
    {
        displayMessages({'error': 'Please enter a username'});
        return ;
    }
    
    username = usernameElement.value.trim();
    

    try {
        
        const token = localStorage.getItem('access_token'); 
    
        const response = await fetch('/register_api/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({'username': username, 'session_data': session_data})
        });

        const result = await response.json();
        const registerMessage = document.getElementById('messages');
        console.log("Response = ", result);
        if (result.type === 'success')
        {
            registerMessage.textContent = '';
            renderAuth2FARegister(result);
        }
        else
        {
            registerMessage.textContent = result.message;
            registerMessage.style.color = 'red';
            registerMessage.style.animation = 'none';
            registerMessage.offsetHeight;
            registerMessage.style.animation = 'wiggle 0.5s ease-in-out';
        }

        // if (result.success)
        //     showSection('menu');
    }
    catch(error) {
        console.log("Error during fetch to register_api");
        //showSection('auth_login')
    }
}
