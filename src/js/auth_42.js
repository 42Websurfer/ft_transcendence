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
                <p>Welcome, please enter your remaining info!</p>
            </div>

			<form id="registerForm" enctype="multipart/form-data">
				<div class="login-form-field form-floating">
					<input type="text" name="username" id="username" class="form-control" placeholder="Username" required>
					<label for="username">Username</label>
				</div>
				<div class="login-form-field form-floating">
					<input type="file" accept="image/*" name="avatar" id="avatar" class="form-control" placeholder="Upload avatar">
					<label for="avatar">Upload avatar</label>
				</div>
				<div class="login-form-field font-colour-primary flex-container center">
					<input type="checkbox" name="enable2fa" id="enable2fa">
					<label style="margin-left: 15px" for="enable2fa">Enable 2fa</label>
				</div>
				<button class="signin-button btn btn-primary w-100 py-2" type="submit">Sign up</button>
			</form>
		</div>
	</div>
	`;
	const form = document.getElementById('registerForm');
    form.addEventListener('submit', (event) => handleUsernameFormSubmit(event, session_data));
}

async function handleUsernameFormSubmit(event, session_data)
{
	event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
	formData.append('session_data', session_data);

    try {
        const response = await fetch('/api/user/register_api/', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (result.type === 'success') {
			if ('tokens' in result) {
				localStorage.setItem('access_token', result.tokens.access);
				localStorage.setItem('refresh_token', result.tokens.refresh);
				showSection('menu');
			} else {
				renderAuth2FARegister(result);
			}
		}
        else if (result.type === 'error')
        {
            for(let key of Object.keys(result.message))
            {
                displayToast(result.message[key], 'error');
            }
        }
    }
    catch(error) {
        console.log("Error during fetch to register_api");
    }
}
