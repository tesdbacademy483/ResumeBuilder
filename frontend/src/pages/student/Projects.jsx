import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { studentApi } from "../../api/endpoints";
import { useFeedback } from "../../components/Feedback";
import FormFields, { cleanPayload } from "../../components/FormFields";
import NextStep from "../../components/NextStep";
import useAsync from "../../components/useAsync";
import { Badge, Button, Empty, Loading, Modal, PageHead, Select } from "../../components/ui";
import { useProgress } from "../../layouts/StudentLayout";
import { errorMessage, fieldErrors } from "../../utils/errors";

function projectFields(experiences) {
  return [
    { name: "experience", label: "Show under job", type: "select", nullable: true, full: true,
      placeholder: "Don't link to a job (show in the Projects section)",
      options: experiences.map((e) => ({ value: e.id, label: `${e.job_title}, ${e.company_name}` })),
      hint: experiences.length ? undefined : "Add jobs in Experience to link projects to them." },
    { name: "client_name", label: "Client or project name on resume", placeholder: "Comcast, USA", full: true },
    { name: "github_link", label: "GitHub link", type: "url" },
    { name: "live_link", label: "Live demo link", type: "url" },
    { name: "custom_notes", label: "Your notes", type: "textarea", rows: 3 },
    { name: "show_on_resume", label: "Show on resume", type: "checkbox" },
  ];
}

function toPayload(fields, form) {
  const payload = cleanPayload(fields, form);
  payload.experience = payload.experience ? Number(payload.experience) : null;
  return payload;
}

function ProjectPreview({ project }) {
  const bullets = project.contents.filter((c) => c.is_resume_point);
  return (
    <div className="summary-preview">
      <div className="pick-top" style={{ marginBottom: 6 }}>
        <h3>{project.title}</h3>
        <Badge>{project.difficulty.charAt(0).toUpperCase() + project.difficulty.slice(1)}</Badge>
      </div>
      {project.short_description && <p className="muted small">{project.short_description}</p>}
      {project.tech_stack?.length > 0 && <div className="chips" style={{ margin: "8px 0" }}>{project.tech_stack.map((t) => <span key={t} className="chip">{t}</span>)}</div>}
      {bullets.length > 0 && <ul className="bullets">{bullets.map((b) => <li key={b.id}>{b.body}</li>)}</ul>}
    </div>
  );
}

