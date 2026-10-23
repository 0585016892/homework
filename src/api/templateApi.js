import axiosClient from "./axiosClient";

const templateApi = {
  getAll(params = {}) {
    return axiosClient.get("/templates", { params });
  },

  getById(id) {
    return axiosClient.get(`/templates/${id}`);
  },

  create(payload) {
    return axiosClient.post("/templates", payload);
  },

  update(id, payload) {
    return axiosClient.put(`/templates/${id}`, payload);
  },

  toggle(id, payload) {
    return axiosClient.patch(`/templates/${id}/toggle`, payload);
  },

  delete(id) {
    return axiosClient.delete(`/templates/${id}`);
  },
};

export default templateApi;
