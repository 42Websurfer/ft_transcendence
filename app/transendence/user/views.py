import json
import logging
import redis
import requests
import pyotp
from django.shortcuts import get_object_or_404, redirect
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from user.utils import updateOnlineStatusChannel
from tournament.models import GameStatsUser
from .models import User, Friendship, UserProfile
from .utils import setup_2fa
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

r = redis.Redis(host='redis', port=6379, db=0)
User = get_user_model()

@api_view(['GET'])
def check_auth(request):
    try: 
        if request.user.is_authenticated:
            logger.debug("user is authenticated")
            return JsonResponse({
                'authenticated': True,
                'user': {
                    'id': request.user.id,
                    'username': request.user.username,
                    'email': request.user.email,
                    'first_name': request.user.first_name,
                    'last_name': request.user.last_name
                }
            })
        else:
            logger.debug("user is not authenticated")
            return JsonResponse({'authenticated': False})
    except Exception as e:
        return JsonResponse({'authenticated': False})
        

@api_view(['POST'])
def user_login(request):
    try: 
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        if User.objects.filter(username=username).exists():
            logger.debug("WO FAILST DU JUNGE")
            user = authenticate(username=username, password=password)
            logger.debug("WO FAILST DU JUNGE2")
            if user is not None:
                return JsonResponse({
                    'success': 'User logged in successfully.',
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name
                    },
                }, status=200)
            else:
                return JsonResponse({'error': 'Incorrect username or password.'}, status=400)
        else:
            return JsonResponse({'error': 'Incorrect username or password.'}, status=400)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_logout(request):
    logout(request)
    return JsonResponse({
        'success': 'User logged in successfully.'
    }, status=200)

