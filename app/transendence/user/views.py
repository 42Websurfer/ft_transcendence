from django.shortcuts import get_object_or_404, redirect
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from .models import User, Friendship, UserProfile
from tournament.models import GameStatsUser
from django.db.models import Q
from user.utils import updateOnlineStatusChannel
import json
import logging
import redis
import requests

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def check_auth(request):
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

@csrf_exempt
def user_login(request):
    if request.method == 'POST':
        try: 
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            if User.objects.filter(username=username).exists():
                user = authenticate(username=username, password=password)
                if user is not None:
                    login(request, user)
                    return JsonResponse({
                        'success': 'User logged in successfully.',
                        'user': {
                            'id': user.id,
                            'username': user.username,
                            'email': user.email,
                            'first_name': user.first_name,
                            'last_name': user.last_name
                        }
                    }, status=200)
                else:
                    return JsonResponse({'error': 'Invalid password.'}, status=400)
            else:
                return JsonResponse({'error': 'User does not exist.'}, status=400)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON.'}, status=400)
    return JsonResponse({'error': 'Invalid request method.'}, status=405)

def user_logout(request):
    if request.user.is_authenticated: 
        logout(request)
    return JsonResponse({
        'success': 'User logged in successfully.'
    }, status=200)

@csrf_exempt
def register(request):
    if request.method == 'POST':
        try:
            #data = json.loads(request.body)		
            data = request.POST
            email = data.get('email')
            password = data.get('password')
            firstname = data.get('firstname')
            lastname = data.get('lastname')
            username = data.get('username')
            #check if one value is missing!
            avatar = data = request.FILES.get('avatar')
            logger.debug(f"print form data: Email: {email}, Firstname: {firstname}")
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
            login(request, user)
            return JsonResponse({
                'type': 'success',
                'message': 'User registered successfully.',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name
                }
            }, status=201)
        except json.JSONDecodeError:
                    return JsonResponse({'error': 'Invalid JSON.'}, status=400)

@login_required
def get_user_information(request):
    user = request.user
    return JsonResponse({
        'email': user.email,
        'firstname': user.first_name,
        'lastname': user.last_name,
        'username': user.username
    })

@login_required
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


@login_required
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

@login_required
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

@login_required
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

@login_required
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

@login_required
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

r = redis.Redis(host='redis', port=6379, db=0)
User = get_user_model()

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
    logger.debug(f"In check registration: {session_data.get('email')}")
    try:
        user = User.objects.get(email=session_data.get('email'))
        userprofile = UserProfile.objects.get(user=user)
        if (not userprofile.is_third_party_user):
            logger.debug("Email already registered")
            return False
        if (user.username):
            login(request, user)
            return (True)
    except User.DoesNotExist:
        return False

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
        logger.debug(f"User sollte vorkreeirt sein!")
        user.save()
        if user:
            logger.debug(f"USER IST DA!")
            userprofile = UserProfile.objects.get(user=user)
            userprofile.is_third_party_user = True
            userprofile.save()
        logger.debug(f"aber jetzt sollte alles gespeichert sein!")
        login(request, user)
        return JsonResponse({'type': 'success'})
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {e}")
        return JsonResponse({'type': 'error', 'message': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'type': 'error', 'message': 'Am oasch'}, status=400)
    

@csrf_exempt
def api_callback(request):
    # error = request.GET.get('error')
    # if error:
    #     return JsonResponse({'error': error}, status=400)
    data = json.loads(request.body) #request.GET.get('code')
    code = data.get('code')
    logger.debug(f"\n\n\ncode: {code}\n\n\n")

    try:
        access_token_response = exchange_code_for_token(code)



        logger.debug(f"\n\n\nIch habe eine access token vielleicht bekommen?:   {access_token_response}\n\n\n")

        user_info = get_user_info(access_token_response['access_token'])
        
        session_data = create_user_session(user_info)

        if (check_registration(request, session_data)):
            return JsonResponse({'type': 'success', 'data': session_data}, status=200)
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

    # logger.debug(f"\n\n\n\n\nsession_data: {session_data}\n\n\n")

    # USER ADDEN ??? auf jeden fall isAuthenticated auf true setzen und welcome page displayen

    return   session_data