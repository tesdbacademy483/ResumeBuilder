import api from "./client";

const crud = (base) => ({
  list: (params) => api.get(`${base}/`, { params }).then((r) => r.data),
  get: (id) => api.get(`${base}/${id}/`).then((r) => r.data),
  create: (data) => api.post(`${base}/`, data).then((r) => r.data),
  update: (id, data) => api.patch(`${base}/${id}/`, data).then((r) => r.data),
  remove: (id) => api.delete(`${base}/${id}/`),
});

export const authApi = {
  login: (email, password) => api.post("/auth/login/", { email, password }).then((r) => r.data),
  me: () => api.get("/auth/me/").then((r) => r.data),
  changePassword: (data) => api.post("/auth/change-password/", data).then((r) => r.data),
};

export const adminApi = {
  students: {
    ...crud("/admin/students"),
    resetPassword: (id) => api.post(`/admin/students/${id}/reset-password/`).then((r) => r.data),
    resume: (id) => api.get(`/admin/students/${id}/resume/`).then((r) => r.data),
  },
  courses: crud("/admin/courses"),
  topics: crud("/admin/topics"),
  topicContents: crud("/admin/topic-contents"),
  projects: crud("/admin/projects"),
  projectContents: crud("/admin/project-contents"),
  summaries: crud("/admin/summaries"),
};

export const studentApi = {
  profile: {
    get: () => api.get("/student/profile/").then((r) => r.data),
    update: (data) => api.patch("/student/profile/", data).then((r) => r.data),
  },
  catalog: {
    list: (params) => api.get("/student/catalog/courses/", { params }).then((r) => r.data),
    get: (id) => api.get(`/student/catalog/courses/${id}/`).then((r) => r.data),
    withSummaries: () => api.get("/student/catalog/courses/with-summaries/").then((r) => r.data),
    summaries: (id) => api.get(`/student/catalog/courses/${id}/summaries/`).then((r) => r.data),
  },
  summary: {
    get: () => api.get("/student/summary/").then((r) => r.data),
    set: (course, summary) => api.put("/student/summary/", { course, summary }).then((r) => r.data),
    clear: () => api.delete("/student/summary/"),
  },
  myCourses: {
    ...crud("/student/my-courses"),
    topics: (id) => api.get(`/student/my-courses/${id}/topics/`).then((r) => r.data.topics),
    setTopics: (id, topics) => api.put(`/student/my-courses/${id}/topics/`, { topics }).then((r) => r.data.topics),
    setContents: (id, topic, contents) =>
      api.put(`/student/my-courses/${id}/contents/`, { topic, contents }).then((r) => r.data.contents),
  },
  myProjects: crud("/student/my-projects"),
  experiences: crud("/student/experiences"),
  education: crud("/student/education"),
  certifications: crud("/student/certifications"),
  resume: () => api.get("/student/resume/").then((r) => r.data),
};