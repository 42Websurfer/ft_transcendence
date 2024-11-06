from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/tm/(?P<group_name>\w+)/$', consumers.Tournament.as_asgi()),
    re_path(r'ws/match/(?P<match_name>\w+)/$', consumers.OnlineMatch.as_asgi()),
]