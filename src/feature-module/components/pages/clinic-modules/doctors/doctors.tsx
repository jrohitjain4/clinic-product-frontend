import { DatePicker, Select } from "antd";
import {
  Amount,
  Department,
  Designation,
  Doctor,
  Status,
} from "../../../../../core/common/selectOption";
import { Link } from "react-router";
import Modals from "./modals/modals";
import { all_routes } from "../../../../routes/all_routes";
import { useClinicDoctors } from "../../../../../core/hooks/useClinicDoctors";
import DoctorsGrid from "./doctorsGrid";
import { HasPermission } from "../../../../../core/utils/staffPermissions";
import { useState } from "react";
import { toast } from "react-toastify";
import { apiUrl } from "../../../../../core/config/api";

const Doctors = () => {
  const { doctors, loading, error, refetch } = useClinicDoctors();
  const [doctorToDelete, setDoctorToDelete] = useState<string | null>(null);

  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body; // Fallback to document.body if modalElement is null
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
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper">
        {/* Start Content */}
        <div className="content">
          {/* Start Page Header */}
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3 pb-3 border-bottom">
            <div className="flex-grow-1">
              <h4 className="fw-bold mb-0">
                Doctor Grid
                <span className="badge badge-soft-primary fs-13 fw-medium ms-2">
                  Total Doctors : {loading ? "…" : doctors.length}
                </span>
              </h4>
            </div>
            <div className="text-end d-flex align-items-center gap-2">

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

                <div className="dropdown">
                  <Link
                    to="#"
                    className="btn btn-white fw-medium bg-white fs-14 border d-inline-flex align-items-center justify-content-center shadow-sm"
                    style={{ minHeight: "38px", borderRadius: "8px" }}
                    data-bs-toggle="dropdown"
                    data-bs-auto-close="outside"
                  >
                    <i className="ti ti-adjustments-horizontal me-2 text-primary fs-16" />
                    Filters
                  </Link>
                  <div
                    className="dropdown-menu dropdown-lg dropdown-menu-end filter-dropdown p-0"
                    id="filter-dropdown"
                  >
                    <div className="d-flex align-items-center justify-content-between border-bottom filter-header">
                      <h4 className="mb-0">Filter</h4>
                      <div className="d-flex align-items-center">
                        <Link
                          to="#"
                          className="link-danger text-decoration-underline"
                        >
                          Clear All
                        </Link>
                      </div>
                    </div>
                    <form action="#">
                      <div className="filter-body pb-0">
                        <div className="mb-3">
                          <div className="d-flex align-items-center justify-content-between">
                            <label className="form-label">Doctor</label>
                            <Link to="#" className="link-primary mb-1">
                              Reset
                            </Link>
                          </div>
                          <Select
                            mode="multiple"
                            allowClear
                            style={{ width: "100%" }}
                            placeholder="Please select"
                            defaultValue={[]}
                            options={Doctor}
                          />
                        </div>
                        <div className="mb-3">
                          <div className="d-flex align-items-center justify-content-between">
                            <label className="form-label">Designation</label>
                            <Link to="#" className="link-primary mb-1">
                              Reset
                            </Link>
                          </div>
                          <Select
                            mode="multiple"
                            allowClear
                            style={{ width: "100%" }}
                            placeholder="Please select"
                            defaultValue={[]}
                            options={Designation}
                          />
                        </div>
                        <div className="mb-3">
                          <div className="d-flex align-items-center justify-content-between">
                            <label className="form-label">Department</label>
                            <Link to="#" className="link-primary mb-1">
                              Reset
                            </Link>
                          </div>
                          <Select
                            mode="multiple"
                            allowClear
                            style={{ width: "100%" }}
                            placeholder="Please select"
                            defaultValue={[]}
                            options={Department}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label mb-1 text-dark fs-14 fw-medium">
                            Date<span className="text-danger">*</span>
                          </label>
                          <div className="input-icon-end position-relative">
                            <DatePicker
                              className="form-control datetimepicker"
                              format={{
                                format: "DD-MM-YYYY",
                                type: "mask",
                              }}
                              getPopupContainer={getModalContainer}
                              placeholder="DD-MM-YYYY"
                              suffixIcon={null}
                            />
                            <span className="input-icon-addon">
                              <i className="ti ti-calendar" />
                            </span>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="d-flex align-items-center justify-content-between">
                            <label className="form-label">Amount</label>
                            <Link to="#" className="link-primary mb-1">
                              Reset
                            </Link>
                          </div>
                          <Select
                            mode="multiple"
                            allowClear
                            style={{ width: "100%" }}
                            placeholder="Please select"
                            defaultValue={[]}
                            options={Amount}
                          />
                        </div>
                        <div className="mb-3">
                          <div className="d-flex align-items-center justify-content-between">
                            <label className="form-label">Status</label>
                            <Link to="#" className="link-primary mb-1">
                              Reset
                            </Link>
                          </div>
                          <Select
                            mode="multiple"
                            allowClear
                            style={{ width: "100%" }}
                            placeholder="Please select"
                            defaultValue={[]}
                            options={Status}
                          />
                        </div>
                      </div>
                      <div className="filter-footer d-flex align-items-center justify-content-end border-top">
                        <Link
                          to="#"
                          className="btn btn-light btn-md me-2"
                          id="close-filter"
                        >
                          Close
                        </Link>
                        <button type="submit" className="btn btn-primary btn-md">
                          Filter
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
                <Link
                  to={all_routes.addDoctors}
                  className="btn btn-primary fs-13 btn-md"
                >
                  New Doctor
                  <i className="ti ti-plus ms-2" />
                </Link>
              </HasPermission>
            </div>
          </div>
          {/* End Page Header */}
          <DoctorsGrid
            doctors={doctors}
            loading={loading}
            error={error}
            onRetry={refetch}
            onDelete={setDoctorToDelete}
          />
        </div>
        {/* End Content */}
        {/* Footer Start */}
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025 ©
            <Link to="#" className="link-primary">
              Docyari
            </Link>
            , All Rights Reserved
          </p>
        </div>
        {/* Footer End */}
      </div>
      {/* ========================
			End Page Content
		========================= */}
      <Modals onDelete={handleDelete} />
    </>
  );
};

export default Doctors;
