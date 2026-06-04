import { useState } from "react";
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
          <div className="d-flex gap-1 align-items-center">
            {isAdmin && (record.rawStatus === "APPLIED" || record.rawStatus === "APPROVED") && (
              <>
                <button
                  className="btn btn-sm btn-soft-success"
                  onClick={() => setApproveModal({
                    open: true,
                    id: record.id,
                    startDate: record.startDate,
                    endDate: record.endDate,
                    isPaid: record.isPaid,
                    adminNotes: record.adminNotes || ""
                  })}
                  title="Approve / Edit"
                >
                  <i className={`${record.rawStatus === "APPROVED" ? "ti ti-edit" : "ti ti-check"}`} />
                </button>
                <button
                  className="btn btn-sm btn-soft-danger"
                  onClick={() => setRejectModal({ open: true, id: record.id, remark: "" })}
                  title="Reject"
                >
                  <i className="ti ti-x" />
                </button>
              </>
            )}

            {canWithdraw && isSelf && (
              <button
                className="btn btn-sm btn-soft-warning"
                onClick={() => { if (window.confirm("Withdraw this leave?")) withdrawLeave(record.id) }}
                title="Withdraw"
              >
                <i className="ti ti-arrow-back-up" />
              </button>
            )}

            {canCancel && (
              <button
                className="btn btn-sm btn-soft-dark"
                onClick={() => { if (window.confirm("Cancel this approved leave?")) updateStatus(record.id, { status: "CANCELLED" }) }}
                title="Cancel Leave"
              >
                <i className="ti ti-circle-x" />
              </button>
            )}

            {!isAdmin && !canWithdraw && <span className="text-muted fs-12">—</span>}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-sm-center flex-sm-row g-2 flex-column gap-2 mb-3 pb-3 border-bottom">
            <div className="flex-grow g-2-1">
              <h4 className="fw-bold mb-0">Admin Leaves</h4>
            </div>
          </div>

          {/* Stats row */}
          <div className="row g-2 mb-3">
            <div className="col-lg-3">
              <div className="card">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div>
                    <p className="mb-1 text-muted">Total Leaves</p>
                    <span className="text-dark fw-bold fs-4">{leaves.length}</span>
                  </div>
                  <span className="p-2 bg-soft-primary border border-primary rounded-circle text-primary">
                    <i className="ti ti-calendar fs-20" />
                  </span>
                </div>
              </div>
            </div>
            <div className="col-lg-3">
              <div className="card">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div>
                    <p className="mb-1 text-muted">Pending Requests</p>
                    <span className="text-dark fw-bold fs-4">{pendingCount}</span>
                  </div>
                  <span className="p-2 bg-soft-danger border border-danger rounded-circle text-danger">
                    <i className="ti ti-user-question fs-20" />
                  </span>
                </div>
              </div>
            </div>
            <div className="col-lg-3">
              <div className="card">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div>
                    <p className="mb-1 text-muted">Approved</p>
                    <span className="text-dark fw-bold fs-4">{approvedCount}</span>
                  </div>
                  <span className="p-2 bg-soft-success border border-success rounded-circle text-success">
                    <i className="ti ti-user-check fs-20" />
                  </span>
                </div>
              </div>
            </div>
            <div className="col-lg-3">
              <div className="card">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div>
                    <p className="mb-1 text-muted">Rejected</p>
                    <span className="text-dark fw-bold fs-4">{rejectedCount}</span>
                  </div>
                  <span className="p-2 bg-soft-warning border border-warning rounded-circle text-warning">
                    <i className="ti ti-user-x fs-20" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center justify-content-between flex-wrap mb-3">
            <div className="search-set">
              
            </div>
          </div>

          <div className="table-responsive">
            <Datatable columns={columns} dataSource={data} Selection={false} searchText={searchText} />
          </div>
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
