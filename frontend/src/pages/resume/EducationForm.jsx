import { useEffect, useState } from "react";
import { listEducation, addEducation, deleteEducation } from "../../api/students";

const EMPTY = { institution: "", degree: "", field_of_study: "", start_year: "", end_year: "", grade: "" };

export default function EducationForm() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  const load = () => listEducation().then((res) => setItems(res.data));
  useEffect(() => { load(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await addEducation(form);
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(err.response?.data?.non_field_errors?.[0] || "Could not save.");
    }
  };

  return (
    <div className="card">
      <h3>Education</h3>
      <form onSubmit={handleSubmit}>
        <input name="institution" value={form.institution} onChange={handleChange} placeholder="Institution" required />
        <input name="degree" value={form.degree} onChange={handleChange} placeholder="Degree (e.g. B.Tech)" required />
        <input name="field_of_study" value={form.field_of_study} onChange={handleChange} placeholder="Field of study" />
        <input name="start_year" type="number" value={form.start_year} onChange={handleChange} placeholder="Start year" required />
        <input name="end_year" type="number" value={form.end_year} onChange={handleChange} placeholder="End year (blank if ongoing)" />
        <input name="grade" value={form.grade} onChange={handleChange} placeholder="Grade / CGPA" />
        {error && <p className="error">{error}</p>}
        <button type="submit">Add education</button>
      </form>
      <ul>
        {items.map((edu) => (
          <li key={edu.id}>
            {edu.degree} — {edu.institution} ({edu.start_year}–{edu.end_year || "present"})
            <button onClick={() => deleteEducation(edu.id).then(load)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
