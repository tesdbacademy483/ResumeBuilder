from rest_framework import serializers

from catalog.models import Course, CourseProject, CourseSummary, CourseTopic, ProjectContent, TopicContent
from .models import (Student, StudentCertification, StudentCourse, StudentEducation, StudentExperience,
                     StudentProject, StudentSummary)


# =============== Profile / header ===============
class StudentProfileSerializer(serializers.ModelSerializer):
    login_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Student
        fields = ["id", "login_email", "full_name", "headline", "contact_email", "phone", "date_of_birth",
                  "address", "city", "state", "country", "linkedin_url", "github_url", "portfolio_url",
                  "additional_info", "header_completed_at", "updated_at"]
        read_only_fields = ["header_completed_at", "updated_at"]


# =============== Catalog (read-only for students) ===============
class TopicContentReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = TopicContent
        fields = ["id", "title", "content_type", "body", "sort_order"]


class TopicReadSerializer(serializers.ModelSerializer):
    contents = TopicContentReadSerializer(many=True, read_only=True)

    class Meta:
        model = CourseTopic
        fields = ["id", "title", "description", "sort_order", "contents"]


class ProjectContentReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectContent
        fields = ["id", "title", "content_type", "body", "media_url", "is_resume_point", "sort_order"]


class ProjectReadSerializer(serializers.ModelSerializer):
    contents = ProjectContentReadSerializer(many=True, read_only=True, source="published_contents")
    is_selected = serializers.BooleanField(read_only=True, default=False)

    class Meta:
        model = CourseProject
        fields = ["id", "title", "short_description", "description", "difficulty", "tech_stack",
                  "sort_order", "is_selected", "contents"]


class CourseListReadSerializer(serializers.ModelSerializer):
    is_selected = serializers.BooleanField(read_only=True)
    topics = serializers.SlugRelatedField(many=True, read_only=True, slug_field="title")

    class Meta:
        model = Course
        fields = ["id", "title", "slug", "short_description", "resume_label", "level", "duration_hours",
                  "thumbnail_url", "topics", "is_selected"]


class CourseDetailReadSerializer(CourseListReadSerializer):
    topics = TopicReadSerializer(many=True, read_only=True)
    projects = ProjectReadSerializer(many=True, read_only=True)

    class Meta(CourseListReadSerializer.Meta):
        fields = CourseListReadSerializer.Meta.fields + ["description", "skills_covered", "projects"]


class SummaryOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseSummary
        fields = ["id", "title", "body"]


# =============== Summary selection ===============
class StudentSummarySerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source="course.title", read_only=True)
    summary_title = serializers.CharField(source="summary.title", read_only=True)
    summary_text = serializers.CharField(source="summary.body", read_only=True)

    class Meta:
        model = StudentSummary
        fields = ["id", "course", "summary", "course_title", "summary_title", "summary_text", "updated_at"]

    def validate(self, attrs):
        summary, course = attrs["summary"], attrs["course"]
        if summary.course_id != course.id:
            raise serializers.ValidationError({"summary": "This summary does not belong to the selected course."})
        if not summary.is_published:
            raise serializers.ValidationError({"summary": "This summary is not available."})
        return attrs


# =============== Selections ===============
class StudentCourseSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source="course.title", read_only=True)
    resume_label = serializers.CharField(source="course.resume_label", read_only=True)
    selected_topics = serializers.SerializerMethodField()
    selected_contents = serializers.SerializerMethodField()

    class Meta:
        model = StudentCourse
        fields = ["id", "course", "course_title", "resume_label", "status", "show_on_resume",
                  "selected_topics", "selected_contents", "completed_at", "created_at"]
        read_only_fields = ["completed_at", "created_at"]

    def get_selected_topics(self, obj):
        return list(obj.student.topic_selections.filter(topic__course_id=obj.course_id)
                    .order_by("topic__sort_order").values_list("topic_id", flat=True))

    def get_selected_contents(self, obj):
        return list(obj.student.content_selections.filter(content__topic__course_id=obj.course_id)
                    .values_list("content_id", flat=True))

    def validate_course(self, course):
        if self.instance and self.instance.course_id != course.id:
            raise serializers.ValidationError("Course can't be changed. Remove it and select another.")
        student = self.context["student"]
        if not self.instance and StudentCourse.objects.filter(student=student, course=course).exists():
            raise serializers.ValidationError("You already selected this course.")
        return course


class StudentProjectSerializer(serializers.ModelSerializer):
    project_title = serializers.CharField(source="project.title", read_only=True)
    course = serializers.IntegerField(source="project.course_id", read_only=True)
    course_title = serializers.CharField(source="project.course.title", read_only=True)
    experience_title = serializers.SerializerMethodField()

    class Meta:
        model = StudentProject
        fields = ["id", "project", "project_title", "course", "course_title", "experience", "experience_title",
                  "client_name", "status", "github_link", "live_link", "custom_notes", "show_on_resume",
                  "completed_at", "created_at"]
        read_only_fields = ["completed_at", "created_at"]

    def get_experience_title(self, obj):
        return str(obj.experience) if obj.experience else None

    def validate_project(self, project):
        student = self.context["student"]
        if self.instance and self.instance.project_id != project.id:
            raise serializers.ValidationError("Project can't be changed. Remove it and select another.")
        if not self.instance and StudentProject.objects.filter(student=student, project=project).exists():
            raise serializers.ValidationError("You already selected this project.")
        if not StudentCourse.objects.filter(student=student, course_id=project.course_id).exists():
            raise serializers.ValidationError("Select this project's course first.")
        return project

    def validate_experience(self, experience):
        if experience and experience.student_id != self.context["student"].id:
            raise serializers.ValidationError("This experience belongs to another student.")
        return experience


# =============== Entries ===============
class StudentExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentExperience
        fields = ["id", "company_name", "job_title", "location", "start_date", "end_date", "is_current",
                  "description", "sort_order"]

    def validate(self, attrs):
        is_current = attrs.get("is_current", getattr(self.instance, "is_current", False))
        start = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if is_current:
            attrs["end_date"] = None
        elif not end:
            raise serializers.ValidationError({"end_date": "End date is required unless this is your current job."})
        elif start and end < start:
            raise serializers.ValidationError({"end_date": "End date can't be before start date."})
        return attrs


class StudentEducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentEducation
        fields = ["id", "degree", "specialization", "institution", "location", "passing_year", "score",
                  "sort_order"]

    def validate_passing_year(self, value):
        if value and not 1950 <= value <= 2100:
            raise serializers.ValidationError("Enter a valid year.")
        return value


class StudentCertificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentCertification
        fields = ["id", "type", "title", "issuer", "issue_date", "credential_url", "badge_url", "sort_order"]