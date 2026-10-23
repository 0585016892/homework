import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  App,
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Image,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FileCheck2,
  Image as ImageIcon,
  MessageSquareText,
  RefreshCw,
  Search,
  UserRound,
  XCircle,
} from "lucide-react";
import dayjs from "dayjs";
import taskApi from "../../api/taskApi";
import userApi from "../../api/userApi";

const { Title, Text } = Typography;
const { TextArea } = Input;

const REVIEW_STATUS_OPTIONS = [
  { label: "Chờ duyệt", value: "pending_review" },
  { label: "Đã hoàn thành", value: "completed" },
  { label: "Cần làm lại", value: "rework" },
];

const STATUS_META = {
  assigned: { label: "Đã giao", color: "blue" },
  in_progress: { label: "Đang làm", color: "processing" },
  pending_review: { label: "Chờ duyệt", color: "gold" },
  completed: { label: "Hoàn thành", color: "success" },
  rework: { label: "Cần làm lại", color: "error" },
  cancelled: { label: "Đã hủy", color: "default" },
};

function unwrapResponse(response) {
  let result = response?.data ?? response;

  if (result?.data !== undefined) {
    result = result.data;
  }

  return result;
}

function unwrapList(response, keys = []) {
  const result = unwrapResponse(response);

  if (Array.isArray(result)) {
    return result;
  }

  for (const key of keys) {
    if (Array.isArray(result?.[key])) {
      return result[key];
    }
  }

  return [];
}

function normalizeTask(item) {
  return {
    ...item,
    id: item.id ?? item.task_id,
    title: item.title ?? item.name ?? "Công việc",
    description: item.description ?? "",
    assigned_to: item.assigned_to ?? item.assigned_user_id ?? item.user_id,
    assigned_name:
      item.assigned_name ??
      item.assignee_name ??
      item.assigned_user_name ??
      item.member_name ??
      item.full_name ??
      "",
    due_date: item.due_date ?? item.deadline ?? null,
    due_time: item.due_time ?? null,
    status: item.status ?? "assigned",
    submitted_at: item.submitted_at ?? item.reported_at ?? null,
    report_photo:
      item.report_photo ??
      item.photo_url ??
      item.report_image ??
      item.image_url ??
      null,
    report_note: item.report_note ?? item.completion_note ?? "",
    review_note: item.review_note ?? "",
  };
}

function formatDateTime(value) {
  if (!value) return "—";

  const parsed = dayjs(value);

  return parsed.isValid() ? parsed.format("DD/MM/YYYY HH:mm") : "—";
}

function formatDate(value) {
  if (!value) return "—";

  const parsed = dayjs(value);

  return parsed.isValid() ? parsed.format("DD/MM/YYYY") : "—";
}

function formatTime(value) {
  if (!value) return "—";

  const parsed = dayjs(`2000-01-01 ${value}`);

  return parsed.isValid() ? parsed.format("HH:mm") : String(value).slice(0, 5);
}

function getStatusTag(status) {
  const meta = STATUS_META[status] || {
    label: status || "Không xác định",
    color: "default",
  };

  return <Tag color={meta.color}>{meta.label}</Tag>;
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function normalizePhotoUrl(photo) {
  if (!photo || typeof photo !== "string") return null;

  const value = photo.trim();

  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) {
    return value;
  }

  // Chuẩn hóa đường dẫn Windows được lưu nhầm vào database.
  const normalized = value.replace(/\\/g, "/");
  const uploadsIndex = normalized.toLowerCase().lastIndexOf("/uploads/");

  if (uploadsIndex >= 0) {
    return `/${normalized.slice(uploadsIndex + 1)}`;
  }

  if (normalized.startsWith("/")) {
    return normalized;
  }

  if (normalized.startsWith("uploads/")) {
    return `/${normalized}`;
  }

  // Nếu backend chỉ trả tên file, cần chỉnh theo quy ước lưu ảnh của backend.
  return `/${normalized}`;
}

