import { displayMessages } from './utils.js';
import { sendAuthCode } from './auth_register.js';

export async function renderAuth2FARegister(input) {
	
	const app = document.getElementById('app');
	app.innerHTML = `
	<div class="login">
		<div class="login-container" style="padding-bottom: 24px">
			<div class="login-instructions">
				<p>Please scan the QR-Code and enter the code!</p>
				</div>
			<div style="display:flex; flex-direction: row; justify-content: center;">
				<img id="qrcode" style="margin-bottom: 2em; max-height: 450px;">
			</div>
			<div style="display: flex; flex-direction: column; align-items: center;">
				<input id="authcode" style="width: 40%; margin-bottom: 0.4em;"></input>
				<button id="sendCode" style="width: 40%;" class="signin-button btn btn-primary py-2" type="click">Send 2FA Code</button>
			</div>
			<div class="login-messages" id="messages" style="text-align: center; margin-top: 1em; animation: wiggle 0.5s ease-in-out;"></div>
		</div>
	</div>
	`;

	const qrcode = document.getElementById('qrcode');
	qrcode.src = input.qr_code;

	const sendCodeButton = document.getElementById('sendCode');
	sendCodeButton.addEventListener('click', async function() {
		let result = await sendAuthCode(input.user);
		displayMessages(result);
	});

	const authcodeInput = document.getElementById('authcode');
    authcodeInput.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter') {
            const code = authcodeInput.value.trim();
            if (code)
			{
				let result = await sendAuthCode(input.user);
				displayMessages(result);
			}
        }
    });

}
