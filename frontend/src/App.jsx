import { Navigate, Route, Routes } from "react-router-dom";
import RequireAuth, { FullPageLoader } from "./components/RequireAuth";
import { homeFor, useAuth } from "./context/AuthContext";
import AdminLayout from "./layouts/AdminLayout";
import StudentLayout from "./layouts/StudentLayout";
import CourseEditor from "./pages/admin/CourseEditor";
import Courses from "./pages/admin/Courses";
import Dashboard from "./pages/admin/Dashboard";
import StudentResume from "./pages/admin/StudentResume";
import Students from "./pages/admin/Students";
import ChangePassword from "./pages/auth/ChangePassword";
import Login from "./pages/auth/Login";
import Additional from "./pages/student/Additional";
import { Certifications, Education, Experience } from "./pages/student/Entries";
import Header from "./pages/student/Header";
import Projects from "./pages/student/Projects";
import Resume from "./pages/student/Resume";
import Skills from "./pages/student/Skills";
import Summary from "./pages/student/Summary";

function Home() {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  return <Navigate to={homeFor(user)} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/change-password" element={<RequireAuth allowTempPassword><ChangePassword /></RequireAuth>} />

      <Route path="/admin" element={<RequireAuth role="admin"><AdminLayout /></RequireAuth>}>
        <Route index element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="students/:id/resume" element={<StudentResume />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/:id" element={<CourseEditor />} />
      </Route>

      <Route path="/student" element={<RequireAuth role="student"><StudentLayout /></RequireAuth>}>
        <Route index element={<Navigate to="header" replace />} />
        <Route path="header" element={<Header />} />
        <Route path="summary" element={<Summary />} />
        <Route path="skills" element={<Skills />} />
        <Route path="experience" element={<Experience />} />
        <Route path="projects" element={<Projects />} />
        <Route path="education" element={<Education />} />
        <Route path="certifications" element={<Certifications />} />
        <Route path="additional" element={<Additional />} />
        <Route path="resume" element={<Resume />} />
      </Route>

      <Route path="*" element={<Home />} />
    </Routes>
  );
}
