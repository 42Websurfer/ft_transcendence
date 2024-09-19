import { getCookie, displayMessages } from './utils.js';

export function renderLogin() {
	const app = document.getElementById('app');
	app.innerHTML = `
		<div class="container login-container">
			<form id="loginForm">
				<input type="hidden" name="csrfmiddlewaretoken" value="${getCookie('csrftoken')}">
				<img class="mb-4" src=" ./img/Logo.jpg" alt="" width="72" height="57">
				<h1 class="h3 mb-3 fw-normal">Please sign in</h1>        
				<div id="messages"></div>
				<div class="form-floating">
					<input type="text" name="login-username" class="form-control" id="floatingInput" placeholder="Username" required>
					<label for="floatingInput">Username</label>
				</div>
				<div class="form-floating">
					<input type="password" name="login-password" class="form-control" id="floatingPassword" placeholder="Password" required>
					<label for="floatingPassword">Password</label>
				</div> 
				<button class="btn btn-primary w-100 py-2" type="submit">Sign in</button>
				<p class="mt-5 mb-3 text-body-secondary">©websurfer</p>
			</form>
	</div>
	`;
	const form = document.getElementById('loginForm');
	form.addEventListener('submit', handleLoginFormSubmit);
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
    const csrftoken = getCookie('csrftoken');

    const response = await fetch('/login/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();
    displayMessages(result);
	console.log(result.error);
	console.log(result.sucess);

	if (result.success)
		showSection('welcome');

}
