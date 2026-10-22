import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { apiGet, apiPost } from "../../../../../core/utils/apiClient";
import { toast } from "react-toastify";

interface Props {
  onClose: () => void;
  appointment: any;
  onSuccess: () => void;
}

const RecommendIPDModal = ({ onClose, appointment, onSuccess }: Props) => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);

  // Form states
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedTreatmentId, setSelectedTreatmentId] = useState("");
  const [treatmentReason, setTreatmentReason] = useState("");
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [expectedDate, setExpectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [expectedStay, setExpectedStay] = useState("3");
  const [loading, setLoading] = useState(false);

  // Fetch doctors, departments, and treatments
  useEffect(() => {
    const loadData = async () => {
      try {
        const [docsData, deptsData, trtsData] = await Promise.all([
          apiGet<any[]>("/api/doctors?type=IPD"),
          apiGet<any[]>("/api/departments"),
          apiGet<any[]>("/api/ipd/treatments"),
        ]);
        setDoctors(docsData || []);
        setDepartments(deptsData || []);
        setTreatments(trtsData || []);

        // Pre-select doctor if available from appointment
        if (appointment?.doctorId) {
          setSelectedDoctorId(appointment.doctorId);
        } else if (appointment?.doctor?.id) {
          setSelectedDoctorId(appointment.doctor.id);
        }
      } catch (err) {
        console.error("Failed to load reference data for IPD recommendation:", err);
      }
    };
    loadData();
  }, [appointment]);

  // Auto-select department when doctor is selected
  useEffect(() => {
    if (selectedDoctorId && doctors.length > 0) {
      const doc = doctors.find((d) => d.id === selectedDoctorId);
      if (doc && doc.departmentId) {
        setSelectedDeptId(doc.departmentId);
      }
    }
  }, [selectedDoctorId, doctors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId) {
      toast.error("Please select a recommended doctor.");
      return;
    }

    const targetPatientId = appointment?.patientId || appointment?.patient?.id || appointment?.patient?._id;
    if (!targetPatientId) {
      toast.error("Patient details missing from appointment.");
      return;
    }

    setLoading(true);
    const payload = {
      admissionType: "Refer to OPD",
      patientId: targetPatientId,
      doctorId: selectedDoctorId,
      wardId: null,
      treatmentId: selectedTreatmentId || null,
      treatmentReason: treatmentReason.trim() || null,
      diagnosis: provisionalDiagnosis.trim() || null,
      status: "Incomplete",
      referralAppointmentId: appointment?.id || appointment?.appointmentId || appointment?._id || null,
      referralAppointmentCode: appointment?.appointmentCode || appointment?.bookingCode || appointment?.code || appointment?.appointmentNo || (appointment?.id ? `APT-${String(appointment.id).slice(-6).toUpperCase()}` : `APT-${Date.now().toString().slice(-6)}`),
      // Pass zeros for financial charges as this is just a recommendation
      admissionFee: 0,
      treatmentFee: 0,
      wardCharge: 0,
      doctorVisitCharge: 0,
      nursingFee: 0,
      otherCharges: 0,
      advancePaid: 0,
      paymentMethod: "Cash",
    };

    try {
      await apiPost("/api/ipd/admissions", payload);
      toast.success("Patient recommended for IPD successfully!");
      onSuccess();
    } catch (err: any) {
      console.error("Failed to submit IPD recommendation:", err);
    } finally {
      setLoading(false);
    }
  };

  const getPatientInitials = () => {
    if (!appointment?.patient) return "PT";
    const first = appointment.patient.firstName?.charAt(0) || "";
    const last = appointment.patient.lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "PT";
  };

  const getPatientFullName = () => {
    if (!appointment?.patient) return "Patient";
    const first = appointment.patient.firstName || "";
    const last = appointment.patient.lastName || "";
    return `${first} ${last}`.trim();
  };

  const getPatientAgeGender = () => {
    if (!appointment?.patient) return "";
    const age = appointment.patient.age ? `${appointment.patient.age} Yrs` : "";
    const gender = appointment.patient.gender || "";
    if (age && gender) return `${age} / ${gender}`;
    return age || gender;
  };

  const getPatientAddress = () => {
    if (!appointment?.patient) return "Address not available";
    const address = appointment.patient.address1 || "";
    const city = appointment.patient.city || "";
    const state = appointment.patient.state || "";
    const pincode = appointment.patient.pincode || "";
    return [address, city, state, pincode].filter(Boolean).join(", ") || "Address not available";
  };

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={onClose} />
      <div className="modal fade show d-block text-dark" style={{ zIndex: 1050 }} tabIndex={-1}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "12px", overflow: "hidden" }}>
            
            {/* Header */}
            <div className="modal-header bg-primary text-white py-3 px-4 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <div className="bg-white rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
                  <i className="ti ti-bed text-primary fs-18" />
                </div>
                <div>
                  <h5 className="modal-title fw-bold text-white mb-0">Recommend for IPD (In-Patient Department)</h5>
                  <p className="mb-0 text-white-50 fs-12">Recommend this patient for IPD admission</p>
                </div>
              </div>
              <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close" />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body p-4 bg-light-subtle">
                
                {/* Patient Summary Card */}
                <div className="card border border-secondary-subtle bg-white shadow-sm mb-4" style={{ borderRadius: "10px" }}>
                  <div className="card-body p-3">
                    <div className="row align-items-center">
                      <div className="col-md-7 d-flex align-items-center gap-3">
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold fs-18 flex-shrink-0"
                          style={{
                            width: "56px",
                            height: "56px",
                            background: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)",
                            color: "#4f46e5"
                          }}
                        >
                          <span style={{ color: "#4f46e5" }}>{getPatientInitials()}</span>
                        </div>
                        <div className="lh-sm">
                          <h5 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                            {getPatientFullName()}
                            {appointment?.patient?.patientCode && (
                              <span className="badge bg-light text-primary border border-primary-subtle fs-10 px-2 py-1">
                                {appointment.patient.patientCode}
                              </span>
                            )}
                          </h5>
                          <p className="text-secondary fs-12 mb-1">
                            <i className="ti ti-user me-1" /> {getPatientAgeGender()}
                            {appointment?.patient?.phone && (
                              <>
                                <span className="mx-2">|</span>
                                <i className="ti ti-phone me-1" /> {appointment.patient.phone}
                              </>
                            )}
                          </p>
                          <p className="text-muted fs-11 mb-0">
                            <i className="ti ti-map-pin me-1" /> {getPatientAddress()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="col-md-5 border-start border-secondary-subtle ps-md-4 mt-3 mt-md-0 fs-12">
                        <div className="d-flex justify-content-between mb-1.5">
                          <span className="text-secondary fw-medium">Visit ID</span>
                          <span className="text-dark fw-bold">{appointment?.appointmentCode || appointment?.bookingCode || "—"}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-1.5">
                          <span className="text-secondary fw-medium">Visit Date & Time</span>
                          <span className="text-dark fw-semibold">
                            {appointment?.scheduledAt ? dayjs(appointment.scheduledAt).format("DD MMM YYYY, hh:mm A") : "—"}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="text-secondary fw-medium">Consultation Type</span>
                          <span className="badge bg-light text-secondary border border-secondary-subtle px-2 py-1">
                            {appointment?.mode || "Offline Consultation"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Section */}
                <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">IPD Recommendation Details</h6>
                
                <div className="row g-3 mb-4">
                  {/* Doctor */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-secondary fs-12 uppercase">Recommended Doctor <span className="text-danger">*</span></label>
                    <select
                      className="form-select border-secondary-subtle text-dark"
                      value={selectedDoctorId}
                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                      required
                    >
                      <option value="">Select Doctor</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          Dr. {d.fullName} {d.ipdVisitCharge ? `(Visit Charge: ₹${d.ipdVisitCharge})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Department */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-secondary fs-12 uppercase">Department / Unit <span className="text-danger">*</span></label>
                    <select
                      className="form-select border-secondary-subtle text-dark"
                      value={selectedDeptId}
                      onChange={(e) => setSelectedDeptId(e.target.value)}
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map((dep) => (
                        <option key={dep.id} value={dep.id}>{dep.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Treatment dropdown */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-secondary fs-12 uppercase">Treatment</label>
                    <select
                      className="form-select border-secondary-subtle text-dark"
                      value={selectedTreatmentId}
                      onChange={(e) => setSelectedTreatmentId(e.target.value)}
                    >
                      <option value="">No Specific Procedure</option>
                      {treatments.map((t) => (
                        <option key={t.id} value={t.id}>{t.procedureName} (Price: ₹{t.totalPrice})</option>
                      ))}
                    </select>
                  </div>

                  {/* Treatment Reason */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-secondary fs-12 uppercase">Treatment Reason</label>
                    <input
                      type="text"
                      className="form-control border-secondary-subtle text-dark"
                      placeholder="Enter reason for selected treatment..."
                      value={treatmentReason}
                      onChange={(e) => setTreatmentReason(e.target.value)}
                    />
                  </div>

                  {/* Provisional Diagnosis */}
                  <div className="col-md-12">
                    <label className="form-label fw-bold text-secondary fs-12 uppercase">Provisional Diagnosis</label>
                    <textarea
                      className="form-control border-secondary-subtle text-dark"
                      rows={3}
                      maxLength={200}
                      placeholder="Enter provisional diagnosis..."
                      value={provisionalDiagnosis}
                      onChange={(e) => setProvisionalDiagnosis(e.target.value)}
                    />
                    <div className="text-end text-muted fs-11 mt-1">{provisionalDiagnosis.length}/200</div>
                  </div>

                  {/* Priority */}
                  <div className="col-md-4">
                    <label className="form-label fw-bold text-secondary fs-12 uppercase">Priority</label>
                    <select
                      className="form-select border-secondary-subtle text-dark"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  {/* Expected Date */}
                  <div className="col-md-4">
                    <label className="form-label fw-bold text-secondary fs-12 uppercase">Expected Admission Date</label>
                    <input
                      type="date"
                      className="form-control border-secondary-subtle text-dark"
                      value={expectedDate}
                      onChange={(e) => setExpectedDate(e.target.value)}
                    />
                  </div>

                  {/* Expected Stay */}
                  <div className="col-md-4">
                    <label className="form-label fw-bold text-secondary fs-12 uppercase">Expected Stay (Days)</label>
                    <div className="input-group">
                      <input
                        type="number"
                        className="form-control border-secondary-subtle text-dark"
                        min={1}
                        value={expectedStay}
                        onChange={(e) => setExpectedStay(e.target.value)}
                      />
                      <span className="input-group-text bg-light text-muted">Days</span>
                    </div>
                  </div>
                </div>

                {/* Important Info Alert Box */}
                <div className="p-3 border border-primary-subtle rounded-3" style={{ backgroundColor: "#f8fafc" }}>
                  <div className="d-flex gap-2 text-primary-emphasis">
                    <i className="ti ti-info-circle fs-16 mt-0.5" style={{ color: "#2563eb" }} />
                    <div>
                      <h6 className="fw-bold mb-1 fs-13" style={{ color: "#1e3a8a" }}>Important Information</h6>
                      <ul className="mb-0 fs-11 text-secondary ps-3" style={{ lineHeight: "1.6" }}>
                        <li>This recommendation will appear in the IPD Admission List.</li>
                        <li>IPD admission status will be marked as "Incomplete".</li>
                        <li>Admission will remain "Incomplete" until final ward and payment details are settled.</li>
                      </ul>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="modal-footer bg-light border-top px-4 py-3">
                <button type="button" className="btn btn-secondary px-4" onClick={onClose} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary px-4 fw-bold" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Saving Recommendation...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-bed me-1" />
                      Recommend for IPD
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </>
  );
};

export default RecommendIPDModal;
