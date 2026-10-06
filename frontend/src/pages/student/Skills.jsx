import { useEffect, useState } from "react";
import { studentApi } from "../../api/endpoints";
import { useFeedback } from "../../components/Feedback";
import NextStep from "../../components/NextStep";
import useAsync from "../../components/useAsync";
import { Badge, Button, Checkbox, Empty, Loading, Modal, PageHead, Select } from "../../components/ui";
import { useProgress } from "../../layouts/StudentLayout";
import { errorMessage } from "../../utils/errors";

/* ---------- Popup: pick items from a dropdown, one at a time (used for topics and contents) ---------- */
function ItemPicker({ title, intro, label, items, initial, onSave, onClose, saveText }) {
  const fb = useFeedback();
  const [chosen, setChosen] = useState(initial);
  const [pick, setPick] = useState("");
  const [saving, setSaving] = useState(false);

  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const remaining = items.filter((i) => !chosen.includes(i.id));
  const ordered = items.filter((i) => chosen.includes(i.id));

  const add = () => {
    if (!pick) return;
    setChosen([...chosen, Number(pick)]);
    setPick("");
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave(chosen);
      onClose();
    } catch (err) {
      fb.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open title={title} onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} loading={saving}>{saveText}</Button></>}>
      <p className="muted" style={{ marginBottom: 16 }}>{intro}</p>

      {items.length === 0 ? <p className="muted">Nothing to select here yet.</p> : (
        <>
          <div className="picker-row">
            <Select label={label} value={pick} onChange={(e) => setPick(e.target.value)}
              placeholder={remaining.length ? `Choose ${label.toLowerCase()}` : "Everything is selected"}
              disabled={!remaining.length}
              options={remaining.map((i) => ({ value: i.id, label: i.title }))} />
            <Button variant="ghost" onClick={add} disabled={!pick}>Add</Button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {remaining.length > 1 && <Button variant="subtle" size="sm" onClick={() => setChosen(items.map((i) => i.id))}>Select all</Button>}
            {chosen.length > 1 && <Button variant="subtle" size="sm" onClick={() => setChosen([])}>Clear all</Button>}
          </div>

          <div className="divider" />
          <p className="field-label" style={{ marginBottom: 8 }}>Selected ({chosen.length} of {items.length})</p>
          {chosen.length === 0 ? <p className="muted small">None yet. Choose from the list above and click Add.</p> : (
            <div className="chips">
              {ordered.map((i) => (
                <span key={i.id} className="chip chip-removable">
                  {byId[i.id].title}
                  <button type="button" aria-label={`Remove ${i.title}`} onClick={() => setChosen(chosen.filter((c) => c !== i.id))}>×</button>
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

/* ---------- One selected topic, showing only the contents the student picked ---------- */
function TopicContents({ topic, skill, onChanged }) {
  const fb = useFeedback();
  const [picking, setPicking] = useState(false);
  const picked = topic.contents.filter((c) => skill.selected_contents.includes(c.id));

  return (
    <div className="topic-block">
      <div className="pick-top" style={{ alignItems: "center" }}>
        <div>
          <h3>{topic.title}</h3>
          <p className="muted small">
            {topic.contents.length === 0 ? "No study material for this topic yet."
              : `${picked.length} of ${topic.contents.length} contents selected`}
          </p>
        </div>
        {topic.contents.length > 0 && <Button variant="ghost" size="sm" onClick={() => setPicking(true)}>Select contents</Button>}
      </div>

      {topic.contents.length > 0 && picked.length === 0 && (
        <p className="muted small">Choose the contents you studied with Select contents.</p>
      )}
      {picked.length > 0 && (
        <div className="content-stack">
          {picked.map((c) => (
            <div key={c.id} className="content-card">
              <div className="item-title">{c.title}</div>
              {c.content_type === "image"
                ? <img src={c.body} alt={c.title} className="content-img" />
                : <p className="content-text">{c.body}</p>}
            </div>
          ))}
        </div>
      )}

      {picking && (
        <ItemPicker title={`Select contents for ${topic.title}`} label="Content"
          intro="Pick only the contents you have studied in this topic."
          items={topic.contents} initial={picked.map((c) => c.id)} saveText="Save contents"
          onSave={async (ids) => { await studentApi.myCourses.setContents(skill.id, topic.id, ids); fb.success("Contents saved"); onChanged(); }}
          onClose={() => setPicking(false)} />
      )}
    </div>
  );
}

/* ---------- One added skill ---------- */
function SkillPanel({ skill, detail, onChanged }) {
  const fb = useFeedback();
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  const selected = detail ? detail.topics.filter((t) => skill.selected_topics.includes(t.id)) : [];

  const toggleShow = async () => {
    setBusy(true);
    try { await studentApi.myCourses.update(skill.id, { show_on_resume: !skill.show_on_resume }); onChanged(); }
    catch (err) { fb.error(errorMessage(err)); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    const ok = await fb.confirm({
      title: `Remove ${skill.course_title}?`,
      text: "Its topics leave your resume, and any projects you picked from this course are removed too.",
      confirmText: "Remove skill", danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try { await studentApi.myCourses.remove(skill.id); fb.success(`${skill.course_title} removed`); onChanged(); }
    catch (err) { fb.error(errorMessage(err)); setBusy(false); }
  };

  return (
    <section className="panel">
      <div className="panel-head" style={{ alignItems: "flex-start" }}>
        <div>
          <h2>{skill.course_title}</h2>
          <p className="muted small">On resume as "{skill.resume_label || skill.course_title}"</p>
        </div>
        <div className="row-actions">
          <Button size="sm" onClick={() => setPicking(true)} disabled={!detail}>Select topics</Button>
          <Button variant="danger" size="sm" onClick={remove} loading={busy}>Remove</Button>
        </div>
      </div>

      {!detail ? <Loading /> : (
        <>
          {selected.length ? (
            <div className="chips">{selected.map((t) => <span key={t.id} className="chip chip-on">{t.title}</span>)}</div>
          ) : (
            <p className="muted small">No topics selected yet. Until you select some, all {detail.topics.length} topics of this course show on your resume.</p>
          )}
          <div style={{ marginTop: 12 }}>
            <Checkbox label="Show this skill on my resume" checked={skill.show_on_resume} disabled={busy} onChange={toggleShow} />
          </div>

          {selected.length > 0 && (
            <div className="course-body" style={{ marginTop: 16 }}>
              <h3 className="muted" style={{ fontSize: 14, fontWeight: 500 }}>Your topics and the contents you studied</h3>
              {selected.map((t) => <TopicContents key={t.id} topic={t} skill={skill} onChanged={onChanged} />)}
            </div>
          )}
        </>
      )}

      {picking && detail && (
        <ItemPicker title={`Select topics for ${skill.course_title}`} label="Topic"
          intro={`These topics print as your skills under "${skill.resume_label || skill.course_title}".`}
          items={detail.topics} initial={skill.selected_topics} saveText="Save topics"
          onSave={async (ids) => { await studentApi.myCourses.setTopics(skill.id, ids); fb.success("Topics saved"); onChanged(); }}
          onClose={() => setPicking(false)} />
      )}
    </section>
  );
}

/* ---------- Page ---------- */
export default function Skills() {
  const fb = useFeedback();
  const { refreshProgress } = useProgress();
  const { data, loading, error, reload } = useAsync(async () => {
    const [courses, mine] = await Promise.all([studentApi.catalog.list(), studentApi.myCourses.list()]);
    return { courses, mine };
  });
  const [details, setDetails] = useState({}); // courseId -> catalog detail (topics + contents)
  const [pick, setPick] = useState("");
  const [adding, setAdding] = useState(false);

  // Load topics and contents for every added skill
  useEffect(() => {
    if (!data) return;
    data.mine.forEach((m) => {
      if (!details[m.course]) {
        studentApi.catalog.get(m.course)
          .then((d) => setDetails((prev) => ({ ...prev, [m.course]: d })))
          .catch((err) => fb.error(errorMessage(err)));
      }
    });
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const changed = () => { reload(); refreshProgress(); };

  const addSkill = async () => {
    if (!pick) return;
    setAdding(true);
    try {
      const course = data.courses.find((c) => c.id === Number(pick));
      await studentApi.myCourses.create({ course: Number(pick) });
      fb.success(`${course.title} added. Now select its topics.`);
      setPick("");
      changed();
    } catch (err) {
      fb.error(errorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  if (!data) {
    if (loading) return <Loading />;
    return (
      <section className="panel">
        <Empty title="Couldn't load this page"
          text={errorMessage(error)}
          action={<Button variant="ghost" onClick={reload}>Try again</Button>} />
      </section>
    );
  }
  const addedIds = new Set(data.mine.map((m) => m.course));
  const available = data.courses.filter((c) => !addedIds.has(c.id));

  return (
    <>
      <PageHead title="Core technical skills"
        text="Add a course as a skill, then select the topics you know. Each skill prints as one line on your resume with your selected topics." />

      <section className="panel">
        <h2 style={{ marginBottom: 12 }}>Add a skill</h2>
        {data.courses.length === 0 ? <p className="muted">Your admin hasn't added any courses yet.</p> : (
          <div className="picker-row">
            <Select label="Course" value={pick} onChange={(e) => setPick(e.target.value)}
              placeholder={available.length ? "Choose a course" : "You've added every course"}
              disabled={!available.length}
              options={available.map((c) => ({ value: c.id, label: c.title }))} />
            <Button onClick={addSkill} loading={adding} disabled={!pick}>Add skill</Button>
          </div>
        )}
      </section>

      {data.mine.length === 0 ? (
        <section className="panel"><Empty title="No skills added yet" text="Choose a course above and click Add skill." /></section>
      ) : (
        data.mine.map((m) => (
          <SkillPanel key={m.id} skill={m} detail={details[m.course]} onChanged={changed} />
        ))
      )}

      {data.mine.length > 0 && <p className="muted small" style={{ marginTop: 12 }}><Badge tone="green">{data.mine.length}</Badge> skills on your resume</p>}
      <NextStep current="skills" />
    </>
  );
}