import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Row,
  Skeleton,
  Statistic,
  Typography,
} from "antd";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Coins,
  RefreshCw,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import dashboardApi from "../../api/dashboardApi";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";

const { Text } = Typography;

function unwrap(response) {
  let data = response?.data;
  if (data?.data !== undefined) data = data.data;
  return data?.overview || data?.dashboard || data;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await dashboardApi.getAdminOverview();
      setData(unwrap(response));
    } catch (err) {
      console.error(
        "[AdminDashboard] Lỗi tải dashboard:",
        err.response?.data || err.message,
      );

      setError(
        err.response?.data?.message ||
          "Không tải được dữ liệu tổng quan. Hãy kiểm tra API dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Hỗ trợ một số tên thuộc tính phổ biến của API.
  const stats = [
    {
      title: "Thành viên",
      value:
        data?.total_members ?? data?.totalMembers ?? data?.member_count ?? 0,
      icon: <Users size={21} />,
      className: "stat-blue",
      suffix: "người",
    },
    {
      title: "Công việc hôm nay",
      value: data?.today_tasks ?? data?.todayTasks ?? data?.total_today ?? 0,
      icon: <ClipboardList size={21} />,
      className: "stat-gold",
      suffix: "việc",
    },
    {
      title: "Đã hoàn thành",
      value:
        data?.completed_today ??
        data?.completedToday ??
        data?.completed_count ??
        0,
      icon: <CheckCircle2 size={21} />,
      className: "stat-green",
      suffix: "việc",
    },
    {
      title: "Chờ duyệt",
      value:
        data?.pending_review ?? data?.pendingReview ?? data?.pending_count ?? 0,
      icon: <Clock3 size={21} />,
      className: "stat-orange",
      suffix: "việc",
    },
  ];

  const quickActions = [
    {
      title: "Quản lý thành viên",
      description: "Thêm tài khoản và phân công thành viên.",
      icon: <Users size={21} />,
      path: "/admin/members",
    },
    {
      title: "Tạo công việc",
      description: "Giao việc và đặt thời hạn thực hiện.",
      icon: <ClipboardList size={21} />,
      path: "/admin/tasks",
    },
    {
      title: "Duyệt minh chứng",
      description: "Xem ảnh và duyệt công việc đã gửi.",
      icon: <CalendarCheck size={21} />,
      path: "/admin/approvals",
    },
    {
      title: "Quản lý tiền thưởng",
      description: "Tổng hợp kết quả và thanh toán thưởng.",
      icon: <Coins size={21} />,
      path: "/admin/rewards",
    },
  ];

  return (
    <div className="page-container">
      <div className="page-heading">
        <div>
          <div className="page-eyebrow">TỔNG QUAN GIA ĐÌNH</div>
          <h1 className="page-title">Tổng quan</h1>
          <p className="page-description">
            Theo dõi công việc và hoạt động của gia đình.
          </p>
        </div>

        <Button
          icon={<RefreshCw size={16} />}
          onClick={loadDashboard}
          loading={loading}
        >
          Làm mới
        </Button>
      </div>

      <Card className="welcome-card" bordered={false}>
        <div className="welcome-card-content">
          <div>
            <div className="welcome-label">KHÔNG GIAN QUẢN TRỊ</div>
            <h2>Chào mừng trở lại!</h2>
            <p>Mỗi công việc được sẻ chia là một cách để chăm sóc tổ ấm.</p>
            <div className="welcome-date">
              <CalendarCheck size={16} />
              {formatDate(new Date())}
            </div>
          </div>

          <div className="welcome-decoration">
            <div className="welcome-decoration-circle">
              <ClipboardList size={44} />
            </div>
          </div>
        </div>
      </Card>

      {error && (
        <Alert
          className="dashboard-error"
          type="warning"
          showIcon
          message={error}
          action={
            <Button size="small" onClick={loadDashboard}>
              Thử lại
            </Button>
          }
        />
      )}

      <div className="section-heading">
        <div>
          <h2>Hoạt động hôm nay</h2>
          <p>Các chỉ số tổng hợp từ hệ thống.</p>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        {stats.map((item) => (
          <Col xs={24} sm={12} xl={6} key={item.title}>
            <Card className="stat-card" bordered={false}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 1 }} />
              ) : (
                <>
                  <div className="stat-card-top">
                    <span className={`stat-icon ${item.className}`}>
                      {item.icon}
                    </span>
                    <Text className="stat-card-label">{item.title}</Text>
                  </div>

                  <Statistic
                    value={item.value}
                    suffix={<span className="stat-suffix">{item.suffix}</span>}
                    valueStyle={{
                      color: "#173B5E",
                      fontSize: 30,
                      fontWeight: 700,
                    }}
                  />
                </>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      <div className="section-heading quick-actions-heading">
        <div>
          <h2>Truy cập nhanh</h2>
          <p>Các chức năng quản lý thường dùng.</p>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        {quickActions.map((action) => (
          <Col xs={24} sm={12} xl={6} key={action.path}>
            <Card
              hoverable
              bordered={false}
              className="quick-action-card"
              onClick={() => navigate(action.path)}
            >
              <div className="quick-action-icon">{action.icon}</div>
              <h3>{action.title}</h3>
              <p>{action.description}</p>
              <div className="quick-action-link">
                Mở chức năng <ArrowRight size={15} />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="dashboard-note-card" bordered={false}>
        <div className="dashboard-note-content">
          <div className="dashboard-note-icon">
            <Coins size={22} />
          </div>
          <div>
            <h3>Chính sách tiền thưởng tháng</h3>
            <p>
              Dưới 50 việc: {formatCurrency(30000)} · Từ 50 đến 69 việc:{" "}
              {formatCurrency(50000)} · Từ 70 việc: {formatCurrency(100000)}.
            </p>
            <Text type="secondary">
              Số lượng tính theo công việc đã được duyệt hoàn thành.
            </Text>
          </div>
        </div>
      </Card>

      {!loading && !data && !error && (
        <Empty description="Chưa có dữ liệu tổng quan" />
      )}
    </div>
  );
}
