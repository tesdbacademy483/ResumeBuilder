from django.contrib import admin
from . import models

admin.site.register(models.Student)
admin.site.register(models.StudentCourse)
admin.site.register(models.StudentTopic)
admin.site.register(models.StudentTopicContent)
admin.site.register(models.StudentProject)
admin.site.register(models.StudentSummary)
admin.site.register(models.StudentExperience)
admin.site.register(models.StudentEducation)
admin.site.register(models.StudentCertification)