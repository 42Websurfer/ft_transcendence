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
		registerMessage.textContent = '';
		const buttons = document.querySelectorAll('button');
		buttons.forEach(button => button.disabled = true);

		const registerLoader = document.getElementById('registerLoader');
		registerLoader.style.display = 'block';

		setTimeout(() => showSection('welcome'), 2000);
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
