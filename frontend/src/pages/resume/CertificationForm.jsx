import { useEffect, useState } from "react";
import { listCertifications, addCertification, deleteCertification } from "../../api/students";

const EMPTY = { title: "", issued_by: "", issue_date: "", credential_url: "" };

export default function CertificationForm() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);

  const load = () => listCertifications().then((res) => setItems(res.data));
  useEffect(() => { load(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addCertification(form);
    setForm(EMPTY);
    load();
  };

  return (
    <div className="card">
      <h3>Certifications</h3>
      <form onSubmit={handleSubmit}>
        <input name="title" value={form.title} onChange={handleChange} placeholder="Certification title" required />
        <input name="issued_by" value={form.issued_by} onChange={handleChange} placeholder="Issued by" required />
        <label>Issue date</label>
        <input name="issue_date" type="date" value={form.issue_date} onChange={handleChange} required />
        <input name="credential_url" value={form.credential_url} onChange={handleChange} placeholder="Credential URL" />
        <button type="submit">Add certification</button>
      </form>
      <ul>
        {items.map((c) => (
          <li key={c.id}>
            {c.title} — {c.issued_by} ({c.issue_date})
            <button onClick={() => deleteCertification(c.id).then(load)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
