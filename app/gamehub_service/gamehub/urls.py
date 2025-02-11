from django.urls import path
from . import views

urlpatterns = [
	path('create/', views.create_lobby, name='create'),
	path('join_lobby/<str:lobby_id>/', views.join_lobby, name='join_lobby'),
	path('start_tournament/<str:lobby_id>/', views.start_group_tournament, name='start_tournament'),
	path('set_match/', views.set_tournament_match, name='set_match'),
	path('start_game/<str:lobby_id>/', views.start_game_loop, name='start_game_loop'),
	path('get_dashboard/', views.get_dashboard_data, name='get_dashboard'),
	path('get_dashboard/<str:username>/', views.get_dashboard_data, name='get_dashboard'),
	path('avatar_data/', views.get_user_avatar_data, name='get_user_avatar_data_self'),
	path('avatar_data/<int:id>/', views.get_user_avatar_data, name='get_user_avatar_data'),
	path('get_lobby_data/<str:lobby_id>/', views.get_lobby_data, name='get_lobby_data'),
	path('start_tournament_round/<str:lobby_id>/', views.start_tournament_round, name='start_tournament_round'),
	path('gameStatsUser/', views.gamestatsuser, name='gameStatsUser'),
	path('match/', views.update_match, name='update_match')
]
