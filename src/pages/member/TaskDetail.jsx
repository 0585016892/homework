import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  Modal,
  Progress,
  Skeleton,
  Tag,
  message,
} from "antd";
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquare,
  Play,
  RefreshCw,
  Send,
  ShieldCheck,
  UserRound,
  X,
  RotateCcw,
  CameraOff,
  Check,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import taskApi from "../../api/taskApi";
import useAuth from "../../hooks/useAuth";

const { TextArea } = Input;

const STATUS_CONFIG = {
  assigned: {
    label: "Chưa bắt đầu",
    color: "default",
    description: "Bắt đầu công việc khi bạn đã sẵn sàng.",
    progress: 0,
  },
  in_progress: {
    label: "Đang thực hiện",
    color: "processing",
    description: "Hoàn thành công việc rồi gửi báo cáo.",
    progress: 45,
  },
  pending_review: {
    label: "Chờ xác nhận",
    color: "warning",
    description: "Báo cáo đã được gửi đến quản trị viên.",
    progress: 80,
  },
  completed: {
    label: "Đã hoàn thành",
    color: "success",
    description: "Công việc đã được xác nhận hoàn thành.",
    progress: 100,
  },
  rework: {
    label: "Cần làm lại",
    color: "error",
    description: "Xem phản hồi và gửi lại kết quả công việc.",
    progress: 45,
  },
  cancelled: {
    label: "Đã hủy",
    color: "default",
    description: "Bạn không cần thực hiện công việc này.",
    progress: 0,
  },
};

