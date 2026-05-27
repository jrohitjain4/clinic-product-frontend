import { useState } from "react";
import { Link } from "react-router";
import SearchInput from "../../../../../core/common/dataTable/dataTableSearch";
import Datatable from "../../../../../core/common/dataTable";
import { useLeaves } from "../../../../../core/hooks/useLeaves";
import { useLeaveTypes } from "../../../../../core/hooks/useLeaveTypes";
import dayjs from "dayjs";
import { DatePicker } from "antd";

const DoctorsLeaves = () => {
  const { leaves, loading, applyLeave, deleteLeave } = useLeaves();
  const { leaveTypes } = useLeaveTypes();
  const [searchText, setSearchText] = useState("");

  // Add leave form state
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState<any>(null);
  const [endDate, setEndDate] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSearch = (v: string) => setSearchText(v);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveTypeId || !startDate || !endDate) return;
    setSubmitting(true);
    const start = startDate.toDate();
    const end = endDate.toDate();
    const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
    const selectedType = leaveTypes.find((lt) => lt.id === leaveTypeId);
    const success = await applyLeave({
      leaveTypeId,
      leaveTypeName: selectedType?.name || "",
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      days,
      reason,
    });
    if (success) {
      setLeaveTypeId("");
      setStartDate(null);
      setEndDate(null);
      setReason("");
      // close modal
      const btn = document.querySelector("#add-leave .btn-close") as HTMLButtonElement;
      if (btn) btn.click();
    }
    setSubmitting(false);
  };

  const getModalContainer = () => document.body;

  const statusBadge = (status: string) => {
    if (status === "APPLIED") return "badge-soft-info border-info text-info";
    if (status === "APPROVED") return "badge-soft-success border-success text-success";
    return "badge-soft-danger border-danger text-danger";
  };

  const data = leaves.map((l) => ({
    key: l.id,
    ...l,
    Date: `${dayjs(l.startDate).format("DD MMM YYYY")} - ${dayjs(l.endDate).format("DD MMM YYYY")}`,
    Leave_Type: l.leaveTypeName,
    Day: `${l.days} Day${l.days > 1 ? "s" : ""}`,
    Applied_On: dayjs(l.appliedOn).format("DD MMM YYYY"),
    Status: l.status.charAt(0) + l.status.slice(1).toLowerCase(),
  }));

  const columns = [
    { title: "Date", dataIndex: "Date", sorter: (a: any, b: any) => a.Date.localeCompare(b.Date) },
    { title: "Leave Type", dataIndex: "Leave_Type", sorter: (a: any, b: any) => a.Leave_Type.localeCompare(b.Leave_Type) },
    { title: "Day", dataIndex: "Day" },
    { title: "Applied On", dataIndex: "Applied_On" },
    {
      title: "Status", dataIndex: "Status",
      render: (text: string, record: any) => (
        <span className={`badge badge-sm border rounded ${statusBadge(record.status)}`}>{text}</span>
      ),
    },
    {
      title: "",
      render: (_: any, record: any) => (
        record.status === "APPLIED" ? (
          <div className="action-item">
            <Link to="#" data-bs-toggle="dropdown"><i className="ti ti-dots-vertical" /></Link>
            <ul className="dropdown-menu p-2">
              <li>
                <Link to="#" className="dropdown-item text-danger d-flex align-items-center"
                  onClick={() => deleteLeave(record.id)}>
                  <i className="ti ti-trash me-1" /> Cancel
                </Link>
              </li>
            </ul>
          </div>
        ) : null
      ),
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-bottom">
            <div className="flex-grow-1">
              <h4 className="fw-bold mb-0">Leaves</h4>
            </div>
            <div className="text-end d-flex">
              <Link to="#" className="btn btn-primary ms-2 fs-13 btn-md" data-bs-toggle="modal" data-bs-target="#add-leave">
                <i className="ti ti-plus me-1" /> Add New Leave
              </Link>
            </div>
          </div>
          <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 mb-3">
            <div className="search-set">
              <div className="d-flex align-items-center">
                <div className="table-search d-flex align-items-center mb-0 me-2">
                  <div className="search-input">
                    <SearchInput value={searchText} onChange={handleSearch} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="table-responsive">
            <Datatable columns={columns} dataSource={data} Selection={false} searchText={searchText} />
          </div>
        </div>
      </div>

      {/* Add Leave Modal */}
      <div id="add-leave" className="modal fade">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="text-dark modal-title fw-bold">Apply for Leave</h5>
              <button type="button" className="btn-close custom-btn-close" data-bs-dismiss="modal" />
            </div>
            <form onSubmit={handleApply}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Leave Type <span className="text-danger">*</span></label>
                  <select className="form-select" value={leaveTypeId} onChange={(e) => setLeaveTypeId(e.target.value)} required>
                    <option value="">-- Select Leave Type --</option>
                    {leaveTypes.filter(lt => lt.status === "Active").map((lt) => (
                      <option key={lt.id} value={lt.id}>{lt.name} ({lt.quota} days quota)</option>
                    ))}
                  </select>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">Start Date <span className="text-danger">*</span></label>
                    <DatePicker
                      className="form-control"
                      format="DD-MM-YYYY"
                      getPopupContainer={getModalContainer}
                      placeholder="Start Date"
                      value={startDate}
                      onChange={(d) => setStartDate(d)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label">End Date <span className="text-danger">*</span></label>
                    <DatePicker
                      className="form-control"
                      format="DD-MM-YYYY"
                      getPopupContainer={getModalContainer}
                      placeholder="End Date"
                      value={endDate}
                      onChange={(d) => setEndDate(d)}
                      disabledDate={(cur) => startDate && cur.isBefore(startDate)}
                    />
                  </div>
                </div>
                <div className="mb-0">
                  <label className="form-label">Reason</label>
                  <textarea className="form-control" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional reason..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-white border" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Applying..." : "Apply Leave"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default DoctorsLeaves;
