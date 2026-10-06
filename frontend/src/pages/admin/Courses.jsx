import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { adminApi } from "../../api/endpoints";
import { useFeedback } from "../../components/Feedback";
import FormFields, { cleanPayload } from "../../components/FormFields";
import useAsync from "../../components/useAsync";
import { Badge, Button, Empty, Loading, Modal, PageHead, Spinner } from "../../components/ui";
import { errorMessage, fieldErrors } from "../../utils/errors";

export const LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export const COURSE_FIELDS = [
  { name: "title", label: "Course title", required: true, placeholder: "Oracle DBA" },
  { name: "resume_label", label: "Skill label on resume", placeholder: "Backup & Recovery", hint: "Leave empty to use the course title" },
  { name: "level", label: "Level", type: "select", options: LEVELS },
  { name: "duration_hours", label: "Duration (hours)", type: "number" },
  { name: "short_description", label: "Short description", full: true },
  { name: "description", label: "Full description", type: "textarea" },
  { name: "thumbnail_url", label: "Thumbnail image URL", type: "url", full: true },
  { name: "skills_covered", label: "Skills covered", type: "tags", full: true, placeholder: "RMAN, Data Guard, RAC" },
];

const TOPIC_FIELDS = [
  { name: "title", label: "Topic name", required: true, full: true, placeholder: "RMAN", hint: "Shown as a skill on the resume" },
  { name: "description", label: "Description", type: "textarea", rows: 3 },
  { name: "sort_order", label: "Order", type: "number", hint: "Lower numbers show first" },
];

const CONTENT_FIELDS = [
  { name: "title", label: "Title", required: true, placeholder: "What is RMAN?" },
  { name: "content_type", label: "Type", type: "select", options: [{ value: "text", label: "Text" }, { value: "image", label: "Image" }] },
  { name: "body", label: "Content", type: "textarea", rows: 6, hint: "For an image, paste the image URL here." },
  { name: "sort_order", label: "Order", type: "number" },
];

