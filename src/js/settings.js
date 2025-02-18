import { AvatarLoader, displayToast, getCookie } from './utils.js';
import { showSection } from './index.js';

export async function renderSettings() {

	const app = document.getElementById('app');
	app.innerHTML = `
	<div class="login">
		<div class="login-container">
			<form id="settingsForm" enctype="multipart/form-data">
				<input type="hidden" name="csrfmiddlewaretoken" value="${getCookie('csrftoken')}">
				<div class="login-instructions">
					<p>Update your account information!</p>
				</div>
				
				<div class="login-form-field">
                    <label for="floatingInput" class="settings-label">Email address</label>
					<input id="settings-email" type="email" name="email" class="form-control" placeholder="name@example.com">
				</div>
				<div class="login-form-field">
                    <label for="floatingPassword" class="settings-label">New password</label>
					<input id="settings-pw" type="password" name="password" class="form-control" placeholder="Password">
				</div>
				<div class="login-form-field">
                    <label for="floatingPassword" class="settings-label">Confirm new password</label>
					<input id="settings-confirm-pw" type="password" name="password-confirmation" class="form-control" placeholder="Password">
				</div>
				<div class="login-form-field">
                    <label for="floatingPassword" class="settings-label">Firstname</label>
					<input id="settings-firstname" type="text" name="firstname" class="form-control" placeholder="Firstname">
				</div>
				<div class="login-form-field">
                	<label for="floatingPassword" class="settings-label">Lastname</label>
					<input id="settings-lastname" type="text" name="lastname" class="form-control" placeholder="Lastname">
				</div>
				<div class="login-form-field">
                    <label for="floatingPassword" class="settings-label">Username</label>
					<input id="settings-username" type="text" name="username" class="form-control" placeholder="Username">
				</div>
				<div class="login-form-field form-floating">
					<input type="file" accept="image/*" name="avatar" class="form-control" placeholder="Upload avatar">
					<label for="floatingInput">Upload avatar</label>
				</div>
				<div class="login-form-field font-colour-primary flex-container center">
					<input type="checkbox" name="enable2fa" id="enable2fa">
					<label style="margin-left: 15px" for="enable2fa">Enable 2fa</label>
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
	const inputPassword = document.getElementById('settings-pw');
	const inputConfirmPassword = document.getElementById('settings-confirm-pw');
	const enable2fa = document.getElementById('enable2fa');
    const response = await getUserInformation();
    if (response.type === 'error')
        displayToast(response.message, 'error');
    else
    {
        inputEmail.value = response.email;
		if (response.third_party)
		{
			inputEmail.setAttribute("disabled", "");
			inputPassword.setAttribute("disabled", "");
			inputConfirmPassword.setAttribute("disabled", "");
		}
        inputFirstname.value = response.firstname;
        inputLastname.value = response.lastname;
        inputUsername.value = response.username;
		enable2fa.checked = response.enable2fa;
		if (!enable2fa.checked)
			enable2fa.setAttribute('wasfalse', '');
    }    
	const form = document.getElementById('settingsForm');
    form.addEventListener('submit', handleSettingsFormSubmit);

}

async function getUserInformation() {
    try {
		const token = localStorage.getItem('access_token'); 

        const response = await fetch(`/api/user/get_user_information/`, {
            method: 'GET',
			headers: {
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'application/json'
			}
        });
        return await response.json();
    }
    catch(error){
		return {'type': 'error', 'message': 'Failed to get user information.' };
    }
}

async function handleSettingsFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
	const password = document.getElementById('settings-pw').value;
	const confirmPassword = document.getElementById('settings-confirm-pw').value;
	if (password != confirmPassword)
	{
		displayToast('Passwords don\'t match.', 'error');
		return;
	}
	const token = localStorage.getItem('access_token'); 

    const response = await fetch('/api/user/settings/', {
		method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData
    });
	localStorage.removeItem('user_data');
	if (!response.ok && response.status != 400) {
		if (response.status == 413) {
			displayToast('Avatar Image size too large! Max. 8MB', 'error');
		} else {
			displayToast(response.statusText, 'error');
		}
		return;
	}
    const result = await response.json();
	if (result.type === 'success')
	{
		AvatarLoader.deleteLocal();
		displayToast('User data successfully updated.', 'success');
		console.log(document.getElementById('enable2fa')?.getAttribute('wasfalse'));
		if (document.getElementById('enable2fa')?.getAttribute('wasfalse') != null) {
			localStorage.removeItem('access_token');
			localStorage.removeItem('refresh_token');
		}
		showSection('menu')
	}
	else if (result.type === 'error')
	{
		console.log("Error; ", result.message);
		for(let key of Object.keys(result.message))
			displayToast(key + ": " + result.message[key], 'error');
	}
}
