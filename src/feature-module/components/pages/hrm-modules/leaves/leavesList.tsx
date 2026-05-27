import { useState } from "react";
import { Link } from "react-router";
import SearchInput from "../../../../../core/common/dataTable/dataTableSearch";
import Datatable from "../../../../../core/common/dataTable";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { useLeaves } from "../../../../../core/hooks/useLeaves";
import dayjs from "dayjs";

const LeavesList = () => {
  const { leaves, loading, updateStatus } = useLeaves();
  const [searchText, setSearchText] = useState("");

  const handleSearch = (v: string) => setSearchText(v);

  const pendingCount = leaves.filter(l => l.status === "APPLIED").length;
  const approvedCount = leaves.filter(l => l.status === "APPROVED").length;
  const rejectedCount = leaves.filter(l => l.status === "REJECTED").length;

  const statusBadge = (status: string) => {
    if (status === "APPLIED") return "badge-soft-info border-info";
    if (status === "APPROVED") return "badge-soft-success border-success";
    return "badge-soft-danger border-danger";
  };

  const data = leaves.map((l, i) => ({
    key: l.id,
    ...l,
    ID: `#EMP0${String(i + 1).padStart(2, "0")}`,
    Employee: l.employeeName,
    Image: l.profileImage,
    LeaveType: l.leaveTypeName,
    Date: `${dayjs(l.startDate).format("DD MMM YYYY")} - ${dayjs(l.endDate).format("DD MMM YYYY")}`,
    Day: `${l.days} Day${l.days > 1 ? "s" : ""}`,
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
      render: (_: any, record: any) => (
        record.rawStatus === "APPLIED" ? (
          <div className="d-flex gap-1">
            <button
              className="btn btn-sm btn-soft-success"
              onClick={() => updateStatus(record.id, "APPROVED")}
              title="Approve"
            >
              <i className="ti ti-check" />
            </button>
            <button
              className="btn btn-sm btn-soft-danger"
              onClick={() => updateStatus(record.id, "REJECTED")}
              title="Reject"
            >
              <i className="ti ti-x" />
            </button>
          </div>
        ) : (
          <span className="text-muted fs-12">—</span>
        )
      ),
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3 pb-3 border-bottom">
            <div className="flex-grow-1">
              <h4 className="fw-bold mb-0">Admin Leaves</h4>
            </div>
          </div>

          {/* Stats row */}
          <div className="row mb-3">
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
              <div className="search-input">
                <SearchInput value={searchText} onChange={handleSearch} />
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <Datatable columns={columns} dataSource={data} Selection={false} searchText={searchText} />
          </div>
        </div>
      </div>
    </>
  );
};

export default LeavesList;
