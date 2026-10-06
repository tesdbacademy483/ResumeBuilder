import { useEffect, useState } from "react";
import { listProjects, addProject, deleteProject } from "../../api/students";

const EMPTY = { title: "", description: "", tech_stack: "", project_url: "", github_url: "" };

export default function ProjectForm() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);

  const load = () => listProjects().then((res) => setItems(res.data));
  useEffect(() => { load(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addProject(form);
    setForm(EMPTY);
    load();
  };

  return (
    <div className="card">
      <h3>Projects</h3>
      <form onSubmit={handleSubmit}>
        <input name="title" value={form.title} onChange={handleChange} placeholder="Project title" required />
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" rows={3} />
        <input name="tech_stack" value={form.tech_stack} onChange={handleChange} placeholder="Tech stack (comma separated)" />
        <input name="project_url" value={form.project_url} onChange={handleChange} placeholder="Live URL" />
        <input name="github_url" value={form.github_url} onChange={handleChange} placeholder="GitHub URL" />
        <button type="submit">Add project</button>
      </form>
      <ul>
        {items.map((p) => (
          <li key={p.id}>
            {p.title} — {p.tech_stack}
            <button onClick={() => deleteProject(p.id).then(load)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
