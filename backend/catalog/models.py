"""Admin catalog (purple group): courses, topics, contents, projects, bullet points, summaries."""
from django.conf import settings
from django.db import models


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Level(models.TextChoices):
    BEGINNER = "beginner", "Beginner"
    INTERMEDIATE = "intermediate", "Intermediate"
    ADVANCED = "advanced", "Advanced"


class ContentType(models.TextChoices):
    TEXT = "text", "Text"
    IMAGE = "image", "Image"


class Course(TimeStampedModel):
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    short_description = models.CharField(max_length=500, blank=True)
    description = models.TextField(blank=True)
    resume_label = models.CharField(max_length=150, blank=True,
                                    help_text='Skill line label, e.g. "Backup & Recovery"')
    level = models.CharField(max_length=15, choices=Level.choices, default=Level.BEGINNER)
    duration_hours = models.PositiveIntegerField(null=True, blank=True)
    thumbnail_url = models.URLField(blank=True)
    skills_covered = models.JSONField(default=list, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True,
                                   on_delete=models.SET_NULL, related_name="courses_created")

    class Meta:
        db_table = "courses"
        ordering = ["title"]

    def __str__(self):
        return self.title


class CourseTopic(TimeStampedModel):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="topics")
    title = models.CharField(max_length=200)  # printed as a skill item, e.g. "RMAN"
    description = models.TextField(blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "course_topics"
        ordering = ["course", "sort_order"]

    def __str__(self):
        return f"{self.course} / {self.title}"


class TopicContent(TimeStampedModel):
    topic = models.ForeignKey(CourseTopic, on_delete=models.CASCADE, related_name="contents")
    title = models.CharField(max_length=200)
    content_type = models.CharField(max_length=10, choices=ContentType.choices, default=ContentType.TEXT)
    body = models.TextField(blank=True)
    sort_order = models.PositiveIntegerField(default=0)


    class Meta:
        db_table = "topic_contents"
        ordering = ["topic", "sort_order"]

    def __str__(self):
        return self.title


class CourseProject(TimeStampedModel):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="projects")
    title = models.CharField(max_length=200)
    short_description = models.CharField(max_length=500, blank=True)
    description = models.TextField(blank=True)
    difficulty = models.CharField(max_length=15, choices=Level.choices, default=Level.BEGINNER)
    tech_stack = models.JSONField(default=list, blank=True)  # ["React", "Python"]
    sort_order = models.PositiveIntegerField(default=0)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True,
                                   on_delete=models.SET_NULL, related_name="projects_created")

    class Meta:
        db_table = "course_projects"
        ordering = ["course", "sort_order"]

    def __str__(self):
        return self.title


class ProjectContent(TimeStampedModel):
    project = models.ForeignKey(CourseProject, on_delete=models.CASCADE, related_name="contents")
    title = models.CharField(max_length=200, blank=True)
    content_type = models.CharField(max_length=10, choices=ContentType.choices, default=ContentType.TEXT)
    body = models.TextField(blank=True)
    media_url = models.URLField(blank=True)
    is_resume_point = models.BooleanField(default=False, help_text="Print as a resume bullet point")
    sort_order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)

    class Meta:
        db_table = "project_contents"
        ordering = ["project", "sort_order"]

    def __str__(self):
        return self.title or self.body[:50]


class CourseSummary(TimeStampedModel):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="summaries")
    title = models.CharField(max_length=150)  # "Python developer (fresher)"
    body = models.TextField()
    sort_order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True,
                                   on_delete=models.SET_NULL, related_name="summaries_created")

    class Meta:
        db_table = "course_summaries"
        ordering = ["course", "sort_order"]
        verbose_name_plural = "course summaries"

    def __str__(self):
        return f"{self.course} / {self.title}"
