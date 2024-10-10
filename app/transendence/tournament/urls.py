from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.create_lobby, name='create'),
    path('join/<str:lobby_id>/', views.join_lobby, name='join'),
    path('start_tournament/<str:lobby_id>/', views.start_group_tournament, name='start_tournament'),
]