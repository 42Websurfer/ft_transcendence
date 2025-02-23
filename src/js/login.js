import { Authenticator } from "./authenticator.js";
import { Section, SectionManager } from "./section.js";

export const SECTION = new Section(`
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
			<button id="signInButton" class="signin-42-button btn btn-primary w-100 py-2">Sign In with <svg viewBox="0 0 137.52 96.5" xml:space="preserve" fill="currentColor" width="1em" height="1em" class="ml-2 size-6"><g><polygon points="76,0 50.67,0 0,50.66 0,71.17 50.67,71.17 50.67,96.5 76,96.5 76,50.66 25.33,50.66"></polygon><polygon points="86.85,25.33 112.19,0 86.85,0"></polygon><polygon points="137.52,25.33 137.52,0 112.19,0 112.19,25.33 86.85,50.66 86.85,76 112.19,76 112.19,50.66"></polygon><polygon points="137.52,50.66 112.19,76 137.52,76"></polygon></g></svg></button>
		</div>
	</div>
`);

SECTION.loadSection = () => {
	document.querySelector('#loginForm')?.addEventListener('submit', handleLoginFormSubmit);
	document.querySelector('#signInButton')?.addEventListener('click', () => SectionManager.showSection('registerAPI'));

	const buttonDiv = document.querySelector('#LoginLogoutButton');
	if (buttonDiv) {
		buttonDiv.innerHTML = `
		<div class="col-5">
		<button id="registerButton" type="button" class="btn btn-primary login-logout-button">Sign up</button>
		</div>
		`;
		const registerButton = document.getElementById('registerButton')
		registerButton.addEventListener('click', () => {
			SectionManager.showSection('register');
		});
	}
};

async function handleLoginFormSubmit(event)
{
	event.preventDefault();
	const form = event.target;
	const formData = new FormData(form);
	const data = {
		username: formData.get('login-username'),
		password: formData.get('login-password')
	};

	if (await Authenticator.login(data))
		SectionManager.showSection('menu2');
}
