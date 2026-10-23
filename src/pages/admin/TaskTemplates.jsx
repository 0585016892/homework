import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  App,
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  TimePicker,
  Tooltip,
  Typography,
} from "antd";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  Edit3,
  ListChecks,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import dayjs from "dayjs";
import taskApi from "../../api/taskApi";
import templateApi from "../../api/templateApi";
import userApi from "../../api/userApi";
import "../../styles/global.css";

const { Title, Text, Paragraph } = Typography;

const REPEAT_OPTIONS = [
  { value: "daily", label: "Hằng ngày" },
  { value: "weekly", label: "Theo thứ trong tuần" },
  { value: "monthly", label: "Theo ngày trong tháng" },
];

const WEEKDAYS = [
  { label: "Thứ 2", value: 1 },
  { label: "Thứ 3", value: 2 },
  { label: "Thứ 4", value: 3 },
  { label: "Thứ 5", value: 4 },
  { label: "Thứ 6", value: 5 },
  { label: "Thứ 7", value: 6 },
  { label: "Chủ nhật", value: 0 },
];

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  "Có lỗi xảy ra. Vui lòng thử lại.";

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

const normalizeTemplate = (item, index) => {
  let repeatDays = item?.repeat_days ?? [];

  if (typeof repeatDays === "string") {
    try {
      repeatDays = JSON.parse(repeatDays);
    } catch {
      repeatDays = repeatDays.split(",").map(Number).filter(Number.isFinite);
    }
  }

  if (!Array.isArray(repeatDays)) repeatDays = [];

  const linkedTask = item?.task || item?.work_task || {};

  return {
    ...item,
    id: item?.id ?? item?.template_id ?? `template-${index}`,
    task_id: item?.task_id ?? linkedTask?.id ?? null,
    title:
      linkedTask?.title ??
      linkedTask?.name ??
      item?.task_title ??
      item?.title ??
      item?.name ??
      "",
    description:
      linkedTask?.description ??
      item?.task_description ??
      item?.description ??
      "",
    assigned_to: item?.assigned_to ?? item?.user_id ?? null,
    repeat_type: item?.repeat_type ?? "daily",
    repeat_days: repeatDays.map(Number),
    repeat_day_of_month: Number(item?.repeat_day_of_month ?? 1),
    due_time: item?.due_time ?? "08:00",
    start_date: item?.start_date ?? dayjs().format("YYYY-MM-DD"),
    end_date: item?.end_date ?? null,
    is_active:
      item?.is_active === undefined
        ? item?.status !== "inactive"
        : item.is_active === 1 ||
          item.is_active === true ||
          item.is_active === "1",
    member_name:
      item?.member_name ?? item?.assigned_name ?? item?.user?.full_name ?? "",
  };
};
const toFormValues = (record) => ({
  title: record.title,
  description: record.description,
  assigned_to: record.assigned_to ? String(record.assigned_to) : undefined,
  repeat_type: record.repeat_type,
  repeat_days: record.repeat_days,
  repeat_day_of_month: record.repeat_day_of_month,
  due_time: record.due_time
    ? dayjs(record.due_time, "HH:mm")
    : dayjs("08:00", "HH:mm"),
  start_date: record.start_date ? dayjs(record.start_date) : dayjs(),
  end_date: record.end_date ? dayjs(record.end_date) : null,
  is_active: record.is_active,
});

const getRepeatDescription = (record) => {
  if (record.repeat_type === "weekly") {
    const labels = WEEKDAYS.filter((day) =>
      record.repeat_days.includes(day.value),
    ).map((day) => day.label);

    return labels.length ? labels.join(", ") : "Chưa chọn thứ";
  }

  if (record.repeat_type === "monthly") {
    return `Ngày ${record.repeat_day_of_month} hằng tháng`;
  }

  return "Mỗi ngày";
};

