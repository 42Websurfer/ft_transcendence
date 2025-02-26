import { showSection } from './index.js';


export function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function showCopyMessage() {
    var copyMessage = document.getElementById("copyMessage");
    copyMessage.style.display = "block";
    setTimeout(() => {
        copyMessage.style.display = "none";
    }, 2000);
}

export function copyToClipboard() {
    var copyText = document.getElementById("copyLobbyId");

    var textToCopy = copyText.tagName === 'INPUT' || copyText.tagName === 'TEXTAREA' ? copyText.value : copyText.textContent;

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            showCopyMessage();
        }).catch(err => {
            console.error("Failed to copy text: ", err);
        });
    } else {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        try {
            document.execCommand('copy');
            showCopyMessage();
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
        }

        document.body.removeChild(textarea);
    }

}


export async function handleLogoutSubmit(ws)
{
    const token = localStorage.getItem('access_token'); 

    const response = await fetch('/api/user/logout/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
    });

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    if (ws)
        ws.close(1000, "Client closed connection");
    showSection('auth_login');
}

export async function fetch_get(url)
{
    const token = localStorage.getItem('access_token'); 

    try {
        const response = await fetch('/api' + url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });
        return (await response.json());
    } catch (error) {
        return ({"type": "error", "message": error});
    }
}

export function displayToast(message, level = undefined) {
	const toastContainer = document.getElementById('tc');

	const toastHTML = `
	<div class="toast ${level ? level == 'success' ? 'bg-success bg-gradient' : level == 'warning' ? 'bg-warning bg-gradient' : level == 'error' ? 'bg-danger bg-gradient' : 'bg-info bg-gradient'  : ''}" data-bs-delay="3000" role="alert" aria-live="assertive" aria-atomic="true">
		<div class="d-flex">
			<div class="toast-body font-main text-white">
				${message}
			</div>
			<button type="button" class="btn-close btn-close-black me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
		</div>
	</div>`;
	const toastElement = document.createElement('div');
	toastElement.innerHTML = toastHTML;
	toastContainer.appendChild(toastElement);

	var a = new bootstrap.Toast(toastElement.querySelector('.toast'));
	a.show();
}

export async function sendAuthCode(user) {
	const input_code = document.getElementById('authcode');
	const code = input_code.value.trim();
	if (!code)
		return ({'type': 'error', 'message': 'You have to enter a code.'});
	const response = await fetch('/api/user/verify_2fa_code/', {
		method: 'POST',
    	headers: {
           'Content-Type': 'application/json'
        },
        body: JSON.stringify({'user': user, 'otp_code': code})
    });
	const result = await response.json()
	if (result.type === 'success')
	{
        localStorage.setItem('access_token', result.tokens.access);
        localStorage.setItem('refresh_token', result.tokens.refresh);
		showSection('menu');
		return result;
	}
	else
		return result;
}

let countdownTime = 3;
let countdownIntervalID;

export function useCountdownAsMessageDisplay(message) {
	clearInterval(countdownIntervalID);
	let countdownDisplay = document.getElementById('countdownDisplay');
	
	countdownDisplay.innerHTML = `<p>${message}</p>`;
	countdownDisplay.style.display = 'block';
}

export function startGame() {
	countdownTime = 3
	let countdownDisplay = document.getElementById('countdownDisplay');
	if (!countdownDisplay)
		return;
	countdownDisplay.textContent = countdownTime.toString();
	countdownDisplay.style.display = 'block';
	if (countdownIntervalID)
		clearInterval(countdownIntervalID);
	countdownIntervalID = setInterval(updateCountdown, 1000);
}

async function updateCountdown() {
	
	let countdownDisplay = document.getElementById('countdownDisplay');
	if (!countdownDisplay)
		return ;
	if (countdownTime > 1) {
		countdownTime--;
		countdownDisplay.textContent = countdownTime.toString();
	} else {
		clearInterval(countdownIntervalID);
		countdownIntervalID = undefined;
		countdownDisplay.style.display = 'none';
	}
}

export class AvatarLoader {
	static #required_data_keys = ['username', 'avatar_url', 'expires'];

	static #applyData(data){
		const avatarDiv = document.querySelector('#avatar');
		const avatarConainer = avatarDiv.querySelector('#avatar_img_container');
		const avatarName = avatarDiv.querySelector('#avatar_name');
		const avatarImg = avatarConainer.querySelector('img');
		avatarDiv.style.display = 'flex';
		avatarImg.src = data.avatar_url;
		avatarName.textContent = data.username;
	}

	static loadData(){
		const token = localStorage.getItem('access_token');
		if (!token) {
			this.deleteLocal();
			return;
		}
		const local_avatar_data = localStorage.getItem('avatar_data');
		if (!local_avatar_data) {
			fetch('/api/tm/avatar_data/', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
			})
			.then((response) => response.json())
			.then((data) => {
				this.#applyData(data);
				data['expires'] = Date.now() + 3600000;
				localStorage.setItem('avatar_data', JSON.stringify(data));
			});
		} else {
			try {
				let data = JSON.parse(local_avatar_data);
				if (this.#required_data_keys.every(key => Object.keys(data).includes(key))
					&& data.expires > Date.now()) {
					this.#applyData(data);
					return;
				}
			} catch {}
			this.deleteLocal();
			this.loadData();
		}
	}

	static deleteLocal() {
		const avatarDiv = document.querySelector('#avatar');
		if (avatarDiv)
			avatarDiv.style.display = 'none';
		localStorage.removeItem('avatar_data');
	}
}
