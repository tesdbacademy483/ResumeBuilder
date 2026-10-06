import api from "./axios";

export const loginRequest = (username, password) =>
  api.post("token/", { username, password });

export const fetchMe = () => api.get("me/");
