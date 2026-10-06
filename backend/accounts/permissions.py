"""Role checks used by every API view."""
from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "admin")


class IsStudentRole(BasePermission):
    """Student routes: also blocks access until the temporary password is changed."""
    message = "Please change your temporary password first."

    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and u.role == "student" and not u.must_change_password)
