import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { studentApi } from "../../api/endpoints";
import { useFeedback } from "../../components/Feedback";
import FormFields, { cleanPayload } from "../../components/FormFields";
import NextStep from "../../components/NextStep";
import useAsync from "../../components/useAsync";
import { Button, Loading, PageHead } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useProgress } from "../../layouts/StudentLayout";
import { errorMessage, fieldErrors } from "../../utils/errors";

const FIELDS = [
  { name: "full_name", label: "Full name", required: true, placeholder: "Gopinath J" },
  { name: "headline", label: "Job title or headline", required: true, placeholder: "Oracle Database Administrator" },
  { name: "contact_email", label: "Email on resume", type: "email", required: true },
  { name: "phone", label: "Phone", type: "tel", required: true, placeholder: "+91 98765 43210" },
  { name: "city", label: "City", required: true, placeholder: "Chennai" },
  { name: "state", label: "State", placeholder: "Tamil Nadu" },
  { name: "country", label: "Country", placeholder: "India" },
  { name: "date_of_birth", label: "Date of birth", type: "date" },
  { name: "address", label: "Address", type: "textarea", rows: 2 },
  { name: "linkedin_url", label: "LinkedIn URL", type: "url" },
  { name: "github_url", label: "GitHub URL", type: "url" },
  { name: "portfolio_url", label: "Portfolio URL", type: "url", full: true },
];

export default function Header() {
  const fb = useFeedback();
  const navigate = useNavigate();
  const { user, refreshMe } = useAuth();
  const { refreshProgress } = useProgress();
  const { data, loading } = useAsync(() => studentApi.profile.get());
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (data) setForm({ ...data, contact_email: data.contact_email || data.login_email }); }, [data]);

  if (loading) return <Loading />;
  const firstTime = !user.header_completed;

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const saved = await studentApi.profile.update(cleanPayload(FIELDS, form));
      fb.success("Header saved");
      await refreshMe();
      refreshProgress();
      if (firstTime && saved.header_completed_at) navigate("/student/summary");
      else if (!saved.header_completed_at) fb.error("Fill in every required field to unlock the other sections.");
    } catch (err) {
      setErrors(fieldErrors(err));
      fb.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHead title={firstTime ? "Welcome. Let's start with your header" : "Header"}
        text="This is the top of your resume: who you are and how employers can reach you. Fields marked * are required." />
      <section className="panel">
        <FormFields fields={FIELDS} values={form} errors={errors} onChange={setForm} />
        <div className="form-actions">
          <Button onClick={save} loading={saving}>{firstTime ? "Save and continue" : "Save changes"}</Button>
        </div>
      </section>
      {!firstTime && <NextStep current="header" />}
    </>
  );
}
