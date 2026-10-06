import { studentApi } from "../../api/endpoints";
import CrudSection from "../../components/CrudSection";
import NextStep from "../../components/NextStep";
import { Badge, PageHead } from "../../components/ui";
import { useProgress } from "../../layouts/StudentLayout";
import { dateRange, monthYear } from "../../utils/format";

const EXPERIENCE_FIELDS = [
  { name: "job_title", label: "Job title", required: true, placeholder: "Oracle DBA" },
  { name: "company_name", label: "Company", required: true, placeholder: "Tata Consultancy Services" },
  { name: "location", label: "Location", placeholder: "Chennai" },
  { name: "sort_order", label: "Order", type: "number", hint: "Lower numbers show first" },
  { name: "start_date", label: "Start date", type: "date", required: true },
  { name: "end_date", label: "End date", type: "date", disabledWhen: (v) => v.is_current },
  { name: "is_current", label: "I currently work here", type: "checkbox" },
  { name: "description", label: "Short description", type: "textarea", rows: 3,
    hint: "Optional. Projects you link to this job appear under it with their bullet points." },
];

const EDUCATION_FIELDS = [
  { name: "degree", label: "Degree", required: true, placeholder: "B.C.A." },
  { name: "specialization", label: "Specialization", placeholder: "Computer Applications" },
  { name: "institution", label: "Institution", required: true, full: true },
  { name: "location", label: "Location" },
  { name: "passing_year", label: "Year of passing", type: "number" },
  { name: "score", label: "Score", placeholder: "70% or 8.2 CGPA" },
  { name: "sort_order", label: "Order", type: "number" },
];

const CERT_FIELDS = [
  { name: "type", label: "Type", type: "select", options: [{ value: "certification", label: "Certification" }, { value: "award", label: "Award" }] },
  { name: "issue_date", label: "Date received", type: "date" },
  { name: "title", label: "Title", required: true, full: true, placeholder: "Oracle Certified Associate, Database Administration 12c" },
  { name: "issuer", label: "Issued by", placeholder: "Oracle" },
  { name: "sort_order", label: "Order", type: "number" },
  { name: "credential_url", label: "Credential link", type: "url", full: true },
  { name: "badge_url", label: "Badge image link", type: "url", full: true },
];

export function Experience() {
  const { refreshProgress } = useProgress();
  return (
    <>
      <PageHead title="Professional experience"
        text="Add your jobs, most recent first. Freshers can skip this and show projects on their own instead." />
      <CrudSection api={studentApi.experiences} noun="Job" title="Your jobs" fields={EXPERIENCE_FIELDS}
        defaults={{ is_current: false, sort_order: 0 }} onChanged={refreshProgress}
        emptyText="Add a job to show it on your resume."
        renderItem={(e) => (<>
          <div className="item-title">{e.job_title}, {e.company_name} {e.is_current && <Badge tone="green">Current</Badge>}</div>
          <div className="item-sub">{dateRange(e.start_date, e.end_date, e.is_current)}{e.location && `, ${e.location}`}</div>
        </>)} />
      <NextStep current="experience" />
    </>
  );
}

export function Education() {
  const { refreshProgress } = useProgress();
  return (
    <>
      <PageHead title="Education" text="Add your degrees and diplomas, highest first." />
      <CrudSection api={studentApi.education} noun="Degree" title="Your education" fields={EDUCATION_FIELDS}
        defaults={{ sort_order: 0 }} onChanged={refreshProgress} emptyText="Add a degree to show it on your resume."
        renderItem={(e) => (<>
          <div className="item-title">{e.degree}{e.specialization && ` (${e.specialization})`}</div>
          <div className="item-sub">{[e.institution, e.passing_year, e.score].filter(Boolean).join(", ")}</div>
        </>)} />
      <NextStep current="education" />
    </>
  );
}

export function Certifications() {
  const { refreshProgress } = useProgress();
  return (
    <>
      <PageHead title="Certifications and awards" text="Professional certifications and any awards or recognition you've received." />
      <CrudSection api={studentApi.certifications} noun="Item" title="Your certifications and awards" fields={CERT_FIELDS}
        defaults={{ type: "certification", sort_order: 0 }} onChanged={refreshProgress}
        emptyText="Add a certification or award to show it on your resume."
        renderItem={(c) => (<>
          <div className="item-title">{c.title} <Badge tone={c.type === "award" ? "warn" : "green"}>{c.type === "award" ? "Award" : "Certification"}</Badge></div>
          <div className="item-sub">{[c.issuer, monthYear(c.issue_date)].filter(Boolean).join(", ")}</div>
        </>)} />
      <NextStep current="certifications" />
    </>
  );
}
