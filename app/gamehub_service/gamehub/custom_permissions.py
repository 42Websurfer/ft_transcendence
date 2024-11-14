from rest_framework.permissions import BasePermission

class IsInternalContainer(BasePermission):

    def has_permission(self, request, view):
        allowed_ips = ['development']
        ip = request.META.get('REMOTE_ADDR')
        return ip in allowed_ips
