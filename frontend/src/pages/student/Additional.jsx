import { useEffect, useState } from "react";
import { studentApi } from "../../api/endpoints";
import { useFeedback } from "../../components/Feedback";
import NextStep from "../../components/NextStep";
import useAsync from "../../components/useAsync";
import { Button, Loading, PageHead, Textarea } from "../../components/ui";
import { errorMessage } from "../../utils/errors";

export default function Additional() {
  const fb = useFeedback();
  const { data, loading } = useAsync(() => studentApi.profile.get());
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (data) setText(data.additional_info || ""); }, [data]);

  const save = async () => {
    setSaving(true);
    try {
      await studentApi.profile.update({ additional_info: text });
      fb.success("Additional information saved");
    } catch (err) {
      fb.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;
  return (
    <>
      <PageHead title="Additional information" text="Optional. Anything useful that doesn't fit elsewhere: languages, platforms, availability, or interests." />
      <section className="panel">
        <Textarea label="Additional information" rows={6} value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Oracle 12c and 19c on Linux and Red Hat environments." />
        <div className="form-actions"><Button onClick={save} loading={saving}>Save</Button></div>
      </section>
      <NextStep current="additional" />
    </>
  );
}
