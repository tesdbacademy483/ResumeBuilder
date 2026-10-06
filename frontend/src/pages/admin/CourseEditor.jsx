import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { adminApi } from "../../api/endpoints";
import CrudSection from "../../components/CrudSection";
import { useFeedback } from "../../components/Feedback";
import FormFields, { cleanPayload } from "../../components/FormFields";
import useAsync from "../../components/useAsync";
import { Badge, Button, Empty, Loading, PageHead } from "../../components/ui";
import { errorMessage, fieldErrors } from "../../utils/errors";
import { COURSE_FIELDS, LEVELS } from "./Courses";

const CONTENT_TYPES = [{ value: "text", label: "Text" }, { value: "image", label: "Image" }];

const TOPIC_FIELDS = [
  { name: "title", label: "Topic", required: true, placeholder: "RMAN", hint: "Shown as a skill on the resume" },
  { name: "sort_order", label: "Order", type: "number" },
  { name: "description", label: "Description", type: "textarea" },
];
const TOPIC_CONTENT_FIELDS = [
  { name: "title", label: "Title", required: true },
  { name: "content_type", label: "Type", type: "select", options: CONTENT_TYPES },
  { name: "body", label: "Content", type: "textarea", rows: 6, hint: "For an image, paste the image URL here." },
  { name: "sort_order", label: "Order", type: "number" },
];
const PROJECT_FIELDS = [
  { name: "title", label: "Project title", required: true },
  { name: "difficulty", label: "Difficulty", type: "select", options: LEVELS },
  { name: "short_description", label: "Short description", full: true },
  { name: "description", label: "Full description", type: "textarea" },
  { name: "tech_stack", label: "Tech stack", type: "tags", placeholder: "Oracle 19c, RMAN, Linux" },
  { name: "sort_order", label: "Order", type: "number" },
];
const PROJECT_CONTENT_FIELDS = [
  { name: "title", label: "Title" },
  { name: "content_type", label: "Type", type: "select", options: CONTENT_TYPES },
  { name: "body", label: "Text", type: "textarea", hint: "For a resume bullet, write one achievement sentence." },
  { name: "media_url", label: "Image URL", type: "url", full: true, hint: "Required when type is Image" },
  { name: "sort_order", label: "Order", type: "number" },
  { name: "is_resume_point", label: "Print this on the resume as a bullet point", type: "checkbox" },
  { name: "is_published", label: "Visible to students", type: "checkbox" },
];
const SUMMARY_FIELDS = [
  { name: "title", label: "Summary name", required: true, placeholder: "Python developer (fresher)", hint: "Students see this name when choosing" },
  { name: "sort_order", label: "Order", type: "number" },
  { name: "body", label: "Summary text", type: "textarea", required: true, rows: 6 },
  { name: "is_published", label: "Visible to students", type: "checkbox" },
];

const TABS = [
  { id: "topics", label: "Topics" },
  { id: "projects", label: "Projects" },
  { id: "summaries", label: "Summaries" },
  { id: "details", label: "Course details" },
];

