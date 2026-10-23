import dayjs from "dayjs";
import "dayjs/locale/vi";

dayjs.locale("vi");

export function formatDate(value, pattern = "DD/MM/YYYY") {
  if (!value) return "—";

  // Với giá trị ngày dạng YYYY-MM-DD, không chuyển qua UTC để tránh lệch ngày.
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = dayjs(value);

    return parsed.isValid() ? parsed.format(pattern) : "—";
  }

  const parsed = dayjs(value);

  return parsed.isValid() ? parsed.format(pattern) : "—";
}
