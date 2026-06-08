import { useMemo, useState } from "react";
import { Link } from "react-router";
import { DatePicker } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { all_routes } from "../../../../routes/all_routes";
import Datatable from "../../../../../core/common/dataTable";
import { useClinicPatients } from "../../../../../core/hooks/useClinicPatients";
import type { ClinicPatient } from "../../../../../core/types/clinicPatient";
import { patientToTableRow } from "../../../../../core/utils/patientForm";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import PatientsDeleteModal from "./patientsDeleteModal";
import { HasPermission } from "../../../../../core/utils/staffPermissions";
import { apiUrl } from "../../../../../core/config/api";
import { toast } from "react-toastify";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["Male", "Female", "Other"];

const Patients = () => {
  const { patients, loading, error, refetch, reload } = useClinicPatients();
  const [searchText, setSearchText] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null);

  // HRM-style inline filters
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterBloodGroup, setFilterBloodGroup] = useState("All");
  const [filterGender, setFilterGender] = useState("All");
  const [filterDate, setFilterDate] = useState<Dayjs | null>(null);

  const getModalContainer = () =>
    document.getElementById("modal-datepicker") || document.body;

  const handleClearAll = () => {
    setFilterStatus("All");
    setFilterBloodGroup("All");
    setFilterGender("All");
    setFilterDate(null);
  };

  const handleBulkDelete = async () => {
    const idsToDelete = patientToDelete ? [patientToDelete] : selectedIds;
    if (idsToDelete.length === 0) return;

    const token = localStorage.getItem("token");
    try {
      let successCount = 0;
      for (const id of idsToDelete) {
        const res = await fetch(apiUrl(`/api/patients/${id}`), {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) successCount++;
      }

      if (successCount === idsToDelete.length) {
        toast.success(`${successCount} Patient(s) deleted successfully`);
      } else if (successCount > 0) {
        toast.warning(`${successCount} out of ${idsToDelete.length} patients deleted.`);
      } else {
        throw new Error("Delete failed");
      }

      setSelectedIds([]);
      setPatientToDelete(null);
      refetch();
    } catch (err) {
      toast.error("Error: Could not complete deletion properly.");
    }
  };

  // Filtered patients
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchStatus = filterStatus === "All" || p.status === filterStatus;
      const matchBlood = filterBloodGroup === "All" || p.bloodGroup === filterBloodGroup;
      const matchGender = filterGender === "All" || p.gender === filterGender;
      const matchDate = !filterDate || (p.createdAt && dayjs(p.createdAt).isSame(filterDate, "day"));
      return matchStatus && matchBlood && matchGender && matchDate;
    });
  }, [patients, filterStatus, filterBloodGroup, filterGender, filterDate]);

  const tableData = useMemo(
    () => filteredPatients.map((p, i) => {
      const hasImage = p.profileImage && p.profileImage.trim() !== "" && !p.profileImage.includes("300x300");
      const patientImg = hasImage
        ? p.profileImage
        : "assets/img/patient-placeholder.png";

      return {
        ...patientToTableRow(p, i),
        SrNo: i + 1,
        Patient_img: patientImg
      };
    }),
    [filteredPatients]
  );

  const patientDetailsPath = (id: string) =>
    all_routes.patientDetails.replace(":id", id);

  const editPatientPath = (id: string) =>
    all_routes.editPatient.replace(":id", id);

  const columns = [
    {
      title: "Sr No",
      dataIndex: "SrNo",
      render: (text: number) => <span className="text-dark fw-bold">{text}</span>,
      sorter: (a: any, b: any) => a.SrNo - b.SrNo,
    },
    {
      title: "Patient",
      dataIndex: "Patient",
      render: (text: string, record: any) => (
        <div className="d-flex align-items-center">
          <Link
            to={patientDetailsPath(record._raw.id)}
            className="avatar avatar-md me-2"
          >
            <ImageWithBasePath
              src={record.Patient_img}
              alt="Patient"
              className="rounded-circle border"
              fallback="assets/img/patient-placeholder.png"
            />
          </Link>
          <div>
            <h6 className="mb-0 fs-14 fw-bold">
              <Link
                to={patientDetailsPath(record._raw.id)}
                className="text-dark"
              >
                {text}
              </Link>
            </h6>
          </div>
        </div>
      ),
      sorter: (a: any, b: any) => a.Patient.localeCompare(b.Patient),
    },
    {
      title: "Phone",
      dataIndex: "Phone",
      render: (text: string) => <span className="text-dark fw-medium">{text}</span>,
      sorter: (a: any, b: any) => a.Phone.localeCompare(b.Phone),
    },
    {
      title: "Gender",
      dataIndex: "GenderText",
      render: (_: any, record: any) => (
        <span className="text-dark fw-medium text-capitalize">{record._raw.gender || "—"}</span>
      ),
      sorter: (a: any, b: any) => (a._raw.gender || "").localeCompare(b._raw.gender || ""),
    },
    {
      title: "Blood Group",
      dataIndex: "BloodGroup",
      render: (_: any, record: any) => (
        <span className="badge badge-soft-primary border border-primary fw-bold text-primary" style={{ minWidth: "40px" }}>
          {record._raw.bloodGroup || "—"}
        </span>
      ),
      sorter: (a: any, b: any) => (a._raw.bloodGroup || "").localeCompare(b._raw.bloodGroup || ""),
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => (
        <span
          className={`badge rounded fs-12 fw-bold border ${text === "Available"
            ? "badge-soft-success text-success border-success"
            : "badge-soft-danger text-danger border-danger"
            }`}
        >
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => a.Status.localeCompare(b.Status),
    },
    {
      title: "Action",
      dataIndex: "action",
      align: "center",
      render: (_: unknown, record: any) => (
        <div className="d-flex align-items-center justify-content-center gap-2">
          <Link
            to={patientDetailsPath(record._raw.id)}
            className="btn btn-icon btn-sm btn-soft-secondary border"
            title="View Patient"
          >
            <i className="ti ti-eye fs-16" />
          </Link>

          <HasPermission module="Patients" action="EDIT">
            <Link
              to={editPatientPath(record._raw.id)}
              className="btn btn-icon btn-sm btn-soft-primary border"
              title="Edit Patient"
            >
              <i className="ti ti-edit fs-16" />
            </Link>
          </HasPermission>

          <HasPermission module="Patients" action="DELETE">
            <button
              type="button"
              className="btn btn-icon btn-sm btn-soft-danger border"
              title="Delete Patient"
              data-bs-toggle="modal"
              data-bs-target="#delete_patient_modal"
              onClick={() => setPatientToDelete(record._raw.id)}
            >
              <i className="ti ti-trash fs-16" />
            </button>
          </HasPermission>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-bottom">
            <div className="flex-grow-1">
              <h4 className="fw-bold mb-0 text-dark">
                Patients List
                <span className="badge badge-soft-primary fw-bold ms-2">
                  {loading ? "" : filteredPatients.length} Patients
                </span>
              </h4>
            </div>
            <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
              <button
                className="btn btn-sm btn-light border text-primary fw-bold me-1"
                onClick={handleClearAll}
                style={{ height: "38px" }}
              >
                Clear All
              </button>
              <DatePicker
                placeholder="Date"
                className="form-select text-dark"
                style={{ width: "135px", height: "38px" }}
                format="DD-MM-YYYY"
                allowClear={true}
                getPopupContainer={getModalContainer}
                onChange={(date) => setFilterDate(date)}
                value={filterDate}
              />
              <div className="dropdown">
                <Link to="#" className="form-select text-dark d-flex align-items-center justify-content-between" style={{ minWidth: "125px", height: "38px" }} data-bs-toggle="dropdown">
                  <span className="text-truncate"><span className="text-muted">Status:</span> {filterStatus === "All" ? "All" : filterStatus === "Active" ? "Available" : "Unavailable"}</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item" onClick={() => setFilterStatus("All")}>All</Link></li>
                  <li><Link to="#" className="dropdown-item" onClick={() => setFilterStatus("Active")}>Available</Link></li>
                  <li><Link to="#" className="dropdown-item" onClick={() => setFilterStatus("Inactive")}>Unavailable</Link></li>
                </ul>
              </div>
              <div className="dropdown">
                <Link to="#" className="form-select text-dark d-flex align-items-center justify-content-between" style={{ minWidth: "135px", height: "38px" }} data-bs-toggle="dropdown">
                  <span className="text-truncate"><span className="text-muted">Blood:</span> {filterBloodGroup}</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item" onClick={() => setFilterBloodGroup("All")}>All</Link></li>
                  {BLOOD_GROUPS.map((bg) => (<li key={bg}><Link to="#" className="dropdown-item" onClick={() => setFilterBloodGroup(bg)}>{bg}</Link></li>))}
                </ul>
              </div>
              <div className="dropdown">
                <Link to="#" className="form-select text-dark d-flex align-items-center justify-content-between" style={{ minWidth: "125px", height: "38px" }} data-bs-toggle="dropdown">
                  <span className="text-truncate"><span className="text-muted">Gender:</span> {filterGender}</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item" onClick={() => setFilterGender("All")}>All</Link></li>
                  {GENDERS.map((g) => (<li key={g}><Link to="#" className="dropdown-item" onClick={() => setFilterGender(g)}>{g}</Link></li>))}
                </ul>
              </div>
              <div className="d-flex align-items-center gap-2">
                <Link to={all_routes.patients} className="btn btn-icon btn-sm bg-primary-subtle text-primary border border-primary d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px', borderRadius: '8px' }}><i className="ti ti-list-tree fs-16" /></Link>
                <Link to={all_routes.patientsGrid} className="btn btn-icon btn-sm bg-white text-dark border d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px', borderRadius: '8px' }}><i className="ti ti-layout-grid fs-16" /></Link>
              </div>
              <HasPermission module="Patients" action="CREATE">
                <Link to={all_routes.createPatient} className="btn btn-primary ms-1 fw-bold" style={{ height: '38px' }}>New Patient <i className="ti ti-plus ms-1" /></Link>
              </HasPermission>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger mb-3">
              <span>{error}</span>
              <button className="btn btn-sm btn-outline-danger ms-2" onClick={() => reload()}>Retry</button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status" />
            </div>
          ) : filteredPatients.length === 0 && !error ? (
            <div className="text-center py-5 border rounded bg-white">
              <i className="ti ti-users fs-1 text-muted d-block mb-2" />
              <h6 className="fw-bold text-dark">No records found</h6>
              <p className="text-muted mb-3">Modify your filters or add a new patient.</p>
              {patients.length === 0 && (
                <HasPermission module="Patients" action="CREATE">
                  <Link to={all_routes.createPatient} className="btn btn-primary">New Patient</Link>
                </HasPermission>
              )}
            </div>
          ) : (
            <div className="table-responsive border rounded bg-white">
              <Datatable
                columns={columns}
                dataSource={tableData}
                Selection={true}
                onSelectionChange={(keys: any) => setSelectedIds(keys as string[])}
                searchText={searchText}
              />
            </div>
          )}

          {selectedIds.length > 0 && (
            <div className="d-flex justify-content-center mt-3 pb-3">
              <button
                className="btn btn-danger d-flex align-items-center gap-2 px-4 shadow"
                data-bs-toggle="modal"
                data-bs-target="#delete_patient_modal"
                onClick={() => setPatientToDelete(null)}
                style={{ borderRadius: '8px', minHeight: '40px', fontWeight: 'bold' }}
              >
                <i className="ti ti-trash"></i>
                Delete Selected ({selectedIds.length})
              </button>
            </div>
          )}
        </div>
        <div className="footer text-center bg-white p-2 border-top mt-auto">
          <p className="text-dark mb-0 fw-medium">2025  Docyari, All Rights Reserved</p>
        </div>
      </div>

      <PatientsDeleteModal
        patient={patients.find(p => p.id === (patientToDelete || "")) || null}
        onClear={() => { setPatientToDelete(null); setSelectedIds([]); }}
        onDeleted={handleBulkDelete}
      />
    </>
  );
};

export default Patients;
