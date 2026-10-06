import { Link } from "react-router-dom";
import { adminApi } from "../../api/endpoints";
import useAsync from "../../components/useAsync";
import { Loading, PageHead } from "../../components/ui";
import { StatusBadge } from "./Students";
import { timeAgo } from "../../utils/format";

export default function Dashboard() {
  const { data, loading } = useAsync(async () => {
    const [students, courses] = await Promise.all([adminApi.students.list(), adminApi.courses.list()]);
    return { students, courses };
  });

  if (loading || !data) return <Loading />;
  const count = (status) => data.students.filter((s) => s.onboarding_status === status).length;

  return (
    <>
      <PageHead title="Overview" text="Where your students are in building their resumes."
        actions={<Link className="btn btn-primary" to="/admin/students?new=1">Create student login</Link>} />

      <div className="stats">
        <div className="stat"><div className="stat-value">{data.students.length}</div><div className="stat-label">Student logins</div></div>
        <div className="stat"><div className="stat-value">{count("waiting_first_login")}</div><div className="stat-label">Waiting for first login</div></div>
        <div className="stat"><div className="stat-value">{count("header_pending")}</div><div className="stat-label">Header not filled yet</div></div>
        <div className="stat"><div className="stat-value" style={{ color: "var(--accent)" }}>{count("building_resume")}</div><div className="stat-label">Building their resume</div></div>
        <div className="stat"><div className="stat-value">{data.courses.length}</div><div className="stat-label">Courses</div></div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Recently added students</h2>
          <Link to="/admin/students">See all students</Link>
        </div>
        {data.students.length === 0 ? (
          <p className="muted">No students yet. Create a login and share it with your first student.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Student</th><th>Status</th><th>Last sign-in</th></tr></thead>
              <tbody>
                {data.students.slice(0, 6).map((s) => (
                  <tr key={s.id}>
                    <td><div>{s.student_name || "Name not added yet"}</div><div className="muted small">{s.email}</div></td>
                    <td><StatusBadge status={s.onboarding_status} /></td>
                    <td className="muted">{timeAgo(s.last_login)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {data.courses.length === 0 && (
        <section className="panel">
          <h2>Add your first course</h2>
          <p className="muted" style={{ margin: "6px 0 14px" }}>Students pick courses to build their skills, projects, and summary.</p>
          <Link className="btn btn-ghost" to="/admin/courses?new=1">Add course</Link>
        </section>
      )}
    </>
  );
}
