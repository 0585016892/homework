import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Row,
  Select,
  Skeleton,
  Tag,
  Typography,
} from "antd";
import {
  Award,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Gift,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import rewardApi from "../../api/rewardApi";

const { Title, Text } = Typography;

const GREEN = "#00a650";

const STYLES = `
.my-rewards-page {
  --rw-green: #00a650;
  --rw-green-dark: #008b44;
  --rw-green-light: #e9f9ef;
  --rw-text: #18352a;
  --rw-muted: #7b8982;
  color: var(--rw-text);
  padding: 8px 0 32px;
}
.my-rewards-page * { box-sizing: border-box; }
.my-rewards-page .rw-heading {
  display:flex; justify-content:space-between; align-items:flex-start;
  flex-wrap:wrap; gap:16px; margin-bottom:24px;
}
.my-rewards-page .rw-eyebrow {
  display:inline-flex; align-items:center; gap:7px;
  color:var(--rw-green); font-size:12px; font-weight:800;
  letter-spacing:1px; text-transform:uppercase; margin-bottom:8px;
}
.my-rewards-page .rw-title {
  margin:0 !important; color:var(--rw-text) !important;
  font-size:clamp(24px,3vw,32px) !important;
  font-weight:800 !important; letter-spacing:-.8px;
}
.my-rewards-page .rw-subtitle {
  display:block; margin-top:8px; color:var(--rw-muted);
  font-size:14px; line-height:1.7;
}
.my-rewards-page .rw-month-select { min-width:165px; }
.my-rewards-page .rw-month-select .ant-select-selector {
  min-height:42px !important; border-radius:12px !important;
  border-color:#e4ece7 !important; align-items:center;
  box-shadow:none !important;
}
.my-rewards-page .rw-card {
  height:100%; border:1px solid #edf1ee !important;
  border-radius:20px !important;
  box-shadow:0 4px 18px rgba(21,60,39,.035) !important;
  overflow:hidden;
}
.my-rewards-page .rw-card .ant-card-body { padding:22px; }
.my-rewards-page .rw-total {
  position:relative; min-height:215px; overflow:hidden;
  color:#fff; background:linear-gradient(125deg,#00a650 0%,#008b44 100%);
  border:none !important; box-shadow:0 12px 28px rgba(0,166,80,.16) !important;
}
.my-rewards-page .rw-total .ant-card-body {
  position:relative; z-index:1; padding:25px;
}
.my-rewards-page .rw-total:before {
  content:""; position:absolute; width:220px; height:220px;
  border:38px solid rgba(255,255,255,.08); border-radius:50%;
  right:-45px; top:-95px;
}
.my-rewards-page .rw-total:after {
  content:""; position:absolute; width:150px; height:150px;
  background:rgba(255,255,255,.07); border-radius:50%;
  right:30px; bottom:-110px;
}
.my-rewards-page .rw-total-label {
  display:flex; align-items:center; gap:9px;
  color:rgba(255,255,255,.88); font-size:13px; font-weight:600;
}
.my-rewards-page .rw-total-amount {
  display:block; color:#fff; font-size:clamp(28px,4vw,40px);
  font-weight:850; line-height:1.3; letter-spacing:-1px;
  margin:17px 0 12px; overflow-wrap:anywhere;
}
.my-rewards-page .rw-total-foot {
  display:flex; align-items:center; gap:7px;
  color:rgba(255,255,255,.85); font-size:12px;
}
.my-rewards-page .rw-stat { min-height:215px; display:flex; flex-direction:column; }
.my-rewards-page .rw-stat-top {
  display:flex; justify-content:space-between; align-items:center; gap:10px;
}
.my-rewards-page .rw-stat-icon {
  width:44px; height:44px; border-radius:14px;
  display:flex; align-items:center; justify-content:center;
}
.my-rewards-page .rw-stat-label {
  display:block; color:var(--rw-muted); font-size:13px;
  font-weight:600; margin-top:18px;
}
.my-rewards-page .rw-stat-value {
  display:block; color:var(--rw-text);
  font-size:clamp(23px,2.4vw,29px); font-weight:800;
  letter-spacing:-.6px; margin-top:7px; line-height:1.35;
  overflow-wrap:anywhere;
}
.my-rewards-page .rw-stat-foot {
  display:flex; align-items:center; gap:6px; margin-top:auto;
  padding-top:12px; color:var(--rw-muted); font-size:12px;
}
.my-rewards-page .rw-section { margin-top:22px; }
.my-rewards-page .rw-section-heading {
  display:flex; align-items:flex-start; justify-content:space-between;
  gap:14px; flex-wrap:wrap; margin-bottom:20px;
}
.my-rewards-page .rw-section-title {
  display:block; color:var(--rw-text); font-size:17px; font-weight:800;
}
.my-rewards-page .rw-section-desc {
  display:block; color:var(--rw-muted); font-size:12px;
  margin-top:5px; line-height:1.6;
}
.my-rewards-page .rw-history-item {
  display:flex; align-items:center; gap:13px;
  padding:16px 0; border-bottom:1px solid #f0f3f1;
}
.my-rewards-page .rw-history-item:last-child {
  border-bottom:none; padding-bottom:0;
}
.my-rewards-page .rw-history-icon {
  width:44px; height:44px; flex:0 0 44px; border-radius:14px;
  background:var(--rw-green-light); color:var(--rw-green);
  display:flex; align-items:center; justify-content:center;
}
.my-rewards-page .rw-history-main { flex:1; min-width:0; }
.my-rewards-page .rw-history-title {
  display:block; color:var(--rw-text); font-size:13px; font-weight:750;
  line-height:1.5; overflow-wrap:anywhere;
}
.my-rewards-page .rw-history-desc {
  display:block; color:var(--rw-muted); font-size:12px;
  margin-top:4px; line-height:1.5; overflow-wrap:anywhere;
}
.my-rewards-page .rw-history-right {
  flex:0 0 auto; text-align:right; max-width:42%;
}
.my-rewards-page .rw-history-amount {
  display:block; color:var(--rw-green-dark);
  font-size:14px; font-weight:800; white-space:nowrap;
}
.my-rewards-page .rw-history-date {
  display:block; color:var(--rw-muted); font-size:11px; margin-top:5px;
}
.my-rewards-page .rw-progress-box {
  background:#f7faf8; border:1px solid #edf3ef;
  border-radius:16px; padding:18px; margin-bottom:18px;
}
.my-rewards-page .rw-progress-heading {
  display:flex; justify-content:space-between; gap:10px;
  align-items:center; margin-bottom:12px;
}
.my-rewards-page .rw-progress-title {
  color:var(--rw-text); font-size:13px; font-weight:750;
}
.my-rewards-page .rw-progress-number {
  color:var(--rw-green); font-size:13px; font-weight:800;
}
.my-rewards-page .rw-summary-row {
  display:flex; justify-content:space-between; align-items:center;
  gap:12px; padding:13px 0; border-bottom:1px solid #edf1ee;
  font-size:13px;
}
.my-rewards-page .rw-summary-row:last-child { border-bottom:none; }
.my-rewards-page .rw-summary-label { color:var(--rw-muted); }
.my-rewards-page .rw-summary-value { color:var(--rw-text); font-weight:800; text-align:right; }
.my-rewards-page .rw-refresh {
  border-radius:11px !important; height:38px;
}
.my-rewards-page .rw-error { margin-bottom:18px; border-radius:12px; }
.my-rewards-page .rw-empty { padding:30px 0; }
@media(max-width:767px) {
  .my-rewards-page { padding-top:4px; }
  .my-rewards-page .rw-heading { margin-bottom:18px; }
  .my-rewards-page .rw-month-select { width:100%; }
  .my-rewards-page .rw-month-select .ant-select { width:100%; }
  .my-rewards-page .rw-card .ant-card-body { padding:18px; }
  .my-rewards-page .rw-total { min-height:190px; }
  .my-rewards-page .rw-total .ant-card-body { padding:22px; }
  .my-rewards-page .rw-stat { min-height:180px; }
  .my-rewards-page .rw-stat-value { font-size:24px; }
  .my-rewards-page .rw-history-item { gap:10px; }
  .my-rewards-page .rw-history-icon { width:38px; height:38px; flex-basis:38px; }
  .my-rewards-page .rw-history-right { max-width:44%; }
  .my-rewards-page .rw-history-amount { font-size:12px; }
}
`;

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthOptions(count = 12) {
  const now = new Date();

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const value = `${year}-${month}`;

    return {
      value,
      label: `Tháng ${date.getMonth() + 1}/${year}`,
    };
  });
}

