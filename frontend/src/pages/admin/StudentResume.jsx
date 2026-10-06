import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { adminApi } from "../../api/endpoints";
import ResumeView from "../../components/ResumeView";
import useAsync from "../../components/useAsync";
import { Button, Empty, Loading, PageHead } from "../../components/ui";

export default function StudentResume() {
  const { id } = useParams();
  const [template, setTemplate] = useState("classic");
  const { data, loading, error } = useAsync(() => adminApi.students.resume(id), [id]);

  if (loading) return <Loading />;
  if (error || !data) return <Empty title="Resume not found" text="This student may have been removed." action={<Link className="btn btn-ghost" to="/admin/students">Back to students</Link>} />;

  return (
    <>
      <PageHead title={data.header.full_name || "Unnamed student"} text={data.header.headline || "Header not filled yet"}
        actions={<>
          <Link className="btn btn-ghost" to="/admin/students">Back to students</Link>
          <Button onClick={() => window.print()}>Download PDF</Button>
        </>} />
      <div className="toolbar">
        {["classic", "sidebar", "bold"].map((t) => (
          <button key={t} className="chip" aria-pressed={template === t} onClick={() => setTemplate(t)}>
            {t === "classic" ? "Classic" : t === "sidebar" ? "Sidebar" : "Bold header"}
          </button>
        ))}
      </div>
      <div className="paper-stage"><ResumeView resume={data} template={template} /></div>
    </>
  );
}