/* ---------- One reusable popup for course, topic, and content forms ---------- */
function FormModal({ state, onClose, onSaved }) {
  const fb = useFeedback();
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (state) { setForm(state.initial || {}); setErrors({}); }
  }, [state]);

  if (!state) return null;

  const submit = async (e) => {
    e?.preventDefault();
    setBusy(true);
    try {
      const saved = await state.save(cleanPayload(state.fields, form));
      fb.success(state.successText);
      onSaved?.(saved);
      onClose();
    } catch (err) {
      setErrors(fieldErrors(err));
      fb.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open title={state.title} onClose={onClose} wide={state.fields.length > 3}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={busy}>{state.submitText}</Button></>}>
      <form onSubmit={submit}>
        <FormFields fields={state.fields} values={form} errors={errors} onChange={setForm} />
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

/* ---------- Topic row: click to open its contents ---------- */
function TopicRow({ topic, open, onToggle, openForm, onChanged }) {
  const fb = useFeedback();
  const [contents, setContents] = useState(null);

  const loadContents = () => adminApi.topicContents.list({ topic: topic.id }).then(setContents).catch((e) => fb.error(errorMessage(e)));
  useEffect(() => { if (open && contents === null) loadContents(); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const afterContentChange = () => { loadContents(); onChanged(); };

  const addContent = () => openForm({
    title: `Add content to ${topic.title}`, fields: CONTENT_FIELDS, initial: { content_type: "text", sort_order: (contents?.length || 0) },
    submitText: "Add content", successText: "Content added",
    save: (data) => adminApi.topicContents.create({ ...data, topic: topic.id }),
    after: afterContentChange,
  });

  const editContent = (c) => openForm({
    title: "Edit content", fields: CONTENT_FIELDS, initial: c, submitText: "Save changes", successText: "Content updated",
    save: (data) => adminApi.topicContents.update(c.id, data), after: afterContentChange,
  });

  const deleteContent = async (c) => {
    if (!(await fb.confirm({ title: `Delete "${c.title}"?`, text: "This can't be undone.", confirmText: "Delete", danger: true }))) return;
    try { await adminApi.topicContents.remove(c.id); fb.success("Content deleted"); afterContentChange(); }
    catch (e) { fb.error(errorMessage(e)); }
  };

  const editTopic = () => openForm({
    title: "Edit topic", fields: TOPIC_FIELDS, initial: topic, submitText: "Save changes", successText: "Topic updated",
    save: (data) => adminApi.topics.update(topic.id, data), after: onChanged,
  });

  const deleteTopic = async () => {
    if (!(await fb.confirm({ title: `Delete topic "${topic.title}"?`, text: "Its contents are deleted too, and it leaves every student's skill line.", confirmText: "Delete topic", danger: true }))) return;
    try { await adminApi.topics.remove(topic.id); fb.success("Topic deleted"); onChanged(); }
    catch (e) { fb.error(errorMessage(e)); }
  };

  return (
    <li className={`topic ${open ? "open" : ""}`}>
      <div className="topic-head">
        <button className="topic-toggle" onClick={onToggle} aria-expanded={open}>
          <span className="caret" aria-hidden="true">›</span>
          <span className="topic-name">{topic.title}</span>
          <span className="muted small">{topic.contents_count} {topic.contents_count === 1 ? "content" : "contents"}</span>
        </button>
        <div className="row-actions">
          <Button variant="subtle" size="sm" onClick={editTopic}>Edit</Button>
          <Button variant="subtle" size="sm" onClick={deleteTopic} style={{ color: "var(--danger)" }}>Delete</Button>
        </div>
      </div>

      {open && (
        <div className="topic-body">
          {topic.description && <p className="muted small" style={{ marginBottom: 10 }}>{topic.description}</p>}
          {contents === null ? <Spinner /> : contents.length === 0 ? (
            <p className="muted small">No contents yet. Add notes or images students can study for this topic.</p>
          ) : (
            <ul className="content-list">
              {contents.map((c) => (
                <li key={c.id} className="content-item">
                  <div style={{ minWidth: 0 }}>
                    <div className="item-title">{c.title} {c.content_type === "image" && <Badge>Image</Badge>}</div>
                    {c.body && <p className="muted small content-preview">{c.body}</p>}
                  </div>
                  <div className="row-actions">
                    <Button variant="ghost" size="sm" onClick={() => editContent(c)}>Edit</Button>
                    <Button variant="danger" size="sm" onClick={() => deleteContent(c)}>Delete</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Button size="sm" onClick={addContent} style={{ marginTop: 10 }}>Add content</Button>
        </div>
      )}
    </li>
  );
}

/* ---------- Course card: click to open its topics ---------- */
function CourseCard({ course, open, onToggle, openForm, onCourseChanged }) {
  const fb = useFeedback();
  const [topics, setTopics] = useState(null);
  const [openTopic, setOpenTopic] = useState(null);

  const loadTopics = () => adminApi.topics.list({ course: course.id }).then(setTopics).catch((e) => fb.error(errorMessage(e)));
  useEffect(() => { if (open && topics === null) loadTopics(); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = () => { loadTopics(); onCourseChanged(); };

  const addTopic = (e) => {
    e.stopPropagation();
    openForm({
      title: `Add topic to ${course.title}`, fields: TOPIC_FIELDS, initial: { sort_order: course.topics_count },
      submitText: "Add topic", successText: "Topic added",
      save: (data) => adminApi.topics.create({ ...data, course: course.id }),
      after: (saved) => { refresh(); if (!open) onToggle(); setOpenTopic(saved.id); },
    });
  };

  const level = LEVELS.find((l) => l.value === course.level)?.label;

  return (
    <article className={`pick course-card ${open ? "open selected" : ""}`}>
      <button className="course-toggle" onClick={onToggle} aria-expanded={open}>
        <div className="pick-top">
          <h3>{course.title}</h3>
          <Badge>{level}</Badge>
        </div>
        <p className="muted small">On resume as "{course.resume_label || course.title}"</p>
        {course.short_description && <p className="muted small">{course.short_description}</p>}
      </button>

      <div className="pick-foot">
        <span className="muted small">{course.topics_count} {course.topics_count === 1 ? "topic" : "topics"}</span>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="ghost" size="sm" onClick={onToggle}>{open ? "Close" : "View topics"}</Button>
          <Button size="sm" onClick={addTopic}>Add topic</Button>
        </div>
      </div>

      {open && (
        <div className="course-body">
          {topics === null ? <Spinner /> : topics.length === 0 ? (
            <p className="muted">No topics yet. Use Add topic to create the first one, like RMAN or Data Pump.</p>
          ) : (
            <ul className="topic-list">
              {topics.map((t) => (
                <TopicRow key={t.id} topic={t} open={openTopic === t.id}
                  onToggle={() => setOpenTopic(openTopic === t.id ? null : t.id)}
                  openForm={openForm} onChanged={refresh} />
              ))}
            </ul>
          )}
          <div className="course-more">
            <span className="muted small">Projects, summaries, and course settings</span>
            <Link className="btn btn-ghost btn-sm" to={`/admin/courses/${course.id}`}>Manage course</Link>
          </div>
        </div>
      )}
    </article>
  );
}

/* ---------- Page ---------- */
export default function Courses() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const { data, loading, reload } = useAsync(() => adminApi.courses.list(search ? { search } : undefined), [search]);
  const [openCourse, setOpenCourse] = useState(null);
  const [formState, setFormState] = useState(null);

  const addCourse = () => setFormState({
    title: "Add course", fields: COURSE_FIELDS, initial: { level: "beginner" },
    submitText: "Add course", successText: "Course added. Now add its topics.",
    save: (data) => adminApi.courses.create(data),
    after: (saved) => { reload(); setOpenCourse(saved.id); },
  });

  useEffect(() => {
    if (params.get("new") === "1") { addCourse(); setParams({}); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <PageHead title="Courses" text="Each course becomes a skill line on the resume, with its topics as the skills listed. Open a course to manage its topics."
        actions={<Button onClick={addCourse}>Add course</Button>} />
      <div className="toolbar">
        <input className="input" type="search" placeholder="Search courses" aria-label="Search courses"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading && !data ? <Loading /> : !data?.length ? (
        <section className="panel">
          <Empty title={search ? "No courses match" : "No courses yet"}
            text={search ? "Try a different name." : "Add a course, then open it to add topics and their contents."}
            action={!search && <Button onClick={addCourse}>Add course</Button>} />
        </section>
      ) : (
        <div className="pick-grid">
          {data.map((c) => (
            <CourseCard key={c.id} course={c} open={openCourse === c.id}
              onToggle={() => setOpenCourse(openCourse === c.id ? null : c.id)}
              openForm={setFormState} onCourseChanged={reload} />
          ))}
        </div>
      )}

      <FormModal state={formState} onClose={() => setFormState(null)} onSaved={(saved) => formState?.after?.(saved)} />
    </>
  );
}
