import React, { useEffect } from "react";
import { Button, Form, Input, Typography, Alert, App as AntApp } from "antd";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  House,
  LockKeyhole,
  Mail,
  Sparkles,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const { Title, Text, Paragraph } = Typography;

export default function Login() {
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();
  const { login, loading, user, initializing } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (initializing || !user) return;

    navigate(user.role === "admin" ? "/admin" : "/member/tasks", {
      replace: true,
    });
  }, [user, initializing, navigate]);

  const handleSubmit = async (values) => {
    try {
      const currentUser = await login({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });

      message.success("Đăng nhập thành công!");

      const requestedPath = location.state?.from;
      const defaultPath =
        currentUser.role === "admin" ? "/admin" : "/member/tasks";

      const validPath =
        currentUser.role === "admin"
          ? requestedPath?.startsWith("/admin")
          : requestedPath?.startsWith("/member");

      navigate(validPath ? requestedPath : defaultPath, { replace: true });
    } catch (error) {
      const responseData = error.response?.data;

      const errorMessage =
        responseData?.message ||
        responseData?.error ||
        error.message ||
        "Không thể đăng nhập. Vui lòng thử lại.";

      message.error(errorMessage);
    }
  };

  return (
    <div className="login-page">
      <div className="login-decoration login-decoration-one" />
      <div className="login-decoration login-decoration-two" />

      <div className="login-shell">
        <section className="login-intro">
          <div className="brand-lockup">
            <div className="brand-logo">
              <House size={26} strokeWidth={2.2} />
            </div>
            <div>
              <div className="brand-name">Việc nhà</div>
              <div className="brand-caption">HOME TASK</div>
            </div>
          </div>

          <div className="login-intro-content">
            <span className="eyebrow">
              <Sparkles size={15} />
              CÙNG NHAU CHĂM SÓC TỔ ẤM
            </span>

            <Title className="login-headline">
              Việc nhỏ mỗi ngày,
              <br />
              <span>ấm áp mỗi nhà.</span>
            </Title>

            <Paragraph className="login-description">
              Quản lý công việc gia đình thật đơn giản. Phân công rõ ràng, theo
              dõi tiến độ và ghi nhận những đóng góp của từng thành viên.
            </Paragraph>

            <div className="login-benefits">
              <div className="login-benefit">
                <div className="benefit-icon">
                  <ClipboardCheck size={19} />
                </div>
                <div>
                  <Text strong>Lịch việc rõ ràng</Text>
                  <Text className="benefit-description">
                    Biết hôm nay cần làm gì.
                  </Text>
                </div>
              </div>

              <div className="login-benefit">
                <div className="benefit-icon">
                  <CheckCircle2 size={19} />
                </div>
                <div>
                  <Text strong>Ghi nhận minh bạch</Text>
                  <Text className="benefit-description">
                    Theo dõi việc hoàn thành và phần thưởng.
                  </Text>
                </div>
              </div>
            </div>
          </div>

          <div className="login-footer-note">
            <span className="footer-dot" />
            Một mái nhà, cùng nhau sẻ chia.
          </div>
        </section>

        <section className="login-form-panel">
          <div className="mobile-brand">
            <div className="brand-logo">
              <House size={23} />
            </div>
            <span className="brand-name">Việc nhà</span>
          </div>

          <div className="login-form-content">
            <div className="login-welcome">CHÀO MỪNG BẠN TRỞ LẠI</div>

            <Title level={2} className="login-form-title">
              Đăng nhập
            </Title>

            <Paragraph className="login-form-subtitle">
              Nhập thông tin tài khoản để tiếp tục.
            </Paragraph>

            <Form
              form={form}
              layout="vertical"
              requiredMark={false}
              onFinish={handleSubmit}
              size="large"
              autoComplete="on"
            >
              <Form.Item
                label="Địa chỉ email"
                name="email"
                rules={[
                  { required: true, message: "Vui lòng nhập email." },
                  { type: "email", message: "Email không đúng định dạng." },
                ]}
              >
                <Input
                  prefix={<Mail size={18} className="input-icon" />}
                  placeholder="name@example.com"
                  autoComplete="username"
                />
              </Form.Item>

              <Form.Item
                label="Mật khẩu"
                name="password"
                rules={[{ required: true, message: "Vui lòng nhập mật khẩu." }]}
              >
                <Input.Password
                  prefix={<LockKeyhole size={18} className="input-icon" />}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                />
              </Form.Item>

              <Form.Item className="login-submit-item">
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  className="login-submit-button"
                >
                  Đăng nhập
                  <ArrowRight size={18} />
                </Button>
              </Form.Item>
            </Form>

            <Alert
              className="login-security-note"
              type="info"
              showIcon
              message="Tài khoản được cấp bởi quản trị viên gia đình."
            />

            <div className="login-form-bottom">
              <span>Việc nhà</span>
              <span>•</span>
              <span>Quản lý việc nhà dễ dàng</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
