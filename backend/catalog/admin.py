from django.contrib import admin
from .models import Course, CourseProject, CourseSummary, CourseTopic, ProjectContent, TopicContent


class TopicInline(admin.TabularInline):
    model = CourseTopic
    extra = 0


class ProjectInline(admin.TabularInline):
    model = CourseProject
    extra = 0
    fields = ("title", "difficulty", "sort_order")


class SummaryInline(admin.StackedInline):
    model = CourseSummary
    extra = 0


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("title", "resume_label", "level", "created_at")
    search_fields = ("title",)
    prepopulated_fields = {"slug": ("title",)}
    inlines = [TopicInline, ProjectInline, SummaryInline]


class TopicContentInline(admin.StackedInline):
    model = TopicContent
    extra = 0


@admin.register(CourseTopic)
class CourseTopicAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "sort_order")
    list_filter = ("course",)
    inlines = [TopicContentInline]


class ProjectContentInline(admin.StackedInline):
    model = ProjectContent
    extra = 0


@admin.register(CourseProject)
class CourseProjectAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "difficulty", "sort_order")
    list_filter = ("course",)
    inlines = [ProjectContentInline]