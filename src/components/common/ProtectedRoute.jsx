import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { useAuthContext } from "../../contexts/AuthContext";

export default function ProtectedRoute({ allowedRoles }) {
  const { user, initializing } = useAuthContext();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="app-initial-loading">
        <Spin size="large" />
        <span>Đang kiểm tra tài khoản...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to={user.role === "admin" ? "/admin" : "/member/tasks"}
        replace
      />
    );
  }

  return <Outlet />;
}
