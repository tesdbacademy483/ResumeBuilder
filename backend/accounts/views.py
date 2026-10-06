from django.shortcuts import render
from django.db.models import Q
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User
from .permissions import IsAdminRole
from .serializers import (ONBOARDING_STATUS, ChangePasswordSerializer, LoginSerializer, MeSerializer,
                          StudentLoginCreateSerializer, StudentLoginListSerializer,
                          StudentLoginUpdateSerializer)
from .services import change_own_password, create_student_login, reset_student_password


# ---------------- Auth (everyone) ----------------
class LoginView(TokenObtainPairView):
    """POST email + password -> access, refresh, user{role, must_change_password}"""
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(MeSerializer(request.user).data)


class ChangePasswordView(APIView):
    """Allowed even while must_change_password is True (that's the point)."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        s = ChangePasswordSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        try:
            change_own_password(request.user, s.validated_data["old_password"], s.validated_data["new_password"])
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": "Password changed successfully."})


# ---------------- Admin: manage student logins ----------------
class AdminStudentLoginViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin,
                               mixins.CreateModelMixin, mixins.UpdateModelMixin,
                               viewsets.GenericViewSet):
    """
    GET    /api/admin/students/                  list with onboarding status (?status=, ?search=)
    POST   /api/admin/students/                  {email, temp_password?} -> returns temp password ONCE
    GET    /api/admin/students/{id}/
    PATCH  /api/admin/students/{id}/             {is_active: false} to block login
    POST   /api/admin/students/{id}/reset-password/
    GET    /api/admin/students/{id}/resume/
    """
    permission_classes = [IsAdminRole]
    http_method_names = ["get", "post", "patch"]

    def get_queryset(self):
        qs = (User.objects.filter(role=User.Role.STUDENT)
              .select_related("student_profile", "created_by")
              .annotate(onboarding_status=ONBOARDING_STATUS)
              .order_by("-created_at"))
        if st := self.request.query_params.get("status"):
            qs = qs.filter(onboarding_status=st)
        if q := self.request.query_params.get("search"):
            qs = qs.filter(Q(email__icontains=q) | Q(student_profile__full_name__icontains=q))
        return qs

    def get_serializer_class(self):
        if self.action == "create":
            return StudentLoginCreateSerializer
        if self.action == "partial_update":
            return StudentLoginUpdateSerializer
        return StudentLoginListSerializer

    def create(self, request, *args, **kwargs):
        s = StudentLoginCreateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        user, temp_password = create_student_login(
            request.user, s.validated_data["email"], s.validated_data.get("temp_password") or None)
        return Response({
            "id": user.id,
            "email": user.email,
            "temp_password": temp_password,  # shown ONCE so the admin can share it
            "detail": "Student login created. Share these credentials with the student.",
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="reset-password")
    def reset_password(self, request, pk=None):
        temp_password = reset_student_password(request.user, self.get_object())
        return Response({"temp_password": temp_password,
                         "detail": "Password reset. The student must change it on next login."})

    @action(detail=True, methods=["get"])
    def resume(self, request, pk=None):
        from students.services import build_resume  # local import avoids a circular import
        return Response(build_resume(self.get_object().student_profile))

