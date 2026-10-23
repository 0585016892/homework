import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  App,
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Download,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import dayjs from "dayjs";

import rewardApi from "../../api/rewardApi";
import userApi from "../../api/userApi";
import { formatCurrency } from "../../utils/formatCurrency";
import "../../styles/global.css";

const { Title, Text } = Typography;

const STATUS_OPTIONS = [
  { label: "Tất cả trạng thái", value: "all" },
  { label: "Chưa thanh toán", value: "unpaid" },
  { label: "Đã thanh toán", value: "paid" },
];

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  "Đã xảy ra lỗi. Vui lòng thử lại.";

const unwrapResponse = (response) => {
  let result = response?.data ?? response;

  if (result?.data !== undefined) {
    result = result.data;
  }

  return result;
};

const unwrapList = (response, keys = []) => {
  const result = unwrapResponse(response);

  if (Array.isArray(result)) return result;

  for (const key of keys) {
    if (Array.isArray(result?.[key])) return result[key];
  }

  return [];
};

const normalizeReward = (item, index) => {
  const member = item?.member || item?.user || item?.assignee || {};

  const amount = Number(
    item?.amount ??
      item?.reward_amount ??
      item?.total_amount ??
      item?.reward ??
      0,
  );

  const completedTasks = Number(
    item?.completed_tasks ??
      item?.completed_count ??
      item?.approved_tasks ??
      item?.task_count ??
      0,
  );

  const rawStatus = String(
    item?.status ?? item?.payment_status ?? (item?.paid_at ? "paid" : "unpaid"),
  ).toLowerCase();

  const isPaid = ["paid", "completed", "success", "đã thanh toán"].includes(
    rawStatus,
  );

  return {
    ...item,
    id: item?.id ?? item?.reward_id ?? `reward-${index}`,
    member_id: item?.member_id ?? item?.user_id ?? member?.id ?? null,
    member_name:
      item?.member_name ??
      item?.full_name ??
      member?.full_name ??
      member?.name ??
      "Chưa xác định",
    email: item?.email ?? member?.email ?? "",
    month: item?.month ?? item?.reward_month ?? item?.month_key ?? "",
    completed_tasks: completedTasks,
    amount,
    status: isPaid ? "paid" : "unpaid",
    paid_at: item?.paid_at ?? item?.payment_date ?? null,
    payment_note: item?.payment_note ?? item?.note ?? "",
  };
};

const formatMonthLabel = (value) => {
  if (!value) return "—";

  const parsed = dayjs(
    /^\d{4}-\d{2}$/.test(String(value)) ? `${value}-01` : value,
  );

  return parsed.isValid() ? parsed.format("MM/YYYY") : String(value);
};

const getMonthValue = (value) => dayjs(value).format("YYYY-MM");

const normalizeMembers = (response) =>
  unwrapList(response, ["users", "items", "results"])
    .filter((user) => user?.role === "member" || !user?.role)
    .map((user) => ({
      value: String(user.id),
      label:
        user.full_name || user.name || user.email || `Thành viên ${user.id}`,
    }));

