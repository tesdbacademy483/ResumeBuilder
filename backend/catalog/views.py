from django.shortcuts import render
"""Admin-only CRUD for the whole catalog. Students read the catalog through students/views.py."""
from rest_framework import viewsets

from accounts.permissions import IsAdminRole
from .models import Course, CourseProject, CourseSummary, CourseTopic, ProjectContent, TopicContent
from .serializers import (CourseDetailSerializer, CourseProjectSerializer, CourseSerializer,
                          CourseSummarySerializer, CourseTopicSerializer, ProjectContentSerializer,
                          TopicContentSerializer)


class AdminCatalogViewSet(viewsets.ModelViewSet):
    """Base: admin only, optional ?<parent>=<id> filter, created_by filled automatically."""
    permission_classes = [IsAdminRole]
    parent_field = None  # e.g. "course" -> allows ?course=5

    def get_queryset(self):
        qs = super().get_queryset()
        if self.parent_field and (pid := self.request.query_params.get(self.parent_field)):
            qs = qs.filter(**{f"{self.parent_field}_id": pid})
        return qs

    def perform_create(self, serializer):
        model_fields = {f.name for f in serializer.Meta.model._meta.get_fields()}
        if "created_by" in model_fields:
            serializer.save(created_by=self.request.user)
        else:
            serializer.save()


class CourseViewSet(AdminCatalogViewSet):
    """/api/admin/courses/  (?search=python)"""
    queryset = Course.objects.select_related("created_by").all()

    def get_queryset(self):
        qs = super().get_queryset()
        if q := self.request.query_params.get("search"):
            qs = qs.filter(title__icontains=q)
        return qs

    def get_serializer_class(self):
        return CourseDetailSerializer if self.action == "retrieve" else CourseSerializer


class CourseTopicViewSet(AdminCatalogViewSet):
    """/api/admin/topics/?course=<id>"""
    queryset = CourseTopic.objects.all()
    serializer_class = CourseTopicSerializer
    parent_field = "course"


class TopicContentViewSet(AdminCatalogViewSet):
    """/api/admin/topic-contents/?topic=<id>"""
    queryset = TopicContent.objects.all()
    serializer_class = TopicContentSerializer
    parent_field = "topic"


class CourseProjectViewSet(AdminCatalogViewSet):
    """/api/admin/projects/?course=<id>"""
    queryset = CourseProject.objects.select_related("created_by").all()
    serializer_class = CourseProjectSerializer
    parent_field = "course"


class ProjectContentViewSet(AdminCatalogViewSet):
    """/api/admin/project-contents/?project=<id>"""
    queryset = ProjectContent.objects.all()
    serializer_class = ProjectContentSerializer
    parent_field = "project"


class CourseSummaryViewSet(AdminCatalogViewSet):
    """/api/admin/summaries/?course=<id>"""
    queryset = CourseSummary.objects.select_related("created_by").all()
    serializer_class = CourseSummarySerializer
    parent_field = "course"

