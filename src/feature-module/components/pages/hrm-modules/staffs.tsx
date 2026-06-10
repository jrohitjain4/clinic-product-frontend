import { useMemo, useState } from "react";
import dayjs from "dayjs";
import EmptyState from "../../../../core/common/emptyState";
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
  const [filterDatePreset, setFilterDatePreset] = useState("All");
  const [customRange, setCustomRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);

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

      let matchDate = true;
      const itemDate = dayjs(item._raw.createdAt);

      if (filterDatePreset === "Today") {
        matchDate = itemDate.isSame(dayjs(), "day");
      } else if (filterDatePreset === "Tomorrow") {
        matchDate = itemDate.isSame(dayjs().add(1, "day"), "day");
      } else if (filterDatePreset === "7 Days") {
        matchDate = itemDate.isAfter(dayjs().subtract(7, "days")) && itemDate.isBefore(dayjs().add(1, "day"), "day");
      } else if (filterDatePreset === "Custom") {
        if (customRange[0] && customRange[1]) {
          matchDate = itemDate.isAfter(customRange[0].startOf("day")) && itemDate.isBefore(customRange[1].endOf("day"));
        }
      }

      return matchDesignation && matchRole && matchStatus && matchDate;
    });
  }, [tableData, filterDesignation, filterRole, filterStatus, filterDatePreset, customRange]);

  const clearFilters = () => {
    setFilterDesignation("All");
    setFilterRole("All");
    setFilterStatus("All");
    setFilterDatePreset("All");
    setCustomRange([null, null]);
  };

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
      align: "center",
      render: (_: unknown, record: (typeof tableData)[0]) => (
        <div className="d-flex align-items-center justify-content-center gap-2">
          {/* View Icon */}
          <button
            type="button"
            className="bg-transparent border-0 text-info p-1"
            title="View Details"
            data-bs-toggle="modal"
            data-bs-target="#view_staff"
            onClick={() => setViewStaff(record._raw)}
          >
            <i className="ti ti-eye fs-18"></i>
          </button>

          <button
            type="button"
            className="bg-transparent border-0 text-primary p-1"
            title="Edit"
            data-bs-toggle="modal"
            data-bs-target="#edit_staff"
            onClick={() => openStaff(record._raw)}
          >
            <i className="ti ti-edit fs-18" />
          </button>
          <button
            type="button"
            className="bg-transparent border-0 text-danger p-1"
            title="Delete"
            data-bs-toggle="modal"
            data-bs-target="#delete_staff"
            onClick={() => openStaff(record._raw)}
          >
            <i className="ti ti-trash fs-18" />
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
              {/* Clear Filter Button - Only show when any filter is active */}
              {(filterDesignation !== "All" || filterRole !== "All" || filterStatus !== "All" || filterDatePreset !== "All") && (
                <button
                  type="button"
                  className="btn btn-white d-flex align-items-center gap-1 text-danger border"
                  onClick={clearFilters}
                  style={{
                    minHeight: "38px",
                    fontWeight: "700",
                    fontSize: "13px",
                    borderRadius: "6px"
                  }}
                >
                  <i className="ti ti-rotate"></i> Clear All
                </button>
              )}

              {/* Advanced Date Filter */}
              <div className="dropdown">
                <Link
                  to="#"
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap"
                  style={{ minWidth: "160px", minHeight: "38px" }}
                  data-bs-toggle="dropdown"
                >
                  <span className="text-truncate">
                    <span className="text-muted"><i className="ti ti-calendar me-1"></i></span> {filterDatePreset === "All" ? "Select Date" : filterDatePreset}
                  </span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2" style={{ minWidth: "200px" }}>
                  {["All", "Today", "Tomorrow", "7 Days", "Custom"].map((preset) => (
                    <li key={preset}>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          setFilterDatePreset(preset);
                        }}
                      >
                        {preset}
                      </Link>
                    </li>
                  ))}
                  {filterDatePreset === "Custom" && (
                    <li className="p-2 border-top mt-2">
                      <DatePicker.RangePicker
                        format="DD-MM-YYYY"
                        className="w-100"
                        value={customRange}
                        onChange={(dates) => setCustomRange(dates ? [dates[0], dates[1]] : [null, null])}
                      />
                    </li>
                  )}
                </ul>
              </div>

              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap w-100" style={{ minWidth: '150px', minHeight: '38px' }} data-bs-toggle="dropdown">
                  <span className="text-truncate"><span className="text-muted">Designation:</span> {filterDesignation}</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  {designations.map(d => (
                    <li key={d}><Link to="#" className="dropdown-item rounded-1" onClick={(e) => { e.preventDefault(); setFilterDesignation(d); }}>{d}</Link></li>
                  ))}
                </ul>
              </div>

              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap w-100" style={{ minWidth: '120px', minHeight: '38px' }} data-bs-toggle="dropdown">
                  <span className="text-truncate"><span className="text-muted">Role:</span> {filterRole}</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  {roles.map(r => (
                    <li key={r}><Link to="#" className="dropdown-item rounded-1" onClick={(e) => { e.preventDefault(); setFilterRole(r); }}>{r}</Link></li>
                  ))}
                </ul>
              </div>

              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap w-100" style={{ minWidth: '130px', minHeight: '38px' }} data-bs-toggle="dropdown">
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
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between w-100" style={{ minWidth: '100px', minHeight: '38px', background: '#fff' }}
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
            <div className="border rounded bg-white">
              <EmptyState
                title="No staff yet"
                message="Start by adding your first staff member to manage your clinic's team."
                action={
                  <button
                    type="button"
                    className="btn btn-primary"
                    data-bs-toggle="modal"
                    data-bs-target="#add_staff"
                  >
                    Add Staff <i className="ti ti-plus ms-2" />
                  </button>
                }
              />
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
            <div className="d-flex justify-content-center pt-4 pb-4 sticky-delete-bar">
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
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title fw-bold">View Staff Profile</h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" onClick={() => setViewStaff(null)}></button>
            </div>
            <div className="modal-body">
              {viewStaff && (
                <>
                  <h6 className="fw-bold mb-3">Staff Information</h6>
                  <div className="mb-3 d-flex align-items-center">
                    <label className="form-label me-3">Profile Image</label>
                    <div className="avatar avatar-lg bg-light p-1 rounded shadow-sm">
                      <ImageWithBasePath
                        src={viewStaff.profileImage?.startsWith('/') ? viewStaff.profileImage : `assets/img/users/${viewStaff.profileImage || 'avatar-21.jpg'}`}
                        alt={viewStaff.fullName}
                        className="rounded"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input type="text" className="form-control bg-light" disabled value={viewStaff.fullName || ""} />
                  </div>
                  <div className="row mb-3 border-bottom pb-3">
                    <div className="col-lg-6">
                      <div className="mb-3 mb-lg-0">
                        <label className="form-label">Role</label>
                        <input type="text" className="form-control bg-light" disabled value={viewStaff.role || ""} />
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="mb-0">
                        <label className="form-label">Designation</label>
                        <input type="text" className="form-control bg-light" disabled value={viewStaff.designationName || viewStaff.designation?.name || "--"} />
                      </div>
                    </div>
                  </div>

                  <h6 className="fw-bold mb-3">Contact Information</h6>
                  <div className="row row-gap-2">
                    <div className="col-md-6">
                      <label className="form-label">Phone Number</label>
                      <input type="text" className="form-control bg-light" disabled value={viewStaff.phone || ""} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email</label>
                      <input type="text" className="form-control bg-light" disabled value={viewStaff.email || ""} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">DOB</label>
                      <div className="input-icon-end position-relative">
                        <input type="text" className="form-control bg-light w-100" disabled value={viewStaff.dob ? new Date(viewStaff.dob).toLocaleDateString("en-GB") : "--"} />
                        <span className="input-icon-addon">
                          <i className="ti ti-calendar" />
                        </span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Gender</label>
                      <input type="text" className="form-control bg-light" disabled value={viewStaff.gender || ""} />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label">Blood Group</label>
                      <input type="text" className="form-control bg-light" disabled value={viewStaff.bloodGroup || "--"} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Address 1</label>
                      <input type="text" className="form-control bg-light" disabled value={viewStaff.address1 || ""} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Address 2</label>
                      <input type="text" className="form-control bg-light" disabled value={viewStaff.address2 || ""} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Country</label>
                      <input type="text" className="form-control bg-light" disabled value={viewStaff.country || ""} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">State</label>
                      <input type="text" className="form-control bg-light" disabled value={viewStaff.state || ""} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">City</label>
                      <input type="text" className="form-control bg-light" disabled value={viewStaff.city || ""} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Pincode</label>
                      <input type="text" className="form-control bg-light" disabled value={viewStaff.pincode || ""} />
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="d-flex justify-content-end px-4 pb-4 pt-3 mt-4 border-top">
              <button type="button" className="btn btn-primary px-5" data-bs-dismiss="modal" onClick={() => setViewStaff(null)} style={{ borderRadius: '6px' }}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StaffsList;
