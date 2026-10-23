export const TASK_STATUS = {
  ASSIGNED: "assigned",
  IN_PROGRESS: "in_progress",
  PENDING_REVIEW: "pending_review",
  COMPLETED: "completed",
  REWORK: "rework",
  CANCELLED: "cancelled",
};

export const TASK_STATUS_LABELS = {
  assigned: "Chưa bắt đầu",
  in_progress: "Đang thực hiện",
  pending_review: "Chờ duyệt",
  completed: "Đã hoàn thành",
  rework: "Cần làm lại",
  cancelled: "Đã hủy",
};

export const TASK_STATUS_COLORS = {
  assigned: "default",
  in_progress: "processing",
  pending_review: "warning",
  completed: "success",
  rework: "error",
  cancelled: "default",
};
