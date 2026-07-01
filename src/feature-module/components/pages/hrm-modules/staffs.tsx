import { useMemo, useState } from "react";
import dayjs from "dayjs";
import EmptyState from "../../../../core/common/emptyState";
import { Link } from "react-router";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import Datatable from "../../../../core/common/dataTable";
import StaffsModal from "./modal/staffsModal";
import { DatePicker, Modal } from "antd";
import type { Dayjs } from "dayjs";
import { ViewModal } from "../../../../core/common/modal/ViewModal";
import { useClinicStaff } from "../../../../core/hooks/useClinicStaff";
import type { ClinicStaff } from "../../../../core/types/clinicStaff";
import { staffToTableRow } from "../../../../core/utils/staffForm";
import { apiUrl } from "../../../../core/config/api";
import { toast } from "react-toastify";

const StaffsList = () => {
  const { staffs, loading, error, refetch, reload } = useClinicStaff();
  const [selected, setSelected] = useState<ClinicStaff | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewStaff, setViewStaff] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [resetStaff, setResetStaff] = useState<ClinicStaff | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!resetStaff) return;
    setResetLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl(`/api/staffs/${resetStaff.id}/reset-password`), {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to reset password");
      toast.success(data.message || "Password reset! New credentials sent to email.");
      setResetStaff(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setResetLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem("token");
      for (const id of selectedIds) {
        await fetch(apiUrl(`/api/staffs/${id}`), {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      }
      setSelectedIds([]);
      refetch();
      toast.success("Selected staff members deleted successfully");
      document.getElementById("btn-close-bulk-delete-staff")?.click();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete staff");
    } finally {
      setDeleteLoading(false);
    }
  };

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
      render: (text: number) => <span className="text-dark fw-medium">{text}</span>,
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) => a.S_No - b.S_No,
    },
    {
      title: "Staff",
      dataIndex: "Staff",
      render: (text: string, record: (typeof tableData)[0]) => {
        const hasImage = record.Image &&
                         record.Image.trim() !== "" &&
                         !record.Image.includes("300x300") &&
                         !record.Image.includes("ui-avatars.com") &&
                         !record.Image.includes("via.placeholder.com");
        const staffImg = hasImage ? record.Image : "assets/img/patient-placeholder.png";

        return (
          <div className="d-flex align-items-center">
            <button
              type="button"
              className="avatar me-2 border-0 bg-transparent p-0"
              data-bs-toggle="modal"
              data-bs-target="#view_staff"
              onClick={() => { openStaff(record._raw); setViewStaff(record._raw); }}
            >
              <ImageWithBasePath
                src={staffImg}
                alt="Staff"
                className="rounded-circle"
                style={{ width: 38, height: 38, objectFit: "cover" }}
              />
            </button>
            <div>
              <h6 className="mb-1 fs-14 fw-semibold">
                <button
                  type="button"
                  className="btn btn-link p-0 text-dark fw-semibold fs-14 text-decoration-none"
                  data-bs-toggle="modal"
                  data-bs-target="#view_staff"
                  onClick={() => { openStaff(record._raw); setViewStaff(record._raw); }}
                >
                  {text}
                </button>
              </h6>
            </div>
          </div>
        );
      },
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Staff.localeCompare(b.Staff),
    },
    {
      title: "Designation",
      dataIndex: "Designation",
      render: (text: string) => <span className="text-dark fw-medium">{text}</span>,
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Designation.localeCompare(b.Designation),
    },
    {
      title: "Role",
      dataIndex: "Role",
      render: (text: string) => <span className="text-dark fw-medium">{text}</span>,
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Role.localeCompare(b.Role),
    },
    {
      title: "Phone",
      dataIndex: "Phone",
      render: (text: string) => <span className="text-dark fw-medium">{text}</span>,
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Phone.localeCompare(b.Phone),
    },
    {
      title: "Email",
      dataIndex: "Email",
      render: (text: string) => <span className="text-dark fw-medium">{text}</span>,
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
      className: "text-nowrap",
      width: 130,
      render: (_: unknown, record: (typeof tableData)[0]) => (
        <div className="d-flex align-items-center justify-content-center gap-2 text-nowrap">
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

          {/* Reset Password */}
          {record._raw.email && (
            <button
              type="button"
              className="bg-transparent border-0 text-warning p-1"
              title="Reset Login Password"
              onClick={() => setResetStaff(record._raw)}
            >
              <i className="ti ti-key fs-18" />
            </button>
          )}

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
                data-bs-target="#bulk_delete_staff_modal"
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
      <ViewModal
        id="view_staff"
        title="Staff Profile"
        subtitle="View staff information"
        headerIcon={<i className="ti ti-user-circle" />}
        highlightTitle={viewStaff?.fullName || "Staff Member"}
        highlightStatus={
          <span className="badge bg-success-transparent text-success fw-bold px-2 py-1" style={{ fontSize: "10px", borderRadius: "10px" }}>
            <i className="ti ti-point-filled me-1"></i>Active
          </span>
        }
        highlightRightText={viewStaff?.role || "Staff"}
        highlightRightSubText="Role"
        highlightColor="#f3e8ff"
        details={[
          { icon: <i className="ti ti-mail" />, label: "Email", value: viewStaff?.email || "—" },
          { icon: <i className="ti ti-phone" />, label: "Phone", value: viewStaff?.phone || "—" },
          { icon: <i className="ti ti-briefcase" />, label: "Designation", value: viewStaff?.designationName || viewStaff?.designation?.name || "—" },
          { icon: <i className="ti ti-gender-intergender" />, label: "Gender", value: viewStaff?.gender || "—" },
          { icon: <i className="ti ti-calendar" />, label: "Date of Birth", value: viewStaff?.dob ? new Date(viewStaff.dob).toLocaleDateString("en-GB") : "—" },
          { icon: <i className="ti ti-droplet" />, label: "Blood Group", value: viewStaff?.bloodGroup || "—" },
          { icon: <i className="ti ti-map-pin" />, label: "Address", value: [viewStaff?.address1, viewStaff?.address2, viewStaff?.city, viewStaff?.state, viewStaff?.country, viewStaff?.pincode].filter(Boolean).join(", ") || "—", fullWidth: true }
        ]}
        onEdit={() => {
          setSelected(viewStaff);
        }}
        editLabel="Edit Staff"
        editModalTarget="#edit_staff"
      />

      {/* ===== BULK DELETE MODAL ===== */}
      <div className="modal fade" id="bulk_delete_staff_modal">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "12px", overflow: "hidden" }}>
            <div className="modal-body text-center position-relative z-1 pt-5 pb-5">
              <ImageWithBasePath
                src="assets/img/bg/delete-modal-bg-01.png"
                alt=""
                className="img-fluid position-absolute top-0 start-0 z-n1"
              />
              <ImageWithBasePath
                src="assets/img/bg/delete-modal-bg-02.png"
                alt=""
                className="img-fluid position-absolute bottom-0 end-0 z-n1"
              />
              <div className="mb-3">
                <span className="avatar avatar-lg bg-danger text-white">
                  <i className="ti ti-trash fs-24"></i>
                </span>
              </div>
              <h5 className="fw-bold mb-2">Delete Confirmation</h5>
              <p className="text-muted mb-4">
                Are you sure you want to delete selected staff members?
              </p>
              <div className="d-flex justify-content-center gap-2">
                <button
                  id="btn-close-bulk-delete-staff"
                  type="button"
                  className="btn btn-light position-relative z-1 px-4"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger position-relative z-1 px-4"
                  onClick={handleBulkDelete}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-trash me-2" />
                      Yes, Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== RESET PASSWORD CONFIRM MODAL ===== */}
      <Modal
        open={!!resetStaff}
        onCancel={() => setResetStaff(null)}
        footer={null}
        centered
        width={400}
        title={null}
        styles={{ body: { textAlign: 'center', padding: '32px 24px' } }}
      >
        <div className="mb-3">
          <span className="avatar avatar-lg bg-warning text-white">
            <i className="ti ti-key fs-24" />
          </span>
        </div>
        <h5 className="fw-bold mb-2">Reset Login Password?</h5>
        <p className="text-muted mb-4" style={{ fontSize: '14px' }}>
          A new random password will be generated and sent to <strong>{resetStaff?.email}</strong>.
          The staff member will need to use the new password to log in.
        </p>
        <div className="d-flex justify-content-center gap-2">
          <button
            type="button"
            className="btn btn-light px-4"
            onClick={() => setResetStaff(null)}
            disabled={resetLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-warning px-4 text-white"
            onClick={handleResetPassword}
            disabled={resetLoading}
          >
            {resetLoading ? (
              <><span className="spinner-border spinner-border-sm me-2" />Resetting...</>
            ) : (
              <><i className="ti ti-key me-2" />Yes, Reset Password</>
            )}
          </button>
        </div>
      </Modal>
    </>
  );
};

export default StaffsList;
