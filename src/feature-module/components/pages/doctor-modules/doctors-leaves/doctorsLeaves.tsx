import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import Datatable from "../../../../../core/common/dataTable";
import { useLeaves } from "../../../../../core/hooks/useLeaves";
import { useLeaveTypes } from "../../../../../core/hooks/useLeaveTypes";
import dayjs from "dayjs";
import { DatePicker } from "antd";

const DoctorsLeaves = () => {
  const { leaves, applyLeave, withdrawLeave, deleteLeave, getWorkingDays } = useLeaves();
  const { leaveTypes } = useLeaveTypes();

  // Add leave form state
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState<any>(null);
  const [endDate, setEndDate] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [workingDays, setWorkingDays] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDate, setFilterDate] = useState<dayjs.Dayjs | null>(null);


  useEffect(() => {
    const updateWorkingDays = async () => {
      if (startDate && endDate) {
        const count = await getWorkingDays(startDate.toISOString(), endDate.toISOString());
        setWorkingDays(count);
      } else {
        setWorkingDays(0);
      }
    };
    updateWorkingDays();
  }, [startDate, endDate]);

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
      workingDays,
      reason,
    });
    if (success) {
      setLeaveTypeId("");
      setStartDate(null);
      setEndDate(null);
      setReason("");
      setWorkingDays(0);
      const btn = document.querySelector("#add-leave .btn-close") as HTMLButtonElement;
      if (btn) btn.click();
    }
    setSubmitting(false);
  };

  const getModalContainer = () => document.body;

  const statusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === "APPLIED") return "badge-soft-info border-info";
    if (s === "APPROVED") return "badge-soft-success border-success";
    if (s === "REJECTED") return "badge-soft-danger border-danger";
    if (s === "COMPLETED") return "badge-soft-secondary border-secondary";
    if (s === "WITHDRAWN") return "badge-soft-warning border-warning";
    if (s === "CANCELLED") return "badge-soft-dark border-dark";
    return "badge-soft-light border-light";
  };

  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) => {
      const matchStatus = filterStatus === "All" || l.status.toUpperCase() === filterStatus.toUpperCase();
      const matchDate =
        !filterDate ||
        dayjs(l.startDate).isSame(filterDate, 'day') ||
        dayjs(l.endDate).isSame(filterDate, 'day') ||
        (filterDate.isAfter(dayjs(l.startDate)) && filterDate.isBefore(dayjs(l.endDate)));
      return matchStatus && matchDate;
    });
  }, [leaves, filterStatus, filterDate]);

  const data = filteredLeaves.map((l, index) => ({
    key: l.id,
    ...l,
    sr_no: index + 1,
    Date: `${dayjs(l.startDate).format("DD MMM YYYY")} - ${dayjs(l.endDate).format("DD MMM YYYY")}`,
    Leave_Type: l.leaveTypeName,
    Day: l.workingDays === l.days ? `${l.days} Day${l.days > 1 ? "s" : ""}` : `${l.workingDays} / ${l.days} Days`,
    Applied_On: dayjs(l.appliedOn).format("DD MMM YYYY"),
    Status: l.status.charAt(0) + l.status.slice(1).toLowerCase(),
  }));

  const columns = [
    {
      title: "S.No",
      dataIndex: "sr_no",
      render: (text: number) => <span className="text-dark fw-medium">{text}</span>,
      sorter: (a: any, b: any) => a.sr_no - b.sr_no,
      width: 70,
    },
    { title: "Date", dataIndex: "Date", render: (text: string) => <span className="text-dark">{text}</span>, sorter: (a: any, b: any) => a.Date.localeCompare(b.Date) },
    { title: "Leave Type", dataIndex: "Leave_Type", render: (text: string) => <span className="text-dark">{text}</span>, sorter: (a: any, b: any) => a.Leave_Type.localeCompare(b.Leave_Type) },
    { title: "Days", dataIndex: "Day", render: (text: string) => <span className="text-dark">{text}</span> },
    { title: "Applied On", dataIndex: "Applied_On", render: (text: string) => <span className="text-dark">{text}</span> },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string, record: any) => (
        <span className={`badge border fw-medium px-2 py-1 fs-12 ${statusBadge(record.status)}`}>
          {text}
        </span>
      ),
    },
    {
      title: "Action",
      align: "center" as const,
      render: (_: any, record: any) => (
        <div className="d-flex align-items-center justify-content-center gap-2">
          {record.status === "APPLIED" && (
            <>
              <Link
                to="#"
                className="bg-transparent border-0 text-primary p-1"
                title="Edit"
                data-bs-toggle="modal"
                data-bs-target="#add-leave"
                onClick={() => {
                  setLeaveTypeId(record.leaveTypeId);
                  setStartDate(dayjs(record.startDate));
                  setEndDate(dayjs(record.endDate));
                  setReason(record.reason || "");
                }}
              >
                <i className="ti ti-edit fs-18" />
              </Link>
              <Link
                to="#"
                className="bg-transparent border-0 text-danger p-1"
                title="Delete"
                onClick={() => { if (window.confirm("Are you sure you want to delete this leave?")) deleteLeave(record.id) }}
              >
                <i className="ti ti-trash fs-18" />
              </Link>
            </>
          )}
        </div>
      ),
      width: 100,
    },
  ];

  return (
    <>
      <div className="page-wrapper" style={{ background: '#f4f7fe', minHeight: '100vh' }}>
        <div className="content pb-0">
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-bottom">
            <div className="flex-grow-1">
              <h4 className="fw-bold mb-0 text-dark d-flex align-items-center">
                Leaves
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total : {filteredLeaves.length}
                </span>
              </h4>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              {/* Date Filter */}
              <DatePicker
                placeholder="Filter by Date"
                className="form-control"
                style={{ width: "150px", height: "40px" }}
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
                  className="btn btn-white dropdown-toggle border d-flex align-items-center justify-content-between text-nowrap"
                  style={{ minWidth: "140px", height: "40px" }}
                  data-bs-toggle="dropdown"
                >
                  <span><span className="text-muted small">Status:</span> {filterStatus}</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1" onClick={(e) => { e.preventDefault(); setFilterStatus("All"); }}>All</Link></li>
                  {["Applied", "Approved", "Rejected", "Completed", "Withdrawn", "Cancelled"].map(s => (
                    <li key={s}><Link to="#" className="dropdown-item rounded-1" onClick={(e) => { e.preventDefault(); setFilterStatus(s); }}>{s}</Link></li>
                  ))}
                </ul>
              </div>
              {/* Add Leave Button */}
              <Link to="#" className="btn btn-primary d-flex align-items-center gap-2" style={{ height: "40px" }} data-bs-toggle="modal" data-bs-target="#add-leave">
                <i className="ti ti-plus fs-18" /> Add New Leave
              </Link>
            </div>
          </div>

          {/* Admin Style Clone Table */}
          <div className="card border-0 shadow-none mb-0 bg-transparent">
            <div className="card-body p-0">
              <style>{`
                .custom-table .ant-table { background: #ffffff; border: 1px solid #e2e8f0 !important; border-radius: 8px; overflow: hidden; }
                .custom-table .ant-table-container { border: 0 !important; }
                .custom-table .ant-table-thead > tr > th { 
                  background: #f8fafc !important; 
                  color: #475569 !important; 
                  font-weight: 700 !important; 
                  text-transform: uppercase; 
                  font-size: 11px; 
                  letter-spacing: 0.5px;
                  border-bottom: 2px solid #e2e8f0 !important;
                  padding: 12px 16px !important;
                }
                .custom-table .ant-table-tbody > tr > td { 
                  padding: 12px 16px !important; 
                  border-bottom: 1px solid #f1f5f9 !important;
                }
                .custom-table .ant-table-tbody > tr:hover > td { 
                  background: #f8fafc !important; 
                }
                .custom-table .ant-pagination { 
                  margin: 0 !important; 
                  padding: 16px !important;
                  border-top: 1px solid #f1f5f9;
                }
                /* Seal the bottom */
                .content { padding: 20px !important; background: transparent !important; }
                .page-wrapper { background: #f4f7fe !important; min-height: 100vh; }
              `}</style>
              <div className="table-responsive custom-table">
                <Datatable
                  columns={columns}
                  dataSource={data}
                  Selection={true}
                  searchText=""
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Leave Modal */}
      <div id="add-leave" className="modal fade">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-primary px-4">
              <h5 className="text-white modal-title fw-bold">Apply for Leave</h5>
              <button type="button" className="btn-close btn-close-white opacity-100" data-bs-dismiss="modal" />
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
                <div className="mb-3">
                  <div className="p-2 bg-soft-primary rounded border border-primary border-dashed d-flex justify-content-between align-items-center">
                    <span className="fs-13 fw-semibold">Estimated Working Days:</span>
                    <span className="badge bg-primary fs-14">{workingDays} Days</span>
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
