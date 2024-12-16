import { getCookie, displayToast } from './utils.js';
import { showSection } from './index.js';
import { renderAuth2FARegister } from './auth_2fa_register.js';

export async function renderAuth42(session_data) {
    
    const app = document.getElementById('app');
    app.innerHTML = `
	<div class="login">
		<div class="login-container">
            <input type="hidden" name="csrfmiddlewaretoken" value="${getCookie('csrftoken')}">
            
            <div class="login-instructions">
                <p>Welcome, please enter a username!</p>
            </div>

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
    const usernameElement = document.getElementById('usernameInput');
    let username = '';
    if (!usernameElement)
    {
        displayToast('Please enter a username', 'error');
        return ;
    }
    
    username = usernameElement.value.trim();

    try {
        
        const response = await fetch('/api/user/register_api/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({'username': username, 'session_data': session_data})
        });

        const result = await response.json();
        if (result.type === 'success')
            renderAuth2FARegister(result);
        else if (result.type === 'error')
        {
            for(let key of Object.keys(result.message))
            {
                console.log("KEY: ", key);
                displayToast(result.message[key], 'error');
            }
        }
    }
    catch(error) {
        console.log("Error during fetch to register_api");
    }
}
