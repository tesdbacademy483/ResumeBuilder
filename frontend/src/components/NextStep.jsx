import { Link } from "react-router-dom";
import { STEPS } from "../layouts/StudentLayout";

/** "Continue to X" link at the bottom of each student step. */
export default function NextStep({ current }) {
  const i = STEPS.findIndex((s) => s.path === current);
  const next = STEPS[i + 1];
  if (!next) return null;
  return (
    <div className="form-actions" style={{ marginTop: 24 }}>
      <Link className="btn btn-ghost" to={`/student/${next.path}`}>Continue to {next.label.toLowerCase()}</Link>
    </div>
  );
}
