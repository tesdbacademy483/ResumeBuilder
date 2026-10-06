"""Turn Django model ValidationErrors (raised by clean()/full_clean()) into HTTP 400 responses."""
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    if isinstance(exc, DjangoValidationError):
        detail = exc.message_dict if hasattr(exc, "error_dict") else {"detail": exc.messages}
        exc = serializers.ValidationError(detail)
    return exception_handler(exc, context)