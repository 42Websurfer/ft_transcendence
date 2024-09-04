from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.template import loader
from .models import User
from .forms import UserForm

def pong(request):
    if request.method == 'POST':
        form = UserForm(request.POST)
        if form.is_valid():
            form.save()

    form = UserForm()
    users = User.objects.all()
    return render(request, 'niko.html', {'form': form, 'pongUser': users})

def getLogin(request):
    template = loader.get_template('login.html')
    return HttpResponse(template.render())
