import qrcode
import pyotp
import string
import random
import requests
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import UserProfile
from io import BytesIO
from base64 import b64encode
from .models import User
from .serializers import RegisterSerializer
from django.conf import settings


def updateOnlineStatusChannel():
    channel_layer = get_channel_layer()
    group_name = "online_status"
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            'type': 'send_online_users',
            
        }
    )

def setup_2fa(user, third_party=False):
    #Hier muss dann auch noch das get mit try catch gecatched werden!
    otp_secret = pyotp.random_base32()
    if UserProfile.objects.filter(user=user).exists():
        user_profile = UserProfile.objects.get(user=user)
        user_profile.otp_secret = otp_secret
    else:
        user_profile = UserProfile.objects.create(user=user, otp_secret=otp_secret, enabled_2fa=True)
    if (third_party):
        user_profile.is_third_party_user = True
    user_profile.save()

    totp = pyotp.TOTP(otp_secret)
    uri = totp.provisioning_uri(name=user.username, issuer_name="Websurfer app")
    qr_code = qrcode.make(uri)
    buffer = BytesIO() 
    qr_code.save(buffer, format="PNG")
    return b64encode(buffer.getvalue()).decode("utf-8")

def validate_avatar(avatar): 
    try:
        if avatar.content_type.find("image/", 0) == 0:
            return True
        return False
    except Exception as e:
        return False
    
    
def register_api(user):
    try:
        username = user.get('username')
        while (User.objects.filter(username=username).exists()):
            username = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(16))            
        serializer = RegisterSerializer(data={
            'username': username,
            'email': user.get('email'),
            'firstname': user.get('first_name'),
            'lastname': user.get('last_name')
        }, is_third_party_user=True)
        if serializer.is_valid():
            user = serializer.save()
            data = {
                'user_id': user.pk,
                'username': user.username
            }
            UserProfile.objects.create(user=user, is_third_party_user=True)
            response = requests.post('http://gamehub-service:8003/gameStatsUser/', data=data)
            if not response.ok:
                response_data = response.json()
                user.delete()
                return {'type': 'error', 'message': {'usermodel': response_data['message']}}, 400, None
            return None, 200, user
        else:
            return {'type': 'error', 'message': serializer.errors}, 400, None
    except Exception as e:
        return ({'type': 'error', 'message': {'exepction': str(e)}}, 400, None)
    
def exchange_code_for_token(code):
    token_url = 'https://api.intra.42.fr/oauth/token'
    payload = {
        'grant_type': 'authorization_code',
        'client_id': settings.CLIENT_ID,
        'client_secret': settings.CLIENT_SECRET,
        'code': code,
        'redirect_uri': settings.REDIRECT_URI
    }

    response = requests.post(token_url, data=payload)
    if response.status_code == 200:
        return response.json(), 200
    else:
        return None, response.status_code

def get_user_info(access_token):

    headers = {'Authorization': f'Bearer {access_token}'}
    response = requests.get('https://api.intra.42.fr/v2/me', headers=headers)

    if response.status_code == 200:
        return response.json(), 200
    else:
        return (None, response.status_code)

def create_user_session(user_info):

    session_data = {
        'email': user_info.get('email'),
        'first_name': user_info.get('first_name'),
        'last_name': user_info.get('last_name'),
        'username': user_info.get('login')
    }

    return   session_data