const downloadCsv = (rows, month) => {
  const headers = [
    "Tháng",
    "Thành viên",
    "Email",
    "Số công việc hoàn thành",
    "Mức thưởng (VND)",
    "Trạng thái",
    "Ngày thanh toán",
    "Ghi chú thanh toán",
  ];

  const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

  const data = rows.map((item) => [
    formatMonthLabel(item.month || month),
    item.member_name,
    item.email,
    item.completed_tasks,
    item.amount,
    item.status === "paid" ? "Đã thanh toán" : "Chưa thanh toán",
    item.paid_at ? dayjs(item.paid_at).format("DD/MM/YYYY HH:mm") : "",
    item.payment_note,
  ]);

  const csv = [headers, ...data]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `bao-cao-thuong-${month || "tat-ca"}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export default function Rewards() {
  const { message, modal } = App.useApp();

  const [loading, setLoading] = useState(false);
  const [settling, setSettling] = useState(false);
  const [payingId, setPayingId] = useState(null);

  const [rewards, setRewards] = useState([]);
  const [members, setMembers] = useState([]);

  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [statusFilter, setStatusFilter] = useState("all");
  const [memberFilter, setMemberFilter] = useState("all");
  const [keyword, setKeyword] = useState("");

  const month = useMemo(() => getMonthValue(selectedMonth), [selectedMonth]);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [rewardResponse, memberResponse] = await Promise.all([
        rewardApi.getAll({ month }),
        userApi.getAll({ role: "member" }),
      ]);

      const rewardList = unwrapList(rewardResponse, [
        "rewards",
        "items",
        "results",
      ]);

      setRewards(rewardList.map(normalizeReward));
      setMembers(normalizeMembers(memberResponse));
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [month, message]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredRewards = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return rewards.filter((reward) => {
      const matchesStatus =
        statusFilter === "all" || reward.status === statusFilter;

      const matchesMember =
        memberFilter === "all" ||
        String(reward.member_id) === String(memberFilter);

      const matchesKeyword =
        !normalizedKeyword ||
        reward.member_name.toLowerCase().includes(normalizedKeyword) ||
        reward.email.toLowerCase().includes(normalizedKeyword);

      return matchesStatus && matchesMember && matchesKeyword;
    });
  }, [rewards, statusFilter, memberFilter, keyword]);

  const stats = useMemo(() => {
    const totalAmount = rewards.reduce((sum, reward) => sum + reward.amount, 0);

    const paidAmount = rewards
      .filter((reward) => reward.status === "paid")
      .reduce((sum, reward) => sum + reward.amount, 0);

    const unpaidRewards = rewards.filter(
      (reward) => reward.status === "unpaid",
    );

    const unpaidAmount = unpaidRewards.reduce(
      (sum, reward) => sum + reward.amount,
      0,
    );

    return {
      totalAmount,
      paidAmount,
      unpaidAmount,
      paidCount: rewards.filter((reward) => reward.status === "paid").length,
      unpaidCount: unpaidRewards.length,
      memberCount: new Set(
        rewards.map((reward) => reward.member_id).filter(Boolean),
      ).size,
    };
  }, [rewards]);

  const handleSettleMonth = () => {
    modal.confirm({
      title: `Chốt thưởng tháng ${selectedMonth.format("MM/YYYY")}?`,
      content:
        "Hệ thống sẽ tạo hoặc cập nhật danh sách thưởng theo số công việc đã được duyệt. Hãy kiểm tra quy tắc chốt thưởng của backend trước khi xác nhận.",
      okText: "Chốt thưởng",
      cancelText: "Hủy",
      okButtonProps: { danger: false },
      onOk: async () => {
        setSettling(true);

        try {
          await rewardApi.settle({ month });
          message.success("Đã gửi yêu cầu chốt thưởng.");
          await loadData();
        } catch (error) {
          message.error(getErrorMessage(error));
          throw error;
        } finally {
          setSettling(false);
        }
      },
    });
  };

  const handleMarkPaid = (reward) => {
    modal.confirm({
      title: "Xác nhận thanh toán thưởng",
      content: (
        <div>
          <p>
            Thành viên: <strong>{reward.member_name}</strong>
          </p>
          <p>
            Số tiền: <strong>{formatCurrency(reward.amount)}</strong>
          </p>
          <Text type="secondary">
            Chỉ xác nhận khi bạn đã thanh toán thực tế.
          </Text>
        </div>
      ),
      okText: "Đã thanh toán",
      cancelText: "Hủy",
      onOk: async () => {
        setPayingId(reward.id);

        try {
          await rewardApi.markPaid(reward.id, {
            paid_at: dayjs().toISOString(),
          });

          message.success("Đã cập nhật trạng thái thanh toán.");
          await loadData();
        } catch (error) {
          message.error(getErrorMessage(error));
          throw error;
        } finally {
          setPayingId(null);
        }
      },
    });
  };

  const columns = [
    {
      title: "Thành viên",
      key: "member",
      render: (_, record) => (
        <Space size={10}>
          <Avatar
            style={{
              background: "#E8F5EE",
              color: "#2E7D5B",
              fontWeight: 700,
            }}
          >
            {record.member_name?.charAt(0)?.toUpperCase() || "?"}
          </Avatar>

          <div className="reward-member-info">
            <Text strong>{record.member_name}</Text>
            <Text type="secondary" className="reward-member-email">
              {record.email || "Không có email"}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Tháng",
      dataIndex: "month",
      key: "month",
      width: 110,
      render: (value) => (
        <Tag icon={<CalendarDays size={13} />}>
          {formatMonthLabel(value || month)}
        </Tag>
      ),
    },
    {
      title: "Việc hoàn thành",
      dataIndex: "completed_tasks",
      key: "completed_tasks",
      width: 150,
      align: "center",
      render: (value) => <Text strong>{Number(value || 0)} việc</Text>,
    },
    {
      title: "Mức thưởng",
      dataIndex: "amount",
      key: "amount",
      width: 150,
      align: "right",
      render: (value) => (
        <Text strong className="reward-amount">
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (value) =>
        value === "paid" ? (
          <Tag color="success" icon={<CheckCircle2 size={13} />}>
            Đã thanh toán
          </Tag>
        ) : (
          <Tag color="warning">Chưa thanh toán</Tag>
        ),
    },
    {
      title: "Ngày thanh toán",
      dataIndex: "paid_at",
      key: "paid_at",
      width: 170,
      render: (value) =>
        value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "—",
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 170,
      fixed: "right",
      render: (_, record) =>
        record.status === "paid" ? (
          <Tag color="success">Đã đối soát</Tag>
        ) : (
          <Button
            type="primary"
            size="small"
            icon={<CheckCircle2 size={15} />}
            loading={payingId === record.id}
            onClick={() => handleMarkPaid(record)}
          >
            Đánh dấu đã trả
          </Button>
        ),
    },
  ];

  return (
    <div className="rewards-page">
      <div className="rewards-page-header">
        <div>
          <div className="rewards-eyebrow">
            <ShieldCheck size={15} />
            QUẢN LÝ TÀI CHÍNH
          </div>

          <Title level={2}>Quản lý thưởng</Title>

          <Text type="secondary">
            Theo dõi tiền thưởng hàng tháng và trạng thái thanh toán của từng
            thành viên.
          </Text>
        </div>

        <Space wrap>
          <Button
            icon={<RefreshCw size={16} />}
            onClick={loadData}
            loading={loading}
          >
            Làm mới
          </Button>

          <Button
            icon={<Download size={16} />}
            onClick={() => downloadCsv(filteredRewards, month)}
            disabled={filteredRewards.length === 0}
          >
            Xuất CSV
          </Button>

          <Button
            type="primary"
            icon={<Wallet size={16} />}
            onClick={handleSettleMonth}
            loading={settling}
          >
            Chốt thưởng tháng
          </Button>
        </Space>
      </div>

      <Alert
        className="rewards-info-alert"
        type="info"
        showIcon
        message="Quy tắc thưởng"
        description="Dưới 50 công việc được duyệt: 30.000đ · Từ 50 đến 69 công việc: 50.000đ · Từ 70 công việc trở lên: 100.000đ. Backend cần áp dụng cùng quy tắc khi chốt thưởng."
      />

      <Row gutter={[16, 16]} className="rewards-stat-grid">
        <Col xs={24} sm={12} xl={6}>
          <Card className="rewards-stat-card">
            <Statistic
              title="Tổng tiền thưởng"
              value={stats.totalAmount}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<CircleDollarSign size={20} />}
            />
            <Text type="secondary">
              Tháng {selectedMonth.format("MM/YYYY")}
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <Card className="rewards-stat-card">
            <Statistic
              title="Đã thanh toán"
              value={stats.paidAmount}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<CheckCircle2 size={20} />}
            />
            <Text type="secondary">{stats.paidCount} khoản thưởng</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <Card className="rewards-stat-card">
            <Statistic
              title="Chưa thanh toán"
              value={stats.unpaidAmount}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<Wallet size={20} />}
            />
            <Text type="secondary">{stats.unpaidCount} khoản đang chờ</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <Card className="rewards-stat-card">
            <Statistic
              title="Thành viên có thưởng"
              value={stats.memberCount}
              prefix={<Users size={20} />}
            />
            <Text type="secondary">Trong tháng được chọn</Text>
          </Card>
        </Col>
      </Row>

      <Card className="rewards-filter-card">
        <div className="rewards-filter-grid">
          <div>
            <Text className="rewards-filter-label">Tháng thưởng</Text>
            <DatePicker
              picker="month"
              value={selectedMonth}
              onChange={(value) => value && setSelectedMonth(value)}
              allowClear={false}
              format="MM/YYYY"
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <Text className="rewards-filter-label">Thành viên</Text>
            <Select
              value={memberFilter}
              onChange={setMemberFilter}
              options={[
                { label: "Tất cả thành viên", value: "all" },
                ...members,
              ]}
              showSearch
              optionFilterProp="label"
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <Text className="rewards-filter-label">Thanh toán</Text>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_OPTIONS}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <Text className="rewards-filter-label">Tìm kiếm</Text>
            <Input
              allowClear
              prefix={<Search size={16} />}
              placeholder="Tên hoặc email thành viên"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card
        className="rewards-table-card"
        title={
          <div className="rewards-table-title">
            <Wallet size={19} />
            <span>Danh sách thưởng</span>
            <Tag>{filteredRewards.length} khoản</Tag>
          </div>
        }
      >
        {loading ? (
          <div className="rewards-loading">
            <Spin size="large" />
            <Text type="secondary">Đang tải dữ liệu thưởng...</Text>
          </div>
        ) : filteredRewards.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Không có khoản thưởng phù hợp"
          />
        ) : (
          <Table
            rowKey={(record) => record.id}
            columns={columns}
            dataSource={filteredRewards}
            scroll={{ x: 1050 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} khoản thưởng`,
            }}
          />
        )}
      </Card>

      <Card className="rewards-tier-card">
        <div className="rewards-tier-heading">
          <div>
            <Title level={4}>Bậc thưởng hàng tháng</Title>
            <Text type="secondary">
              Số công việc phải là công việc đã được duyệt hoàn thành.
            </Text>
          </div>
        </div>

        <Row gutter={[12, 12]}>
          <Col xs={24} md={8}>
            <div className="rewards-tier-item">
              <div className="rewards-tier-icon bronze">
                <Wallet size={20} />
              </div>
              <div>
                <Text type="secondary">Dưới 50 việc</Text>
                <Title level={3}>{formatCurrency(30000)}</Title>
              </div>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div className="rewards-tier-item">
              <div className="rewards-tier-icon silver">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <Text type="secondary">50–69 việc</Text>
                <Title level={3}>{formatCurrency(50000)}</Title>
              </div>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div className="rewards-tier-item">
              <div className="rewards-tier-icon gold">
                <CircleDollarSign size={20} />
              </div>
              <div>
                <Text type="secondary">Từ 70 việc trở lên</Text>
                <Title level={3}>{formatCurrency(100000)}</Title>
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
