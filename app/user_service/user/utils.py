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
        print("CONTTYPE: ", avatar.content_type)
        if avatar.content_type.find("image/", 0) == 0:
            return True
        return False
    except Exception as e:
        return False
    
    
def register_api(session_data):
    try:
        username = user.username
        while (User.objects.filter(username=username).exists()):
            username = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(16))            
        serializer = RegisterSerializer(data={
            'username': username,
            'email': user.email,
            'firstname': user.firstname,
            'lastname': user.lastname
        }, is_third_party_user=True)
        if serializer.is_valid():

            user = serializer.save()
            data = {
                'user_id': user.pk,
                'username': user.username
            }
            response = requests.post('http://gamehub-service:8003/gameStatsUser/', data=data)
            if not response.ok:
                response_data = response.json()
                user.delete()
                return {'type': 'error', 'message': {'usermodel': response_data['message']}}, status=400)
            qr_code_string = setup_2fa(user, True)
        #user.save()
            return JsonResponse(
                {
                    'type': 'success',
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name
                    },
                    'qr_code': f"data:image/png;base64,{qr_code_string}",
                })
        else:
            print("ERROR")
            return JsonResponse({'type': 'error', 'message': serializer.errors}, status=400)
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {e}")
        return JsonResponse({'type': 'error', 'message': {'exception': 'Invalid JSON data'}}, status=400)
    except Exception as e:
        return JsonResponse({'type': 'error', 'message': {'exepction': str(e)}}, status=400)
    
     