@api_view(['POST'])
def verify_2fa_code(request):
    try:
        data = json.loads(request.body)
        otp_code = data.get('otp_code')
        user = data.get('user')
        username = user.get('username') 
        user = User.objects.get(username=username)
        user_profile = UserProfile.objects.get(user=user)
        totp = pyotp.TOTP(user_profile.otp_secret)
        
        if totp.verify(otp_code):
            refresh = RefreshToken.for_user(user)

            return JsonResponse({
                'type': 'success',
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=200)
        else:
            return JsonResponse({'error': 'Invalid code.'}, status=400)
            
    except User.DoesNotExist:
        return JsonResponse({'type': 'error', 'message': 'User not found.'}, status=404)
    except Exception as e:
        return JsonResponse({'type': 'error', 'message': str(e)}, status=400)

@api_view(['POST'])
def register(request):
    if request.method == 'POST':
        try:
            data = request.POST

            email = data.get('email')
            password = data.get('password')
            firstname = data.get('firstname')
            lastname = data.get('lastname')
            username = data.get('username')
            avatar = data = request.FILES.get('avatar')
            if User.objects.filter(email=email).exists():
                return JsonResponse({'type': 'error', 'message': 'Email address already exists.'}, status=400)
            elif User.objects.filter(username=username).exists():
                return JsonResponse({'type': 'error', 'message': 'This username already exists.'}, status=400)
            user = User.objects.create_user(username=username, email=email, first_name=firstname, last_name=lastname)
            user.set_password(password)
            user.save()
            if avatar:
                user_game_stats = GameStatsUser.objects.get(username=username)
                user_game_stats.avatar = avatar
                user_game_stats.save()

            qr_code_string = setup_2fa(user)
            return JsonResponse({
                'type': 'success',
                'message': 'User registered successfully.',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name
                },
                'qr_code': f"data:image/png;base64,{qr_code_string}",
            }, status=201)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON.'}, status=400)
            
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_information(request):
    user = request.user
    return JsonResponse({
        'email': user.email,
        'firstname': user.first_name,
        'lastname': user.last_name,
        'username': user.username
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_user_information(request):
    try:
        data = request.POST
        email = data.get('email')
        password = data.get('password')
        firstname = data.get('firstname')
        lastname = data.get('lastname')
        username = data.get('username')
        avatar = data = request.FILES.get('avatar')
        user = User.objects.get(id=request.user.id)
        logger.debug(f"Is 42? : {user.userprofile.is_third_party_user}")
        if user.userprofile.is_third_party_user:
            if user.email != email:
                return JsonResponse({'type': 'error', 'message': 'Third party user cannot change email'})
        if username and user.username != username:
            if User.objects.filter(username=username).exists():
                return JsonResponse({'type': 'error', 'message': 'This username already exists.'}, status=400)
            user.username = username
        
        if email and user.email != email: 
            if User.objects.filter(email=email).exists():
                return JsonResponse({'type': 'error', 'message': 'Email address already exists.'}, status=400)
            user.email = email
        if password:
            user.set_password(password)
        if firstname:
            user.first_name = firstname
        if lastname: 
            user.last_name = lastname
        if avatar:
            user.gamestatsuser.avatar = avatar
            user.gamestatsuser.save()
        user.save()
        return (JsonResponse({'type': 'success'}))
    except User.DoesNotExist:  
        return JsonResponse({'type': 'error', 'message': 'User does not exist.'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def send_friend_request(request, username):
    user = request.user
    friend = get_object_or_404(User, username=username)
    if user == friend: 
        return JsonResponse({
            'type': 'error',
            'message': 'You can\'t invite yourself.',
        }, status=400)
    try:
        friendship = Friendship.objects.get(
            Q(user=user, friend=friend) | Q(user=friend, friend=user))
        if (friendship):
            if friendship.status == 'pending':
                return JsonResponse({
                    'type': 'error',
                    'message': 'Request already sent!'
                }, status=400)
            elif friendship.status == 'rejected':
                return JsonResponse({
                    'type': 'error',
                    'message': 'This user blocked you!'
                }, status=400)
            else:
                return JsonResponse({
                    'type': 'error',
                    'message': 'You are already friends!'
                }, status=400)
    except Friendship.DoesNotExist:
        newFriend = Friendship.objects.create(user=user, friend=friend, status='pending')
        updateOnlineStatusChannel()
        return JsonResponse({
            'type': 'Success Request',
            'message': 'Request sent successfully!'
        }, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def accept_friend_request(request, username):
    user = request.user
    friend = get_object_or_404(User, username=username)
    try:
        friendship = Friendship.objects.get(user=friend, friend=user)
        if (friendship.status == 'accepted'):
            return JsonResponse({
                'type': 'error',
                'message': 'Your are already friends.'
            }, status=400)
        elif (friendship.status == 'rejected'):
            return JsonResponse({
                'type': 'error',
                'message': 'Your are already blocked.'
            }, status=400)
        else:
            friendship.status = 'accepted'
            friendship.save()
            updateOnlineStatusChannel()
        return (JsonResponse({
            'type': 'success'
        }))
    except Friendship.DoesNotExist:
        return JsonResponse({
            'type': 'error',
            'message': 'Friendship doesn\'t exist or you are not responsible'
        })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def block_friend_request(request, username):
    user = request.user
    friend = get_object_or_404(User, username=username)
    try:
        friendship = Friendship.objects.get(
            Q(user=friend, friend=user) | Q(user=user, friend=friend))
        friendship.status = 'rejected'
        friendship.save()
        updateOnlineStatusChannel()
        return (JsonResponse({
            'type': 'success'
        }))
    except Friendship.DoesNotExist:
        return JsonResponse({
            'type': 'error',
            'message': 'Friendship doesn\'t exist.'
        })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def remove_friendship(request, username):
    user = request.user
    friend = get_object_or_404(User, username=username)
    try:
        friendship = Friendship.objects.filter(
            Q(user=friend, friend=user) | Q(user=user, friend=friend)
            ).delete()
        if (friendship):
            updateOnlineStatusChannel()
            return (JsonResponse({
                'type': 'success'
            }))
    except Friendship.DoesNotExist:
        return JsonResponse({
            'type': 'error',
            'message': 'Friendship doesn\'t exist.'
        })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def friend_requests(request):
    user = request.user
    friend_requests = Friendship.objects.filter(friend=user, status='pending')
    requests_data = [
        {
            'id': fr.id,
            'from_user': fr.user.username,
            'friend_user': fr.friend.username,
            'status': fr.status,
            'created_at': fr.created_at,
        }
        for fr in friend_requests
    ]
    return JsonResponse({'requests': requests_data})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def friend_list(request):
    user = request.user
    friend_requests = Friendship.objects.filter(friend=user, status='accepted')
    requests_data = [
        {
            'id': fr.id,
            'from_user': fr.user.username,
            'friend_user': fr.friend.username,
            'status': fr.status,
            'created_at': fr.created_at,
        }
        for fr in friend_requests
    ]
    return JsonResponse({'requests': requests_data})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_online_users(request):
    online_users_ids = r.smembers("online_users")

    online_users_ids = [int(user_id) for user_id in online_users_ids]

    online_users = User.objects.filter(id__in=online_users_ids)

    user_data = [
        {
            'id': user.id,
            'username': user.username,
        }
        for user in online_users
    ]
    return JsonResponse({'online_users': user_data})

def check_registration(request, session_data):
    try:
        
        user = User.objects.get(email=session_data.get('email'))
        userprofile = UserProfile.objects.get(user=user)
        if (not userprofile.is_third_party_user):
            logger.debug("Email already registered")
            return False, None
        if (user.username):
            return (True, user)
    except User.DoesNotExist:
        return False, None

@csrf_exempt
def register_api(request):
    try:
        data = json.loads(request.body)
        session_data = data.get('session_data', {}).get('data', {})
        username= data.get('username')
        email=session_data.get('email')
        firstname=session_data.get('first_name')
        lastname=session_data.get('last_name')

        if User.objects.filter(username=username).exists():
            return JsonResponse({'type': 'error', 'message': 'This username already exists.'}, status=400)

        user= User.objects.create_user(username=username, email=email, first_name=firstname, last_name=lastname)
        user.save()
        if user:
            userprofile = UserProfile.objects.get(user=user)
            userprofile.is_third_party_user = True
            userprofile.save()
        qr_code_string = setup_2fa(user)
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
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {e}")
        return JsonResponse({'type': 'error', 'message': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'type': 'error', 'message': str(e)}, status=400)
    

@csrf_exempt
def api_callback(request):
    data = json.loads(request.body) #request.GET.get('code')
    code = data.get('code')
    try:
        access_token_response = exchange_code_for_token(code)
        user_info = get_user_info(access_token_response['access_token'])
        session_data = create_user_session(user_info)

        isValid, user =check_registration(request, session_data)
        if (isValid):

            return JsonResponse(
                {
                    'type': 'success',
                    'message': 'User registered successfully.',
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name
                    },
                    'session_data': session_data,

                }, status=200)
        else: 
            return JsonResponse({'type': 'registration', 'data': session_data})
    except Exception as e:
        return JsonResponse({'type': 'error', 'message': str(e)}, status=500)

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
        return response.json()
    else:
        return JsonResponse({'error': 'Failed to exchange code for token'}, status=response.status_code)

def get_user_info(access_token):

    headers = {'Authorization': f'Bearer {access_token}'}
    response = requests.get('https://api.intra.42.fr/v2/me', headers=headers)

    # logger.debug(f"\n\n\nUSERINFO_response_json: {response.json()}\n\n\n")

    if response.status_code == 200:
        return response.json()
    else:
        return JsonResponse({'error': 'Failed to retrieve user info'}, status=response.status_code)

def create_user_session(user_info):

    session_data = {
        'email': user_info.get('email'),
        'first_name': user_info.get('first_name'),
        'last_name': user_info.get('last_name'),
        'username': user_info.get('login')
    }

    return   session_data