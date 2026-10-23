import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  App,
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  TimePicker,
  Tooltip,
  Typography,
} from "antd";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  ListTodo,
  Plus,
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

const STATUS_OPTIONS = [
  { label: "Đã giao", value: "assigned" },
  { label: "Đang làm", value: "in_progress" },
  { label: "Chờ duyệt", value: "pending_review" },
  { label: "Hoàn thành", value: "completed" },
  { label: "Cần làm lại", value: "rework" },
  { label: "Đã hủy", value: "cancelled" },
];

const STATUS_META = {
  assigned: {
    label: "Đã giao",
    color: "blue",
  },
  in_progress: {
    label: "Đang làm",
    color: "processing",
  },
  pending_review: {
    label: "Chờ duyệt",
    color: "gold",
  },
  completed: {
    label: "Hoàn thành",
    color: "success",
  },
  rework: {
    label: "Cần làm lại",
    color: "error",
  },
  cancelled: {
    label: "Đã hủy",
    color: "default",
  },
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
    title: item.title ?? item.name ?? "",
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
    created_at: item.created_at ?? null,
  };
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

function getMemberName(task, memberMap) {
  const nameFromTask = task.assigned_name;

  if (nameFromTask) {
    return nameFromTask;
  }

  const member = memberMap.get(String(task.assigned_to));

  return member?.full_name || member?.name || "Chưa xác định";
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

export default function Tasks() {
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [memberFilter, setMemberFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);

    try {
      const params = {};

      if (keyword.trim()) {
        params.keyword = keyword.trim();
        params.search = keyword.trim();
      }

      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      if (memberFilter !== "all") {
        params.assigned_to = memberFilter;
      }

      if (dateFilter) {
        params.date = dateFilter.format("YYYY-MM-DD");
      }

      const response = await taskApi.getAll(params);
      const list = unwrapList(response, ["tasks", "items", "results"]);

      setTasks(list.map(normalizeTask));
    } catch (error) {
      console.error("[Tasks] Không thể tải danh sách:", error);
      message.error(
        getErrorMessage(error, "Không thể tải danh sách công việc."),
      );
    } finally {
      setLoading(false);
    }
  }, [keyword, statusFilter, memberFilter, dateFilter, message]);

  const loadMembers = useCallback(async () => {
    setMembersLoading(true);

    try {
      const response = await userApi.getAll({
        role: "member",
        status: "active",
      });

      const list = unwrapList(response, [
        "users",
        "members",
        "items",
        "results",
      ]);

      setMembers(
        list
          .filter((user) => user.status !== "inactive")
          .map((user) => ({
            ...user,
            id: user.id ?? user.user_id,
            full_name: user.full_name ?? user.name ?? user.email,
          })),
      );
    } catch (error) {
      console.error("[Tasks] Không thể tải thành viên:", error);
      message.error(
        getErrorMessage(error, "Không thể tải danh sách thành viên."),
      );
    } finally {
      setMembersLoading(false);
    }
  }, [message]);

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
    const activeTasks = tasks.filter((task) => task.status !== "cancelled");

    return {
      total: activeTasks.length,
      inProgress: activeTasks.filter((task) => task.status === "in_progress")
        .length,
      pending: activeTasks.filter((task) => task.status === "pending_review")
        .length,
      completed: activeTasks.filter((task) => task.status === "completed")
        .length,
    };
  }, [tasks]);

  const openCreateModal = () => {
    setEditingTask(null);

    form.resetFields();
    form.setFieldsValue({
      title: "",
      description: "",
      assigned_to: undefined,
      due_date: dayjs(),
      due_time: dayjs().hour(18).minute(0).second(0),
    });

    setModalOpen(true);
  };

  const openEditModal = (task) => {
    if (["completed", "cancelled", "pending_review"].includes(task.status)) {
      message.warning(
        "Công việc đang chờ duyệt, đã hoàn thành hoặc đã hủy không thể sửa tại đây.",
      );
      return;
    }

    setEditingTask(task);

    form.setFieldsValue({
      title: task.title,
      description: task.description,
      assigned_to:
        task.assigned_to === undefined || task.assigned_to === null
          ? undefined
          : String(task.assigned_to),
      due_date: task.due_date ? dayjs(task.due_date) : null,
      due_time: task.due_time ? dayjs(`2000-01-01 ${task.due_time}`) : null,
    });

    setModalOpen(true);
  };

  const handleSubmit = async (values) => {
    setSaving(true);

    try {
      const payload = {
        title: values.title.trim(),
        description: values.description?.trim() || "",
        assigned_to: Number(values.assigned_to),
        due_date: values.due_date ? values.due_date.format("YYYY-MM-DD") : null,
        due_time: values.due_time ? values.due_time.format("HH:mm:ss") : null,
      };

      if (editingTask) {
        await taskApi.update(editingTask.id, payload);
        message.success("Cập nhật công việc thành công.");
      } else {
        await taskApi.create(payload);
        message.success("Tạo công việc thành công.");
      }

      setModalOpen(false);
      setEditingTask(null);
      form.resetFields();

      await loadTasks();
    } catch (error) {
      console.error("[Tasks] Lưu công việc thất bại:", error);
      message.error(getErrorMessage(error, "Không thể lưu công việc."));
    } finally {
      setSaving(false);
    }
  };

  const handleCancelTask = async (task) => {
    setActionId(task.id);

    try {
      await taskApi.cancel(task.id);
      message.success(`Đã hủy công việc "${task.title}".`);
      await loadTasks();
    } catch (error) {
      console.error("[Tasks] Hủy công việc thất bại:", error);
      message.error(getErrorMessage(error, "Không thể hủy công việc."));
    } finally {
      setActionId(null);
    }
  };

  const columns = [
    {
      title: "CÔNG VIỆC",
      key: "task",
      width: 280,
      render: (_, record) => (
        <div className="task-title-cell">
          <div className="task-title-icon">
            <ListTodo size={19} />
          </div>

          <div className="task-title-content">
            <Text strong className="task-main-title">
              {record.title || "Chưa có tên"}
            </Text>

            <Text type="secondary" className="task-description-text">
              {record.description || "Không có mô tả"}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "NGƯỜI THỰC HIỆN",
      key: "member",
      width: 200,
      render: (_, record) => {
        const name = getMemberName(record, memberMap);
        const member = memberMap.get(String(record.assigned_to));

        return (
          <Space>
            <Avatar
              size={34}
              src={member?.avatar || undefined}
              icon={<UserRound size={16} />}
              className="task-member-avatar"
            />
            <div>
              <Text strong>{name}</Text>
              <div>
                <Text type="secondary" className="task-small-text">
                  {member?.email || ""}
                </Text>
              </div>
            </div>
          </Space>
        );
      },
    },
    {
      title: "NGÀY HẠN",
      key: "due_date",
      width: 145,
      render: (_, record) => (
        <div className="task-datetime">
          <span>
            <CalendarDays size={15} />
            {formatDate(record.due_date)}
          </span>
          <span>
            <Clock3 size={15} />
            {formatTime(record.due_time)}
          </span>
        </div>
      ),
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "status",
      key: "status",
      width: 145,
      render: (status) => getStatusTag(status),
    },
    {
      title: "THAO TÁC",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, record) => {
        const canEdit = ["assigned", "in_progress", "rework"].includes(
          record.status,
        );

        const canCancel = ![
          "completed",
          "cancelled",
          "pending_review",
        ].includes(record.status);

        return (
          <Space size={4}>
            <Tooltip title="Chỉnh sửa">
              <Button
                type="text"
                icon={<Edit3 size={17} />}
                disabled={!canEdit}
                onClick={() => openEditModal(record)}
              />
            </Tooltip>

            {canCancel && (
              <Popconfirm
                title="Hủy công việc này?"
                description="Công việc sẽ chuyển sang trạng thái Đã hủy."
                okText="Xác nhận hủy"
                cancelText="Giữ lại"
                okButtonProps={{ danger: true }}
                onConfirm={() => handleCancelTask(record)}
              >
                <Tooltip title="Hủy công việc">
                  <Button
                    type="text"
                    danger
                    loading={actionId === record.id}
                    icon={<XCircle size={17} />}
                  />
                </Tooltip>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="admin-tasks-page">
      <div className="tasks-page-header">
        <div>
          <div className="tasks-eyebrow">QUẢN LÝ VẬN HÀNH</div>
          <Title level={2} className="tasks-page-title">
            Quản lý công việc
          </Title>
          <Text type="secondary">
            Phân công, theo dõi tiến độ và quản lý các công việc trong gia đình.
          </Text>
        </div>

        <Space wrap>
          <Button
            icon={<RefreshCw size={16} />}
            onClick={() => {
              loadTasks();
              loadMembers();
            }}
          >
            Làm mới
          </Button>

          <Button
            type="primary"
            icon={<Plus size={17} />}
            onClick={openCreateModal}
            className="tasks-primary-button"
          >
            Tạo công việc
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} className="tasks-statistics">
        <Col xs={12} sm={12} xl={6}>
          <Card className="tasks-stat-card">
            <Statistic
              title="Tổng công việc"
              value={statistics.total}
              prefix={<ListTodo size={19} />}
            />
            <span className="tasks-stat-caption">
              Không tính công việc đã hủy
            </span>
          </Card>
        </Col>

        <Col xs={12} sm={12} xl={6}>
          <Card className="tasks-stat-card">
            <Statistic
              title="Đang thực hiện"
              value={statistics.inProgress}
              prefix={<Clock3 size={19} />}
            />
            <span className="tasks-stat-caption">
              Đang được thành viên xử lý
            </span>
          </Card>
        </Col>

        <Col xs={12} sm={12} xl={6}>
          <Card className="tasks-stat-card">
            <Statistic
              title="Chờ duyệt"
              value={statistics.pending}
              prefix={<CheckCircle2 size={19} />}
            />
            <span className="tasks-stat-caption">Cần kiểm tra kết quả</span>
          </Card>
        </Col>

        <Col xs={12} sm={12} xl={6}>
          <Card className="tasks-stat-card">
            <Statistic
              title="Hoàn thành"
              value={statistics.completed}
              prefix={<CheckCircle2 size={19} />}
            />
            <span className="tasks-stat-caption">Đã được duyệt</span>
          </Card>
        </Col>
      </Row>

      <Card className="tasks-table-card">
        <div className="tasks-table-heading">
          <div>
            <Title level={4}>Danh sách công việc</Title>
            <Text type="secondary">
              Theo dõi người thực hiện, hạn hoàn thành và trạng thái.
            </Text>
          </div>
          <Tag>{tasks.length} công việc</Tag>
        </div>

        <div className="tasks-filters">
          <Input
            allowClear
            prefix={<Search size={16} />}
            placeholder="Tìm tên hoặc nội dung công việc..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="tasks-search-input"
          />

          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: "Tất cả trạng thái", value: "all" },
              ...STATUS_OPTIONS,
            ]}
            className="tasks-filter-select"
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
            className="tasks-filter-select"
          />

          <DatePicker
            value={dateFilter}
            onChange={setDateFilter}
            format="DD/MM/YYYY"
            placeholder="Lọc ngày hạn"
            allowClear
            className="tasks-date-filter"
          />
        </div>

        {members.length === 0 && !membersLoading && (
          <Alert
            type="info"
            showIcon
            message="Chưa có thành viên hoạt động"
            description="Hãy tạo hoặc kích hoạt thành viên trong mục Quản lý thành viên trước khi giao công việc."
            className="tasks-member-alert"
          />
        )}

        <Spin spinning={loading}>
          <Table
            rowKey={(record) => record.id}
            columns={columns}
            dataSource={tasks}
            scroll={{ x: 1000 }}
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
                  description="Chưa có công việc phù hợp"
                />
              ),
            }}
          />
        </Spin>
      </Card>

      <Modal
        title={
          <div className="tasks-modal-heading">
            <div className="tasks-modal-icon">
              {editingTask ? <Edit3 size={20} /> : <Plus size={20} />}
            </div>
            <div>
              <Title level={4}>
                {editingTask ? "Chỉnh sửa công việc" : "Tạo công việc mới"}
              </Title>
              <Text type="secondary">
                Nhập thông tin và phân công cho thành viên.
              </Text>
            </div>
          </div>
        }
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditingTask(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText={editingTask ? "Lưu thay đổi" : "Tạo công việc"}
        cancelText="Đóng"
        confirmLoading={saving}
        width={650}
        destroyOnClose
        className="tasks-edit-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark="optional"
          className="tasks-form"
        >
          <Form.Item
            label="Tên công việc"
            name="title"
            rules={[
              { required: true, message: "Vui lòng nhập tên công việc." },
              { max: 200, message: "Tên công việc không quá 200 ký tự." },
            ]}
          >
            <Input
              maxLength={200}
              placeholder="Ví dụ: Quét dọn phòng khách"
              size="large"
            />
          </Form.Item>

          <Form.Item label="Mô tả" name="description">
            <TextArea
              rows={3}
              maxLength={2000}
              showCount
              placeholder="Mô tả chi tiết công việc cần thực hiện..."
            />
          </Form.Item>

          <Form.Item
            label="Giao cho thành viên"
            name="assigned_to"
            rules={[
              { required: true, message: "Vui lòng chọn người thực hiện." },
            ]}
          >
            <Select
              size="large"
              showSearch
              loading={membersLoading}
              optionFilterProp="label"
              placeholder="Chọn thành viên thực hiện"
              options={members.map((member) => ({
                label: member.full_name,
                value: String(member.id),
              }))}
              notFoundContent={
                membersLoading ? <Spin size="small" /> : "Không có thành viên"
              }
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Ngày hạn"
                name="due_date"
                rules={[{ required: true, message: "Vui lòng chọn ngày hạn." }]}
              >
                <DatePicker
                  size="large"
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày"
                  className="tasks-form-full-width"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item label="Giờ thực hiện" name="due_time">
                <TimePicker
                  size="large"
                  format="HH:mm"
                  minuteStep={5}
                  placeholder="Chọn giờ"
                  className="tasks-form-full-width"
                />
              </Form.Item>
            </Col>
          </Row>

          {editingTask && (
            <Descriptions
              size="small"
              column={1}
              bordered
              className="tasks-current-info"
            >
              <Descriptions.Item label="Trạng thái hiện tại">
                {getStatusTag(editingTask.status)}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Form>
      </Modal>
    </div>
  );
}
