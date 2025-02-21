import { SectionManager } from "./section.js";

SectionManager.showSection('menu2');

document.querySelector('#webpong-button')?.addEventListener('click', () => {
	SectionManager.showSection('menu2');
});

// const signInButton = document.querySelector('#signInButton');
// signInButton?.addEventListener('click', SectionManager.showSection('register'));

// export const FRIENDSHIP_SOCKET = new WebSocket(`wss://${window.location.host}/ws/user/online-status/?token=${token}`);
