"""Student APIs. Every view is scoped to the logged-in student's own rows."""
from django.db.models import Exists, OuterRef, Prefetch
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers as drf_serializers
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsStudentRole
from catalog.models import Course, CourseProject, CourseSummary, CourseTopic, ProjectContent, TopicContent
from .models import (StudentCertification, StudentCourse, StudentEducation, StudentExperience, StudentProject,
                     StudentSummary)
from .serializers import (CourseDetailReadSerializer, CourseListReadSerializer, StudentCertificationSerializer,
                          StudentCourseSerializer, StudentEducationSerializer, StudentExperienceSerializer,
                          StudentProfileSerializer, StudentProjectSerializer, StudentSummarySerializer,
                          SummaryOptionSerializer)
from .services import (build_resume, refresh_header_status, remove_course_selection, set_course_topics,
                       set_topic_contents)


class StudentMixin:
    """Gives every view `self.student` and blocks non-students / unchanged temp passwords."""
    permission_classes = [IsStudentRole]

    @property
    def student(self):
        return self.request.user.student_profile

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["student"] = self.student
        return ctx


class OwnedViewSet(StudentMixin, viewsets.ModelViewSet):
    """CRUD limited to rows where student = me; student is set automatically on create."""
    model = None

    def get_queryset(self):
        return self.model.objects.filter(student=self.student)

    def perform_create(self, serializer):
        serializer.save(student=self.student)


