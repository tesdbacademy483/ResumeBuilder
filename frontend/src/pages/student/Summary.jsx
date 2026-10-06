import { useEffect, useState } from "react";
import { studentApi } from "../../api/endpoints";
import { useFeedback } from "../../components/Feedback";
import NextStep from "../../components/NextStep";
import useAsync from "../../components/useAsync";
import { Badge, Button, Empty, Loading, PageHead, Select } from "../../components/ui";
import { useProgress } from "../../layouts/StudentLayout";
import { errorMessage } from "../../utils/errors";

export default function Summary() {
  const fb = useFeedback();
  const { refreshProgress } = useProgress();
  const { data, loading } = useAsync(async () => {
    const [courses, current] = await Promise.all([studentApi.catalog.withSummaries(), studentApi.summary.get()]);
    return { courses, current };
  });
  const [current, setCurrent] = useState(null);
  const [courseId, setCourseId] = useState("");
  const [summaryId, setSummaryId] = useState("");
  const [options, setOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);

  // Start from the saved choice, if there is one
  useEffect(() => {
    if (!data) return;
    setCurrent(data.current);
    if (data.current) {
      setCourseId(String(data.current.course));
      setSummaryId(String(data.current.summary));
    }
  }, [data]);

  // Load summaries whenever the course changes
  useEffect(() => {
    if (!courseId) { setOptions([]); return; }
    setLoadingOptions(true);
    studentApi.catalog.summaries(courseId)
      .then(setOptions)
      .catch((err) => fb.error(errorMessage(err)))
      .finally(() => setLoadingOptions(false));
  }, [courseId]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeCourse = (value) => {
    setCourseId(value);
    setSummaryId("");
  };

  const save = async () => {
    setSaving(true);
    try {
      const saved = await studentApi.summary.set(Number(courseId), Number(summaryId));
      setCurrent(saved);
      fb.success("Summary saved");
      refreshProgress();
    } catch (err) {
      fb.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;
  const preview = options.find((o) => String(o.id) === summaryId);
  const unchanged = current && String(current.summary) === summaryId;

  return (
    <>
      <PageHead title="Professional summary"
        text="Choose the course that matches the job you want, then choose the summary that describes you best." />

      {!data.courses.length ? (
        <section className="panel"><Empty title="No summaries available yet" text="Your admin hasn't added summaries to any course. Check back later." /></section>
      ) : (
        <section className="panel">
          <div className="form-grid">
            <Select label="Course" value={courseId} onChange={(e) => changeCourse(e.target.value)}
              placeholder="Choose a course" options={data.courses.map((c) => ({ value: c.id, label: c.title }))} />
            <Select label="Summary" value={summaryId} onChange={(e) => setSummaryId(e.target.value)}
              disabled={!courseId || loadingOptions}
              placeholder={!courseId ? "Choose a course first" : loadingOptions ? "Loading summaries" : options.length ? "Choose a summary" : "No summaries for this course"}
              options={options.map((o) => ({ value: o.id, label: o.title }))} />
          </div>

          {preview && (
            <div className="summary-preview">
              <div className="pick-top" style={{ marginBottom: 6 }}>
                <span className="field-label">Preview</span>
                {unchanged && <Badge tone="green">On your resume</Badge>}
              </div>
              <p>{preview.body}</p>
            </div>
          )}

          <div className="form-actions">
            <Button onClick={save} loading={saving} disabled={!summaryId || unchanged}>
              {unchanged ? "Saved" : current ? "Replace my summary" : "Use this summary"}
            </Button>
          </div>
        </section>
      )}

      {current && !unchanged && (
        <section className="panel">
          <div className="pick-top" style={{ marginBottom: 6 }}>
            <h3>Currently on your resume</h3>
            <Badge>{current.course_title}</Badge>
          </div>
          <p className="muted">{current.summary_text}</p>
        </section>
      )}
      <NextStep current="summary" />
    </>
  );
}