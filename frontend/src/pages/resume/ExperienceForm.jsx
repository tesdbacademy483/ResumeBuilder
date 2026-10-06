import { useEffect, useState } from "react";
import { listExperience, addExperience, deleteExperience } from "../../api/students";

const EMPTY = { company: "", role: "", start_date: "", end_date: "", description: "" };

export default function ExperienceForm() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  const load = () => listExperience().then((res) => setItems(res.data));
  useEffect(() => { load(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await addExperience(form);
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(err.response?.data?.non_field_errors?.[0] || "Could not save.");
    }
  };

  return (
    <div className="card">
      <h3>Experience</h3>
      <form onSubmit={handleSubmit}>
        <input name="company" value={form.company} onChange={handleChange} placeholder="Company" required />
        <input name="role" value={form.role} onChange={handleChange} placeholder="Role / title" required />
        <label>Start date</label>
        <input name="start_date" type="date" value={form.start_date} onChange={handleChange} required />
        <label>End date (blank if current)</label>
        <input name="end_date" type="date" value={form.end_date} onChange={handleChange} />
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="What did you do?" rows={3} />
        {error && <p className="error">{error}</p>}
        <button type="submit">Add experience</button>
      </form>
      <ul>
        {items.map((exp) => (
          <li key={exp.id}>
            {exp.role} at {exp.company} ({exp.start_date} – {exp.end_date || "present"})
            <button onClick={() => deleteExperience(exp.id).then(load)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
