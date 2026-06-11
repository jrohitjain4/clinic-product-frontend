import { Link } from "react-router";
import Modals from "./modals/modals";
import { all_routes } from "../../../../routes/all_routes";
import { useClinicDoctors } from "../../../../../core/hooks/useClinicDoctors";
import DoctorsGrid from "./doctorsGrid";
import { HasPermission } from "../../../../../core/utils/staffPermissions";
import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { apiUrl } from "../../../../../core/config/api";

interface DeptItem { id: string; name: string; status?: string; }
interface DesigItem { id: string; name: string; type?: string; }

const Doctors = () => {
  const { doctors, loading, error, refetch } = useClinicDoctors();
  const [doctorToDelete, setDoctorToDelete] = useState<string | null>(null);

  // Filters State
  const [filterDept, setFilterDept] = useState("All");
  const [filterDesig, setFilterDesig] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
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

  const filteredDoctors = useMemo(() => {
    return doctors.filter((d) => {
      const matchDept = filterDept === "All" || d.department?.name === filterDept;
      const matchDesig = filterDesig === "All" || d.designation?.name === filterDesig;
      const matchStatus = filterStatus === "All" || d.status === filterStatus;
      return matchDept && matchDesig && matchStatus;
    });
  }, [doctors, filterDept, filterDesig, filterStatus]);

  const uniqueDepts = useMemo(
    () => [...new Set(departments.map((d) => d.name))].filter(Boolean).sort(),
    [departments]
  );

  const uniqueDesigs = useMemo(
    () => [...new Set(designations.map((d) => d.name))].filter(Boolean).sort(),
    [designations]
  );

  const truncateText = (str: string, maxLen: number = 12) => {
    if (str.length > maxLen) return str.substring(0, maxLen) + "..";
    return str;
  };

  const handleDelete = async () => {
    if (!doctorToDelete) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(apiUrl(`/api/doctors/${doctorToDelete}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Doctor deleted successfully");
      setDoctorToDelete(null);
      refetch();
    } catch (err) {
      toast.error("Error deleting doctor");
    }
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Start Page Header */}
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3 pb-3 border-bottom">
            <div className="flex-grow-1">
              <h4 className="fw-bold mb-0">
                Doctor Grid
                <span className="badge badge-soft-primary fs-13 fw-medium ms-2">
                  Total Doctors : {loading ? "…" : filteredDoctors.length}
                </span>
              </h4>
            </div>
            <div className="text-end d-flex align-items-center flex-wrap gap-2">
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
                    <span className="text-muted">Department:</span> {truncateText(filterDept)}
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
                    <span className="text-muted">Designation:</span> {truncateText(filterDesig)}
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
                    <span className="text-muted">Status:</span> {filterStatus === "All" ? "All" : filterStatus === "Active" ? "Available" : "Unable"}
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
                      Unable
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="d-flex align-items-center gap-2">
                <Link
                  to={all_routes.doctorsList}
                  className="btn btn-icon btn-sm bg-white text-dark border d-flex align-items-center justify-content-center"
                  style={{ width: '38px', height: '38px', borderRadius: '8px' }}
                >
                  <i className="ti ti-list-tree fs-16" />
                </Link>
                <Link
                  to={all_routes.doctors}
                  className="btn btn-icon btn-sm bg-primary-subtle text-primary border border-primary d-flex align-items-center justify-content-center"
                  style={{ width: '38px', height: '38px', borderRadius: '8px' }}
                >
                  <i className="ti ti-layout-grid fs-16" />
                </Link>
              </div>
              <HasPermission module="Doctors" action="CREATE">
                <Link
                  to={all_routes.addDoctors}
                  className="btn btn-primary d-flex align-items-center justify-content-center ms-1"
                  style={{ minHeight: '38px', whiteSpace: 'nowrap' }}
                >
                  New Doctor <i className="fa fa-plus ms-2" />
                </Link>
              </HasPermission>
            </div>
          </div>
          {/* End Page Header */}

          <DoctorsGrid
            doctors={filteredDoctors}
            loading={loading}
            error={error}
            onRetry={refetch}
            onDelete={setDoctorToDelete}
          />
        </div>
        {/* End Content */}

        <div className="footer text-center bg-white p-2 border-top mt-auto">
          <p className="text-dark mb-0">
            2025 ©
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

export default Doctors;
