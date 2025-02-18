import { AvatarLoader, displayToast, getCookie } from './utils.js';
import { renderAuth2FARegister } from './auth_2fa_register.js';
import { showSection } from './index.js';

export function renderAuthRegister() {
	const app = document.getElementById('app');
	app.innerHTML = `
	<div class="login">
		<div class="login-container">
			<form id="registerForm" enctype="multipart/form-data">
				<div class="login-instructions">
					<p>Welcome, please sign up!</p>
				</div>
				

				<div class="login-form-field form-floating">
					<input type="email" name="email" class="form-control" placeholder="name@example.com" required>
					<label for="floatingInput">Email address</label>
				</div>
				<div class="login-form-field form-floating">
					<input type="password" name="password" class="form-control" placeholder="Password" required>
					<label for="floatingPassword">Password</label>
				</div>
				<div class="login-form-field form-floating">
					<input type="text" name="firstname" class="form-control" placeholder="Firstname" required>
					<label for="floatingPassword">Firstname</label>
				</div>
				<div class="login-form-field form-floating">
					<input type="text" name="lastname" class="form-control" placeholder="Lastname" required>
					<label for="floatingPassword">Lastname</label>
				</div>
				<div class="login-form-field form-floating">
					<input type="text" name="username" class="form-control" placeholder="Username" required>
					<label for="floatingPassword">Username</label>
				</div>
				<div class="login-form-field form-floating">
					<input type="file" accept="image/*" name="avatar" class="form-control" placeholder="Upload avatar">
					<label for="floatingPassword">Upload avatar</label>
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
    form.addEventListener('submit', handleFormSubmit);
}


async function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
	
    const response = await fetch('/api/user/register/', {
		method: 'POST',
        body: formData
    });
	
	if (!response.ok && response.status != 400) {
		if (response.status == 413) {
			displayToast('Avatar Image size too large! Max. 8MB', 'error');
		} else {
			displayToast(response.statusText, 'error');
		}
		return;
	}
    const result = await response.json();
	console.log("Response: ", result);
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
			displayToast(result.message[key], 'error');
	}
	AvatarLoader.deleteLocal();
}
