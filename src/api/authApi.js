import axiosClient from "./axiosClient";

const authApi = {
  login(payload) {
    return axiosClient.post("/auth/login", payload);
  },

  me() {
    return axiosClient.get("/auth/me");
  },

  logout() {
    localStorage.removeItem("home_task_token");
    localStorage.removeItem("home_task_user");
  },
};

export default authApi;
