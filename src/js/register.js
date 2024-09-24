import { getCookie, displayMessages } from './utils.js';
import { showSection } from './index.js';

export function renderRegister() {

		const app = document.getElementById('app');
		app.innerHTML = `
		<div class="container login-container">
		<form id="registerForm">
        <input type="hidden" name="csrfmiddlewaretoken" value="${getCookie('csrftoken')}">
				<img class="mb-4" src=" ./img/Logo.jpg" alt="" width="72" height="57">
				<h1 class="h3 mb-3 fw-normal">Please sign up</h1>        
			 <div id="messages"></div>
				<div class="form-floating">
					<input type="email" name="register-email" class="form-control" placeholder="name@example.com" required>
					<label for="floatingInput">Email address</label>
				</div>
				<div class="form-floating">
					<input type="password" name="register-password" class="form-control" placeholder="Password" required>
					<label for="floatingPassword">Password</label>
				</div>
				<div class="form-floating">
						<input type="text" name="register-firstname" class="form-control" placeholder="Firstname" required>
						<label for="floatingPassword">Firstname</label>
					</div>
					<div class="form-floating">
						<input type="text" name="register-lastname" class="form-control" placeholder="Lastname" required>
						<label for="floatingPassword">Lastname</label>
					</div>
					<div class="form-floating">
						<input type="text" name="register-username" class="form-control" placeholder="Username" required>
						<label for="floatingPassword">Username</label>
					</div>
				<button class="btn btn-primary w-100 py-2" type="submit">Sign in</button>
				<p class="mt-5 mb-3 text-body-secondary">©websurfer</p>
			</form>
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
    displayMessages(result);
		showSection('login');

}
