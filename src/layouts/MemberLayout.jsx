import React, { useMemo, useState } from "react";
import { Avatar, Button, Dropdown, Layout, Menu, Tooltip } from "antd";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Coins,
  Heart,
  House,
  LogOut,
  Menu as MenuIcon,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import "./MemberLayout.css";

const { Header, Sider, Content, Footer } = Layout;

const memberMenu = [
  {
    key: "/member/tasks",
    icon: <ClipboardCheck size={19} strokeWidth={1.9} />,
    label: "Việc của tôi",
  },
  {
    key: "/member/calendar",
    icon: <CalendarDays size={19} strokeWidth={1.9} />,
    label: "Lịch công việc",
  },
  {
    key: "/member/rewards",
    icon: <Coins size={19} strokeWidth={1.9} />,
    label: "Tiền thưởng",
  },
  {
    key: "/member/profile",
    icon: <UserRound size={19} strokeWidth={1.9} />,
    label: "Tài khoản",
  },
];

const pageDetails = {
  "/member/tasks": {
    title: "Việc của tôi",
    subtitle: "Mỗi việc nhỏ hoàn thành là một niềm vui.",
    icon: <ClipboardCheck size={19} />,
    label: "CÔNG VIỆC",
  },
  "/member/calendar": {
    title: "Lịch công việc",
    subtitle: "Sắp xếp thời gian, vun đắp tổ ấm.",
    icon: <CalendarDays size={19} />,
    label: "KẾ HOẠCH",
  },
  "/member/rewards": {
    title: "Tiền thưởng",
    subtitle: "Ghi nhận nỗ lực, tích lũy thành quả.",
    icon: <Coins size={19} />,
    label: "THÀNH QUẢ",
  },
  "/member/profile": {
    title: "Tài khoản của tôi",
    subtitle: "Quản lý thông tin và tài khoản cá nhân.",
    icon: <UserRound size={19} />,
    label: "CÁ NHÂN",
  },
};

