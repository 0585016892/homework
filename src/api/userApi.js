import axiosClient from "./axiosClient";

const userApi = {
  getAll(params = {}) {
    return axiosClient.get("/users", { params });
  },

  getById(id) {
    return axiosClient.get(`/users/${id}`);
  },

  create(payload) {
    return axiosClient.post("/users", payload);
  },

  update(id, payload) {
    return axiosClient.patch(`/users/${id}`, payload);
  },

  updateMyProfile(payload) {
    return axiosClient.patch("/users/me", payload);
  },

  deactivate(id) {
    return axiosClient.patch(`/users/${id}/deactivate`, {});
  },
};

export default userApi;
