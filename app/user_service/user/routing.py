from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/user/online-status/$', consumers.UserStatus.as_asgi()),
]
