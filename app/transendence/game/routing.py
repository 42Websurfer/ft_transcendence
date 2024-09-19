from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/pong/(?P<group_name>\w+)/$', consumers.MyConsumer.as_asgi()),
    re_path(r'ws/online-status/$', consumers.UserStatus.as_asgi()),

]
