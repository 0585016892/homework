import axiosClient from "./axiosClient";

const taskApi = {
  getAll(params = {}) {
    return axiosClient.get("/tasks", { params });
  },

  getById(id) {
    return axiosClient.get(`/tasks/${id}`);
  },

  create(payload) {
    return axiosClient.post("/tasks", payload);
  },

  update(id, payload) {
    return axiosClient.put(`/tasks/${id}`, payload);
  },

  start(id) {
    return axiosClient.post(`/tasks/${id}/start`, {});
  },

  report(id, formData) {
    return axiosClient.post(`/tasks/${id}/report`, formData);
  },

  review(id, payload) {
    return axiosClient.post(`/tasks/${id}/review`, payload);
  },

  cancel(id) {
    return axiosClient.patch(`/tasks/${id}/cancel`, {});
  },
  getPhoto(id) {
    return axiosClient.get(`/tasks/${id}/photo`, {
      responseType: "blob",
    });
  },
};

export default taskApi;
