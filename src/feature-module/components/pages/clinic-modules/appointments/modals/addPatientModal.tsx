import { useEffect, useState } from "react";
import { Modal, DatePicker } from "antd";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import {
    Blood_Group,
    City,
    Country,
    Gender,
    State,
} from "../../../../../../core/common/selectOption";
import CommonSelect from "../../../../../../core/common/common-select/commonSelect";
import { apiUrl } from "../../../../../../core/config/api";
import { authHeaders } from "../../../../../../core/utils/apiClient";
import { findSelectOption } from "../../../../../../core/utils/doctorSchedule";
import { PATIENT_STATUS_OPTIONS, emptyPatientForm } from "../../../../../../core/utils/patientForm";
import PatientProfileUpload from "../../../../../../core/common/patient-profile-upload/PatientProfileUpload";

interface AddPatientModalProps {
    show: boolean;
    onHide: () => void;
    onSuccess: (newPatient: any) => void;
}

const AddPatientModal = ({ show, onHide, onSuccess }: AddPatientModalProps) => {
    const [form, setForm] = useState(emptyPatientForm);
    const [doctors, setDoctors] = useState<{ id: string; fullName: string }[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [phoneWarning, setPhoneWarning] = useState<string | null>(null);

    useEffect(() => {
        if (show) {
            setForm(emptyPatientForm);
            setError(null);
            // Load doctors for primary doctor selection
            fetch(apiUrl("/api/doctors"), {
                headers: authHeaders(),
            })
                .then((r) => r.json())
                .then((data) => setDoctors(Array.isArray(data) ? data : []))
                .catch(console.error);
        }
    }, [show]);

    // ── Phone Duplicate Check ──────────────────────────────────────
    useEffect(() => {
        if (!form.phone || form.phone.length < 5) {
            setPhoneWarning(null);
            return;
        }
        const token = localStorage.getItem("token");
        fetch(apiUrl(`/api/patients?search=${form.phone}`), {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    if (data.some((p: any) => p.phone === form.phone)) {
                        setPhoneWarning("Warning: This phone number is already registered for another patient.");
                    } else {
                        setPhoneWarning(null);
                    }
                } else {
                    setPhoneWarning(null);
                }
            })
            .catch(() => setPhoneWarning(null));
    }, [form.phone]);

    const doctorOptions = doctors.map((d) => ({
        value: d.id,
        label: d.fullName,
    }));

    const handleSubmit = async () => {
        if (!form.firstName.trim() || !form.lastName.trim() || !form.primaryDoctorId) {
            setError("First name, Last name and Primary doctor are required.");
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch(apiUrl("/api/patients"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders(),
                },
                body: JSON.stringify({
                    firstName: form.firstName.trim(),
                    lastName: form.lastName.trim(),
                    profileImage: form.profileImage,
                    phone: form.phone || null,
                    email: form.email || null,
                    primaryDoctorId: form.primaryDoctorId,
                    dob: form.dob ? form.dob.toISOString() : null,
                    gender: form.gender || null,
                    bloodGroup: form.bloodGroup || null,
                    status: form.status || "Active",
                    address1: form.address1 || null,
                    address2: form.address2 || null,
                    country: form.country || "USA",
                    state: form.state || "California",
                    city: form.city || "Los Angeles",
                    pincode: form.pincode || null,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to create patient");
            }

            const createdPatient = await res.json();
            onSuccess(createdPatient);
            onHide();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            title="Add New Patient"
            open={show}
            onCancel={onHide}
            onOk={handleSubmit}
            okText={submitting ? "Saving..." : "Add Patient"}
            confirmLoading={submitting}
            width={900}
            style={{ top: 20 }}
        >
            <div className="p-2" style={{ maxHeight: '70vh', overflowY: 'auto', overflowX: 'hidden' }}>
                {error && <div className="alert alert-danger py-2 fs-13 mb-3">{error}</div>}

                <h6 className="fw-bold mb-3">Patient Information</h6>
                <div className="row">
                    <div className="col-lg-12">
                        <div className="mb-3 d-flex align-items-center">
                            <label className="form-label mb-0 me-3">Profile Image</label>
                            <PatientProfileUpload
                                value={form.profileImage}
                                onChange={(url) => setForm({ ...form, profileImage: url })}
                            />
                        </div>
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label mb-1 fw-medium">First Name *</label>
                        <input
                            type="text"
                            className="form-control"
                            value={form.firstName}
                            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label mb-1 fw-medium">Last Name *</label>
                        <input
                            type="text"
                            className="form-control"
                            value={form.lastName}
                            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label mb-1 fw-medium">Phone Number</label>
                        <PhoneInput
                            defaultCountry="US"
                            value={form.phone}
                            onChange={(v) => setForm({ ...form, phone: v || "" })}
                        />
                        {phoneWarning && (
                            <div className="text-warning fs-12 mt-1">
                                <i className="ti ti-alert-triangle me-1" />
                                {phoneWarning}
                            </div>
                        )}
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label mb-1 fw-medium">Email Address</label>
                        <input
                            type="email"
                            className="form-control"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label mb-1 fw-medium">Primary Doctor *</label>
                        <CommonSelect
                            options={doctorOptions}
                            className="select"
                            value={findSelectOption(doctorOptions, form.primaryDoctorId)}
                            placeholder="Select doctor"
                            onChange={(opt) => setForm({ ...form, primaryDoctorId: opt?.value || "" })}
                        />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label mb-1 fw-medium">DOB</label>
                        <DatePicker
                            className="form-control w-100"
                            format="DD-MM-YYYY"
                            value={form.dob}
                            onChange={(d) => setForm({ ...form, dob: d })}
                        />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label mb-1 fw-medium">Gender</label>
                        <CommonSelect
                            options={Gender}
                            className="select"
                            value={findSelectOption(Gender, form.gender) || Gender[0]}
                            onChange={(opt) => setForm({ ...form, gender: opt?.value || "" })}
                        />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label mb-1 fw-medium">Blood Group</label>
                        <CommonSelect
                            options={Blood_Group}
                            className="select"
                            value={findSelectOption(Blood_Group, form.bloodGroup) || Blood_Group[0]}
                            onChange={(opt) => setForm({ ...form, bloodGroup: opt?.value || "" })}
                        />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label mb-1 fw-medium">Status</label>
                        <CommonSelect
                            options={PATIENT_STATUS_OPTIONS}
                            className="select"
                            value={findSelectOption(PATIENT_STATUS_OPTIONS, form.status)}
                            onChange={(opt) => setForm({ ...form, status: opt?.value || "Active" })}
                        />
                    </div>
                </div>

                <h6 className="fw-bold mb-3 border-top pt-3">Address Information</h6>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label className="form-label mb-1 fw-medium">Address 1</label>
                        <input
                            type="text"
                            className="form-control"
                            value={form.address1}
                            onChange={(e) => setForm({ ...form, address1: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label mb-1 fw-medium">Address 2</label>
                        <input
                            type="text"
                            className="form-control"
                            value={form.address2}
                            onChange={(e) => setForm({ ...form, address2: e.target.value })}
                        />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label mb-1 fw-medium">Country</label>
                        <CommonSelect
                            options={Country}
                            className="select"
                            value={findSelectOption(Country, form.country) || Country[0]}
                            onChange={(opt) => setForm({ ...form, country: opt?.value || "" })}
                        />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label mb-1 fw-medium">State</label>
                        <CommonSelect
                            options={State}
                            className="select"
                            value={findSelectOption(State, form.state) || State[0]}
                            onChange={(opt) => setForm({ ...form, state: opt?.value || "" })}
                        />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label mb-1 fw-medium">City</label>
                        <CommonSelect
                            options={City}
                            className="select"
                            value={findSelectOption(City, form.city) || City[0]}
                            onChange={(opt) => setForm({ ...form, city: opt?.value || "" })}
                        />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label mb-1 fw-medium">Pincode</label>
                        <input
                            type="text"
                            className="form-control"
                            value={form.pincode}
                            onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default AddPatientModal;
