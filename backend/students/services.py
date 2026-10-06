"""Student business logic: header completion, course removal, and assembling the full resume."""
from django.db import transaction
from django.db.models import Prefetch
from django.utils import timezone

from catalog.models import CourseTopic, ProjectContent, TopicContent
from .models import Student, StudentCourse, StudentProject, StudentTopic, StudentTopicContent

HEADER_REQUIRED_FIELDS = ["full_name", "headline", "contact_email", "phone", "city"]


def refresh_header_status(student: Student) -> Student:
    """Mark the header complete once every required field is filled (and clear it if one is emptied)."""
    complete = all(getattr(student, f) for f in HEADER_REQUIRED_FIELDS)
    if complete and not student.header_completed_at:
        student.header_completed_at = timezone.now()
        student.save(update_fields=["header_completed_at", "updated_at"])
    elif not complete and student.header_completed_at:
        student.header_completed_at = None
        student.save(update_fields=["header_completed_at", "updated_at"])
    return student


@transaction.atomic
def remove_course_selection(selection: StudentCourse) -> None:
    """Unselecting a course also unselects its topics, their contents, and its projects."""
    StudentTopicContent.objects.filter(student_id=selection.student_id,
                                       content__topic__course_id=selection.course_id).delete()
    StudentTopic.objects.filter(student_id=selection.student_id,
                                topic__course_id=selection.course_id).delete()
    StudentProject.objects.filter(student_id=selection.student_id,
                                  project__course_id=selection.course_id).delete()
    selection.delete()


@transaction.atomic
def set_course_topics(selection: StudentCourse, topic_ids: list) -> list[int]:
    """Replace the student's picked topics for one course with exactly `topic_ids`."""
    try:
        wanted = {int(t) for t in topic_ids}
    except (TypeError, ValueError):
        raise ValueError("Topics must be a list of topic ids.")
    valid = set(CourseTopic.objects.filter(course_id=selection.course_id, id__in=wanted)
                .values_list("id", flat=True))
    if wanted - valid:
        raise ValueError("Some topics don't belong to this course.")
    current = StudentTopic.objects.filter(student_id=selection.student_id, topic__course_id=selection.course_id)
    # Topics being removed take their picked contents with them
    StudentTopicContent.objects.filter(student_id=selection.student_id, content__topic__course_id=selection.course_id) \
        .exclude(content__topic_id__in=wanted).delete()
    current.exclude(topic_id__in=wanted).delete()
    existing = set(current.values_list("topic_id", flat=True))
    StudentTopic.objects.bulk_create(
        [StudentTopic(student_id=selection.student_id, topic_id=t) for t in wanted - existing])
    return sorted(wanted)


@transaction.atomic
def set_topic_contents(selection: StudentCourse, topic_id, content_ids: list) -> list[int]:
    """Replace the student's picked contents for one topic (inside this course) with exactly `content_ids`."""
    try:
        topic_id = int(topic_id)
        wanted = {int(c) for c in content_ids}
    except (TypeError, ValueError):
        raise ValueError("Send a topic id and a list of content ids.")
    if not CourseTopic.objects.filter(id=topic_id, course_id=selection.course_id).exists():
        raise ValueError("This topic doesn't belong to this course.")
    if not StudentTopic.objects.filter(student_id=selection.student_id, topic_id=topic_id).exists():
        raise ValueError("Select this topic first.")
    valid = set(TopicContent.objects.filter(topic_id=topic_id, id__in=wanted).values_list("id", flat=True))
    if wanted - valid:
        raise ValueError("Some contents don't belong to this topic.")
    current = StudentTopicContent.objects.filter(student_id=selection.student_id, content__topic_id=topic_id)
    current.exclude(content_id__in=wanted).delete()
    existing = set(current.values_list("content_id", flat=True))
    StudentTopicContent.objects.bulk_create(
        [StudentTopicContent(student_id=selection.student_id, content_id=c) for c in wanted - existing])
    return sorted(wanted)


def _project_dict(sp: StudentProject) -> dict:
    p = sp.project
    return {
        "id": sp.id,
        "project_id": p.id,
        "title": p.title,
        "client_name": sp.client_name,
        "tech_stack": p.tech_stack,
        "bullets": [c.body for c in p.resume_bullets],
        "github_link": sp.github_link,
        "live_link": sp.live_link,
        "notes": sp.custom_notes,
        "status": sp.status,
    }


