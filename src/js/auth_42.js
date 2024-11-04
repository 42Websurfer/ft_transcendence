import { getCookie, displayMessages } from './utils.js';
import { showSection } from './index.js';

export async function renderAuth42(session_data) {
    console.log('SESSION_DATA: ', session_data);
	console.log('Username42 will be registered');
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
        <div id="registerLoader" class="loader"></div> 	
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
    
    console.log(username);
    console.log('Session_data = ', session_data);
    try {
        
        const csrftoken = getCookie('csrftoken');
    
        const response = await fetch('/register_api/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({'username': username, 'session_data': session_data})
        });

        const result = await response.json();
        const registerMessage = document.getElementById('messages');
	
        if (result.type === 'success')
        {

            registerMessage.textContent = '';
    
            const registerLoader = document.getElementById('registerLoader');
            registerLoader.style.display = 'block';
    
            setTimeout(() => showSection('menu'), 2000);
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
