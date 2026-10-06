"""Login table (coral group). Admin creates student logins; nothing resume-related lives here."""
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.exceptions import ValidationError
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError("Email is required")
        user = self.model(email=self.normalize_email(email), **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault("role", User.Role.ADMIN)
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        extra.setdefault("must_change_password", False)
        return self.create_user(email, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        STUDENT = "student", "Student"

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.STUDENT)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)  # Django admin site access
    created_by = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL,
        related_name="created_users", limit_choices_to={"role": "admin"},
    )
    must_change_password = models.BooleanField(default=True)
    password_changed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "users"
        indexes = [models.Index(fields=["role"])]

    def clean(self):
        if self.role == self.Role.STUDENT and not self.created_by_id:
            raise ValidationError({"created_by": "Student logins must be created by an admin."})
        if self.created_by_id and self.created_by.role != self.Role.ADMIN:
            raise ValidationError({"created_by": "Only an admin can create user accounts."})

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN

    def __str__(self):
        return self.email
