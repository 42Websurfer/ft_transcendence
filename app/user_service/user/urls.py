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
    path('online-users/', views.get_all_online_users, name='online-users'),
    path('accept_friend_request/<str:username>/', views.accept_friend_request, name='accept_friend_request'),
    path('block_friend_request/<str:username>/', views.block_friend_request, name='block_friend_request'),
    path('remove_friendship/<str:username>/', views.remove_friendship, name='remove_friendship'),
    path('get_user_information/', views.get_user_information, name='remove_friendship'),
    path('callback/', views.api_callback, name='callback'),
    path('register_api/', views.register_api, name='register_api'),
    path('settings/', views.update_user_information, name='settings'),
    path('verify_2fa_code/', views.verify_2fa_code, name='verify_2fa_code'),
]

