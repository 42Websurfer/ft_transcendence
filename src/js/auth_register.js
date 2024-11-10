import { getCookie, displayMessages } from './utils.js';
import { showSection } from './index.js';
import { renderAuth2FARegister } from './auth_2fa_register.js';

export function renderAuthRegister() {
	history.pushState({ section: 'auth_register' }, '', `?section=auth_register`);
	const app = document.getElementById('app');
	app.innerHTML = `
	<div class="login">
		<div class="login-container">
			<form id="registerForm" enctype="multipart/form-data">
				<div id="messages"></div>
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
					<input type="file" name="avatar" class="form-control" placeholder="Upload avatar">
					<label for="floatingPassword">Upload avatar</label>
				</div>
				<button class="signin-button btn btn-primary w-100 py-2" type="submit">Sign up</button>
				
			</form>
			<div id="registerMessage" class="register-message"></div>
		</div>
	</div>
	`;

	const form = document.getElementById('registerForm');
    form.addEventListener('submit', handleFormSubmit);
}

export async function sendAuthCode(user) {
	const input_code = document.getElementById('authcode');
	const code = input_code.value; 
	const response = await fetch('/verify_2fa_code/', {
		method: 'POST',
    	headers: {
           'Content-Type': 'application/json'
        },
        body: JSON.stringify({'user': user, 'otp_code': code})
    });
	const result = await response.json()
	if (result.type === 'success')
	{
		localStorage.setItem('access_token', result.tokens.access);  
        localStorage.setItem('refresh_token', result.tokens.refresh);	
		showSection('menu');
	}
	else
		return result;
}

async function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }
	const data = {
        email: formData.get('register-email'),
        password: formData.get('register-password'),
        firstname: formData.get('register-firstname'),
        lastname: formData.get('register-lastname'),
		username: formData.get('register-username')
    };
	
    const token = localStorage.getItem('access_token'); 

    const response = await fetch('/register/', {
		method: 'POST',
        /* headers: {
            'Authorization': `Bearer ${token}`,
           // 'Content-Type': 'application/json'
        }, */
        body: formData//JSON.stringify(data)
    });
	
    const result = await response.json();
	console.log("result: ", result);

	const registerMessage = document.getElementById('registerMessage');
	
	if (result.type === 'success')
	{
		registerMessage.textContent = '';

		renderAuth2FARegister(result) 

		// const registerLoader = document.getElementById('registerLoader');
		// registerLoader.style.display = 'block';
		// //Implement qr code!
		// const qrcode = document.getElementById('qrcode');
		// qrcode.src = result.qr_code;
		// const codeButton = document.getElementById('sendCode');
		// codeButton.addEventListener('click', function() {
		// 	sendAuthCode(result.user);
		// });

		//setTimeout(() => showSection('menu'), 2000);
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
