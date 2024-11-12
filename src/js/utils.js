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

// export function displayMessages(result) {
//     const messagesContainer = document.getElementById('messages');
//     messagesContainer.innerHTML = '';
//     if (result.type === 'error') {
//         const div = document.createElement('div');
//         div.classList.add('error');
//         div.textContent = result.message;
//         div.style.animation = 'wiggle 0.5s ease-in-out';
//         messagesContainer.appendChild(div);
//     } else if (result.type === 'success') {
//         const div = document.createElement('div');
//         div.classList.add('success');
//         div.textContent = result.message;
//         messagesContainer.appendChild(div);
//     }
// }

export async function handleLogoutSubmit(ws, wsBool)
{
    const token = localStorage.getItem('access_token'); 

    const response = await fetch('/api/logout/', {
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
    wsBool = false;
    showSection('auth_login');
}

// export async function checkAuthentication() {
//     const token = localStorage.getItem('access_token'); 
    
//     const response = await fetch('/checkauth/', {
//         method: 'GET',
//         headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//         },
//     });
//     const result = await response.json();
//     if (result.authenticated) {
//         localStorage.setItem('authenticated', 'true');
//         localStorage.setItem('user', JSON.stringify(result.user));
//     } else {
//         localStorage.removeItem('authenticated');
//         localStorage.removeItem('user');
//     }
//     return result.authenticated;
// }

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
	console.log('create toast element!');
	const toastContainer = document.getElementById('tc');

	const toastHTML = `
	<div class="toast ${level ? level == 'success' ? 'bg-success bg-gradient' : level == 'warning' ? 'bg-warning bg-gradient' : level == 'error' ? 'bg-danger bg-gradient' : 'bg-info bg-gradient'  : ''}" role="alert" aria-live="assertive" aria-atomic="true">
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