export default function TaskApprovals() {
  const { message, modal } = App.useApp();

  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [actionId, setActionId] = useState(null);

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending_review");
  const [memberFilter, setMemberFilter] = useState("all");

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTask, setReviewTask] = useState(null);
  const [reviewAction, setReviewAction] = useState("approve");
  const [reviewNote, setReviewNote] = useState("");

  const loadTasks = useCallback(async () => {
    setLoading(true);

    try {
      const params = {};

      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      if (memberFilter !== "all") {
        params.assigned_to = memberFilter;
      }

      if (keyword.trim()) {
        params.keyword = keyword.trim();
        params.search = keyword.trim();
      }

      const response = await taskApi.getAll(params);

      const list = unwrapList(response, ["tasks", "items", "results"]);

      setTasks(list.map(normalizeTask));
    } catch (error) {
      console.error("[TaskApprovals] Tải công việc thất bại:", error);
      message.error(
        getErrorMessage(error, "Không thể tải danh sách công việc."),
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter, memberFilter, keyword, message]);

  const loadMembers = useCallback(async () => {
    setMembersLoading(true);

    try {
      const response = await userApi.getAll({
        role: "member",
      });

      const list = unwrapList(response, [
        "users",
        "members",
        "items",
        "results",
      ]);

      setMembers(
        list.map((user) => ({
          ...user,
          id: user.id ?? user.user_id,
          full_name: user.full_name ?? user.name ?? user.email,
        })),
      );
    } catch (error) {
      console.error("[TaskApprovals] Tải thành viên thất bại:", error);
    } finally {
      setMembersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const memberMap = useMemo(
    () => new Map(members.map((member) => [String(member.id), member])),
    [members],
  );

  const statistics = useMemo(() => {
    return {
      pending: tasks.filter((task) => task.status === "pending_review").length,
      completed: tasks.filter((task) => task.status === "completed").length,
      rework: tasks.filter((task) => task.status === "rework").length,
    };
  }, [tasks]);

  const openDetail = (task) => {
    setSelectedTask(task);
    setDetailOpen(true);
  };

  const openReview = (task, action) => {
    setReviewTask(task);
    setReviewAction(action);
    setReviewNote("");
    setReviewOpen(true);
  };

  const submitReview = async () => {
    if (!reviewTask) return;

    if (reviewAction === "rework" && !reviewNote.trim()) {
      message.warning("Vui lòng nhập lý do yêu cầu làm lại.");
      return;
    }

    setActionId(reviewTask.id);

    try {
      const payload =
        reviewAction === "approve"
          ? {
              action: "approve",
              review_note: reviewNote.trim(),
            }
          : {
              action: "rework",
              review_note: reviewNote.trim(),
            };

      await taskApi.review(reviewTask.id, payload);

      message.success(
        reviewAction === "approve"
          ? "Đã duyệt công việc hoàn thành."
          : "Đã yêu cầu thành viên làm lại công việc.",
      );

      setReviewOpen(false);
      setReviewTask(null);
      setReviewNote("");

      if (selectedTask?.id === reviewTask.id) {
        setDetailOpen(false);
        setSelectedTask(null);
      }

      await loadTasks();
    } catch (error) {
      console.error("[TaskApprovals] Duyệt công việc thất bại:", error);
      message.error(
        getErrorMessage(error, "Không thể cập nhật kết quả duyệt."),
      );
    } finally {
      setActionId(null);
    }
  };

  const confirmReview = (task, action) => {
    if (action === "approve") {
      modal.confirm({
        title: "Duyệt hoàn thành công việc?",
        content: (
          <div>
            <p>
              Bạn xác nhận <strong>{task.title}</strong> đã được thực hiện đạt
              yêu cầu?
            </p>
            <p>
              Công việc chỉ được tính là hoàn thành sau khi API xác nhận duyệt
              thành công.
            </p>
          </div>
        ),
        okText: "Duyệt hoàn thành",
        cancelText: "Quay lại",
        okButtonProps: { type: "primary" },
        onOk: async () => {
          setActionId(task.id);

          try {
            await taskApi.review(task.id, {
              action: "approve",
              review_note: "",
            });

            message.success("Đã duyệt hoàn thành công việc.");

            if (selectedTask?.id === task.id) {
              setDetailOpen(false);
              setSelectedTask(null);
            }

            await loadTasks();
          } catch (error) {
            console.error("[TaskApprovals] Duyệt thất bại:", error);
            message.error(getErrorMessage(error, "Không thể duyệt công việc."));
          } finally {
            setActionId(null);
          }
        },
      });

      return;
    }

    openReview(task, "rework");
  };

  const columns = [
    {
      title: "CÔNG VIỆC",
      key: "task",
      width: 260,
      render: (_, record) => (
        <div className="approval-task-cell">
          <div className="approval-task-icon">
            <FileCheck2 size={19} />
          </div>

          <div className="approval-task-copy">
            <Text strong>{record.title}</Text>
            <Text type="secondary">
              {record.description || "Không có mô tả"}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "THÀNH VIÊN",
      key: "member",
      width: 190,
      render: (_, record) => {
        const member = memberMap.get(String(record.assigned_to));
        const name =
          record.assigned_name ||
          member?.full_name ||
          member?.email ||
          "Chưa xác định";

        return (
          <Space>
            <Avatar
              size={34}
              src={member?.avatar || undefined}
              icon={<UserRound size={16} />}
              className="approval-member-avatar"
            />
            <div className="approval-member-copy">
              <Text strong>{name}</Text>
              <Text type="secondary">{member?.email || ""}</Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: "GỬI BÁO CÁO",
      dataIndex: "submitted_at",
      key: "submitted_at",
      width: 155,
      render: (value) => (
        <div className="approval-date-cell">
          <Clock3 size={15} />
          <span>{formatDateTime(value)}</span>
        </div>
      ),
    },
    {
      title: "MINH CHỨNG",
      key: "photo",
      width: 110,
      render: (_, record) => {
        const photoUrl = normalizePhotoUrl(record.report_photo);

        return photoUrl ? (
          <div className="approval-photo-cell">
            <Image
              src={photoUrl}
              width={54}
              height={44}
              alt={`Minh chứng ${record.title}`}
              className="approval-table-photo"
              preview
              fallback=""
            />
          </div>
        ) : (
          <Tag icon={<ImageIcon size={12} />}>Chưa có ảnh</Tag>
        );
      },
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status) => {
        const meta = STATUS_META[status] || {
          label: status || "Không xác định",
          color: "default",
        };

        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "THAO TÁC",
      key: "actions",
      fixed: "right",
      width: 190,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Xem báo cáo">
            <Button
              type="text"
              icon={<Eye size={17} />}
              onClick={() => openDetail(record)}
            />
          </Tooltip>

          {record.status === "pending_review" && (
            <>
              <Tooltip title="Yêu cầu làm lại">
                <Button
                  type="text"
                  danger
                  icon={<XCircle size={17} />}
                  onClick={() => openReview(record, "rework")}
                  loading={actionId === record.id}
                />
              </Tooltip>

              <Tooltip title="Duyệt hoàn thành">
                <Button
                  type="text"
                  className="approval-approve-icon"
                  icon={<CheckCircle2 size={17} />}
                  onClick={() => confirmReview(record, "approve")}
                  loading={actionId === record.id}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  const detailPhoto = normalizePhotoUrl(selectedTask?.report_photo);
  const reviewPhoto = normalizePhotoUrl(reviewTask?.report_photo);

  return (
    <div className="admin-approvals-page">
      <div className="approvals-page-header">
        <div>
          <div className="approvals-eyebrow">KIỂM TRA KẾT QUẢ</div>
          <Title level={2} className="approvals-page-title">
            Duyệt công việc
          </Title>
          <Text type="secondary">
            Kiểm tra ảnh minh chứng, phản hồi và xác nhận kết quả thực hiện.
          </Text>
        </div>

        <Button
          icon={<RefreshCw size={16} />}
          onClick={loadTasks}
          loading={loading}
        >
          Làm mới
        </Button>
      </div>

      <Row gutter={[16, 16]} className="approvals-statistics">
        <Col xs={24} sm={8}>
          <Card className="approvals-stat-card approvals-stat-pending">
            <Statistic
              title="Chờ duyệt"
              value={statistics.pending}
              prefix={<Clock3 size={19} />}
            />
            <Text type="secondary">Cần Admin kiểm tra</Text>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card className="approvals-stat-card approvals-stat-completed">
            <Statistic
              title="Đã hoàn thành"
              value={statistics.completed}
              prefix={<CheckCircle2 size={19} />}
            />
            <Text type="secondary">Đã được xác nhận</Text>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card className="approvals-stat-card approvals-stat-rework">
            <Statistic
              title="Cần làm lại"
              value={statistics.rework}
              prefix={<XCircle size={19} />}
            />
            <Text type="secondary">Chờ thành viên xử lý lại</Text>
          </Card>
        </Col>
      </Row>

      <Card className="approvals-table-card">
        <div className="approvals-table-heading">
          <div>
            <Title level={4}>Danh sách báo cáo</Title>
            <Text type="secondary">
              Chọn một báo cáo để xem chi tiết hoặc xử lý kết quả.
            </Text>
          </div>
          <Tag>{tasks.length} công việc</Tag>
        </div>

        <div className="approvals-filters">
          <Input
            allowClear
            prefix={<Search size={16} />}
            placeholder="Tìm công việc hoặc thành viên..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />

          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: "Tất cả trạng thái", value: "all" },
              ...REVIEW_STATUS_OPTIONS,
            ]}
          />

          <Select
            value={memberFilter}
            onChange={setMemberFilter}
            loading={membersLoading}
            showSearch
            optionFilterProp="label"
            options={[
              { label: "Tất cả thành viên", value: "all" },
              ...members.map((member) => ({
                label: member.full_name,
                value: String(member.id),
              })),
            ]}
          />
        </div>

        {statusFilter === "pending_review" && statistics.pending === 0 && (
          <Alert
            className="approvals-empty-alert"
            type="success"
            showIcon
            message="Không có báo cáo nào đang chờ duyệt"
            description="Các báo cáo mới gửi sẽ xuất hiện tại đây sau khi thành viên hoàn tất công việc."
          />
        )}

        <Spin spinning={loading}>
          <Table
            rowKey={(record) => record.id}
            columns={columns}
            dataSource={tasks}
            scroll={{ x: 1050 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              showTotal: (total) => `Tổng ${total} công việc`,
            }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Không tìm thấy báo cáo phù hợp"
                />
              ),
            }}
          />
        </Spin>
      </Card>

      <Modal
        title={
          <div className="approvals-modal-title">
            <div className="approvals-modal-title-icon">
              <Eye size={19} />
            </div>
            <div>
              <Title level={4}>Chi tiết báo cáo</Title>
              <Text type="secondary">Kiểm tra kết quả công việc</Text>
            </div>
          </div>
        }
        open={detailOpen}
        onCancel={() => {
          setDetailOpen(false);
          setSelectedTask(null);
        }}
        footer={
          selectedTask?.status === "pending_review"
            ? [
                <Button key="close" onClick={() => setDetailOpen(false)}>
                  Đóng
                </Button>,
                <Button
                  key="rework"
                  danger
                  icon={<XCircle size={16} />}
                  onClick={() => openReview(selectedTask, "rework")}
                >
                  Yêu cầu làm lại
                </Button>,
                <Button
                  key="approve"
                  type="primary"
                  icon={<CheckCircle2 size={16} />}
                  loading={actionId === selectedTask?.id}
                  onClick={() => confirmReview(selectedTask, "approve")}
                >
                  Duyệt hoàn thành
                </Button>,
              ]
            : [
                <Button
                  key="close"
                  type="primary"
                  onClick={() => setDetailOpen(false)}
                >
                  Đóng
                </Button>,
              ]
        }
        width={760}
        destroyOnClose
        className="approvals-detail-modal"
      >
        {selectedTask && (
          <div className="approval-detail-content">
            <div className="approval-detail-heading">
              <div className="approval-detail-task-icon">
                <FileCheck2 size={22} />
              </div>
              <div>
                <Title level={4}>{selectedTask.title}</Title>
                {getStatusTag(selectedTask.status)}
              </div>
            </div>

            <Descriptions
              bordered
              size="small"
              column={{ xs: 1, sm: 2 }}
              className="approval-detail-descriptions"
            >
              <Descriptions.Item label="Người thực hiện">
                {selectedTask.assigned_name ||
                  memberMap.get(String(selectedTask.assigned_to))?.full_name ||
                  "Chưa xác định"}
              </Descriptions.Item>

              <Descriptions.Item label="Ngày hạn">
                <CalendarDays size={14} className="approval-inline-icon" />
                {formatDate(selectedTask.due_date)}
                {selectedTask.due_time
                  ? ` · ${formatTime(selectedTask.due_time)}`
                  : ""}
              </Descriptions.Item>

              <Descriptions.Item label="Thời gian gửi" span={2}>
                {formatDateTime(selectedTask.submitted_at)}
              </Descriptions.Item>

              <Descriptions.Item label="Mô tả công việc" span={2}>
                {selectedTask.description || "Không có mô tả."}
              </Descriptions.Item>
            </Descriptions>

            <div className="approval-report-section">
              <div className="approval-section-title">
                <MessageSquareText size={17} />
                <Text strong>Ghi chú của thành viên</Text>
              </div>

              <div className="approval-note-box">
                {selectedTask.report_note || "Thành viên chưa nhập ghi chú."}
              </div>
            </div>

            <div className="approval-report-section">
              <div className="approval-section-title">
                <ImageIcon size={17} />
                <Text strong>Ảnh minh chứng</Text>
              </div>

              {detailPhoto ? (
                <div className="approval-detail-photo-wrap">
                  <Image
                    src={detailPhoto}
                    alt={`Ảnh minh chứng ${selectedTask.title}`}
                    className="approval-detail-photo"
                    preview
                  />
                </div>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Không có ảnh minh chứng"
                />
              )}
            </div>

            {selectedTask.review_note && (
              <Alert
                type={selectedTask.status === "rework" ? "warning" : "info"}
                showIcon
                message="Ghi chú duyệt trước đó"
                description={selectedTask.review_note}
              />
            )}
          </div>
        )}
      </Modal>

      <Modal
        title={
          <div className="approvals-modal-title">
            <div className="approvals-modal-title-icon approvals-rework-icon">
              <XCircle size={19} />
            </div>
            <div>
              <Title level={4}>Yêu cầu làm lại</Title>
              <Text type="secondary">
                Nêu rõ nội dung cần bổ sung hoặc sửa chữa.
              </Text>
            </div>
          </div>
        }
        open={reviewOpen}
        onCancel={() => {
          setReviewOpen(false);
          setReviewTask(null);
          setReviewNote("");
        }}
        onOk={submitReview}
        okText="Gửi yêu cầu làm lại"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
        confirmLoading={Boolean(reviewTask && actionId === reviewTask.id)}
        width={560}
        destroyOnClose
        className="approvals-review-modal"
      >
        {reviewTask && (
          <div className="approval-review-form">
            <div className="approval-review-task">
              <Text type="secondary">Công việc</Text>
              <Text strong>{reviewTask.title}</Text>
            </div>

            {reviewPhoto && (
              <div className="approval-review-photo">
                <Image
                  src={reviewPhoto}
                  alt={`Ảnh minh chứng ${reviewTask.title}`}
                  width={110}
                  height={85}
                />
              </div>
            )}

            <TextArea
              value={reviewNote}
              onChange={(event) => setReviewNote(event.target.value)}
              placeholder="Ví dụ: Vui lòng chụp lại ảnh sau khi dọn dẹp và bổ sung phần ghi chú..."
              rows={4}
              maxLength={1000}
              showCount
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
