from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),
    path('checkauth/', views.check_auth, name='checkauth'),
    path('send_friend_request/<str:username>/', views.send_friend_request, name='send_friend_request'),
    path('friend_requests/', views.friend_requests, name='friend_requests'),
    path('friend_list/', views.friend_list, name='friend_list'),
    path('match_result/', views.addMatches, name='match_result'),
    path('match_history/', views.getMatchHistory, name='match_history'),
    path('online-users/', views.get_all_online_users, name='online-users'),
    path('accept_friend_request/<str:username>/', views.accept_friend_request, name='accept_friend_request'),
    path('block_friend_request/<str:username>/', views.block_friend_request, name='block_friend_request'),
    path('remove_friendship/<str:username>/', views.remove_friendship, name='remove_friendship'),
    path('get_user_information/', views.get_user_information, name='remove_friendship'),

]

