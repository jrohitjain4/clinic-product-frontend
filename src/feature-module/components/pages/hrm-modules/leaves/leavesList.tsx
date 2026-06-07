import { useMemo, useState } from "react";
import { Link } from "react-router";
import Datatable from "../../../../../core/common/dataTable";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { useLeaves } from "../../../../../core/hooks/useLeaves";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);
import { Modal, Input, DatePicker, Switch, Popconfirm } from "antd";
import { toast } from "react-toastify";
const { TextArea } = Input;

const LeavesList = () => {
  const { leaves, updateStatus, withdrawLeave, deleteLeave, loading, error } = useLeaves();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewRecord, setViewRecord] = useState<any>(null);

  const [filterType, setFilterType] = useState("All");
  const [filterEmpType, setFilterEmpType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDate, setFilterDate] = useState<dayjs.Dayjs | null>(null);

  const leaveTypes = useMemo(() => {
    const list = Array.from(new Set(leaves.map(l => l.leaveTypeName).filter(Boolean)));
    return ["All", ...list];
  }, [leaves]);

  const statusBadge = (status: string) => {
    if (status === "APPLIED") return "badge-soft-info border-info";
    if (status === "APPROVED") return "badge-soft-success border-success";
    if (status === "REJECTED") return "badge-soft-danger border-danger";
    if (status === "COMPLETED") return "badge-soft-secondary border-secondary";
    if (status === "WITHDRAWN") return "badge-soft-warning border-warning";
    if (status === "CANCELLED") return "badge-soft-dark border-dark";
    return "badge-soft-light border-light";
  };

  const [rejectModal, setRejectModal] = useState<{ open: boolean; id: string; remark: string }>({ open: false, id: "", remark: "" });
  const [approveModal, setApproveModal] = useState<{ open: boolean; id: string; startDate: string; endDate: string; isPaid: boolean; adminNotes: string }>({
    open: false, id: "", startDate: "", endDate: "", isPaid: true, adminNotes: ""
  });

  const handleApprove = async () => {
    const ok = await updateStatus(approveModal.id, {
      status: "APPROVED",
      startDate: approveModal.startDate,
      endDate: approveModal.endDate,
      isPaid: approveModal.isPaid,
      adminNotes: approveModal.adminNotes
    });
    setApproveModal({ ...approveModal, open: false });
    if (ok) toast.success("Leave approved successfully");
    else toast.error("Failed to approve leave");
  };

  const handleReject = async () => {
    if (!rejectModal.remark.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }
    const ok = await updateStatus(rejectModal.id, {
      status: "REJECTED",
      rejectRemark: rejectModal.remark
    });
    setRejectModal({ ...rejectModal, open: false });
    if (ok) toast.success("Leave rejected");
    else toast.error("Failed to reject leave");
  };

  const filteredData = useMemo(() => {
    return leaves.filter((l) => {
      const matchType = filterType === "All" || l.leaveTypeName === filterType;
      const matchEmpType = filterEmpType === "All" || l.employeeType === filterEmpType;
      const matchStatus = filterStatus === "All" || l.status === filterStatus.toUpperCase();
      const matchDate =
        !filterDate ||
        dayjs(l.startDate).isSame(filterDate, 'day') ||
        dayjs(l.endDate).isSame(filterDate, 'day') ||
        filterDate.isBetween(dayjs(l.startDate), dayjs(l.endDate), 'day', '[]');

      return matchType && matchEmpType && matchStatus && matchDate;
    });
  }, [leaves, filterType, filterEmpType, filterStatus, filterDate]);

  const data = filteredData.map((l, i) => ({
    key: l.id,
    ...l,
    S_No: i + 1,
    ID: `#LVE0${String(i + 1).padStart(2, "0")}`,
    Employee: l.employeeName,
    Image: l.profileImage,
    LeaveType: l.leaveTypeName,
    Date: `${dayjs(l.startDate).format("DD MMM YYYY")} - ${dayjs(l.endDate).format("DD MMM YYYY")}`,
    Day: l.workingDays === l.days ? `${l.days} Day${l.days > 1 ? "s" : ""}` : `${l.workingDays} / ${l.days} Days`,
    AppliedOn: dayjs(l.appliedOn).format("DD MMM YYYY"),
    Status: l.status.charAt(0) + l.status.slice(1).toLowerCase(),
    rawStatus: l.status,
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
      title: "ID",
      dataIndex: "ID",
      render: (text: string) => <span className="text-dark">{text}</span>,
      sorter: (a: any, b: any) => a.ID.localeCompare(b.ID),
    },
    {
      title: "Employee",
      dataIndex: "Employee",
      render: (text: string, record: any) => (
        <div className="d-flex align-items-center">
          <div className="avatar me-2">
            <ImageWithBasePath
              src={record.Image?.startsWith('/') ? record.Image : `assets/img/users/${record.Image || 'avatar-21.jpg'}`}
              alt={text}
              className="rounded-circle"
            />
          </div>
          <div>
            <h6 className="mb-0 fs-14 fw-semibold text-dark">{text}</h6>
            <span className="text-muted fs-12">{record.employeeType}</span>
          </div>
        </div>
      ),
      sorter: (a: any, b: any) => a.Employee.localeCompare(b.Employee),
    },
    {
      title: "Leave Type",
      dataIndex: "LeaveType",
      render: (text: string) => <span className="text-dark">{text}</span>,
      sorter: (a: any, b: any) => a.LeaveType.localeCompare(b.LeaveType),
    },
    {
      title: "Date",
      dataIndex: "Date",
      render: (text: string) => <span className="text-dark">{text}</span>,
    },
    {
      title: "Days",
      dataIndex: "Day",
      render: (text: string) => <span className="text-dark">{text}</span>,
    },
    {
      title: "Applied On",
      dataIndex: "AppliedOn",
      render: (text: string) => <span className="text-dark">{text}</span>,
      sorter: (a: any, b: any) => dayjs(a.appliedOn).unix() - dayjs(b.appliedOn).unix(),
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string, record: any) => (
        <span className={`badge border fw-medium px-2 py-1 fs-13 ${statusBadge(record.rawStatus)}`}>
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => a.rawStatus.localeCompare(b.rawStatus),
    },
    {
      title: "Action",
      align: "center" as const,
      render: (_: any, record: any) => {
        const storedRole =
          localStorage.getItem("role") ||
          (() => {
            try {
              return JSON.parse(localStorage.getItem("user") || "{}").role;
            } catch {
              return "";
            }
          })();
        const isAdmin = storedRole === "ADMIN" || storedRole === "SUPER_ADMIN";
        const currentUserEmail = (() => {
          try {
            return JSON.parse(localStorage.getItem("user") || "{}").email;
          } catch {
            return "";
          }
        })();
        const isSelf = record.email === currentUserEmail;
        const canWithdraw =
          (record.rawStatus === "APPLIED" || record.rawStatus === "APPROVED") &&
          dayjs().isBefore(dayjs(record.startDate));
        const canCancel =
          isAdmin &&
          record.rawStatus === "APPROVED" &&
          dayjs().isBefore(dayjs(record.endDate));

        return (
          <div className="d-flex align-items-center justify-content-center gap-2">
            {/* View */}
            <button
              className="bg-transparent border-0 text-info p-1"
              data-bs-toggle="modal"
              data-bs-target="#view_leave"
              onClick={(e) => {
                e.preventDefault();
                setViewRecord(record);
              }}
              title="View Details"
            >
              <i className="ti ti-eye fs-18"></i>
            </button>

            {/* Delete */}
            <Popconfirm
              title="Permanently delete this leave record?"
              onConfirm={async () => {
                const ok = await deleteLeave(record.id);
                if (ok) toast.success("Leave record deleted");
                else toast.error("Failed to delete leave record");
              }}
              okText="Yes, Delete"
              cancelText="No"
              okButtonProps={{ danger: true }}
            >
              <button
                className="bg-transparent border-0 text-danger p-1"
                title="Delete"
              >
                <i className="ti ti-trash fs-18"></i>
              </button>
            </Popconfirm>

            {/* Approve */}
            {record.rawStatus === "APPLIED" && isAdmin && (
              <button
                className="bg-transparent border-0 text-success p-1"
                onClick={(e) => {
                  e.preventDefault();
                  setApproveModal({
                    open: true,
                    id: record.id,
                    startDate: record.startDate,
                    endDate: record.endDate,
                    isPaid: record.isPaid ?? true,
                    adminNotes: record.adminNotes || "",
                  });
                }}
                title="Approve"
              >
                <i className="ti ti-check fs-18"></i>
              </button>
            )}

            {/* Edit/Review */}
            {(record.rawStatus === "APPLIED" ||
              record.rawStatus === "APPROVED") &&
              isAdmin && (
                <button
                  className="bg-transparent border-0 text-primary p-1"
                  onClick={(e) => {
                    e.preventDefault();
                    setApproveModal({
                      open: true,
                      id: record.id,
                      startDate: record.startDate,
                      endDate: record.endDate,
                      isPaid: record.isPaid ?? true,
                      adminNotes: record.adminNotes || "",
                    });
                  }}
                  title="Edit / Review"
                >
                  <i className="ti ti-edit fs-18"></i>
                </button>
              )}

            {/* Reject */}
            {isAdmin && record.rawStatus === "APPLIED" && (
              <button
                className="bg-transparent border-0 text-warning p-1"
                onClick={(e) => {
                  e.preventDefault();
                  setRejectModal({ open: true, id: record.id, remark: "" });
                }}
                title="Reject"
              >
                <i className="ti ti-x fs-18"></i>
              </button>
            )}

            {/* Withdraw */}
            {canWithdraw && isSelf && (
              <Popconfirm
                title="Withdraw this leave request?"
                onConfirm={async () => {
                  const ok = await withdrawLeave(record.id);
                  if (ok) toast.success("Leave withdrawn successfully");
                  else toast.error("Failed to withdraw leave");
                }}
                okText="Yes, Withdraw"
                cancelText="No"
              >
                <button
                  className="bg-transparent border-0 text-warning p-1"
                  title="Withdraw"
                >
                  <i className="ti ti-arrow-back fs-18"></i>
                </button>
              </Popconfirm>
            )}

            {/* Cancel */}
            {canCancel && (
              <Popconfirm
                title="Cancel this approved leave?"
                onConfirm={async () => {
                  const ok = await updateStatus(record.id, { status: "CANCELLED" });
                  if (ok) toast.success("Leave cancelled successfully");
                  else toast.error("Failed to cancel leave");
                }}
                okText="Yes, Cancel"
                cancelText="No"
                okButtonProps={{ danger: true }}
              >
                <button
                  className="bg-transparent border-0 text-dark p-1"
                  title="Cancel Leave"
                >
                  <i className="ti ti-ban fs-18"></i>
                </button>
              </Popconfirm>
            )}
          </div>
        );
      },
      width: 120,
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
                Admin Leaves
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total : {loading ? "" : filteredData.length}
                </span>
              </h4>
            </div>

            {/* Filter and Action Buttons */}
            <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
              {/* Employee Type Filter */}
              <div className="dropdown">
                <Link
                  to="#"
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap"
                  style={{ minWidth: "130px", minHeight: "38px" }}
                  data-bs-toggle="dropdown"
                >
                  <span className="text-truncate">
                    <span className="text-muted">Type:</span> {filterEmpType}
                  </span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setFilterEmpType("All");
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
                        setFilterEmpType("Doctor");
                      }}
                    >
                      Doctor
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setFilterEmpType("Staff");
                      }}
                    >
                      Staff
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Leave Type Filter */}
              <div className="dropdown">
                <Link
                  to="#"
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap"
                  style={{ minWidth: "150px", minHeight: "38px" }}
                  data-bs-toggle="dropdown"
                >
                  <span className="text-truncate">
                    <span className="text-muted">Leave:</span> {filterType}
                  </span>
                </Link>
                <ul
                  className="dropdown-menu dropdown-menu-end p-2"
                  style={{ maxHeight: "200px", overflowY: "auto" }}
                >
                  {leaveTypes.map((t) => (
                    <li key={t}>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          setFilterType(t);
                        }}
                      >
                        {t}
                      </Link>
                    </li>
                  ))}
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

              {/* Status Filter */}
              <div className="dropdown">
                <Link
                  to="#"
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap"
                  style={{ minWidth: "120px", minHeight: "38px" }}
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
                  {[
                    "Applied",
                    "Approved",
                    "Rejected",
                    "Completed",
                    "Withdrawn",
                    "Cancelled",
                  ].map((s) => (
                    <li key={s}>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          setFilterStatus(s);
                        }}
                      >
                        {s}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Table or Empty State */}
          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status" />
              <p className="text-muted mt-2 mb-0">Loading leave requests</p>
            </div>
          ) : leaves.length === 0 ? (
            <div className="text-center py-5 border rounded bg-white">
              <i className="ti ti-calendar-x fs-1 text-muted d-block mb-2" />
              <h6 className="fw-bold">No leave requests yet</h6>
              <p className="text-muted mb-0">No leave applications found.</p>
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
                data-bs-target="#bulk_delete_modal"
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

      {/* ===== REJECT MODAL ===== */}
      <Modal
        title="Reject Leave Request"
        open={rejectModal.open}
        onOk={handleReject}
        onCancel={() => setRejectModal({ ...rejectModal, open: false })}
        okText="Confirm Reject"
        okButtonProps={{ danger: true }}
        width={600}
      >
        <div className="mb-3">
          <label className="form-label fw-semibold">
            Reason for Rejection <span className="text-danger">*</span>
          </label>
          <TextArea
            rows={4}
            placeholder="Explain why this leave is being rejected..."
            value={rejectModal.remark}
            onChange={(e) => setRejectModal({ ...rejectModal, remark: e.target.value })}
          />
        </div>
      </Modal>

      {/* ===== APPROVE / EDIT MODAL ===== */}
      <Modal
        title="Review Leave Request"
        open={approveModal.open}
        onOk={handleApprove}
        onCancel={() => setApproveModal({ ...approveModal, open: false })}
        okText="Approve & Save"
        width={600}
      >
        <div className="row row-gap-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold">Start Date</label>
            <DatePicker
              className="w-100"
              value={approveModal.startDate ? dayjs(approveModal.startDate) : null}
              onChange={(date) =>
                setApproveModal({ ...approveModal, startDate: date?.toISOString() || "" })
              }
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold">End Date</label>
            <DatePicker
              className="w-100"
              value={approveModal.endDate ? dayjs(approveModal.endDate) : null}
              onChange={(date) =>
                setApproveModal({ ...approveModal, endDate: date?.toISOString() || "" })
              }
            />
          </div>
          <div className="col-md-12">
            <div className="d-flex align-items-center justify-content-between p-2 bg-light rounded">
              <span className="fw-semibold">Mark as Paid Leave?</span>
              <Switch
                checked={approveModal.isPaid}
                onChange={(checked) =>
                  setApproveModal({ ...approveModal, isPaid: checked })
                }
              />
            </div>
          </div>
          <div className="col-md-12">
            <label className="form-label fw-semibold">
              Internal Notes (Optional)
            </label>
            <TextArea
              rows={3}
              placeholder="Any notes for the records..."
              value={approveModal.adminNotes}
              onChange={(e) =>
                setApproveModal({ ...approveModal, adminNotes: e.target.value })
              }
            />
          </div>
        </div>
      </Modal>

      {/* ===== VIEW LEAVE DETAILS MODAL ===== */}
      <div id="view_leave" className="modal fade" role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div
            className="modal-content border-0 shadow-lg"
            style={{ borderRadius: "12px", overflow: "hidden" }}
          >
            <div className="modal-header bg-info text-white">
              <h5 className="modal-title fw-bold">Leave Application Details</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                onClick={() => setViewRecord(null)}
              ></button>
            </div>
            <div className="modal-body">
              {viewRecord && (
                <div className="row g-3">
                  <div className="col-md-12 text-center mb-3">
                    <div className="avatar avatar-xxl bg-light p-1 rounded-circle shadow-sm mx-auto">
                      <ImageWithBasePath
                        src={
                          viewRecord.Image?.startsWith("/")
                            ? viewRecord.Image
                            : `assets/img/users/${viewRecord.Image || "avatar-21.jpg"}`
                        }
                        alt={viewRecord.Employee}
                        className="rounded-circle"
                      />
                    </div>
                    <h5 className="mt-2 fw-bold">{viewRecord.Employee}</h5>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-muted">
                      Leave Type
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={viewRecord.LeaveType || ""}
                      readOnly
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-muted">
                      Status
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light fw-bold"
                      value={viewRecord.Status || ""}
                      readOnly
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-muted">
                      Start Date
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={dayjs(viewRecord.startDate).format("DD MMM YYYY")}
                      readOnly
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-muted">
                      End Date
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={dayjs(viewRecord.endDate).format("DD MMM YYYY")}
                      readOnly
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-uppercase text-muted">
                      Total Days
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={viewRecord.Day || ""}
                      readOnly
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-uppercase text-muted">
                      Applied On
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={viewRecord.AppliedOn || ""}
                      readOnly
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-uppercase text-muted">
                      Payment Type
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={
                        viewRecord.isPaid ? "Paid Leave" : "Unpaid Leave"
                      }
                      readOnly
                    />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label fw-bold small text-uppercase text-muted">
                      Reason
                    </label>
                    <textarea
                      className="form-control bg-light"
                      rows={2}
                      value={viewRecord.reason || "No reason provided"}
                      readOnly
                    />
                  </div>
                  {viewRecord.rejectRemark && (
                    <div className="col-md-12">
                      <label className="form-label fw-bold small text-uppercase text-danger">
                        Rejection Remark
                      </label>
                      <textarea
                        className="form-control bg-danger-subtle text-danger border-danger-subtle"
                        rows={2}
                        value={viewRecord.rejectRemark}
                        readOnly
                      />
                    </div>
                  )}
                  {viewRecord.adminNotes && (
                    <div className="col-md-12">
                      <label className="form-label fw-bold small text-uppercase text-info">
                        Internal Admin Notes
                      </label>
                      <textarea
                        className="form-control bg-info-subtle text-info border-info-subtle"
                        rows={2}
                        value={viewRecord.adminNotes}
                        readOnly
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer border-top pt-3">
              <button
                type="button"
                className="btn btn-primary px-5"
                data-bs-dismiss="modal"
                onClick={() => setViewRecord(null)}
                style={{ borderRadius: "6px" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LeavesList;