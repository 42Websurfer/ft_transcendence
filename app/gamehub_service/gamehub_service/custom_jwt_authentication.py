from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
import logging
import requests
from .custom_user import CustomUser

logger = logging.getLogger(__name__)

class CustomJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        logger.debug("CustomJWTAuthentication: Starting authentication")
        header = self.get_header(request)
        if header is None:
            logger.warning("CustomJWTAuthentication: No Authorization header found")
            return None

        raw_token = self.get_raw_token(header)
        if raw_token is None:
            logger.warning("CustomJWTAuthentication: No raw token found")
            return None

        validated_token = self.get_validated_token(raw_token)
        user = self.get_user(validated_token)

        if user is None:
            logger.warning("CustomJWTAuthentication: User not found")
            raise AuthenticationFailed('User not found')

        logger.info(f"CustomJWTAuthentication: Authenticated user {user.username}")
        return (user, validated_token)

    def get_user(self, validated_token):
        try:
            user_id = validated_token.get("user_id")
            user_data = self.get_user_data(user_id)
            if user_data:
                return CustomUser(user_data)
            else:
                logger.warning("CustomJWTAuthentication: User data not found")
                return None
        except Exception as e:
            logger.error(f"CustomJWTAuthentication: Error getting user: {e}")
            return None

    def get_user_data(self, user_id):
        try:
            headers = {'Authorization': f'Bearer {self.get_token()}'}
            response = requests.get(f'http://user-service:8002/user/{user_id}/', headers=headers)
            if response.status_code == 200:
                return response.json()
            else:
                logger.warning(f"CustomJWTAuthentication: Failed to fetch user data: {response.status_code}")
                return None
        except requests.RequestException as e:
            logger.error(f"CustomJWTAuthentication: RequestException: {e}")
            return None