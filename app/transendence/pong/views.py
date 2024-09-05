from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.template import loader
from django.contrib import messages
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from django.contrib.auth.hashers import make_password

#from django.views.decorators.csrf import csrf_protect

# def pong(request):
#     if request.method == 'POST':
#         form = UserForm(request.POST)
#         if form.is_valid():
#             form.save()

#     form = UserForm()
#     users = User.objects.all()
#     return render(request, 'niko.html', {'form': form, 'pongUser': users})

#@csrf_protect
def user_login(request):
	if request.method == 'POST':
		email = request.POST.get('email')
		password = request.POST.get('password')
		if User.objects.filter(email=email).exists():
			user = authenticate(email=email, password=password)
			if user is not None:
				login(request, user)
				return HttpResponse("Welllll done!")
			else:
				return HttpResponse(f"WRONG PW!!! NEU??")		
		else:
			return HttpResponse("NOOOO EMAIL!")
	elif request.method == 'GET':
		return render(request, 'login.html')

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
			return HttpResponse("USERNAME EXISTS ALREADY")
		user = User.objects.create_user(username=username, email=email, first_name=firstname, last_name=lastname)
		user.set_password(password)
		user.save();
		return HttpResponse(f"IT GOES WELLLL!!! Email: {email}, password: {password}, firstname: {firstname}, lastname: {lastname}, username: {username}")

	elif request.method == 'GET':
		return render(request, 'register.html')