export default function Projects() {
  const fb = useFeedback();
  const { refreshProgress } = useProgress();
  const { data, loading, reload } = useAsync(async () => {
    const [myCourses, myProjects, experiences] = await Promise.all([
      studentApi.myCourses.list(), studentApi.myProjects.list(), studentApi.experiences.list(),
    ]);
    const courses = await Promise.all(myCourses.map((mc) => studentApi.catalog.get(mc.course)));
    return { courses, myProjects, experiences };
  });

  const [courseId, setCourseId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [form, setForm] = useState({ show_on_resume: true, experience: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null); // selection being edited
  const [editForm, setEditForm] = useState({});

  useEffect(() => { setProjectId(""); }, [courseId]);

  if (loading && !data) return <Loading />;

  const fields = projectFields(data.experiences);
  const pickedIds = new Set(data.myProjects.map((p) => p.project));
  const course = data.courses.find((c) => String(c.id) === courseId);
  const available = course ? course.projects.filter((p) => !pickedIds.has(p.id)) : [];
  const project = available.find((p) => String(p.id) === projectId);
  const allProjects = Object.fromEntries(data.courses.flatMap((c) => c.projects.map((p) => [p.id, p])));

  const add = async () => {
    setSaving(true);
    setErrors({});
    try {
      await studentApi.myProjects.create({ ...toPayload(fields, form), project: Number(projectId) });
      fb.success(`${project.title} added to your resume`);
      setProjectId("");
      setForm({ show_on_resume: true, experience: "" });
      await reload();
      refreshProgress();
    } catch (err) {
      setErrors(fieldErrors(err));
      fb.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (sel) => {
    setEditForm({ ...sel, experience: sel.experience ?? "" });
    setErrors({});
    setEditing(sel);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await studentApi.myProjects.update(editing.id, toPayload(fields, editForm));
      fb.success("Project updated");
      setEditing(null);
      await reload();
    } catch (err) {
      setErrors(fieldErrors(err));
      fb.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (sel) => {
    const ok = await fb.confirm({ title: `Remove ${sel.project_title}?`, text: "It leaves your resume. You can add it again anytime.", confirmText: "Remove", danger: true });
    if (!ok) return;
    try {
      await studentApi.myProjects.remove(sel.id);
      fb.success("Project removed");
      await reload();
      refreshProgress();
    } catch (err) {
      fb.error(errorMessage(err));
    }
  };

  return (
    <>
      <PageHead title="Projects" text="Choose a course, then one of its projects. Each project prints with its bullet points, under a job or on its own." />

      {!data.courses.length ? (
        <section className="panel">
          <Empty title="Add a skill first" text="Projects come from the courses in your skills. Add a course in Skills to see its projects here."
            action={<Link className="btn btn-primary" to="/student/skills">Go to skills</Link>} />
        </section>
      ) : (
        <section className="panel">
          <h2 style={{ marginBottom: 12 }}>Add a project</h2>
          <div className="form-grid">
            <Select label="Course" value={courseId} onChange={(e) => setCourseId(e.target.value)}
              placeholder="Choose a course" options={data.courses.map((c) => ({ value: c.id, label: c.title }))} />
            <Select label="Project" value={projectId} onChange={(e) => setProjectId(e.target.value)}
              disabled={!course || !available.length}
              placeholder={!course ? "Choose a course first" : available.length ? "Choose a project" : "No more projects in this course"}
              options={available.map((p) => ({ value: p.id, label: p.title }))} />
          </div>

          {project && (
            <>
              <ProjectPreview project={project} />
              <div style={{ marginTop: 16 }}>
                <FormFields fields={fields} values={form} errors={errors} onChange={setForm} />
              </div>
              <div className="form-actions">
                <Button onClick={add} loading={saving}>Add to resume</Button>
              </div>
            </>
          )}
        </section>
      )}

      {data.myProjects.length > 0 && (
        <section className="panel">
          <h2 style={{ marginBottom: 12 }}>Your projects</h2>
          <div className="item-list">
            {data.myProjects.map((sel) => {
              const job = sel.experience && data.experiences.find((e) => e.id === sel.experience);
              const bullets = (allProjects[sel.project]?.contents || []).filter((c) => c.is_resume_point);
              return (
                <div key={sel.id} className="item">
                  <div className="item-body">
                    <div className="item-title">
                      {sel.project_title} <Badge>{sel.course_title}</Badge> {!sel.show_on_resume && <Badge tone="warn">Hidden</Badge>}
                    </div>
                    <div className="item-sub">
                      {job ? `Under ${job.job_title}, ${job.company_name}` : "In the Projects section"}
                      {sel.client_name && ` as "${sel.client_name}"`}
                    </div>
                    {bullets.length > 0 && <ul className="bullets" style={{ marginTop: 6 }}>{bullets.map((b) => <li key={b.id}>{b.body}</li>)}</ul>}
                  </div>
                  <div className="row-actions">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(sel)}>Edit</Button>
                    <Button variant="danger" size="sm" onClick={() => remove(sel)}>Remove</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <Modal open={!!editing} title={`Edit ${editing?.project_title}`} onClose={() => setEditing(null)} wide
        footer={<><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={saveEdit} loading={saving}>Save changes</Button></>}>
        <FormFields fields={fields} values={editForm} errors={errors} onChange={setEditForm} />
      </Modal>
      <NextStep current="projects" />
    </>
  );
}