import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  App,
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Typography,
} from "antd";
import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  RefreshCw,
  TrendingUp,
  UserRound,
  Wallet,
  XCircle,
} from "lucide-react";
import dayjs from "dayjs";
import taskApi from "../../api/taskApi";
import userApi from "../../api/userApi";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const STATUS_META = {
  assigned: { label: "Đã giao", color: "blue" },
  in_progress: { label: "Đang làm", color: "processing" },
  pending_review: { label: "Chờ duyệt", color: "gold" },
  completed: { label: "Hoàn thành", color: "success" },
  rework: { label: "Cần làm lại", color: "error" },
  cancelled: { label: "Đã hủy", color: "default" },
};

const REWARD_TIERS = [
  { min: 70, amount: 100000, label: "Từ 70 công việc" },
  { min: 50, amount: 50000, label: "50–69 công việc" },
  { min: 0, amount: 30000, label: "Dưới 50 công việc" },
];

function unwrapResponse(response) {
  let result = response?.data ?? response;

  if (result?.data !== undefined) {
    result = result.data;
  }

  return result;
}

function unwrapList(response, keys = []) {
  const result = unwrapResponse(response);

  if (Array.isArray(result)) {
    return result;
  }

  for (const key of keys) {
    if (Array.isArray(result?.[key])) {
      return result[key];
    }
  }

  return [];
}

