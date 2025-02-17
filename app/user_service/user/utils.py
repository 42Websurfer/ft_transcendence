import qrcode
import pyotp
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import UserProfile
from io import BytesIO
from base64 import b64encode

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
        user_profile = UserProfile.objects.create(user=user, otp_secret=otp_secret)
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
    
    