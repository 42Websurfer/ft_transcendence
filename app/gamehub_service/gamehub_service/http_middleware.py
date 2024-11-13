import jwt
import requests
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from django.utils.deprecation import MiddlewareMixin
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError, DecodeError
from django.utils.functional import SimpleLazyObject


class CustomUser:
    def __init__(self, user_data):
        self.id = user_data.get('id')
        self.username = user_data.get('username')
        self.email = user_data.get('email')
        self.first_name = user_data.get('first_name')
        self.last_name = user_data.get('last_name')
        self.is_authenticated = True
        self.is_active = user_data.get('is_active', True) 

    def is_anonymous(self):
        return False

    def is_authenticated(self):
        return True

def get_user(user_id, token):
    try:
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.get(f'http://user-service:8002/user/{user_id}/', headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            return None
    except requests.RequestException:
        return None

class JWTAuthMiddleware(MiddlewareMixin):
    def process_request(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            request.user = AnonymousUser()
            return

        try:
            token = auth_header.split(' ')[1]
            decoded_data = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = decoded_data.get("user_id")
            user_data = get_user(user_id, token)
            if user_data:
                request.user = SimpleLazyObject(lambda: CustomUser(user_data))
                print(f"Request_user = {request.user.id}")
            else:
                request.user = AnonymousUser()
        except (InvalidTokenError, ExpiredSignatureError, DecodeError):
            request.user = AnonymousUser()