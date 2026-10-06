from django.urls import path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("catalog/courses", views.CatalogViewSet, basename="student-catalog")
router.register("my-courses", views.MyCoursesViewSet, basename="my-courses")
router.register("my-projects", views.MyProjectsViewSet, basename="my-projects")
router.register("experiences", views.ExperienceViewSet, basename="experiences")
router.register("education", views.EducationViewSet, basename="education")
router.register("certifications", views.CertificationViewSet, basename="certifications")

urlpatterns = [
    path("profile/", views.ProfileView.as_view(), name="student-profile"),
    path("summary/", views.SummarySelectionView.as_view(), name="student-summary"),
    path("resume/", views.ResumeView.as_view(), name="student-resume"),
] + router.urls
