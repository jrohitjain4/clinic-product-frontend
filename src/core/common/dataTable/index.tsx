// index.tsx
import React, { useEffect, useState } from "react";
import { Select, Table, Pagination } from "antd";
import type { DatatableProps } from "../../data/interface";
import EmptyState from "../emptyState";

const { Option } = Select;

const isPrimitive = (value: unknown) =>
  typeof value === "string" || typeof value === "number";

const extractText = (value: unknown): string => {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(extractText).join(" ").trim();
  }
  if (React.isValidElement(value)) {
    return extractText((value as any).props?.children);
  }
  return "";
};

const Datatable: React.FC<DatatableProps & { expandable?: any }> = ({
  columns,
  dataSource,
  Selection,
  searchText,
  loading,
  onSelectionChange,
  emptyTitle,
  emptyMessage,
  expandable,
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>([]);
  const [Selections, setSelections] = useState<any>(true);
  const [filteredDataSource, setFilteredDataSource] = useState(dataSource);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setSelections(Selection);
  }, [Selection]);

  useEffect(() => {
    const safeSearchText = (searchText || "").toLowerCase();
    const filteredData = (dataSource || []).filter((record) =>
      Object.values(record || {}).some((field) =>
        String(field || "").toLowerCase().includes(safeSearchText)
      )
    );
    setFilteredDataSource(filteredData);
    setCurrentPage(1);
  }, [searchText, dataSource]);

  const onSelectChange = (newSelectedRowKeys: any[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
    if (onSelectionChange) {
      onSelectionChange(newSelectedRowKeys);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const enhancedColumns = (columns || []).map((col: any) => {
    const title = String(col.title || "");
    const normalizedTitle = title.trim().toLowerCase();
    const isDateColumn =
      /(date|time|visit|created on|updated on|prescribed on|last visit)/i.test(
        normalizedTitle
      );
    const isStatusColumn = normalizedTitle === "status";
    const isActionColumn =
      normalizedTitle === "action" ||
      normalizedTitle === "actions" ||
      (normalizedTitle === "" && typeof col.render === "function");

    const nextCol = { ...col };

    if (isActionColumn) {
      nextCol.title = title || "Action";
      nextCol.className = "text-center text-nowrap";
      nextCol.align = "center";
      nextCol.width = col.width || 150;

      if (typeof col.render === "function") {
        nextCol.render = (value: unknown, record: unknown, index: number) => (
          <div className="d-flex align-items-center justify-content-center gap-2 text-nowrap">
            {col.render(value, record, index)}
          </div>
        );
      }
    }

    if (isDateColumn && typeof col.render === "function") {
      nextCol.render = (value: unknown, record: unknown, index: number) => {
        const rendered = col.render(value, record, index);
        if (React.isValidElement(rendered) && rendered.type === "div") {
          return rendered;
        }
        const text = extractText(rendered) || (isPrimitive(value) ? String(value) : "");
        if (text) {
          return (
            <div className="d-flex align-items-center fw-semibold text-dark fs-13">
              <i className="ti ti-calendar-event me-2 text-primary fs-16" />
              <span>{text}</span>
            </div>
          );
        }
        if (isPrimitive(rendered)) {
          return (
            <div className="d-flex align-items-center fw-semibold text-dark fs-13">
              <i className="ti ti-calendar-event me-2 text-primary fs-16" />
              {rendered || "—"}
            </div>
          );
        }
        return rendered;
      };
    } else if (isDateColumn && !col.render) {
      nextCol.render = (value: unknown) => (
        <div className="d-flex align-items-center fw-semibold text-dark fs-13">
          <i className="ti ti-calendar-event me-2 text-primary fs-16" />
          {isPrimitive(value) && value ? value : "—"}
        </div>
      );
    }

    if (isStatusColumn && typeof col.render === "function") {
      nextCol.render = (value: unknown, record: unknown, index: number) => {
        const rendered = col.render(value, record, index);
        if (React.isValidElement(rendered) && rendered.type === "div") {
          return rendered;
        }

        const text = extractText(rendered) || (isPrimitive(value) ? String(value) : "");

        if (!text) return rendered;

        const status = text.toLowerCase();
        let bg = "#f8f9fa";
        let color = "#6c757d";
        let icon = "ti ti-point";

        if (
          status.includes("available") ||
          status.includes("active") ||
          status.includes("completed") ||
          status.includes("paid")
        ) {
          bg = "#e6f8ef";
          color = "#198754";
          icon = "ti ti-circle-check";
        } else if (
          status.includes("confirmed") ||
          status.includes("approved") ||
          status.includes("new")
        ) {
          bg = "#f0eaff";
          color = "#6610f2";
          icon = "ti ti-circle-check";
        } else if (
          status.includes("checked out") ||
          status.includes("processed")
        ) {
          bg = "#e8f3ff";
          color = "#0d6efd";
          icon = "ti ti-circle-check";
        } else if (
          status.includes("checked in") ||
          status.includes("pending") ||
          status.includes("draft")
        ) {
          bg = "#fff3cd";
          color = "#fd7e14";
          icon = "ti ti-clock";
        } else if (
          status.includes("cancel") ||
          status.includes("unavailable") ||
          status.includes("inactive") ||
          status.includes("failed") ||
          status.includes("rejected")
        ) {
          bg = "#fdeded";
          color = "#dc3545";
          icon = "ti ti-circle-x";
        }

        return (
          <span
            className="badge px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1"
            style={{ backgroundColor: bg, color, fontWeight: 600, fontSize: "12px" }}
          >
            <i className={`${icon} fs-14`} />
            {text}
          </span>
        );
      };
    } else if (isStatusColumn && !col.render) {
      nextCol.render = (value: unknown) => {
        const text = isPrimitive(value) ? String(value) : "";
        if (!text) return value;
        const status = text.toLowerCase();
        let bg = "#f8f9fa";
        let color = "#6c757d";
        let icon = "ti ti-point";

        if (
          status.includes("available") ||
          status.includes("active") ||
          status.includes("completed") ||
          status.includes("paid")
        ) {
          bg = "#e6f8ef";
          color = "#198754";
          icon = "ti ti-circle-check";
        } else if (
          status.includes("confirmed") ||
          status.includes("approved") ||
          status.includes("new")
        ) {
          bg = "#f0eaff";
          color = "#6610f2";
          icon = "ti ti-circle-check";
        } else if (
          status.includes("checked out") ||
          status.includes("processed")
        ) {
          bg = "#e8f3ff";
          color = "#0d6efd";
          icon = "ti ti-circle-check";
        } else if (
          status.includes("checked in") ||
          status.includes("pending") ||
          status.includes("draft")
        ) {
          bg = "#fff3cd";
          color = "#fd7e14";
          icon = "ti ti-clock";
        } else if (
          status.includes("cancel") ||
          status.includes("unavailable") ||
          status.includes("inactive") ||
          status.includes("failed") ||
          status.includes("rejected")
        ) {
          bg = "#fdeded";
          color = "#dc3545";
          icon = "ti ti-circle-x";
        }

        return (
          <span
            className="badge px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1"
            style={{ backgroundColor: bg, color, fontWeight: 600, fontSize: "12px" }}
          >
            <i className={`${icon} fs-14`} />
            {text}
          </span>
        );
      };
    }

    return nextCol;
  });

  return (
    <>
      <style>{`
        .datatable-main-container,
        .datatable-main-container * {
          outline: none !important;
        }
        .datatable-main-container {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        /* Outer .table-responsive on pages wraps table + pagination — strip its card look */
        .table-responsive:has(.datatable-main-container) {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          border-radius: 0 !important;
          overflow: visible !important;
        }
        .datatable-main-container .card,
        .datatable-main-container .card-body,
        .datatable-main-container .table-responsive {
          border: none !important;
        }
        .custom-modern-datatable,
        .custom-modern-datatable .ant-table-wrapper,
        .custom-modern-datatable .ant-spin-nested-loading,
        .custom-modern-datatable .ant-spin-container,
        .custom-modern-datatable .ant-table,
        .custom-modern-datatable .ant-table-container,
        .custom-modern-datatable .ant-table-content {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        .custom-modern-datatable .ant-table-container::before,
        .custom-modern-datatable .ant-table-container::after {
          display: none !important;
        }
        .custom-modern-datatable .ant-table-cell,
        .custom-modern-datatable .ant-table-thead > tr > th,
        .custom-modern-datatable .ant-table-tbody > tr > td {
          border-inline-end: none !important;
        }
        .custom-modern-datatable .ant-table-content,
        .custom-modern-datatable .ant-table-content table {
          border: none !important;
          border-radius: 12px !important;
        }
        .custom-modern-datatable table {
          border-collapse: separate !important;
          border-spacing: 0 !important;
        }
        .custom-modern-datatable .ant-table-thead > tr > th {
          background: #E6E6FF !important;
          color: #1e293b !important;
          font-weight: 700 !important;
          font-size: 13px !important;
          padding: 16px !important;
          border-bottom: 1px solid #f1f5f9 !important;
          text-transform: capitalize;
        }
        .custom-modern-datatable .ant-table-tbody > tr > td {
          padding: 16px !important;
          border-bottom: 1px solid #f1f5f9 !important;
          vertical-align: middle;
        }
        .custom-modern-datatable .ant-table-tbody > tr:hover > td {
          background: #f8fafc !important;
        }
        .custom-modern-datatable td.text-center.text-nowrap a,
        .custom-modern-datatable td.text-center.text-nowrap button:not(.dropdown-item) {
          width: 32px !important;
          height: 32px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          border: 1px solid #dbe4f0 !important;
          border-radius: 8px !important;
          background: #ffffff !important;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06) !important;
          padding: 0 !important;
        }
        .custom-modern-datatable td.text-center.text-nowrap a:hover,
        .custom-modern-datatable td.text-center.text-nowrap button:not(.dropdown-item):hover {
          background: #f8fafc !important;
          border-color: #cbd5e1 !important;
        }
        .custom-modern-datatable td.text-center.text-nowrap .dropdown {
          display: inline-flex !important;
        }
        .datatable-table-shell {
          display: block;
          margin-bottom: 12px;
        }
        .datatable-pagination-shell {
          display: block;
        }
        .modern-pagination-wrapper {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
        }
        .modern-pagination-wrapper .ant-select {
          height: 32px !important;
        }
        .modern-pagination-wrapper .ant-select-selector {
          border-radius: 6px !important;
          border-color: #e2e8f0 !important;
          height: 32px !important;
          display: flex !important;
          align-items: center !important;
          padding: 0 28px 0 10px !important;
        }
        .modern-pagination-wrapper .ant-select-selection-item {
          line-height: 1 !important;
          display: flex !important;
          align-items: center !important;
          height: 100% !important;
        }
        .modern-pagination-wrapper .ant-select-arrow {
          inset-inline-end: 8px !important;
          top: 0 !important;
          bottom: 0 !important;
          margin: auto 0 !important;
          height: 100% !important;
          width: 14px !important;
          color: #94a3b8 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          transform: none !important;
          pointer-events: none;
        }
        .modern-pagination-wrapper .ant-select-open .ant-select-arrow {
          transform: none !important;
        }
        .modern-pagination-wrapper .ant-select-arrow > * {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          line-height: 1 !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .modern-pagination-wrapper .ant-select-arrow i,
        .modern-pagination-wrapper .ant-select-arrow .ti {
          font-size: 14px !important;
          line-height: 1 !important;
          display: block !important;
          margin: 0 !important;
          padding: 0 !important;
          /* Tabler chevron glyph sits slightly high in its box */
          transform: translateY(1px);
        }
        .modern-pagination-wrapper .ant-pagination {
          margin: 0 !important;
        }
        .modern-pagination-wrapper .ant-pagination-item {
          border-radius: 6px !important;
          border: 1px solid #e2e8f0 !important;
          margin: 0 4px !important;
        }
        .modern-pagination-wrapper .ant-pagination-item-active {
          background-color: #6610f2 !important;
          border-color: #6610f2 !important;
        }
        .modern-pagination-wrapper .ant-pagination-item-active a {
          color: #fff !important;
        }
        .modern-pagination-wrapper .ant-pagination-prev .ant-pagination-item-link,
        .modern-pagination-wrapper .ant-pagination-next .ant-pagination-item-link {
          border-radius: 6px !important;
          border: 1px solid #e2e8f0 !important;
          background: #fff !important;
        }
      `}</style>
      <div className="datatable-main-container">
        {/* Table Container - Separate Wrapper */}
        <div className="datatable-table-shell card overflow-hidden bg-white border-0" style={{ marginBottom: "12px", border: "none", outline: "none", borderRadius: "12px", boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)" }}>
          <div className="card-body p-0">
            <div className="table-responsive" style={{ border: "none", outline: "none", boxShadow: "none", background: "transparent" }}>
              <Table
                className="table table-borderless custom-modern-datatable mb-0"
                rowKey={(record) => record.key ?? record.id ?? String(record.Name_Designation)}
                rowSelection={Selections ? rowSelection : undefined}
                columns={enhancedColumns}
                rowHoverable={false}
                dataSource={filteredDataSource.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
                loading={loading}
                expandable={expandable}
                locale={{
                  emptyText: <EmptyState title={emptyTitle} message={emptyMessage} action={null} />,
                }}
                pagination={false}
              />
            </div>
          </div>
        </div>
        
        {/* Pagination Container - Separate Wrapper */}
        {filteredDataSource.length > 0 && (
          <div className="datatable-pagination-shell">
            <div className="modern-pagination-wrapper">
              <div className="d-flex align-items-center text-muted fs-13">
                <span className="me-2 fw-medium">Rows per page:</span>
                <Select
                  value={pageSize}
                  onChange={(val) => { setPageSize(val); setCurrentPage(1); }}
                  style={{ width: 70 }}
                  popupMatchSelectWidth={false}
                  size="small"
                  suffixIcon={<i className="ti ti-chevron-down" style={{ display: "block", lineHeight: 1, fontSize: 14 }} />}
                >
                  <Option value={10}>10</Option>
                  <Option value={20}>20</Option>
                  <Option value={50}>50</Option>
                </Select>
                <span className="ms-3 fw-medium">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredDataSource.length)} of {filteredDataSource.length} entries
                </span>
              </div>
              <div>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={filteredDataSource.length}
                  onChange={(page) => setCurrentPage(page)}
                  showSizeChanger={false}
                  itemRender={(page, type, originalElement) => {
                    if (type === 'prev') return <a><i className="ti ti-chevron-left" /></a>;
                    if (type === 'next') return <a><i className="ti ti-chevron-right" /></a>;
                    return originalElement;
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Datatable;
