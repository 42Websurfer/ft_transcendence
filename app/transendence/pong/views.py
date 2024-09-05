from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.template import loader
from .models import User
from django.contrib import messages
from .forms import UserForm

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
def login(request):
	if request.method == 'POST':
		email = request.POST.get('email')
		password = request.POST.get('password')
		try: 
			user = User.objects.get(email=email)
			if user is not None:
				if password == user.password:
					return HttpResponse("Welllll done!")
				else:
					return HttpResponse("Wrong pw!")
		except:
			return HttpResponse("NOOOO EMAIL!")
	elif request.method == 'GET':
		form = UserForm()
		return render(request, 'login.html', {'form': form})


def register(request):
	if request.method == 'POST':
		email = request.POST.get('email')
		password = request.POST.get('password')
		firstname = request.POST.get('firstname')
		lastname = request.POST.get('lastname')
		username = request.POST.get('username')
		form = UserForm(request.POST)
		if form.is_valid():
			if User.objects.filter(email=email).exists():
				messages.error(request, 'Email address already exists.')
				return render(request, 'register.html', {
					'form': UserForm(request.POST),
					'email_error': 'Email address already exists.'
				})			
			elif User.objects.filter(username=username).exists():
					return HttpResponse("USERNAME EXISTS ALREADY")
			else:
				form.save()
			return HttpResponse(f"IT GOES WELLLL!!! Email: {email}, password: {password}, firstname: {firstname}, lastname: {lastname}, username: {username}")
		else:
			return HttpResponse(f"IT GOES WROOOOONG!!! Email: {email}, password: {password}, firstname: {firstname}, lastname: {lastname}, username: {username}")

	elif request.method == 'GET':
		return render(request, 'register.html')
