import axiosClient from "./axiosClient";

const dashboardApi = {
  getAdminOverview(params = {}) {
    return axiosClient.get("/dashboard/overview", { params });
  },

  getMemberDashboard(params = {}) {
    return axiosClient.get("/dashboard/member", { params });
  },
};

export default dashboardApi;
