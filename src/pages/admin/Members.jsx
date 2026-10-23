import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  App,
  Avatar,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  Activity,
  Edit3,
  LockKeyhole,
  Mail,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

import userApi from "../../api/userApi";

const { Text } = Typography;

const ROLE_OPTIONS = [
  { value: "member", label: "Thành viên" },
  { value: "admin", label: "Quản trị viên" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Đang hoạt động" },
  { value: "inactive", label: "Đã khóa" },
];

function unwrapResponse(response) {
  let data = response?.data;

  // Hỗ trợ response dạng { success, data: {...} }.
  if (data?.data !== undefined) {
    data = data.data;
  }

  return data;
}

function unwrapUsers(response) {
  const data = unwrapResponse(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.users)) {
    return data.users;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}

function normalizeUser(user) {
  return {
    ...user,
    id: user.id,
    full_name: user.full_name || user.name || "",
    email: user.email || "",
    role: user.role || "member",
    status: user.status || "active",
  };
}

function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "TV";

  return parts
    .slice(-2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

export default function Members() {
  const { message } = App.useApp();

  const [form] = Form.useForm();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {};

      // Chỉ gửi bộ lọc nếu backend hỗ trợ.
      if (keyword.trim()) {
        params.search = keyword.trim();
      }

      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      const response = await userApi.getAll(params);
      const rows = unwrapUsers(response).map(normalizeUser);

      setUsers(rows);
    } catch (err) {
      console.error(
        "[Members] Không tải được danh sách thành viên:",
        err.response?.data || err.message,
      );

      setError(
        getErrorMessage(
          err,
          "Không tải được danh sách thành viên. Hãy kiểm tra kết nối backend.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [keyword, statusFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    return users.filter((user) => {
      const matchesKeyword =
        !search ||
        String(user.full_name).toLowerCase().includes(search) ||
        String(user.email).toLowerCase().includes(search) ||
        String(user.id).includes(search);

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" || user.status === statusFilter;

      return matchesKeyword && matchesRole && matchesStatus;
    });
  }, [users, keyword, roleFilter, statusFilter]);

  const summary = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((user) => user.status === "active").length,
      members: users.filter((user) => user.role === "member").length,
      admins: users.filter((user) => user.role === "admin").length,
    };
  }, [users]);

  const openCreateModal = () => {
    setEditingUser(null);

    form.resetFields();

    form.setFieldsValue({
      role: "member",
    });

    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingUser(record);

    form.resetFields();

    form.setFieldsValue({
      full_name: record.full_name,
      email: record.email,
      role: record.role,
      status: record.status,
      password: "",
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingUser(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    setSaving(true);

    try {
      const payload = {
        full_name: values.full_name.trim(),
        email: values.email.trim().toLowerCase(),
        role: values.role,
      };

      if (editingUser) {
        payload.status = values.status;

        // Không gửi password rỗng khi chỉnh sửa tài khoản.
        if (values.password?.trim()) {
          payload.password = values.password;
        }

        await userApi.update(editingUser.id, payload);

        message.success("Cập nhật thành viên thành công.");
      } else {
        if (!values.password) {
          message.error("Vui lòng nhập mật khẩu.");
          return;
        }

        payload.password = values.password;

        await userApi.create(payload);

        message.success("Tạo tài khoản thành viên thành công.");
      }

      setModalOpen(false);
      setEditingUser(null);
      form.resetFields();

      await loadUsers();
    } catch (err) {
      console.error(
        "[Members] Lỗi lưu thành viên:",
        err.response?.data || err.message,
      );

      message.error(
        getErrorMessage(
          err,
          editingUser
            ? "Không cập nhật được thành viên."
            : "Không tạo được tài khoản.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (record) => {
    try {
      await userApi.deactivate(record.id);

      message.success(`Đã khóa tài khoản ${record.full_name}.`);

      await loadUsers();
    } catch (err) {
      console.error(
        "[Members] Lỗi khóa tài khoản:",
        err.response?.data || err.message,
      );

      message.error(getErrorMessage(err, "Không khóa được tài khoản này."));
    }
  };

  const columns = [
    {
      title: "THÀNH VIÊN",
      key: "member",
      width: 270,
      render: (_, record) => (
        <div className="member-identity">
          <Avatar
            size={43}
            src={record.avatar || undefined}
            className="member-table-avatar"
          >
            {getInitials(record.full_name)}
          </Avatar>

          <div className="member-identity-content">
            <span className="member-identity-name">
              {record.full_name || "Chưa có tên"}
            </span>

            <span className="member-identity-id">
              Mã thành viên: #{record.id}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "EMAIL",
      dataIndex: "email",
      key: "email",
      render: (email) => (
        <span className="member-email">
          <Mail size={15} />
          {email || "Chưa có email"}
        </span>
      ),
    },
    {
      title: "VAI TRÒ",
      dataIndex: "role",
      key: "role",
      width: 155,
      render: (role) =>
        role === "admin" ? (
          <Tag color="blue" className="member-role-tag">
            <ShieldCheck size={12} />
            Quản trị viên
          </Tag>
        ) : (
          <Tag className="member-role-tag">
            <UserRound size={12} />
            Thành viên
          </Tag>
        ),
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status) =>
        status === "active" ? (
          <Tag color="success" className="member-status-tag">
            <span className="member-status-dot" />
            Đang hoạt động
          </Tag>
        ) : (
          <Tag color="error" className="member-status-tag">
            Đã khóa
          </Tag>
        ),
    },
    {
      title: "NGÀY TẠO",
      dataIndex: "created_at",
      key: "created_at",
      width: 130,
      render: (value) => {
        if (!value) return "—";

        const date = new Date(value);

        return Number.isNaN(date.getTime())
          ? "—"
          : date.toLocaleDateString("vi-VN");
      },
    },
    {
      title: "THAO TÁC",
      key: "actions",
      width: 115,
      fixed: "right",
      render: (_, record) => (
        <Space size={5}>
          <Tooltip title="Sửa thông tin">
            <Button
              type="text"
              className="member-action-button"
              icon={<Edit3 size={16} />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>

          {record.status === "active" && (
            <Tooltip title="Khóa tài khoản">
              <Popconfirm
                title="Khóa tài khoản này?"
                description="Thành viên sẽ không thể đăng nhập khi tài khoản bị khóa."
                okText="Khóa tài khoản"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
                onConfirm={() => handleDeactivate(record)}
              >
                <Button
                  danger
                  type="text"
                  className="member-action-button"
                  icon={<LockKeyhole size={16} />}
                />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container members-page">
      <div className="page-heading">
        <div>
          <div className="page-eyebrow">QUẢN LÝ GIA ĐÌNH</div>
          <h1 className="page-title">Thành viên</h1>
          <p className="page-description">
            Quản lý tài khoản và quyền truy cập của các thành viên trong gia
            đình.
          </p>
        </div>

        <Space wrap>
          <Button
            icon={<RefreshCw size={16} />}
            onClick={loadUsers}
            loading={loading}
          >
            Làm mới
          </Button>

          <Button
            type="primary"
            icon={<Plus size={17} />}
            onClick={openCreateModal}
          >
            Thêm thành viên
          </Button>
        </Space>
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          message="Không thể tải dữ liệu"
          description={error}
          closable
          onClose={() => setError("")}
          action={
            <Button size="small" onClick={loadUsers}>
              Thử lại
            </Button>
          }
          className="members-error"
        />
      )}

      <Row gutter={[15, 15]} className="members-summary">
        <Col xs={12} lg={6}>
          <Card bordered={false} className="members-summary-card">
            <div className="members-summary-icon summary-icon-blue">
              <Users size={20} />
            </div>
            <Statistic
              title="Tổng thành viên"
              value={summary.total}
              valueStyle={{ color: "#173B5E", fontWeight: 800 }}
            />
          </Card>
        </Col>

        <Col xs={12} lg={6}>
          <Card bordered={false} className="members-summary-card">
            <div className="members-summary-icon summary-icon-green">
              <Activity size={20} />
            </div>
            <Statistic
              title="Đang hoạt động"
              value={summary.active}
              valueStyle={{ color: "#2E7D5B", fontWeight: 800 }}
            />
          </Card>
        </Col>

        <Col xs={12} lg={6}>
          <Card bordered={false} className="members-summary-card">
            <div className="members-summary-icon summary-icon-gold">
              <UserRound size={20} />
            </div>
            <Statistic
              title="Thành viên"
              value={summary.members}
              valueStyle={{ color: "#A17A2F", fontWeight: 800 }}
            />
          </Card>
        </Col>

        <Col xs={12} lg={6}>
          <Card bordered={false} className="members-summary-card">
            <div className="members-summary-icon summary-icon-purple">
              <ShieldCheck size={20} />
            </div>
            <Statistic
              title="Quản trị viên"
              value={summary.admins}
              valueStyle={{ color: "#6554A4", fontWeight: 800 }}
            />
          </Card>
        </Col>
      </Row>

      <Card bordered={false} className="members-table-card">
        <div className="members-toolbar">
          <div>
            <h2>Danh sách tài khoản</h2>
            <Text type="secondary">
              {filteredUsers.length} tài khoản phù hợp
            </Text>
          </div>

          <Space wrap className="members-filters">
            <Input
              allowClear
              prefix={<Search size={16} />}
              placeholder="Tìm tên, email hoặc mã..."
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              className="members-search"
            />

            <Select
              value={roleFilter}
              onChange={setRoleFilter}
              options={[
                { value: "all", label: "Tất cả vai trò" },
                ...ROLE_OPTIONS,
              ]}
              className="members-filter-select"
            />

            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "Mọi trạng thái" },
                ...STATUS_OPTIONS,
              ]}
              className="members-filter-select"
            />
          </Space>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredUsers}
          loading={loading}
          scroll={{ x: 950 }}
          pagination={{
            defaultPageSize: 10,
            pageSizeOptions: ["10", "20", "50"],
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}–${range[1]} trên ${total} tài khoản`,
          }}
          locale={{
            emptyText: "Chưa có thành viên nào.",
          }}
        />
      </Card>

      <Modal
        title={null}
        open={modalOpen}
        onCancel={closeModal}
        footer={null}
        destroyOnHidden
        width={540}
        centered
        className="member-form-modal"
        maskClosable={!saving}
        closable={!saving}
      >
        <div className="member-modal-heading">
          <div className="member-modal-icon">
            {editingUser ? <Edit3 size={21} /> : <Plus size={22} />}
          </div>

          <div>
            <h2>
              {editingUser ? "Cập nhật thành viên" : "Thêm thành viên mới"}
            </h2>
            <p>
              {editingUser
                ? "Cập nhật thông tin tài khoản bên dưới."
                : "Tạo tài khoản để thành viên đăng nhập và nhận công việc."}
            </p>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={handleSubmit}
          autoComplete="off"
          className="member-form"
        >
          <Form.Item
            label="Họ và tên"
            name="full_name"
            rules={[
              { required: true, message: "Vui lòng nhập họ và tên." },
              { max: 150, message: "Họ tên không được quá 150 ký tự." },
            ]}
          >
            <Input
              size="large"
              prefix={<UserRound size={17} className="form-input-icon" />}
              placeholder="Ví dụ: Nguyễn Văn An"
              maxLength={150}
            />
          </Form.Item>

          <Form.Item
            label="Địa chỉ email"
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email." },
              { type: "email", message: "Email chưa đúng định dạng." },
              { max: 190, message: "Email quá dài." },
            ]}
          >
            <Input
              size="large"
              prefix={<Mail size={17} className="form-input-icon" />}
              placeholder="thanhvien@example.com"
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item
            label={
              editingUser
                ? "Mật khẩu mới (không bắt buộc)"
                : "Mật khẩu đăng nhập"
            }
            name="password"
            rules={[
              {
                required: !editingUser,
                message: "Vui lòng nhập mật khẩu.",
              },
              {
                min: 8,
                message: "Mật khẩu phải có ít nhất 8 ký tự.",
              },
            ]}
            extra={
              editingUser
                ? "Để trống nếu không muốn đổi mật khẩu."
                : "Nên sử dụng mật khẩu riêng, khó đoán."
            }
          >
            <Input.Password
              size="large"
              autoComplete="new-password"
              placeholder={
                editingUser ? "Nhập nếu muốn đổi mật khẩu" : "Ít nhất 8 ký tự"
              }
            />
          </Form.Item>

          <Row gutter={14}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Vai trò"
                name="role"
                rules={[{ required: true, message: "Chọn vai trò." }]}
              >
                <Select
                  size="large"
                  options={ROLE_OPTIONS}
                  placeholder="Chọn vai trò"
                />
              </Form.Item>
            </Col>

            {editingUser && (
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Trạng thái"
                  name="status"
                  rules={[{ required: true, message: "Chọn trạng thái." }]}
                >
                  <Select
                    size="large"
                    options={STATUS_OPTIONS}
                    placeholder="Chọn trạng thái"
                  />
                </Form.Item>
              </Col>
            )}
          </Row>

          <div className="member-modal-actions">
            <Button onClick={closeModal} disabled={saving}>
              Hủy
            </Button>

            <Button
              type="primary"
              htmlType="submit"
              loading={saving}
              icon={editingUser ? <Edit3 size={15} /> : <Plus size={16} />}
            >
              {editingUser ? "Lưu thay đổi" : "Tạo tài khoản"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
