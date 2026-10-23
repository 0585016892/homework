import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Empty, Skeleton, Tag, Tooltip } from "antd";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  RefreshCw,
} from "lucide-react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

import taskApi from "../../api/taskApi";
import { formatDate } from "../../utils/formatDate";
import "./MemberCalendar.css";

const STATUS = {
  assigned: { label: "Chưa bắt đầu", color: "#64748b" },
  in_progress: { label: "Đang thực hiện", color: "#2563eb" },
  pending_review: { label: "Chờ duyệt", color: "#d97706" },
  completed: { label: "Hoàn thành", color: "#16a34a" },
  rework: { label: "Cần làm lại", color: "#dc2626" },
  cancelled: { label: "Đã hủy", color: "#94a3b8" },
};

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function unwrapTasks(response) {
  let data = response?.data;
  if (data?.data !== undefined) data = data.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.tasks)) return data.tasks;
  if (Array.isArray(data?.items)) return data.items;

  return [];
}

function getTaskDate(task) {
  const value = task.due_date;
  if (!value) return null;

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : null;
}

export default function MemberCalendar() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [month, setMonth] = useState(dayjs().startOf("month"));
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD"),
  );

  const navigate = useNavigate();

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // API hiện tại nhận bộ lọc theo ngày.
      // Tải lần lượt các ngày trong tháng để dựng lịch đầy đủ.
      const daysInMonth = month.daysInMonth();
      const dates = Array.from({ length: daysInMonth }, (_, index) =>
        month.date(index + 1).format("YYYY-MM-DD"),
      );

      const responses = await Promise.all(
        dates.map((date) =>
          taskApi
            .getAll({ date })
            .then(unwrapTasks)
            .catch((err) => {
              console.error(`[MemberCalendar] Lỗi tải ngày ${date}:`, err);
              throw err;
            }),
        ),
      );

      const taskMap = new Map();

      responses.flat().forEach((task) => {
        if (task?.id != null) taskMap.set(task.id, task);
      });

      setTasks(Array.from(taskMap.values()));
    } catch (err) {
      console.error(
        "[MemberCalendar] Lỗi tải lịch:",
        err.response?.data || err.message,
      );

      setError(
        err.response?.data?.message ||
          "Không tải được lịch công việc. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const tasksByDate = useMemo(() => {
    const result = {};

    tasks.forEach((task) => {
      const date = getTaskDate(task);
      if (!date) return;

      if (!result[date]) result[date] = [];
      result[date].push(task);
    });

    return result;
  }, [tasks]);

  const calendarDays = useMemo(() => {
    const firstDay = month.day();
    // Chuyển thứ của dayjs (CN = 0) thành thứ 2 = 0.
    const offset = (firstDay + 6) % 7;
    const totalCells = Math.ceil((offset + month.daysInMonth()) / 7) * 7;

    return Array.from({ length: totalCells }, (_, index) => {
      const dayNumber = index - offset + 1;
      if (dayNumber < 1 || dayNumber > month.daysInMonth()) return null;

      return month.date(dayNumber);
    });
  }, [month]);

  const selectedTasks = tasksByDate[selectedDate] || [];

  const monthTaskCount = tasks.length;
  const completedCount = tasks.filter(
    (task) => task.status === "completed",
  ).length;

  const pendingCount = tasks.filter(
    (task) => task.status === "pending_review",
  ).length;

  const changeMonth = (offset) => {
    const nextMonth = month.add(offset, "month").startOf("month");
    setMonth(nextMonth);
    setSelectedDate(nextMonth.format("YYYY-MM-DD"));
  };

  const selectDate = (date) => {
    if (!date) return;
    setSelectedDate(date.format("YYYY-MM-DD"));
  };

  const openTask = (task) => {
    navigate(`/member/tasks/${task.id}`);
  };

  return (
    <div className="page-container member-calendar-page">
      <div className="calendar-page-heading">
        <div>
          <div className="page-eyebrow">SẮP XẾP THỜI GIAN</div>
          <h1 className="page-title">Lịch công việc</h1>
          <p className="page-description">
            Xem lịch và công việc theo từng ngày.
          </p>
        </div>

        <Button
          className="calendar-refresh"
          icon={<RefreshCw size={15} />}
          onClick={loadTasks}
          loading={loading}
        >
          Làm mới
        </Button>
      </div>

      <div className="calendar-summary">
        <div className="calendar-summary-icon">
          <CalendarDays size={25} />
        </div>
        <div>
          <div className="calendar-summary-label">THÁNG ĐANG XEM</div>
          <div className="calendar-summary-month">
            Tháng {month.format("MM, YYYY")}
          </div>
          <div className="calendar-summary-caption">
            {loading
              ? "Đang đồng bộ lịch..."
              : `${monthTaskCount} công việc · ${completedCount} hoàn thành · ${pendingCount} chờ duyệt`}
          </div>
        </div>
      </div>

      {error && (
        <Alert
          className="calendar-error"
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

      <Card bordered={false} className="calendar-card">
        <div className="calendar-month-toolbar">
          <div>
            <h2>{month.format("[Tháng] MM YYYY")}</h2>
            <p>Chọn một ngày để xem công việc</p>
          </div>

          <div className="calendar-month-actions">
            <Button
              aria-label="Tháng trước"
              icon={<ChevronLeft size={17} />}
              onClick={() => changeMonth(-1)}
            />
            <Button
              onClick={() => {
                const today = dayjs();
                setMonth(today.startOf("month"));
                setSelectedDate(today.format("YYYY-MM-DD"));
              }}
            >
              Hôm nay
            </Button>
            <Button
              aria-label="Tháng sau"
              icon={<ChevronRight size={17} />}
              onClick={() => changeMonth(1)}
            />
          </div>
        </div>

        <div className="calendar-grid">
          {WEEKDAYS.map((weekday) => (
            <div className="calendar-weekday" key={weekday}>
              {weekday}
            </div>
          ))}

          {calendarDays.map((date, index) => {
            if (!date) {
              return (
                <div
                  className="calendar-day calendar-day-empty"
                  key={`empty-${index}`}
                />
              );
            }

            const key = date.format("YYYY-MM-DD");
            const dayTasks = tasksByDate[key] || [];
            const isSelected = key === selectedDate;
            const isToday = key === dayjs().format("YYYY-MM-DD");

            const statusColors = [
              ...new Set(
                dayTasks
                  .map((task) => STATUS[task.status]?.color)
                  .filter(Boolean),
              ),
            ].slice(0, 3);

            return (
              <Tooltip
                key={key}
                title={
                  dayTasks.length
                    ? `${dayTasks.length} công việc`
                    : date.format("DD/MM/YYYY")
                }
              >
                <button
                  type="button"
                  className={[
                    "calendar-day",
                    isSelected ? "calendar-day-selected" : "",
                    isToday ? "calendar-day-today" : "",
                    dayTasks.length ? "calendar-day-has-tasks" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => selectDate(date)}
                  aria-label={`${date.format("DD/MM/YYYY")}, ${dayTasks.length} công việc`}
                  aria-pressed={isSelected}
                >
                  <span className="calendar-day-number">{date.date()}</span>

                  {dayTasks.length > 0 && (
                    <span className="calendar-day-dots">
                      {statusColors.map((color) => (
                        <span
                          key={color}
                          className="calendar-day-dot"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </span>
                  )}

                  {dayTasks.length > 0 && (
                    <span className="calendar-day-count">
                      {dayTasks.length}
                    </span>
                  )}
                </button>
              </Tooltip>
            );
          })}
        </div>

        <div className="calendar-legend">
          {[
            ["#64748b", "Chưa bắt đầu"],
            ["#2563eb", "Đang làm"],
            ["#d97706", "Chờ duyệt"],
            ["#16a34a", "Hoàn thành"],
          ].map(([color, label]) => (
            <span key={label}>
              <i style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
        </div>
      </Card>

      <div className="calendar-task-heading">
        <div>
          <h2>{formatDate(dayjs(selectedDate).toDate())}</h2>
          <p>
            {loading
              ? "Đang tải công việc..."
              : `${selectedTasks.length} công việc trong ngày`}
          </p>
        </div>
      </div>

      {loading ? (
        <Card bordered={false} className="calendar-task-list">
          <Skeleton active paragraph={{ rows: 3 }} />
        </Card>
      ) : selectedTasks.length === 0 ? (
        <Card bordered={false} className="calendar-empty">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Không có công việc trong ngày này."
          />
        </Card>
      ) : (
        <div className="calendar-task-list">
          {selectedTasks.map((task) => {
            const status = STATUS[task.status] || {
              label: task.status || "Không xác định",
              color: "#64748b",
            };

            return (
              <Card
                key={task.id}
                bordered={false}
                className="calendar-task-item"
                onClick={() => openTask(task)}
              >
                <div
                  className="calendar-task-status-line"
                  style={{ backgroundColor: status.color }}
                />

                <div className="calendar-task-content">
                  <div className="calendar-task-top">
                    <h3>{task.title}</h3>
                    <Tag
                      color={
                        task.status === "completed"
                          ? "success"
                          : task.status === "pending_review"
                            ? "warning"
                            : task.status === "in_progress"
                              ? "processing"
                              : task.status === "rework"
                                ? "error"
                                : "default"
                      }
                    >
                      {status.label}
                    </Tag>
                  </div>

                  {task.description && (
                    <p className="calendar-task-description">
                      {task.description}
                    </p>
                  )}

                  <div className="calendar-task-bottom">
                    <span>
                      <Clock3 size={14} />
                      {task.due_time
                        ? String(task.due_time).slice(0, 5)
                        : "Chưa đặt giờ"}
                    </span>

                    <Button
                      type="link"
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation();
                        openTask(task);
                      }}
                    >
                      Chi tiết <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
