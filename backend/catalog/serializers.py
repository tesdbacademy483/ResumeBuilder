from django.utils.text import slugify
from rest_framework import serializers

from .models import Course, CourseProject, CourseSummary, CourseTopic, ProjectContent, TopicContent


class TopicContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TopicContent
        fields = ["id", "topic", "title", "content_type", "body", "sort_order", "created_at", "updated_at"]


class CourseTopicSerializer(serializers.ModelSerializer):
    contents_count = serializers.IntegerField(source="contents.count", read_only=True)

    class Meta:
        model = CourseTopic
        fields = ["id", "course", "title", "description", "sort_order", "contents_count",
                  "created_at", "updated_at"]


class ProjectContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectContent
        fields = ["id", "project", "title", "content_type", "body", "media_url", "is_resume_point",
                  "sort_order", "is_published", "created_at", "updated_at"]

    def validate(self, attrs):
        content_type = attrs.get("content_type", getattr(self.instance, "content_type", "text"))
        media_url = attrs.get("media_url", getattr(self.instance, "media_url", ""))
        body = attrs.get("body", getattr(self.instance, "body", ""))
        if content_type == "image" and not media_url:
            raise serializers.ValidationError({"media_url": "Image content needs a media_url."})
        if attrs.get("is_resume_point") and not body:
            raise serializers.ValidationError({"body": "A resume bullet point needs text in body."})
        return attrs


class CourseProjectSerializer(serializers.ModelSerializer):
    created_by = serializers.EmailField(source="created_by.email", read_only=True)
    contents_count = serializers.IntegerField(source="contents.count", read_only=True)

    class Meta:
        model = CourseProject
        fields = ["id", "course", "title", "short_description", "description", "difficulty", "tech_stack",
                  "sort_order", "contents_count", "created_by", "created_at", "updated_at"]

    def validate_tech_stack(self, value):
        if not isinstance(value, list) or not all(isinstance(x, str) for x in value):
            raise serializers.ValidationError('Must be a list of strings, e.g. ["React", "Python"].')
        return value


class CourseSummarySerializer(serializers.ModelSerializer):
    created_by = serializers.EmailField(source="created_by.email", read_only=True)

    class Meta:
        model = CourseSummary
        fields = ["id", "course", "title", "body", "sort_order", "is_published", "created_by",
                  "created_at", "updated_at"]


class CourseSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(required=False, allow_blank=True)
    created_by = serializers.EmailField(source="created_by.email", read_only=True)
    topics_count = serializers.IntegerField(source="topics.count", read_only=True)
    projects_count = serializers.IntegerField(source="projects.count", read_only=True)
    summaries_count = serializers.IntegerField(source="summaries.count", read_only=True)

    class Meta:
        model = Course
        fields = ["id", "title", "slug", "short_description", "description", "resume_label", "level",
                  "duration_hours", "thumbnail_url", "skills_covered", "topics_count", "projects_count",
                  "summaries_count", "created_by", "created_at", "updated_at"]

    def validate(self, attrs):
        # auto-create a unique slug from the title when not given
        if not attrs.get("slug"):
            title = attrs.get("title") or getattr(self.instance, "title", "")
            if not self.instance or "title" in attrs:
                base = slugify(title) or "course"
                slug, n = base, 2
                qs = Course.objects.exclude(pk=getattr(self.instance, "pk", None))
                while qs.filter(slug=slug).exists():
                    slug, n = f"{base}-{n}", n + 1
                attrs["slug"] = slug
            else:
                attrs.pop("slug", None)
        return attrs


class CourseDetailSerializer(CourseSerializer):
    """Full tree for the admin course editor screen."""
    topics = CourseTopicSerializer(many=True, read_only=True)
    projects = CourseProjectSerializer(many=True, read_only=True)
    summaries = CourseSummarySerializer(many=True, read_only=True)

    class Meta(CourseSerializer.Meta):
        fields = CourseSerializer.Meta.fields + ["topics", "projects", "summaries"]
