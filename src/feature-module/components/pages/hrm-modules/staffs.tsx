import { useMemo, useState } from "react";
import { Link } from "react-router";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import SearchInput from "../../../../core/common/dataTable/dataTableSearch";
import Datatable from "../../../../core/common/dataTable";
import StaffsModal from "./modal/staffsModal";
import { useClinicStaff } from "../../../../core/hooks/useClinicStaff";
import type { ClinicStaff } from "../../../../core/types/clinicStaff";
import { staffToTableRow } from "../../../../core/utils/staffForm";

const StaffsList = () => {
  const { staffs, loading, error, refetch, reload } = useClinicStaff();
  const [searchText, setSearchText] = useState("");
  const [selected, setSelected] = useState<ClinicStaff | null>(null);

  const tableData = useMemo(
    () => staffs.map((s, i) => staffToTableRow(s, i)),
    [staffs]
  );

  const openStaff = (staff: ClinicStaff) => setSelected(staff);

  const columns = [
    {
      title: "Staff",
      dataIndex: "Staff",
      render: (text: string, record: (typeof tableData)[0]) => (
        <div className="d-flex align-items-center">
          <button
            type="button"
            className="avatar me-2 border-0 bg-transparent p-0"
            data-bs-toggle="modal"
            data-bs-target="#view_staff"
            onClick={() => openStaff(record._raw)}
          >
            <ImageWithBasePath
              src={record.Image}
              alt="Staff"
              className="rounded-circle"
            />
          </button>
          <div>
            <h6 className="mb-1 fs-14 fw-semibold">
              <button
                type="button"
                className="btn btn-link p-0 text-dark fw-semibold fs-14"
                data-bs-toggle="modal"
                data-bs-target="#view_staff"
                onClick={() => openStaff(record._raw)}
              >
                {text}
              </button>
            </h6>
          </div>
        </div>
      ),
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Staff.localeCompare(b.Staff),
    },
    {
      title: "Designation",
      dataIndex: "Designation",
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Designation.localeCompare(b.Designation),
    },
    {
      title: "Role",
      dataIndex: "Role",
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Role.localeCompare(b.Role),
    },
    {
      title: "Phone",
      dataIndex: "Phone",
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Phone.localeCompare(b.Phone),
    },
    {
      title: "Email",
      dataIndex: "Email",
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Email.localeCompare(b.Email),
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => (
        <span
          className={`badge border ${
            text === "Available"
              ? "badge-soft-success border-success"
              : "badge-soft-danger border-danger"
          }`}
        >
          {text}
        </span>
      ),
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Status.localeCompare(b.Status),
    },
    {
      title: "",
      render: (_: unknown, record: (typeof tableData)[0]) => (
        <div className="action-item">
          <button
            type="button"
            className="btn btn-link p-0 text-dark"
            data-bs-toggle="dropdown"
            aria-label="Actions"
          >
            <i className="ti ti-dots-vertical" />
          </button>
          <ul className="dropdown-menu p-2">
            <li>
              <button
                type="button"
                className="dropdown-item d-flex align-items-center"
                data-bs-toggle="modal"
                data-bs-target="#view_staff"
                onClick={() => openStaff(record._raw)}
              >
                View Details
              </button>
            </li>
            <li>
              <button
                type="button"
                className="dropdown-item d-flex align-items-center"
                data-bs-toggle="modal"
                data-bs-target="#edit_staff"
                onClick={() => openStaff(record._raw)}
              >
                Edit
              </button>
            </li>
            <li>
              <button
                type="button"
                className="dropdown-item d-flex align-items-center"
                data-bs-toggle="modal"
                data-bs-target="#delete_staff"
                onClick={() => openStaff(record._raw)}
              >
                Delete
              </button>
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
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3 pb-3 border-bottom">
            <div className="flex-grow-1">
              <h4 className="fw-bold mb-0">
                Staff
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total Staffs : {loading ? "…" : staffs.length}
                </span>
              </h4>
            </div>
            <div className="text-end d-flex">
              <div className="dropdown me-1">
                <button
                  type="button"
                  className="btn btn-md fs-14 fw-normal border bg-white rounded text-dark d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Export
                  <i className="ti ti-chevron-down ms-2" />
                </button>
                <ul className="dropdown-menu p-2">
                  <li>
                    <button type="button" className="dropdown-item">
                      Download as PDF
                    </button>
                  </li>
                  <li>
                    <button type="button" className="dropdown-item">
                      Download as Excel
                    </button>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                className="btn btn-primary ms-2 fs-13 btn-md"
                data-bs-toggle="modal"
                data-bs-target="#add_staff"
                onClick={() => setSelected(null)}
              >
                <i className="ti ti-plus me-1" />
                Add Staff
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger d-flex align-items-center justify-content-between mb-3">
              <span>{error}</span>
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={reload}>
                Retry
              </button>
            </div>
          )}

          <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <div className="search-set mb-3">
              <div className="table-search d-flex align-items-center mb-0">
                <div className="search-input">
                  <SearchInput value={searchText} onChange={setSearchText} />
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status" />
              <p className="text-muted mt-2 mb-0">Loading staff…</p>
            </div>
          ) : staffs.length === 0 && !error ? (
            <div className="text-center py-5 border rounded bg-white">
              <i className="ti ti-users fs-1 text-muted d-block mb-2" />
              <h6 className="fw-bold">No staff yet</h6>
              <p className="text-muted mb-3">Add your first staff member.</p>
              <button
                type="button"
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#add_staff"
              >
                <i className="ti ti-plus me-1" />
                Add Staff
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <Datatable
                columns={columns}
                dataSource={tableData}
                Selection={false}
                searchText={searchText}
              />
            </div>
          )}
        </div>

        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025 ©
            <Link to="#" className="link-primary">
              Preclinic
            </Link>
            , All Rights Reserved
          </p>
        </div>
      </div>

      <StaffsModal selected={selected} onSelect={setSelected} onSaved={refetch} />
    </>
  );
};

export default StaffsList;
