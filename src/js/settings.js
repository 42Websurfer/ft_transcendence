import { displayToast, getCookie } from './utils.js';
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
					<input id="settings-confirm-pw" type="password" name="password" class="form-control" placeholder="Password">
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
					<input type="file" name="avatar" class="form-control" placeholder="Upload avatar">
					<label for="floatingInput">Upload avatar</label>
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
	const inputPassword = document.getElementById('settings-pw')
	const inputConfirmPassword = document.getElementById('settings-confirm-pw')
    const response = await getUserInformation();
    if (response.type === 'error')
        displayToast(response.message, 'error');
    else
    {
		console.log("Response; ", response);
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
		return {'type': 'request_error', 'message': 'Failed to tournament joind request.' }; //NOT ONLY COPY AND PASTE! THIS MESSAGE IS FROM ANOTHER UNIVERSUM
    }
}

async function handleSettingsFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
	
    const token = localStorage.getItem('access_token'); 
	
    const response = await fetch('/api/user/settings/', {
		method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData
    });
	
    const result = await response.json();
	console.log("result = ", result);
	if (result.type === 'success')
	{
		displayToast('User data successfully updated.', 'success');		
		showSection('menu')
	}
	else if (result.type === 'error')
	{
		for(let key of Object.keys(result.message))
			displayToast(result.message[key], 'error');
	}
}