export default function CourseEditor() {
  const { id } = useParams();
  const courseId = Number(id);
  const fb = useFeedback();
  const navigate = useNavigate();
  const [tab, setTab] = useState("topics");
  const { data: course, loading, reload } = useAsync(() => adminApi.courses.get(courseId), [courseId]);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (course) setForm(course); }, [course]);

  if (loading) return <Loading />;
  if (!course) return <Empty title="Course not found" action={<Link className="btn btn-ghost" to="/admin/courses">Back to courses</Link>} />;

  const saveDetails = async () => {
    setSaving(true);
    setErrors({});
    try {
      await adminApi.courses.update(courseId, cleanPayload(COURSE_FIELDS, form));
      fb.success("Course updated");
      reload();
    } catch (err) {
      setErrors(fieldErrors(err));
      fb.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const deleteCourse = async () => {
    const ok = await fb.confirm({
      title: `Delete "${course.title}"?`,
      text: "Its topics, projects, and summaries are deleted too, and it disappears from every student's resume.",
      confirmText: "Delete course",
      danger: true,
    });
    if (!ok) return;
    try {
      await adminApi.courses.remove(courseId);
      fb.success("Course deleted");
      navigate("/admin/courses");
    } catch (err) {
      fb.error(errorMessage(err));
    }
  };

  return (
    <>
      <PageHead title={course.title}
        text={`On resumes as "${course.resume_label || course.title}". ${LEVELS.find((l) => l.value === course.level)?.label} level.`}
        actions={<Link className="btn btn-ghost" to="/admin/courses">All courses</Link>} />

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" className="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {tab === "topics" && (
        <CrudSection api={adminApi.topics} params={{ course: courseId }} extra={{ course: courseId }}
          noun="Topic" title="Topics" fields={TOPIC_FIELDS} defaults={{ sort_order: 0 }} onChanged={reload}
          emptyText="Topics appear on the resume as the skills under this course, e.g. RMAN, Data Pump."
          renderItem={(t) => (<><div className="item-title">{t.title}</div>{t.description && <div className="item-sub">{t.description}</div>}<div className="muted small">{t.contents_count} learning items</div></>)}
          renderExpanded={(t) => (
            <CrudSection bare api={adminApi.topicContents} params={{ topic: t.id }} extra={{ topic: t.id }}
              noun="Content" title="Learning material" fields={TOPIC_CONTENT_FIELDS}
              defaults={{ content_type: "text", sort_order: 0 }}
              emptyText="Add notes or images students can study for this topic."
              renderItem={(c) => (<><div className="item-title">{c.title} <Badge>{c.content_type}</Badge></div><div className="item-sub">{c.body?.slice(0, 140)}</div></>)} />
          )} />
      )}

      {tab === "projects" && (
        <CrudSection api={adminApi.projects} params={{ course: courseId }} extra={{ course: courseId }}
          noun="Project" title="Projects" fields={PROJECT_FIELDS} defaults={{ difficulty: "beginner", sort_order: 0, tech_stack: [] }}
          onChanged={reload} emptyText="Students pick projects from this list to show on their resume."
          renderItem={(p) => (<>
            <div className="item-title">{p.title} <Badge>{LEVELS.find((l) => l.value === p.difficulty)?.label}</Badge></div>
            {p.short_description && <div className="item-sub">{p.short_description}</div>}
            {p.tech_stack?.length > 0 && <div className="chips" style={{ marginTop: 8 }}>{p.tech_stack.map((t) => <span key={t} className="chip">{t}</span>)}</div>}
          </>)}
          renderExpanded={(p) => (
            <CrudSection bare api={adminApi.projectContents} params={{ project: p.id }} extra={{ project: p.id }}
              noun="Content" title="Project content and resume bullets" fields={PROJECT_CONTENT_FIELDS}
              defaults={{ content_type: "text", is_resume_point: true, is_published: true, sort_order: 0 }}
              emptyText="Add resume bullet points like 'Automated nightly RMAN backups for 40 databases.'"
              renderItem={(c) => (<>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                  {c.is_resume_point && <Badge tone="green">Resume bullet</Badge>}
                  {!c.is_published && <Badge tone="warn">Hidden</Badge>}
                  {c.content_type === "image" && <Badge>Image</Badge>}
                </div>
                {c.title && <div className="item-title">{c.title}</div>}
                <div className="item-sub">{c.body || c.media_url}</div>
              </>)} />
          )} />
      )}

      {tab === "summaries" && (
        <CrudSection api={adminApi.summaries} params={{ course: courseId }} extra={{ course: courseId }}
          noun="Summary" title="Summaries" fields={SUMMARY_FIELDS} defaults={{ is_published: true, sort_order: 0 }}
          onChanged={reload} emptyText="Students who pick this course choose one of these as their professional summary."
          renderItem={(s) => (<>
            <div className="item-title">{s.title} {!s.is_published && <Badge tone="warn">Hidden</Badge>}</div>
            <div className="item-sub">{s.body}</div>
          </>)} />
      )}

      {tab === "details" && (
        <>
          <section className="panel">
            <FormFields fields={COURSE_FIELDS} values={form} errors={errors} onChange={setForm} />
            <div className="form-actions"><Button onClick={saveDetails} loading={saving}>Save changes</Button></div>
          </section>
          <section className="panel" style={{ borderColor: "rgba(255,138,128,.3)" }}>
            <div className="panel-head" style={{ marginBottom: 0 }}>
              <div><h2>Delete course</h2><p className="muted small">Removes it from every student's resume.</p></div>
              <Button variant="danger" onClick={deleteCourse}>Delete course</Button>
            </div>
          </section>
        </>
      )}
    </>
  );
}