# =============== Header / profile ===============
class ProfileView(StudentMixin, APIView):
    """GET / PATCH /api/student/profile/  -> the resume header"""

    def get(self, request):
        return Response(StudentProfileSerializer(self.student).data)

    def patch(self, request):
        s = StudentProfileSerializer(self.student, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        student = refresh_header_status(s.save())
        return Response(StudentProfileSerializer(student).data)

    put = patch


# =============== Catalog browsing (read-only) ===============
class CatalogViewSet(StudentMixin, viewsets.ReadOnlyModelViewSet):
    """
    GET /api/student/catalog/courses/                 all courses (?search=)
    GET /api/student/catalog/courses/{id}/            topics + contents, projects + published contents
    GET /api/student/catalog/courses/with-summaries/  courses for the summary step
    GET /api/student/catalog/courses/{id}/summaries/  summaries of ONE course
    """

    def get_queryset(self):
        picked = StudentCourse.objects.filter(student=self.student, course=OuterRef("pk"))
        qs = Course.objects.annotate(is_selected=Exists(picked))
        if q := self.request.query_params.get("search"):
            qs = qs.filter(title__icontains=q)
        if self.action == "retrieve":
            picked_proj = StudentProject.objects.filter(student=self.student, project=OuterRef("pk"))
            qs = qs.prefetch_related(
                Prefetch("topics", queryset=CourseTopic.objects.prefetch_related(
                    Prefetch("contents", queryset=TopicContent.objects.order_by("sort_order")))),
                Prefetch("projects", queryset=CourseProject.objects.annotate(is_selected=Exists(picked_proj))
                         .prefetch_related(Prefetch("contents", to_attr="published_contents",
                                                    queryset=ProjectContent.objects.filter(is_published=True)))),
            )
        else:
            qs = qs.prefetch_related("topics")
        return qs

    def get_serializer_class(self):
        return CourseDetailReadSerializer if self.action == "retrieve" else CourseListReadSerializer

    @action(detail=False, url_path="with-summaries")
    def with_summaries(self, request):
        has_summary = CourseSummary.objects.filter(course=OuterRef("pk"), is_published=True)
        courses = Course.objects.filter(Exists(has_summary)).values("id", "title")
        return Response(list(courses))

    @action(detail=True)
    def summaries(self, request, pk=None):
        course = get_object_or_404(Course, pk=pk)
        options = course.summaries.filter(is_published=True).order_by("sort_order")
        return Response(SummaryOptionSerializer(options, many=True).data)


# =============== Summary selection ===============
class SummarySelectionView(StudentMixin, APIView):
    """GET / PUT {course, summary} / DELETE  /api/student/summary/"""

    def get(self, request):
        sel = StudentSummary.objects.filter(student=self.student).select_related("course", "summary").first()
        return Response(StudentSummarySerializer(sel).data if sel else None)

    def put(self, request):
        existing = StudentSummary.objects.filter(student=self.student).first()
        s = StudentSummarySerializer(existing, data=request.data, context={"student": self.student})
        s.is_valid(raise_exception=True)
        s.save(student=self.student)
        return Response(s.data, status=status.HTTP_200_OK if existing else status.HTTP_201_CREATED)

    def delete(self, request):
        StudentSummary.objects.filter(student=self.student).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =============== Selections ===============
class MyCoursesViewSet(OwnedViewSet):
    """
    /api/student/my-courses/                 skills section. DELETE also removes that course's topics and projects.
    GET /api/student/my-courses/{id}/topics/ -> {"topics": [ids]} picked in this course
    PUT /api/student/my-courses/{id}/topics/ {"topics": [ids]} replaces the picked topics
    GET /api/student/my-courses/{id}/contents/ -> {"contents": [ids]} picked in this course
    PUT /api/student/my-courses/{id}/contents/ {"topic": id, "contents": [ids]} replaces one topic's picks
    """
    model = StudentCourse
    serializer_class = StudentCourseSerializer
    http_method_names = ["get", "post", "put", "patch", "delete"]

    def get_queryset(self):
        return super().get_queryset().select_related("course").order_by("course__title")

    def perform_update(self, serializer):
        status_value = serializer.validated_data.get("status")
        extra = {"completed_at": timezone.now()} if status_value == StudentCourse.Status.COMPLETED else {}
        serializer.save(**extra)

    def perform_destroy(self, instance):
        remove_course_selection(instance)

    @action(detail=True, methods=["get", "put"])
    def topics(self, request, pk=None):
        selection = self.get_object()
        if request.method == "PUT":
            ids = request.data.get("topics")
            if not isinstance(ids, list):
                raise drf_serializers.ValidationError({"topics": "Send a list of topic ids."})
            try:
                set_course_topics(selection, ids)
            except ValueError as e:
                raise drf_serializers.ValidationError({"topics": str(e)})
        chosen = (selection.student.topic_selections.filter(topic__course_id=selection.course_id)
                  .order_by("topic__sort_order").values_list("topic_id", flat=True))
        return Response({"topics": list(chosen)})

    @action(detail=True, methods=["get", "put"])
    def contents(self, request, pk=None):
        selection = self.get_object()
        if request.method == "PUT":
            ids = request.data.get("contents")
            if not isinstance(ids, list) or request.data.get("topic") is None:
                raise drf_serializers.ValidationError({"contents": "Send a topic id and a list of content ids."})
            try:
                set_topic_contents(selection, request.data["topic"], ids)
            except ValueError as e:
                raise drf_serializers.ValidationError({"contents": str(e)})
        chosen = (selection.student.content_selections.filter(content__topic__course_id=selection.course_id)
                  .values_list("content_id", flat=True))
        return Response({"contents": list(chosen)})


class MyProjectsViewSet(OwnedViewSet):
    """/api/student/my-projects/  (?course=<id>)"""
    model = StudentProject
    serializer_class = StudentProjectSerializer
    http_method_names = ["get", "post", "patch", "delete"]

    def get_queryset(self):
        qs = super().get_queryset().select_related("project__course", "experience")
        if cid := self.request.query_params.get("course"):
            qs = qs.filter(project__course_id=cid)
        return qs.order_by("project__course__title", "project__sort_order")

    def perform_update(self, serializer):
        status_value = serializer.validated_data.get("status")
        extra = {"completed_at": timezone.now()} if status_value == StudentProject.Status.COMPLETED else {}
        serializer.save(**extra)


# =============== Entries ===============
class ExperienceViewSet(OwnedViewSet):
    """/api/student/experiences/"""
    model = StudentExperience
    serializer_class = StudentExperienceSerializer


class EducationViewSet(OwnedViewSet):
    """/api/student/education/"""
    model = StudentEducation
    serializer_class = StudentEducationSerializer


class CertificationViewSet(OwnedViewSet):
    """/api/student/certifications/  (?type=certification|award)"""
    model = StudentCertification
    serializer_class = StudentCertificationSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if t := self.request.query_params.get("type"):
            qs = qs.filter(type=t)
        return qs


# =============== Full resume ===============
class ResumeView(StudentMixin, APIView):
    """GET /api/student/resume/ -> everything the React templates need, in resume order."""

    def get(self, request):
        return Response(build_resume(self.student))