const buildPayload = (values) => ({
  task_id: Number(values.task_id),
  assigned_to: Number(values.assigned_to),
  repeat_type: values.repeat_type,
  repeat_days: values.repeat_type === "weekly" ? values.repeat_days || [] : [],
  repeat_day_of_month:
    values.repeat_type === "monthly" ? values.repeat_day_of_month : null,
  due_time: values.due_time?.format("HH:mm") || "08:00",
  start_date: values.start_date?.format("YYYY-MM-DD"),
  end_date: values.end_date?.format("YYYY-MM-DD") || null,
  is_active: Boolean(values.is_active),
});

export default function TaskTemplates() {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [members, setMembers] = useState([]);
  const [availableTasks, setAvailableTasks] = useState([]);

  const [keyword, setKeyword] = useState("");
  const [repeatFilter, setRepeatFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [repeatType, setRepeatType] = useState("daily");

  const selectedTaskId = Form.useWatch("task_id", form);

  const selectedTask = useMemo(
    () =>
      availableTasks.find(
        (task) => String(task.value) === String(selectedTaskId),
      ),
    [availableTasks, selectedTaskId],
  );

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [templateResponse, memberResponse, taskResponse] =
        await Promise.all([
          templateApi.getAll(),
          userApi.getAll({ role: "member" }),
          taskApi.getAll(),
        ]);

      setTemplates(
        unwrapList(templateResponse, ["templates", "items", "results"]).map(
          normalizeTemplate,
        ),
      );

      setMembers(
        unwrapList(memberResponse, ["users", "items", "results"])
          .filter((user) => !user.role || user.role === "member")
          .map((user) => ({
            value: String(user.id),
            label:
              user.full_name ||
              user.name ||
              user.email ||
              `Thành viên ${user.id}`,
          })),
      );

      const taskList = unwrapList(taskResponse, ["tasks", "items", "results"]);

      setAvailableTasks(
        taskList.map((task) => ({
          value: String(task.id ?? task.task_id),
          label: task.title ?? task.name ?? "Công việc chưa có tên",
          description: task.description ?? "",
          task,
        })),
      );
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredTemplates = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    return templates.filter((item) => {
      const matchesKeyword =
        !search ||
        item.title.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search) ||
        item.member_name.toLowerCase().includes(search);

      const matchesRepeat =
        repeatFilter === "all" || item.repeat_type === repeatFilter;

      const matchesActive =
        activeFilter === "all" ||
        (activeFilter === "active" && item.is_active) ||
        (activeFilter === "inactive" && !item.is_active);

      return matchesKeyword && matchesRepeat && matchesActive;
    });
  }, [templates, keyword, repeatFilter, activeFilter]);

  const stats = useMemo(
    () => ({
      total: templates.length,
      active: templates.filter((item) => item.is_active).length,
      daily: templates.filter((item) => item.repeat_type === "daily").length,
      weekly: templates.filter((item) => item.repeat_type === "weekly").length,
      monthly: templates.filter((item) => item.repeat_type === "monthly")
        .length,
    }),
    [templates],
  );

  const openCreateModal = () => {
    setEditingTemplate(null);
    setRepeatType("daily");

    form.setFieldsValue({
      task_id: undefined,
      assigned_to: undefined,
      repeat_type: "daily",
      repeat_days: [],
      repeat_day_of_month: 1,
      due_time: dayjs("08:00", "HH:mm"),
      start_date: dayjs(),
      end_date: null,
      is_active: true,
    });

    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingTemplate(record);
    setRepeatType(record.repeat_type);

    form.setFieldsValue({
      task_id: record.task_id ? String(record.task_id) : undefined,
      assigned_to: record.assigned_to ? String(record.assigned_to) : undefined,
      repeat_type: record.repeat_type,
      repeat_days: record.repeat_days,
      repeat_day_of_month: record.repeat_day_of_month,
      due_time: record.due_time
        ? dayjs(record.due_time, "HH:mm")
        : dayjs("08:00", "HH:mm"),
      start_date: record.start_date ? dayjs(record.start_date) : dayjs(),
      end_date: record.end_date ? dayjs(record.end_date) : null,
      is_active: record.is_active,
    });

    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (
        values.repeat_type === "weekly" &&
        (!values.repeat_days || values.repeat_days.length === 0)
      ) {
        message.warning("Bạn cần chọn ít nhất một thứ trong tuần.");
        return;
      }

      if (
        values.end_date &&
        values.start_date &&
        values.end_date.isBefore(values.start_date, "day")
      ) {
        message.warning("Ngày kết thúc không được trước ngày bắt đầu.");
        return;
      }

      setSaving(true);

      const payload = buildPayload(values);

      if (editingTemplate) {
        await templateApi.update(editingTemplate.id, payload);
        message.success("Đã cập nhật mẫu công việc.");
      } else {
        await templateApi.create(payload);
        message.success("Đã tạo mẫu công việc.");
      }

      setModalOpen(false);
      await loadData();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (record, checked) => {
    try {
      await templateApi.toggle(record.id, {
        is_active: checked,
      });

      message.success(
        checked ? "Đã bật mẫu công việc." : "Đã tạm dừng mẫu công việc.",
      );

      await loadData();
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  const handleDelete = (record) => {
    modal.confirm({
      title: "Xóa mẫu công việc?",
      content: (
        <div>
          <p>
            Bạn sắp xóa mẫu <strong>{record.title}</strong>.
          </p>
          <Text type="secondary">
            Những công việc đã được tạo từ mẫu này có thể vẫn được giữ lại, tùy
            theo cách backend xử lý.
          </Text>
        </div>
      ),
      okText: "Xóa mẫu",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await templateApi.delete(record.id);
          message.success("Đã xóa mẫu công việc.");
          await loadData();
        } catch (error) {
          message.error(getErrorMessage(error));
          throw error;
        }
      },
    });
  };

  const handleDuplicate = (record) => {
    setEditingTemplate(null);
    setRepeatType(record.repeat_type);

    form.setFieldsValue({
      ...toFormValues(record),
      title: `${record.title} (bản sao)`,
      is_active: false,
    });

    setModalOpen(true);
  };

  const columns = [
    {
      title: "Mẫu công việc",
      key: "template",
      width: 300,
      render: (_, record) => (
        <div className="template-name-cell">
          <div className="template-icon">
            <ListChecks size={19} />
          </div>
          <div className="template-name-content">
            <Text strong>{record.title}</Text>
            <Text type="secondary" className="template-description">
              {record.description || "Chưa có mô tả"}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Người thực hiện",
      dataIndex: "member_name",
      key: "member_name",
      width: 190,
      render: (value) =>
        value ? (
          <Space>
            <Avatar
              size="small"
              style={{ background: "#E8F5EE", color: "#2E7D5B" }}
            >
              {value.charAt(0).toUpperCase()}
            </Avatar>
            <Text>{value}</Text>
          </Space>
        ) : (
          <Text type="secondary">Chưa phân công</Text>
        ),
    },
    {
      title: "Lịch lặp",
      key: "repeat",
      width: 220,
      render: (_, record) => (
        <div className="template-repeat-cell">
          <Tag color="processing">
            {REPEAT_OPTIONS.find(
              (option) => option.value === record.repeat_type,
            )?.label || "Hằng ngày"}
          </Tag>
          <Text type="secondary">{getRepeatDescription(record)}</Text>
        </div>
      ),
    },
    {
      title: "Giờ thực hiện",
      dataIndex: "due_time",
      key: "due_time",
      width: 130,
      render: (value) => (
        <Space size={6}>
          <Clock3 size={15} />
          <Text>{String(value || "08:00").slice(0, 5)}</Text>
        </Space>
      ),
    },
    {
      title: "Thời gian áp dụng",
      key: "date_range",
      width: 190,
      render: (_, record) => (
        <div className="template-repeat-cell">
          <Text>
            {record.start_date
              ? dayjs(record.start_date).format("DD/MM/YYYY")
              : "Không giới hạn"}
          </Text>
          <Text type="secondary">
            {record.end_date
              ? `Đến ${dayjs(record.end_date).format("DD/MM/YYYY")}`
              : "Không có ngày kết thúc"}
          </Text>
        </div>
      ),
    },
    {
      title: "Hoạt động",
      dataIndex: "is_active",
      key: "is_active",
      width: 115,
      render: (value, record) => (
        <Space direction="vertical" size={5}>
          <Switch
            size="small"
            checked={Boolean(value)}
            onChange={(checked) => handleToggle(record, checked)}
          />
          <Tag color={value ? "success" : "default"}>
            {value ? "Đang bật" : "Đã tạm dừng"}
          </Tag>
        </Space>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      width: 150,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Sửa mẫu">
            <Button
              type="text"
              icon={<Edit3 size={16} />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>

          <Tooltip title="Nhân bản mẫu">
            <Button
              type="text"
              icon={<Copy size={16} />}
              onClick={() => handleDuplicate(record)}
            />
          </Tooltip>

          <Tooltip title="Xóa mẫu">
            <Button
              type="text"
              danger
              icon={<Trash2 size={16} />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="task-templates-page">
      <div className="task-templates-header">
        <div>
          <div className="task-templates-eyebrow">
            <CalendarDays size={15} />
            LẬP LỊCH TỰ ĐỘNG
          </div>
          <Title level={2}>Lịch công việc</Title>
          <Text type="secondary">
            Tạo mẫu công việc lặp lại để hệ thống tự lên lịch theo ngày, thứ
            trong tuần hoặc ngày trong tháng.
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
            type="primary"
            icon={<Plus size={17} />}
            onClick={openCreateModal}
          >
            Tạo mẫu công việc
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} xl={6}>
          <Card className="template-stat-card">
            <Text type="secondary">Tổng mẫu công việc</Text>
            <Title level={2}>{stats.total}</Title>
            <ListChecks size={21} />
          </Card>
        </Col>
        <Col xs={12} xl={6}>
          <Card className="template-stat-card">
            <Text type="secondary">Đang hoạt động</Text>
            <Title level={2}>{stats.active}</Title>
            <CheckCircle2 size={21} />
          </Card>
        </Col>
        <Col xs={12} xl={6}>
          <Card className="template-stat-card">
            <Text type="secondary">Mẫu hằng ngày</Text>
            <Title level={2}>{stats.daily}</Title>
            <CalendarDays size={21} />
          </Card>
        </Col>
        <Col xs={12} xl={6}>
          <Card className="template-stat-card">
            <Text type="secondary">Mẫu theo tuần / tháng</Text>
            <Title level={2}>{stats.weekly + stats.monthly}</Title>
            <Clock3 size={21} />
          </Card>
        </Col>
      </Row>

      <Card className="template-filter-card">
        <Row gutter={[12, 12]} align="bottom">
          <Col xs={24} md={10}>
            <Text className="template-filter-label">Tìm kiếm</Text>
            <Input
              allowClear
              prefix={<Search size={16} />}
              placeholder="Tên công việc, mô tả, thành viên..."
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </Col>
          <Col xs={12} md={7}>
            <Text className="template-filter-label">Kiểu lặp</Text>
            <Select
              style={{ width: "100%" }}
              value={repeatFilter}
              onChange={setRepeatFilter}
              options={[
                { label: "Tất cả lịch lặp", value: "all" },
                ...REPEAT_OPTIONS,
              ]}
            />
          </Col>
          <Col xs={12} md={7}>
            <Text className="template-filter-label">Trạng thái mẫu</Text>
            <Select
              style={{ width: "100%" }}
              value={activeFilter}
              onChange={setActiveFilter}
              options={[
                { label: "Tất cả", value: "all" },
                { label: "Đang hoạt động", value: "active" },
                { label: "Đã tạm dừng", value: "inactive" },
              ]}
            />
          </Col>
        </Row>
      </Card>

      <Card
        className="template-table-card"
        title={
          <Space>
            <CalendarDays size={19} />
            <span>Danh sách lịch lặp</span>
            <Tag>{filteredTemplates.length} mẫu</Tag>
          </Space>
        }
      >
        {loading ? (
          <div className="template-loading">
            <Spin size="large" />
            <Text type="secondary">Đang tải lịch công việc...</Text>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa có mẫu công việc phù hợp"
          >
            <Button type="primary" onClick={openCreateModal}>
              Tạo mẫu đầu tiên
            </Button>
          </Empty>
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredTemplates}
            scroll={{ x: 1200 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} mẫu`,
            }}
          />
        )}
      </Card>

      <Modal
        title={
          <div className="template-modal-title">
            <div className="template-icon">
              {editingTemplate ? <Edit3 size={19} /> : <Plus size={19} />}
            </div>
            <div>
              <Title level={4}>
                {editingTemplate
                  ? "Chỉnh sửa mẫu công việc"
                  : "Tạo mẫu công việc"}
              </Title>
              <Text type="secondary">
                Thiết lập người thực hiện và lịch lặp tự động
              </Text>
            </div>
          </div>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText={editingTemplate ? "Lưu thay đổi" : "Tạo mẫu"}
        cancelText="Hủy"
        confirmLoading={saving}
        width={720}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            repeat_type: "daily",
            repeat_days: [],
            repeat_day_of_month: 1,
            due_time: dayjs("08:00", "HH:mm"),
            start_date: dayjs(),
            is_active: true,
          }}
          onValuesChange={(changed) => {
            if (changed.repeat_type) {
              setRepeatType(changed.repeat_type);
            }
          }}
        >
          <Form.Item
            name="task_id"
            label="Công việc có sẵn"
            rules={[{ required: true, message: "Vui lòng chọn công việc." }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Chọn công việc từ danh sách công việc"
              options={availableTasks}
              onChange={(value) => {
                const selected = availableTasks.find(
                  (item) => item.value === String(value),
                );

                if (selected) {
                  form.setFieldValue("task_id", selected.value);
                }
              }}
            />
          </Form.Item>

          {selectedTask?.description ? (
            <div className="template-selected-task-description">
              <Text type="secondary">Mô tả công việc</Text>
              <Paragraph style={{ marginBottom: 0 }}>
                {selectedTask.description}
              </Paragraph>
            </div>
          ) : null}
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="assigned_to"
                label="Người thực hiện"
                rules={[
                  { required: true, message: "Chọn thành viên thực hiện." },
                ]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Chọn thành viên"
                  options={members}
                  suffixIcon={<Users size={15} />}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="repeat_type"
                label="Lặp lại"
                rules={[{ required: true }]}
              >
                <Select options={REPEAT_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>

          {repeatType === "weekly" && (
            <Form.Item
              name="repeat_days"
              label="Chọn các thứ trong tuần"
              rules={[
                {
                  required: true,
                  type: "array",
                  min: 1,
                  message: "Chọn ít nhất một thứ.",
                },
              ]}
            >
              <Select
                mode="multiple"
                allowClear
                placeholder="Chọn thứ cần lặp"
                options={WEEKDAYS}
              />
            </Form.Item>
          )}

          {repeatType === "monthly" && (
            <Form.Item
              name="repeat_day_of_month"
              label="Ngày trong tháng"
              rules={[{ required: true, message: "Chọn ngày trong tháng." }]}
            >
              <Select
                options={Array.from({ length: 31 }, (_, index) => ({
                  label: `Ngày ${index + 1}`,
                  value: index + 1,
                }))}
              />
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="due_time"
                label="Giờ thực hiện"
                rules={[{ required: true, message: "Chọn giờ thực hiện." }]}
              >
                <TimePicker
                  format="HH:mm"
                  style={{ width: "100%" }}
                  minuteStep={5}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="start_date"
                label="Ngày bắt đầu"
                rules={[{ required: true, message: "Chọn ngày bắt đầu." }]}
              >
                <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="end_date" label="Ngày kết thúc (không bắt buộc)">
            <DatePicker
              format="DD/MM/YYYY"
              style={{ width: "100%" }}
              placeholder="Không giới hạn ngày kết thúc"
            />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="Trạng thái"
            valuePropName="checked"
          >
            <Switch checkedChildren="Đang bật" unCheckedChildren="Tạm dừng" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
