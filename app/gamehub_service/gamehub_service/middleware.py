from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from urllib.parse import parse_qs
from django.conf import settings
import jwt
import requests

User = get_user_model()

@database_sync_to_async
def get_user(user_id):
    try:
        print("We try to responed!")
        response = requests.get(f'http://user-service:8002/user/{user_id}/')
        if response.status_code == 200:
            user_data = response.json()
            print(f"User_data = {user_data}")
            return user_data  # Return the user data as a dictionary
        else:
            return None
    except requests.RequestException:
        return None

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_string = parse_qs(scope["query_string"].decode())
        token = query_string.get("token", [None])[0]
        if token:
            try:
                decoded_data = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
                user_id = decoded_data.get("user_id")
                scope["user"] = await get_user(user_id)
            except (InvalidToken, TokenError) as e:
                scope["user"] = AnonymousUser()
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)