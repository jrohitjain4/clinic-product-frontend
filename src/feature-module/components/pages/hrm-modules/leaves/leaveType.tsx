import { useMemo, useState } from "react";
import EmptyState from "../../../../../core/common/emptyState";
import { Link } from "react-router";
import Datatable from "../../../../../core/common/dataTable";
import LeaveTypeModal from "./modal/leaveTypeModal";
import { useLeaveTypes } from "../../../../../core/hooks/useLeaveTypes";
import type { LeaveType as LeaveTypeModel } from "../../../../../core/hooks/useLeaveTypes";
import dayjs from "dayjs";
import { DatePicker } from "antd";

const LeaveType = () => {
  const {
    leaveTypes,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType,
    loading,
    error,
  } = useLeaveTypes();
  const [currentRecord, setCurrentRecord] = useState<LeaveTypeModel | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDate, setFilterDate] = useState<dayjs.Dayjs | null>(null);

  const filteredData = useMemo(() => {
    return leaveTypes.filter((item) => {
      const matchStatus = filterStatus === "All" || item.status === filterStatus;
      const matchDate =
        !filterDate || dayjs(item.createdAt).isSame(filterDate, "day");
      return matchStatus && matchDate;
    });
  }, [leaveTypes, filterStatus, filterDate]);

  const data = filteredData.map((item, index) => ({
    key: item.id,
    id: item.id,
    S_No: index + 1,
    LeaveType: item.name,
    LeaveQuota: item.quota.toString(),
    CreatedOn: dayjs(item.createdAt).format("DD MMM YYYY"),
    Status: item.status,
    _raw: item,
  }));

  const columns = [
    {
      title: "S.No",
      dataIndex: "S_No",
      render: (text: number) => <span className="text-dark fw-medium">{text}</span>,
      sorter: (a: any, b: any) => a.S_No - b.S_No,
      width: 60,
    },
    {
      title: "Leave Type",
      dataIndex: "LeaveType",
      render: (text: string) => <span className="text-dark fw-medium">{text}</span>,
      sorter: (a: any, b: any) => a.LeaveType.localeCompare(b.LeaveType),
    },
    {
      title: "Leave Quota",
      dataIndex: "LeaveQuota",
      render: (text: string) => (
        <span className="text-dark fw-medium">{text} days</span>
      ),
      sorter: (a: any, b: any) =>
        parseInt(a.LeaveQuota) - parseInt(b.LeaveQuota),
    },
    {
      title: "Created On",
      dataIndex: "CreatedOn",
      render: (text: string) => <span className="text-dark">{text}</span>,
      sorter: (a: any, b: any) =>
        new Date(a.CreatedOn).getTime() - new Date(b.CreatedOn).getTime(),
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => (
        <span
          className={`badge border ${text === "Active"
              ? "badge-soft-success border-success"
              : "badge-soft-danger border-danger"
            } px-2 py-1 fs-13 fw-medium`}
        >
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => a.Status.localeCompare(b.Status),
    },
    {
      title: "Action",
      align: "center" as const,
      render: (_text: any, record: any) => (
        <div className="d-flex align-items-center justify-content-center gap-2">
          {/* Edit Icon */}
          <button
            className="bg-transparent border-0 text-primary p-1"
            title="Edit"
            data-bs-toggle="modal"
            data-bs-target="#edit_leave_type"
            onClick={() =>
              setCurrentRecord(
                leaveTypes.find((l) => l.id === record.id) || null
              )
            }
          >
            <i className="ti ti-edit fs-18"></i>
          </button>

          {/* Delete Icon */}
          <button
            className="bg-transparent border-0 text-danger p-1"
            title="Delete"
            data-bs-toggle="modal"
            data-bs-target="#delete_leave_type"
            onClick={() =>
              setCurrentRecord(
                leaveTypes.find((l) => l.id === record.id) || null
              )
            }
          >
            <i className="ti ti-trash fs-18"></i>
          </button>
        </div>
      ),
      width: 100,
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Page Header */}
          <div className="page-header d-flex align-items-sm-center flex-sm-row flex-column gap-2 border-bottom pb-3 mb-3">
            <div className="flex-grow-1">
              <h4 className="page-title fw-bold mb-0 d-flex align-items-center">
                Leave Type
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total : {loading ? "" : filteredData.length}
                </span>
              </h4>
            </div>

            {/* Filter and Action Buttons */}
            <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
              {/* Status Filter */}
              <div className="dropdown">
                <Link
                  to="#"
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap"
                  style={{ minWidth: "130px", minHeight: "38px" }}
                  data-bs-toggle="dropdown"
                >
                  <span className="text-truncate">
                    <span className="text-muted">Status:</span> {filterStatus}
                  </span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setFilterStatus("All");
                      }}
                    >
                      All
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setFilterStatus("Active");
                      }}
                    >
                      Active
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setFilterStatus("Inactive");
                      }}
                    >
                      Inactive
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Date Filter */}
              <DatePicker
                placeholder="Select Date"
                className="form-select text-dark text-nowrap"
                style={{ width: "130px", minHeight: "38px", paddingTop: "7px" }}
                format="DD-MM-YYYY"
                allowClear={true}
                suffixIcon={<i className="ti ti-calendar" />}
                onChange={(date) => setFilterDate(date)}
                value={filterDate}
              />

              {/* Add Leave Type Button */}
              <button
                className="btn btn-primary d-flex align-items-center justify-content-center"
                style={{ minHeight: "38px", whiteSpace: "nowrap" }}
                data-bs-toggle="modal"
                data-bs-target="#add_leave_type"
                onClick={() => setCurrentRecord(null)}
              >
                New Leave Type <i className="fa fa-plus ms-2" />
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger d-flex align-items-center justify-content-between mb-3">
              <span>{error}</span>
              <button type="button" className="btn btn-sm btn-outline-danger">
                Retry
              </button>
            </div>
          )}

          {/* Table or Empty State */}
          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status" />
              <p className="text-muted mt-2 mb-0">Loading leave types</p>
            </div>
          ) : leaveTypes.length === 0 && !error ? (
            <div className="border rounded bg-white">
              <EmptyState
                title="No leave types yet"
                message="Configure leave categories like Casual, Sick, or Earned leave to manage employee time-off requests."
                action={
                  <button
                    className="btn btn-primary"
                    data-bs-toggle="modal"
                    data-bs-target="#add_leave_type"
                    onClick={() => setCurrentRecord(null)}
                  >
                    New Leave Type <i className="ti ti-plus ms-2" />
                  </button>
                }
              />
            </div>
          ) : (
            <div className="table-responsive">
              <Datatable
                columns={columns}
                dataSource={data}
                Selection={true}
                searchText=""
                onSelectionChange={(keys) => setSelectedIds(keys as string[])}
              />
            </div>
          )}

          {/* Delete Selected Bar */}
          {selectedIds.length > 0 && (
            <div className="d-flex justify-content-center pt-4 pb-4 sticky-delete-bar">
              <button
                className="btn btn-danger d-flex align-items-center gap-2 px-4 py-2 shadow"
                data-bs-toggle="modal"
                data-bs-target="#delete_leave_type"
                style={{
                  borderRadius: "8px",
                  minHeight: "42px",
                  fontWeight: "bold",
                }}
              >
                <i className="ti ti-trash fs-18"></i>
                Delete Selected ({selectedIds.length})
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025
            <Link to="#" className="link-primary">
              Docyari
            </Link>
            , All Rights Reserved
          </p>
        </div>
      </div>

      <LeaveTypeModal
        currentRecord={currentRecord}
        handleCreate={createLeaveType}
        handleUpdate={updateLeaveType}
        handleDelete={deleteLeaveType}
      />
    </>
  );
};

export default LeaveType;