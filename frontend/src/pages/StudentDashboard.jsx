import { useState } from "react";
import { downloadResumePdf } from "../api/students";
import ProfileForm from "./resume/ProfileForm";
import EducationForm from "./resume/EducationForm";
import ExperienceForm from "./resume/ExperienceForm";
import ProjectForm from "./resume/ProjectForm";
import CertificationForm from "./resume/CertificationForm";
import SkillsForm from "./resume/SkillsForm";

const SECTIONS = {
  Profile: ProfileForm,
  Education: EducationForm,
  Experience: ExperienceForm,
  Projects: ProjectForm,
  Certifications: CertificationForm,
  Skills: SkillsForm,
};

export default function StudentDashboard() {
  const [tab, setTab] = useState("Profile");
  const [downloading, setDownloading] = useState(false);
  const ActiveSection = SECTIONS[tab];

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await downloadResumePdf();
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "resume.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="container">
      <nav style={{ marginBottom: 16 }}>
        {Object.keys(SECTIONS).map((s) => (
          <button key={s} onClick={() => setTab(s)} disabled={tab === s}>{s}</button>
        ))}
        <button onClick={handleDownload} disabled={downloading} style={{ background: "#27ae60" }}>
          {downloading ? "Generating..." : "Download resume PDF"}
        </button>
      </nav>
      <ActiveSection />
    </div>
  );
}