function normalizeTask(item) {
  return {
    ...item,
    id: item.id ?? item.task_id,
    title: item.title ?? item.name ?? "Công việc",
    assigned_to: item.assigned_to ?? item.assigned_user_id ?? item.user_id,
    assigned_name:
      item.assigned_name ??
      item.assignee_name ??
      item.assigned_user_name ??
      item.member_name ??
      item.full_name ??
      "",
    due_date: item.due_date ?? item.deadline ?? null,
    status: item.status ?? "assigned",
    completed_at: item.completed_at ?? null,
    submitted_at: item.submitted_at ?? null,
  };
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function getReward(completedCount) {
  const tier = REWARD_TIERS.find((item) => completedCount >= item.min);
  return tier?.amount ?? 30000;
}

function isDateInRange(value, from, to) {
  if (!value) return false;

  const date = dayjs(value);

  if (!date.isValid()) return false;

  return !date.isBefore(from, "day") && !date.isAfter(to, "day");
}

function escapeCsv(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export default function Reports() {
  const { message } = App.useApp();

  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [memberLoading, setMemberLoading] = useState(false);

  const [dateRange, setDateRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);

  const [memberFilter, setMemberFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fromDate = dateRange?.[0] || dayjs().startOf("month");
  const toDate = dateRange?.[1] || dayjs().endOf("month");

  const loadTasks = useCallback(async () => {
    setLoading(true);

    try {
      const params = {
        from_date: fromDate.format("YYYY-MM-DD"),
        to_date: toDate.format("YYYY-MM-DD"),
      };

      const response = await taskApi.getAll(params);
      const list = unwrapList(response, ["tasks", "items", "results"]);

      setTasks(list.map(normalizeTask));
    } catch (error) {
      console.error("[Reports] Tải công việc thất bại:", error);
      message.error(getErrorMessage(error, "Không thể tải dữ liệu báo cáo."));
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, message]);

  const loadMembers = useCallback(async () => {
    setMemberLoading(true);

    try {
      const response = await userApi.getAll({ role: "member" });
      const list = unwrapList(response, [
        "users",
        "members",
        "items",
        "results",
      ]);

      setMembers(
        list.map((user) => ({
          ...user,
          id: user.id ?? user.user_id,
          full_name: user.full_name ?? user.name ?? user.email,
        })),
      );
    } catch (error) {
      console.error("[Reports] Tải thành viên thất bại:", error);
      message.error(
        getErrorMessage(error, "Không thể tải danh sách thành viên."),
      );
    } finally {
      setMemberLoading(false);
    }
  }, [message]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const dateValue =
        task.completed_at ||
        task.submitted_at ||
        task.due_date ||
        task.created_at;

      if (!isDateInRange(dateValue, fromDate, toDate)) {
        return false;
      }

      if (
        memberFilter !== "all" &&
        String(task.assigned_to) !== String(memberFilter)
      ) {
        return false;
      }

      if (statusFilter !== "all" && task.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [tasks, fromDate, toDate, memberFilter, statusFilter]);

  const summary = useMemo(() => {
    const total = filteredTasks.filter(
      (task) => task.status !== "cancelled",
    ).length;

    const completed = filteredTasks.filter(
      (task) => task.status === "completed",
    ).length;

    const inProgress = filteredTasks.filter(
      (task) => task.status === "in_progress",
    ).length;

    const pending = filteredTasks.filter(
      (task) => task.status === "pending_review",
    ).length;

    const rework = filteredTasks.filter(
      (task) => task.status === "rework",
    ).length;

    const completionRate = total ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      pending,
      rework,
      completionRate,
    };
  }, [filteredTasks]);

  const memberStats = useMemo(() => {
    return members
      .map((member) => {
        const memberTasks = filteredTasks.filter(
          (task) => String(task.assigned_to) === String(member.id),
        );

        const total = memberTasks.filter(
          (task) => task.status !== "cancelled",
        ).length;

        const completed = memberTasks.filter(
          (task) => task.status === "completed",
        ).length;

        const pending = memberTasks.filter(
          (task) => task.status === "pending_review",
        ).length;

        const inProgress = memberTasks.filter(
          (task) => task.status === "in_progress",
        ).length;

        const rework = memberTasks.filter(
          (task) => task.status === "rework",
        ).length;

        return {
          ...member,
          total,
          completed,
          pending,
          inProgress,
          rework,
          completionRate: total ? Math.round((completed / total) * 100) : 0,
          reward: getReward(completed),
        };
      })
      .sort(
        (a, b) =>
          b.completed - a.completed || b.completionRate - a.completionRate,
      );
  }, [members, filteredTasks]);

  const statusStats = useMemo(() => {
    const statuses = [
      "assigned",
      "in_progress",
      "pending_review",
      "completed",
      "rework",
      "cancelled",
    ];

    return statuses.map((status) => ({
      status,
      label: STATUS_META[status].label,
      color: STATUS_META[status].color,
      count: filteredTasks.filter((task) => task.status === status).length,
    }));
  }, [filteredTasks]);

  const monthlyTrend = useMemo(() => {
    const months = [];
    const firstMonth = fromDate.startOf("month");
    const lastMonth = toDate.startOf("month");
    let cursor = firstMonth;

    while (
      cursor.isBefore(lastMonth, "month") ||
      cursor.isSame(lastMonth, "month")
    ) {
      const monthStart = cursor.startOf("month");
      const monthEnd = cursor.endOf("month");

      const monthTasks = tasks.filter((task) => {
        const dateValue =
          task.completed_at ||
          task.submitted_at ||
          task.due_date ||
          task.created_at;

        if (!dateValue) return false;

        const date = dayjs(dateValue);

        return (
          date.isValid() &&
          !date.isBefore(monthStart, "day") &&
          !date.isAfter(monthEnd, "day") &&
          !date.isBefore(fromDate, "day") &&
          !date.isAfter(toDate, "day")
        );
      });

      months.push({
        label: cursor.format("MM/YYYY"),
        total: monthTasks.filter((task) => task.status !== "cancelled").length,
        completed: monthTasks.filter((task) => task.status === "completed")
          .length,
      });

      cursor = cursor.add(1, "month");
    }

    return months;
  }, [tasks, fromDate, toDate]);

  const estimatedRewards = useMemo(() => {
    return memberStats.reduce((sum, member) => sum + member.reward, 0);
  }, [memberStats]);

  const handleExport = () => {
    const headers = [
      "Thành viên",
      "Email",
      "Tổng công việc",
      "Hoàn thành",
      "Đang làm",
      "Chờ duyệt",
      "Cần làm lại",
      "Tỷ lệ hoàn thành (%)",
      "Thưởng dự kiến (VND)",
    ];

    const rows = memberStats.map((member) => [
      member.full_name,
      member.email,
      member.total,
      member.completed,
      member.inProgress,
      member.pending,
      member.rework,
      member.completionRate,
      member.reward,
    ]);

    const csvContent = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\r\n");

    // BOM giúp Excel hiển thị đúng tiếng Việt.
    const blob = new Blob(["\uFEFF", csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `bao-cao-viec-nha-${fromDate.format(
      "YYYYMMDD",
    )}-${toDate.format("YYYYMMDD")}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    message.success("Đã xuất báo cáo CSV.");
  };

  const memberColumns = [
    {
      title: "THÀNH VIÊN",
      key: "member",
      render: (_, record) => (
        <Space>
          <Avatar
            src={record.avatar || undefined}
            icon={<UserRound size={16} />}
            className="report-member-avatar"
          />
          <div className="report-member-copy">
            <Text strong>{record.full_name}</Text>
            <Text type="secondary">{record.email || "—"}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "TỔNG VIỆC",
      dataIndex: "total",
      key: "total",
      align: "center",
      sorter: (a, b) => a.total - b.total,
    },
    {
      title: "HOÀN THÀNH",
      dataIndex: "completed",
      key: "completed",
      align: "center",
      sorter: (a, b) => a.completed - b.completed,
      render: (value) => (
        <Text strong className="report-completed-number">
          {value}
        </Text>
      ),
    },
    {
      title: "TỶ LỆ",
      dataIndex: "completionRate",
      key: "completionRate",
      width: 180,
      sorter: (a, b) => a.completionRate - b.completionRate,
      render: (value) => (
        <Progress
          percent={value}
          size="small"
          strokeColor="#2e7d5b"
          trailColor="#e8f5ee"
        />
      ),
    },
    {
      title: "CHỜ DUYỆT",
      dataIndex: "pending",
      key: "pending",
      align: "center",
    },
    {
      title: "CẦN LÀM LẠI",
      dataIndex: "rework",
      key: "rework",
      align: "center",
    },
    {
      title: "THƯỞNG DỰ KIẾN",
      dataIndex: "reward",
      key: "reward",
      align: "right",
      sorter: (a, b) => a.reward - b.reward,
      render: (value) => (
        <Text strong className="report-reward-amount">
          {formatCurrency(value)}
        </Text>
      ),
    },
  ];

  const maxTrendValue = Math.max(1, ...monthlyTrend.map((item) => item.total));

  return (
    <div className="admin-reports-page">
      <div className="reports-page-header">
        <div>
          <div className="reports-eyebrow">TỔNG HỢP HOẠT ĐỘNG</div>
          <Title level={2} className="reports-page-title">
            Báo cáo thống kê
          </Title>
          <Text type="secondary">
            Theo dõi tiến độ công việc, hiệu suất thành viên và thưởng dự kiến.
          </Text>
        </div>

        <Space wrap>
          <Button
            icon={<RefreshCw size={16} />}
            onClick={() => {
              loadTasks();
              loadMembers();
            }}
            loading={loading || memberLoading}
          >
            Làm mới
          </Button>

          <Button
            type="primary"
            icon={<Download size={16} />}
            onClick={handleExport}
            className="reports-export-button"
          >
            Xuất CSV
          </Button>
        </Space>
      </div>

      <Card className="reports-filter-card">
        <div className="reports-filter-label">
          <CalendarDays size={17} />
          <Text strong>Khoảng thời gian báo cáo</Text>
        </div>

        <div className="reports-filter-controls">
          <RangePicker
            value={dateRange}
            onChange={(values) => {
              if (values?.[0] && values?.[1]) {
                setDateRange(values);
              }
            }}
            format="DD/MM/YYYY"
            allowClear={false}
            presets={[
              {
                label: "Tháng này",
                value: [dayjs().startOf("month"), dayjs().endOf("month")],
              },
              {
                label: "Tháng trước",
                value: [
                  dayjs().subtract(1, "month").startOf("month"),
                  dayjs().subtract(1, "month").endOf("month"),
                ],
              },
              {
                label: "7 ngày qua",
                value: [dayjs().subtract(6, "day"), dayjs()],
              },
              {
                label: "30 ngày qua",
                value: [dayjs().subtract(29, "day"), dayjs()],
              },
            ]}
          />

          <Select
            value={memberFilter}
            onChange={setMemberFilter}
            loading={memberLoading}
            showSearch
            optionFilterProp="label"
            options={[
              { label: "Tất cả thành viên", value: "all" },
              ...members.map((member) => ({
                label: member.full_name,
                value: String(member.id),
              })),
            ]}
            className="reports-filter-member"
          />

          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: "Tất cả trạng thái", value: "all" },
              ...Object.entries(STATUS_META).map(([value, meta]) => ({
                label: meta.label,
                value,
              })),
            ]}
            className="reports-filter-status"
          />
        </div>
      </Card>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]} className="reports-statistics">
          <Col xs={12} xl={6}>
            <Card className="reports-stat-card">
              <div className="reports-stat-icon reports-icon-navy">
                <BarChart3 size={21} />
              </div>
              <Text type="secondary">Tổng công việc</Text>
              <Title level={2}>{summary.total}</Title>
              <Text className="reports-stat-footnote">
                Không tính công việc đã hủy
              </Text>
            </Card>
          </Col>

          <Col xs={12} xl={6}>
            <Card className="reports-stat-card">
              <div className="reports-stat-icon reports-icon-green">
                <CheckCircle2 size={21} />
              </div>
              <Text type="secondary">Đã hoàn thành</Text>
              <Title level={2}>{summary.completed}</Title>
              <Text className="reports-stat-footnote">Đã được Admin duyệt</Text>
            </Card>
          </Col>

          <Col xs={12} xl={6}>
            <Card className="reports-stat-card">
              <div className="reports-stat-icon reports-icon-gold">
                <Activity size={21} />
              </div>
              <Text type="secondary">Tỷ lệ hoàn thành</Text>
              <Title level={2}>{summary.completionRate}%</Title>
              <Text className="reports-stat-footnote">
                Trên tổng việc không bị hủy
              </Text>
            </Card>
          </Col>

          <Col xs={12} xl={6}>
            <Card className="reports-stat-card">
              <div className="reports-stat-icon reports-icon-red">
                <Wallet size={21} />
              </div>
              <Text type="secondary">Thưởng dự kiến</Text>
              <Title level={3}>{formatCurrency(estimatedRewards)}</Title>
              <Text className="reports-stat-footnote">
                Theo mức thưởng cấu hình hiện tại
              </Text>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="reports-chart-row">
          <Col xs={24} xl={14}>
            <Card className="reports-panel-card">
              <div className="reports-panel-heading">
                <div className="reports-panel-icon">
                  <TrendingUp size={19} />
                </div>
                <div>
                  <Title level={4}>Xu hướng công việc</Title>
                  <Text type="secondary">
                    Tổng công việc và số công việc đã hoàn thành theo tháng
                  </Text>
                </div>
              </div>

              {monthlyTrend.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Không có dữ liệu trong khoảng thời gian này"
                />
              ) : (
                <div className="reports-trend-chart">
                  {monthlyTrend.map((item) => (
                    <div className="reports-trend-item" key={item.label}>
                      <div className="reports-trend-bars">
                        <div
                          className="reports-trend-bar reports-trend-bar-total"
                          style={{
                            height: `${Math.max(
                              5,
                              (item.total / maxTrendValue) * 100,
                            )}%`,
                          }}
                          title={`Tổng: ${item.total}`}
                        />

                        <div
                          className="reports-trend-bar reports-trend-bar-completed"
                          style={{
                            height: `${Math.max(
                              5,
                              (item.completed / maxTrendValue) * 100,
                            )}%`,
                          }}
                          title={`Hoàn thành: ${item.completed}`}
                        />
                      </div>

                      <Text className="reports-trend-label">{item.label}</Text>

                      <Text className="reports-trend-value">
                        {item.completed}/{item.total}
                      </Text>
                    </div>
                  ))}
                </div>
              )}

              <div className="reports-chart-legend">
                <span>
                  <i className="reports-legend-total" />
                  Tổng công việc
                </span>
                <span>
                  <i className="reports-legend-completed" />
                  Hoàn thành
                </span>
              </div>
            </Card>
          </Col>

          <Col xs={24} xl={10}>
            <Card className="reports-panel-card">
              <div className="reports-panel-heading">
                <div className="reports-panel-icon">
                  <Activity size={19} />
                </div>
                <div>
                  <Title level={4}>Phân bổ trạng thái</Title>
                  <Text type="secondary">
                    Số lượng công việc theo từng trạng thái
                  </Text>
                </div>
              </div>

              <div className="reports-status-list">
                {statusStats.map((item) => {
                  const denominator = Math.max(1, filteredTasks.length);
                  const percent = Math.round((item.count / denominator) * 100);

                  return (
                    <div className="reports-status-item" key={item.status}>
                      <div className="reports-status-top">
                        <span>{item.label}</span>
                        <strong>{item.count}</strong>
                      </div>

                      <div className="reports-status-track">
                        <div
                          className={`reports-status-fill status-${item.status}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="reports-status-summary">
                <div>
                  <Clock3 size={16} />
                  <span>Đang làm</span>
                  <strong>{summary.inProgress}</strong>
                </div>
                <div>
                  <CheckCircle2 size={16} />
                  <span>Chờ duyệt</span>
                  <strong>{summary.pending}</strong>
                </div>
                <div>
                  <XCircle size={16} />
                  <span>Cần làm lại</span>
                  <strong>{summary.rework}</strong>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        <Card className="reports-panel-card reports-members-card">
          <div className="reports-panel-heading reports-members-heading">
            <div className="reports-panel-icon">
              <UserRound size={19} />
            </div>
            <div>
              <Title level={4}>Hiệu suất thành viên</Title>
              <Text type="secondary">
                So sánh công việc đã giao, kết quả được duyệt và thưởng dự kiến.
              </Text>
            </div>
          </div>

          <Table
            rowKey={(record) => record.id}
            columns={memberColumns}
            dataSource={memberStats}
            loading={memberLoading}
            scroll={{ x: 900 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              showTotal: (total) => `Tổng ${total} thành viên`,
            }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Chưa có dữ liệu thành viên"
                />
              ),
            }}
          />
        </Card>

        <Card className="reports-reward-card">
          <div className="reports-reward-header">
            <div className="reports-reward-icon">
              <Wallet size={22} />
            </div>
            <div>
              <Title level={4}>Quy tắc thưởng tham khảo</Title>
              <Text type="secondary">
                Mức thưởng được tính từ số công việc đã duyệt của mỗi thành
                viên.
              </Text>
            </div>
          </div>

          <Row gutter={[12, 12]}>
            {REWARD_TIERS.slice()
              .reverse()
              .map((tier) => (
                <Col xs={24} md={8} key={tier.min}>
                  <div className="reports-reward-tier">
                    <Text type="secondary">{tier.label}</Text>
                    <Title level={4}>{formatCurrency(tier.amount)}</Title>
                  </div>
                </Col>
              ))}
          </Row>

          <Text type="secondary" className="reports-reward-disclaimer">
            Đây là khoản thưởng dự kiến được tính ở giao diện theo quy tắc đang
            cấu hình. Trước khi chi trả, hãy đối chiếu với API chốt thưởng và
            quy định thực tế của gia đình.
          </Text>
        </Card>
      </Spin>
    </div>
  );
}
