from django.contrib import admin
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("email", "role", "is_active", "must_change_password", "created_by", "last_login")
    list_filter = ("role", "is_active", "must_change_password")
    search_fields = ("email",)
    exclude = ("password",)
