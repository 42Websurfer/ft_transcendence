import { displayMessages } from './utils.js';
import { sendAuthCode } from './auth_register.js';

export async function renderAuth2FALogin(user) {
	
	const app = document.getElementById('app');
	app.innerHTML = `
	<div class="login">
		<div class="login-container">
			<div class="login-instructions">
				<p>Please enter your 2FA-code!</p>
				</div>
			<input id="authcode" style="width: 100%; margin-bottom: 0.4em;"></input>
			<button id="sendCode" class="signin-button btn btn-primary w-100 py-2" type="click">Send 2FA Code</button>
			<div class="login-messages" id="messages" style="text-align: center; margin-top: 1em; animation: wiggle 0.5s ease-in-out;"></div>
		</div>
	</div>
	`;

	const sendCodeButton = document.getElementById('sendCode');
	sendCodeButton.addEventListener('click', async function() {
		let result = await sendAuthCode(user);
		displayMessages(result);
	});

	const authcodeInput = document.getElementById('authcode');
    authcodeInput.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter') {
            const code = authcodeInput.value.trim();
            if (code)
			{
				let result = await sendAuthCode(user);
				displayMessages(result);
			}
        }
    });

}
