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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const tableData = useMemo(
    () => staffs.map((s, i) => staffToTableRow(s, i)),
    [staffs]
  );

  const openStaff = (staff: ClinicStaff) => setSelected(staff);

  const columns = [
    {
      title: "S.No",
      dataIndex: "S_No",
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) => a.S_No - b.S_No,
    },
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
          className={`badge border ${text === "Available"
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
      title: "Action",
      render: (_: unknown, record: (typeof tableData)[0]) => (
        <div className="text-end d-flex align-items-center justify-content-end gap-2">
          <button
            type="button"
            className="bg-transparent border-0 text-primary p-1"
            data-bs-toggle="modal"
            data-bs-target="#edit_staff"
            onClick={() => openStaff(record._raw)}
          >
            <i className="fa fa-edit fs-16" />
          </button>
          <button
            type="button"
            className="bg-transparent border-0 text-danger p-1"
            data-bs-toggle="modal"
            data-bs-target="#delete_staff"
            onClick={() => openStaff(record._raw)}
          >
            <i className="fa fa-trash-alt fs-16" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content" id="profilePage">
          <div className="page-header d-flex align-items-sm-center flex-sm-row flex-column gap-2 border-bottom pb-3 mb-3">
            <div className="flex-grow-1">
              <h4 className="page-title fw-bold mb-0 d-flex align-items-center">
                Staff
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total Staffs : {loading ? "" : staffs.length}
                </span>
              </h4>
            </div>
            <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between" style={{ width: '130px', minHeight: '38px' }} data-bs-toggle="dropdown">
                  <span><span className="text-muted">Date:</span> Select</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1">All</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Today</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">This Week</Link></li>
                </ul>
              </div>

              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between" style={{ width: '150px', minHeight: '38px' }} data-bs-toggle="dropdown">
                  <span><span className="text-muted">Designation:</span> All</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1">All</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">dfghj</Link></li>
                </ul>
              </div>

              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between" style={{ width: '120px', minHeight: '38px' }} data-bs-toggle="dropdown">
                  <span><span className="text-muted">Role:</span> All</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1">All</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Front Desk</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Nurse</Link></li>
                </ul>
              </div>

              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between" style={{ width: '130px', minHeight: '38px' }} data-bs-toggle="dropdown">
                  <span><span className="text-muted">Status:</span> All</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1">All</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Available</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Unavailable</Link></li>
                </ul>
              </div>

              <div className="dropdown">
                <button
                  type="button"
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between" style={{ width: '100px', minHeight: '38px', background: '#fff' }}
                  data-bs-toggle="dropdown"
                >
                  <span>Export</span>
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
                className="btn btn-primary d-flex align-items-center justify-content-center"
                style={{ minHeight: '38px', whiteSpace: 'nowrap' }}
                data-bs-toggle="modal"
                data-bs-target="#add_staff"
                onClick={() => setSelected(null)}
              >
                Add Staff <i className="fa fa-plus ms-2" />
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger d-flex align-items-center justify-content-between mb-3">
              <span>{error}</span>
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => reload()}>
                Retry
              </button>
            </div>
          )}

          <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <div className="search-set mb-3">

            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status" />
              <p className="text-muted mt-2 mb-0">Loading staff</p>
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
                Add Staff <i className="ti ti-plus ms-2" /></button>
            </div>
          ) : (
            <div className="table-responsive">
              <Datatable
                columns={columns}
                dataSource={tableData}
                Selection={true}
                searchText={searchText}
                onSelectionChange={(keys) => setSelectedIds(keys as string[])}
              />
            </div>
          )}
          
          {selectedIds.length > 0 && (
            <div className="d-flex justify-content-center mt-auto pt-4 pb-4">
              <button
                className="btn btn-danger d-flex align-items-center gap-2 px-4 py-2 shadow"
                data-bs-toggle="modal"
                data-bs-target="#delete_staff" // Use existing delete modal or global modal
                style={{ borderRadius: '8px', minHeight: '42px', fontWeight: 'bold' }}
              >
                <i className="ti ti-trash fs-18"></i>
                Delete Selected ({selectedIds.length})
              </button>
            </div>
          )}
        </div>

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

      <StaffsModal selected={selected} onSelect={setSelected} onSaved={refetch} />
    </>
  );
};

export default StaffsList;
