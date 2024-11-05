from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.create_lobby, name='create'),
    path('join_tournament_lobby/<str:lobby_id>/', views.join_lobby, name='join_tournament_lobby'),
    path('start_tournament/<str:lobby_id>/', views.start_group_tournament, name='start_tournament'),
    path('set_match/', views.set_tournament_match, name='set_match'),
    #path('check_completion/<str:lobby_id>/<int:round>/', views.check_round_completion, name='check_completion'),
    path('bc_update_score/', views.bc_update_score, name="bc_update_score"),
    path('bc_get_score/', views.bc_get_score, name="bc_get_score"),
    path('bc_delete_score/', views.bc_delete_score, name="bc_delete_score"),
    path('join_online_lobby/<str:lobby_id>/', views.join_match_lobby, name='join_online_lobby'),
    path('start_game/<str:lobby_id>/', views.start_game_loop, name='start_game_loop'),
    path('get_dashboard/', views.get_dashboard_data, name='get_dashboard'),
    path('get_online_lobby_data/<str:lobby_id>/', views.get_online_lobby_data, name='get_online_lobby_data'),
    path('start_tournament_round/<str:lobby_id>/', views.start_tournament_round, name='start_tournament_round'),

]