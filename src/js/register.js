import { getCookie, displayMessages } from './utils.js';
import { showSection } from './index.js';

export function renderRegister() {

	const app = document.getElementById('app');
	app.innerHTML = `
	<div class="login">
		<div class="login-container">
			<form id="registerForm"">
				<div id="messages"></div>
				<input type="hidden" name="csrfmiddlewaretoken" value="${getCookie('csrftoken')}">

				<div class="login-instructions">
					<p>Welcome, please sign up!</p>
				</div>
				

				<div class="login-form-field form-floating">
					<input type="email" name="register-email" class="form-control" placeholder="name@example.com" required>
					<label for="floatingInput">Email address</label>
				</div>
				<div class="login-form-field form-floating">
					<input type="password" name="register-password" class="form-control" placeholder="Password" required>
					<label for="floatingPassword">Password</label>
				</div>
				<div class="login-form-field form-floating">
					<input type="text" name="register-firstname" class="form-control" placeholder="Firstname" required>
					<label for="floatingPassword">Firstname</label>
				</div>
				<div class="login-form-field form-floating">
					<input type="text" name="register-lastname" class="form-control" placeholder="Lastname" required>
					<label for="floatingPassword">Lastname</label>
				</div>
				<div class="login-form-field form-floating">
					<input type="text" name="register-username" class="form-control" placeholder="Username" required>
					<label for="floatingPassword">Username</label>
				</div>

				<button class="signin-button btn btn-primary w-100 py-2" type="submit">Sign up</button>
				
			</form>
			<div class="signin-or-text">
				<p>OR</p>
			</div>
			<button class="signin-42-button btn btn-primary w-100 py-2">Sign In with <svg viewBox="0 0 137.52 96.5" xml:space="preserve" fill="currentColor" width="1em" height="1em" class="ml-2 size-6"><g><polygon points="76,0 50.67,0 0,50.66 0,71.17 50.67,71.17 50.67,96.5 76,96.5 76,50.66 25.33,50.66"></polygon><polygon points="86.85,25.33 112.19,0 86.85,0"></polygon><polygon points="137.52,25.33 137.52,0 112.19,0 112.19,25.33 86.85,50.66 86.85,76 112.19,76 112.19,50.66"></polygon><polygon points="137.52,50.66 112.19,76 137.52,76"></polygon></g></svg></button>
			<div id="registerMessage" class="register-message"></div>
		</div>
		<div id="registerLoader" class="loader"></div> 	
	</div>
	`;

	const form = document.getElementById('registerForm');
    form.addEventListener('submit', handleFormSubmit);
}

async function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = {
        email: formData.get('register-email'),
        password: formData.get('register-password'),
        firstname: formData.get('register-firstname'),
        lastname: formData.get('register-lastname'),
		username: formData.get('register-username')
    };
	
    const csrftoken = getCookie('csrftoken');
	
    const response = await fetch('/register/', {
		method: 'POST',
        headers: {
			'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify(data)
    });
	
    const result = await response.json();
	console.log("result: ", result);

	const registerMessage = document.getElementById('registerMessage');
	
	if (result.type === 'success')
	{
		const buttons = document.querySelectorAll('button');
		buttons.forEach(button => button.disabled = true);

		const registerLoader = document.getElementById('registerLoader');
		registerLoader.style.display = 'block';
		setTimeout(() => showSection('login'), 3000)
	}
	else
	{
		registerMessage.textContent = result.message;
		registerMessage.style.color = 'red';
		registerMessage.style.animation = 'none';
		registerMessage.offsetHeight;
		registerMessage.style.animation = 'wiggle 0.5s ease-in-out';
	}
}
