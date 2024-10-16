import { getCookie, displayMessages } from './utils.js';
import { showSection } from './index.js';

export function renderLogin() {
	const app = document.getElementById('app');

	app.innerHTML = `
	<div class="login">
		<div class="login-container">
			<form id="loginForm">
				<input type="hidden" name="csrfmiddlewaretoken" value="${getCookie('csrftoken')}">
				
				<div class="login-instructions">
					<p>Welcome, please sign in!</p>
				</div>
				
				<div class="login-messages" id="messages"></div>

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

async function signIn42API(event)
{
	try {
		const oauthUrl = 'https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-330f52eb5555dbbd02b4e50dcee66a4aa0cc7a20b5ae12c9a296a28fb3325425&redirect_uri=http%3A%2F%2Flocalhost%3A8090%2Fcallback%2F&response_type=code';
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
