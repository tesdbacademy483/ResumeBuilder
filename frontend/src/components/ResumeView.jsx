import { dateRange } from "../utils/format";

/** Renders the /resume API response as printable white paper, in one of three templates. */
export default function ResumeView({ resume, template = "classic" }) {
  const r = resume;
  const h = r.header;
  const contact = [h.email, h.phone, [h.city, h.state].filter(Boolean).join(", ")].filter(Boolean);
  const links = [h.linkedin_url, h.github_url, h.portfolio_url].filter(Boolean);

  const Section = ({ title, show = true, children }) =>
    show ? <section><h4>{title}</h4>{children}</section> : null;

  const Project = ({ p }) => (
    <div style={{ marginTop: 6 }}>
      <p className="p-strong">
        Project: {p.client_name || p.title}
        {p.client_name && <span className="p-muted" style={{ fontWeight: 400 }}> ({p.title})</span>}
      </p>
      {p.tech_stack?.length > 0 && <p className="p-muted">Tech: {p.tech_stack.join(", ")}</p>}
      {p.bullets.length > 0 && <ul>{p.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>}
      {(p.github_link || p.live_link) && (
        <p className="p-muted">{[p.github_link, p.live_link].filter(Boolean).join("   |   ")}</p>
      )}
    </div>
  );

  const summary = <Section title="Professional summary" show={!!r.summary}><p>{r.summary?.text}</p></Section>;

  // Course heading, then one bullet per topic: "Topic: content, content, content"
  const skills = (asChips) => (
    <Section title="Core technical skills" show={r.skills.length > 0}>
      {r.skills.map((s) => {
        const topics = s.topics || s.items.map((title) => ({ title, items: [] }));
        return (
          <div key={s.category} className="p-skill">
            <p className="p-strong p-skill-course">{s.category}</p>
            {asChips ? (
              topics.map((t) => (
                <div key={t.title} style={{ marginBottom: 4 }}>
                  <span className="p-skill-topic">{t.title}</span>
                  {t.items.length > 0 && <span> {t.items.map((i) => <span key={i} className="p-chip">{i}</span>)}</span>}
                </div>
              ))
            ) : (
              <ul className="p-skill-list">
                {topics.map((t) => (
                  <li key={t.title}>
                    <span className="p-skill-topic">{t.title}</span>
                    {t.items.length > 0 && `: ${t.items.join(", ")}`}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </Section>
  );

  const experience = (
    <Section title="Professional experience" show={r.experience.length > 0}>
      {r.experience.map((e) => (
        <div key={e.id} style={{ marginBottom: 10 }}>
          <div className="p-row">
            <span className="p-strong">{e.job_title}, {e.company_name}{e.location && `, ${e.location}`}</span>
            <span className="p-muted" style={{ whiteSpace: "nowrap" }}>{dateRange(e.start_date, e.end_date, e.is_current)}</span>
          </div>
          {e.description && <p className="p-muted">{e.description}</p>}
          {e.projects.map((p) => <Project key={p.id} p={p} />)}
        </div>
      ))}
    </Section>
  );

  const projects = (
    <Section title="Projects" show={r.projects.length > 0}>
      {r.projects.map((p) => <Project key={p.id} p={p} />)}
    </Section>
  );

  const education = (
    <Section title="Education" show={r.education.length > 0}>
      {r.education.map((e) => (
        <p key={e.id}>
          <span className="p-strong">{e.degree}{e.specialization && ` (${e.specialization})`}</span>, {e.institution}
          {e.location && `, ${e.location}`}
          <span className="p-muted">{[e.passing_year, e.score].filter(Boolean).length > 0 && ` – ${[e.passing_year, e.score].filter(Boolean).join(" | ")}`}</span>
        </p>
      ))}
    </Section>
  );

  const certs = (
    <Section title="Certifications and awards" show={r.certifications.length + r.awards.length > 0}>
      {r.certifications.map((c) => <p key={c.id}>{c.title}{c.issuer && <span className="p-muted"> – {c.issuer}</span>}</p>)}
      {r.awards.map((a) => <p key={a.id}>{a.title}{a.issuer && <span className="p-muted"> – {a.issuer}</span>}</p>)}
    </Section>
  );

  const additional = <Section title="Additional information" show={!!r.additional_info}><p>{r.additional_info}</p></Section>;

  if (template === "sidebar") {
    return (
      <article className="paper tpl-sidebar" style={{ "--paper-accent": "#0e5c2f" }}>
        <aside>
          <h1 style={{ fontSize: 22 }}>{h.full_name || "Your name"}</h1>
          <p className="p-strong" style={{ color: "#0e5c2f", margin: "4px 0 10px" }}>{h.headline}</p>
          {contact.map((c) => <p key={c} className="p-muted" style={{ wordBreak: "break-all" }}>{c}</p>)}
          {links.map((l) => <p key={l} className="p-muted" style={{ wordBreak: "break-all" }}>{l}</p>)}
          {skills(false)}
          {education}
        </aside>
        <main>{summary}{experience}{projects}{certs}{additional}</main>
      </article>
    );
  }

  if (template === "bold") {
    return (
      <article className="paper" style={{ "--paper-accent": "#0e5c2f" }}>
        <header className="tpl-bold-head">
          <h1>{h.full_name || "Your name"}</h1>
          <p>{[h.headline, ...contact].filter(Boolean).join("   |   ")}</p>
          {links.length > 0 && <p>{links.join("   |   ")}</p>}
        </header>
        <div className="paper-pad" style={{ paddingTop: 16 }}>
          {summary}{skills(true)}{experience}{projects}{education}{certs}{additional}
        </div>
      </article>
    );
  }

  return (
    <article className="paper paper-pad">
      <header style={{ textAlign: "center" }}>
        <h1>{h.full_name || "Your name"}</h1>
        <p className="p-strong" style={{ fontSize: 14 }}>{h.headline}</p>
        <p className="p-muted">{contact.join("   |   ")}</p>
        {links.length > 0 && <p className="p-muted">{links.join("   |   ")}</p>}
      </header>
      {summary}{skills(false)}{experience}{projects}{education}{certs}{additional}
    </article>
  );
}