function formatMoney(value) {
  const amount = Number(value) || 0;

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value) {
  if (!value) return "Chưa có ngày";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getAmount(item) {
  return (
    Number(
      item?.amount ??
        item?.reward_amount ??
        item?.total_amount ??
        item?.bonus_amount ??
        item?.value ??
        0,
    ) || 0
  );
}

function getRewardDate(item) {
  return (
    item?.reward_date ??
    item?.paid_at ??
    item?.settled_at ??
    item?.created_at ??
    item?.date ??
    item?.updated_at ??
    null
  );
}

function getRewardStatus(item) {
  const raw = String(
    item?.status ?? item?.payment_status ?? item?.reward_status ?? "",
  ).toLowerCase();

  if (
    item?.is_paid === true ||
    item?.paid === true ||
    item?.is_paid === 1 ||
    ["paid", "received", "completed", "success", "settled"].includes(raw)
  ) {
    return "paid";
  }

  if (["cancelled", "canceled", "rejected", "failed"].includes(raw)) {
    return "cancelled";
  }

  return "pending";
}

function getRewardTitle(item) {
  return (
    item?.title ??
    item?.reward_name ??
    item?.name ??
    item?.description ??
    item?.task_title ??
    "Tiền thưởng công việc"
  );
}

function getRewardDescription(item) {
  return (
    item?.description ??
    item?.note ??
    item?.reason ??
    item?.task_title ??
    item?.message ??
    "Khoản thưởng của bạn"
  );
}

function unwrapRewards(response) {
  const root = response?.data ?? response;

  const candidates = [
    root,
    root?.data,
    root?.rewards,
    root?.items,
    root?.rows,
    root?.results,
    root?.data?.rewards,
    root?.data?.items,
    root?.data?.rows,
    root?.data?.results,
  ];

  return candidates.find(Array.isArray) ?? [];
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Không thể tải dữ liệu tiền thưởng. Vui lòng thử lại."
  );
}

