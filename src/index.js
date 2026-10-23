import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider, App as AntApp } from "antd";
import viVN from "antd/locale/vi_VN";

import "antd/dist/reset.css";
import "./styles/variables.css";
import "./styles/global.css";

import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";

const theme = {
  token: {
    colorPrimary: "#173B5E",
    colorSuccess: "#2E7D5B",
    colorWarning: "#B7791F",
    colorError: "#C94C4C",
    colorInfo: "#315A7D",
    colorText: "#243447",
    colorTextSecondary: "#6B7280",
    colorBgLayout: "#F7F9FC",
    colorBgContainer: "#FFFFFF",
    colorBorder: "#E2E8F0",
    borderRadius: 10,
    fontFamily:
      "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    controlHeight: 42,
  },
  components: {
    Button: {
      fontWeight: 600,
    },
    Menu: {
      itemHeight: 46,
      itemBorderRadius: 10,
      itemSelectedBg: "#EEF3F7",
      itemSelectedColor: "#173B5E",
      itemHoverBg: "#F4F7FA",
    },
    Table: {
      headerBg: "#F7F9FC",
      headerColor: "#526174",
      borderColor: "#E8EDF3",
    },
  },
};

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <ConfigProvider locale={viVN} theme={theme}>
      <AntApp>
        <AuthProvider>
          <App />
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>,
);
