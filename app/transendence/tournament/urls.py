from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.create_lobby, name='create'),
    path('join/<str:lobby_id>/', views.join_lobby, name='join')
]