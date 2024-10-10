import { getCookie, displayMessages } from './utils.js';
import { showSection } from './index.js';

export async function renderSettings() {

	const app = document.getElementById('app');
	app.innerHTML = `
	<div class="login">
		<div class="login-container">
			<form id="settingsForm">
				<div id="messages"></div>
				<input type="hidden" name="csrfmiddlewaretoken" value="${getCookie('csrftoken')}">
				<div class="login-instructions">
					<p>Update your account information!</p>
				</div>
				

				<div class="login-form-field">
                    <label for="floatingInput" class="settings-label">Email address</label>
					<input id="settings-email" type="email" name="settings-email" class="form-control" placeholder="name@example.com">
				</div>
				<div class="login-form-field">
                    <label for="floatingPassword" class="settings-label">New password</label>
					<input type="password" name="settings-password" class="form-control" placeholder="Password">
				</div>
				<div class="login-form-field">
                    <label for="floatingPassword" class="settings-label">Confirm new password</label>
					<input type="password" name="settings-password" class="form-control" placeholder="Password">
				</div>
				<div class="login-form-field">
                <label for="floatingPassword" class="settings-label">Firstname</label>
					<input id="settings-firstname" type="text" name="settings-firstname" class="form-control" placeholder="Firstname">
				</div>
				<div class="login-form-field">
                <label for="floatingPassword" class="settings-label">Lastname</label>
					<input id="settings-lastname" type="text" name="settings-lastname" class="form-control" placeholder="Lastname">
				</div>
				<div class="login-form-field">
                <label for="floatingPassword" class="settings-label">Username</label>
					<input id="settings-username" type="text" name="settings-username" class="form-control" placeholder="Username">
				</div>


				<button class="signin-button btn btn-primary w-100 py-2" type="submit">Update</button>
				
			</form>
		</div>
	</div>
	`;
    const inputEmail = document.getElementById('settings-email');
    const inputFirstname = document.getElementById('settings-firstname');
    const inputLastname = document.getElementById('settings-lastname');
    const inputUsername = document.getElementById('settings-username');

    const response = await getUserInformation();
    if (response.error)
        displayMessages(response);
    else
    {
        inputEmail.value = response.email;
        inputFirstname.value = response.firstname;
        inputLastname.value = response.lastname;
        inputUsername.value = response.username;
    }    
	const form = document.getElementById('registerForm');
    form.addEventListener('submit', handleFormSubmit);

}

async function getUserInformation() {
    try {
        const csrftoken = getCookie('csrftoken');
        const response = await fetch(`/get_user_information/`, {
            method: 'GET',
            credentials: 'include'
        });
        return await response.json();
    }
    catch(error){
        return ({'error': 'Request for getting settings failed.'});
    }
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