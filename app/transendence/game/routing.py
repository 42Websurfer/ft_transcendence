from django.urls import re_path
from . import consumers
from . import PongConsumer

websocket_urlpatterns = [
    re_path(r'ws/pong/(?P<group_name>\w+)/$', PongConsumer.MyConsumer.as_asgi()),
]
