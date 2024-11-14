from rest_framework.permissions import BasePermission
import logging
import socket
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class IsInternalContainer(BasePermission):
    def __init__(self, allowed_ips = None):
        if allowed_ips:
            self.allowed_ips = [socket.gethostbyname(ip) for ip in allowed_ips]
    
    def has_permission(self, request, view):
        ip = request.META.get('REMOTE_ADDR')
        return ip in self.allowed_ips

def IsInternalContainerFactory(allowed_ips):
    class CustomIsInternalContainer(IsInternalContainer):
        def __init__(self):
            super().__init__(allowed_ips)
    return CustomIsInternalContainer