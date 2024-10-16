from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.create_lobby, name='create'),
    path('join/<str:lobby_id>/', views.join_lobby, name='join'),
    path('start_tournament/<str:lobby_id>/', views.start_group_tournament, name='start_tournament'),
    path('set_match/', views.set_match, name='set_match'),
    path('check_completion/<str:lobby_id>/<int:round>/', views.check_round_completion, name='check_completion'),
    path('bc_create_score/', views.bc_create_score, name="bc_create_score"),
    path('bc_update_score/', views.bc_update_score, name="bc_update_score"),
    path('bc_get_score/', views.bc_get_score, name="bc_get_score")
]