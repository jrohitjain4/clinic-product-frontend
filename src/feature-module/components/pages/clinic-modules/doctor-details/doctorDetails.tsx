import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { all_routes, doctorsListPath } from "../../../../routes/all_routes";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { apiUrl } from "../../../../../core/config/api";
import {
  awardTitle,
  educationTitle,
  formatEducationRange,
  parseJsonArray,
  type StoredAward,
  type StoredEducation,
} from "../../../../../core/utils/doctorProfile";
import { useClinicAppointments } from "../../../../../core/hooks/useClinicAppointments";
import { appointmentToTableRow, statusBadgeClass } from "../../../../../core/utils/appointmentForm";
import Datatable from "../../../../../core/common/dataTable";
import type { ClinicAppointment } from "../../../../../core/types/clinicAppointment";
import AppointmentsModals from "../appointments/appointmentsModals";

type ScheduleSlot = { session?: string; from: string; to: string };

interface DoctorDetail {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  username?: string | null;
  dob?: string | null;
  yearOfExperience?: number | null;
  medicalLicenseNumber?: string | null;
  languagesSpoken?: string[];
  bloodGroup?: string | null;
  gender?: string | null;
  bio?: string | null;
  consultationCharge?: number | null;
  appointmentDuration?: number | null;
  status: string;
  profileImage?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  schedules?: Record<string, ScheduleSlot[]> | null;
  educations?: unknown;
  awards?: unknown;
  certifications?: unknown;
  department?: { id: string; name: string } | null;
  designation?: { id: string; name: string } | null;
  clinic?: { id: string; name: string } | null;
  specializations?: { id: string; name: string }[];
  maritalStatus?: string | null;
  qualification?: string | null;
  followUpEnabled?: boolean;
  followUpValidityDays?: number | null;
  freeFollowUpLimit?: number | null;
  signatureImage?: string | null;
  medicalRegCertificate?: string | null;
  qualificationCertificate?: string | null;
  aadhaarCard?: string | null;
  aadhaarCardBack?: string | null;
  panCard?: string | null;
  alternateMobile?: string | null;
}

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const formatTime12 = (time: string) => {
  if (!time) return "";
  const parts = time.split(":");
  let h = parseInt(parts[0], 10);
  const m = parts[1] ?? "00";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

const formatSlotLabel = (slot: ScheduleSlot) =>
  `${formatTime12(slot.from)} - ${formatTime12(slot.to)}`;

const formatDob = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

const DoctorDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [doctor, setDoctor] = useState<DoctorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState("Monday");
  const { appointments, loading: appointmentsLoading, refetch: refetchAppointments } = useClinicAppointments({ doctorId: id });
  const [selectedAppointment, setSelectedAppointment] = useState<ClinicAppointment | null>(null);

  const patientPath = (patientId: string) =>
    all_routes.patientDetails.replace(":id", patientId);

  useEffect(() => {
    if (!id || id === ":id") {
      setError("Please open a doctor from the Doctors list.");
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token");
    fetch(apiUrl(`/api/doctors/${id}`), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Doctor not found");
        }
        return res.json();
      })
      .then((data: DoctorDetail) => {
        setDoctor(data);
        const sched = data.schedules as Record<string, ScheduleSlot[]> | null;
        const firstDay =
          WEEKDAYS.find((d) => sched?.[d]?.length) ?? WEEKDAYS[0];
        setActiveDay(firstDay);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const scheduleDays = useMemo(() => {
    if (!doctor?.schedules) return [];
    return WEEKDAYS.filter(
      (day) =>
        Array.isArray((doctor.schedules as Record<string, ScheduleSlot[]>)[day]) &&
        (doctor.schedules as Record<string, ScheduleSlot[]>)[day].length > 0
    );
  }, [doctor]);

  const activeSlots = useMemo(() => {
    if (!doctor?.schedules || !activeDay) return [];
    const sched = doctor.schedules as Record<string, ScheduleSlot[]>;
    return sched[activeDay] ?? [];
  }, [doctor, activeDay]);

  const educationList = useMemo(
    () =>
      parseJsonArray<StoredEducation>(doctor?.educations).filter(
        (e) => e.degree?.trim() || e.university?.trim()
      ),
    [doctor]
  );

  const awardsList = useMemo(
    () =>
      parseJsonArray<StoredAward>(doctor?.awards).filter((a) => a.name?.trim()),
    [doctor]
  );

  const certificationsList = useMemo(
    () =>
      parseJsonArray<StoredAward>(doctor?.certifications).filter((a) =>
        a.name?.trim()
      ),
    [doctor]
  );

  const profileImg =
    doctor?.profileImage || "assets/img/doctor-placeholder.png";
  const statusLabel = doctor?.status === "Active" ? "Available" : (doctor?.status === "Inactive" ? "Unable" : doctor?.status);
  const location = [doctor?.address1, doctor?.city, doctor?.state, doctor?.country]
    .filter(Boolean)
    .join(", ");

  const appointmentColumns = [
    {
      title: "ID",
      dataIndex: "Code",
      render: (text: string, record: any) => (
        <Link
          to="#"
          className="text-primary fw-medium"
          data-bs-toggle="offcanvas"
          data-bs-target="#view_details"
          onClick={() => setSelectedAppointment(record._raw)}
        >
          {text}
        </Link>
      ),
      sorter: (a: any, b: any) => a.Code.localeCompare(b.Code),
    },
    {
      title: "Patient",
      dataIndex: "Patient",
      render: (text: string, record: any) => (
        <div className="d-flex align-items-center">
          <Link to={patientPath(record._raw.patientId)} className="avatar avatar-sm me-2 flex-shrink-0">
            <ImageWithBasePath
              src={record.Patient_Image}
              alt="Patient"
              className="rounded-circle"
            />
          </Link>
          <h6 className="fs-14 mb-0">
            <Link to={patientPath(record._raw.patientId)} className="text-dark fw-semibold">
              {text}
            </Link>
          </h6>
        </div>
      ),
      sorter: (a: any, b: any) => a.Patient.localeCompare(b.Patient),
    },
    {
      title: "Date & Time",
      dataIndex: "Date_Time",
      sorter: (a: any, b: any) => a.Date_Time.localeCompare(b.Date_Time),
    },
    {
      title: "Mode",
      dataIndex: "Mode",
      sorter: (a: any, b: any) => a.Mode.localeCompare(b.Mode),
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => (
        <span className={`fs-12 badge rounded-pill fw-medium ${statusBadgeClass(text)}`}>
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => a.Status.localeCompare(b.Status),
    },
  ];

  const appointmentTableData = useMemo(() => {
    return appointments.map((a, i) => appointmentToTableRow(a, i));
  }, [appointments]);

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content text-center py-5">
          <span className="spinner-border text-primary" role="status" />
          <p className="text-muted mt-2 mb-0">Loading doctor details…</p>
        </div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <Link to={doctorsListPath()} className="btn btn-light mb-3">
            <i className="ti ti-chevron-left me-1" />
            Back to Doctors
          </Link>
          <div className="alert alert-danger">{error || "Doctor not found"}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content pb-0 pt-1">
        <div className="mb-2">
          <h6 className="fw-semibold fs-14 mb-0">
            <Link to={doctorsListPath()}>
              <i className="ti ti-chevron-left me-1" />
              Doctors
            </Link>
          </h6>
        </div>

        <div className="card mb-2">
          <div className="card-body d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <div className="d-flex align-items-center flex-sm-nowrap flex-wrap row-gap-3">
              <div className="me-3 doctor-profile-img">
                <ImageWithBasePath src={profileImg} className="rounded" alt={doctor.fullName} />
              </div>
              <div className="flex-fill">
                <div className="d-flex align-items-center mb-1 flex-wrap gap-2">
                  <h6 className="mb-0 fw-semibold">{doctor.fullName}</h6>
                  {doctor.department?.name && (
                    <span className="badge border bg-white text-dark fw-medium">
                      <i className="ti ti-point-filled me-1 text-info" />
                      {doctor.department.name}
                    </span>
                  )}
                </div>
                <span className="d-block mb-3 fs-13">
                  {doctor.designation?.name || "Doctor"}
                  {doctor.medicalLicenseNumber
                    ? ` · License: ${doctor.medicalLicenseNumber}`
                    : ""}
                  {doctor.specializations && doctor.specializations.length > 0
                    ? ` · Specializations: ${doctor.specializations.map(s => s.name).join(", ")}`
                    : ""}
                </span>
                <div className="d-flex align-items-center flex-wrap gap-2">
                  <p className="mb-0 fs-13">
                    <i className="ti ti-building-hospital me-1" />
                    Clinic : {doctor.clinic?.name || "—"}
                  </p>
                  <span
                    className={`badge fw-medium ${statusLabel === "Available"
                      ? "badge-soft-success"
                      : "badge-soft-danger"
                      }`}
                  >
                    <i
                      className={`ti ti-point-filled me-1 ${statusLabel === "Available" ? "text-success" : "text-danger"
                        }`}
                    />
                    {statusLabel}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <p className="mb-2">Consultation Charge</p>
              <h6 className="fs-18 fw-bold mb-3">
                ₹{doctor.consultationCharge ?? "—"}
                <span className="fw-normal text-body fs-14">
                  {" "}
                  / {doctor.appointmentDuration ?? 30} Min
                </span>
              </h6>
              <Link
                to={`${all_routes.newAppointment}?doctorId=${doctor.id}&departmentId=${doctor.department?.id || ""}`}
                className="btn btn-primary"
              >
                <i className="ti ti-calendar-event me-1" />
                Book Appointment
              </Link>
            </div>
          </div>
        </div>

        <div className="row gx-3">
          <div className="col-xxl-8 col-xl-8 col-lg-7 col-md-12">
            <div className="card mb-2">
              <div className="card-body">
                <h5 className="fw-bold mb-3">Availability</h5>
                {scheduleDays.length > 0 ? (
                  <>
                    <ul className="nav nav-tabs nav-bordered nav-border-bottom mb-3">
                      {scheduleDays.map((day) => (
                        <li key={day} className="nav-item flex-fill">
                          <button
                            type="button"
                            className={`nav-link text-center w-100 fw-semibold ${activeDay === day ? "active" : ""
                              }`}
                            onClick={() => setActiveDay(day)}
                          >
                            {day}
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="d-flex align-items-center flex-wrap gap-2">
                      {activeSlots.map((slot, idx) => (
                        <span
                          key={`${activeDay}-${idx}`}
                          className="d-inline-flex align-items-center bg-light rounded flex-fill text-center justify-content-center p-2 text-dark"
                          style={{ minWidth: "140px" }}
                        >
                          {slot.session ? `${slot.session}: ` : ""}
                          {formatSlotLabel(slot)}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-muted mb-0">No schedule added for this doctor.</p>
                )}
              </div>
            </div>

            <div className="card mb-2">
              <div className="card-body">
                <h5 className="fw-bold mb-3">Short Bio</h5>
                <p className="mb-0">{doctor.bio || "No bio provided."}</p>
              </div>
            </div>

            {doctor.followUpEnabled && (
              <div className="card border-primary">
                <div className="card-body">
                  <h5 className="fw-bold text-primary mb-3">
                    <i className="ti ti-refresh-dot me-2" />
                    Follow-up Policy
                  </h5>
                  <div className="row">
                    <div className="col-md-6 mb-2">
                      <p className="mb-1 text-muted fs-13">Validity Period</p>
                      <h6 className="fw-semibold">
                        {doctor.followUpValidityDays != null
                          ? `${doctor.followUpValidityDays} Days`
                          : "Not specified"}
                      </h6>
                    </div>
                    <div className="col-md-6 mb-2">
                      <p className="mb-1 text-muted fs-13">Free Visits limit</p>
                      <h6 className="fw-semibold">
                        {doctor.freeFollowUpLimit != null
                          ? `${doctor.freeFollowUpLimit} Visits`
                          : "Unlimited"}
                      </h6>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="card mb-2">
              <div className="card-body">
                <h5 className="fw-bold mb-3">Education Information</h5>
                {educationList.length > 0 ? (
                  <ul className="activity-feed rounded mb-0">
                    {educationList.map((edu, idx) => (
                      <li
                        key={`edu-${idx}`}
                        className="feed-item timeline-item"
                      >
                        <h6 className="fw-bold mb-2">{educationTitle(edu)}</h6>
                        <p className="mb-0 text-muted">
                          {formatEducationRange(edu.from, edu.to) ||
                            "Dates not specified"}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted mb-0">
                    No education information added.
                  </p>
                )}
              </div>
            </div>

            <div className="card mb-2">
              <div className="card-body">
                <h5 className="fw-bold mb-3">Awards &amp; Recognition</h5>
                {awardsList.length > 0 ? (
                  awardsList.map((award, idx) => (
                    <div
                      key={`award-${idx}`}
                      className={idx < awardsList.length - 1 ? "mb-3" : ""}
                    >
                      <div className="d-flex align-items-center mb-2">
                        <span className="me-2">
                          <i className="ti ti-award" />
                        </span>
                        <h6 className="mb-0 fw-bold">{awardTitle(award)}</h6>
                      </div>
                      <p className="mb-0">
                        {award.description?.trim() || "—"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted mb-0">No awards added.</p>
                )}
              </div>
            </div>

            <div className="card mb-2">
              <div className="card-body">
                <h5 className="fw-bold mb-3">Certifications</h5>
                {certificationsList.length > 0 ? (
                  certificationsList.map((cert, idx) => (
                    <div
                      key={`cert-${idx}`}
                      className={idx < certificationsList.length - 1 ? "mb-3" : ""}
                    >
                      <div className="d-flex align-items-center mb-2">
                        <span className="me-2">
                          <i className="ti ti-award" />
                        </span>
                        <h6 className="mb-0 fw-bold">{awardTitle(cert)}</h6>
                      </div>
                      <p className="mb-0">
                        {cert.description?.trim() || "—"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted mb-0">No certifications added.</p>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 className="fw-bold mb-0">Recent Appointments</h5>
                  <Link to={all_routes.appointments} className="btn btn-sm btn-soft-primary">
                    View All
                  </Link>
                </div>
                {appointmentsLoading ? (
                  <div className="text-center py-4">
                    <span className="spinner-border spinner-border-sm text-primary" />
                  </div>
                ) : appointmentTableData.length > 0 ? (
                  <div className="appointment-table doctor-appointments">
                    <Datatable
                      columns={appointmentColumns}
                      dataSource={appointmentTableData}
                      Selection={false}
                      searchText=""
                    />
                  </div>
                ) : (
                  <p className="text-muted mb-0">No appointments found for this doctor.</p>
                )}
              </div>
            </div>
          </div>

          <div className="col-xxl-4 col-xl-4 col-lg-5 col-md-12 theiaStickySidebar">
            <div className="card mb-2">
              <div className="card-body">
                <h6 className="fw-bold mb-3">About</h6>
                <AboutRow
                  icon="ti-file"
                  label="Medical License Number"
                  value={doctor.medicalLicenseNumber || "—"}
                />
                <AboutRow icon="ti-phone" label="Phone Number" value={doctor.phone || "—"} />
                <AboutRow icon="ti-phone-call" label="Alternate Mobile" value={doctor.alternateMobile || "—"} />
                <AboutRow icon="ti-mail" label="Email Address" value={doctor.email || "—"} />
                <AboutRow icon="ti-map-pin-check" label="Location" value={location || "—"} />
                <AboutRow icon="ti-calendar-event" label="DOB" value={formatDob(doctor.dob)} />
                <AboutRow icon="ti-droplet" label="Blood Group" value={doctor.bloodGroup || "—"} />
                <AboutRow
                  icon="ti-user-check"
                  label="Year of Experience"
                  value={
                    doctor.yearOfExperience != null
                      ? `${doctor.yearOfExperience}+ Years`
                      : "—"
                  }
                />
                <AboutRow icon="ti-gender-male" label="Gender" value={doctor.gender || "—"} />
                <AboutRow icon="ti-rings" label="Marital Status" value={doctor.maritalStatus || "—"} />
                <AboutRow icon="ti-certificate" label="Qualification" value={doctor.qualification || "—"} />
                {doctor.languagesSpoken && doctor.languagesSpoken.length > 0 && (
                  <AboutRow
                    icon="ti-language"
                    label="Languages"
                    value={doctor.languagesSpoken.join(", ")}
                  />
                )}
              </div>
            </div>
            <div className="card mb-2">
              <div className="card-body p-3">
                <h6 className="fw-bold mb-3">Documents & Certificates</h6>
                <div className="d-flex flex-column gap-3">
                  <DocumentRow label="Doctor Signature" url={doctor.signatureImage} />
                  <DocumentRow label="Medical Registration" url={doctor.medicalRegCertificate} />
                  <DocumentRow label="Qualification Certificate" url={doctor.qualificationCertificate} />
                  <DocumentRow label="Aadhaar Card (Front)" url={doctor.aadhaarCard} />
                  <DocumentRow label="Aadhaar Card (Back)" url={doctor.aadhaarCardBack} />
                  <DocumentRow label="PAN Card" url={doctor.panCard} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer text-center bg-white p-2 border-top">
        <p className="text-dark mb-0">
          2025 © <Link to="#" className="link-primary">Docyori</Link>, All Rights Reserved
        </p>
      </div>

      <AppointmentsModals
        selected={selectedAppointment}
        onClear={() => setSelectedAppointment(null)}
        onDeleted={refetchAppointments}
      />
    </div>
  );
};

const AboutRow = ({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) => (
  <div className="d-flex align-items-center mb-3">
    <span className="avatar rounded-circle bg-light text-dark fs-16 flex-shrink-0 me-2">
      <i className={`ti ${icon}`} />
    </span>
    <div>
      <h6 className="fw-semibold fs-13 mb-1">{label}</h6>
      <p className="mb-0">{value}</p>
    </div>
  </div>
);

const DocumentRow = ({ label, url }: { label: string; url?: string | null }) => {
  if (!url) {
    return (
      <div className="d-flex align-items-center justify-content-between">
        <p className="mb-0 fs-14 fw-medium text-muted">{label}</p>
        <span className="badge badge-soft-dark"><i className="ti ti-x me-1" />Missing</span>
      </div>
    );
  }
  return (
    <div className="d-flex align-items-center justify-content-between">
      <p className="mb-0 fs-14 fw-medium text-dark">{label}</p>
      <a href={apiUrl(url)} target="_blank" rel="noreferrer" className="btn btn-sm btn-light">
        <i className="ti ti-download me-1" />
        View
      </a>
    </div>
  );
};

export default DoctorDetails;
