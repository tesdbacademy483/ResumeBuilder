"""Business logic for logins: admin creates student logins, resets passwords; users change passwords."""
import secrets
import string

from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.utils import timezone

from students.models import Student
from .models import User


def generate_temp_password(length: int = 10) -> str:
    """Readable temporary password with upper, lower, digit and symbol."""
    alphabet = string.ascii_letters + string.digits
    while True:
        pwd = "".join(secrets.choice(alphabet) for _ in range(length - 1)) + secrets.choice("@#$%&")
        if any(c.isupper() for c in pwd) and any(c.islower() for c in pwd) and any(c.isdigit() for c in pwd):
            return pwd


@transaction.atomic
def create_student_login(admin: User, email: str, temp_password: str | None = None) -> tuple[User, str]:
    """Admin creates ONLY the login. An empty Student profile is created with it,
    so the student fills the header after first login. Returns (user, temp_password)."""
    if not admin.is_admin:
        raise PermissionError("Only an admin can create student logins.")
    temp_password = temp_password or generate_temp_password()
    user = User(email=User.objects.normalize_email(email), role=User.Role.STUDENT,
                created_by=admin, must_change_password=True)
    user.set_password(temp_password)
    user.full_clean()
    user.save()
    Student.objects.create(user=user)  # every header field starts empty
    return user, temp_password


def reset_student_password(admin: User, student_user: User) -> str:
    """Admin issues a new temporary password; student must change it again on next login."""
    if not admin.is_admin:
        raise PermissionError("Only an admin can reset passwords.")
    temp_password = generate_temp_password()
    student_user.set_password(temp_password)
    student_user.must_change_password = True
    student_user.save(update_fields=["password", "must_change_password", "updated_at"])
    return temp_password


def change_own_password(user: User, old_password: str, new_password: str) -> None:
    """Used on first login (temporary password) and any time later."""
    if not user.check_password(old_password):
        raise ValueError("Current password is incorrect.")
    if old_password == new_password:
        raise ValueError("New password must be different from the current one.")
    validate_password(new_password, user)  # raises Django ValidationError with reasons
    user.set_password(new_password)
    user.must_change_password = False
    user.password_changed_at = timezone.now()
    user.save(update_fields=["password", "must_change_password", "password_changed_at", "updated_at"])
