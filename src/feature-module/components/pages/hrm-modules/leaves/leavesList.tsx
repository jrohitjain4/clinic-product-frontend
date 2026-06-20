import { useMemo, useState } from "react";
import EmptyState from "../../../../../core/common/emptyState";
import { Link } from "react-router";
import Datatable from "../../../../../core/common/dataTable";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { useLeaves } from "../../../../../core/hooks/useLeaves";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { ViewModal } from "../../../../../core/common/modal/ViewModal";
dayjs.extend(isBetween);
import { Modal, Input, DatePicker, Switch, Popconfirm } from "antd";
import { toast } from "react-toastify";
const { TextArea } = Input;

const LeavesList = () => {
  const { leaves, updateStatus, withdrawLeave, deleteLeave, loading, error } = useLeaves();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewRecord, setViewRecord] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setDeleteLoading(true);
    try {
      for (const id of selectedIds) {
        await deleteLeave(id);
      }
      setSelectedIds([]);
      toast.success("Selected leave requests deleted successfully");
      document.getElementById("btn-close-bulk-delete-leaves")?.click();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete leaves");
    } finally {
      setDeleteLoading(false);
    }
  };

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
  const [approveModal, setApproveModal] = useState<{ open: boolean; id: string; startDate: string; endDate: string; isPaid: boolean; adminNotes: string; isApproving: boolean }>({
    open: false, id: "", startDate: "", endDate: "", isPaid: true, adminNotes: "", isApproving: false
  });

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

  const handleApprove = async () => {
    const ok = await updateStatus(approveModal.id, {
      status: "APPROVED",
      startDate: approveModal.startDate,
      endDate: approveModal.endDate,
      isPaid: approveModal.isPaid,
      adminNotes: approveModal.adminNotes
    });
    setApproveModal({ ...approveModal, open: false });
    if (ok) {
      toast.success("Leave approved successfully");
      document.getElementById("btn-close-approve-leave")?.click();
    } else {
      toast.error("Failed to approve leave");
    }
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
    if (ok) {
      toast.success("Leave rejected");
      document.getElementById("btn-close-reject-leave")?.click();
    } else {
      toast.error("Failed to reject leave");
    }
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
      className: "text-nowrap",
      width: 90,
      render: (_: any, record: any) => {
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
          <div className="d-flex align-items-center justify-content-center gap-2 text-nowrap">
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

            {/* Edit/Review */}
            {(record.rawStatus === "APPLIED" ||
              record.rawStatus === "APPROVED") &&
              isAdmin && (
                <button
                  className="bg-transparent border-0 text-primary p-1"
                  data-bs-toggle="modal"
                  data-bs-target="#approve_leave_v2"
                  onClick={(e) => {
                    e.preventDefault();
                    setApproveModal({
                      open: true,
                      id: record.id,
                      startDate: record.startDate,
                      endDate: record.endDate,
                      isPaid: record.isPaid ?? true,
                      adminNotes: record.adminNotes || "",
                      isApproving: false,
                    });
                  }}
                  title="Edit / Review"
                >
                  <i className="ti ti-edit fs-18"></i>
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
            <div className="border rounded bg-white">
              <EmptyState
                title="No leave requests yet"
                message="There are no leave applications to review. Leave requests from staff and doctors will appear here."
              />
            </div>
          ) : (
            <Datatable
              columns={columns}
              dataSource={data}
              Selection={true}
              searchText=""
              onSelectionChange={(keys) => setSelectedIds(keys as string[])}
            />
          )}

          {/* Delete Selected Bar */}
          {selectedIds.length > 0 && (
            <div className="d-flex justify-content-center pt-4 pb-4 sticky-delete-bar">
              <button
                className="btn btn-danger d-flex align-items-center gap-2 px-4 py-2 shadow"
                data-bs-toggle="modal"
                data-bs-target="#bulk_delete_leaves_modal"
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
      <div id="reject_leave_v2" className="modal fade" role="dialog" aria-hidden="true" tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "15px", overflow: "hidden" }}>
            <div className="modal-header bg-danger text-white pt-4 px-4 pb-3">
              <div className="d-flex align-items-center">
                <div className="bg-white rounded-circle p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <i className="ti ti-x fs-18 text-danger" />
                </div>
                <div>
                  <h5 className="modal-title fw-bold fs-18 mb-0 text-white">Reject Leave Request</h5>
                  <p className="text-white-50 mb-0 fs-12">Please provide a reason for rejection</p>
                </div>
              </div>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" id="btn-close-reject-leave" aria-label="Close"></button>
            </div>
            <div className="modal-body p-4">
              <div className="mb-0">
                <label className="form-label fw-bold mb-2">Reason for Rejection <span className="text-danger">*</span></label>
                <textarea
                  className="form-control border-danger-subtle"
                  rows={4}
                  placeholder="Explain why this leave is being rejected..."
                  value={rejectModal.remark}
                  style={{ borderRadius: '10px', backgroundColor: '#fff5f5' }}
                  onChange={(e) => setRejectModal({ ...rejectModal, remark: e.target.value })}
                />
                <div className="form-text text-danger fs-11 mt-2">
                  <i className="ti ti-info-circle me-1" /> This note will be visible to the employee.
                </div>
              </div>
            </div>
            <div className="modal-footer border-top p-3 px-4 d-flex align-items-center gap-2 bg-light-subtle">
              <button type="button" className="btn btn-light border px-4 fw-semibold" data-bs-dismiss="modal" style={{ borderRadius: '8px' }}>Cancel</button>
              <button
                type="button"
                className="btn btn-danger px-4 d-flex align-items-center gap-2 fw-bold"
                onClick={handleReject}
                style={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(220, 53, 69, 0.2)' }}
              >
                <i className="ti ti-ban fs-16" /> Confirm Reject
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== APPROVE / EDIT MODAL ===== */}
      <div id="approve_leave_v2" className="modal fade" role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "15px", overflow: "hidden" }}>
            <div className="modal-header bg-primary text-white pt-4 px-4 pb-3">
              <div className="d-flex align-items-center">
                <div className="bg-white-transparent rounded-circle p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <i className="ti ti-calendar-check fs-18 text-white" />
                </div>
                <div>
                  <h5 className="modal-title fw-bold fs-18 mb-0 text-white">Review Leave Request</h5>
                </div>
              </div>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" id="btn-close-approve-leave"></button>
            </div>
            <div className="modal-body p-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Start Date</label>
                  <DatePicker
                    className="form-control"
                    style={{ height: '42px' }}
                    value={approveModal.startDate ? dayjs(approveModal.startDate) : null}
                    onChange={(date) =>
                      setApproveModal({ ...approveModal, startDate: date?.toISOString() || "" })
                    }
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">End Date</label>
                  <DatePicker
                    className="form-control"
                    style={{ height: '42px' }}
                    value={approveModal.endDate ? dayjs(approveModal.endDate) : null}
                    onChange={(date) =>
                      setApproveModal({ ...approveModal, endDate: date?.toISOString() || "" })
                    }
                  />
                </div>
                <div className="col-md-12">
                  <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded border border-dashed border-primary-subtle mt-1" style={{ backgroundColor: '#f8f9ff !important' }}>
                    <div className="d-flex align-items-center">
                      <div className="bg-primary-subtle rounded p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                        <i className="ti ti-cash text-primary fs-16" />
                      </div>
                      <div>
                        <h6 className="mb-0 fw-bold fs-14">Mark as Paid Leave?</h6>
                        <p className="text-muted fs-12 mb-0">Toggle to set leave as paid or unpaid</p>
                      </div>
                    </div>
                    <Switch
                      checked={approveModal.isPaid}
                      onChange={(checked) =>
                        setApproveModal({ ...approveModal, isPaid: checked })
                      }
                    />
                  </div>
                </div>
                <div className="col-md-12 mt-3">
                  <label className="form-label fw-bold">Internal Notes (Optional)</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Any notes for the records..."
                    value={approveModal.adminNotes}
                    onChange={(e) =>
                      setApproveModal({ ...approveModal, adminNotes: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer border-top p-3 px-4 d-flex align-items-center gap-2">
              <button type="button" className="btn btn-light border px-4" data-bs-dismiss="modal" style={{ borderRadius: '8px' }}>Cancel</button>
              <button
                type="button"
                className="btn btn-primary px-4 d-flex align-items-center gap-2"
                onClick={handleApprove}
                style={{ borderRadius: '8px', backgroundColor: '#624bff', borderColor: '#624bff' }}
              >
                <i className="ti ti-check fs-16" /> {approveModal.isApproving ? "Approve & Save" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== VIEW LEAVE DETAILS MODAL ===== */}
      <ViewModal
        id="view_leave"
        title="Leave Application Details"
        subtitle="View leave information"
        headerIcon={<i className="ti ti-calendar-off" />}
        highlightTitle={viewRecord?.Employee || "Employee"}
        highlightRightText={viewRecord?.Status || "Status"}
        highlightRightSubText="Status"
        highlightColor="#e0f2fe"
        details={[
          { icon: <i className="ti ti-category" />, label: "Leave Type", value: viewRecord?.LeaveType || "—" },
          { icon: <i className="ti ti-calendar" />, label: "Start Date", value: viewRecord?.startDate ? dayjs(viewRecord.startDate).format("DD MMM YYYY") : "—" },
          { icon: <i className="ti ti-calendar-event" />, label: "End Date", value: viewRecord?.endDate ? dayjs(viewRecord.endDate).format("DD MMM YYYY") : "—" },
          { icon: <i className="ti ti-clock" />, label: "Total Days", value: viewRecord?.Day || "—" },
          { icon: <i className="ti ti-calendar-plus" />, label: "Applied On", value: viewRecord?.AppliedOn || "—" },
          { icon: <i className="ti ti-cash" />, label: "Payment Type", value: viewRecord?.isPaid ? "Paid Leave" : "Unpaid Leave" },
          { icon: <i className="ti ti-file-description" />, label: "Reason", value: viewRecord?.reason || "No reason provided", fullWidth: true },
          ...(viewRecord?.rejectRemark ? [{ icon: <i className="ti ti-x" />, label: "Rejection Remark", value: viewRecord?.rejectRemark, fullWidth: true }] : []),
          ...(viewRecord?.adminNotes ? [{ icon: <i className="ti ti-notes" />, label: "Internal Admin Notes", value: viewRecord?.adminNotes, fullWidth: true }] : [])
        ]}
      >
        {viewRecord?.rawStatus === "APPLIED" && isAdmin && (
          <>
            <button
              type="button"
              className="btn btn-success fw-medium d-flex align-items-center"
              data-bs-dismiss="modal"
              data-bs-toggle="modal"
              data-bs-target="#approve_leave_v2"
              onClick={() => {
                setApproveModal({
                  open: true,
                  id: viewRecord.id,
                  startDate: viewRecord.startDate,
                  endDate: viewRecord.endDate,
                  isPaid: viewRecord.isPaid ?? true,
                  adminNotes: viewRecord.adminNotes || "",
                  isApproving: true,
                });
              }}
            >
              <i className="ti ti-check me-2" />
              Approve
            </button>
            <button
              type="button"
              className="btn btn-danger fw-medium d-flex align-items-center"
              data-bs-dismiss="modal"
              data-bs-toggle="modal"
              data-bs-target="#reject_leave_v2"
              onClick={() => {
                setRejectModal({ open: true, id: viewRecord.id, remark: "" });
              }}
            >
              <i className="ti ti-x me-2" />
              Reject
            </button>
          </>
        )}
      </ViewModal>

      {/* ===== BULK DELETE MODAL ===== */}
      <div className="modal fade" id="bulk_delete_leaves_modal">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "12px", overflow: "hidden" }}>
            <div className="modal-body text-center position-relative z-1 pt-5 pb-5">
              <ImageWithBasePath
                src="assets/img/bg/delete-modal-bg-01.png"
                alt=""
                className="img-fluid position-absolute top-0 start-0 z-n1"
              />
              <ImageWithBasePath
                src="assets/img/bg/delete-modal-bg-02.png"
                alt=""
                className="img-fluid position-absolute bottom-0 end-0 z-n1"
              />
              <div className="mb-3">
                <span className="avatar avatar-lg bg-danger text-white">
                  <i className="ti ti-trash fs-24"></i>
                </span>
              </div>
              <h5 className="fw-bold mb-2">Delete Confirmation</h5>
              <p className="text-muted mb-4">
                Are you sure you want to delete selected leave requests?
              </p>
              <div className="d-flex justify-content-center gap-2">
                <button
                  id="btn-close-bulk-delete-leaves"
                  type="button"
                  className="btn btn-light position-relative z-1 px-4"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger position-relative z-1 px-4"
                  onClick={handleBulkDelete}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-trash me-2" />
                      Yes, Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LeavesList;