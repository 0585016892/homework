import React, { useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Dropdown,
  Layout,
  Menu,
  Typography,
  Tooltip,
} from "antd";
import {
  Bell,
  ChartNoAxesCombined,
  CheckCheck,
  ChevronDown,
  ClipboardList,
  Coins,
  House,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Users,
  CalendarDays,
} from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const { Header, Sider, Content, Footer } = Layout;
const { Text } = Typography;

const adminMenu = [
  {
    key: "/admin",
    label: "Tổng quan",
    icon: <LayoutDashboard size={18} />,
  },
  {
    key: "/admin/members",
    label: "Thành viên",
    icon: <Users size={18} />,
  },
  {
    key: "/admin/tasks",
    label: "Công việc",
    icon: <ClipboardList size={18} />,
  },
  {
    key: "/admin/templates",
    label: "Lịch công việc",
    icon: <CalendarDays size={18} />,
  },
  {
    key: "/admin/approvals",
    label: "Duyệt công việc",
    icon: <CheckCheck size={18} />,
  },
  {
    key: "/admin/reports",
    label: "Báo cáo",
    icon: <ChartNoAxesCombined size={18} />,
  },
  {
    key: "/admin/rewards",
    label: "Tiền thưởng",
    icon: <Coins size={18} />,
  },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const selectedKey = useMemo(() => {
    if (location.pathname === "/admin") return "/admin";

    const matchingItem = adminMenu
      .filter((item) => item.key !== "/admin")
      .find((item) => location.pathname.startsWith(item.key));

    return matchingItem?.key || "/admin";
  }, [location.pathname]);

  const handleNavigate = ({ key }) => {
    navigate(key);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const profileItems = [
    {
      key: "profile",
      icon: <Settings size={16} />,
      label: "Thông tin tài khoản",
      onClick: () => navigate("/admin/profile"),
    },
    {
      key: "logout",
      icon: <LogOut size={16} />,
      label: "Đăng xuất",
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Layout className="app-layout">
      {mobileMenuOpen && (
        <button
          type="button"
          className="mobile-menu-overlay"
          aria-label="Đóng menu"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={252}
        collapsedWidth={78}
        className={`app-sider ${mobileMenuOpen ? "mobile-open" : ""}`}
      >
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <House size={23} />
          </div>

          {!collapsed && (
            <div className="sidebar-brand-text">
              <div className="sidebar-brand-name">Việc nhà</div>
              <div className="sidebar-brand-subtitle">HOME TASK</div>
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="sidebar-section-label">QUẢN LÝ GIA ĐÌNH</div>
        )}

        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={adminMenu}
          onClick={handleNavigate}
          className="app-sidebar-menu"
        />

        <div className="sidebar-bottom">
          <div className="sidebar-help-icon">
            <House size={18} />
          </div>

          {!collapsed && (
            <div className="sidebar-help-text">
              <Text strong>Cùng chăm sóc tổ ấm</Text>
              <Text type="secondary">Từng việc nhỏ, mỗi ngày.</Text>
            </div>
          )}
        </div>
      </Sider>

      <Layout className="app-main-layout">
        <Header className="app-header">
          <div className="header-left">
            <Tooltip title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}>
              <Button
                type="text"
                className="desktop-menu-toggle"
                icon={
                  collapsed ? (
                    <PanelLeftOpen size={20} />
                  ) : (
                    <PanelLeftClose size={20} />
                  )
                }
                onClick={() => setCollapsed((value) => !value)}
              />
            </Tooltip>

            <Button
              type="text"
              className="mobile-menu-toggle"
              icon={<MenuIcon size={21} />}
              onClick={() => setMobileMenuOpen((value) => !value)}
            />

            <div className="header-context">
              <span className="header-context-title">Không gian quản trị</span>
              <span className="header-context-subtitle">
                Quản lý công việc gia đình
              </span>
            </div>
          </div>

          <div className="header-right">
            <Tooltip title="Thông báo">
              <Button
                type="text"
                className="header-icon-button"
                icon={<Bell size={19} />}
                onClick={() => navigate("/admin/approvals")}
              />
            </Tooltip>

            <div className="header-divider" />

            <Dropdown menu={{ items: profileItems }} trigger={["click"]}>
              <button type="button" className="profile-trigger">
                <Avatar className="profile-avatar">
                  {(user?.full_name || "A").charAt(0).toUpperCase()}
                </Avatar>

                <span className="profile-text">
                  <span className="profile-name">
                    {user?.full_name || "Quản trị viên"}
                  </span>
                  <span className="profile-role">Quản trị viên</span>
                </span>

                <ChevronDown size={16} className="profile-chevron" />
              </button>
            </Dropdown>
          </div>
        </Header>

        <Content className="app-content">
          <Outlet />
        </Content>

        <Footer className="app-footer">
          <span>© {new Date().getFullYear()} Việc nhà</span>
          <span>Cùng nhau sẻ chia việc nhà.</span>
        </Footer>
      </Layout>
    </Layout>
  );
}
