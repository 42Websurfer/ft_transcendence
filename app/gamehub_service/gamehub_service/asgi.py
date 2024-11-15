import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gamehub_service.settings')
django.setup()

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
import gamehub.routing
from .middleware import JWTAuthMiddleware


application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JWTAuthMiddleware(
        AuthMiddlewareStack(
            URLRouter(
                gamehub.routing.websocket_urlpatterns
            )
        )
    ),
})