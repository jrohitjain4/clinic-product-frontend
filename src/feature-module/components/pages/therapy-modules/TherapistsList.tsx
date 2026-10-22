import { Link } from "react-router";
import EmptyState from "../../../../core/common/emptyState";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import { all_routes, doctorDetailsPath, editDoctorPath } from "../../../routes/all_routes";
import { useMemo, useState, useEffect, useCallback } from "react";
import Datatable from "../../../../core/common/dataTable";
import Modals from "../clinic-modules/doctors/modals/modals";
import { useClinicDoctors } from "../../../../core/hooks/useClinicDoctors";
import { apiUrl } from "../../../../core/config/api";
import { toast } from "react-toastify";

interface DeptItem { id: string; name: string; status?: string; }
interface DesigItem { id: string; name: string; type?: string; }

const TherapistsList = () => {
  const { doctors, loading, error, refetch } = useClinicDoctors();
  const [searchText, setSearchText] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [doctorToDelete, setDoctorToDelete] = useState<string | null>(null);

  // Filters
  const [filterDept, setFilterDept] = useState("All");
  const [filterDesig, setFilterDesig] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // Fetch departments & designations for filter dropdowns
  const [departments, setDepartments] = useState<DeptItem[]>([]);
  const [designations, setDesignations] = useState<DesigItem[]>([]);

  const fetchFilterData = useCallback(async () => {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const [deptRes, desigRes] = await Promise.all([
        fetch(apiUrl("/api/departments"), { headers }),
        fetch(apiUrl("/api/designations"), { headers }),
      ]);
      if (deptRes.ok) {
        const data = await deptRes.json();
        setDepartments(Array.isArray(data) ? data : []);
      }
      if (desigRes.ok) {
        const data = await desigRes.json();
        setDesignations(Array.isArray(data) ? data : []);
      }
    } catch { }
  }, []);

  useEffect(() => { fetchFilterData(); }, [fetchFilterData]);

  const handleDelete = async () => {
    const idsToDelete = doctorToDelete ? [doctorToDelete] : selectedIds;
    if (idsToDelete.length === 0) {
      toast.warning("Please select at least one therapist to delete");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      for (const id of idsToDelete) {
        const res = await fetch(apiUrl(`/api/doctors/${id}`), {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to delete");
      }
      toast.success(idsToDelete.length > 1 ? "Therapists deleted successfully" : "Therapist deleted successfully");
      setSelectedIds([]);
      setDoctorToDelete(null);
      refetch();
    } catch (err) {
      toast.error("Error deleting therapist(s)");
    }
  };

  // Filtered data (ONLY therapists)
  const filteredTherapists = useMemo(() => {
    return doctors.filter((d) => {
      if (d.doctorType !== "therapist") return false; // ONLY show therapists!
      const matchDept = filterDept === "All" || d.department?.name === filterDept;
      const matchDesig = filterDesig === "All" || d.designation?.name === filterDesig;
      const matchStatus = filterStatus === "All" || d.status === filterStatus;
      return matchDept && matchDesig && matchStatus;
    });
  }, [doctors, filterDept, filterDesig, filterStatus]);

  const tableData = useMemo(
    () =>
      filteredTherapists.map((d, i) => ({
        key: d.id,
        SrNo: i + 1,
        Name_Designation: d.fullName,
        Department: d.department?.name || "",
        DesignationName: d.designation?.name || "",
        Phone: d.phone || "",
        Email: d.email || "",
        Fees: d.consultationCharge != null ? `₹${d.consultationCharge}` : "—",
        Status: d.status === "Active" ? "Available" : (d.status === "Inactive" ? "Unavailable" : d.status),
        img: d.profileImage || "assets/img/doctor-placeholder.png",
      })),
    [filteredTherapists]
  );

  const columns = [
    {
      title: "Sr No",
      dataIndex: "SrNo",
      render: (text: number) => <span className="fs-13 fw-medium">{text}</span>,
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.SrNo - b.SrNo,
    },
    {
      title: "Name & Designation",
      dataIndex: "Name_Designation",
      render: (text: string, record: (typeof tableData)[0]) => (
        <div className="d-flex align-items-center">
          <Link to={doctorDetailsPath(record.key)} className="avatar me-2">
            <ImageWithBasePath
              src={record.img}
              alt="Therapist"
              className="rounded-circle"
            />
          </Link>
          <div>
            <h6 className="mb-1 fs-14 fw-semibold">
              <Link to={doctorDetailsPath(record.key)}>{text}</Link>
            </h6>
            <span className="fs-13 d-block">{record.DesignationName || record.Department}</span>
          </div>
        </div>
      ),
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Name_Designation.localeCompare(b.Name_Designation),
    },
    {
      title: "Department",
      dataIndex: "Department",
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Department.localeCompare(b.Department),
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
      title: "Fees",
      dataIndex: "Fees",
      render: (text: string) => <h6 className="fs-14 fw-semibold mb-0">{text}</h6>,
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Fees.localeCompare(b.Fees),
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => (
        <span
          className={`badge ${text === "Available" ? "badge-soft-success border-success" : "badge-soft-danger border-danger"} border`}
        >
          {text}
        </span>
      ),
      sorter: (a: (typeof tableData)[0], b: (typeof tableData)[0]) =>
        a.Status.localeCompare(b.Status),
    },
    {
      title: "Action",
      dataIndex: "action",
      align: "center",
      className: "text-nowrap",
      width: 130,
      render: (_: unknown, record: (typeof tableData)[0]) => (
        <div className="d-flex align-items-center gap-2 justify-content-center text-nowrap">
          <Link to={doctorDetailsPath(record.key)} className="text-info p-1" title="View"><i className="ti ti-eye fs-18" /></Link>
          <Link to={editDoctorPath(record.key)} className="text-primary p-1" title="Edit"><i className="ti ti-edit fs-18" /></Link>
          <button className="bg-transparent border-0 text-danger p-1" title="Delete" data-bs-toggle="modal" data-bs-target="#delete_modal" onClick={() => setDoctorToDelete(record.key)}><i className="ti ti-trash fs-18" /></button>
        </div>
      ),
    },
  ];

  // Unique values for filter dropdowns
  const uniqueDepts = useMemo(
    () => [...new Set(departments.map((d) => d.name))].filter(Boolean).sort(),
    [departments]
  );

  const uniqueDesigs = useMemo(
    () => [...new Set(designations.map((d) => d.name))].filter(Boolean).sort(),
    [designations]
  );

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header d-flex align-items-sm-center flex-sm-row flex-column gap-2 border-bottom">
            <div className="flex-grow-1">
              <h4 className="page-title fw-bold mb-0">
                Therapist List
                <span className="badge badge-soft-primary fs-13 fw-medium ms-2">
                  Total Therapists : {loading ? "" : filteredTherapists.length}
                </span>
              </h4>
            </div>
            <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
              {/* Department Filter */}
              <div className="dropdown">
                <Link
                  to="#"
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap"
                  style={{ minWidth: "160px", minHeight: "38px" }}
                  data-bs-toggle="dropdown"
                  data-bs-auto-close="outside"
                >
                  <span className="text-truncate">
                    <span className="text-muted">Department:</span> {filterDept}
                  </span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2" style={{ minWidth: "180px" }}>
                  <li>
                    <Link to="#" className="dropdown-item rounded-1" onClick={(e) => { e.preventDefault(); setFilterDept("All"); }}>
                      All
                    </Link>
                  </li>
                  {uniqueDepts.map((name) => (
                    <li key={name}>
                      <Link to="#" className="dropdown-item rounded-1" onClick={(e) => { e.preventDefault(); setFilterDept(name); }}>
                        {name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Designation Filter */}
              <div className="dropdown">
                <Link
                  to="#"
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap"
                  style={{ minWidth: "160px", minHeight: "38px" }}
                  data-bs-toggle="dropdown"
                  data-bs-auto-close="outside"
                >
                  <span className="text-truncate">
                    <span className="text-muted">Designation:</span> {filterDesig}
                  </span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2" style={{ minWidth: "180px" }}>
                  <li>
                    <Link to="#" className="dropdown-item rounded-1" onClick={(e) => { e.preventDefault(); setFilterDesig("All"); }}>
                      All
                    </Link>
                  </li>
                  {uniqueDesigs.map((name) => (
                    <li key={name}>
                      <Link to="#" className="dropdown-item rounded-1" onClick={(e) => { e.preventDefault(); setFilterDesig(name); }}>
                        {name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Status Filter */}
              <div className="dropdown">
                <Link
                  to="#"
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap"
                  style={{ minWidth: "130px", minHeight: "38px" }}
                  data-bs-toggle="dropdown"
                >
                  <span className="text-truncate">
                    <span className="text-muted">Status:</span> {filterStatus === "All" ? "All" : filterStatus === "Active" ? "Available" : "Unavailable"}
                  </span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li>
                    <Link to="#" className="dropdown-item rounded-1" onClick={(e) => { e.preventDefault(); setFilterStatus("All"); }}>
                      All
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="dropdown-item rounded-1" onClick={(e) => { e.preventDefault(); setFilterStatus("Active"); }}>
                      Available
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="dropdown-item rounded-1" onClick={(e) => { e.preventDefault(); setFilterStatus("Inactive"); }}>
                      Unavailable
                    </Link>
                  </li>
                </ul>
              </div>

              <Link
                to={all_routes.addTherapist}
                className="btn btn-primary d-flex align-items-center justify-content-center ms-1"
                style={{ minHeight: '38px', whiteSpace: 'nowrap' }}
              >
                New Therapist <i className="fa fa-plus ms-2" />
              </Link>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger d-flex align-items-center justify-content-between mb-3">
              <span>{error}</span>
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={refetch}>
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status" />
            </div>
          ) : tableData.length === 0 && !error ? (
            <div className="border rounded bg-white">
              <EmptyState
                title="No therapists yet"
                message="Grow your therapy team by onboarding experienced therapists."
                action={
                  <Link
                    to={all_routes.addTherapist}
                    className="btn btn-primary d-flex align-items-center justify-content-center"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    New Therapist <i className="fa fa-plus ms-2" />
                  </Link>
                }
              />
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
                data-bs-target="#delete_modal"
                onClick={() => setDoctorToDelete(null)}
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
      <Modals onDelete={handleDelete} />
    </>
  );
};

export default TherapistsList;
