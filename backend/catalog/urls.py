"""All /api/admin/ routes: catalog CRUD + student login management."""
from rest_framework.routers import DefaultRouter

from accounts.views import AdminStudentLoginViewSet
from . import views

router = DefaultRouter()
router.register("students", AdminStudentLoginViewSet, basename="admin-students")
router.register("courses", views.CourseViewSet, basename="admin-courses")
router.register("topics", views.CourseTopicViewSet, basename="admin-topics")
router.register("topic-contents", views.TopicContentViewSet, basename="admin-topic-contents")
router.register("projects", views.CourseProjectViewSet, basename="admin-projects")
router.register("project-contents", views.ProjectContentViewSet, basename="admin-project-contents")
router.register("summaries", views.CourseSummaryViewSet, basename="admin-summaries")

urlpatterns = router.urls
