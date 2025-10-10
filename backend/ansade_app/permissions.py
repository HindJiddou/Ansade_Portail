from rest_framework.permissions import BasePermission

class IsChef(BasePermission):
    def has_permission(self, request, view):
        return request.user and (request.user.is_authenticated and (request.user.is_chef or request.user.is_superuser))