function getStatusInfo(status) {
  if (status === "paid") {
    return {
      label: "Đã thanh toán",
      color: "success",
    };
  }

  if (status === "cancelled") {
    return {
      label: "Đã hủy",
      color: "default",
    };
  }

  return {
    label: "Chờ thanh toán",
    color: "warning",
  };
}

export default function MyRewards() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const monthOptions = useMemo(() => getMonthOptions(12), []);

  const fetchRewards = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [yearString, monthString] = selectedMonth.split("-");

      // API hỗ trợ lọc theo tháng và thành viên.
      // Backend có thể bỏ qua params không sử dụng.
      const response = await rewardApi.getAll({
        month: Number(monthString),
        year: Number(yearString),
      });

      const data = unwrapRewards(response);

      // Lọc lại theo tháng được chọn để tránh hiển thị nhầm tháng
      // nếu API trả về danh sách không lọc theo tháng.
      const filtered = data.filter((item) => {
        const date = getRewardDate(item);

        if (!date) return true;

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
          return true;
        }

        const itemMonth = `${parsedDate.getFullYear()}-${String(
          parsedDate.getMonth() + 1,
        ).padStart(2, "0")}`;

        return itemMonth === selectedMonth;
      });

      setRewards(filtered);
    } catch (requestError) {
      console.error(
        "[MyRewards] Không thể tải danh sách thưởng:",
        requestError,
      );
      setRewards([]);
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards, refreshKey]);

  const summary = useMemo(() => {
    const paidRewards = rewards.filter(
      (item) => getRewardStatus(item) === "paid",
    );

    const pendingRewards = rewards.filter(
      (item) => getRewardStatus(item) === "pending",
    );

    const cancelledRewards = rewards.filter(
      (item) => getRewardStatus(item) === "cancelled",
    );

    const paidAmount = paidRewards.reduce(
      (total, item) => total + getAmount(item),
      0,
    );

    const pendingAmount = pendingRewards.reduce(
      (total, item) => total + getAmount(item),
      0,
    );

    const totalAmount = rewards.reduce(
      (total, item) => total + getAmount(item),
      0,
    );

    return {
      totalAmount,
      paidAmount,
      pendingAmount,
      paidCount: paidRewards.length,
      pendingCount: pendingRewards.length,
      cancelledCount: cancelledRewards.length,
      rewardCount: rewards.length,
    };
  }, [rewards]);

  const sortedRewards = useMemo(() => {
    return [...rewards].sort((a, b) => {
      const dateA = new Date(getRewardDate(a) || 0).getTime();
      const dateB = new Date(getRewardDate(b) || 0).getTime();

      return dateB - dateA;
    });
  }, [rewards]);

  const paidPercent =
    summary.totalAmount > 0
      ? Math.round((summary.paidAmount / summary.totalAmount) * 100)
      : 0;

  const selectedMonthLabel =
    monthOptions.find((item) => item.value === selectedMonth)?.label ??
    selectedMonth;

  return (
    <div className="my-rewards-page">
      <style>{STYLES}</style>

      <div className="rw-heading">
        <div>
          <div className="rw-eyebrow">
            <Sparkles size={15} />
            Thành quả của bạn
          </div>

          <Title level={2} className="rw-title">
            Tiền thưởng của tôi
          </Title>

          <Text className="rw-subtitle">
            Theo dõi khoản thưởng và thành quả bạn đã đạt được.
          </Text>
        </div>

        <Select
          className="rw-month-select"
          value={selectedMonth}
          options={monthOptions}
          onChange={setSelectedMonth}
          suffixIcon={<CalendarDays size={16} />}
          aria-label="Chọn tháng xem tiền thưởng"
        />
      </div>

      {error && (
        <Alert
          className="rw-error"
          type="error"
          showIcon
          message="Không tải được dữ liệu"
          description={error}
          action={
            <Button
              size="small"
              icon={<RefreshCw size={14} />}
              onClick={() => setRefreshKey((value) => value + 1)}
            >
              Thử lại
            </Button>
          }
        />
      )}

      {loading ? (
        <Row gutter={[16, 16]}>
          {[1, 2, 3].map((item) => (
            <Col xs={24} md={8} key={item}>
              <Card className="rw-card">
                <Skeleton active paragraph={{ rows: 4 }} />
              </Card>
            </Col>
          ))}
          <Col xs={24} lg={15}>
            <Card className="rw-card">
              <Skeleton active paragraph={{ rows: 5 }} />
            </Card>
          </Col>
          <Col xs={24} lg={9}>
            <Card className="rw-card">
              <Skeleton active paragraph={{ rows: 5 }} />
            </Card>
          </Col>
        </Row>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12} xl={8}>
              <Card className="rw-card rw-total">
                <div className="rw-total-label">
                  <Wallet size={17} />
                  Tổng tiền thưởng tháng này
                </div>

                <span className="rw-total-amount">
                  {formatMoney(summary.totalAmount)}
                </span>

                <div className="rw-total-foot">
                  <CalendarDays size={14} />
                  {selectedMonthLabel}
                  <span>·</span>
                  {summary.rewardCount} khoản thưởng
                </div>
              </Card>
            </Col>

            <Col xs={24} md={12} xl={8}>
              <Card className="rw-card rw-stat">
                <div className="rw-stat-top">
                  <div
                    className="rw-stat-icon"
                    style={{ background: "#e9f9ef", color: GREEN }}
                  >
                    <CheckCircle2 size={22} />
                  </div>
                  <Tag color="success">Đã nhận</Tag>
                </div>

                <span className="rw-stat-label">Tiền đã thanh toán</span>

                <span className="rw-stat-value">
                  {formatMoney(summary.paidAmount)}
                </span>

                <div className="rw-stat-foot">
                  <CheckCircle2 size={14} />
                  {summary.paidCount} khoản đã thanh toán
                </div>
              </Card>
            </Col>

            <Col xs={24} md={12} xl={8}>
              <Card className="rw-card rw-stat">
                <div className="rw-stat-top">
                  <div
                    className="rw-stat-icon"
                    style={{ background: "#fff6e5", color: "#c58a18" }}
                  >
                    <Clock3 size={22} />
                  </div>
                  <Tag color="warning">Đang chờ</Tag>
                </div>

                <span className="rw-stat-label">
                  Tiền thưởng chờ thanh toán
                </span>

                <span className="rw-stat-value">
                  {formatMoney(summary.pendingAmount)}
                </span>

                <div className="rw-stat-foot">
                  <Clock3 size={14} />
                  {summary.pendingCount} khoản đang chờ
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={15}>
              <Card className="rw-card rw-section">
                <div className="rw-section-heading">
                  <div>
                    <span className="rw-section-title">
                      <Gift
                        size={18}
                        style={{
                          display: "inline",
                          verticalAlign: "middle",
                          marginRight: 8,
                          color: GREEN,
                        }}
                      />
                      Lịch sử tiền thưởng
                    </span>
                    <span className="rw-section-desc">
                      Các khoản thưởng trong {selectedMonthLabel.toLowerCase()}.
                    </span>
                  </div>

                  <Button
                    className="rw-refresh"
                    icon={<RefreshCw size={15} />}
                    onClick={() => setRefreshKey((value) => value + 1)}
                  >
                    Làm mới
                  </Button>
                </div>

                {sortedRewards.length === 0 ? (
                  <div className="rw-empty">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        error
                          ? "Không thể hiển thị dữ liệu thưởng."
                          : "Chưa có khoản thưởng trong tháng này."
                      }
                    />
                  </div>
                ) : (
                  sortedRewards.map((item, index) => {
                    const status = getStatusInfo(getRewardStatus(item));
                    const isBonus =
                      String(item?.type ?? item?.reward_type ?? "")
                        .toLowerCase()
                        .includes("bonus") ||
                      String(item?.type ?? item?.reward_type ?? "")
                        .toLowerCase()
                        .includes("monthly");

                    return (
                      <div
                        className="rw-history-item"
                        key={
                          item.id ??
                          item.reward_id ??
                          `${index}-${getRewardDate(item)}`
                        }
                      >
                        <div className="rw-history-icon">
                          {isBonus ? (
                            <Award size={20} />
                          ) : (
                            <CircleDollarSign size={20} />
                          )}
                        </div>

                        <div className="rw-history-main">
                          <span className="rw-history-title">
                            {getRewardTitle(item)}
                          </span>
                          <span className="rw-history-desc">
                            {getRewardDescription(item)}
                          </span>
                          <div style={{ marginTop: 7 }}>
                            <Tag color={status.color}>{status.label}</Tag>
                          </div>
                        </div>

                        <div className="rw-history-right">
                          <span className="rw-history-amount">
                            {getAmount(item) >= 0 ? "+" : ""}
                            {formatMoney(getAmount(item))}
                          </span>
                          <span className="rw-history-date">
                            {formatDate(getRewardDate(item))}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </Card>
            </Col>

            <Col xs={24} lg={9}>
              <Card className="rw-card rw-section">
                <div className="rw-section-heading">
                  <div>
                    <span className="rw-section-title">
                      Tổng quan thanh toán
                    </span>
                    <span className="rw-section-desc">
                      Tình hình tiền thưởng tháng này.
                    </span>
                  </div>

                  <div
                    className="rw-stat-icon"
                    style={{ background: "#e9f9ef", color: GREEN }}
                  >
                    <TrendingUp size={21} />
                  </div>
                </div>

                <div className="rw-progress-box">
                  <div className="rw-progress-heading">
                    <span className="rw-progress-title">
                      Tỷ lệ đã thanh toán
                    </span>
                    <span className="rw-progress-number">{paidPercent}%</span>
                  </div>

                  <div
                    style={{
                      height: 9,
                      borderRadius: 99,
                      overflow: "hidden",
                      background: "#dfe9e2",
                    }}
                  >
                    <div
                      style={{
                        width: `${paidPercent}%`,
                        height: "100%",
                        borderRadius: 99,
                        background: GREEN,
                        transition: "width .3s ease",
                      }}
                    />
                  </div>

                  <Text
                    style={{
                      display: "block",
                      marginTop: 11,
                      color: "#7b8982",
                      fontSize: 12,
                    }}
                  >
                    {summary.totalAmount > 0
                      ? `${formatMoney(summary.paidAmount)} trên ${formatMoney(summary.totalAmount)}`
                      : "Chưa có dữ liệu thanh toán"}
                  </Text>
                </div>

                <div className="rw-summary-row">
                  <span className="rw-summary-label">
                    <CheckCircle2
                      size={15}
                      style={{
                        display: "inline",
                        verticalAlign: "middle",
                        marginRight: 7,
                        color: GREEN,
                      }}
                    />
                    Đã thanh toán
                  </span>
                  <span className="rw-summary-value">
                    {summary.paidCount} khoản
                  </span>
                </div>

                <div className="rw-summary-row">
                  <span className="rw-summary-label">
                    <Clock3
                      size={15}
                      style={{
                        display: "inline",
                        verticalAlign: "middle",
                        marginRight: 7,
                        color: "#c58a18",
                      }}
                    />
                    Chờ thanh toán
                  </span>
                  <span className="rw-summary-value">
                    {summary.pendingCount} khoản
                  </span>
                </div>

                <div className="rw-summary-row">
                  <span className="rw-summary-label">
                    <Target
                      size={15}
                      style={{
                        display: "inline",
                        verticalAlign: "middle",
                        marginRight: 7,
                        color: "#7b8982",
                      }}
                    />
                    Đã hủy
                  </span>
                  <span className="rw-summary-value">
                    {summary.cancelledCount} khoản
                  </span>
                </div>

                <div
                  style={{
                    marginTop: 18,
                    padding: 15,
                    borderRadius: 14,
                    background: "#f0faf4",
                    border: "1px solid #e1f3e7",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                    }}
                  >
                    <Sparkles
                      size={19}
                      color={GREEN}
                      style={{ flexShrink: 0, marginTop: 1 }}
                    />
                    <div>
                      <Text
                        strong
                        style={{
                          display: "block",
                          fontSize: 13,
                          color: "#185b36",
                        }}
                      >
                        Mỗi việc tốt đều đáng quý!
                      </Text>
                      <Text
                        style={{
                          display: "block",
                          fontSize: 12,
                          lineHeight: 1.7,
                          color: "#61816e",
                          marginTop: 5,
                        }}
                      >
                        Tiếp tục hoàn thành công việc để tích lũy thêm tiền
                        thưởng cho bản thân.
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}
