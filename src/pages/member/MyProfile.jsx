import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Tag,
  Typography,
  message,
} from "antd";
import {
  AtSign,
  Camera,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Edit3,
  KeyRound,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";

const { Title, Text } = Typography;

const STYLES = `
.my-profile-page {
  --mp-green: #00a650;
  --mp-green-dark: #008b44;
  --mp-green-light: #e9f9ef;
  --mp-text: #18352a;
  --mp-muted: #7b8982;
  color: var(--mp-text);
  padding: 8px 0 32px;
}
.my-profile-page * { box-sizing: border-box; }
.my-profile-page .mp-heading {
  margin-bottom: 24px;
}
.my-profile-page .mp-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--mp-green);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.my-profile-page .mp-title {
  margin: 0 !important;
  color: var(--mp-text) !important;
  font-size: clamp(24px, 3vw, 32px) !important;
  font-weight: 800 !important;
  letter-spacing: -.8px;
}
.my-profile-page .mp-subtitle {
  display: block;
  margin-top: 8px;
  color: var(--mp-muted);
  font-size: 14px;
  line-height: 1.7;
}
.my-profile-page .mp-card {
  border: 1px solid #edf1ee !important;
  border-radius: 20px !important;
  box-shadow: 0 4px 18px rgba(21,60,39,.035) !important;
  overflow: hidden;
}
.my-profile-page .mp-card .ant-card-body {
  padding: 22px;
}
.my-profile-page .mp-cover {
  position: relative;
  padding: 26px;
  overflow: hidden;
  color: white;
  background: linear-gradient(125deg,#00a650 0%,#008b44 100%);
  border-radius: 20px;
  margin-bottom: 18px;
}
.my-profile-page .mp-cover:before {
  content: "";
  position: absolute;
  width: 230px;
  height: 230px;
  border: 42px solid rgba(255,255,255,.08);
  border-radius: 50%;
  right: -45px;
  top: -135px;
}
.my-profile-page .mp-cover:after {
  content: "";
  position: absolute;
  width: 140px;
  height: 140px;
  background: rgba(255,255,255,.06);
  border-radius: 50%;
  right: 115px;
  bottom: -110px;
}
.my-profile-page .mp-cover-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 20px;
}
.my-profile-page .mp-avatar-wrap {
  position: relative;
  flex-shrink: 0;
}
.my-profile-page .mp-avatar {
  border: 4px solid rgba(255,255,255,.65);
  box-shadow: 0 6px 18px rgba(0,0,0,.12);
}
.my-profile-page .mp-avatar-edit {
  position: absolute;
  right: -2px;
  bottom: 1px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
  border-radius: 50%;
  color: var(--mp-green);
  background: #fff;
  cursor: pointer;
}
.my-profile-page .mp-cover-name {
  display: block;
  color: #fff;
  font-size: clamp(20px, 3vw, 26px);
  font-weight: 800;
  line-height: 1.35;
  overflow-wrap: anywhere;
}
.my-profile-page .mp-cover-email {
  display: block;
  color: rgba(255,255,255,.84);
  font-size: 13px;
  margin-top: 6px;
  overflow-wrap: anywhere;
}
.my-profile-page .mp-cover-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 12px;
}
.my-profile-page .mp-cover-tags .ant-tag {
  margin-inline-end: 0;
  border-color: rgba(255,255,255,.22);
  background: rgba(255,255,255,.14);
  color: #fff;
  border-radius: 999px;
  padding: 3px 10px;
}
.my-profile-page .mp-section-title {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--mp-text);
  font-size: 16px;
  font-weight: 800;
  margin-bottom: 6px;
}
.my-profile-page .mp-section-subtitle {
  display: block;
  color: var(--mp-muted);
  font-size: 12px;
  line-height: 1.7;
  margin-bottom: 20px;
}
.my-profile-page .mp-info-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 15px 0;
  border-bottom: 1px solid #eff3f0;
}
.my-profile-page .mp-info-row:first-child { padding-top: 0; }
.my-profile-page .mp-info-row:last-child {
  padding-bottom: 0;
  border-bottom: none;
}
.my-profile-page .mp-info-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 39px;
  height: 39px;
  flex: 0 0 39px;
  color: var(--mp-green);
  background: var(--mp-green-light);
  border-radius: 12px;
}
.my-profile-page .mp-info-main { flex: 1; min-width: 0; }
.my-profile-page .mp-info-label {
  display: block;
  color: var(--mp-muted);
  font-size: 12px;
  margin-bottom: 5px;
}
.my-profile-page .mp-info-value {
  display: block;
  color: var(--mp-text);
  font-size: 13px;
  font-weight: 700;
  overflow-wrap: anywhere;
  line-height: 1.6;
}
.my-profile-page .mp-action-button {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 12px;
  padding: 14px 0;
  border: none;
  border-bottom: 1px solid #eff3f0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.my-profile-page .mp-action-button:last-child {
  padding-bottom: 0;
  border-bottom: none;
}
.my-profile-page .mp-action-button:hover .mp-action-title {
  color: var(--mp-green);
}
.my-profile-page .mp-action-icon {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 13px;
  color: var(--mp-green);
  background: var(--mp-green-light);
}
.my-profile-page .mp-action-content { flex: 1; min-width: 0; }
.my-profile-page .mp-action-title {
  display: block;
  color: var(--mp-text);
  font-size: 13px;
  font-weight: 750;
  transition: color .2s;
}
.my-profile-page .mp-action-desc {
  display: block;
  margin-top: 4px;
  color: var(--mp-muted);
  font-size: 11px;
  line-height: 1.6;
}
.my-profile-page .mp-action-arrow {
  color: #a5b1aa;
  flex-shrink: 0;
}
.my-profile-page .mp-security-box {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 15px;
  border-radius: 15px;
  background: #f0faf4;
  border: 1px solid #e1f3e7;
  margin-top: 18px;
}
.my-profile-page .mp-security-box svg {
  flex-shrink: 0;
  color: var(--mp-green);
  margin-top: 1px;
}
.my-profile-page .mp-security-title {
  display: block;
  color: #185b36;
  font-size: 13px;
  font-weight: 800;
}
.my-profile-page .mp-security-desc {
  display: block;
  color: #61816e;
  font-size: 12px;
  line-height: 1.7;
  margin-top: 5px;
}
.my-profile-page .mp-edit-form .ant-form-item-label > label {
  font-size: 12px;
  font-weight: 700;
  color: #53645a;
}
.my-profile-page .mp-edit-form .ant-input,
.my-profile-page .mp-edit-form .ant-input-affix-wrapper {
  min-height: 42px;
  border-radius: 11px;
}
.my-profile-page .mp-edit-form .ant-input-affix-wrapper .ant-input {
  min-height: auto;
}
.my-profile-page .mp-primary-btn {
  min-height: 42px;
  border-radius: 12px;
  font-weight: 750;
  box-shadow: none;
}
@media(max-width:767px) {
  .my-profile-page { padding-top: 3px; }
  .my-profile-page .mp-cover { padding: 20px; }
  .my-profile-page .mp-cover-content { gap: 14px; }
  .my-profile-page .mp-avatar-wrap .ant-avatar {
    width: 72px !important;
    height: 72px !important;
    font-size: 26px !important;
  }
  .my-profile-page .mp-card .ant-card-body { padding: 18px; }
}
@media(max-width:420px) {
  .my-profile-page .mp-cover-content { align-items: flex-start; }
  .my-profile-page .mp-cover-name { font-size: 19px; }
  .my-profile-page .mp-cover-email { font-size: 12px; }
}
`;

function getDisplayName(user) {
  return (
    user?.full_name ||
    user?.name ||
    user?.username ||
    user?.display_name ||
    user?.email ||
    "Thành viên"
  );
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

function getRoleLabel(user) {
  const role = String(user?.role || user?.role_name || "").toLowerCase();

  const roles = {
    admin: "Quản trị viên",
    member: "Thành viên",
    parent: "Phụ huynh",
    user: "Thành viên",
  };

  return roles[role] || user?.role_name || user?.role_label || "Thành viên";
}

export default function MyProfile() {
  const { user } = useAuth();

  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const displayName = getDisplayName(user);

  const avatarUrl = useMemo(
    () =>
      user?.avatar_url ||
      user?.avatar ||
      user?.profile_image ||
      user?.photo_url ||
      "",
    [user],
  );

  useEffect(() => {
    form.setFieldsValue({
      full_name: user?.full_name || user?.name || user?.display_name || "",
      email: user?.email || "",
      phone: user?.phone || user?.phone_number || "",
      address: user?.address || "",
    });
  }, [form, user]);

  const openEdit = () => {
    form.setFieldsValue({
      full_name: user?.full_name || user?.name || user?.display_name || "",
      email: user?.email || "",
      phone: user?.phone || user?.phone_number || "",
      address: user?.address || "",
    });
    setEditOpen(true);
  };

  const handleProfileSubmit = async () => {
    try {
      await form.validateFields();

      message.info(
        "Giao diện đã sẵn sàng. Cần API cập nhật hồ sơ để lưu thông tin lên máy chủ.",
      );
    } catch {
      // Form sẽ tự hiển thị lỗi validate.
    }
  };

  const handlePasswordSubmit = async () => {
    try {
      await passwordForm.validateFields();

      message.info(
        "Cần API đổi mật khẩu từ backend để thực hiện thao tác này.",
      );
    } catch {
      // Form sẽ tự hiển thị lỗi validate.
    }
  };

  return (
    <div className="my-profile-page">
      <style>{STYLES}</style>

      <div className="mp-heading">
        <div className="mp-eyebrow">
          <CircleUserRound size={15} />
          Hồ sơ cá nhân
        </div>

        <Title level={2} className="mp-title">
          Tài khoản của tôi
        </Title>

        <Text className="mp-subtitle">
          Quản lý thông tin cá nhân và bảo mật tài khoản của bạn.
        </Text>
      </div>

      <div className="mp-cover">
        <div className="mp-cover-content">
          <div className="mp-avatar-wrap">
            <Avatar
              className="mp-avatar"
              size={92}
              src={avatarUrl || undefined}
              icon={!avatarUrl ? <UserRound size={36} /> : undefined}
              style={{
                background: "#e5f8ec",
                color: "#008b44",
                fontWeight: 800,
              }}
            >
              {!avatarUrl ? getInitials(displayName) : null}
            </Avatar>

            <button
              type="button"
              className="mp-avatar-edit"
              title="Chỉnh sửa hồ sơ"
              onClick={openEdit}
            >
              <Camera size={15} />
            </button>
          </div>

          <div style={{ minWidth: 0 }}>
            <span className="mp-cover-name">{displayName}</span>

            <span className="mp-cover-email">
              {user?.email || "Chưa cập nhật email"}
            </span>

            <div className="mp-cover-tags">
              <Tag icon={<CheckCircle2 size={12} />}>Tài khoản thành viên</Tag>
              <Tag>{getRoleLabel(user)}</Tag>
            </div>
          </div>
        </div>
      </div>

      <Row gutter={[18, 18]}>
        <Col xs={24} lg={15}>
          <Card className="mp-card">
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 22,
              }}
            >
              <div>
                <div className="mp-section-title">
                  <UserRound size={19} color="#00a650" />
                  Thông tin cá nhân
                </div>
                <span
                  className="mp-section-subtitle"
                  style={{ marginBottom: 0 }}
                >
                  Thông tin cơ bản của tài khoản của bạn.
                </span>
              </div>

              <Button
                type="primary"
                icon={<Edit3 size={15} />}
                onClick={openEdit}
                style={{
                  background: "#00a650",
                  borderColor: "#00a650",
                  borderRadius: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                Chỉnh sửa
              </Button>
            </div>

            <div className="mp-info-row">
              <div className="mp-info-icon">
                <UserRound size={18} />
              </div>
              <div className="mp-info-main">
                <span className="mp-info-label">Họ và tên</span>
                <span className="mp-info-value">{displayName}</span>
              </div>
            </div>

            <div className="mp-info-row">
              <div className="mp-info-icon">
                <Mail size={18} />
              </div>
              <div className="mp-info-main">
                <span className="mp-info-label">Email</span>
                <span className="mp-info-value">
                  {user?.email || "Chưa cập nhật"}
                </span>
              </div>
            </div>

            <div className="mp-info-row">
              <div className="mp-info-icon">
                <Phone size={18} />
              </div>
              <div className="mp-info-main">
                <span className="mp-info-label">Số điện thoại</span>
                <span className="mp-info-value">
                  {user?.phone || user?.phone_number || "Chưa cập nhật"}
                </span>
              </div>
            </div>

            <div className="mp-info-row">
              <div className="mp-info-icon">
                <MapPin size={18} />
              </div>
              <div className="mp-info-main">
                <span className="mp-info-label">Địa chỉ</span>
                <span className="mp-info-value">
                  {user?.address || "Chưa cập nhật"}
                </span>
              </div>
            </div>

            <div className="mp-info-row">
              <div className="mp-info-icon">
                <ShieldCheck size={18} />
              </div>
              <div className="mp-info-main">
                <span className="mp-info-label">Vai trò</span>
                <span className="mp-info-value">{getRoleLabel(user)}</span>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={9}>
          <Card className="mp-card">
            <div className="mp-section-title">
              <ShieldCheck size={19} color="#00a650" />
              Bảo mật tài khoản
            </div>

            <span className="mp-section-subtitle">
              Giữ tài khoản của bạn an toàn và bảo mật.
            </span>

            <button
              type="button"
              className="mp-action-button"
              onClick={() => setPasswordOpen(true)}
            >
              <span className="mp-action-icon">
                <LockKeyhole size={19} />
              </span>
              <span className="mp-action-content">
                <span className="mp-action-title">Đổi mật khẩu</span>
                <span className="mp-action-desc">
                  Cập nhật mật khẩu để bảo vệ tài khoản.
                </span>
              </span>
              <ChevronRight className="mp-action-arrow" size={18} />
            </button>

            <div className="mp-security-box">
              <ShieldCheck size={20} />
              <div>
                <span className="mp-security-title">
                  Bảo vệ thông tin cá nhân
                </span>
                <span className="mp-security-desc">
                  Không chia sẻ mật khẩu hoặc mã xác thực của bạn với người
                  khác.
                </span>
              </div>
            </div>
          </Card>

          <Card className="mp-card" style={{ marginTop: 18 }}>
            <div className="mp-section-title">
              <CircleUserRound size={19} color="#00a650" />
              Tài khoản
            </div>

            <span className="mp-section-subtitle">
              Thông tin đăng nhập hiện tại.
            </span>

            <div className="mp-info-row">
              <div className="mp-info-icon">
                <AtSign size={18} />
              </div>
              <div className="mp-info-main">
                <span className="mp-info-label">Tên đăng nhập</span>
                <span className="mp-info-value">
                  {user?.username || user?.email || "Chưa có thông tin"}
                </span>
              </div>
            </div>

            <div className="mp-info-row">
              <div className="mp-info-icon">
                <KeyRound size={18} />
              </div>
              <div className="mp-info-main">
                <span className="mp-info-label">Mật khẩu</span>
                <span className="mp-info-value">••••••••••</span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        title={
          <span
            style={{ display: "inline-flex", gap: 9, alignItems: "center" }}
          >
            <Edit3 size={18} color="#00a650" />
            Chỉnh sửa thông tin cá nhân
          </span>
        }
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setEditOpen(false)}>
            Hủy
          </Button>,
          <Button
            key="save"
            type="primary"
            icon={<Save size={15} />}
            onClick={handleProfileSubmit}
            style={{
              background: "#00a650",
              borderColor: "#00a650",
              borderRadius: 10,
            }}
          >
            Lưu thay đổi
          </Button>,
        ]}
        centered
        destroyOnHidden
        width={520}
      >
        <Alert
          type="info"
          showIcon
          message="Chưa kết nối API cập nhật"
          description="Thông tin đang hiển thị từ tài khoản đăng nhập. Cần endpoint cập nhật hồ sơ để lưu thay đổi lên máy chủ."
          style={{ marginBottom: 20, borderRadius: 11 }}
        />

        <Form form={form} layout="vertical" className="mp-edit-form">
          <Form.Item
            name="full_name"
            label="Họ và tên"
            rules={[{ required: true, message: "Vui lòng nhập họ và tên." }]}
          >
            <Input
              prefix={<UserRound size={16} />}
              placeholder="Nhập họ và tên"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: "email", message: "Email không hợp lệ." }]}
          >
            <Input
              prefix={<Mail size={16} />}
              placeholder="example@email.com"
            />
          </Form.Item>

          <Form.Item name="phone" label="Số điện thoại">
            <Input
              prefix={<Phone size={16} />}
              placeholder="Nhập số điện thoại"
            />
          </Form.Item>

          <Form.Item name="address" label="Địa chỉ">
            <Input prefix={<MapPin size={16} />} placeholder="Nhập địa chỉ" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <span
            style={{ display: "inline-flex", gap: 9, alignItems: "center" }}
          >
            <LockKeyhole size={18} color="#00a650" />
            Đổi mật khẩu
          </span>
        }
        open={passwordOpen}
        onCancel={() => {
          setPasswordOpen(false);
          passwordForm.resetFields();
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setPasswordOpen(false);
              passwordForm.resetFields();
            }}
          >
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            icon={<ShieldCheck size={15} />}
            onClick={handlePasswordSubmit}
            style={{
              background: "#00a650",
              borderColor: "#00a650",
              borderRadius: 10,
            }}
          >
            Xác nhận
          </Button>,
        ]}
        centered
        destroyOnHidden
        width={460}
      >
        <Alert
          type="info"
          showIcon
          message="Chưa kết nối API đổi mật khẩu"
          description="Biểu mẫu đã sẵn sàng nhưng chưa gửi dữ liệu hoặc thay đổi mật khẩu trên máy chủ."
          style={{ marginBottom: 20, borderRadius: 11 }}
        />

        <Form form={passwordForm} layout="vertical" className="mp-edit-form">
          <Form.Item
            name="current_password"
            label="Mật khẩu hiện tại"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu hiện tại." },
            ]}
          >
            <Input.Password
              prefix={<LockKeyhole size={16} />}
              placeholder="Nhập mật khẩu hiện tại"
            />
          </Form.Item>

          <Form.Item
            name="new_password"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu mới." },
              { min: 8, message: "Mật khẩu phải có ít nhất 8 ký tự." },
            ]}
          >
            <Input.Password
              prefix={<KeyRound size={16} />}
              placeholder="Tối thiểu 8 ký tự"
            />
          </Form.Item>

          <Form.Item
            name="confirm_password"
            label="Xác nhận mật khẩu mới"
            dependencies={["new_password"]}
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu mới." },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("new_password") === value) {
                    return Promise.resolve();
                  }

                  return Promise.reject(
                    new Error("Mật khẩu xác nhận không khớp."),
                  );
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<KeyRound size={16} />}
              placeholder="Nhập lại mật khẩu mới"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
