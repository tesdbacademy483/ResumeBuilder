import { useEffect, useState } from "react";
import { listCourses, listMySkills, rateSkill } from "../../api/skills";

export default function SkillsForm() {
  const [courses, setCourses] = useState([]);
  const [skillMap, setSkillMap] = useState({}); // topicId -> level

  const load = async () => {
    const [coursesRes, skillsRes] = await Promise.all([listCourses(), listMySkills()]);
    setCourses(coursesRes.data);
    const map = {};
    skillsRes.data.forEach((s) => { map[s.topic] = s.level; });
    setSkillMap(map);
  };

  useEffect(() => { load(); }, []);

  const handleRate = async (topicId, level) => {
    setSkillMap({ ...skillMap, [topicId]: level });
    await rateSkill(topicId, level);
  };

  return (
    <div className="card">
      <h3>Skills</h3>
      <p>Select your confidence level (1 = beginner, 5 = expert) for each topic.</p>
      {courses.map((course) => (
        <div key={course.id} style={{ marginBottom: 16 }}>
          <strong>{course.name}</strong>
          {course.topics.map((topic) => (
            <div key={topic.id} style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 0" }}>
              <span style={{ flex: 1 }}>{topic.name}</span>
              <select
                value={skillMap[topic.id] || ""}
                onChange={(e) => handleRate(topic.id, Number(e.target.value))}
                style={{ width: 100, margin: 0 }}
              >
                <option value="" disabled>Rate</option>
                {[1, 2, 3, 4, 5].map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
