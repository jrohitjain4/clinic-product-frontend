import { useState } from "react";
import { Link } from "react-router";
import Datatable from "../../../../../core/common/dataTable";
import LeaveTypeModal from "./modal/leaveTypeModal";
import { useLeaveTypes } from "../../../../../core/hooks/useLeaveTypes";
import type { LeaveType as LeaveTypeModel } from "../../../../../core/hooks/useLeaveTypes";
import dayjs from "dayjs";

const LeaveType = () => {
  const { leaveTypes, loading, createLeaveType, updateLeaveType, deleteLeaveType } = useLeaveTypes();
  const [currentRecord, setCurrentRecord] = useState<LeaveTypeModel | null>(null);

  const data = leaveTypes.map((item) => ({
    key: item.id,
    id: item.id,
    LeaveType: item.name,
    LeaveQuota: item.quota.toString(),
    CreatedOn: dayjs(item.createdAt).format("DD MMM YYYY"),
    Status: item.status,
  }));

  const columns = [
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
      title: "",
      render: (text: any, record: any) => (
        <div className="action-item p-2">
          <Link
            to="#"
            data-bs-toggle="dropdown"
            className="btn p-1 btn-white border"
          >
            <i className="ti ti-dots-vertical" />
          </Link>
          <ul className="dropdown-menu p-2">
            <li>
              <Link
                to="#"
                className="dropdown-item d-flex align-items-center"
                data-bs-toggle="modal"
                data-bs-target="#edit_leave_type"
                onClick={() => setCurrentRecord(leaveTypes.find(l => l.id === record.id) || null)}
              >
                Edit
              </Link>
            </li>
            <li>
              <Link
                to="#"
                className="dropdown-item d-flex align-items-center"
                data-bs-toggle="modal"
                data-bs-target="#delete_leave_type"
                onClick={() => setCurrentRecord(leaveTypes.find(l => l.id === record.id) || null)}
              >
                Delete
              </Link>
            </li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content" id="profilePage">
          <div className="mb-3 border-bottom pb-3">
            <div className="d-flex align-items-center justify-content-between">
              <h4 className="fw-bold mb-0">Leave Type</h4>
              <Link
                to="#"
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#add_leave_type"
                onClick={() => setCurrentRecord(null)}
              >
                <i className="ti ti-plus me-1" />
                New Leave Type
              </Link>
            </div>
          </div>
          <div className="table-responsive border">
            <Datatable
              columns={columns}
              dataSource={data}
              Selection={false}
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
