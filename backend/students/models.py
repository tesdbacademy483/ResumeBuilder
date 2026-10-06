"""Student side: profile (teal), selections (pink), entries (blue)."""
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, Q

from catalog.models import Course, CourseProject, CourseSummary, CourseTopic, TimeStampedModel, TopicContent


class ValidatedModel(TimeStampedModel):
    """Runs clean() on every save, so cross-table rules can't be skipped."""

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    class Meta:
        abstract = True


# ---------------- Student profile (teal) ----------------
class Student(TimeStampedModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                related_name="student_profile")
    # Header: all filled by the student after first login
    full_name = models.CharField(max_length=150, blank=True)
    headline = models.CharField(max_length=255, blank=True)  # "Oracle Database Administrator"
    contact_email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    linkedin_url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)
    portfolio_url = models.URLField(blank=True)
    additional_info = models.TextField(blank=True)
    header_completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "students"

    def __str__(self):
        return self.full_name or self.user.email


# ---------------- Student entries (blue) ----------------
class StudentExperience(TimeStampedModel):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="experiences")
    company_name = models.CharField(max_length=200)
    job_title = models.CharField(max_length=150)
    location = models.CharField(max_length=150, blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "student_experiences"
        ordering = ["student", "sort_order", "-start_date"]
        constraints = [
            models.CheckConstraint(condition=Q(is_current=True) | Q(end_date__isnull=False),
                                   name="experience_end_date_required"),
            models.CheckConstraint(condition=Q(end_date__isnull=True) | Q(end_date__gte=F("start_date")),
                                   name="experience_end_after_start"),
        ]

    def __str__(self):
        return f"{self.job_title} at {self.company_name}"


class StudentEducation(TimeStampedModel):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="education")
    degree = models.CharField(max_length=150)
    specialization = models.CharField(max_length=150, blank=True)
    institution = models.CharField(max_length=255)
    location = models.CharField(max_length=150, blank=True)
    passing_year = models.PositiveSmallIntegerField(null=True, blank=True)
    score = models.CharField(max_length=20, blank=True)  # "70%" or "8.2 CGPA"
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "student_education"
        ordering = ["student", "sort_order"]

    def __str__(self):
        return f"{self.degree}, {self.institution}"


class StudentCertification(TimeStampedModel):
    class Type(models.TextChoices):
        CERTIFICATION = "certification", "Certification"
        AWARD = "award", "Award"

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="certifications")
    type = models.CharField(max_length=15, choices=Type.choices, default=Type.CERTIFICATION)
    title = models.CharField(max_length=255)
    issuer = models.CharField(max_length=200, blank=True)
    issue_date = models.DateField(null=True, blank=True)
    credential_url = models.URLField(blank=True)
    badge_url = models.URLField(blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "student_certifications"
        ordering = ["student", "type", "sort_order"]

    def __str__(self):
        return self.title


# ---------------- Student selections (pink) ----------------
class StudentCourse(TimeStampedModel):
    class Status(models.TextChoices):
        ENROLLED = "enrolled", "Enrolled"
        IN_PROGRESS = "in_progress", "In progress"
        COMPLETED = "completed", "Completed"
        DROPPED = "dropped", "Dropped"

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="course_selections")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="student_selections")
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.ENROLLED)
    show_on_resume = models.BooleanField(default=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "student_courses"
        constraints = [models.UniqueConstraint(fields=["student", "course"], name="uniq_student_course")]

    def __str__(self):
        return f"{self.student} → {self.course}"


class StudentTopic(ValidatedModel):
    """Topics a student picked inside one of their selected courses. Printed as the skill items."""
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="topic_selections")
    topic = models.ForeignKey(CourseTopic, on_delete=models.CASCADE, related_name="student_selections")

    class Meta:
        db_table = "student_topics"
        constraints = [models.UniqueConstraint(fields=["student", "topic"], name="uniq_student_topic")]

    def clean(self):
        if self.student_id and self.topic_id and not StudentCourse.objects.filter(
                student_id=self.student_id, course_id=self.topic.course_id).exists():
            raise ValidationError("Add this topic's course to your skills first.")

    def __str__(self):
        return f"{self.student} → {self.topic}"


class StudentTopicContent(ValidatedModel):
    """Contents a student studied inside one of their selected topics."""
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="content_selections")
    content = models.ForeignKey(TopicContent, on_delete=models.CASCADE, related_name="student_selections")

    class Meta:
        db_table = "student_topic_contents"
        constraints = [models.UniqueConstraint(fields=["student", "content"], name="uniq_student_content")]

    def clean(self):
        if self.student_id and self.content_id and not StudentTopic.objects.filter(
                student_id=self.student_id, topic_id=self.content.topic_id).exists():
            raise ValidationError("Select this content's topic first.")

    def __str__(self):
        return f"{self.student} → {self.content}"


class StudentProject(ValidatedModel):
    class Status(models.TextChoices):
        SELECTED = "selected", "Selected"
        IN_PROGRESS = "in_progress", "In progress"
        COMPLETED = "completed", "Completed"

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="project_selections")
    project = models.ForeignKey(CourseProject, on_delete=models.CASCADE, related_name="student_selections")
    experience = models.ForeignKey(StudentExperience, null=True, blank=True, on_delete=models.SET_NULL,
                                   related_name="projects")  # optional: show under a job
    client_name = models.CharField(max_length=200, blank=True)  # "Comcast, USA"
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.SELECTED)
    github_link = models.URLField(blank=True)
    live_link = models.URLField(blank=True)
    custom_notes = models.TextField(blank=True)
    show_on_resume = models.BooleanField(default=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "student_projects"
        constraints = [models.UniqueConstraint(fields=["student", "project"], name="uniq_student_project")]

    def clean(self):
        if self.student_id and self.project_id and not StudentCourse.objects.filter(
                student_id=self.student_id, course_id=self.project.course_id).exists():
            raise ValidationError("Select the project's course before selecting the project.")
        if self.experience_id and self.experience.student_id != self.student_id:
            raise ValidationError({"experience": "This experience belongs to another student."})

    def __str__(self):
        return f"{self.student} → {self.project}"


class StudentSummary(ValidatedModel):
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name="summary_selection")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="+")
    summary = models.ForeignKey(CourseSummary, on_delete=models.CASCADE, related_name="student_selections")

    class Meta:
        db_table = "student_summaries"
        verbose_name_plural = "student summaries"

    def clean(self):
        if self.summary_id and self.course_id and self.summary.course_id != self.course_id:
            raise ValidationError({"summary": "This summary does not belong to the selected course."})

    def __str__(self):
        return f"{self.student} → {self.summary}"