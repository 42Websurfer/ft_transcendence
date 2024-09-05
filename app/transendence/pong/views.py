from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.template import loader
from django.contrib import messages
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.hashers import make_password

def startpage(request):
	if request.user.is_authenticated:
		return render(request, 'welcome.html')
	else:
		return render (request, 'login.html')

def user_login(request):
	if request.method == 'POST':
		username = request.POST.get('username')
		password = request.POST.get('password')
		if User.objects.filter(username=username).exists():
			user = authenticate(username=username, password=password)
			if user is not None:
				login(request, user)
				return redirect('/')
			else:
				messages.error(request, "Invalid Password")
				return render(request, 'login.html')
		else:
			messages.error(request, "Invalid Username")
			return render(request, 'login.html')
	elif request.method == 'GET':
		return render(request, 'login.html')

def user_logout(request):
	if request.user.is_authenticated: 
		logout(request)
	return redirect('/')

def register(request):
	if request.method == 'POST':
		email = request.POST.get('email')
		password = request.POST.get('password')
		firstname = request.POST.get('firstname')
		lastname = request.POST.get('lastname')
		username = request.POST.get('username')

		if User.objects.filter(email=email).exists():
			messages.error(request, 'Email address already exists.')
			return render(request, 'register.html')			
		elif User.objects.filter(username=username).exists():
			messages.error(request, 'Username already exists.')
			return render(request, 'register.html')
		user = User.objects.create_user(username=username, email=email, first_name=firstname, last_name=lastname)
		user.set_password(password)
		user.save()
		login(request, user)
		return redirect('/')

	elif request.method == 'GET':
		return render(request, 'register.html')
