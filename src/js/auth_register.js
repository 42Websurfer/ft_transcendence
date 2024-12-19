import { displayToast, getCookie } from './utils.js';
import { showSection } from './index.js';
import { renderAuth2FARegister } from './auth_2fa_register.js';

export function renderAuthRegister() {
	const app = document.getElementById('app');
	app.innerHTML = `
	<div class="login">
		<div class="login-container">
			<form id="registerForm" enctype="multipart/form-data">
				<input type="hidden" name="csrfmiddlewaretoken" value="${getCookie('csrftoken')}">

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
					<input type="file" accept=".jpg, .jpeg, .png, .webp" name="avatar" class="form-control" placeholder="Upload avatar">
					<label for="floatingPassword">Upload avatar</label>
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
	
    const token = localStorage.getItem('access_token'); 

    const response = await fetch('/api/user/register/', {
		method: 'POST',
        body: formData
    });
	
    const result = await response.json();
	console.log("Response: ", result);
	if (result.type === 'success')
		renderAuth2FARegister(result) 
	else if (result.type === 'error')
	{
		for(let key of Object.keys(result.message))
			displayToast(result.message[key], 'error');
	}
}