const TASK_STYLES = `
.task-detail-page {
  --td-primary: #00a650;
  --td-primary-dark: #008b44;
  --td-text: #202b36;
  --td-muted: #7b8794;
  --td-border: #edf0f2;
  --td-bg: #f5f7f9;
  min-height: 100%;
  padding: 22px;
  background: var(--td-bg);
  color: var(--td-text);
  font-family: inherit;
}

.task-detail-page *,
.task-camera-modal * {
  box-sizing: border-box;
}

.task-detail-page .task-detail-topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 auto 18px;
  max-width: 1200px;
}

.task-detail-page .task-back-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 40px;
  padding: 0 12px;
  border-radius: 10px;
  color: #334155;
  font-weight: 600;
}

.task-detail-page .task-back-button:hover {
  color: var(--td-primary-dark) !important;
  background: #e8f7ef !important;
}

.task-detail-page .task-breadcrumb {
  color: var(--td-muted);
  font-size: 13px;
}

.task-detail-page .task-breadcrumb span {
  margin: 0 7px;
  color: #c2c9d0;
}

.task-detail-page .task-detail-hero {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto 20px;
  padding: 30px;
  overflow: hidden;
  border: 1px solid #e4eee8;
  border-radius: 20px;
  background: linear-gradient(115deg, #ffffff 0%, #f0fbf5 100%);
  box-shadow: 0 4px 18px rgba(27, 55, 40, 0.035);
}

.task-detail-page .task-hero-content {
  position: relative;
  z-index: 1;
  min-width: 0;
  flex: 1;
}

.task-detail-page .task-hero-kicker {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--td-primary-dark);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.2px;
}

.task-detail-page .task-hero-kicker-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: #dff6e9;
}

.task-detail-page .task-detail-hero h2 {
  margin: 15px 0 9px;
  color: #172b21;
  font-size: clamp(24px, 3vw, 34px);
  font-weight: 800;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.task-detail-page .task-detail-hero p {
  max-width: 760px;
  margin: 0;
  color: #65746b;
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.task-detail-page .task-hero-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 18px;
}

.task-detail-page .task-hero-meta > span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #637268;
  font-size: 13px;
}

.task-detail-page .task-hero-meta .ant-tag {
  margin: 0;
}

.task-detail-page .task-hero-decoration {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 130px;
  width: 130px;
  height: 130px;
  border-radius: 50%;
  background: rgba(0, 166, 80, 0.07);
}

.task-detail-page .task-hero-decoration-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 94px;
  height: 94px;
  border: 1px solid rgba(0, 166, 80, 0.18);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  color: var(--td-primary);
}

.task-detail-page .task-detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 350px;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  align-items: start;
}

.task-detail-page .task-detail-main,
.task-detail-page .task-detail-aside {
  display: grid;
  gap: 18px;
  min-width: 0;
}

.task-detail-page .task-detail-card,
.task-detail-page .task-action-card {
  overflow: hidden;
  border: 1px solid var(--td-border);
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 3px 14px rgba(30, 45, 60, 0.025);
}

.task-detail-page .task-detail-card .ant-card-head {
  min-height: 60px;
  padding: 0 22px;
  border-bottom: 1px solid #f1f3f5;
}

.task-detail-page .task-detail-card .ant-card-head-title {
  padding: 18px 0;
}

.task-detail-page .task-detail-card .ant-card-body {
  padding: 22px;
}

.task-detail-page .task-card-title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #24352c;
  font-size: 15px;
  font-weight: 750;
}

.task-detail-page .task-card-title > svg {
  color: var(--td-primary);
}

.task-detail-page .task-descriptions .ant-descriptions-item-label {
  padding-bottom: 7px;
  color: #8a949e;
  font-size: 12px;
}

.task-detail-page .task-descriptions .ant-descriptions-item-content {
  padding-bottom: 20px;
  color: #25332b;
  font-size: 13px;
}

.task-detail-page .task-person {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}

.task-detail-page .task-person strong {
  overflow-wrap: anywhere;
}

.task-detail-page .task-person .ant-avatar {
  flex-shrink: 0;
  background: #e5f7ec;
  color: #078746;
}

.task-detail-page .task-person .task-creator-avatar {
  background: #eaf2ff;
  color: #3568ad;
}

.task-detail-page .task-detail-value {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.task-detail-page .task-detail-value svg {
  color: var(--td-primary);
}

.task-detail-page .task-review-alert {
  margin-top: 4px;
  border-radius: 12px;
}

.task-detail-page .task-progress-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
}

.task-detail-page .task-progress-heading strong {
  color: #25332b;
  font-size: 16px;
}

.task-detail-page .task-progress-heading p {
  margin: 6px 0 0;
  color: var(--td-muted);
  font-size: 13px;
  line-height: 1.65;
}

.task-detail-page .task-progress-number {
  color: var(--td-primary-dark);
  font-size: 24px;
  font-weight: 800;
}

.task-detail-page .ant-progress-inner {
  border-radius: 99px;
}

.task-detail-page .task-progress-steps {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-top: 22px;
}

.task-detail-page .task-progress-steps span {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  color: #a0a8b0;
  font-size: 11px;
}

.task-detail-page .task-progress-steps i {
  display: block;
  width: 100%;
  height: 4px;
  border-radius: 8px;
  background: #e9edf0;
}

.task-detail-page .task-progress-steps .is-active {
  color: #16834a;
  font-weight: 700;
}

.task-detail-page .task-progress-steps .is-active i {
  background: var(--td-primary);
}

.task-detail-page .task-progress-steps .is-current {
  color: #bd7a16;
  font-weight: 700;
}

.task-detail-page .task-progress-steps .is-current i {
  background: #f0bd60;
}

.task-detail-page .task-timestamp {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 15px;
  color: #66737d;
  font-size: 12px;
  line-height: 1.6;
}

.task-detail-page .task-timestamp svg {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--td-primary);
}

.task-detail-page .task-report-note {
  padding: 15px;
  border-radius: 11px;
  background: #f7f9fa;
  color: #46534c;
  font-size: 13px;
  line-height: 1.8;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.task-detail-page .task-report-photo-section {
  display: grid;
  gap: 12px;
  margin-top: 20px;
}

.task-detail-page .task-field-label {
  color: #536159;
  font-size: 13px;
  font-weight: 700;
}

.task-detail-page .task-report-photo-link {
  display: block;
  width: fit-content;
  max-width: 100%;
}

.task-detail-page .task-report-photo {
  display: block;
  max-width: 100%;
  max-height: 360px;
  border: 1px solid var(--td-border);
  border-radius: 12px;
  object-fit: contain;
}

.task-detail-page .task-muted {
  color: var(--td-muted);
  font-size: 12px;
}

.task-detail-page .task-action-card {
  position: sticky;
  top: 20px;
}

.task-detail-page .task-action-card .ant-card-body {
  padding: 22px;
}

.task-detail-page .task-action-card-heading {
  text-align: center;
}

.task-detail-page .task-action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  margin: 0 auto 14px;
  border-radius: 18px;
  background: #e5f8ed;
  color: var(--td-primary-dark);
}

.task-detail-page .task-action-card-heading h3 {
  margin: 0 0 8px;
  color: #24352c;
  font-size: 19px;
  font-weight: 800;
}

.task-detail-page .task-action-card-heading p {
  margin: 0 0 20px;
  color: #7a8580;
  font-size: 12px;
  line-height: 1.8;
}

.task-detail-page .task-primary-button.ant-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;
  border: 0 !important;
  border-radius: 12px;
  background: var(--td-primary) !important;
  color: #fff !important;
  font-weight: 750;
  box-shadow: 0 5px 12px rgba(0, 166, 80, 0.15);
}

.task-detail-page .task-primary-button.ant-btn:hover {
  background: var(--td-primary-dark) !important;
}

.task-detail-page .task-primary-button.ant-btn:disabled {
  background: #b8c6be !important;
}

.task-detail-page .task-secondary-button.ant-btn {
  height: 46px;
  margin-top: 18px;
  border-radius: 12px;
  border-color: #dfe6e2;
  color: #425148;
  font-weight: 650;
}

.task-detail-page .task-action-divider {
  height: 1px;
  margin: 22px 0;
  background: #edf0f2;
}

.task-detail-page .task-action-hint {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin-top: 14px;
  padding: 12px;
  border-radius: 10px;
  background: #f4f7fa;
  color: #63717d;
  font-size: 12px;
  line-height: 1.65;
}

.task-detail-page .task-action-hint svg {
  flex-shrink: 0;
  margin-top: 1px;
}

.task-detail-page .task-action-hint-success {
  background: #eaf8f0;
  color: #147642;
}

.task-detail-page .task-report-form {
  display: grid;
  gap: 6px;
}

.task-detail-page .task-report-form .ant-form-item {
  margin-bottom: 14px;
}

.task-detail-page .task-form-label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #34453a;
  font-size: 13px;
  font-weight: 700;
}

.task-detail-page .task-form-label svg {
  color: var(--td-primary);
}

.task-detail-page .task-report-form .ant-input,
.task-detail-page .task-report-form textarea {
  border-color: #e4e9e6;
  border-radius: 11px;
  font-size: 13px;
  resize: vertical;
}

.task-detail-page .task-report-form .ant-input:focus,
.task-detail-page .task-report-form textarea:focus {
  border-color: #66c995;
  box-shadow: 0 0 0 3px rgba(0, 166, 80, 0.08);
}

.task-detail-page .task-camera-box {
  display: flex;
  width: 100%;
  min-height: 146px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 18px;
  border: 1.5px dashed #a8dabc;
  border-radius: 14px;
  background: #f4fbf6;
  color: #16834a;
  cursor: pointer;
  transition: background .2s, border-color .2s, transform .2s;
}

.task-detail-page .task-camera-box:hover {
  border-color: var(--td-primary);
  background: #e9f9ef;
}

.task-detail-page .task-camera-box:active {
  transform: scale(.99);
}

.task-detail-page .task-camera-box strong {
  color: #176b3e;
  font-size: 14px;
}

.task-detail-page .task-camera-box span {
  color: #7a8b80;
  font-size: 11px;
  text-align: center;
}

.task-detail-page .task-camera-box-icon {
  display: flex;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  border-radius: 15px;
  background: #dff6e8;
}

.task-detail-page .task-upload-preview {
  position: relative;
  margin-top: 12px;
  overflow: hidden;
  border: 1px solid #e1e9e3;
  border-radius: 13px;
  background: #fff;
}

.task-detail-page .task-upload-preview img {
  display: block;
  width: 100%;
  max-height: 260px;
  object-fit: contain;
  background: #f5f7f8;
}

.task-detail-page .task-upload-preview-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
}

.task-detail-page .task-upload-preview-info strong {
  min-width: 0;
  overflow-wrap: anywhere;
  color: #3b4b40;
  font-size: 12px;
}

.task-detail-page .task-upload-preview-info .ant-btn {
  flex-shrink: 0;
}

.task-detail-page .task-submit-caption {
  margin: 11px 0 0;
  color: #929ba2;
  font-size: 11px;
  line-height: 1.7;
  text-align: center;
}

.task-detail-page .task-aside-tip {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 17px;
  border: 1px solid #e6eee8;
  border-radius: 14px;
  background: #f0f8f3;
}

.task-detail-page .task-tip-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 11px;
  background: #d9f2e2;
  color: #148346;
}

.task-detail-page .task-aside-tip strong {
  display: block;
  margin: 2px 0 5px;
  color: #28543a;
  font-size: 12px;
}

.task-detail-page .task-aside-tip p {
  margin: 0;
  color: #66806e;
  font-size: 11px;
  line-height: 1.8;
}

.task-detail-page .task-error-card {
  max-width: 700px;
  margin: 40px auto;
}

.task-detail-page .task-modal-ok {
  border-color: var(--td-primary) !important;
  background: var(--td-primary) !important;
}

.task-camera-modal .ant-modal-content {
  overflow: hidden;
  padding: 0;
  border-radius: 20px;
}

.task-camera-modal .ant-modal-header {
  margin: 0;
  padding: 18px 20px;
  border-bottom: 1px solid #edf0f2;
}

.task-camera-modal .ant-modal-title {
  color: #20362a;
  font-size: 16px;
  font-weight: 800;
}

.task-camera-modal .ant-modal-body {
  padding: 18px;
}

.task-camera-modal .task-camera-stage {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 260px;
  max-height: 65vh;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 15px;
  background: #111816;
}

.task-camera-modal .task-camera-video {
  display: block;
  width: 100%;
  max-height: 65vh;
  object-fit: contain;
  background: #111816;
}

.task-camera-modal .task-camera-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 30px;
  color: #d3ded7;
  text-align: center;
}

.task-camera-modal .task-camera-placeholder p {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
}

.task-camera-modal .task-camera-error {
  margin-top: 14px;
  border-radius: 10px;
}

.task-camera-modal .task-camera-help {
  margin: 13px 0 0;
  color: #7c8780;
  font-size: 12px;
  line-height: 1.7;
}

.task-camera-modal .task-camera-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 18px;
}

.task-camera-modal .task-camera-actions .ant-btn {
  height: 46px;
  border-radius: 12px;
  font-weight: 700;
}

.task-camera-modal .task-camera-shutter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 150px;
  border: 0 !important;
  background: #00a650 !important;
  color: #fff !important;
}

.task-camera-modal .task-camera-shutter:hover {
  background: #008b44 !important;
}

@media (max-width: 1050px) {
  .task-detail-page .task-detail-grid {
    grid-template-columns: minmax(0, 1fr) 310px;
  }

  .task-detail-page .task-hero-decoration {
    flex-basis: 100px;
    width: 100px;
    height: 100px;
  }

  .task-detail-page .task-hero-decoration-circle {
    width: 74px;
    height: 74px;
  }
}

@media (max-width: 850px) {
  .task-detail-page .task-detail-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .task-detail-page .task-action-card {
    position: static;
  }

  .task-detail-page .task-detail-aside {
    grid-row: 1;
  }

  .task-detail-page .task-detail-main {
    grid-row: 2;
  }

  .task-detail-page .task-action-card .ant-card-body {
    padding: 20px;
  }

  .task-detail-page .task-action-card-heading {
    text-align: left;
  }

  .task-detail-page .task-action-icon {
    margin: 0 0 12px;
  }
}

@media (max-width: 600px) {
  .task-detail-page {
    padding: 12px;
  }

  .task-detail-page .task-detail-topbar {
    margin-bottom: 12px;
  }

  .task-detail-page .task-breadcrumb {
    font-size: 11px;
  }

  .task-detail-page .task-detail-hero {
    gap: 8px;
    margin-bottom: 14px;
    padding: 20px 17px;
    border-radius: 16px;
  }

  .task-detail-page .task-detail-hero h2 {
    margin-top: 12px;
    font-size: 24px;
  }

  .task-detail-page .task-detail-hero p {
    font-size: 12px;
  }

  .task-detail-page .task-hero-decoration {
    display: none;
  }

  .task-detail-page .task-hero-meta {
    gap: 8px;
    margin-top: 14px;
  }

  .task-detail-page .task-hero-meta > span {
    font-size: 11px;
  }

  .task-detail-page .task-detail-grid {
    gap: 14px;
  }

  .task-detail-page .task-detail-main,
  .task-detail-page .task-detail-aside {
    gap: 14px;
  }

  .task-detail-page .task-detail-card,
  .task-detail-page .task-action-card {
    border-radius: 14px;
  }

  .task-detail-page .task-detail-card .ant-card-head {
    min-height: 52px;
    padding: 0 16px;
  }

  .task-detail-page .task-detail-card .ant-card-head-title {
    padding: 15px 0;
  }

  .task-detail-page .task-detail-card .ant-card-body {
    padding: 16px;
  }

  .task-detail-page .task-card-title {
    font-size: 13px;
  }

  .task-detail-page .task-progress-number {
    font-size: 21px;
  }

  .task-detail-page .task-progress-steps {
    gap: 5px;
  }

  .task-detail-page .task-progress-steps span {
    font-size: 9px;
  }

  .task-detail-page .task-descriptions .ant-descriptions-item-content {
    padding-bottom: 15px;
  }

  .task-detail-page .task-action-card .ant-card-body {
    padding: 18px;
  }

  .task-detail-page .task-action-card-heading h3 {
    font-size: 17px;
  }

  .task-detail-page .task-camera-box {
    min-height: 130px;
  }

  .task-camera-modal .ant-modal-body {
    padding: 12px;
  }

  .task-camera-modal .task-camera-stage {
    min-height: 220px;
  }

  .task-camera-modal .task-camera-actions {
    gap: 8px;
  }

  .task-camera-modal .task-camera-actions .ant-btn {
    min-width: 0;
    flex: 1;
    padding: 0 10px;
  }
}
`;

