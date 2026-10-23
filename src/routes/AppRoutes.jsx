import React from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { Button, Result } from "antd";

import Login from "../pages/auth/Login";
import AdminLayout from "../layouts/AdminLayout";
import MemberLayout from "../layouts/MemberLayout";
import ProtectedRoute from "../components/common/ProtectedRoute";
import ModulePlaceholder from "../components/common/ModulePlaceholder";
import useAuth from "../hooks/useAuth";

import Dashboard from "../pages/admin/Dashboard";
import Members from "../pages/admin/Members";
import Tasks from "../pages/admin/Tasks";
import TaskTemplates from "../pages/admin/TaskTemplates";
import TaskApprovals from "../pages/admin/TaskApprovals";
import Reports from "../pages/admin/Reports";
import Rewards from "../pages/admin/Rewards";

import MyTasks from "../pages/member/MyTasks";
import TaskDetail from "../pages/member/TaskDetail";
import MyRewards from "../pages/member/MyRewards";
import MyProfile from "../pages/member/MyProfile";
import MemberCalendar from "../pages/member/MemberCalendar";

function HomeRedirect() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return <div className="app-initial-loading">Đang tải...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Navigate to={user.role === "admin" ? "/admin" : "/member/tasks"} replace />
  );
}

function NotFound() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const goHome = () => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    navigate(user.role === "admin" ? "/admin" : "/member/tasks", {
      replace: true,
    });
  };

  return (
    <Result
      status="404"
      title="Không tìm thấy trang"
      subTitle="Đường dẫn này không tồn tại hoặc đã được thay đổi."
      extra={
        <Button type="primary" onClick={goHome}>
          Về trang chủ
        </Button>
      }
    />
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="members" element={<Members />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="templates" element={<TaskTemplates />} />
          <Route path="approvals" element={<TaskApprovals />} />
          <Route path="reports" element={<Reports />} />
          <Route path="rewards" element={<Rewards />} />

          <Route
            path="profile"
            element={
              <ModulePlaceholder
                title="Thông tin tài khoản"
                description="Thông tin và thiết lập tài khoản quản trị."
              />
            }
          />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["member"]} />}>
        <Route path="/member" element={<MemberLayout />}>
          <Route index element={<Navigate to="tasks" replace />} />

          <Route path="tasks" element={<MyTasks />} />
          <Route path="tasks/:id" element={<TaskDetail />} />
          <Route path="rewards" element={<MyRewards />} />
          <Route path="profile" element={<MyProfile />} />
          <Route path="calendar" element={<MemberCalendar />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
