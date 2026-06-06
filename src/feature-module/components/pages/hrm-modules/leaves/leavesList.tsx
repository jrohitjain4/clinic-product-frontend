import { useState } from "react";
import { Link } from "react-router";
import SearchInput from "../../../../../core/common/dataTable/dataTableSearch";
import Datatable from "../../../../../core/common/dataTable";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { useLeaves } from "../../../../../core/hooks/useLeaves";
import dayjs from "dayjs";
import { Modal, Input, DatePicker, Switch } from "antd";
const { TextArea } = Input;

const LeavesList = () => {
  const { leaves, updateStatus, withdrawLeave } = useLeaves();
  const [searchText, setSearchText] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSearch = (v: string) => setSearchText(v);

  const pendingCount = leaves.filter(l => l.status === "APPLIED").length;
  const approvedCount = leaves.filter(l => l.status === "APPROVED").length;
  const rejectedCount = leaves.filter(l => l.status === "REJECTED").length;

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
    await updateStatus(approveModal.id, {
      status: "APPROVED",
      startDate: approveModal.startDate,
      endDate: approveModal.endDate,
      isPaid: approveModal.isPaid,
      adminNotes: approveModal.adminNotes
    });
    setApproveModal({ ...approveModal, open: false });
  };

  const handleReject = async () => {
    await updateStatus(rejectModal.id, { status: "REJECTED", rejectRemark: rejectModal.remark });
    setRejectModal({ ...rejectModal, open: false });
  };

  const data = leaves.map((l, i) => ({
    key: l.id,
    ...l,
    S_No: i + 1,
    ID: `#EMP0${String(i + 1).padStart(2, "0")}`,
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
    { title: "S.No", dataIndex: "S_No", sorter: (a: any, b: any) => a.S_No - b.S_No },
    { title: "ID", dataIndex: "ID", sorter: (a: any, b: any) => a.ID.localeCompare(b.ID) },
    {
      title: "Employee", dataIndex: "Employee",
      render: (text: string, record: any) => (
        <div className="d-flex align-items-center">
          <div className="avatar me-2">
            <ImageWithBasePath
              src={record.Image?.startsWith('/') ? record.Image : `assets/img/users/${record.Image}`}
              alt={text}
              className="rounded-circle"
            />
          </div>
          <div>
            <h6 className="mb-0 fs-14 fw-semibold">{text}</h6>
            <span className="text-muted fs-12">{record.employeeType}</span>
          </div>
        </div>
      ),
      sorter: (a: any, b: any) => a.Employee.localeCompare(b.Employee),
    },
    { title: "Leave Type", dataIndex: "LeaveType" },
    { title: "Date", dataIndex: "Date" },
    { title: "Day", dataIndex: "Day" },
    { title: "Applied On", dataIndex: "AppliedOn" },
    {
      title: "Status", dataIndex: "Status",
      render: (text: string, record: any) => (
        <span className={`badge border fw-medium px-2 py-1 fs-13 ${statusBadge(record.rawStatus)}`}>{text}</span>
      ),
    },
    {
      title: "Actions",
      render: (_: any, record: any) => {
        const isAdmin = localStorage.getItem("role") === "ADMIN" || localStorage.getItem("role") === "SUPER_ADMIN";
        const isSelf = record.email === JSON.parse(localStorage.getItem("user") || "{}").email;
        const canWithdraw = (record.rawStatus === "APPLIED" || record.rawStatus === "APPROVED") && dayjs().isBefore(dayjs(record.startDate));
        const canCancel = isAdmin && record.rawStatus === "APPROVED" && dayjs().isBefore(dayjs(record.endDate));

        return (
          <div className="text-end d-flex align-items-center justify-content-end gap-2">
            {(record.rawStatus === "APPLIED" || record.rawStatus === "APPROVED") && (
              <>
                <button
                  className={`bg-transparent border-0 p-1 ${record.rawStatus === "APPROVED" ? "text-primary" : "text-success"}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setApproveModal({
                      open: true,
                      id: record.id,
                      startDate: record.startDate,
                      endDate: record.endDate,
                      isPaid: record.isPaid,
                      adminNotes: record.adminNotes || ""
                    });
                  }}
                  title="Approve / Edit"
                >
                  <i className={`${record.rawStatus === "APPROVED" ? "fa fa-edit fs-16" : "fa fa-check fs-16"}`} />
                </button>
                <button
                  className="bg-transparent border-0 text-danger p-1"
                  onClick={(e) => { e.preventDefault(); setRejectModal({ open: true, id: record.id, remark: "" }) }}
                  title="Reject"
                >
                  <i className="fa fa-times fs-16" />
                </button>
              </>
            )}

            {canWithdraw && isSelf && (
              <button
                className="bg-transparent border-0 text-warning p-1"
                onClick={(e) => { e.preventDefault(); if (window.confirm("Withdraw this leave?")) withdrawLeave(record.id) }}
                title="Withdraw"
              >
                <i className="fa fa-undo fs-16" />
              </button>
            )}

            {canCancel && (
              <button
                className="bg-transparent border-0 text-dark p-1"
                onClick={(e) => { e.preventDefault(); if (window.confirm("Cancel this approved leave?")) updateStatus(record.id, { status: "CANCELLED" }) }}
                title="Cancel Leave"
              >
                <i className="fa fa-ban fs-16" />
              </button>
            )}

            {!(record.rawStatus === "APPLIED" || record.rawStatus === "APPROVED") && !canWithdraw && !canCancel && <span className="text-muted fs-12">—</span>}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header d-flex align-items-sm-center flex-sm-row flex-column gap-2 border-bottom pb-3 mb-3">
            <div className="flex-grow-1">
              <h4 className="page-title fw-bold mb-0 d-flex align-items-center">
                Admin Leaves
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total: {leaves.length}
                </span>
              </h4>
            </div>
            <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between" style={{ width: '130px', minHeight: '38px' }} data-bs-toggle="dropdown">
                  <span><span className="text-muted">Employee:</span> All</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1">All</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Doctor Type</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Staff Type</Link></li>
                </ul>
              </div>

              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between" style={{ width: '140px', minHeight: '38px' }} data-bs-toggle="dropdown">
                  <span><span className="text-muted">Leave Type:</span> All</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1">All</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Medical Leave</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Casual Leave</Link></li>
                </ul>
              </div>

              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between" style={{ width: '120px', minHeight: '38px' }} data-bs-toggle="dropdown">
                  <span><span className="text-muted">Date:</span> Select</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1">All</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Today</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">This Week</Link></li>
                </ul>
              </div>

              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between" style={{ width: '120px', minHeight: '38px' }} data-bs-toggle="dropdown">
                  <span><span className="text-muted">Status:</span> All</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1">All</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Approved</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Rejected</Link></li>
                </ul>
              </div>


            </div>
          </div>

          <div className="table-responsive">
            <Datatable 
              columns={columns} 
              dataSource={data} 
              Selection={true} 
              searchText={searchText} 
              onSelectionChange={(keys) => setSelectedIds(keys as string[])}
            />
          </div>
          {selectedIds.length > 0 && (
            <div className="d-flex justify-content-center mt-auto pt-4 pb-4">
              <button
                className="btn btn-danger d-flex align-items-center gap-2 px-4 py-2 shadow"
                data-bs-toggle="modal"
                data-bs-target="#delete_modal"
                style={{ borderRadius: '8px', minHeight: '42px', fontWeight: 'bold' }}
              >
                <i className="ti ti-trash fs-18"></i>
                Delete Selected ({selectedIds.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reject Reason Modal */}
      <Modal
        title="Reject Leave Request"
        open={rejectModal.open}
        onOk={handleReject}
        onCancel={() => setRejectModal({ ...rejectModal, open: false })}
        okText="Confirm Reject"
        okButtonProps={{ danger: true }}
      >
        <div className="mb-3">
          <label className="form-label">Reason for Rejection <span className="text-danger">*</span></label>
          <TextArea
            rows={4}
            placeholder="Explain why this leave is being rejected..."
            value={rejectModal.remark}
            onChange={(e) => setRejectModal({ ...rejectModal, remark: e.target.value })}
          />
        </div>
      </Modal>

      {/* Approve / Edit Modal */}
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
            <label className="form-label">Start Date</label>
            <DatePicker
              className="w-100"
              value={approveModal.startDate ? dayjs(approveModal.startDate) : null}
              onChange={(date) => setApproveModal({ ...approveModal, startDate: date?.toISOString() || "" })}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">End Date</label>
            <DatePicker
              className="w-100"
              value={approveModal.endDate ? dayjs(approveModal.endDate) : null}
              onChange={(date) => setApproveModal({ ...approveModal, endDate: date?.toISOString() || "" })}
            />
          </div>
          <div className="col-md-12">
            <div className="d-flex align-items-center justify-content-between p-2 bg-light rounded">
              <span className="fw-semibold">Mark as Paid Leave?</span>
              <Switch
                checked={approveModal.isPaid}
                onChange={(checked) => setApproveModal({ ...approveModal, isPaid: checked })}
              />
            </div>
          </div>
          <div className="col-md-12">
            <label className="form-label">Internal Notes (Optional)</label>
            <TextArea
              rows={3}
              placeholder="Any notes for the records..."
              value={approveModal.adminNotes}
              onChange={(e) => setApproveModal({ ...approveModal, adminNotes: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default LeavesList;