function unwrapTask(response) {
  const body = response?.data;

  if (body?.task) return body.task;
  if (body?.data?.task) return body.data.task;
  if (body?.data && !Array.isArray(body.data)) return body.data;

  return body;
}

function formatDate(value) {
  if (!value) return "Chưa xác định";

  const dateString = String(value).slice(0, 10);
  const parts = dateString.split("-");

  if (parts.length !== 3) return dateString;

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatTime(value) {
  return value ? String(value).slice(0, 5) : null;
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function stopMediaStream(stream) {
  stream?.getTracks?.().forEach((track) => track.stop());
}

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const photoPreviewRef = useRef("");

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [reportPhotoUrl, setReportPhotoUrl] = useState("");
  const [reportPhotoLoading, setReportPhotoLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmStartOpen, setConfirmStartOpen] = useState(false);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);

  const status = task?.status || "assigned";
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.assigned;

  const canStart = status === "assigned";
  const canSubmit = status === "in_progress" || status === "rework";
  const isFinished = status === "completed" || status === "cancelled";

  const dueDateTime = useMemo(() => {
    if (!task?.due_date) return "Chưa xác định";

    const date = formatDate(task.due_date);
    const time = formatTime(task.due_time);

    return time ? `${date} · ${time}` : date;
  }, [task?.due_date, task?.due_time]);

  const fetchTask = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await taskApi.getById(id);
      const data = unwrapTask(response);

      if (!data || !data.id) {
        throw new Error("Không tìm thấy thông tin công việc.");
      }

      setTask(data);
      setNote(data.report_note || "");
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Không thể tải công việc. Vui lòng thử lại.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  useEffect(() => {
    const styleId = "task-detail-grab-inline-styles";

    if (document.getElementById(styleId)) return;

    const styleElement = document.createElement("style");
    styleElement.id = styleId;
    styleElement.textContent = TASK_STYLES;
    document.head.appendChild(styleElement);
  }, []);

  // Tải ảnh báo cáo đã lưu từ máy chủ.
  useEffect(() => {
    let objectUrl = "";
    let cancelled = false;

    async function loadReportPhoto() {
      if (!task?.report_photo) {
        setReportPhotoUrl("");
        setReportPhotoLoading(false);
        return;
      }

      setReportPhotoLoading(true);

      try {
        const response = await taskApi.getPhoto(id);
        const blob =
          response.data instanceof Blob
            ? response.data
            : new Blob([response.data]);

        objectUrl = URL.createObjectURL(blob);

        if (!cancelled) {
          setReportPhotoUrl(objectUrl);
        }
      } catch {
        if (!cancelled) {
          setReportPhotoUrl("");
        }
      } finally {
        if (!cancelled) {
          setReportPhotoLoading(false);
        }
      }
    }

    loadReportPhoto();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, task?.report_photo]);

  // Giải phóng camera và ảnh xem trước khi rời trang.
  useEffect(() => {
    return () => {
      stopMediaStream(streamRef.current);
      streamRef.current = null;

      if (photoPreviewRef.current) {
        URL.revokeObjectURL(photoPreviewRef.current);
      }
    };
  }, []);

  // Mở camera trực tiếp, không mở trình chọn ảnh.
  useEffect(() => {
    if (!cameraOpen) return undefined;

    let cancelled = false;

    async function startCamera() {
      setCameraLoading(true);
      setCameraError("");
      setCameraReady(false);

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            "Trình duyệt không hỗ trợ camera trực tiếp. Hãy dùng HTTPS và trình duyệt mới hơn.",
          );
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });

        if (cancelled) {
          stopMediaStream(stream);
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          try {
            await videoRef.current.play();
          } catch {
            // Một số trình duyệt sẽ phát sau thao tác của người dùng.
          }
        }

        if (!cancelled) {
          setCameraReady(true);
        }
      } catch (cameraRequestError) {
        if (!cancelled) {
          const cameraMessage =
            cameraRequestError?.name === "NotAllowedError"
              ? "Bạn chưa cấp quyền sử dụng camera. Hãy cấp quyền camera cho trình duyệt rồi thử lại."
              : cameraRequestError?.name === "NotFoundError"
                ? "Không tìm thấy camera trên thiết bị này."
                : cameraRequestError?.name === "NotReadableError"
                  ? "Camera đang được ứng dụng khác sử dụng. Hãy đóng ứng dụng đó rồi thử lại."
                  : getErrorMessage(
                      cameraRequestError,
                      "Không thể mở camera. Vui lòng kiểm tra thiết bị và quyền truy cập.",
                    );

          setCameraError(cameraMessage);
        }
      } finally {
        if (!cancelled) setCameraLoading(false);
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      stopMediaStream(streamRef.current);
      streamRef.current = null;
    };
  }, [cameraOpen]);

  const openCamera = () => {
    setCameraError("");
    setCameraReady(false);
    setCameraOpen(true);
  };

  const closeCamera = () => {
    stopMediaStream(streamRef.current);
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOpen(false);
    setCameraLoading(false);
    setCameraReady(false);
    setCameraError("");
  };

  const handleCapturePhoto = () => {
    const video = videoRef.current;

    if (!video || !video.videoWidth || !video.videoHeight) {
      message.warning("Camera chưa sẵn sàng. Vui lòng đợi một chút.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      message.error("Không thể xử lý ảnh. Vui lòng thử lại.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          message.error("Chụp ảnh thất bại. Vui lòng thử lại.");
          return;
        }

        const capturedPhoto = new File([blob], `minh-chung-${Date.now()}.jpg`, {
          type: "image/jpeg",
          lastModified: Date.now(),
        });

        if (photoPreviewRef.current) {
          URL.revokeObjectURL(photoPreviewRef.current);
        }

        const previewUrl = URL.createObjectURL(capturedPhoto);

        photoPreviewRef.current = previewUrl;
        setPhoto(capturedPhoto);
        setPhotoPreview(previewUrl);

        closeCamera();
        message.success("Đã chụp ảnh minh chứng.");
      },
      "image/jpeg",
      0.9,
    );
  };

  const handleRemovePhoto = () => {
    if (photoPreviewRef.current) {
      URL.revokeObjectURL(photoPreviewRef.current);
      photoPreviewRef.current = "";
    }

    setPhoto(null);
    setPhotoPreview("");
  };

  const handleStartTask = async () => {
    setStarting(true);

    try {
      await taskApi.start(id);

      setConfirmStartOpen(false);
      message.success("Đã bắt đầu công việc!");
      await fetchTask();
    } catch (requestError) {
      message.error(
        getErrorMessage(
          requestError,
          "Không thể bắt đầu công việc. Vui lòng thử lại.",
        ),
      );
    } finally {
      setStarting(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!note.trim() && !photo) {
      message.warning("Hãy nhập ghi chú hoặc chụp ảnh minh chứng.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("report_note", note.trim());

      if (photo) {
        formData.append("photo", photo);
      }

      await taskApi.report(id, formData);

      message.success("Đã gửi báo cáo, vui lòng chờ xác nhận.");
      handleRemovePhoto();
      await fetchTask();
    } catch (requestError) {
      message.error(
        getErrorMessage(
          requestError,
          "Gửi báo cáo thất bại. Vui lòng thử lại.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/member/tasks");
    }
  };

  if (loading) {
    return (
      <div className="task-detail-page">
        <Skeleton active paragraph={{ rows: 5 }} />
        <Card className="task-detail-card">
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="task-detail-page">
        <Button
          type="text"
          className="task-back-button"
          icon={<ArrowLeft size={17} />}
          onClick={handleBack}
        >
          Quay lại
        </Button>

        <Card className="task-detail-card task-error-card">
          <Empty
            image={<X size={44} color="#c94c4c" />}
            description={error || "Không tìm thấy công việc."}
          >
            <Button
              type="primary"
              className="task-primary-button"
              icon={<RefreshCw size={16} />}
              onClick={fetchTask}
            >
              Thử tải lại
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div className="task-detail-page">
      <div className="task-detail-topbar">
        <Button
          type="text"
          className="task-back-button"
          icon={<ArrowLeft size={17} />}
          onClick={handleBack}
        >
          Quay lại
        </Button>

        <span className="task-breadcrumb">
          Việc của tôi <span>/</span> Chi tiết công việc
        </span>
      </div>

      <section className="task-detail-hero">
        <div className="task-hero-content">
          <div className="task-hero-kicker">
            <span className="task-hero-kicker-icon">
              <CheckCircle2 size={17} />
            </span>
            CHI TIẾT CÔNG VIỆC
          </div>

          <h2>{task.title}</h2>

          <p>
            {task.description ||
              "Hoàn thành công việc và chia sẻ kết quả với gia đình."}
          </p>

          <div className="task-hero-meta">
            <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
            <span>
              <CalendarDays size={15} />
              Hạn: {dueDateTime}
            </span>
          </div>
        </div>

        <div className="task-hero-decoration" aria-hidden="true">
          <div className="task-hero-decoration-circle">
            <CheckCircle2 size={62} strokeWidth={1.4} />
          </div>
        </div>
      </section>

      <div className="task-detail-grid">
        <main className="task-detail-main">
          <Card
            className="task-detail-card"
            title={
              <span className="task-card-title">
                <FileText size={18} />
                Thông tin công việc
              </span>
            }
          >
            <Descriptions
              column={{ xs: 1, sm: 2 }}
              colon={false}
              className="task-descriptions"
            >
              <Descriptions.Item label="Người thực hiện">
                <span className="task-person">
                  <Avatar size={31} icon={<UserRound size={16} />} />
                  <strong>
                    {task.assigned_name ||
                      task.assignee_name ||
                      (String(task.assigned_to) === String(user?.id)
                        ? user?.full_name
                        : `Thành viên #${task.assigned_to}`) ||
                      "Thành viên"}
                  </strong>
                </span>
              </Descriptions.Item>

              <Descriptions.Item label="Người giao việc">
                <span className="task-person">
                  <Avatar
                    size={31}
                    className="task-creator-avatar"
                    icon={<ShieldCheck size={16} />}
                  />
                  <strong>{task.creator_name || "Quản trị viên"}</strong>
                </span>
              </Descriptions.Item>

              <Descriptions.Item label="Ngày thực hiện">
                <span className="task-detail-value">
                  <CalendarDays size={16} />
                  {formatDate(task.due_date)}
                </span>
              </Descriptions.Item>

              <Descriptions.Item label="Thời hạn">
                <span className="task-detail-value">
                  <Clock3 size={16} />
                  {formatTime(task.due_time) || "Linh hoạt"}
                </span>
              </Descriptions.Item>
            </Descriptions>

            {task.review_note && (
              <Alert
                className="task-review-alert"
                type={status === "rework" ? "warning" : "info"}
                showIcon
                message={
                  status === "rework"
                    ? "Yêu cầu thực hiện lại"
                    : "Phản hồi từ quản trị viên"
                }
                description={task.review_note}
              />
            )}
          </Card>

          <Card
            className="task-detail-card"
            title={
              <span className="task-card-title">
                <CheckCircle2 size={18} />
                Tiến độ công việc
              </span>
            }
          >
            <div className="task-progress-heading">
              <div>
                <strong>{statusConfig.label}</strong>
                <p>{statusConfig.description}</p>
              </div>

              <span className="task-progress-number">
                {statusConfig.progress}%
              </span>
            </div>

            <Progress
              percent={statusConfig.progress}
              showInfo={false}
              strokeColor={
                status === "completed"
                  ? "#00a650"
                  : status === "rework"
                    ? "#d9a441"
                    : "#00a650"
              }
              trailColor="#edf1f5"
              strokeWidth={9}
            />

            <div className="task-progress-steps">
              <span
                className={status !== "assigned" ? "is-active" : "is-current"}
              >
                <i />
                Được giao
              </span>

              <span
                className={
                  ["in_progress", "pending_review", "completed"].includes(
                    status,
                  )
                    ? "is-active"
                    : status === "rework"
                      ? "is-current"
                      : ""
                }
              >
                <i />
                Đang làm
              </span>

              <span
                className={
                  status === "pending_review" || status === "completed"
                    ? "is-active"
                    : status === "rework"
                      ? "is-current"
                      : ""
                }
              >
                <i />
                Chờ duyệt
              </span>

              <span className={status === "completed" ? "is-active" : ""}>
                <i />
                Hoàn tất
              </span>
            </div>

            {task.started_at && (
              <div className="task-timestamp">
                <Clock3 size={15} />
                Bắt đầu lúc {formatDateTime(task.started_at)}
              </div>
            )}

            {task.submitted_at && (
              <div className="task-timestamp">
                <Send size={15} />
                Gửi báo cáo lúc {formatDateTime(task.submitted_at)}
              </div>
            )}

            {task.completed_at && (
              <div className="task-timestamp">
                <CheckCircle2 size={15} />
                Hoàn thành lúc {formatDateTime(task.completed_at)}
              </div>
            )}
          </Card>

          {task.report_note && (
            <Card
              className="task-detail-card"
              title={
                <span className="task-card-title">
                  <MessageSquare size={18} />
                  Báo cáo đã gửi
                </span>
              }
            >
              <div className="task-report-note">{task.report_note}</div>

              {task.report_photo && (
                <div className="task-report-photo-section">
                  <span className="task-field-label">
                    Ảnh minh chứng đã gửi
                  </span>

                  {reportPhotoLoading ? (
                    <Skeleton.Image active />
                  ) : reportPhotoUrl ? (
                    <a
                      href={reportPhotoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="task-report-photo-link"
                    >
                      <img
                        src={reportPhotoUrl}
                        alt="Ảnh minh chứng công việc"
                        className="task-report-photo"
                      />
                    </a>
                  ) : (
                    <span className="task-muted">
                      Không tải được ảnh minh chứng.
                    </span>
                  )}
                </div>
              )}
            </Card>
          )}
        </main>

        <aside className="task-detail-aside">
          <Card className="task-action-card">
            <div className="task-action-card-heading">
              <span className="task-action-icon">
                {status === "completed" ? (
                  <CheckCircle2 size={24} />
                ) : status === "pending_review" ? (
                  <Clock3 size={24} />
                ) : (
                  <FileText size={24} />
                )}
              </span>

              <h3>
                {status === "completed"
                  ? "Hoàn thành tốt!"
                  : status === "pending_review"
                    ? "Đang chờ xác nhận"
                    : status === "cancelled"
                      ? "Công việc đã hủy"
                      : "Thực hiện công việc"}
              </h3>

              <p>
                {status === "completed"
                  ? "Cảm ơn bạn đã góp sức cho gia đình."
                  : status === "pending_review"
                    ? "Báo cáo đã được gửi đến quản trị viên."
                    : status === "cancelled"
                      ? "Bạn không cần thực hiện công việc này."
                      : status === "rework"
                        ? "Vui lòng xem phản hồi và gửi lại kết quả."
                        : "Hoàn thành công việc rồi gửi báo cáo để được xác nhận."}
              </p>
            </div>

            {canStart && (
              <Button
                block
                type="primary"
                size="large"
                className="task-primary-button"
                icon={<Play size={17} />}
                onClick={() => setConfirmStartOpen(true)}
              >
                Bắt đầu làm
              </Button>
            )}

            {status === "in_progress" && (
              <div className="task-action-hint">
                <Clock3 size={16} />
                Bạn đang thực hiện công việc này.
              </div>
            )}

            {status === "pending_review" && (
              <div className="task-action-hint task-action-hint-success">
                <CheckCircle2 size={16} />
                Đã gửi báo cáo thành công.
              </div>
            )}

            {status === "completed" && (
              <div className="task-action-hint task-action-hint-success">
                <CheckCircle2 size={16} />
                Công việc đã được xác nhận hoàn thành.
              </div>
            )}

            {canSubmit && (
              <>
                <div className="task-action-divider" />

                <Form
                  layout="vertical"
                  onFinish={handleSubmitReport}
                  className="task-report-form"
                >
                  <Form.Item
                    label={
                      <span className="task-form-label">
                        <MessageSquare size={15} />
                        Ghi chú kết quả
                      </span>
                    }
                  >
                    <TextArea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Bạn đã hoàn thành công việc như thế nào?"
                      rows={4}
                      maxLength={1000}
                      showCount
                    />
                  </Form.Item>

                  <Form.Item
                    label={
                      <span className="task-form-label">
                        <Camera size={15} />
                        Ảnh minh chứng
                      </span>
                    }
                  >
                    {!photoPreview ? (
                      <button
                        type="button"
                        className="task-camera-box"
                        onClick={openCamera}
                      >
                        <span className="task-camera-box-icon">
                          <Camera size={24} />
                        </span>
                        <strong>Chụp ảnh minh chứng</strong>
                        <span>Mở camera để chụp ảnh trực tiếp</span>
                      </button>
                    ) : (
                      <div className="task-upload-preview">
                        <img src={photoPreview} alt="Ảnh minh chứng vừa chụp" />

                        <div className="task-upload-preview-info">
                          <strong>Ảnh minh chứng</strong>

                          <Button
                            type="link"
                            size="small"
                            icon={<RotateCcw size={14} />}
                            onClick={openCamera}
                          >
                            Chụp lại
                          </Button>

                          <Button
                            type="link"
                            danger
                            size="small"
                            onClick={handleRemovePhoto}
                          >
                            Xóa
                          </Button>
                        </div>
                      </div>
                    )}
                  </Form.Item>

                  <Button
                    block
                    type="primary"
                    htmlType="submit"
                    size="large"
                    loading={submitting}
                    className="task-primary-button"
                    icon={<Send size={16} />}
                  >
                    Gửi báo cáo
                  </Button>

                  <p className="task-submit-caption">
                    Ảnh được chụp trực tiếp bằng camera, không chọn từ thư viện.
                    Quản trị viên sẽ xem xét báo cáo của bạn.
                  </p>
                </Form>
              </>
            )}

            {isFinished && (
              <Button
                block
                size="large"
                className="task-secondary-button"
                onClick={() => navigate("/member/tasks")}
              >
                Về danh sách công việc
              </Button>
            )}
          </Card>

          <div className="task-aside-tip">
            <span className="task-tip-icon">
              <ShieldCheck size={19} />
            </span>
            <div>
              <strong>Một lưu ý nhỏ</strong>
              <p>
                Chụp ảnh rõ ràng và ghi chú ngắn gọn để gia đình dễ dàng xác
                nhận kết quả công việc.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <Modal
        title="Bắt đầu công việc?"
        open={confirmStartOpen}
        onCancel={() => setConfirmStartOpen(false)}
        onOk={handleStartTask}
        okText="Bắt đầu ngay"
        cancelText="Để sau"
        confirmLoading={starting}
        okButtonProps={{ className: "task-modal-ok" }}
        centered
      >
        <p>
          Bạn xác nhận bắt đầu thực hiện <strong>{task.title}</strong>?
        </p>
        <p style={{ color: "#7b8794", fontSize: 13, lineHeight: 1.7 }}>
          Sau khi bắt đầu, bạn có thể ghi chú và chụp ảnh minh chứng khi hoàn
          thành.
        </p>
      </Modal>

      <Modal
        title={
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: 9 }}
          >
            <Camera size={19} color="#00a650" />
            Chụp ảnh minh chứng
          </span>
        }
        open={cameraOpen}
        onCancel={closeCamera}
        footer={null}
        centered
        destroyOnHidden
        width={560}
        className="task-camera-modal"
        maskClosable={false}
        closable={!cameraLoading}
      >
        <div className="task-camera-stage">
          <video
            ref={videoRef}
            className="task-camera-video"
            autoPlay
            muted
            playsInline
            aria-label="Xem trước camera"
            style={{
              display: cameraReady ? "block" : "none",
            }}
          />

          {!cameraReady && (
            <div className="task-camera-placeholder">
              {cameraError ? <CameraOff size={38} /> : <Camera size={38} />}

              <p>
                {cameraLoading
                  ? "Đang khởi động camera..."
                  : cameraError || "Đang chờ camera sẵn sàng"}
              </p>
            </div>
          )}
        </div>

        {cameraError && (
          <Alert
            className="task-camera-error"
            type="error"
            showIcon
            message="Không mở được camera"
            description={cameraError}
          />
        )}

        <p className="task-camera-help">
          Hãy hướng camera vào kết quả công việc rồi nhấn nút chụp. Bạn có thể
          xem lại và chụp lại trước khi gửi báo cáo.
        </p>

        <div className="task-camera-actions">
          <Button icon={<X size={16} />} onClick={closeCamera}>
            Hủy
          </Button>

          {cameraError && (
            <Button
              icon={<RefreshCw size={16} />}
              onClick={() => {
                closeCamera();
                window.setTimeout(() => {
                  setCameraOpen(true);
                }, 100);
              }}
            >
              Thử lại
            </Button>
          )}

          <Button
            type="primary"
            className="task-camera-shutter"
            icon={<Check size={17} />}
            loading={cameraLoading}
            disabled={!cameraReady || cameraLoading}
            onClick={handleCapturePhoto}
          >
            Chụp ảnh
          </Button>
        </div>
      </Modal>
    </div>
  );
}