def build_resume(student: Student) -> dict:
    """Everything a resume template needs, in resume order, in one response."""
    student = (Student.objects
               .select_related("user", "summary_selection__summary", "summary_selection__course")
               .prefetch_related("experiences", "education", "certifications")
               .get(pk=student.pk))

    # ---- summary (admin-written, student-picked) ----
    sel = getattr(student, "summary_selection", None)
    summary = ({"course": sel.course.title, "title": sel.summary.title, "text": sel.summary.body}
               if sel and sel.summary.is_published else None)

    # ---- core technical skills: course label + its topic titles ----
    course_sels = (StudentCourse.objects.filter(student=student, show_on_resume=True)
                   .select_related("course")
                   .prefetch_related(Prefetch("course__topics", queryset=CourseTopic.objects.order_by("sort_order")))
                   .order_by("course__title"))
    # Course -> topics -> contents, strictly from the student's selections:
    # a topic line appears only if the student selected at least one of its contents,
    # and it lists only those contents. A course appears only if it has such a topic.
    picked_topics = set(StudentTopic.objects.filter(student=student).values_list("topic_id", flat=True))
    picked_contents = {}
    for sc in (StudentTopicContent.objects.filter(student=student).select_related("content")
               .order_by("content__sort_order", "content__id")):
        picked_contents.setdefault(sc.content.topic_id, []).append(sc.content.title)

    skills = []
    for cs in course_sels:
        topic_lines = [{"title": t.title, "items": picked_contents[t.id]}
                       for t in cs.course.topics.all()
                       if t.id in picked_topics and picked_contents.get(t.id)]
        if topic_lines:
            skills.append({
                "category": cs.course.resume_label or cs.course.title,
                "items": [t["title"] for t in topic_lines],
                "topics": topic_lines,
            })

    # ---- projects with published bullet points ----
    bullets_qs = ProjectContent.objects.filter(is_published=True, is_resume_point=True).order_by("sort_order")
    project_sels = list(StudentProject.objects.filter(student=student, show_on_resume=True)
                        .select_related("project")
                        .prefetch_related(Prefetch("project__contents", queryset=bullets_qs,
                                                   to_attr="resume_bullets"))
                        .order_by("project__sort_order"))

    # ---- experience, with linked projects grouped under each job ----
    experience = []
    for e in student.experiences.all():
        experience.append({
            "id": e.id,
            "company_name": e.company_name,
            "job_title": e.job_title,
            "location": e.location,
            "start_date": e.start_date,
            "end_date": e.end_date,
            "is_current": e.is_current,
            "description": e.description,
            "projects": [_project_dict(sp) for sp in project_sels if sp.experience_id == e.id],
        })

    certs = list(student.certifications.all())
    header = {
        "full_name": student.full_name,
        "headline": student.headline,
        "email": student.contact_email or student.user.email,
        "phone": student.phone,
        "city": student.city,
        "state": student.state,
        "country": student.country,
        "linkedin_url": student.linkedin_url,
        "github_url": student.github_url,
        "portfolio_url": student.portfolio_url,
    }
    resume = {
        "header": header,
        "summary": summary,
        "skills": skills,
        "experience": experience,
        "projects": [_project_dict(sp) for sp in project_sels if sp.experience_id is None],
        "education": [{"id": ed.id, "degree": ed.degree, "specialization": ed.specialization,
                       "institution": ed.institution, "location": ed.location,
                       "passing_year": ed.passing_year, "score": ed.score}
                      for ed in student.education.all()],
        "certifications": [{"id": c.id, "title": c.title, "issuer": c.issuer, "issue_date": c.issue_date,
                            "credential_url": c.credential_url, "badge_url": c.badge_url}
                           for c in certs if c.type == "certification"],
        "awards": [{"id": c.id, "title": c.title, "issuer": c.issuer, "issue_date": c.issue_date}
                   for c in certs if c.type == "award"],
        "additional_info": student.additional_info,
    }
    resume["completion"] = {
        "header": bool(student.header_completed_at),
        "summary": summary is not None,
        "skills": bool(skills),
        "projects": bool(project_sels),
        "experience": bool(experience),
        "education": bool(resume["education"]),
        "certifications": bool(certs),
    }
    return resume