function getInitials(name) {
  const words = String(name || "Thành viên")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return words
    .slice(-2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

export default function MemberLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey = useMemo(() => {
    return (
      memberMenu.find(
        (item) =>
          location.pathname === item.key ||
          location.pathname.startsWith(`${item.key}/`),
      )?.key || "/member/tasks"
    );
  }, [location.pathname]);

  const pageInfo = pageDetails[selectedKey] || {
    title: "Không gian của tôi",
    subtitle: "Cùng nhau hoàn thành việc nhà mỗi ngày.",
    icon: <House size={19} />,
    label: "GIA ĐÌNH",
  };

  const displayName =
    user?.full_name || user?.name || user?.username || "Thành viên";

  const email = user?.email || "";

  const initials = getInitials(displayName);

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  const navigateTo = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const profileItems = [
    {
      key: "profile",
      icon: <UserRound size={16} />,
      label: "Thông tin tài khoản",
      onClick: () => navigateTo("/member/profile"),
    },
    {
      key: "divider",
      type: "divider",
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
    <Layout className="member-app">
      {mobileMenuOpen && (
        <button
          type="button"
          className="member-mobile-overlay"
          aria-label="Đóng menu"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={258}
        collapsedWidth={78}
        className={[
          "member-sidebar",
          collapsed ? "member-sidebar-collapsed" : "",
          mobileMenuOpen ? "member-sidebar-mobile-open" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="member-sidebar-inner">
          <button
            type="button"
            className="member-brand"
            onClick={() => navigateTo("/member/tasks")}
            aria-label="Về trang công việc"
          >
            <span className="member-brand-mark">
              <House size={23} strokeWidth={2.3} />
            </span>

            {!collapsed && (
              <span className="member-brand-copy">
                <strong>Việc nhà</strong>
                <small>HOME & FAMILY</small>
              </span>
            )}

            {mobileMenuOpen && (
              <span
                className="member-mobile-close"
                onClick={(event) => {
                  event.stopPropagation();
                  setMobileMenuOpen(false);
                }}
              >
                <X size={19} />
              </span>
            )}
          </button>

          <div className="member-sidebar-caption">
            {!collapsed && (
              <>
                <span>KHÔNG GIAN</span>
                <span className="member-caption-line" />
              </>
            )}
          </div>

          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={memberMenu}
            className="member-navigation"
            onClick={({ key }) => navigateTo(key)}
          />

          {!collapsed && (
            <div className="member-sidebar-promo">
              <div className="member-promo-decoration member-promo-decoration-one" />
              <div className="member-promo-decoration member-promo-decoration-two" />

              <div className="member-promo-icon">
                <Heart size={20} fill="currentColor" />
              </div>

              <strong>Cùng nhau sẻ chia</strong>

              <p>Một chút sẻ chia hôm nay, một mái ấm hạnh phúc ngày mai.</p>

              <div className="member-promo-footer">
                <Sparkles size={14} />
                <span>Gia đình là yêu thương</span>
              </div>
            </div>
          )}

          <div className="member-sidebar-bottom">
            <span className="member-status-dot" />

            {!collapsed && (
              <div className="member-sidebar-bottom-copy">
                <strong>Không gian gia đình</strong>
                <small>Luôn kết nối yêu thương</small>
              </div>
            )}
          </div>
        </div>
      </Sider>

      <Layout className="member-main">
        <Header className="member-header">
          <div className="member-header-left">
            <Tooltip
              title={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
            >
              <Button
                type="text"
                className="member-desktop-toggle"
                aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
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
              className="member-mobile-toggle"
              aria-label={mobileMenuOpen ? "Đóng menu" : "Mở menu"}
              icon={mobileMenuOpen ? <X size={21} /> : <MenuIcon size={21} />}
              onClick={() => setMobileMenuOpen((value) => !value)}
            />

            <div className="member-header-heading">
              <div className="member-breadcrumb">
                <span>Việc nhà</span>
                <ChevronRight size={13} />
                <span className="member-breadcrumb-current">
                  {pageInfo.label}
                </span>
              </div>

              <h1>{pageInfo.title}</h1>
              <p>{pageInfo.subtitle}</p>
            </div>
          </div>

          <div className="member-header-right">
            <div className="member-welcome-chip">
              <span className="member-welcome-icon">
                <Sparkles size={15} />
              </span>
              <span>Chào bạn!</span>
            </div>

            <Tooltip title="Xem công việc của tôi">
              <button
                type="button"
                className="member-notification-button"
                aria-label="Xem công việc của tôi"
                onClick={() => navigateTo("/member/tasks")}
              >
                <Bell size={19} strokeWidth={1.9} />
                <span className="member-notification-dot" />
              </button>
            </Tooltip>

            <div className="member-header-separator" />

            <Dropdown
              menu={{ items: profileItems }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <button
                type="button"
                className="member-profile-trigger"
                aria-label="Mở menu tài khoản"
              >
                <Avatar className="member-profile-avatar">{initials}</Avatar>

                <span className="member-profile-copy">
                  <strong>{displayName}</strong>
                  <small>{email || "Thành viên"}</small>
                </span>

                <ChevronDown size={16} className="member-profile-chevron" />
              </button>
            </Dropdown>
          </div>
        </Header>

        <Content className="member-content">
          <div className="member-content-inner">
            <div className="member-page-context">
              <span className="member-page-context-icon">{pageInfo.icon}</span>
              <span>{pageInfo.title}</span>
              <span className="member-page-context-dot" />
              <span className="member-page-context-muted">
                Không gian của bạn
              </span>
            </div>

            <Outlet />
          </div>
        </Content>

        <Footer className="member-footer">
          <div className="member-footer-left">
            <span className="member-footer-icon">
              <Heart size={14} fill="currentColor" />
            </span>
            <span>Việc nhỏ hôm nay, niềm vui ngày mai.</span>
          </div>

          <span className="member-footer-copy">
            © {new Date().getFullYear()} Việc nhà
          </span>
        </Footer>
      </Layout>
    </Layout>
  );
}
