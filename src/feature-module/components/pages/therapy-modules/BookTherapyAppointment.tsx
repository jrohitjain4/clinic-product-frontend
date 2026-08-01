import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { apiGet, apiPost } from "../../../../core/utils/apiClient";
import AddPatientModal from "../clinic-modules/appointments/modals/addPatientModal";
import { IconFormControl, IconTextarea } from "../../../../core/common/form-fields";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface Therapist {
  id: string;
  fullName: string;
  consultationCharge?: number | null;
}

interface TherapyCategory {
  id: string;
  name: string;
}

interface Therapy {
  id: string;
  serviceName: string;
  price: number;
  duration?: string | number;
}

interface Slot {
  time: string;
  label: string;
  available: boolean;
  bookingsAvailable: number;
}

const BookTherapyAppointment = () => {
  const navigate = useNavigate();

  // Booking details
  const [apptCode, setApptCode] = useState("");
  const [patientId, setPatientId] = useState("");
  const [therapistId, setTherapistId] = useState("");
  const [apptDate, setApptDate] = useState("");
  const [apptTime, setApptTime] = useState("");
  const [mode, setMode] = useState("Offline"); // Offline, Online, Home Visit
  const [onlineLink, setOnlineLink] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [reason, setReason] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [therapyId, setTherapyId] = useState("");
  const [status, setStatus] = useState("Confirmed");

  // Fee Details
  const [consultationFee, setConsultationFee] = useState("0");
  const [discountType, setDiscountType] = useState("none"); // none, percentage, fixed
  const [discountValue, setDiscountValue] = useState("0");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [finalFee, setFinalFee] = useState("0");

  // Notifications
  const [whatsappNotification, setWhatsappNotification] = useState(false);

  // Master Data lists
  const [patients, setPatients] = useState<Patient[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [categories, setCategories] = useState<TherapyCategory[]>([]);
  const [therapies, setTherapies] = useState<Therapy[]>([]);

  // Slots Loading & Availability State
  const [availability, setAvailability] = useState<any>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [showSlotsDropdown, setShowSlotsDropdown] = useState(false);

  // Add Patient Modal State
  const [showAddPatient, setShowAddPatient] = useState(false);

  // Modals / Success Slip State
  const [showSlip, setShowSlip] = useState(false);
  const [bookedDetails, setBookedDetails] = useState<any>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close slots dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSlotsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Generate Booking Code
  useEffect(() => {
    const codeNum = Math.floor(1000 + Math.random() * 9000);
    setApptCode(`APT-TH-${codeNum}`);
  }, []);

  // Fetch lists on load
  const fetchData = async () => {
    try {
      const [patList, docList, catList, servList] = await Promise.all([
        apiGet<Patient[]>("/api/patients"),
        apiGet<Therapist[]>("/api/doctors?type=therapist"),
        apiGet<TherapyCategory[]>("/api/specializations?type=therapy"),
        apiGet<Therapy[]>("/api/services?type=therapy"),
      ]);

      setPatients(Array.isArray(patList) ? patList : []);
      setTherapists(Array.isArray(docList) ? docList : []);
      setCategories(Array.isArray(catList) ? catList : []);
      setTherapies(Array.isArray(servList) ? servList : []);
    } catch (err) {
      toast.error("Failed to load master lists");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper to parse availability schedules and generate slot options
  const calculateAvailableSlots = (avail: any, dateString: string): Slot[] => {
    if (!avail || !dateString) return [];

    const dateObj = dayjs(dateString);
    const dayName = dateObj.format("dddd");
    const dateStr = dateObj.format("YYYY-MM-DD");

    // Check if Holiday
    const isHoliday = avail.holidays?.some((h: any) => {
      const start = dayjs(h.date).startOf("day");
      const end = h.endDate ? dayjs(h.endDate).endOf("day") : start.endOf("day");
      return (dateObj.isAfter(start) || dateObj.isSame(start)) && (dateObj.isBefore(end) || dateObj.isSame(end));
    });
    if (isHoliday) return [];

    // Check doctor leaves
    const isLeave = avail.leaves?.some((l: any) => {
      const s = dayjs(l.start).startOf("day");
      const e = dayjs(l.end).endOf("day");
      return (dateObj.isAfter(s) || dateObj.isSame(s)) && (dateObj.isBefore(e) || dateObj.isSame(e));
    });
    if (isLeave) return [];

    // Check clinic off-days
    const dayIndex = dateObj.day();
    const offDays = avail.clinicWorkingDays || [0];
    if (offDays.includes(dayIndex)) return [];

    // Get doctor schedules for this day
    const daySchedule = avail.schedules?.[dayName];
    if (!Array.isArray(daySchedule) || daySchedule.length === 0) return [];

    const selectedTherapy = therapies.find((t) => t.id === therapyId);
    let therapyDuration = 30;
    if (selectedTherapy?.duration) {
      therapyDuration = parseInt(String(selectedTherapy.duration)) || 30;
    }
    const duration = therapyDuration;
    const maxBookings = avail.maxBookingsPerSlot || 1;
    const list: Slot[] = [];

    daySchedule.forEach((session: any) => {
      if (!session.from || !session.to) return;

      const [fromH, fromM] = session.from.split(":").map(Number);
      const [toH, toM] = session.to.split(":").map(Number);

      let currentMin = fromH * 60 + fromM;
      const endMin = toH * 60 + toM;

      while (currentMin < endMin) {
        const h = Math.floor(currentMin / 60);
        const m = currentMin % 60;
        const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

        // Format label
        const ampm = h >= 12 ? "PM" : "AM";
        const displayH = h % 12 || 12;
        const label = `${String(displayH).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;

        // Filter bookings at this time slot
        const bookedCount = avail.appointments?.filter((appt: any) => {
          return (
            dayjs(appt.start).format("YYYY-MM-DD") === dateStr &&
            dayjs(appt.start).format("HH:mm") === timeStr
          );
        }).length || 0;

        const bookingsAvailable = Math.max(0, maxBookings - bookedCount);

        list.push({
          time: timeStr,
          label,
          available: bookingsAvailable > 0,
          bookingsAvailable,
        });

        currentMin += duration;
      }
    });

    return list;
  };

  // Fetch doctor availability whenever doctor selection changes (pulls a 3-month schedule window)
  useEffect(() => {
    const loadAvailability = async () => {
      if (!therapistId) {
        setAvailability(null);
        setSlots([]);
        setApptTime("");
        return;
      }
      setLoadingSlots(true);
      try {
        const start = dayjs().startOf("month").subtract(1, "month").format("YYYY-MM-DD");
        const end = dayjs().endOf("month").add(2, "month").format("YYYY-MM-DD");

        const data = await apiGet<any>(
          `/api/doctors/${therapistId}/availability?startDate=${start}&endDate=${end}`
        );
        setAvailability(data);
      } catch (err) {
        console.error("Failed to load doctor schedule slots", err);
        setAvailability(null);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadAvailability();
  }, [therapistId]);

  // Compute available slots whenever availability, selected date, or therapy selection changes
  useEffect(() => {
    if (!availability || !apptDate) {
      setSlots([]);
      setApptTime("");
      return;
    }
    const computed = calculateAvailableSlots(availability, apptDate);
    setSlots(computed);
    setApptTime(""); // Reset selected slot
  }, [availability, apptDate, therapyId, therapies]);

  // Auto fee mapping when therapist changes
  useEffect(() => {
    if (therapistId) {
      const selected = therapists.find((t) => t.id === therapistId);
      if (selected && selected.consultationCharge !== undefined && selected.consultationCharge !== null) {
        setConsultationFee(String(selected.consultationCharge));
      }
    }
  }, [therapistId, therapists]);



  // Real-time Fee calculation
  useEffect(() => {
    const base = parseFloat(consultationFee) || 0;
    const value = parseFloat(discountValue) || 0;
    let discAmt = 0;

    if (discountType === "percentage") {
      discAmt = (base * value) / 100;
    } else if (discountType === "fixed") {
      discAmt = value;
    }

    setDiscountAmount(discAmt.toFixed(2));
    setFinalFee(Math.max(0, base - discAmt).toFixed(2));
  }, [consultationFee, discountType, discountValue]);

  // Submit Booking Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !therapistId || !apptDate || !apptTime) {
      toast.error("Please fill in all mandatory fields");
      return;
    }

    let timeStr = apptTime;
    if (timeStr.split(":").length === 2) {
      timeStr = `${timeStr}:00`;
    }
    const scheduledAtStr = `${apptDate}T${timeStr}`;

    try {
      const response = await apiPost<any>("/api/appointments", {
        patientId,
        doctorId: therapistId,
        scheduledAt: new Date(scheduledAtStr).toISOString(),
        mode,
        onlineLink: mode === "Online" ? onlineLink : null,
        homeAddress: mode === "Home Visit" ? homeAddress : null,
        appointmentType: "therapy",
        status: status,
        reason: reason || null,
        isFollowUp: false,
        paymentStatus: "Unpaid",
        therapyCategoryId: categoryId || null,
        therapyId: therapyId || null,
        consultationFee: parseFloat(consultationFee),
        discountType,
        discountValue: parseFloat(discountValue),
        discountAmount: parseFloat(discountAmount),
        finalFee: parseFloat(finalFee),
        whatsappNotification,
      });

      toast.success("Therapy appointment booked successfully!");
      navigate("/therapy-appointments");
    } catch (err: any) {
      toast.error(err.message || "Failed to book appointment");
    }
  };

  // Ant Design DatePicker cell renderer for availability color coding
  const cellRender = (current: Dayjs | any, info: any) => {
    if (info.type !== "date" || !availability || !dayjs.isDayjs(current)) return info.originNode;

    const dayName = current.format("dddd");

    // 1. Holiday (Blue)
    const isHoliday = availability.holidays?.some((h: any) => {
      const start = dayjs(h.date).startOf("day");
      const end = h.endDate ? dayjs(h.endDate).endOf("day") : start.endOf("day");
      return (current.isAfter(start) || current.isSame(start)) && (current.isBefore(end) || current.isSame(end));
    });
    if (isHoliday) {
      return (
        <div className="ant-picker-cell-inner" style={{ backgroundColor: "#e6f7ff", border: "1px solid #91d5ff", borderRadius: "4px", color: "#0050b3" }}>
          {current.date()}
        </div>
      );
    }

    // 2. Clinic Off Day (Orange/Yellow)
    const clinicOffDays = availability.clinicWorkingDays || [0];
    const dayOfWeek = current.day();
    if (clinicOffDays.includes(dayOfWeek)) {
      return (
        <div className="ant-picker-cell-inner" style={{ backgroundColor: "#fff7e6", border: "1px solid #ffd591", borderRadius: "4px", color: "#d46b08" }}>
          {current.date()}
        </div>
      );
    }

    const daySchedule = availability.schedules?.[dayName];
    const isWorking = Array.isArray(daySchedule) && daySchedule.length > 0;

    // 3. Therapist Weekly Off (Red)
    if (!isWorking) {
      return (
        <div className="ant-picker-cell-inner" style={{ backgroundColor: "#fff1f0", border: "1px solid #ffa39e", borderRadius: "4px", color: "#a8071a" }}>
          {current.date()}
        </div>
      );
    }

    // 4. Therapist Leave (Yellow)
    const isLeave = availability.leaves?.some((l: any) => {
      const s = dayjs(l.start).startOf("day");
      const e = dayjs(l.end).endOf("day");
      return (current.isAfter(s) || current.isSame(s)) && (current.isBefore(e) || current.isSame(e));
    });
    if (isLeave) {
      return (
        <div className="ant-picker-cell-inner" style={{ backgroundColor: "#fffbe6", border: "1px solid #ffe58f", borderRadius: "4px", color: "#874d00" }}>
          {current.date()}
        </div>
      );
    }

    // 5. Working Day (Green)
    if (isWorking) {
      return (
        <div className="ant-picker-cell-inner" style={{ backgroundColor: "#f6ffed", border: "1px solid #b7eb8f", borderRadius: "4px", color: "#237804" }}>
          {current.date()}
        </div>
      );
    }

    return info.originNode;
  };

  const isSlotBookingActive = useMemo(() => {
    return !!(
      availability &&
      availability.duration &&
      availability.duration > 0 &&
      availability.maxBookingsPerSlot &&
      availability.maxBookingsPerSlot > 0
    );
  }, [availability]);

  // Build session options for the Shift/Session dropdown if slot booking is not active
  const sessionOptions = useMemo(() => {
    if (!availability || !apptDate) return [];
    const dateObj = dayjs(apptDate);
    const dayName = dateObj.format("dddd");
    const daySchedule = availability.schedules?.[dayName];
    if (!Array.isArray(daySchedule) || daySchedule.length === 0) return [];

    return daySchedule.map((session: any, idx: number) => {
      const sessionLabel = session.label || (idx === 0 ? "Morning Session" : idx === 1 ? "Evening Session" : `Session ${idx + 1}`);
      const fromFormatted = dayjs(session.from, "HH:mm").format("hh:mm A");
      const toFormatted = dayjs(session.to, "HH:mm").format("hh:mm A");

      const isTwentyFourSeven = 
        session.session === "24 Hours Available" || 
        session.label === "24 Hours Available" ||
        (session.from === "00:00:00" && session.to === "23:59:00") ||
        (session.from === "00:00" && session.to === "23:59") ||
        (session.from === "00:00:00" && session.to === "23:59:59") ||
        (session.from === "00:00" && session.to === "23:59:59");

      return {
        value: session.from,
        label: isTwentyFourSeven 
          ? "24 Hours Available" 
          : `${sessionLabel}: ${fromFormatted} – ${toFormatted}`,
      };
    });
  }, [availability, apptDate]);

  return (
    <div className="page-wrapper">
      <div className="content book-therapy-page">
        <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4 pb-3 border-bottom no-print">
          <div className="d-flex align-items-center gap-3 min-w-0">
            <div className="bt-page-icon d-flex align-items-center justify-content-center flex-shrink-0">
              <i className="ti ti-calendar-plus" />
            </div>
            <div className="min-w-0">
              <h4 className="fw-bold mb-0 text-dark">Book Therapy Appointment</h4>
              <p className="text-muted fs-13 mb-0">
                Schedule a session sequence with active therapists
              </p>
            </div>
          </div>
          <Link
            to="/therapy-appointments"
            className="btn btn-outline-primary d-inline-flex align-items-center justify-content-center gap-1 flex-shrink-0 no-print"
            style={{ minHeight: 38, borderRadius: 8 }}
          >
            <i className="ti ti-arrow-left" /> Back to Bookings
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="no-print">
          <div className="row g-3">
            <div className="col-lg-8">
              <div className="bt-card bg-white border mb-3 overflow-hidden">
                <div className="bt-card-head d-flex align-items-center gap-3 px-3 px-md-4 py-3">
                  <div className="bt-section-icon" style={{ background: "#e8f1ff", color: "#0d6efd" }}>
                    <i className="ti ti-clipboard-list" />
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold text-dark fs-16">Appointment Details</h5>
                    <span className="fs-12 text-muted">Patient, therapist, schedule & mode</span>
                  </div>
                </div>
                <div className="px-3 px-md-4 py-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Patient <span className="text-danger">*</span>
                      </label>
                      <div className="d-flex gap-2">
                        <select
                          className="form-select"
                          required
                          value={patientId}
                          onChange={(e) => setPatientId(e.target.value)}
                        >
                          <option value="">Select Patient</option>
                          {patients.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.firstName} {p.lastName} ({p.phone})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="bt-add-patient-btn"
                          onClick={() => setShowAddPatient(true)}
                          title="Register New Patient"
                        >
                          <i className="ti ti-plus" />
                        </button>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Appointment ID (Auto)</label>
                      <IconFormControl
                        type="text"
                        fieldLabel="invoice"
                        className="bg-light"
                        readOnly
                        value={apptCode}
                        placeholder="Appointment ID (Auto)"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Therapist <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        required
                        value={therapistId}
                        onChange={(e) => setTherapistId(e.target.value)}
                      >
                        <option value="">Select Therapist</option>
                        {therapists.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.fullName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6 d-flex flex-column">
                      <label className="form-label fw-semibold">
                        Appointment Date <span className="text-danger">*</span>
                      </label>
                      <DatePicker
                        className="form-control"
                        style={{ height: "38px" }}
                        value={apptDate ? dayjs(apptDate) : null}
                        onChange={(date) => {
                          setApptDate(date ? date.format("YYYY-MM-DD") : "");
                        }}
                        disabled={!therapistId}
                        cellRender={cellRender}
                        format="DD-MM-YYYY"
                        placeholder="Select Date"
                      />
                    </div>

                    <div className="col-md-6">
                      <div className="mb-0">
                        {isSlotBookingActive ? (
                          <div className="position-relative" ref={dropdownRef}>
                            <label className="form-label fw-semibold">
                              Shift / Session<span className="text-danger ms-1">*</span>
                            </label>
                            <div
                              onClick={() => {
                                if (apptDate && slots.length > 0) {
                                  setShowSlotsDropdown(!showSlotsDropdown);
                                }
                              }}
                              tabIndex={0}
                              className="form-control d-flex align-items-center justify-content-between"
                              style={{
                                minHeight: "46px",
                                borderRadius: "12px",
                                border: showSlotsDropdown ? "1.5px solid #4f46e5" : "1.5px solid #cbd5e1",
                                boxShadow: showSlotsDropdown ? "0 0 0 3px rgba(79,70,229,0.12)" : "none",
                                fontSize: "15px",
                                fontWeight: "500",
                                padding: "8px 16px",
                                cursor: !apptDate || slots.length === 0 ? "not-allowed" : "pointer",
                                backgroundColor: !apptDate || slots.length === 0 ? "#f8fafc" : "white",
                                transition: "all 0.2s ease-in-out",
                                outline: "none",
                              }}
                            >
                              <span className={apptTime ? "text-dark fw-semibold" : "text-muted"}>
                                {!apptDate
                                  ? "Select date first"
                                  : slots.length === 0
                                    ? "No slots available on this day"
                                    : apptTime
                                      ? dayjs(apptTime, "HH:mm").format("hh:mm A")
                                      : "Select slot"}
                              </span>
                              <i
                                className={`ti ti-chevron-${showSlotsDropdown ? "up" : "down"} text-secondary`}
                                style={{ fontSize: "12px" }}
                              />
                            </div>

                            {showSlotsDropdown && apptDate && slots.length > 0 && (
                              <div
                                className="position-absolute w-100 mt-1 p-3 border rounded shadow bg-white"
                                style={{
                                  zIndex: 1050,
                                  borderRadius: "12px",
                                  borderColor: "#cbd5e1",
                                  maxHeight: "300px",
                                  overflowY: "auto",
                                }}
                              >
                                <div className="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom">
                                  <span className="small text-muted fw-bold">AVAILABLE SLOTS</span>
                                  <span
                                    className="badge px-2 py-0.5 rounded-pill fs-11"
                                    style={{ backgroundColor: "#eef2ff", color: "#6366f1" }}
                                  >
                                    {slots.length} Options
                                  </span>
                                </div>
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                                    gap: "8px",
                                  }}
                                >
                                  {slots.map((opt: any, idx: number) => {
                                    const isSelected = apptTime === opt.time;
                                    const isFilled = opt.bookingsAvailable === 0;
                                    const isLastSlot = opt.bookingsAvailable === 1;

                                    let bg = "#ecfdf5";
                                    let border = "#a7f3d0";
                                    let text = "#047857";
                                    let badgeText = `${opt.bookingsAvailable} Left`;

                                    if (isFilled) {
                                      bg = "#fef2f2";
                                      border = "#fca5a5";
                                      text = "#ef4444";
                                      badgeText = "Filled";
                                    } else if (isLastSlot) {
                                      bg = "#fff7ed";
                                      border = "#fdba74";
                                      text = "#f97316";
                                      badgeText = "Last Slot";
                                    }

                                    if (isSelected) {
                                      bg = "#4f46e5";
                                      border = "#4f46e5";
                                      text = "#ffffff";
                                    }

                                    return (
                                      <div
                                        key={opt.time || idx}
                                        onClick={() => {
                                          if (isFilled) {
                                            toast.warning("This slot is already filled.");
                                            return;
                                          }
                                          setApptTime(opt.time);
                                          setShowSlotsDropdown(false);
                                        }}
                                        className="text-center px-2 py-2 select-slot-block cursor-pointer"
                                        style={{
                                          borderRadius: "8px",
                                          border: `1px solid ${border}`,
                                          backgroundColor: bg,
                                          color: text,
                                          cursor: isFilled ? "not-allowed" : "pointer",
                                          opacity: isFilled && !isSelected ? 0.6 : 1,
                                        }}
                                      >
                                        <div className="fw-bold" style={{ fontSize: "13px" }}>
                                          {dayjs(opt.time, "HH:mm").format("hh:mm A")}
                                        </div>
                                        <div className="fw-semibold mt-1" style={{ fontSize: "10px", opacity: 0.9 }}>
                                          {badgeText}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <label className="form-label fw-semibold">
                              Shift / Session<span className="text-danger ms-1">*</span>
                            </label>
                            <select
                              className="form-select"
                              required
                              value={apptTime}
                              onChange={(e) => setApptTime(e.target.value)}
                              disabled={!apptDate || sessionOptions.length === 0}
                              style={{
                                minHeight: "46px",
                                borderRadius: "12px",
                              }}
                            >
                              <option value="">
                                {!apptDate
                                  ? "Select date first"
                                  : sessionOptions.length > 0
                                    ? "Select session"
                                    : "No shifts available on this day"}
                              </option>
                              {sessionOptions.map((opt: any) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="mb-0">
                        <label className="form-label fw-semibold">
                          Status<span className="text-danger ms-1">*</span>
                        </label>
                        <select
                          className="form-select"
                          required
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          style={{
                            minHeight: "46px",
                            borderRadius: "12px",
                          }}
                        >
                          <option value="Schedule">Schedule</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Checked In">Checked In</option>
                          <option value="Checked Out">Checked Out</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        Appointment Mode <span className="text-danger">*</span>
                      </label>
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        {[
                          { name: "Offline", label: "Offline", icon: "ti ti-building-hospital" },
                          { name: "Online", label: "Online", icon: "ti ti-video" },
                          { name: "Home Visit", label: "Home Visit", icon: "ti ti-home" },
                        ].map((m) => (
                          <button
                            key={m.name}
                            type="button"
                            className={`bt-mode-chip ${mode === m.name ? "active" : ""}`}
                            onClick={() => {
                              setMode(m.name);
                              setOnlineLink("");
                              setHomeAddress("");
                            }}
                          >
                            <i className={m.icon} />
                            {m.label}
                          </button>
                        ))}
                      </div>

                      {mode === "Online" && (
                        <IconFormControl
                          fieldLabel="url"
                          type="url"
                          className="mb-2"
                          placeholder="Input video meeting link (e.g. Zoom, Google Meet)"
                          required
                          value={onlineLink}
                          onChange={(e) => setOnlineLink(e.target.value)}
                        />
                      )}

                      {mode === "Home Visit" && (
                        <IconTextarea
                          fieldLabel="address"
                          className="mb-2"
                          rows={2}
                          placeholder="Input Home Visit Address"
                          required
                          value={homeAddress}
                          onChange={(e) => setHomeAddress(e.target.value)}
                        />
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Therapy Category (Optional)</label>
                      <select
                        className="form-select"
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                      >
                        <option value="">Select Category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Therapy (Optional)</label>
                      <select
                        className="form-select"
                        value={therapyId}
                        onChange={(e) => setTherapyId(e.target.value)}
                      >
                        <option value="">Select Therapy</option>
                        {therapies.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.serviceName} (₹{t.price})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">Reason of Appointment (Optional)</label>
                      <IconTextarea
                        fieldLabel="description"
                        rows={2}
                        placeholder="Provide details or remarks..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="bt-card bg-white border mb-3 overflow-hidden">
                <div className="bt-card-head d-flex align-items-center gap-3 px-3 px-md-4 py-3">
                  <div className="bt-section-icon" style={{ background: "#e8f8ef", color: "#198754" }}>
                    <i className="ti ti-receipt" />
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold text-dark fs-16">Fees & Billing</h5>
                    <span className="fs-12 text-muted">Charges, discount & confirm</span>
                  </div>
                </div>
                <div className="px-3 px-md-4 py-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Consultation Fee (₹) <span className="text-danger">*</span>
                    </label>
                    <IconFormControl
                      fieldLabel="amount"
                      type="number"
                      className="fw-bold"
                      required
                      min="0"
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Discount Type</label>
                    <select
                      className="form-select"
                      value={discountType}
                      onChange={(e) => {
                        setDiscountType(e.target.value);
                        setDiscountValue("0");
                      }}
                    >
                      <option value="none">None</option>
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>

                  {discountType !== "none" && (
                    <div className="mb-3 animate-fade">
                      <label className="form-label fw-semibold">
                        Discount Value {discountType === "percentage" ? "(%)" : "(₹)"}
                      </label>
                      <IconFormControl
                        fieldLabel="amount"
                        type="number"
                        min="0"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="bt-fee-summary p-3 border mb-4">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted fs-13">Discount Amount</span>
                      <span className="text-danger fw-semibold">₹{discountAmount}</span>
                    </div>
                    <div className="d-flex justify-content-between border-top pt-2 align-items-center">
                      <span className="fw-bold text-dark">Final Fee</span>
                      <span className="bt-final-fee">₹{finalFee}</span>
                    </div>
                  </div>

                  <label className="bt-whatsapp-check mb-4" htmlFor="whatsappNotify">
                    <input
                      className="form-check-input m-0"
                      type="checkbox"
                      id="whatsappNotify"
                      checked={whatsappNotification}
                      onChange={(e) => setWhatsappNotification(e.target.checked)}
                    />
                    <span className="fw-semibold">
                      <i className="ti ti-brand-whatsapp text-success me-1" />
                      WhatsApp Notification Alerts
                    </span>
                  </label>

                  <div className="d-grid gap-2">
                    <button
                      type="submit"
                      className="bt-btn-premium d-flex align-items-center justify-content-center gap-1"
                      disabled={!apptTime}
                    >
                      <i className="ti ti-check" /> Book & Confirm
                    </button>
                    <Link
                      to="/therapy-appointments"
                      className="btn btn-outline-danger d-flex align-items-center justify-content-center"
                      style={{ minHeight: 42, borderRadius: 8, borderColor: "#b91c1c", color: "#b91c1c" }}
                    >
                      Cancel
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        <style>{`
          .book-therapy-page .bt-page-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background: rgba(79, 70, 229, 0.12);
            color: #4f46e5;
            font-size: 22px;
          }
          .book-therapy-page .bt-card {
            border-radius: 12px;
            box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
          }
          .book-therapy-page .bt-card-head {
            border-bottom: 1px solid rgba(0,0,0,0.06);
            background: #f8fafc;
          }
          .book-therapy-page .bt-section-icon {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            flex-shrink: 0;
          }
          .book-therapy-page .bt-add-patient-btn {
            width: 42px;
            height: 38px;
            border-radius: 10px;
            border: 1px solid rgba(79, 70, 229, 0.3);
            background: rgba(79, 70, 229, 0.08);
            color: #4f46e5;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .book-therapy-page .bt-add-patient-btn:hover {
            background: rgba(79, 70, 229, 0.14);
          }
          .book-therapy-page .bt-mode-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            border: 1px solid #e2e8f0;
            background: #fff;
            color: #475569;
            border-radius: 999px;
            padding: 8px 14px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .book-therapy-page .bt-mode-chip:hover {
            border-color: #a5b4fc;
            color: #4f46e5;
          }
          .book-therapy-page .bt-mode-chip.active {
            background: rgba(79, 70, 229, 0.1);
            border-color: #6366f1;
            color: #4f46e5;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
          }
          .book-therapy-page .bt-fee-summary {
            border-radius: 10px;
            background: linear-gradient(180deg, #f8fafc 0%, #fff 100%);
            border-color: #e2e8f0 !important;
          }
          .book-therapy-page .bt-final-fee {
            font-size: 18px;
            font-weight: 800;
            color: #198754;
          }
          .book-therapy-page .bt-whatsapp-check {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            background: #f8fafc;
            cursor: pointer;
            margin: 0;
          }
          .book-therapy-page .bt-btn-premium {
            min-height: 46px;
            border: 0;
            border-radius: 10px;
            color: #fff !important;
            font-weight: 600;
            background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%) !important;
            box-shadow: 0 8px 18px rgba(79, 70, 229, 0.25);
            transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
          }
          .book-therapy-page .bt-btn-premium:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 10px 22px rgba(79, 70, 229, 0.32);
          }
          .book-therapy-page .bt-btn-premium:disabled {
            opacity: 0.55;
            cursor: not-allowed;
            box-shadow: none;
          }
        `}</style>
      </div>

      <AddPatientModal
        show={showAddPatient}
        onHide={() => setShowAddPatient(false)}
        onSuccess={(newPatient) => {
          fetchData();
          setPatientId(newPatient.id);
        }}
      />
    </div>
  );
};

export default BookTherapyAppointment;
