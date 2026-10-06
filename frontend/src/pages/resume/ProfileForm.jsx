import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "../../api/students";

const EMPTY = {
  full_name: "", phone: "", address: "", linkedin_url: "",
  github_url: "", portfolio_url: "", summary: "",
};

export default function ProfileForm() {
  const [form, setForm] = useState(EMPTY);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getProfile().then((res) => setForm({ ...EMPTY, ...res.data }));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateProfile(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="card">
      <h3>Profile</h3>
      <form onSubmit={handleSubmit}>
        <input name="full_name" value={form.full_name} onChange={handleChange} placeholder="Full name" required />
        <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" />
        <input name="address" value={form.address} onChange={handleChange} placeholder="Address" />
        <input name="linkedin_url" value={form.linkedin_url} onChange={handleChange} placeholder="LinkedIn URL" />
        <input name="github_url" value={form.github_url} onChange={handleChange} placeholder="GitHub URL" />
        <input name="portfolio_url" value={form.portfolio_url} onChange={handleChange} placeholder="Portfolio URL" />
        <textarea name="summary" value={form.summary} onChange={handleChange} placeholder="Professional summary" rows={4} />
        <button type="submit">Save profile</button>
        {saved && <span> Saved!</span>}
      </form>
    </div>
  );
}
