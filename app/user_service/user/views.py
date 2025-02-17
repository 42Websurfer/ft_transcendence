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
from rest_framework.response import Response
from user.utils import updateOnlineStatusChannel
#TypeError: the JSON object must be str, bytes or bytearray, not Response
#from tournament.models import GameStatsUser
from .models import User, Friendship, FriendshipStatus, UserProfile
from .serializers import RegisterSerializer, UpdateUserSerializer
from .utils import setup_2fa, validate_avatar

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

r = redis.Redis(host='redis', port=6379, db=0)
User = get_user_model()

@api_view(['GET'])
def check_auth(request):
    try: 
        if request.user.is_authenticated:
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
            user = authenticate(username=username, password=password)
            if user is not None:
                user_dic = {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name
                    }
                user_profile = UserProfile.objects.get(user=user)
                if  user_profile.enabled_2fa:
                    if not user_profile.verified_2fa:
                        qr_code_string = setup_2fa(user)
                        return JsonResponse({
                            'type': 'pending',
                            'user': user_dic,
                            'qr_code': f"data:image/png;base64,{qr_code_string}",

                        }, status=200)
                    else:
                        return JsonResponse({
                            'type': 'success',
                            'user': user_dic,
                        }, status=200)
                else: 
                    refresh = RefreshToken.for_user(user)
                    return JsonResponse({
                        'type': 'success',
                        'tokens': {
                            'refresh': str(refresh),
                            'access': str(refresh.access_token),
                        }
                    }, status=200)                   
            
            else:
                return JsonResponse({'type': 'error', 'message': 'Incorrect username or password.'}, status=400)
        else:
            return JsonResponse({'type': 'error', 'message': 'Incorrect username or password.'}, status=400)
    except UserProfile.DoesNotExist:
        return JsonResponse({'type': 'error', 'message': 'User does not exists in UserProfile'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'type': 'error', 'message': 'Invalid JSON.'}, status=400)

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
            user_profile.verified_2fa = True
            user_profile.save()

            return JsonResponse({
                'type': 'success',
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=200)
        else:
            return JsonResponse({'type': 'error', 'message': 'Invalid code.'}, status=400)
            
    except User.DoesNotExist:
        return JsonResponse({'type': 'error', 'message': 'User not found.'}, status=404)
    except Exception as e:
        return JsonResponse({'type': 'error', 'message': str(e)}, status=400)

@api_view(['POST'])
def register(request):
    if request.method == 'POST':
        try:
            data = request.POST

            serialized_data = RegisterSerializer(data=data)
            if serialized_data.is_valid():
                user = serialized_data.save()
                gamehub_data = {
                    'user_id': user.pk,
                    'username': user.username
                }
                avatar = request.FILES.get('avatar')
                if avatar and not validate_avatar(avatar):
                    user.delete()
                    return Response({'type': 'error', 'message': {'Avatar': 'Invalid Avatar'}}, status=400)
                response = requests.post('http://gamehub-service:8003/gameStatsUser/', data=gamehub_data, files={'avatar': avatar})
                if not response.ok:
                    response_data = response.json()
                    user.delete()
                    return Response({'type': 'error', 'message': {'usermodel': response_data['message']}}, status=400)
            else:
                return Response({'type': 'error', 'message': serialized_data.errors}, status=400)
            if not data.get('enable2fa'):
                refresh = RefreshToken.for_user(user)
                UserProfile.objects.create(user=user)
                return JsonResponse({
                    'type': 'success',
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    }
                }, status=200)
            qr_code_string = setup_2fa(user) 
            return Response({
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
        except Exception as e:
            user.delete()
            return Response({'type': 'error', 'message': {'exepction': str(e)}}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_information(request):
    user = request.user
    if user:
        return JsonResponse({
            'type': 'success',
            'email': user.email,
            'firstname': user.first_name,
            'lastname': user.last_name,
            'username': user.username,
            'third_party': user.userprofile.is_third_party_user
        })
    else: 
        return JsonResponse({'type': 'error', 'message': 'User does not exists.'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_user_information(request):
    try:
        user = request.user
        serialized_data = UpdateUserSerializer(
            user, 
            data=request.data, 
            partial=True, 
            context={'request': request}, 
            is_third_party_user=user.userprofile.is_third_party_user
            )
        if serialized_data.is_valid():
            username = request.data.get('username')
            avatar = request.FILES.get('avatar')
            if avatar and  not validate_avatar(avatar):
                return Response({'type': 'error', 'message': {'Avatar': 'Invalid Avatar'}}, status=400)
            response = requests.put('http://gamehub-service:8003/gameStatsUser/', data={'user_id': user.pk, 'username': username}, files={'avatar': avatar})
            if not response.ok:
                response_data = response.json()
                return Response({'type': 'error', 'message': {'user' :response_data['message']}}, status=400)
            user = serialized_data.save()
            return Response({'type': 'success', 'message': 'User information successfully updated.'}, status=200)
        else:
            return Response({'type': 'error', 'message': serialized_data.errors}, status=400)
    except Exception as e:
        return JsonResponse({'type': 'error', 'message': {'exception': str(e)}}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def send_friend_request(request, username):
    user = request.user
    if user.username == username:
        return JsonResponse({
            'type': 'error',
            'message': 'You can\'t invite yourself.',
        }, status=400)
    try:
        friend = User.objects.get(username=username)
        friendships = Friendship.objects.filter(Q(user=user, friend=friend) | Q(user=friend, friend=user))

        if len(friendships) > 0:
            friendship = friendships[0]
            if friendship.status == FriendshipStatus.PENDING:
                return JsonResponse({
                    'type': 'error',
                    'message': 'Request already sent!'
                }, status=400)
            elif friendship.status == FriendshipStatus.BLOCKED:
                return JsonResponse({
                    'type': 'error',
                    'message': 'This user blocked you!' if friendship.user.username != user.username else 'You Blocked this user!'
                }, status=400)
            return JsonResponse({
                'type': 'error',
                'message': 'You are already friends!'
            }, status=400)
        newFriend = Friendship.objects.create(user=user, friend=friend, status=FriendshipStatus.PENDING)
        newFriend.save()
        updateOnlineStatusChannel()
        return JsonResponse({
            'type': 'Success Request',
            'message': 'Request sent successfully!'
        }, status=201)
    except Exception as e:
        return JsonResponse({'type': 'error', 'message': e}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def accept_friend_request(request, username):
    user = request.user
    friend = get_object_or_404(User, username=username)
    try:
        friendship = Friendship.objects.get(user=friend, friend=user)
        if (friendship.status == FriendshipStatus.ACCEPTED):
            return JsonResponse({
                'type': 'error',
                'message': 'Your are already friends.'
            }, status=400)
        elif (friendship.status == FriendshipStatus.BLOCKED):
            return JsonResponse({
                'type': 'error',
                'message': 'Your are already blocked.'
            }, status=400)
        else:
            friendship.status = FriendshipStatus.ACCEPTED
            friendship.save()
            updateOnlineStatusChannel()
        return (JsonResponse({
            'type': 'success'
        }))
    except Friendship.DoesNotExist:
        return JsonResponse({
            'type': 'error',
            'message': 'Friendship doesn\'t exist or you are not responsible'
        }, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def block_friend_request(request, username):
    user = request.user
    friend = get_object_or_404(User, username=username)
    try:
        friendships = Friendship.objects.filter(Q(user=friend, friend=user) | Q(user=user, friend=friend))
        if len(friendships) == 0:
            return JsonResponse({
                'type': 'error',
                'message': 'Friendship doesn\'t exist.'
                }, status=400)
        if len(friendships) > 1:
            return JsonResponse({'type': 'error', 'message': 'Already Blocked this user!'}, status=400)
        friendship = friendships[0]
        if friendship.status == FriendshipStatus.BLOCKED and friendship.user.username != user.username:
            new_block = Friendship.objects.create(user=user, friend=friend, status=FriendshipStatus.BLOCKED)
            new_block.save()
        else:
            friendship.status = FriendshipStatus.BLOCKED
            if user.username != friendship.user.username:
                tmp = friendship.user
                friendship.user = user
                friendship.friend = tmp
            friendship.save()
        updateOnlineStatusChannel()
        return JsonResponse({'type': 'success'})
    except Exception as e:
        return JsonResponse({'type': 'error', 'message': f'Exception: {e}'}, 400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def remove_friendship(request, username):
    user = request.user
    friend = get_object_or_404(User, username=username)
    try:
        friendships = Friendship.objects.filter(Q(user=friend, friend=user) | Q(user=user, friend=friend))
        if not friendships.exists():
            return JsonResponse({'type': 'error', 'message': 'Friendship doesn\'t exist.'})
        
        for friendship in friendships:
            if friendship.status == FriendshipStatus.BLOCKED and friendship.user.username != user.username:
                continue
            friendship.delete()

        updateOnlineStatusChannel()
        return (JsonResponse({
            'type': 'success'
        }))
    except Exception as e:
        return JsonResponse({
            'type': 'error',
            'message': str(e)
        })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def friend_requests(request):
    user = request.user
    friend_requests = Friendship.objects.filter(friend=user, status=FriendshipStatus.PENDING)
    requests_data = [
        {
            'id': fr.id,
            'from_user': fr.user.username,
            'friend_user': fr.friend.username,
            'status': fr.status.name,
            'created_at': fr.created_at,
        }
        for fr in friend_requests
    ]
    return JsonResponse({'requests': requests_data})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def friend_list(request):
    user = request.user
    friend_requests = Friendship.objects.filter(friend=user, status=FriendshipStatus.ACCEPTED)
    requests_data = [
        {
            'id': fr.id,
            'from_user': fr.user.username,
            'friend_user': fr.friend.username,
            'status': fr.status.name,
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
            return False, None
        if (user.username):
            return (True, user)
    except User.DoesNotExist:
        return False, None

@csrf_exempt
@api_view(['POST'])
def register_api(request):
    try:
        data = request.POST
        
        session_data = data.get('session_data', {}).get('data', {})
        username= data.get('username')
        email=session_data.get('email')
        firstname=session_data.get('first_name')
        lastname=session_data.get('last_name')
        enabled_2fa=data.get('enable2fa')

        serializer = RegisterSerializer(data={
            'username': username,
            'email': email,
            'firstname': firstname,
            'lastname': lastname
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
                return Response({'type': 'error', 'message': {'usermodel': response_data['message']}}, status=400)
            if not enabled_2fa:
                refresh = RefreshToken.for_user(user)
                UserProfile.objects.create(user=user)
                return JsonResponse({
                    'type': 'success',
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    }
                }, status=200)            
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
            return JsonResponse({'type': 'error', 'message': serializer.errors}, status=400)
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {e}")
        return JsonResponse({'type': 'error', 'message': {'exception': 'Invalid JSON data'}}, status=400)
    except Exception as e:
        return JsonResponse({'type': 'error', 'message': {'exepction': str(e)}}, status=400)
    

@csrf_exempt
def api_callback(request):
    try:
        data = json.loads(request.body) #request.GET.get('code')
        code = data.get('code')
        access_token_response = exchange_code_for_token(code)
        user_info = get_user_info(access_token_response['access_token'])
        session_data = create_user_session(user_info)

        isValid, user = check_registration(request, session_data)
        if (isValid):
            user_profile = UserProfile.objects.get(user=user)
            user_dic = {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name
                    }
            if not user_profile.verified_2fa:
                qr_code_string = setup_2fa(user)
                return JsonResponse(
                    {
                        'type': 'pending',
                        'message': 'User registered successfully.',
                        'user': user_dic,
                        'session_data': session_data,
                        'qr_code': f"data:image/png;base64,{qr_code_string}",
                    }, status=200)
            else:
                return JsonResponse(
                    {
                        'type': 'success',
                        'message': 'User registered successfully.',
                        'user': user_dic,
                        'session_data': session_data,

                    }, status=200)
        else: 
            return JsonResponse({'type': 'registration', 'data': session_data})
    except User.DoesNotExist:
        return JsonResponse({'type': 'error', 'message': 'User does not exists.'}, status=404)
    except UserProfile.DoesNotExist:
        return JsonResponse({'type': 'error', 'message': 'UserProfile does not exists.'}, status=404)
    except Exception as e:
        return JsonResponse({'type': 'error', 'message': str(e)}, status=400)


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
