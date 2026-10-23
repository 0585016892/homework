import axiosClient from "./axiosClient";

const rewardApi = {
  // Danh sách thưởng, có thể lọc theo tháng, thành viên, trạng thái.
  getAll(params = {}) {
    return axiosClient.get("/rewards", { params });
  },

  // Xem trước số tiền thưởng của tháng trước khi chốt.
  preview(params = {}) {
    return axiosClient.get("/rewards/preview", { params });
  },

  // Chốt thưởng cho một tháng.
  settle(payload) {
    return axiosClient.post("/rewards/settle", payload);
  },

  // Đánh dấu một khoản thưởng đã thanh toán.
  markPaid(id, payload = {}) {
    return axiosClient.patch(`/rewards/${id}/paid`, payload);
  },
};

export default rewardApi;
