from django.db.models import Case, CharField, Value, When
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User


class LoginSerializer(TokenObtainPairSerializer):
    """JWT login. Puts role in the token and tells React where to send the user."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        u = self.user
        data["user"] = {
            "id": u.id,
            "email": u.email,
            "role": u.role,
            "must_change_password": u.must_change_password,
        }
        return data


class MeSerializer(serializers.ModelSerializer):
    header_completed = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "role", "must_change_password", "header_completed", "last_login"]

    def get_header_completed(self, obj):
        profile = getattr(obj, "student_profile", None)
        return bool(profile and profile.header_completed_at)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs


# ---------- Admin: student logins ----------
ONBOARDING_STATUS = Case(
    When(must_change_password=True, then=Value("waiting_first_login")),
    When(student_profile__header_completed_at__isnull=True, then=Value("header_pending")),
    default=Value("building_resume"),
    output_field=CharField(),
)


class StudentLoginListSerializer(serializers.ModelSerializer):
    student_id = serializers.IntegerField(source="student_profile.id", read_only=True)
    student_name = serializers.CharField(source="student_profile.full_name", read_only=True)
    onboarding_status = serializers.CharField(read_only=True)
    created_by = serializers.EmailField(source="created_by.email", read_only=True)

    class Meta:
        model = User
        fields = ["id", "student_id", "email", "student_name", "is_active", "onboarding_status",
                  "created_by", "last_login", "created_at"]


class StudentLoginCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    temp_password = serializers.CharField(required=False, allow_blank=True, min_length=8,
                                          help_text="Leave empty to auto-generate")

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value


class StudentLoginUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["is_active"]
