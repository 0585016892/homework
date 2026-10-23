import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import authApi from "../api/authApi";

const AuthContext = createContext(null);

function extractPayload(response) {
  let result = response?.data;

  // Hỗ trợ cấu trúc { data: { user } } và { user }.
  if (result?.data !== undefined) {
    result = result.data;
  }

  return result;
}

function extractUser(response) {
  const payload = extractPayload(response);

  return payload?.user || payload?.currentUser || payload || null;
}

function extractToken(response) {
  const payload = extractPayload(response);

  return (
    payload?.token ||
    payload?.accessToken ||
    payload?.access_token ||
    response?.data?.token ||
    null
  );
}

function normalizeUser(user) {
  if (!user || !user.id) {
    return null;
  }

  return {
    ...user,
    id: Number(user.id),
    full_name: user.full_name || user.name || user.email || "Thành viên",
    role: String(user.role || "").toLowerCase(),
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("home_task_user");
      return savedUser ? normalizeUser(JSON.parse(savedUser)) : null;
    } catch {
      return null;
    }
  });

  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);

  const saveUser = useCallback((nextUser) => {
    const normalized = normalizeUser(nextUser);

    if (!normalized) {
      setUser(null);
      localStorage.removeItem("home_task_user");
      return null;
    }

    setUser(normalized);
    localStorage.setItem("home_task_user", JSON.stringify(normalized));

    return normalized;
  }, []);

  const refreshMe = useCallback(async () => {
    const response = await authApi.me();
    const currentUser = extractUser(response);

    if (!currentUser?.id) {
      throw new Error("API không trả về thông tin tài khoản hợp lệ.");
    }

    return saveUser(currentUser);
  }, [saveUser]);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      const token = localStorage.getItem("home_task_token");

      if (!token) {
        if (mounted) {
          setInitializing(false);
        }
        return;
      }

      try {
        await refreshMe();
      } catch (error) {
        console.error(
          "[Auth] Không thể khôi phục phiên đăng nhập:",
          error.response?.data || error.message,
        );

        localStorage.removeItem("home_task_token");
        localStorage.removeItem("home_task_user");

        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setInitializing(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [refreshMe]);

  const login = useCallback(
    async (credentials) => {
      setLoading(true);

      try {
        console.log("[Auth] Đang đăng nhập:", credentials.email);

        const response = await authApi.login(credentials);
        const token = extractToken(response);

        if (!token) {
          throw new Error(
            "API đăng nhập chưa trả về token. Hãy kiểm tra response của /auth/login.",
          );
        }

        localStorage.setItem("home_task_token", token);

        try {
          // Lấy user từ API xác thực để tránh phụ thuộc response login.
          const currentUser = await refreshMe();

          if (!currentUser) {
            throw new Error("Không lấy được thông tin tài khoản.");
          }

          console.log("[Auth] Đăng nhập thành công:", {
            id: currentUser.id,
            role: currentUser.role,
          });

          return currentUser;
        } catch (error) {
          localStorage.removeItem("home_task_token");
          localStorage.removeItem("home_task_user");
          throw error;
        }
      } catch (error) {
        console.error(
          "[Auth] Đăng nhập thất bại:",
          error.response?.data || error.message,
        );

        throw error;
      } finally {
        setLoading(false);
      }
    },
    [refreshMe],
  );

  const logout = useCallback(() => {
    localStorage.removeItem("home_task_token");
    localStorage.removeItem("home_task_user");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      initializing,
      isAuthenticated: Boolean(user && localStorage.getItem("home_task_token")),
      isAdmin: user?.role === "admin",
      isMember: user?.role === "member",
      login,
      logout,
      refreshMe,
    }),
    [user, loading, initializing, login, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext phải được sử dụng bên trong AuthProvider.");
  }

  return context;
}
