import { useMemo, useState } from "react";
import { Link } from "react-router";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import Datatable from "../../../../core/common/dataTable";
import StaffsModal from "./modal/staffsModal";
import { DatePicker, Modal } from "antd";
import type { Dayjs } from "dayjs";
import { useClinicStaff } from "../../../../core/hooks/useClinicStaff";
import type { ClinicStaff } from "../../../../core/types/clinicStaff";
import { staffToTableRow } from "../../../../core/utils/staffForm";

const StaffsList = () => {
  const { staffs, loading, error, refetch, reload } = useClinicStaff();
  const [selected, setSelected] = useState<ClinicStaff | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewStaff, setViewStaff] = useState<any>(null);

  const [filterDesignation, setFilterDesignation] = useState("All");
  const [filterRole, setFilterRole] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const tableData = useMemo(
    () => staffs.map((s, i) => staffToTableRow(s, i)),
    [staffs]
  );

  const designations: string[] = useMemo(() => {
    const list = staffs.map(v => v.designation?.name).filter((v): v is string => !!v);
    return ["All", ...Array.from(new Set(list))];
  }, [staffs]);

  const roles: string[] = useMemo(() => {
    const list = staffs.map(v => v.role).filter((v): v is string => !!v);
    return ["All", ...Array.from(new Set(list))];
  }, [staffs]);

  const filteredData = useMemo(() => {
    return tableData.filter((item) => {
      const matchDesignation = filterDesignation === "All" || item.Designation === filterDesignation;
      const matchRole = filterRole === "All" || item.Role === filterRole;
      const matchStatus = filterStatus === "All" || item.Status === filterStatus;

      // Note: Add date filtering if item has a Created Date field
      // const matchDate = !filterDate || dayjs(item.CreatedDate).isSame(filterDate, 'day');

      return matchDesignation && matchRole && matchStatus;
    });
  }, [tableData, filterDesignation, filterRole, filterStatus]);

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
        <div className="d-flex align-items-center justify-content-start gap-2">
          {/* View Icon */}
          <button
            type="button"
            className="bg-transparent border-0 text-info p-1"
            title="View Details"
            data-bs-toggle="modal"
            data-bs-target="#view_staff"
            onClick={() => setViewStaff(record._raw)}
          >
            <i className="fa fa-eye fs-16"></i>
          </button>

          <button
            type="button"
            className="bg-transparent border-0 text-primary p-1"
            title="Edit"
            data-bs-toggle="modal"
            data-bs-target="#edit_staff"
            onClick={() => openStaff(record._raw)}
          >
            <i className="fa fa-edit fs-16" />
          </button>
          <button
            type="button"
            className="bg-transparent border-0 text-danger p-1"
            title="Delete"
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
                  Total Staffs : {loading ? "" : filteredData.length}
                </span>
              </h4>
            </div>
            <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">

              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap" style={{ width: '150px', minHeight: '38px' }} data-bs-toggle="dropdown">
                  <span className="text-truncate"><span className="text-muted">Designation:</span> {filterDesignation}</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  {designations.map(d => (
                    <li key={d}><Link to="#" className="dropdown-item rounded-1" onClick={(e) => { e.preventDefault(); setFilterDesignation(d); }}>{d}</Link></li>
                  ))}
                </ul>
              </div>

              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap" style={{ width: '120px', minHeight: '38px' }} data-bs-toggle="dropdown">
                  <span className="text-truncate"><span className="text-muted">Role:</span> {filterRole}</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  {roles.map(r => (
                    <li key={r}><Link to="#" className="dropdown-item rounded-1" onClick={(e) => { e.preventDefault(); setFilterRole(r); }}>{r}</Link></li>
                  ))}
                </ul>
              </div>

              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap" style={{ width: '130px', minHeight: '38px' }} data-bs-toggle="dropdown">
                  <span className="text-truncate"><span className="text-muted">Status:</span> {filterStatus}</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  {["All", "Available", "Unavailable"].map(s => (
                    <li key={s}><Link to="#" className="dropdown-item rounded-1" onClick={(e) => { e.preventDefault(); setFilterStatus(s); }}>{s}</Link></li>
                  ))}
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
                  <li><button type="button" className="dropdown-item">Download as PDF</button></li>
                  <li><button type="button" className="dropdown-item">Download as Excel</button></li>
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
                Add Staff <i className="ti ti-plus ms-2" />
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <Datatable
                columns={columns}
                dataSource={filteredData}
                Selection={true}
                searchText=""
                onSelectionChange={(keys) => setSelectedIds(keys as string[])}
              />
            </div>
          )}

          {selectedIds.length > 0 && (
            <div className="d-flex justify-content-center mt-auto pt-4 pb-4">
              <button
                className="btn btn-danger d-flex align-items-center gap-2 px-4 py-2 shadow"
                data-bs-toggle="modal"
                data-bs-target="#delete_staff"
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

      {/* ===== VIEW STAFF MODAL ===== */}
      <div id="view_staff" className="modal fade" role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="modal-header bg-info text-white">
              <h5 className="modal-title fw-bold">View Staff Profile</h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" onClick={() => setViewStaff(null)}></button>
            </div>
            <div className="modal-body">
              {viewStaff && (
                <div className="row g-3">
                  <div className="col-md-12 text-center mb-3">
                    <div className="avatar avatar-xxl bg-light p-1 rounded-circle shadow-sm mx-auto">
                      <ImageWithBasePath
                        src={viewStaff.profileImage?.startsWith('/') ? viewStaff.profileImage : `assets/img/users/${viewStaff.profileImage || 'avatar-21.jpg'}`}
                        alt={viewStaff.fullName}
                        className="rounded-circle"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-muted">Full Name</label>
                    <input type="text" className="form-control bg-light" value={viewStaff.fullName || ""} readOnly />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-muted">Role</label>
                    <input type="text" className="form-control bg-light" value={viewStaff.role || ""} readOnly />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-muted">Email</label>
                    <input type="text" className="form-control bg-light" value={viewStaff.email || ""} readOnly />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-muted">Phone</label>
                    <input type="text" className="form-control bg-light" value={viewStaff.phone || ""} readOnly />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-uppercase text-muted">Designation</label>
                    <input type="text" className="form-control bg-light" value={viewStaff.designationName || "--"} readOnly />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-uppercase text-muted">Gender</label>
                    <input type="text" className="form-control bg-light" value={viewStaff.gender || ""} readOnly />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-uppercase text-muted">Blood Group</label>
                    <input type="text" className="form-control bg-light text-danger fw-bold" value={viewStaff.bloodGroup || "--"} readOnly />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-muted">Date of Birth</label>
                    <input type="text" className="form-control bg-light" value={viewStaff.dob ? new Date(viewStaff.dob).toLocaleDateString("en-GB") : "--"} readOnly />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-muted">Joined Date</label>
                    <input type="text" className="form-control bg-light" value={new Date(viewStaff.createdAt).toLocaleDateString("en-GB")} readOnly />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label fw-bold small text-uppercase text-muted">Address</label>
                    <textarea className="form-control bg-light" rows={2} value={`${viewStaff.address1 || ""} ${viewStaff.address2 || ""} ${viewStaff.city || ""}, ${viewStaff.state || ""} - ${viewStaff.pincode || ""}`} readOnly />
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer border-top pt-3">
              <button type="button" className="btn btn-primary px-5" data-bs-dismiss="modal" onClick={() => setViewStaff(null)} style={{ borderRadius: '6px' }}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StaffsList;
