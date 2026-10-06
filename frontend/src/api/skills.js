import api from "./axios";

// Courses (admin writes, everyone reads)
export const listCourses = () => api.get("courses/");
export const addCourse = (data) => api.post("courses/", data);
export const deleteCourse = (id) => api.delete(`courses/${id}/`);

// Topics (admin writes, everyone reads)
export const addTopic = (data) => api.post("topics/", data);
export const deleteTopic = (id) => api.delete(`topics/${id}/`);

// Student skill ratings (student writes own only)
export const listMySkills = () => api.get("skills/");
export const rateSkill = (topicId, level) => api.post("skills/", { topic: topicId, level });
export const deleteSkill = (id) => api.delete(`skills/${id}/`);
