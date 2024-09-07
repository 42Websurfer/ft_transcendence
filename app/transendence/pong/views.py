from django.shortcuts import render, redirect
from django.http import HttpResponse, JsonResponse
from django.template import loader
from django.contrib import messages
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.hashers import make_password
from django.views.decorators.csrf import csrf_exempt
import json
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def startpage(request):
	if request.user.is_authenticated:
		return render(request, 'welcome.html')
	else:
		return render (request, 'login.html')

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
