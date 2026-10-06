import api from "./axios";

// Profile (single object per student)
export const getProfile = () => api.get("students/profile/");
export const updateProfile = (data) => api.put("students/profile/", data);

// Education
export const listEducation = () => api.get("students/education/");
export const addEducation = (data) => api.post("students/education/", data);
export const deleteEducation = (id) => api.delete(`students/education/${id}/`);

// Experience
export const listExperience = () => api.get("students/experience/");
export const addExperience = (data) => api.post("students/experience/", data);
export const deleteExperience = (id) => api.delete(`students/experience/${id}/`);

// Projects
export const listProjects = () => api.get("students/projects/");
export const addProject = (data) => api.post("students/projects/", data);
export const deleteProject = (id) => api.delete(`students/projects/${id}/`);

// Certifications
export const listCertifications = () => api.get("students/certifications/");
export const addCertification = (data) => api.post("students/certifications/", data);
export const deleteCertification = (id) => api.delete(`students/certifications/${id}/`);

// Resume PDF
export const downloadResumePdf = () => api.get("students/resume/pdf/", { responseType: "blob" });
