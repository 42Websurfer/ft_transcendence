export class Authenticator {
	static async isAuth() {
		const token = localStorage.getItem('access_token');
		if (!token)
			return false;
		try {
			const response = await fetch('/api/user/checkauth/', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
			});
			return response.ok;
	
		}
		catch(error) {
			console.error(error);
			return false;
		}
	}

	static async login(credetials) {
		const response = await fetch('/api/user/login/', {
			method: 'POST',
			body: JSON.stringify(credetials)
		});

		const result = await response.json();
		if (result.type === 'success')
		{
			if (result?.user)
				localStorage.setItem('user', JSON.stringify(result.user));
			if ('tokens' in result) {
				localStorage.setItem('access_token', result.tokens.access);
				localStorage.setItem('refresh_token', result.tokens.refresh);
				return true;
			} else {
				renderAuth2FALogin(result.user);
			}
		}
		else if (result.type === 'pending')
		{
			// displayToast('You need to setup 2FA.', 'warning');
			renderAuth2FARegister(result);
		}
		else if (result.type == 'error') {
			// displayToast(result.message, 'error')
			console.error('Error:', result.message);
		}
		return false;
	}
}
