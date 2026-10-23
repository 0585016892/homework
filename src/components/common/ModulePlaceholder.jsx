import React from "react";
import { Card, Empty } from "antd";

export default function ModulePlaceholder({
  eyebrow = "VIỆC NHÀ",
  title,
  description,
}) {
  return (
    <div className="page-container">
      <div className="page-heading">
        <div>
          <div className="page-eyebrow">{eyebrow}</div>
          <h1 className="page-title">{title}</h1>
          <p className="page-description">{description}</p>
        </div>
      </div>

      <Card bordered={false} className="placeholder-panel">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <strong>Đang hoàn thiện chức năng</strong>
              <p className="placeholder-description">
                Màn hình này sẽ được triển khai ở bước tiếp theo.
              </p>
            </div>
          }
        />
      </Card>
    </div>
  );
}
