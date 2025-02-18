import { getCookie, displayToast } from './utils.js';
import { showSection } from './index.js';
import { renderAuth2FALogin } from './auth_2fa_login.js';
import { renderAuth2FARegister } from './auth_2fa_register.js';

export async function renderAuthLogin() {
	
	const app = document.getElementById('app');
	app.innerHTML = `
	<div class="login">
		<div class="login-container">
			<form id="loginForm">
				<div class="login-instructions">
					<p>Welcome, please sign in!</p>
				</div>
				
				<div class="login-form-field form-floating">
					<input type="text" name="login-username" class="form-control-new form-control" id="floatingInput" placeholder="Username" required>
					<label for="floatingInput">Username</label>
				</div>

				<div class="login-form-field form-floating">
					<input type="password" name="login-password" class="form-control-new form-control" id="floatingPassword" placeholder="Password" required>
					<label for="floatingPassword">Password</label>
				</div> 

				<button class="signin-button btn btn-primary w-100 py-2" type="submit">Sign in</button>
					
			</form>
			<div class="signin-or-text">
				<p>OR</p>
			</div>
			<button id="signIn42Button" class="signin-42-button btn btn-primary w-100 py-2">Sign In with <svg viewBox="0 0 137.52 96.5" xml:space="preserve" fill="currentColor" width="1em" height="1em" class="ml-2 size-6"><g><polygon points="76,0 50.67,0 0,50.66 0,71.17 50.67,71.17 50.67,96.5 76,96.5 76,50.66 25.33,50.66"></polygon><polygon points="86.85,25.33 112.19,0 86.85,0"></polygon><polygon points="137.52,25.33 137.52,0 112.19,0 112.19,25.33 86.85,50.66 86.85,76 112.19,76 112.19,50.66"></polygon><polygon points="137.52,50.66 112.19,76 137.52,76"></polygon></g></svg></button>
		</div>
	</div>
	`;
	const form = document.getElementById('loginForm');
	form.addEventListener('submit', handleLoginFormSubmit);

	const signIn42Button = document.getElementById('signIn42Button');
	signIn42Button.addEventListener('click', signIn42API);

}

async function signIn42API(callback)
{
	try {
		const oauthUrl = 'https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-fb637ad0b8bbb1367103db0f18b4b34529f896099d78f83e11d23e36076333e2&redirect_uri=https%3A%2F%2Flocalhost%3A4433%2F&response_type=code';
		window.location.href = oauthUrl;

	} catch (error) {
		console.log("error: ", error);
	}
}

async function handleLoginFormSubmit(event)
{
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = {
		username: formData.get('login-username'),
        password: formData.get('login-password')
    };

    const response = await fetch('/api/user/login/', {
        method: 'POST',
        body: JSON.stringify(data)
    });

    const result = await response.json();
	if (result.type === 'success')
	{
		if ('tokens' in result) {
			localStorage.setItem('access_token', result.tokens.access);
			localStorage.setItem('refresh_token', result.tokens.refresh);
			showSection('menu');
		} else {
			renderAuth2FALogin(result.user);
		}
	}
	else if (result.type === 'pending')
	{
		displayToast('You need to setup 2FA.', 'warning');
		renderAuth2FARegister(result);
	}
	else if (result.type == 'error')
		displayToast(result.message, 'error')
}
