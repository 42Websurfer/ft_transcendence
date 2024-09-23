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

export function displayMessages(result) {
    const messagesContainer = document.getElementById('messages');
    messagesContainer.innerHTML = '';
    if (result.error) {
        const div = document.createElement('div');
        div.classList.add('error');
        div.textContent = result.error;
        messagesContainer.appendChild(div);
    } else if (result.success) {
        const div = document.createElement('div');
        div.classList.add('success');
        div.textContent = result.success;
        messagesContainer.appendChild(div);
    }
}

export async function handleLogoutSubmit()
{
    const csrftoken = getCookie('csrftoken');

    const response = await fetch('/logout/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
    });

    const result = await response.json();
    showSection('login');
}

export async function checkAuthentication() {
    const response = await fetch('/checkauth/', {
        method: 'GET',
        credentials: 'include'  // Ensure cookies are included in the request
    });
    const result = await response.json();
    if (result.authenticated) {
        localStorage.setItem('authenticated', 'true');
        localStorage.setItem('user', JSON.stringify(result.user));
    } else {
        localStorage.removeItem('authenticated');
        localStorage.removeItem('user');
    }
    return result.authenticated;
}

export function setLoginLogoutButton(section) {
    const app = document.getElementById('LoginLogoutButton');

    if (section === "login")
        


    app.innerHTML
}