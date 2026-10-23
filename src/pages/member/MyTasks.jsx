import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Input,
  Row,
  Select,
  Skeleton,
  Tag,
  Typography,
} from "antd";
import {
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Play,
  RefreshCw,
  Search,
} from "lucide-react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

import taskApi from "../../api/taskApi";
import { formatDate } from "../../utils/formatDate";
import "./MyTasks.css";

const { Text } = Typography;

const statusConfig = {
  assigned: { label: "Chưa bắt đầu", color: "default" },
  in_progress: { label: "Đang thực hiện", color: "processing" },
  pending_review: { label: "Chờ duyệt", color: "warning" },
  completed: { label: "Hoàn thành", color: "success" },
  rework: { label: "Làm lại", color: "error" },
  cancelled: { label: "Đã hủy", color: "default" },
};

function unwrapTasks(response) {
  let data = response?.data;
  if (data?.data !== undefined) data = data.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.tasks)) return data.tasks;
  if (Array.isArray(data?.items)) return data.items;

  return [];
}

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [date, setDate] = useState(dayjs());
  const [status, setStatus] = useState(undefined);
  const [keyword, setKeyword] = useState("");

  const navigate = useNavigate();

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = { date: date.format("YYYY-MM-DD") };
      if (status) params.status = status;

      const response = await taskApi.getAll(params);
      setTasks(unwrapTasks(response));
    } catch (err) {
      console.error(
        "[MyTasks] Lỗi tải công việc:",
        err.response?.data || err.message,
      );

      setError(
        err.response?.data?.message ||
          "Không tải được công việc. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  }, [date, status]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const filteredTasks = tasks.filter((task) =>
    String(task.title || "")
      .toLowerCase()
      .includes(keyword.trim().toLowerCase()),
  );

  const completedCount = tasks.filter(
    (task) => task.status === "completed",
  ).length;

  const pendingCount = tasks.filter(
    (task) => task.status === "pending_review",
  ).length;

  const openTask = (task) => navigate(`/member/tasks/${task.id}`);

  return (
    <div className="page-container my-tasks-page">
      <div className="my-tasks-heading">
        <div>
          <div className="page-eyebrow">KHÔNG GIAN CỦA BẠN</div>
          <h1 className="page-title">Việc của tôi</h1>
          <p className="page-description">
            Theo dõi và hoàn thành công việc mỗi ngày.
          </p>
        </div>

        <Button
          className="my-tasks-refresh"
          icon={<RefreshCw size={15} />}
          onClick={loadTasks}
          loading={loading}
        >
          <span>Làm mới</span>
        </Button>
      </div>

      <Row gutter={[10, 10]} className="my-tasks-stats">
        <Col span={8}>
          <Card bordered={false} className="my-task-stat">
            <div className="my-task-stat-icon stat-blue">
              <CalendarDays size={17} />
            </div>
            <Text type="secondary">Tổng việc</Text>
            <div className="my-task-stat-value">
              {loading ? "—" : tasks.length}
            </div>
          </Card>
        </Col>

        <Col span={8}>
          <Card bordered={false} className="my-task-stat">
            <div className="my-task-stat-icon stat-green">
              <CheckCircle2 size={17} />
            </div>
            <Text type="secondary">Hoàn thành</Text>
            <div className="my-task-stat-value">
              {loading ? "—" : completedCount}
            </div>
          </Card>
        </Col>

        <Col span={8}>
          <Card bordered={false} className="my-task-stat">
            <div className="my-task-stat-icon stat-orange">
              <Clock3 size={17} />
            </div>
            <Text type="secondary">Chờ duyệt</Text>
            <div className="my-task-stat-value">
              {loading ? "—" : pendingCount}
            </div>
          </Card>
        </Col>
      </Row>

      <Card bordered={false} className="my-tasks-filter">
        <div className="my-tasks-filter-grid">
          <DatePicker
            value={date}
            onChange={(value) => value && setDate(value)}
            format="DD/MM/YYYY"
            allowClear={false}
            className="my-tasks-date"
            inputReadOnly
          />

          <Select
            allowClear
            placeholder="Tất cả trạng thái"
            value={status}
            onChange={setStatus}
            options={Object.entries(statusConfig).map(([value, item]) => ({
              value,
              label: item.label,
            }))}
            className="my-tasks-status"
          />

          <Input
            allowClear
            prefix={<Search size={16} />}
            placeholder="Tìm công việc..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="my-tasks-search"
          />
        </div>
      </Card>

      {error && (
        <Alert
          className="my-tasks-error"
          type="error"
          showIcon
          message={error}
          action={
            <Button size="small" onClick={loadTasks}>
              Thử lại
            </Button>
          }
        />
      )}

      <div className="my-tasks-section-heading">
        <div>
          <h2>Danh sách công việc</h2>
          <p>
            {loading
              ? "Đang tải..."
              : `${filteredTasks.length} công việc · ${formatDate(date.toDate())}`}
          </p>
        </div>
      </div>

      {loading ? (
        <Row gutter={[12, 12]}>
          {[1, 2].map((item) => (
            <Col xs={24} md={12} xl={8} key={item}>
              <Card bordered={false}>
                <Skeleton active paragraph={{ rows: 2 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : filteredTasks.length === 0 ? (
        <Card bordered={false} className="my-tasks-empty">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              error ? "Không thể tải công việc." : "Không có công việc phù hợp."
            }
          />
        </Card>
      ) : (
        <Row gutter={[12, 12]}>
          {filteredTasks.map((task) => {
            const config = statusConfig[task.status] || {
              label: task.status || "Không xác định",
              color: "default",
            };

            return (
              <Col xs={24} md={12} xl={8} key={task.id}>
                <Card
                  bordered={false}
                  className="my-task-card"
                  onClick={() => openTask(task)}
                >
                  <div className="my-task-card-top">
                    <div className="my-task-card-icon">
                      <ClipboardList size={19} />
                    </div>
                    <Tag color={config.color}>{config.label}</Tag>
                  </div>

                  <h3>{task.title}</h3>

                  <p className="my-task-card-description">
                    {task.description || "Chưa có mô tả công việc."}
                  </p>

                  <div className="my-task-card-meta">
                    <span>
                      <CalendarDays size={14} />
                      {task.due_date
                        ? formatDate(task.due_date)
                        : formatDate(date.toDate())}
                    </span>

                    {task.due_time && (
                      <span>
                        <Clock3 size={14} />
                        {String(task.due_time).slice(0, 5)}
                      </span>
                    )}
                  </div>

                  <div className="my-task-card-footer">
                    <span className="my-task-detail">
                      Chi tiết <ChevronRight size={15} />
                    </span>

                    {["assigned", "rework"].includes(task.status) && (
                      <Button
                        type="primary"
                        size="small"
                        icon={<Play size={13} />}
                        onClick={(event) => {
                          event.stopPropagation();
                          openTask(task);
                        }}
                      >
                        Thực hiện
                      </Button>
                    )}

                    {task.status === "in_progress" && (
                      <span className="my-task-upload-hint">
                        <Camera size={14} />
                        Gửi minh chứng
                      </span>
                    )}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
}
