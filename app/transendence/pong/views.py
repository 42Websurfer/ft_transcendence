from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.template import loader
from .models import User
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
		return HttpResponse(f"Received password: {password}, email: {email}")
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

		copy = request.POST.copy()
		copy["password"] = hash(copy["password"])
		request.POST = copy
		print(request.POST)

		form = UserForm(request.POST)
		if form.is_valid():
			if User.objects.filter(email=email).exists():
				return HttpResponse("EMAIL EXISTS ALREADY!!!")
			elif User.objects.filter(username=username).exists():
				return HttpResponse("USERNAME EXISTS ALREADY")
			else:
				form.save()
			return HttpResponse(f"IT GOES WELLLL!!! Email: {email}, password: {password}, firstname: {firstname}, lastname: {lastname}, username: {username}")
		else:
			return HttpResponse(f"IT GOES WROOOOONG!!! Email: {email}, password: {password}, firstname: {firstname}, lastname: {lastname}, username: {username}")

	elif request.method == 'GET':
		return render(request, 'register.html')
	# def login(request):
#     if request.method == 'GET':
#         template = loader.get_template('login.html')
#         return render(request, 'login.html', {})
#     elif request.method == 'POST':
#         form = UserForm(request.POST)
#         if form is_valid()
#             print
#         return render(request, 'test.html', {})
