from django.shortcuts import render

# Create your views here.
from django.shortcuts import render
from django.http import HttpResponse

def pong(request):
	return HttpResponse("LANDING PAGE FOR PONG TOURNAMENT")    