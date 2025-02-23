import { Authenticator } from "./authenticator.js";
import { SectionManager } from "./section.js";

if (!await Authenticator.isAuth()) {
	const buttonDiv = document.getElementById('LoginLogoutButton');
    if (buttonDiv) {
		buttonDiv.innerHTML = `
		<div class="col-5">
			<button id="logoutButton" type="button" class="btn btn-primary login-logout-button">Logout</button>
		</div>
		`;
		const logoutButton = document.getElementById('logoutButton')
		logoutButton.addEventListener('click', () => {
			// AvatarLoader.deleteLocal();
			// handleLogoutSubmit(onlineWebSocket);
		});
	}
}

const section = window.location.pathname.substring(1);

SectionManager.showSection(section);

document.querySelector('#webpong-button')?.addEventListener('click', () => {
	SectionManager.showSection('menu2');
});

// const signInButton = document.querySelector('#signInButton');
// signInButton?.addEventListener('click', SectionManager.showSection('register'));

// export const FRIENDSHIP_SOCKET = new WebSocket(`wss://${window.location.host}/ws/user/online-status/?token=${token}`);
