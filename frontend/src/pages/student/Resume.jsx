import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { studentApi } from "../../api/endpoints";
import ResumeView from "../../components/ResumeView";
import useAsync from "../../components/useAsync";
import { Button, Loading, PageHead } from "../../components/ui";
import { STEPS } from "../../layouts/StudentLayout";

const TEMPLATES = [
  { id: "classic", label: "Classic" },
  { id: "sidebar", label: "Sidebar" },
  { id: "bold", label: "Bold header" },
];

export default function Resume() {
  const { data, loading } = useAsync(() => studentApi.resume());
  const [template, setTemplate] = useState(() => localStorage.getItem("resume-template") || "classic");
  useEffect(() => { localStorage.setItem("resume-template", template); }, [template]);

  if (loading || !data) return <Loading />;
  const missing = STEPS.filter((s) => s.key && !data.completion[s.key] && s.key !== "experience");

  return (
    <>
      <PageHead title="Your resume" text="Pick a layout, then download it as a PDF."
        actions={<Button onClick={() => window.print()}>Download PDF</Button>} />

      {missing.length > 0 && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          Still empty: {missing.map((s, i) => (
            <span key={s.path}>{i > 0 && ", "}<Link to={`/student/${s.path}`}>{s.label.toLowerCase()}</Link></span>
          ))}. Your resume works without them, but it's stronger with them.
        </div>
      )}

      <div className="toolbar" role="group" aria-label="Resume layout">
        {TEMPLATES.map((t) => (
          <button key={t.id} className="chip" aria-pressed={template === t.id} onClick={() => setTemplate(t.id)}>{t.label}</button>
        ))}
      </div>
      <p className="muted small" style={{ marginBottom: 12 }}>In the print window, choose "Save as PDF" as the destination.</p>
      <div className="paper-stage"><ResumeView resume={data} template={template} /></div>
    </>
  );
}
