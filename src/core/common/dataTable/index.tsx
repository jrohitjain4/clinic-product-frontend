// index.tsx
import React, { useEffect, useState } from "react";
import { Select, Table } from "antd";
import type { DatatableProps } from "../../data/interface";
import EmptyState from "../emptyState";

const { Option } = Select;

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

  return (
    <div className="card overflow-hidden bg-white shadow-sm border"><div className="card-body p-0"><div className="table-responsive">
      <Table
        className="table table-nowrap datatable"
        rowKey={(record) => record.key ?? record.id ?? String(record.Name_Designation)}
        rowSelection={Selections ? rowSelection : undefined}
        columns={columns}
        rowHoverable={false}
        dataSource={filteredDataSource}
        loading={loading}
        expandable={expandable}
        locale={{
          emptyText: (
            <EmptyState
              title={emptyTitle}
              message={emptyMessage}
              action={null}
            />
          ),
        }}
        pagination={{
          showSizeChanger: false,
          pageSize,
          onShowSizeChange: (size) => setPageSize(size),
          total: filteredDataSource.length,
          showTotal: (total) => (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 16 }}>
              Rows per page:
              <Select
                value={pageSize}
                onChange={(value) => setPageSize(value)}
                style={{ width: 80 }}
                popupMatchSelectWidth={false}
              >
                <Option value={10}>10</Option>
                <Option value={20}>20</Option>
                <Option value={30}>30</Option>
              </Select>
              of {total} Entries
            </div>
          ),
          nextIcon: <i className="ti ti-chevron-right" />,
          prevIcon: <i className="ti ti-chevron-left" />,
        }}
      />
    </div></div></div>
  );
};

export default Datatable;
