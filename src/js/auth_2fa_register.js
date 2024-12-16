import { displayToast, sendAuthCode } from './utils.js';

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
		</div>
	</div>
	`;

	const qrcode = document.getElementById('qrcode');
	qrcode.src = input.qr_code;

	const sendCodeButton = document.getElementById('sendCode');
	sendCodeButton.addEventListener('click', async function() {
		let result = await sendAuthCode(input.user);
		if (result.type === 'error')
			displayToast(result.message, 'error')	
	});

	const authcodeInput = document.getElementById('authcode');
    authcodeInput.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter') {
			let result = await sendAuthCode(input.user);
			if (result.type === 'error')
			{
				displayToast(result.message, 'error')
			}	
			else if (result.type === 'success')
				displayToast('You have successfully registered.', 'success');
        }
    });

}
