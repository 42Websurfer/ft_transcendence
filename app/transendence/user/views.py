from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from .models import User, Friendship, PongMatches
from django.db.models import Q
import json
import logging
import redis

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
			logger.debug(f"Received username: {username}")
			logger.debug(f"Received password: {password}")
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
			data = json.loads(request.body)		
			email = data.get('email')
			password = data.get('password')
			firstname = data.get('firstname')
			lastname = data.get('lastname')
			username = data.get('username')

			if User.objects.filter(email=email).exists():
				return JsonResponse({'error': 'Email address already exists.'}, status=400)
			elif User.objects.filter(username=username).exists():
				return JsonResponse({'error': 'Username already exists.'}, status=400)
			user = User.objects.create_user(username=username, email=email, first_name=firstname, last_name=lastname)
			user.set_password(password)
			user.save()
			return JsonResponse({
				'success': 'User registered successfully.',
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
def send_friend_request(request, friend_id):
	user = request.user
	friend = get_object_or_404(User, id=friend_id)
	if user == friend: 
		return JsonResponse({
			'type': 'Failed Request',
			'message': 'User and friend have same id',
		}, status=400)
	if Friendship.objects.filter(user=user, friend=friend, status='pending').exists():
		return JsonResponse({
			'type': 'Already requested',
			'username': user.username,
			'friendname': friend.username,
			'status': 'pending'
		}, status=201)
	newFriend = Friendship.objects.create(user=user, friend=friend, status='pending')
	return JsonResponse({
		'type': 'Success Request',
		'username': newFriend.user.username,
		'friendname': newFriend.friend.username,
		'status': newFriend.status,
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

@csrf_exempt
@login_required
def addMatches(request):
	if request.method == 'POST':
		matchStats = json.loads(request.body)
		user1 = get_object_or_404(User, id=matchStats.get('player1_id'))
		user2 = get_object_or_404(User, id=matchStats.get('player2_id'))
		if user1 is None or user2 is None:
			return JsonResponse({'type': 'error'}, status=400)

		if matchStats.get('score_player1') > matchStats.get('score_player2'): 
			winner=user1 
		else:
			winner=user2 

		newMatch = PongMatches.objects.create(
			player1_id=user1,
			player2_id=user2,
			score_player1=matchStats.get('score_player1'),
			score_player2=matchStats.get('score_player2'),
			winner=winner,
		)
		if newMatch:
			response_data = {'type': 'success'}
		else:
			response_data ={'type': 'error'}

		return JsonResponse(response_data, status=201)
	return JsonResponse({'type': 'error'}, status=405)

def getMatchHistory(request):
	user = request.user
	history = PongMatches.objects.filter(Q(player1_id=user) | Q(player2_id=user) )
	requests_data = [
		{
			'player1_id': game.player1_id.username,
			'player2_id': game.player2_id.username,
			'score_player1': game.score_player1,
			'score_player2': game.score_player2,
			'played_at': game.played_at,
		}
		for game in history
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