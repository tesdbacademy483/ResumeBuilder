import { useEffect, useState } from "react";
import { listCourses, addCourse, deleteCourse, addTopic, deleteTopic } from "../api/skills";

export default function AdminDashboard() {
  const [courses, setCourses] = useState([]);
  const [courseName, setCourseName] = useState("");
  const [topicForms, setTopicForms] = useState({}); // courseId -> topic name being typed

  const load = () => listCourses().then((res) => setCourses(res.data));
  useEffect(() => { load(); }, []);

  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (!courseName.trim()) return;
    await addCourse({ name: courseName });
    setCourseName("");
    load();
  };

  const handleAddTopic = async (courseId) => {
    const name = topicForms[courseId];
    if (!name?.trim()) return;
    await addTopic({ course: courseId, name });
    setTopicForms({ ...topicForms, [courseId]: "" });
    load();
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Manage courses</h2>
        <form onSubmit={handleAddCourse}>
          <input value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="New course name (e.g. Python)" />
          <button type="submit">Add course</button>
        </form>
      </div>

      {courses.map((course) => (
        <div className="card" key={course.id}>
          <h3>
            {course.name}
            <button onClick={() => deleteCourse(course.id).then(load)} style={{ marginLeft: 12, background: "#c0392b" }}>Delete course</button>
          </h3>

          <ul>
            {course.topics.map((topic) => (
              <li key={topic.id}>
                {topic.name}
                <button onClick={() => deleteTopic(topic.id).then(load)} style={{ background: "#c0392b" }}>Delete</button>
              </li>
            ))}
          </ul>

          <input
            placeholder="New topic name"
            value={topicForms[course.id] || ""}
            onChange={(e) => setTopicForms({ ...topicForms, [course.id]: e.target.value })}
          />
          <button onClick={() => handleAddTopic(course.id)}>Add topic</button>
        </div>
      ))}
    </div>
  );
}
