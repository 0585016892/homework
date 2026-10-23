import React, { useEffect } from "react";
import { Alert, Button, Form, Input, Typography, App as AntApp } from "antd";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  House,
  LockKeyhole,
  Mail,
  Sparkles,
  Users,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import "./Login.css";

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

      navigate(validPath ? requestedPath : defaultPath, {
        replace: true,
      });
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
    <main className="home-login-page">
      <div className="home-login-glow home-login-glow-one" />
      <div className="home-login-glow home-login-glow-two" />

      <div className="home-login-shell">
        {/* Khu vực giới thiệu */}
        <section className="home-login-intro">
          <a
            className="home-login-brand"
            href="/"
            aria-label="Việc nhà - Trang chủ"
          >
            <span className="home-login-brand-icon">
              <House size={25} strokeWidth={2.3} />
            </span>

            <span className="home-login-brand-text">
              <strong>Việc nhà</strong>
              <small>HOME TASK</small>
            </span>
          </a>

          <div className="home-login-intro-body">
            <div className="home-login-eyebrow">
              <Sparkles size={15} />
              <span>CÙNG NHAU CHĂM SÓC TỔ ẤM</span>
            </div>

            <Title className="home-login-headline">
              Nhà là nơi
              <br />
              <span>cùng nhau sẻ chia.</span>
            </Title>

            <Paragraph className="home-login-description">
              Phân công công việc dễ dàng, theo dõi tiến độ và ghi nhận những
              đóng góp của mỗi thành viên trong gia đình.
            </Paragraph>

            <div className="home-login-feature-list">
              <div className="home-login-feature">
                <span className="home-login-feature-icon">
                  <ClipboardCheck size={20} />
                </span>
                <div>
                  <Text strong>Lịch việc rõ ràng</Text>
                  <Text className="home-login-feature-desc">
                    Biết hôm nay cần làm gì.
                  </Text>
                </div>
                <CheckCircle2 className="home-login-feature-check" size={19} />
              </div>

              <div className="home-login-feature">
                <span className="home-login-feature-icon">
                  <Users size={20} />
                </span>
                <div>
                  <Text strong>Cùng nhau đóng góp</Text>
                  <Text className="home-login-feature-desc">
                    Chia sẻ việc nhà công bằng hơn.
                  </Text>
                </div>
                <CheckCircle2 className="home-login-feature-check" size={19} />
              </div>
            </div>

            <div className="home-login-quote">
              <span className="home-login-quote-mark">“</span>
              <div>
                <strong>Một mái nhà, cùng nhau sẻ chia.</strong>
                <span>Những điều nhỏ tạo nên hạnh phúc lớn.</span>
              </div>
            </div>
          </div>

          <div className="home-login-intro-footer">
            <span className="home-login-footer-dot" />
            Không gian riêng dành cho gia đình bạn
          </div>
        </section>

        {/* Khu vực đăng nhập */}
        <section className="home-login-panel">
          <div className="home-login-mobile-brand">
            <span className="home-login-brand-icon">
              <House size={23} />
            </span>
            <span>Việc nhà</span>
          </div>

          <div className="home-login-form-wrap">
            <div className="home-login-form-symbol">
              <LockKeyhole size={23} />
            </div>

            <div className="home-login-welcome">CHÀO MỪNG BẠN TRỞ LẠI</div>

            <Title level={1} className="home-login-form-title">
              Đăng nhập
            </Title>

            <Paragraph className="home-login-form-subtitle">
              Đăng nhập để tiếp tục quản lý công việc gia đình.
            </Paragraph>

            <Form
              form={form}
              layout="vertical"
              requiredMark={false}
              onFinish={handleSubmit}
              size="large"
              autoComplete="on"
              className="home-login-form"
            >
              <Form.Item
                label="Địa chỉ email"
                name="email"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập email.",
                  },
                  {
                    type: "email",
                    message: "Email không đúng định dạng.",
                  },
                ]}
              >
                <Input
                  prefix={<Mail size={18} />}
                  placeholder="name@example.com"
                  autoComplete="username"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck={false}
                />
              </Form.Item>

              <Form.Item
                label="Mật khẩu"
                name="password"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập mật khẩu.",
                  },
                ]}
              >
                <Input.Password
                  prefix={<LockKeyhole size={18} />}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                />
              </Form.Item>

              <Form.Item className="home-login-submit-item">
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  className="home-login-submit"
                >
                  <span>Đăng nhập</span>
                  {!loading && <ArrowRight size={18} />}
                </Button>
              </Form.Item>
            </Form>

            <Alert
              className="home-login-security"
              type="info"
              showIcon
              message="Tài khoản được cấp bởi quản trị viên gia đình."
            />

            <div className="home-login-form-footer">
              <span>Việc nhà</span>
              <span className="home-login-footer-separator">·</span>
              <span>Chăm nhà bằng sự sẻ chia</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
