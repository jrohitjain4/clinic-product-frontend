import { useState } from "react";
import { Link } from "react-router";
import Datatable from "../../../../../core/common/dataTable";
import LeaveTypeModal from "./modal/leaveTypeModal";
import { useLeaveTypes } from "../../../../../core/hooks/useLeaveTypes";
import type { LeaveType as LeaveTypeModel } from "../../../../../core/hooks/useLeaveTypes";
import dayjs from "dayjs";

const LeaveType = () => {
  const { leaveTypes, createLeaveType, updateLeaveType, deleteLeaveType } = useLeaveTypes();
  const [currentRecord, setCurrentRecord] = useState<LeaveTypeModel | null>(null);

  const data = leaveTypes.map((item, index) => ({
    key: item.id,
    id: item.id,
    S_No: index + 1,
    LeaveType: item.name,
    LeaveQuota: item.quota.toString(),
    CreatedOn: dayjs(item.createdAt).format("DD MMM YYYY"),
    Status: item.status,
  }));

  const columns = [
    {
      title: "S.No",
      dataIndex: "S_No",
      sorter: (a: any, b: any) => a.S_No - b.S_No,
    },
    {
      title: "Leave Type",
      dataIndex: "LeaveType",
      sorter: (a: any, b: any) => a.LeaveType.length - b.LeaveType.length,
    },
    {
      title: "Leave Quota",
      dataIndex: "LeaveQuota",
      sorter: (a: any, b: any) => parseInt(a.LeaveQuota) - parseInt(b.LeaveQuota),
    },
    {
      title: "Created On",
      dataIndex: "CreatedOn",
      sorter: (a: any, b: any) => new Date(a.CreatedOn).getTime() - new Date(b.CreatedOn).getTime(),
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
      sorter: (a: any, b: any) => a.Status.length - b.Status.length,
    },
    {
      title: "Action",
      render: (_text: any, record: any) => (
        <div className="d-flex align-items-center gap-2">
          <Link
            to="#"
            className="avatar avatar-sm border text-primary rounded-circle d-flex align-items-center justify-content-center bg-transparent"
            data-bs-toggle="modal"
            data-bs-target="#edit_leave_type"
            onClick={() => setCurrentRecord(leaveTypes.find(l => l.id === record.id) || null)}
          >
            <i className="ti ti-edit fs-16" />
          </Link>
          <Link
            to="#"
            className="avatar avatar-sm border text-danger rounded-circle d-flex align-items-center justify-content-center bg-transparent"
            data-bs-toggle="modal"
            data-bs-target="#delete_leave_type"
            onClick={() => setCurrentRecord(leaveTypes.find(l => l.id === record.id) || null)}
          >
            <i className="ti ti-trash fs-16" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content" id="profilePage">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3 pb-3 border-bottom">
            <h4 className="fw-bold mb-0 d-flex align-items-center">
              Leave Type
              <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                Total: {leaveTypes.length}
              </span>
            </h4>
            <div className="d-flex align-items-center gap-2">
              <div className="dropdown">
                <Link to="#" className="dropdown-toggle btn bg-white btn-md d-inline-flex align-items-center fw-normal rounded border text-dark px-2 py-1 fs-14" data-bs-toggle="dropdown">
                  <span className="me-1"> Date : </span> Select
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1">All</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Today</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">This Week</Link></li>
                </ul>
              </div>

              <div className="dropdown">
                <Link to="#" className="dropdown-toggle btn bg-white btn-md d-inline-flex align-items-center fw-normal rounded border text-dark px-2 py-1 fs-14" data-bs-toggle="dropdown">
                  <span className="me-1"> Status : </span> All
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1">All</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Active</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Inactive</Link></li>
                </ul>
              </div>

              <div className="dropdown me-2">
                <Link to="#" className="dropdown-toggle btn bg-white btn-md d-inline-flex align-items-center fw-normal rounded border text-dark px-2 py-1 fs-14" data-bs-toggle="dropdown">
                  <span className="me-1"> Sort By : </span> Recent
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1">Recent</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Oldest</Link></li>
                </ul>
              </div>

              <Link
                to="#"
                className="btn btn-primary btn-md"
                data-bs-toggle="modal"
                data-bs-target="#add_leave_type"
                onClick={() => setCurrentRecord(null)}
              >
                New Leave Type <i className="ti ti-plus ms-1" />
              </Link>
            </div>
          </div>
          <div className="table-responsive border">
            <Datatable
              columns={columns}
              dataSource={data}
              Selection={true}
              searchText={""}
            />
          </div>
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
