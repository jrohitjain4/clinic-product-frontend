import { useEffect, useState, useMemo, useRef } from "react";
import { Link, useParams } from "react-router";
import { all_routes } from "../../../routes/all_routes";
import FooterFront from "./FooterFront";
import { DatePicker, Select } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { resolveMediaUrl } from "../../../../core/config/api";
import "./homePage.scss";
import { toast } from "react-toastify";
import { IconFormControl, IconTextarea, GenderOptionGroup } from "../../../../core/common/form-fields";

interface Doctor {
    id: string;
    name: string;
    qualification: string;
    specialization: string;
    experience: number;
    fee: number;
    days: string;
    timing: string;
    photo: string;
    bio?: string;
    medicalLicenseNumber?: string;
    gender?: string;
    dob?: string;
    bloodGroup?: string;
    educations?: any[];
    awards?: any[];
    certifications?: any[];
    schedules?: any;
    maritalStatus?: string;
    languagesSpoken?: string[];
    department?: string;
    designation?: string;
}
interface Review { name: string; rating: number; feedback: string; }
interface Service { icon: string; label: string; }
interface ClinicData {
    id: string;
    name: string; tagline: string; phone: string; whatsapp: string; email: string;
    address: string; city: string; mapUrl: string; directionsUrl: string;
    about: string; established: number; patientsServed: string; experience: number;
    logo: string; headerImage: string; aboutImage: string; facebook: string; instagram: string;
    doctors: Doctor[]; services: Service[]; reviews: Review[];
    gallery: { url: string; category: string; caption?: string }[];
    workingDays: { schedules: any[]; offDays: number[] } | null;
    onboardingStep?: number;
    nextAppointmentCode?: string;
    rawServices?: { id: string; name: string; price: number; departmentId: string }[];
    labTests?: {
        id: string;
        name: string;
        price: number;
        testCode: string;
        categoryName: string;
        assignment?: string;
        assignedDoctors?: any;
        assignedStaff?: any;
        schedules?: any;
        isSlotBookingEnabled?: boolean;
        slotDuration?: number;
    }[];
}

const Stars = ({ n, color, size }: { n: number; color?: string; size?: number }) => (
    <span className="d-flex gap-1">
        {[1, 2, 3, 4, 5].map(s => (
            <i key={s} className={`ti ti-star${s <= n ? "-filled" : ""}`} style={{ color: s <= n ? (color || "#f59e0b") : "#d1d5db", fontSize: size || 14 }} />
        ))}
    </span>
);



export default function ClinicLandingPage() {
    const { username, clinicId } = useParams();
    const [clinic, setClinic] = useState<ClinicData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Get logged-in user to check if they are the admin of this clinic
    const loggedUser = (() => {
        try {
            const u = localStorage.getItem("user");
            return u ? JSON.parse(u) : null;
        } catch { return null; }
    })();

    const isAdminOfThisClinic = clinic && loggedUser &&
        (loggedUser.clinicId === clinic.id || loggedUser.clinic?.id === clinic.id) &&
        (loggedUser.role === "ADMIN" || loggedUser.role === "DOCTOR");

    const isIncomplete = clinic && (clinic.onboardingStep !== undefined ? clinic.onboardingStep < 2 : !clinic.about);

    // ── Booking Modal State ──
    const [showModal, setShowModal] = useState(false);
    const [preselectedDoctor, setPreselectedDoctor] = useState("");
    const [bookForm, setBookForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        gender: "",
        address: "",
        doctorId: "",
        date: null as Dayjs | null,
        time: "",
        reason: ""
    });
    const [bookFormErrors, setBookFormErrors] = useState<any>({});
    const [bookLoading, setBookLoading] = useState(false);
    const [isSessionMode, setIsSessionMode] = useState(false);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [bookSuccess, setBookSuccess] = useState<string | null>(null);
    const [bookError, setBookError] = useState<string | null>(null);
    const [showLandingSlotsDropdown, setShowLandingSlotsDropdown] = useState(false);
    const [isLandingSlotsDropdownFocused, setIsLandingSlotsDropdownFocused] = useState(false);
    const landingDropdownRef = useRef<HTMLDivElement>(null);

    const [showLandingDiagSlotsDropdown, setShowLandingDiagSlotsDropdown] = useState(false);
    const [isLandingDiagSlotsDropdownFocused, setIsLandingDiagSlotsDropdownFocused] = useState(false);
    const landingDiagDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (landingDropdownRef.current && !landingDropdownRef.current.contains(event.target as Node)) {
                setShowLandingSlotsDropdown(false);
            }
            if (landingDiagDropdownRef.current && !landingDiagDropdownRef.current.contains(event.target as Node)) {
                setShowLandingDiagSlotsDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Credentials returned on new registration
    const [generatedCreds, setGeneratedCreds] = useState<{
        email?: string;
        password?: string;
        isNewUserCreated?: boolean;
        appointmentCode?: string;
        patientCode?: string;
    } | null>(null);

    const [availability, setAvailability] = useState<{
        schedules: any;
        duration?: number;
        maxBookingsPerSlot?: number;
        holidays: any[];
        leaves: any[];
        appointments: any[];
        clinicWorkingDays?: number[];
        clinicSchedules?: any[];
    } | null>(null);

    // ── Doctor Profile Modal State ──
    const [selectedDocDetails, setSelectedDocDetails] = useState<Doctor | null>(null);
    const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
    const [activePhoto, setActivePhoto] = useState<string | null>(null);
    const [showAllReviews, setShowAllReviews] = useState(false);
    const [activeTab, setActiveTab] = useState("Monday");

    // ── Diagnostic Booking Modal State ──
    const [showDiagModal, setShowDiagModal] = useState(false);
    const [diagForm, setDiagForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        gender: "",
        address: "",
        testId: "",
        assignedUserId: "",
        date: null as Dayjs | null,
        time: "",
        reason: ""
    });
    const [diagFormErrors, setDiagFormErrors] = useState<any>({});
    const [diagLoading, setDiagLoading] = useState(false);
    const [diagSuccess, setDiagSuccess] = useState<string | null>(null);
    const [diagError, setDiagError] = useState<string | null>(null);
    const [diagGeneratedCreds, setDiagGeneratedCreds] = useState<{
        email?: string;
        password?: string;
        isNewUserCreated?: boolean;
        bookingCode?: string;
        patientCode?: string;
        testName?: string;
    } | null>(null);

    const openDiagBooking = () => {
        setDiagForm({
            firstName: "", lastName: "", email: "", phone: "",
            gender: "", address: "", testId: "", assignedUserId: "", date: null, time: "", reason: ""
        });
        setDiagSuccess(null);
        setDiagError(null);
        setDiagGeneratedCreds(null);
        setDiagFormErrors({});
        setShowDiagModal(true);
    };

    const handleDiagSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setDiagFormErrors({});
        setDiagError(null);

        let hasError = false;
        const newErrors: any = {};

        if (!diagForm.firstName.trim()) { newErrors.firstName = "First name is required"; hasError = true; }
        if (!diagForm.lastName.trim()) { newErrors.lastName = "Last name is required"; hasError = true; }
        if (!diagForm.email.trim()) { newErrors.email = "Email is required"; hasError = true; }
        if (!diagForm.phone.trim()) { newErrors.phone = "Phone number is required"; hasError = true; }
        if (!diagForm.gender) { newErrors.gender = "Gender is required"; hasError = true; }
        if (!diagForm.testId) { newErrors.testId = "Please select a test"; hasError = true; }
        if (!diagForm.date) { newErrors.date = "Please select a date"; hasError = true; }

        if (hasError) { setDiagFormErrors(newErrors); return; }
        if (!clinic?.id) return;

        setDiagLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/landing/id/${clinic.id}/book-diagnostic`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: diagForm.firstName,
                    lastName: diagForm.lastName,
                    email: diagForm.email,
                    phone: diagForm.phone,
                    gender: diagForm.gender,
                    address: diagForm.address,
                    testId: diagForm.testId,
                    assignedUserId: diagForm.assignedUserId || undefined,
                    date: diagForm.date!.format("YYYY-MM-DD"),
                    time: diagForm.time || "09:00",
                    reason: diagForm.reason,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Booking failed");

            setDiagGeneratedCreds({
                email: data.email,
                password: data.generatedPassword,
                isNewUserCreated: data.isNewUserCreated,
                bookingCode: data.bookingCode,
                patientCode: data.patientCode,
                testName: data.testName,
            });
            setDiagSuccess(data.message || "Diagnostic test scheduled successfully!");
        } catch (err: any) {
            setDiagError(err.message);
        } finally {
            setDiagLoading(false);
        }
    };

    // Selected diagnostic test object
    const selectedDiagTestObj = useMemo(() => {
        if (!diagForm.testId || !clinic?.labTests) return null;
        return clinic.labTests.find(t => t.id === diagForm.testId) || null;
    }, [diagForm.testId, clinic?.labTests]);

    // Diagnostic Schedule Logic
    const diagAvailableSchedules = useMemo(() => {
        if (!selectedDiagTestObj?.schedules) return null;
        try {
            const parsed = typeof selectedDiagTestObj.schedules === "string"
                ? JSON.parse(selectedDiagTestObj.schedules)
                : selectedDiagTestObj.schedules;
            return typeof parsed === "object" && parsed !== null ? parsed : null;
        } catch {
            return null;
        }
    }, [selectedDiagTestObj]);

    const diagAvailableDays = useMemo(() => {
        if (!diagAvailableSchedules) return [];
        return Object.keys(diagAvailableSchedules).filter(day => {
            const sessions = diagAvailableSchedules[day];
            return Array.isArray(sessions) && sessions.length > 0;
        });
    }, [diagAvailableSchedules]);

    const diagDisabledDate = (current: any) => {
        if (!current) return false;
        if (current < dayjs().startOf('day')) return true;
        if (diagAvailableDays.length === 0) return false;
        const currentDay = current.format('dddd');
        return !diagAvailableDays.includes(currentDay);
    };

    const diagCellRender = (current: any, info: any) => {
        if (info.type !== 'date') return info.originNode;
        const currentDay = current.format('dddd');
        const isAvailable = diagAvailableDays.includes(currentDay);
        const isPast = current < dayjs().startOf('day');

        if (diagAvailableDays.length > 0) {
            if (isAvailable && !isPast) {
                return (
                    <div className="ant-picker-cell-inner" style={{ backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '4px', color: '#237804' }}>
                        {current.date()}
                    </div>
                );
            } else if (!isAvailable && !isPast) {
                return (
                    <div className="ant-picker-cell-inner" style={{ backgroundColor: '#fff1f0', border: '1px solid #ffa39e', borderRadius: '4px', color: '#a8071a' }}>
                        {current.date()}
                    </div>
                );
            }
        }
        return info.originNode;
    };

    // Computed time slots options based on selected date
    const diagTimeSlots = useMemo(() => {
        if (!diagForm.date || !diagAvailableSchedules || !selectedDiagTestObj) return [];
        const currentDay = diagForm.date.format('dddd');
        const daySessions = diagAvailableSchedules[currentDay];
        if (!Array.isArray(daySessions) || daySessions.length === 0) return [];

        let options: { label: string; value: string }[] = [];
        const isSlotEnabled = selectedDiagTestObj.isSlotBookingEnabled;
        const slotDur = selectedDiagTestObj.slotDuration || 30;

        daySessions.forEach((session: any) => {
            const sessionName = session.session || "Session";
            const startTime = session.from || "09:00:00";
            const endTime = session.to || "17:00:00";

            if (!isSlotEnabled) {
                options.push({
                    label: `${sessionName} (${dayjs(startTime, ["HH:mm:ss", "HH:mm"]).format("h:mm A")} - ${dayjs(endTime, ["HH:mm:ss", "HH:mm"]).format("h:mm A")})`,
                    value: startTime.substring(0, 5)
                });
            } else {
                let currentSlotTime = dayjs(`${diagForm.date!.format("YYYY-MM-DD")}T${startTime}`);
                const endSessionTime = dayjs(`${diagForm.date!.format("YYYY-MM-DD")}T${endTime}`);

                while (currentSlotTime.add(slotDur, 'minute').isBefore(endSessionTime) || currentSlotTime.add(slotDur, 'minute').isSame(endSessionTime)) {
                    const slotEnd = currentSlotTime.add(slotDur, 'minute');
                    const slotStr = `${currentSlotTime.format("hh:mm A")} - ${slotEnd.format("hh:mm A")}`;
                    options.push({
                        label: slotStr,
                        value: currentSlotTime.format("HH:mm")
                    });
                    currentSlotTime = slotEnd;
                }
            }
        });
        return options;
    }, [diagForm.date, diagAvailableSchedules, selectedDiagTestObj]);

    const openBooking = (doctorId = "") => {
        setPreselectedDoctor(doctorId);
        setBookForm({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            gender: "",
            address: "",
            doctorId: doctorId,
            date: null,
            time: "",
            reason: ""
        });
        setBookSuccess(null);
        setBookError(null);
        setGeneratedCreds(null);
        setIsSessionMode(false);
        setSelectedServices([]);
        setShowModal(true);
        setSelectedDocDetails(null); // Close doctor details modal if it was open
    };

    // Fetch availability when selected doctor changes
    useEffect(() => {
        const docId = bookForm.doctorId || preselectedDoctor;
        if (docId) {
            const start = dayjs().startOf("month").subtract(1, "month").toISOString();
            const end = dayjs().endOf("month").add(3, "month").toISOString();
            fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/doctors/${docId}/availability?startDate=${start}&endDate=${end}`)
                .then((r) => r.json())
                .then((data) => {
                    setAvailability(data);
                })
                .catch(console.error);
        } else {
            setAvailability(null);
        }
    }, [bookForm.doctorId, preselectedDoctor]);

    // Compute session options (like in admin appointment form page)
    const sessionOptions = useMemo(() => {
        if (!availability || !bookForm.date) return [];
        const dayName = bookForm.date.format("dddd");
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
    }, [availability, bookForm.date]);

    const isSlotBookingActive = useMemo(() => {
        return !!(
            availability &&
            availability.duration &&
            availability.duration > 0 &&
            availability.maxBookingsPerSlot &&
            availability.maxBookingsPerSlot > 0
        );
    }, [availability]);

    const slotOptions = useMemo(() => {
        if (!isSlotBookingActive || !availability || !bookForm.date) return [];
        const dayName = bookForm.date.format("dddd");
        const dateStr = bookForm.date.format("YYYY-MM-DD");
        const daySchedule = availability.schedules?.[dayName];
        if (!Array.isArray(daySchedule)) return [];

        const duration = availability.duration || 30;
        const maxBookings = availability.maxBookingsPerSlot || 1;
        const slots: any[] = [];

        daySchedule.forEach((session: any) => {
            let currentSlot = dayjs(session.from, "HH:mm");
            const sessionEnd = dayjs(session.to, "HH:mm");

            while (currentSlot.isBefore(sessionEnd)) {
                const slotTime = currentSlot.format("HH:mm");
                const bookedCount = availability.appointments?.filter((a: any) => {
                    return (
                        dayjs(a.start).format("YYYY-MM-DD") === dateStr &&
                        dayjs(a.start).format("HH:mm") === slotTime
                    );
                }).length || 0;

                const bookingsAvailable = Math.max(0, maxBookings - bookedCount);

                slots.push({
                    value: slotTime,
                    label: `${currentSlot.format("hh:mm A")} (${bookingsAvailable} slots remaining)`,
                    bookingsAvailable,
                    isDisabled: bookingsAvailable <= 0
                });

                currentSlot = currentSlot.add(duration, "minute");
            }
        });

        return slots;
    }, [isSlotBookingActive, availability, bookForm.date]);

    // Calendar Date Styling Custom Cell Render
    const cellRender = (current: Dayjs | any, info: any) => {
        if (info.type !== 'date' || !availability || !dayjs.isDayjs(current)) return info.originNode;

        const dateStr = current.format("YYYY-MM-DD");
        const dayName = current.format("dddd");

        // 1. Holiday (Blueish)
        const isHoliday = availability.holidays?.some((h: any) => {
            const start = dayjs(h.date).startOf("day");
            const end = h.endDate ? dayjs(h.endDate).endOf("day") : start.endOf("day");
            return (current.isAfter(start) || current.isSame(start)) && (current.isBefore(end) || current.isSame(end));
        });

        if (isHoliday) {
            return (
                <div className="ant-picker-cell-inner" style={{ backgroundColor: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: '4px', color: '#0050b3' }}>
                    {current.date()}
                </div>
            );
        }

        // 2. Clinic Off Day (Orange/Red)
        const clinicOffDays = availability.clinicWorkingDays || [0];
        const dayOfWeek = current.day();
        if (clinicOffDays.includes(dayOfWeek)) {
            return (
                <div className="ant-picker-cell-inner" style={{ backgroundColor: '#fff7e6', border: '1px solid #ffd591', borderRadius: '4px', color: '#d46b08' }}>
                    {current.date()}
                </div>
            );
        }

        // 3. Doctor Weekly Off (Red)
        const daySchedule = availability.schedules?.[dayName];
        const isWorking = Array.isArray(daySchedule) && daySchedule.length > 0;
        if (!isWorking) {
            return (
                <div className="ant-picker-cell-inner" style={{ backgroundColor: '#fff1f0', border: '1px solid #ffa39e', borderRadius: '4px', color: '#a8071a' }}>
                    {current.date()}
                </div>
            );
        }

        // 4. Leave (Yellow)
        const isLeave = availability.leaves?.some((l: any) => {
            const s = dayjs(l.start).startOf("day");
            const e = dayjs(l.end).endOf("day");
            return (current.isAfter(s) || current.isSame(s)) && (current.isBefore(e) || current.isSame(e));
        });
        if (isLeave) {
            return (
                <div className="ant-picker-cell-inner" style={{ backgroundColor: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '4px', color: '#874d00' }}>
                    {current.date()}
                </div>
            );
        }

        // 5. Working Day (Green)
        if (isWorking) {
            return (
                <div className="ant-picker-cell-inner" style={{ backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '4px', color: '#237804' }}>
                    {current.date()}
                </div>
            );
        }

        return info.originNode;
    };

    const handleBookSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setBookFormErrors({});
        setBookError(null);
        setBookSuccess(null);

        let hasError = false;
        const newErrors: any = {};

        if (!bookForm.firstName.trim()) { newErrors.firstName = "First name is required"; hasError = true; }
        if (!bookForm.lastName.trim()) { newErrors.lastName = "Last name is required"; hasError = true; }
        if (!bookForm.email.trim()) { newErrors.email = "Email is required"; hasError = true; }
        if (!bookForm.phone.trim()) { newErrors.phone = "Phone number is required"; hasError = true; }
        if (!bookForm.gender) { newErrors.gender = "Gender is required"; hasError = true; }

        const docId = bookForm.doctorId || preselectedDoctor;
        if (!docId) { newErrors.doctorId = "Please select a doctor"; hasError = true; }
        if (!bookForm.date) { newErrors.date = "Please select a date"; hasError = true; }
        if (!bookForm.time) { newErrors.time = "Please select a time slot"; hasError = true; }
        if (isSessionMode && selectedServices.length === 0 && clinic?.rawServices && clinic.rawServices.length > 0) {
            newErrors.services = "Please select a service";
            hasError = true;
        }

        if (hasError) {
            setBookFormErrors(newErrors);
            return;
        }

        if (!clinic?.id) return;
        setBookLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/landing/id/${clinic?.id}/book`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: bookForm.firstName,
                    lastName: bookForm.lastName,
                    email: bookForm.email,
                    phone: bookForm.phone,
                    gender: bookForm.gender,
                    address: bookForm.address,
                    doctorId: docId,
                    date: bookForm.date!.format("YYYY-MM-DD"),
                    time: bookForm.time,
                    reason: bookForm.reason,
                    appointmentType: isSessionMode ? "Session" : "Online Booking",
                    serviceIds: isSessionMode ? selectedServices : []
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Booking failed");

            setGeneratedCreds({
                email: data.email,
                password: data.generatedPassword,
                isNewUserCreated: data.isNewUserCreated,
                appointmentCode: data.appointmentCode,
                patientCode: data.patientCode
            });
            setBookSuccess(data.message || "Appointment booked successfully!");
        } catch (err: any) {
            setBookError(err.message);
        } finally {
            setBookLoading(false);
        }
    };

    const handleDownloadSlip = () => {
        const docId = bookForm.doctorId || preselectedDoctor;
        const doctorObj = clinic?.doctors.find(d => d.id === docId);

        const slipHtml = `
            <html>
            <head>
              <title>Appointment Summary - ${generatedCreds?.appointmentCode || 'Record'}</title>
              <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css">
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                body { background: #fff; padding: 30px; font-family: 'Inter', sans-serif; color: #0f172a; }
                .header-banner {
                  background: linear-gradient(135deg, #1e3a8a, #3b82f6) !important;
                  color: #ffffff !important;
                  padding: 24px !important;
                  border-radius: 8px !important;
                  margin-bottom: 25px !important;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .header-banner h4 { color: #ffffff !important; font-weight: 700; margin: 0 0 4px 0; font-size: 22px; }
                .header-banner p { color: #e0f2fe !important; margin: 0; font-size: 13px; }
                .header-banner h6 { color: #ffffff !important; margin: 8px 0 2px 0; font-size: 15px; font-weight: 600; }
                .logo-box { width: 70px; height: 70px; background: #fff; border-radius: 8px; display: flex; align-items: center; justify-content: center; padding: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
                .section-title { font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #0f172a !important; padding-bottom: 8px; margin-bottom: 15px; font-size: 12px; color: #0f172a !important; letter-spacing: 0.5px; }
                
                /* Dark Styled Tables */
                .table-bordered { border: 2px solid #0f172a !important; }
                .table-bordered th { 
                  background-color: #0f172a !important; 
                  color: #ffffff !important; 
                  border: 2px solid #0f172a !important; 
                  font-weight: 700; 
                  font-size: 12px; 
                  letter-spacing: 0.5px; 
                  padding: 12px 10px !important;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .table-bordered td { border: 1px solid #334155 !important; color: #0f172a !important; font-weight: 600; font-size: 13px; padding: 12px 10px !important; }
                
                .text-primary { color: #1e3a8a !important; }
                .clinical-findings { border: 2px solid #0f172a !important; padding: 20px; background: #f8fafc; min-height: 120px; line-height: 1.6; font-size: 13px; color: #000000 !important; font-weight: 500; border-radius: 6px; }
                @media print { 
                  .no-print { display: none; } 
                  body { padding: 0; }
                  .header-banner {
                    background: linear-gradient(135deg, #1e3a8a, #3b82f6) !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }
                  .table-bordered th {
                    background-color: #0f172a !important;
                    color: #ffffff !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }
                }
              </style>
            </head>
            <body>
              <div class="header-banner">
                <div class="d-flex align-items-center gap-3">
                  <div class="logo-box">
                    <img src="${resolveMediaUrl(clinic?.logo) || '/logo.png'}" alt="logo" style="max-height: 55px; max-width: 55px; object-fit: contain;">
                  </div>
                  <div>
                    <h4>${clinic?.name || "DocYari Clinical Network"}</h4>
                    <p><i class="ti ti-map-pin"></i> ${clinic?.address || "Clinic Address"}, ${clinic?.city || ""}</p>
                    <h6>${doctorObj?.name || ""}</h6>
                    <p>${doctorObj?.qualification || "Consultant"} · ${doctorObj?.specialization || "Medicine"}</p>
                  </div>
                </div>
                <div class="text-end text-white">
                  <span class="badge bg-white text-primary fw-bold px-3 py-2 mb-2" style="font-size: 12px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    ${generatedCreds?.appointmentCode || "#---"}
                  </span>
                  <div class="small mt-1 opacity-90">
                    <div class="mb-1"><strong>Dept:</strong> ${doctorObj?.specialization || "General"}</div>
                    <div><strong>Date:</strong> ${bookForm.date ? bookForm.date.format("DD MMM YYYY") : dayjs().format("DD MMM YYYY")}</div>
                  </div>
                </div>
              </div>

              <div class="mb-4">
                <h6 class="section-title">Patient Clinical Profile</h6>
                <table class="table table-bordered mb-0">
                  <thead>
                    <tr>
                      <th class="text-white">PATIENT NAME</th>
                      <th class="text-center text-white">AGE / GENDER</th>
                      <th class="text-center text-white">BLOOD GROUP</th>
                      <th class="text-center text-white">PATIENT ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="text-primary" style="font-size: 15px; font-weight: 700;">${bookForm.firstName} ${bookForm.lastName}</td>
                      <td class="text-center">--Y / ${bookForm.gender || '--'}</td>
                      <td class="text-center">N/A</td>
                      <td class="text-center">${generatedCreds?.patientCode || 'N/A'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="text-center mb-4 pt-3">
                <h5 class="fw-bold text-dark text-uppercase tracking-wider" style="border-bottom: 3px solid #0f172a; display: inline-block; padding-bottom: 8px;">
                  Clinical Appointment Summary
                </h5>
              </div>

              <div class="mb-4">
                <h6 class="section-title">Appointment Registration Details</h6>
                <table class="table table-bordered mb-0">
                  <thead>
                    <tr>
                      <th class="text-center text-white">S.NO</th>
                      <th class="text-white">APPOINT ID</th>
                      <th class="text-white">PATIENT NAME</th>
                      <th class="text-white">DOCTOR NAME</th>
                      <th class="text-center text-white">MODE</th>
                      <th class="text-center text-white">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="text-center text-muted">01</td>
                      <td>${generatedCreds?.appointmentCode || "N/A"}</td>
                      <td class="text-primary" style="font-weight: 700;">${bookForm.firstName} ${bookForm.lastName}</td>
                      <td>${doctorObj?.name || ""}</td>
                      <td class="text-center">Clinic Landing</td>
                      <td class="text-center"><span class="badge bg-dark text-white border px-3 py-1 text-uppercase" style="font-size: 10px; font-weight: 700;">SCHEDULE</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="mb-5">
                <h6 class="section-title">Clinical Findings / Assessment</h6>
                <div class="clinical-findings">
                  ${bookForm.reason || "Online booking from clinic website"}
                </div>
              </div>

              <div class="mt-auto pt-4 border-top text-center text-muted small">
                <p class="mb-1 fw-bold" style="color: #64748b; letter-spacing: 0.5px;">2025 &copy; <span style="color: #1e3a8a;">Docyari</span>, All Rights Reserved</p>
                <p class="mb-0 italic opacity-50" style="font-size: 10px;">This is a computer-generated clinical summary and does not require a physical signature.</p>
              </div>

              <script>
                window.onload = () => {
                  setTimeout(() => { window.print(); window.close(); }, 500);
                };
              </script>
            </body>
          </html>`;

        const printWindow = window.open("", "_blank");
        if (printWindow) {
            printWindow.document.write(slipHtml);
            printWindow.document.close();
        }
    };

    useEffect(() => {
        if (!username && !clinicId) return;
        setLoading(true);
        const endpoint = username
            ? `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/landing/u/${username}`
            : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/landing/id/${clinicId}`;

        fetch(endpoint)
            .then(r => {
                if (!r.ok) throw new Error("Clinic not found");
                return r.json();
            })
            .then((data: ClinicData) => {
                setClinic(data);
                document.title = `${data.name} | Docyori`;
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [username, clinicId]);

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: 16, background: "#f8fafc" }}>
            <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}></div>
            <p style={{ color: "#64748b", fontFamily: "Inter,sans-serif" }}>Loading clinic...</p>
        </div>
    );

    if (error || !clinic) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: 12, background: "#f8fafc" }}>
            <i className="ti ti-building-hospital" style={{ fontSize: 56, color: "#e2e8f0" }} />
            <h2 style={{ color: "#1e293b", fontFamily: "Inter,sans-serif" }}>Clinic Not Found</h2>
            <p style={{ color: "#64748b", fontFamily: "Inter,sans-serif" }}>{error || "This clinic page does not exist."}</p>
            <Link to="/" className="btn btn-primary mt-3">Go to Homepage</Link>
        </div>
    );

    const avgRating = (clinic.reviews || []).length
        ? Math.round((clinic.reviews || []).reduce((s, r) => s + r.rating, 0) / (clinic.reviews || []).length)
        : 5;

    // ── Pre-rendering logic for incomplete data ──
    if (isIncomplete && !isAdminOfThisClinic) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", background: "#f8fafc", textAlign: 'center', padding: 24 }}>
                <div style={{ background: '#fff', padding: '48px 32px', borderRadius: 32, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.08)', maxWidth: 440 }}>
                    <div style={{ width: 80, height: 80, background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <i className="ti ti-building-broadcast-tower" style={{ fontSize: 40, color: "#94a3b8" }} />
                    </div>
                    <h2 style={{ color: "#0f172a", fontWeight: 800, fontSize: 28, marginBottom: 12, letterSpacing: '-0.02em' }}>Almost Ready!</h2>
                    <p style={{ color: "#64748b", fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
                        <strong>{clinic.name}</strong> is currently polishing their page.
                        Check back in a bit to see their full profile and book appointments!
                    </p>
                    <Link to="/" className="btn btn-primary w-100 py-3 fw-bold rounded-xl shadow-lg border-0" style={{ background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)', borderRadius: 16 }}>
                        Explore Other Clinics
                    </Link>
                </div>
            </div>
        );
    }

    // Full-screen notice for Admin if they haven't put ANY data
    const isTotallyEmpty = !clinic.about && clinic.services.length === 0;
    if (isTotallyEmpty && isAdminOfThisClinic) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#fff", padding: 24 }}>
                <div style={{ maxWidth: 500, textAlign: 'center' }}>
                    <img src="/docyari-logo.svg" alt="DocYori" style={{ width: 180, marginBottom: 40 }} />
                    <div style={{ background: '#fff9db', border: '1px solid #ffec99', padding: 32, borderRadius: 24, textAlign: 'left' }}>
                        <h4 style={{ fontWeight: 800, color: '#856404', marginBottom: 16 }}>
                            🚀 Welcome to Your Clinic Page!
                        </h4>
                        <p style={{ color: '#856404', opacity: 0.9, lineHeight: 1.6 }}>
                            This is your public landing page where patients can find you and book appointments.
                            Currently, it's empty! To make it look professional:
                        </p>
                        <ul style={{ color: '#856404', paddingLeft: 18, marginBottom: 24 }}>
                            <li>Add an "About Us" description</li>
                            <li>Upload your logo and gallery photos</li>
                            <li>List the services you provide</li>
                            <li>Add your consulting doctors</li>
                        </ul>
                        <Link to={all_routes.organizationsettings} className="btn btn-warning w-100 py-3 fw-bold rounded-xl shadow-sm border-0" style={{ color: '#856404' }}>
                            Go to Settings & Fill Data
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const totalReviews = (clinic.reviews || []).length > 0 ? (clinic.reviews || []).length : "350+";

    const allReviewsList = clinic.reviews && (clinic.reviews || []).length > 0
        ? clinic.reviews
        : [
            { rating: 5, feedback: "Excellent experience! The doctor was very attentive and the staff was friendly. Will definitely visit again.", name: "Amit Kumar" },
            { rating: 5, feedback: "Very easy appointment booking process and minimal waiting time. The clinic is well-maintained and hygienic.", name: "Anita Singh" },
            { rating: 5, feedback: "Best clinic experience so far. Highly recommended! The doctor explained everything in detail.", name: "Rahul Verma" },
            { rating: 5, feedback: "Quick appointment and proper guidance. Very satisfied with the service. Staff is very cooperative.", name: "Sandeep Kumar" },
            { rating: 5, feedback: "Very professional and caring doctors. The treatment was effective and the recovery was quick. Highly satisfied.", name: "Priya Sharma" },
            { rating: 4, feedback: "Good clinic with experienced doctors. Waiting time was reasonable and the staff was polite and helpful.", name: "Vikram Patel" },
            { rating: 5, feedback: "Amazing experience from start to finish. The online booking was seamless and the doctor was thorough.", name: "Neha Gupta" },
            { rating: 5, feedback: "One of the best clinics in the area. Clean, modern facilities and very knowledgeable doctors.", name: "Rajesh Mehta" },
            { rating: 4, feedback: "Great service and friendly staff. The doctor took time to understand my concerns and provided excellent care.", name: "Sunita Devi" },
            { rating: 5, feedback: "Wonderful experience. The clinic has state-of-the-art equipment and the treatment was top-notch.", name: "Arun Kapoor" }
        ];

    const reviewsToShow = showAllReviews ? allReviewsList : allReviewsList.slice(0, 5);

    // Show only real doctors
    const displayDoctors = clinic.doctors;

    // All real clinic doctors for dropdown
    const realDoctors = clinic.doctors;

    return (
        <div className="dy-landing" style={{ minHeight: "100vh", overflowX: "hidden" }}>
            <style>{`
                .dy-landing .card, 
                .dy-landing img:not(.dy-brand img) { 
                    border: 1px solid rgba(29, 78, 216, 0.25) !important; 
                    box-shadow: 0 4px 12px rgba(29, 78, 216, 0.08) !important;
                }
                .dy-nav-links li a {
                    font-size: 1.05rem !important;
                    font-weight: 500 !important;
                }
            `}</style>
            {isAdminOfThisClinic && isIncomplete && (
                <div className="alert alert-warning border-0 rounded-0 m-0 py-3 text-center" style={{ background: '#fff9db', borderBottom: '1px solid #ffec99 !important' }}>
                    <div className="container d-flex align-items-center justify-content-center flex-wrap gap-2">
                        <i className="ti ti-info-circle-filled fs-20 text-warning"></i>
                        <span className="fw-medium text-dark">
                            Your clinic landing page is not fully set up.
                        </span>
                        <Link to={all_routes.organizationsettings} className="btn btn-warning btn-sm fw-bold px-3 ms-2 shadow-sm rounded-pill">
                            Complete Setup Now
                        </Link>
                    </div>
                </div>
            )}

            {/* ══════ NAVBAR (Docyori Style) ══════ */}
            <nav className="dy-nav bg-white shadow-sm position-sticky top-0" style={{ zIndex: 1000, overflow: 'visible' }}>
                <div className="dy-nav-inner container px-3" style={{ overflow: 'visible' }}>
                    <a href="#hero" className="dy-brand d-flex align-items-center text-decoration-none" style={{ height: '70px', display: 'flex', alignItems: 'center', overflow: 'visible' }} onClick={(e) => { e.preventDefault(); setSelectedDocDetails(null); document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' }); }}>
                        <img src="/logo.png" alt="DocYori" style={{ height: "65px", width: "auto", objectFit: "contain", maxWidth: "none" }} />
                    </a>

                    <ul className="dy-nav-links d-none d-lg-flex mb-0">
                        <li><a href="#hero" className="active" onClick={(e) => { e.preventDefault(); setSelectedDocDetails(null); document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' }); }}>Home</a></li>
                        <li><a href="#hero" onClick={(e) => { e.preventDefault(); setSelectedDocDetails(null); document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' }); }}>Features</a></li>
                        <li><a href="#about" onClick={(e) => { e.preventDefault(); setSelectedDocDetails(null); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }); }}>About Us</a></li>
                        <li><a href="#services" onClick={(e) => { e.preventDefault(); setSelectedDocDetails(null); document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }); }}>Services</a></li>
                    </ul>

                    <div className="dy-nav-actions d-flex align-items-center gap-2">
                        <Link
                            to={all_routes.login}
                            className="btn btn-outline-primary px-3 py-2 d-flex align-items-center justify-content-center"
                            style={{ borderRadius: '8px', minHeight: '44px', border: '2px solid #1d4ed8', color: '#1d4ed8', fontSize: '14px', fontWeight: 500 }}
                        >
                            Login
                        </Link>
                        <button
                            type="button"
                            onClick={() => openBooking("")}
                            className="btn btn-primary px-3 py-2 d-flex align-items-center justify-content-center"
                            style={{ borderRadius: '8px', minHeight: '44px', fontSize: '14px', fontWeight: 500 }}
                        >
                            Book Appointment
                        </button>
                        {(clinic.labTests && clinic.labTests.length > 0) && (
                            <button
                                type="button"
                                onClick={() => openDiagBooking()}
                                className="btn px-3 py-2 d-flex align-items-center justify-content-center text-white"
                                style={{ borderRadius: '8px', minHeight: '44px', fontSize: '14px', fontWeight: 500, background: "linear-gradient(135deg, #059669, #10b981)", border: "none" }}
                            >
                                Book Diagnostic
                            </button>
                        )}
                    </div>
                </div>
            </nav>
                    {/* ══════ HERO ══════ */}
                    <section id="hero" className="position-relative overflow-hidden" style={{ padding: "40px 0 60px", background: "transparent" }}>
                        <div className="container position-relative z-1">
                            <div className="row align-items-center g-5">
                                <div className="col-lg-6">
                                    <h2 className="display-6 fw-bold mb-2" style={{ color: "#1d4ed8", letterSpacing: "-1px" }}>
                                        {clinic.name}
                                    </h2>
                                    <p className="fs-5 text-dark mb-4">{clinic.tagline}</p>

                                    <div className="d-flex flex-wrap gap-4 mb-4">
                                        <div className="d-flex align-items-center gap-3">
                                            <i className="ti ti-star-filled text-warning fs-3" />
                                            <div>
                                                <h6 className="mb-0 fw-bold fs-5 text-dark">{avgRating}.0 Rating</h6>
                                                <span className="fw-medium" style={{ fontSize: "14px", color: "#0f172a" }}>{totalReviews} Reviews</span>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-3">
                                            <i className="ti ti-user-scan text-primary fs-3" />
                                            <div>
                                                <h6 className="mb-0 fw-bold fs-5 text-dark">{clinic.doctors.length}+ Doctors</h6>
                                                <span className="fw-medium" style={{ fontSize: "14px", color: "#0f172a" }}>Experienced</span>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-3">
                                            <i className="ti ti-shield-check text-primary fs-3" />
                                            <div>
                                                <h6 className="mb-0 fw-bold fs-5 text-dark">{clinic.patientsServed}</h6>
                                                <span className="fw-medium" style={{ fontSize: "14px", color: "#0f172a" }}>Patients Treated</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-4 d-flex flex-column gap-2">
                                        <div className="d-flex align-items-center gap-3 text-dark fw-medium" style={{ fontSize: "15px" }}>
                                            <div className="bg-white rounded-circle p-2 shadow-sm"><i className="ti ti-map-pin text-primary" /></div>
                                            {clinic.address}, {clinic.city}
                                        </div>
                                        <div className="d-flex align-items-center gap-3 text-dark fw-medium" style={{ fontSize: "15px" }}>
                                            <div className="bg-white rounded-circle p-2 shadow-sm"><i className="ti ti-phone text-primary" /></div>
                                            <span>{clinic.phone}</span>
                                        </div>
                                    </div>

                                    <div className="d-flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={() => openBooking("")}
                                            className="btn btn-primary px-4 py-2 fw-semibold d-flex align-items-center gap-2 rounded-3 text-white shadow"
                                        >
                                            <i className="ti ti-calendar-event" /> Book Appointment
                                        </button>
                                        {(clinic.labTests && clinic.labTests.length > 0) && (
                                            <button
                                                type="button"
                                                onClick={() => openDiagBooking()}
                                                className="btn px-4 py-2 fw-semibold d-flex align-items-center gap-2 rounded-3 text-white shadow"
                                                style={{ background: "linear-gradient(135deg, #059669, #10b981)", border: "none" }}
                                            >
                                                <i className="ti ti-microscope" /> Book Diagnostic
                                            </button>
                                        )}
                                        <a
                                            href={`tel:${clinic.phone}`}
                                            className="btn bg-white px-4 py-2 fw-semibold d-flex align-items-center gap-2 rounded-3 shadow-sm"
                                            style={{ color: "#1d4ed8", border: "2px solid #1d4ed8", fontSize: "15px" }}
                                        >
                                            <i className="ti ti-phone" /> Call Now
                                        </a>
                                    </div>
                                </div>

                                {/* Image Column */}
                                <div className="col-lg-6 d-none d-lg-block position-relative">
                                    <img
                                        src={clinic.headerImage
                                            ? (clinic.headerImage.startsWith('http') ? clinic.headerImage : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${clinic.headerImage}`)
                                            : (clinic.gallery[0]?.url || "/assets/img/hero-clinic-bg.png")}
                                        alt={clinic.name}
                                        className="img-fluid rounded-4 shadow-lg w-100"
                                        style={{ maxHeight: "400px", objectFit: "cover", objectPosition: "center" }}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>


                    {/* ══════ ABOUT US ══════ */}
                    <section id="about" className="bg-white">
                        <div className="container py-5 border-top">
                            <div className="row g-5 align-items-center">
                                {/* Text Content */}
                                <div className="col-lg-6">
                                    <h3 className="display-6 fw-bold mb-4" style={{ color: "#1d4ed8", letterSpacing: "-1px" }}>ABOUT {clinic.name.toUpperCase()}</h3>
                                    <div className="d-flex align-items-center gap-3 text-dark fw-medium mb-4" style={{ fontSize: "15px" }}>
                                        {clinic.about
                                            ? clinic.about
                                            : `${clinic.name} is a multi-speciality healthcare center committed to providing high-quality medical services with compassion and care. We have a team of experienced doctors and modern facilities to ensure the best treatment for you and your family.`
                                        }
                                    </div>

                                    <div className="row g-3 mt-4 text-center">
                                        <div className="col-4">
                                            <div className="border rounded-4 p-3 shadow-sm h-100 d-flex flex-column justify-content-center">
                                                <h4 className="fw-bold mb-1" style={{ color: "#0f172a" }}>{clinic.established || "—"}</h4>
                                                <span className="fw-semibold" style={{ fontSize: "14px", color: "#0f172a" }}>Established</span>
                                            </div>
                                        </div>
                                        <div className="col-4">
                                            <div className="border rounded-4 p-3 shadow-sm h-100 d-flex flex-column justify-content-center">
                                                <h4 className="fw-bold mb-1" style={{ color: "#0f172a" }}>{clinic.patientsServed || "—"}</h4>
                                                <span className="fw-semibold" style={{ fontSize: "14px", color: "#0f172a" }}>Patients Served</span>
                                            </div>
                                        </div>
                                        <div className="col-4">
                                            <div className="border rounded-4 p-3 shadow-sm h-100 d-flex flex-column justify-content-center">
                                                <h4 className="fw-bold mb-1" style={{ color: "#0f172a" }}>{clinic.experience ? `${clinic.experience}+` : "—"}</h4>
                                                <span className="fw-semibold" style={{ fontSize: "14px", color: "#0f172a" }}>Years Experience</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Image Content */}
                                <div className="col-lg-6">
                                    <img
                                        src={clinic.aboutImage
                                            ? (clinic.aboutImage.startsWith('http') ? clinic.aboutImage : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${clinic.aboutImage}`)
                                            : (clinic.gallery[1]?.url || "/assets/img/clinic-reception.png")}
                                        alt="Reception"
                                        className="img-fluid rounded-4 shadow"
                                        style={{ border: "4px solid #f1f5f9", width: "100%", height: "400px", objectFit: "cover" }}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ══════ DOCTORS ══════ */}
                    <section id="doctors" className="bg-white">
                        <div className="container pb-5">
                            <div className="text-center mb-5">
                                <h3 className="display-6 fw-bold" style={{ color: "#000000", letterSpacing: "-1px" }}>OUR DOCTORS</h3>
                            </div>

                            <div className="row g-4 justify-content-center">
                                {displayDoctors.map((doc, idx) => {
                                    const ratingValue = 4.0 + ((idx * 3 + 5) % 11) / 10;
                                    return (
                                        <div key={idx} className="col-12 col-md-6 col-lg-6">
                                            <div
                                                className="card h-100 border bg-white shadow-sm rounded-4 overflow-hidden d-flex flex-column text-start"
                                                style={{ transition: "all 0.2s ease-in-out" }}
                                                onMouseOver={e => e.currentTarget.style.transform = "translateY(-4px)"}
                                                onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}
                                            >
                                                {/* Top Section: Photo and Basic Info Row */}
                                                <div className="d-flex flex-column flex-sm-row p-3 pb-2 align-items-center align-items-sm-start gap-3">
                                                    {/* Photo container */}
                                                    <div className="d-flex align-items-center justify-content-center" style={{ minWidth: "90px", maxWidth: "90px" }}>
                                                        <img
                                                            src={doc.photo ? (
                                                                doc.photo.startsWith('http') || doc.photo.startsWith('data:')
                                                                    ? doc.photo
                                                                    : doc.photo.includes('uploads')
                                                                        ? `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${doc.photo.startsWith('/') ? '' : '/'}${doc.photo}`
                                                                        : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/uploads/doctors/${doc.photo}`
                                                            ) : "/assets/img/doctor-placeholder.png"}
                                                            alt={doc.name}
                                                            className="rounded-circle object-fit-cover shadow-sm bg-white"
                                                            style={{ width: "80px", height: "80px", border: "3px solid #fff" }}
                                                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/assets/img/doctor-placeholder.png" }}
                                                        />
                                                    </div>

                                                    {/* Doctor details */}
                                                    <div className="flex-grow-1 w-100">
                                                        <div className="d-flex align-items-start justify-content-between mb-1 gap-2">
                                                            <h5 className="fw-bold text-dark mb-0 fs-6">{doc.name}</h5>
                                                            <div className="d-flex flex-column align-items-end gap-1">
                                                                <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-2 py-0.5" style={{ fontSize: "11px", whiteSpace: "normal" }}>
                                                                    {doc.specialization}
                                                                </span>
                                                                <span className="d-flex align-items-center gap-1">
                                                                    <Stars n={ratingValue} size={12} />
                                                                    <span className="fw-bold text-dark" style={{ fontSize: "11px" }}>{ratingValue.toFixed(1)}</span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <p className="fw-semibold mb-1 text-dark" style={{ fontSize: "13px", color: "#212529" }}>
                                                            {doc.qualification}
                                                        </p>

                                                        <div className="d-flex flex-wrap gap-2.5 mb-1 align-items-center" style={{ fontSize: "12px", color: "#64748b" }}>
                                                            <span><i className="ti ti-briefcase me-1" />{doc.experience} Yrs Exp.</span>
                                                            {doc.medicalLicenseNumber && (
                                                                <span><i className="ti ti-id me-1" />Lic: {doc.medicalLicenseNumber}</span>
                                                            )}
                                                        </div>

                                                        <div className="d-flex align-items-center justify-content-between pt-1">
                                                            <div>
                                                                <span className="text-secondary" style={{ fontSize: "11px" }}>Fee: </span>
                                                                <span className="text-dark fw-bold fs-6 ms-1" style={{ color: "#212529" }}>₹{doc.fee}</span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); openBooking(doc.id); }}
                                                                className="btn btn-primary fw-bold px-3 py-1 rounded-3"
                                                                style={{ fontSize: "12px" }}
                                                            >
                                                                Book Appointment
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Detailed Info Block (Permanent & Compact) */}
                                                <div className="border-top p-3 bg-light bg-opacity-25 w-100 flex-grow-1" style={{ borderColor: "#e2e8f0" }}>
                                                    <div className="row g-2">
                                                        {/* Col 1: Bio & Weekly Availability */}
                                                        <div className="col-12 col-md-7">
                                                            {doc.bio && (
                                                                <div className="mb-2">
                                                                    <h6 className="fw-bold mb-0.5 text-dark" style={{ fontSize: "14px" }}>Short Bio</h6>
                                                                    <p className="text-dark mb-0" style={{ fontSize: "15px", lineHeight: "1.4" }}>
                                                                        {doc.bio}
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {/* Weekly Availability Grid (No scrollbar, occupies the empty bio area) */}
                                                            <div className="mt-3">
                                                                <h6 className="fw-bold mb-2 text-dark" style={{ fontSize: "14px" }}>Weekly Availability</h6>
                                                                <div className="row row-cols-2 row-cols-sm-3 g-2">
                                                                    {(() => {
                                                                        let scheds = doc.schedules;
                                                                        if (typeof scheds === 'string') {
                                                                            try { scheds = JSON.parse(scheds); } catch (e) { scheds = {}; }
                                                                        }
                                                                        if (!scheds || typeof scheds !== 'object') scheds = {};
                                                                        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
                                                                        return days.map(day => {
                                                                            const slots = scheds[day] || [];
                                                                            return (
                                                                                <div key={day} className="col">
                                                                                    <div className="bg-light p-2 rounded border h-100" style={{ minHeight: "56px" }}>
                                                                                        <div className="fw-bold text-primary mb-1" style={{ fontSize: "12px" }}>{day}</div>
                                                                                        {slots.length > 0 ? (
                                                                                            slots.map((slot: any, sIdx: number) => {
                                                                                                const fmt = (t: string) => t ? dayjs(t, ["HH:mm:ss", "HH:mm"]).format("h:mm A") : "";
                                                                                                const fromTime = fmt(slot.from || slot.startTime || "");
                                                                                                const toTime = fmt(slot.to || slot.endTime || "");
                                                                                                return (
                                                                                                    <div key={sIdx} className="text-dark fw-medium" style={{ fontSize: "11px" }}>
                                                                                                        {fromTime} – {toTime}
                                                                                                    </div>
                                                                                                );
                                                                                            })
                                                                                        ) : (
                                                                                            <span className="text-muted italic" style={{ fontSize: "11px" }}>Closed</span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        });
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Col 2: About Details, Education, Awards, Certifications */}
                                                        <div className="col-12 col-md-5">
                                                            <h6 className="fw-bold mb-1 text-dark" style={{ fontSize: "14px" }}>About Doctor</h6>
                                                            <div className="d-flex flex-column gap-1" style={{ fontSize: "12px" }}>
                                                                <div className="d-flex justify-content-between border-bottom pb-0.5">
                                                                    <span className="text-dark fw-bold">License:</span>
                                                                    <span className="text-dark fw-semibold">{doc.medicalLicenseNumber || "null"}</span>
                                                                </div>
                                                                <div className="d-flex justify-content-between border-bottom pb-0.5">
                                                                    <span className="text-dark fw-bold">Gender:</span>
                                                                    <span className="text-dark fw-semibold">{doc.gender || "null"}</span>
                                                                </div>
                                                                <div className="d-flex justify-content-between border-bottom pb-0.5">
                                                                    <span className="text-dark fw-bold">Years of Experience:</span>
                                                                    <span className="text-dark fw-semibold">{doc.experience ? `${doc.experience} Yrs Exp.` : "null"}</span>
                                                                </div>
                                                                <div className="d-flex justify-content-between border-bottom pb-0.5">
                                                                    <span className="text-dark fw-bold">Marital Status:</span>
                                                                    <span className="text-dark fw-semibold">{doc.maritalStatus || "null"}</span>
                                                                </div>
                                                                <div className="d-flex justify-content-between border-bottom pb-0.5">
                                                                    <span className="text-dark fw-bold">Blood Group:</span>
                                                                    <span className="text-dark fw-semibold">{doc.bloodGroup || "null"}</span>
                                                                </div>
                                                                <div className="d-flex justify-content-between border-bottom pb-0.5">
                                                                    <span className="text-dark fw-bold">Languages:</span>
                                                                    <span className="text-dark fw-semibold">{(doc.languagesSpoken && doc.languagesSpoken.length > 0) ? doc.languagesSpoken.join(", ") : "null"}</span>
                                                                </div>
                                                                <div className="d-flex justify-content-between border-bottom pb-0.5">
                                                                    <span className="text-dark fw-bold">Location:</span>
                                                                    <span className="text-dark fw-semibold text-end" style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={clinic.address}>{clinic.address || "null"}</span>
                                                                </div>
                                                            </div>

                                                            {/* Specialization, Department & Designation */}
                                                            <div className="mt-3">
                                                                <h6 className="fw-bold mb-1 text-dark" style={{ fontSize: "14px" }}>Specialization</h6>
                                                                <p className="text-dark mb-2 fw-medium" style={{ fontSize: "13px" }}>
                                                                    {doc.specialization || "null"}
                                                                </p>
                                                                <h6 className="fw-bold mb-1 text-dark" style={{ fontSize: "14px" }}>Department</h6>
                                                                <p className="text-dark mb-2 fw-medium" style={{ fontSize: "13px" }}>
                                                                    {doc.department || "null"}
                                                                </p>
                                                                <h6 className="fw-bold mb-1 text-dark" style={{ fontSize: "14px" }}>Designation</h6>
                                                                <p className="text-dark mb-0 fw-medium" style={{ fontSize: "13px" }}>
                                                                    {doc.designation || doc.qualification || "null"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    {/* ══════ INFO WIDGET GRID ══════ */}
                    <section id="services" className="py-5" style={{ background: "#f8f9fa" }}>
                        <div className="container">
                            <div className="row g-4">
                                {/* Services Card */}
                                <div className="col-lg-6">
                                    <div className="card h-100 p-4 border rounded-4 shadow-sm bg-white text-center d-flex flex-column">
                                        <h6 className="fw-bold mb-4" style={{ color: "#0f172a", letterSpacing: "0.5px" }}>SERVICES WE OFFER</h6>
                                        <div className="row row-cols-2 g-3 flex-grow-1">
                                            {[
                                                { i: "ti-stethoscope", t: "General Physician" },
                                                { i: "ti-dental", t: "Dental Care" },
                                                { i: "ti-baby-bottle", t: "Child Care" },
                                                { i: "ti-woman", t: "Gynecology" },
                                                { i: "ti-flask", t: "Pathology Lab" },
                                                { i: "ti-vaccine", t: "Vaccination" },
                                                { i: "ti-walk", t: "Physiotherapy" },
                                                { i: "ti-heart-rate-monitor", t: "Cardiology" }
                                            ].map((s, idx) => (
                                                <div
                                                    key={idx}
                                                    className="col d-flex flex-column align-items-center justify-content-center py-2 service-hover-item"
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => document.getElementById('booking-widget')?.scrollIntoView({ behavior: 'smooth' })}
                                                >
                                                    <i className={`ti ${s.i} mb-2`} style={{ color: "#1d4ed8", fontSize: "40px" }} />
                                                    <span className="fw-bold text-dark" style={{ fontSize: "13px", lineHeight: "1.3" }}>{s.t}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Timings Card */}
                                <div className="col-lg-6">
                                    <div className="card h-100 p-4 border rounded-4 shadow-sm bg-white d-flex flex-column">
                                        <h6 className="fw-bold mb-4" style={{ color: "#0f172a", letterSpacing: "0.5px" }}>CLINIC TIMINGS</h6>
                                        <div className="d-flex flex-column gap-3 flex-grow g-2-1">
                                            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(day => (
                                                <div key={day} className="d-flex justify-content-between align-items-center border-bottom pb-2">
                                                    <span className="fw-bold text-dark" style={{ fontSize: "14px" }}>{day}</span>
                                                    <span className="fw-semibold" style={{ fontSize: "13px", color: "#0f172a" }}>09:00 AM - 08:00 PM</span>
                                                </div>
                                            ))}
                                            <div className="d-flex justify-content-between align-items-center pb-2">
                                                <span className="fw-bold text-dark" style={{ fontSize: "14px" }}>Sunday</span>
                                                <span className="text-danger fw-bold" style={{ fontSize: "14px" }}>Closed</span>
                                            </div>
                                        </div>
                                        <div className="mt-auto pt-3 py-3 px-3 rounded-4 text-center" style={{ background: "#fef2f2" }}>
                                            <div className="fw-bold mb-1" style={{ fontSize: "12px", color: "#ef4444" }}>EMERGENCY? CALL NOW</div>
                                            <div className="fw-bold fs-5" style={{ color: "#ef4444" }}><i className="ti ti-phone me-1" /> +91 98765 43210</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ══════ REVIEWS ══════ */}
                    <section id="reviews" className="bg-white border-top border-bottom pt-5 pb-3">
                        <div className="container py-2">
                            <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between mb-4 gap-3">
                                <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-2 gap-sm-3 w-100">
                                    <h3 className="display-6 fw-bold mb-0 text-nowrap" style={{ color: "#0f172a", letterSpacing: "-1px" }}>
                                        RECENT REVIEWS
                                    </h3>
                                    <div className="d-flex align-items-center gap-2 flex-wrap">
                                        <Stars n={avgRating} size={15} />
                                        <span className="fw-semibold text-nowrap" style={{ fontSize: "14px", color: "#0f172a" }}>({totalReviews} Reviews)</span>
                                    </div>
                                </div>
                                <a
                                    href="#"
                                    className="fw-bold text-decoration-none d-flex align-items-center gap-1 text-nowrap mt-2 mt-md-0"
                                    style={{ color: "#0f172a", fontSize: "14px" }}
                                    onClick={(e) => { e.preventDefault(); setShowAllReviews(!showAllReviews); }}
                                >
                                    {showAllReviews ? "Show Less Reviews" : "View All Reviews"} <i className={`ti ti-arrow-${showAllReviews ? 'up' : 'right'}`} />
                                </a>
                            </div>

                            <div className="card rounded-4 border bg-white overflow-hidden shadow-sm">
                                <div className="divide-y">
                                    {reviewsToShow.map((r, i, arr) => (
                                        <div key={i} className={`d-flex flex-column flex-md-row p-4 align-items-start align-items-md-center justify-content-between gap-3 ${i < arr.length - 1 ? 'border-bottom' : ''}`}>

                                            {/* Left Column: Author details */}
                                            <div style={{ minWidth: "140px", flexShrink: 0 }}>
                                                <h6 className="fw-bold text-dark mb-1" style={{ fontSize: "15px" }}>{r.name}</h6>
                                                <span className="d-block mb-1" style={{ fontSize: "13px", color: "#0f172a" }}>Patient</span>
                                                <span className="d-inline-flex align-items-center gap-1 fw-semibold" style={{ fontSize: "11px", color: "#16a34a" }}>
                                                    <i className="ti ti-circle-check-filled" style={{ color: "#16a34a" }} /> Verified
                                                </span>
                                            </div>

                                            {/* Middle Column: Star Rating & Feedback text */}
                                            <div className="flex-grow-1 text-start">
                                                <div className="d-flex align-items-center gap-2 mb-2" style={{ whiteSpace: "nowrap" }}>
                                                    <Stars n={r.rating} size={15} />
                                                    <span className="fw-bold text-dark" style={{ fontSize: "14px" }}>{r.rating.toFixed(1)}</span>
                                                </div>
                                                <p className="text-dark mb-0 fw-medium" style={{ fontSize: "14px", lineHeight: "1.5" }}>
                                                    {r.feedback}
                                                </p>
                                            </div>


                                        </div>
                                    ))}
                                </div>


                            </div>
                        </div>
                    </section>

                    {/* ══════ GALLERY ══════ */}
                    {
                        clinic.gallery.length > 0 && (
                            <section id="gallery" className="pt-3 pb-5 bg-white">
                                <div className="container pt-1 pb-4 text-center">
                                    <h3 className="display-6 fw-bold mb-4" style={{ color: "#000000", letterSpacing: "-1px" }}>CLINIC GALLERY</h3>

                                    <div className="row g-4">
                                        {clinic.gallery.map((img, i) => (
                                            <div key={i} className="col-lg-3 col-md-6 col-12">
                                                <div 
                                                    className="card border rounded-3 overflow-hidden bg-white shadow-sm" 
                                                    style={{ 
                                                        borderColor: "#cbd5e1",
                                                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                                        cursor: "pointer"
                                                    }}
                                                    onClick={() => setActivePhoto(img.url)}
                                                    onMouseOver={(e) => {
                                                        e.currentTarget.style.transform = "translateY(-4px)";
                                                        e.currentTarget.style.boxShadow = "0 10px 20px rgba(0, 0, 0, 0.08)";
                                                        const imgEl = e.currentTarget.querySelector('.dy-gallery-img') as HTMLImageElement;
                                                        if (imgEl) imgEl.style.transform = "scale(1.05)";
                                                    }}
                                                    onMouseOut={(e) => {
                                                        e.currentTarget.style.transform = "translateY(0)";
                                                        const imgEl = e.currentTarget.querySelector('.dy-gallery-img') as HTMLImageElement;
                                                        if (imgEl) imgEl.style.transform = "scale(1)";
                                                    }}
                                                >
                                                    <div className="position-relative overflow-hidden" style={{ aspectRatio: "1 / 1" }}>
                                                        <img 
                                                            src={resolveMediaUrl(img.url)} 
                                                            alt={img.category} 
                                                            className="w-100 h-100 dy-gallery-img" 
                                                            style={{ transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)", objectFit: "cover" }} 
                                                        />
                                                        <div className="position-absolute inset-0 d-flex align-items-center justify-content-center bg-dark bg-opacity-25 opacity-0 hover-opacity-100 transition-all duration-300" style={{ transition: "all 0.3s" }}>
                                                            <i className="ti ti-zoom-in text-white fs-1" />
                                                        </div>
                                                    </div>
                                                    <div className="card-body py-2 px-3 text-start border-top bg-light-50" style={{ borderColor: "#e2e8f0" }}>
                                                        <h6 className="fw-bold mb-1" style={{ fontSize: "16px", color: "#1d4ed8" }}>
                                                            {img.category || "Gallery Image"}
                                                        </h6>
                                                        {img.caption && (
                                                            <p className="text-dark mb-0" style={{ fontSize: "13px", color: "#000000" }}>
                                                                {img.caption}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )
                    }





            {/* ══════ DARK BOTTOM FOOTER ══════ */}
            <FooterFront clinic={clinic} />

            {/* WA FAB */}
            <a href={`https://wa.me/${clinic.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                className="position-fixed shadow-lg rounded-circle d-flex align-items-center justify-content-center"
                style={{ bottom: "30px", right: "30px", width: "60px", height: "60px", background: "#25D366", color: "white", zIndex: 9999, transition: "transform 0.2s" }}
                onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
                <i className="ti ti-brand-whatsapp" style={{ fontSize: "36px" }} />
            </a>

            {/* ══════ DIAGNOSTIC BOOKING MODAL ══════ */}
            {showDiagModal && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ zIndex: 99999, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
                    onClick={(e) => { if (e.target === e.currentTarget) setShowDiagModal(false); }}
                >
                    <div className="bg-white rounded-4 shadow-lg d-flex flex-column" style={{ width: "100%", maxWidth: diagSuccess ? "650px" : "720px", margin: "20px", maxHeight: "90vh", overflow: "hidden", transition: "max-width 0.3s ease" }}>
                        {/* Header */}
                        <div className="d-flex align-items-center justify-content-between p-3 border-bottom flex-shrink-0" style={{ background: "linear-gradient(135deg, #059669, #10b981)", borderRadius: "16px 16px 0 0" }}>
                            <div className="d-flex align-items-center gap-3">
                                <div>
                                    <h5 className="fw-bold text-white mb-0" style={{ fontSize: "16px" }}>Book Diagnostic Test</h5>
                                    <small className="text-white opacity-75" style={{ fontSize: "13px" }}>{clinic.name}</small>
                                </div>
                            </div>
                            <button
                                className="btn p-0 d-flex align-items-center justify-content-center text-white opacity-75"
                                style={{ width: 30, height: 30, background: "rgba(255,255,255,0.15)", borderRadius: "50%" }}
                                onClick={() => setShowDiagModal(false)}
                            >
                                <i className="ti ti-x fs-6" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-3 flex-grow-1" style={{ overflowY: "auto", minHeight: 0 }}>
                            {diagSuccess ? (
                                /* ── Success State ── */
                                <div className="text-center py-3">
                                    <div className="d-flex align-items-center justify-content-center mb-3">
                                        <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 64, height: 64, background: "#ecfdf5", border: "2px solid #059669" }}>
                                            <i className="ti ti-circle-check-filled" style={{ fontSize: 36, color: "#059669" }} />
                                        </div>
                                    </div>
                                    <h4 className="fw-bold text-dark mb-1" style={{ fontSize: "24px" }}>Diagnostic Test Scheduled!</h4>
                                    <p className="text-secondary fw-semibold mb-3" style={{ fontSize: "15px" }}>{diagSuccess}</p>

                                    {/* Booking Details */}
                                    <div className="mb-3 p-4 bg-light rounded-3 text-start border" style={{ borderColor: "#e2e8f0" }}>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="text-secondary fw-semibold" style={{ fontSize: "15px" }}>Booking Code:</span>
                                            <span className="text-dark fw-bold" style={{ fontSize: "16px" }}>{diagGeneratedCreds?.bookingCode || "LB..."}</span>
                                        </div>
                                        <div className={`d-flex justify-content-between ${diagGeneratedCreds?.isNewUserCreated ? 'mb-3 pb-3 border-bottom' : ''}`} style={{ borderColor: "#cbd5e1" }}>
                                            <span className="text-secondary fw-semibold" style={{ fontSize: "15px" }}>Test:</span>
                                            <span className="text-dark fw-bold" style={{ fontSize: "15px" }}>{diagGeneratedCreds?.testName || "—"}</span>
                                        </div>

                                        {diagGeneratedCreds?.isNewUserCreated && (
                                            <div className="mt-3">
                                                <div className="alert alert-success py-2 px-3 rounded-2 mb-3 d-flex align-items-start gap-2" style={{ backgroundColor: "#ecfdf5", borderColor: "#86efac", color: "#065f46", fontSize: "14px" }}>
                                                    <i className="ti ti-info-circle-filled mt-1 flex-shrink-0" />
                                                    <span>Your login account has been created! Credentials have been sent to your email.</span>
                                                </div>
                                                <div className="d-flex justify-content-between mb-2">
                                                    <span className="text-secondary" style={{ fontSize: "14px" }}>Login Email:</span>
                                                    <span className="text-dark fw-bold" style={{ fontSize: "14px" }}>{diagGeneratedCreds?.email}</span>
                                                </div>
                                                <div className="d-flex justify-content-between">
                                                    <span className="text-secondary" style={{ fontSize: "14px" }}>Temporary Password:</span>
                                                    <span className="fw-bold" style={{ fontSize: "14px", letterSpacing: "0.5px", color: "#059669" }}>{diagGeneratedCreds?.password}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Important Notes */}
                                    <div className="p-4 mb-4 rounded-3 text-start" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                                        <h6 className="fw-bold text-dark mb-3" style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Important Notes</h6>
                                        <div className="d-flex align-items-start gap-3 mb-3 pb-3 border-bottom" style={{ borderColor: "#e2e8f0" }}>
                                            <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: "28px", height: "28px", background: "#059669", color: "white" }}>
                                                <span className="fw-bold" style={{ fontSize: "14px" }}>1</span>
                                            </div>
                                            <div>
                                                <p className="mb-0 text-dark fw-bold" style={{ fontSize: "15px", lineHeight: "1.5" }}>
                                                    Your appointment is only <strong>Scheduled</strong>. Credentials for logging into the portal have been sent to your email.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-start gap-3">
                                            <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: "28px", height: "28px", background: "#0f172a", color: "white" }}>
                                                <span className="fw-bold" style={{ fontSize: "14px" }}>2</span>
                                            </div>
                                            <div>
                                                <p className="mb-0 text-dark fw-bold" style={{ fontSize: "15px", lineHeight: "1.5" }}>
                                                    To confirm your booking, please contact the clinic owner at <strong style={{ color: "#059669", fontSize: "16px" }}>{clinic.phone || clinic.whatsapp}</strong>.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="d-flex gap-2">
                                        <a
                                            href={`tel:${clinic.phone}`}
                                            className="btn fw-bold py-2 px-2 rounded-3 text-white flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                                            style={{ background: "#059669", fontSize: "12px", border: "none" }}
                                        >
                                            <i className="ti ti-phone-call" /> Call Now
                                        </a>
                                        <button
                                            className="btn fw-bold py-2 px-2 rounded-3 text-white flex-grow-1"
                                            style={{ background: "#0f172a", fontSize: "12px", border: "none" }}
                                            onClick={() => setShowDiagModal(false)}
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* ── Booking Form ── */
                                <form onSubmit={handleDiagSubmit} noValidate>
                                    <div className="row g-2">
                                        {/* First Name & Last Name */}
                                        <div className="col-6">
                                            <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "13px" }}>First Name <span className="text-danger">*</span></label>
                                            <IconFormControl type="text" fieldLabel="first name" className={`rounded-3 ${diagFormErrors.firstName ? 'is-invalid' : ''}`} placeholder="First name" value={diagForm.firstName} onChange={e => setDiagForm(f => ({ ...f, firstName: e.target.value }))} style={{ fontSize: "14px" }} />
                                            {diagFormErrors.firstName && <div className="invalid-feedback">{diagFormErrors.firstName}</div>}
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "13px" }}>Last Name <span className="text-danger">*</span></label>
                                            <IconFormControl type="text" fieldLabel="last name" className={`rounded-3 ${diagFormErrors.lastName ? 'is-invalid' : ''}`} placeholder="Last name" value={diagForm.lastName} onChange={e => setDiagForm(f => ({ ...f, lastName: e.target.value }))} style={{ fontSize: "14px" }} />
                                            {diagFormErrors.lastName && <div className="invalid-feedback">{diagFormErrors.lastName}</div>}
                                        </div>

                                        {/* Email */}
                                        <div className="col-12">
                                            <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "13px" }}>Email Address <span className="text-danger">*</span></label>
                                            <IconFormControl type="email" fieldLabel="email" className={`rounded-3 ${diagFormErrors.email ? 'is-invalid' : ''}`} placeholder="username@example.com" value={diagForm.email} onChange={e => setDiagForm(f => ({ ...f, email: e.target.value }))} style={{ fontSize: "14px" }} />
                                            {diagFormErrors.email && <div className="invalid-feedback">{diagFormErrors.email}</div>}
                                        </div>

                                        {/* Phone & Gender */}
                                        <div className="col-6">
                                            <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "13px" }}>Phone Number <span className="text-danger">*</span></label>
                                            <IconFormControl type="tel" fieldLabel="phone" className={`rounded-3 ${diagFormErrors.phone ? 'is-invalid' : ''}`} placeholder="+91 XXXXX XXXXX" value={diagForm.phone} onChange={e => setDiagForm(f => ({ ...f, phone: e.target.value }))} style={{ fontSize: "14px" }} />
                                            {diagFormErrors.phone && <div className="invalid-feedback">{diagFormErrors.phone}</div>}
                                        </div>
                                        <div className="col-6">
                                            <GenderOptionGroup
                                                showLabel
                                                required
                                                value={diagForm.gender}
                                                onChange={(val) => setDiagForm(f => ({ ...f, gender: val }))}
                                            />
                                            {diagFormErrors.gender && <div className="invalid-feedback d-block">{diagFormErrors.gender}</div>}
                                        </div>

                                        {/* Address */}
                                        <div className="col-12">
                                            <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "13px" }}>Address (Optional)</label>
                                            <IconFormControl type="text" fieldLabel="address" className="rounded-3" placeholder="House no., Street, City, Pincode" value={diagForm.address} onChange={e => setDiagForm(f => ({ ...f, address: e.target.value }))} style={{ fontSize: "14px" }} />
                                        </div>

                                        {/* Test Selection */}
                                        <div className="col-12">
                                            <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "13px" }}>Select Diagnostic Test <span className="text-danger">*</span></label>
                                            <select
                                                className={`form-select rounded-3 text-secondary ${diagFormErrors.testId ? 'is-invalid' : ''}`}
                                                value={diagForm.testId}
                                                onChange={e => setDiagForm(f => ({ ...f, testId: e.target.value }))}
                                                style={{ fontSize: "14px" }}
                                            >
                                                <option value="">Select a test</option>
                                                {clinic.labTests?.map((t) => (
                                                    <option key={t.id} value={t.id}>
                                                        {t.name}{t.categoryName ? ` — ${t.categoryName}` : ""}{t.price ? ` (₹${t.price})` : ""}
                                                    </option>
                                                ))}
                                            </select>
                                            {diagFormErrors.testId && <div className="invalid-feedback">{diagFormErrors.testId}</div>}
                                            {/* Selected test info */}
                                            {diagForm.testId && (() => {
                                                const selTest = clinic.labTests?.find(t => t.id === diagForm.testId);
                                                if (!selTest) return null;
                                                return (
                                                    <div className="mt-2 p-2 rounded-3 d-flex align-items-center gap-2" style={{ background: "#ecfdf5", border: "1px solid #86efac" }}>
                                                        <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 36, height: 36, background: "#059669", flexShrink: 0 }}>
                                                            <i className="ti ti-microscope text-white" style={{ fontSize: 18 }} />
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold text-dark" style={{ fontSize: 13 }}>{selTest.name}</div>
                                                            <div className="text-muted" style={{ fontSize: 11 }}>
                                                                {[selTest.categoryName, selTest.testCode, selTest.price ? `₹${selTest.price}` : ""].filter(Boolean).join(" · ")}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* Doctor/Staff Assignment Selection */}
                                        {diagForm.testId && (() => {
                                            const selTest = clinic.labTests?.find(t => t.id === diagForm.testId);
                                            if (!selTest) return null;

                                            let docs: any[] = [];
                                            let staffs: any[] = [];

                                            try {
                                                docs = typeof selTest.assignedDoctors === "string"
                                                    ? JSON.parse(selTest.assignedDoctors)
                                                    : (selTest.assignedDoctors || []);
                                                staffs = typeof selTest.assignedStaff === "string"
                                                    ? JSON.parse(selTest.assignedStaff)
                                                    : (selTest.assignedStaff || []);
                                            } catch (e) {
                                                console.error("Error parsing assigned doc/staff:", e);
                                            }

                                            if (!Array.isArray(docs)) docs = [];
                                            if (!Array.isArray(staffs)) staffs = [];

                                            // If both lists are empty, no need to show dropdown
                                            if (docs.length === 0 && staffs.length === 0) return null;

                                            return (
                                                <div className="col-12">
                                                    <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "13px" }}>Assign Doctor / Staff (Optional)</label>
                                                    <select
                                                        className="form-select rounded-3 text-secondary"
                                                        value={diagForm.assignedUserId}
                                                        onChange={e => setDiagForm(f => ({ ...f, assignedUserId: e.target.value }))}
                                                        style={{ fontSize: "14px" }}
                                                    >
                                                        <option value="">Auto / Any Available</option>
                                                        {docs.map((d: any) => (
                                                            <option key={d.value || d.id} value={d.value || d.id}>
                                                                Dr. {d.label || d.name} (Doctor)
                                                            </option>
                                                        ))}
                                                        {staffs.map((s: any) => (
                                                            <option key={s.value || s.id} value={s.value || s.id}>
                                                                {s.label || s.name} (Staff / Technician)
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            );
                                        })()}

                                        {/* Date & Preferred Time */}
                                        <div className="col-6">
                                            <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "13px" }}>Preferred Date <span className="text-danger">*</span></label>
                                            <DatePicker
                                                className={`form-control rounded-3 w-100 ${diagFormErrors.date ? 'is-invalid' : ''}`}
                                                format="DD-MM-YYYY"
                                                placeholder="DD-MM-YYYY"
                                                suffixIcon={null}
                                                disabled={!diagForm.testId}
                                                disabledDate={diagDisabledDate}
                                                cellRender={diagCellRender}
                                                value={diagForm.date}
                                                onChange={(d: Dayjs | null) => setDiagForm(f => ({ ...f, date: d, time: "" }))}
                                                style={{ fontSize: "14px", height: "38px" }}
                                            />
                                            {diagFormErrors.date && <div className="invalid-feedback d-block">{diagFormErrors.date}</div>}
                                        </div>
                                        <div className="col-6">
                                            {selectedDiagTestObj?.isSlotBookingEnabled ? (
                                                <div className="position-relative" ref={landingDiagDropdownRef}>
                                                    <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "13px" }}>Preferred Time <span className="text-danger">*</span></label>
                                                    <div
                                                        onClick={() => {
                                                            if (diagForm.date && diagTimeSlots.length > 0) {
                                                                setShowLandingDiagSlotsDropdown(!showLandingDiagSlotsDropdown);
                                                            }
                                                        }}
                                                        onFocus={() => setIsLandingDiagSlotsDropdownFocused(true)}
                                                        onBlur={() => setIsLandingDiagSlotsDropdownFocused(false)}
                                                        tabIndex={0}
                                                        className={`form-control rounded-3 d-flex align-items-center justify-content-between`}
                                                        style={{
                                                            minHeight: "38px",
                                                            border: isLandingDiagSlotsDropdownFocused || showLandingDiagSlotsDropdown ? "1px solid #2e37a4" : "1px solid #dee2e6",
                                                            boxShadow: isLandingDiagSlotsDropdownFocused || showLandingDiagSlotsDropdown ? "0 0 0 1px #2e37a4" : "none",
                                                            fontSize: "14px",
                                                            padding: "6px 12px",
                                                            cursor: !diagForm.date || diagTimeSlots.length === 0 ? "not-allowed" : "pointer",
                                                            backgroundColor: !diagForm.date || diagTimeSlots.length === 0 ? "#f8fafc" : "white",
                                                            transition: "all 0.2s ease-in-out",
                                                            outline: "none",
                                                        }}
                                                    >
                                                        <span className={diagForm.time ? "text-dark fw-semibold" : "text-muted"}>
                                                            {!diagForm.date
                                                                ? "Select date first"
                                                                : diagTimeSlots.length === 0
                                                                    ? "No slots available"
                                                                    : diagForm.time
                                                                        ? diagTimeSlots.find(o => o.value === diagForm.time)?.label || diagForm.time
                                                                        : "Select slot"}
                                                        </span>
                                                        <i className={`ti ti-chevron-${showLandingDiagSlotsDropdown ? 'up' : 'down'} text-secondary`} style={{ fontSize: "11px" }} />
                                                    </div>

                                                    {showLandingDiagSlotsDropdown && diagForm.date && diagTimeSlots.length > 0 && (
                                                        <div
                                                            className="position-absolute w-100 mt-1 p-3 border rounded shadow bg-white"
                                                            style={{
                                                                zIndex: 1050,
                                                                borderRadius: "10px",
                                                                borderColor: "#cbd5e1",
                                                                maxHeight: "250px",
                                                                overflowY: "auto",
                                                            }}
                                                        >
                                                            <div className="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom">
                                                                <span className="small text-muted fw-bold">AVAILABLE SLOTS</span>
                                                                <span className="badge bg-soft-primary text-primary px-2 py-0.5 rounded-pill fs-11" style={{ backgroundColor: "#eef2ff", color: "#6366f1" }}>
                                                                    {diagTimeSlots.length} Options
                                                                </span>
                                                            </div>
                                                            <div 
                                                                style={{
                                                                    display: "grid",
                                                                    gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                                                                    gap: "8px",
                                                                }}
                                                            >
                                                                <style>{`
                                                                    .select-slot-block {
                                                                        transition: all 0.2s ease-in-out;
                                                                    }
                                                                    .select-slot-block:hover:not(.filled) {
                                                                        transform: translateY(-2px);
                                                                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                                                                    }
                                                                `}</style>
                                                                {diagTimeSlots.map((opt: any, idx: number) => {
                                                                    const isSelected = diagForm.time === opt.value;
                                                                    let bg = "#ecfdf5";
                                                                    let border = "#a7f3d0";
                                                                    let text = "#047857";
                                                                    let badgeText = "Available";

                                                                    if (isSelected) {
                                                                        bg = "#2e37a4";
                                                                        border = "#2e37a4";
                                                                        text = "#ffffff";
                                                                    }

                                                                    return (
                                                                        <div
                                                                            key={opt.value || idx}
                                                                            onClick={() => {
                                                                                setDiagForm(f => ({ ...f, time: opt.value }));
                                                                                setShowLandingDiagSlotsDropdown(false);
                                                                            }}
                                                                            className="text-center px-2 py-2 select-slot-block"
                                                                            style={{
                                                                                borderRadius: "8px",
                                                                                border: `1px solid ${border}`,
                                                                                backgroundColor: bg,
                                                                                color: text,
                                                                                cursor: "pointer",
                                                                            }}
                                                                        >
                                                                            <div className="fw-bold" style={{ fontSize: "13px" }}>
                                                                                {dayjs(`2000-01-01T${opt.value}`).format("hh:mm A")}
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
                                                    <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "13px" }}>Preferred Session</label>
                                                    <select
                                                        className="form-select rounded-3 text-secondary"
                                                        value={diagForm.time}
                                                        disabled={!diagForm.date || diagTimeSlots.length === 0}
                                                        onChange={e => setDiagForm(f => ({ ...f, time: e.target.value }))}
                                                        style={{ fontSize: "14px" }}
                                                    >
                                                        <option value="">
                                                            {!diagForm.date
                                                                ? "Select date first"
                                                                : (diagTimeSlots.length > 0 ? "Select session" : "No sessions available")
                                                            }
                                                        </option>
                                                        {diagTimeSlots.map((opt: any) => (
                                                            <option key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        {/* Reason */}
                                        <div className="col-12">
                                            <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "13px" }}>Reason / Notes (Optional)</label>
                                            <IconTextarea fieldLabel="notes" className="rounded-3" rows={2} placeholder="Any specific reason or notes for the test..." value={diagForm.reason} onChange={e => setDiagForm(f => ({ ...f, reason: e.target.value }))} style={{ fontSize: "14px", resize: "none" }} />
                                        </div>

                                        {/* Error */}
                                        {diagError && (
                                            <div className="col-12">
                                                <div className="alert alert-danger py-2 px-3 rounded-3 d-flex align-items-center gap-2 mb-0" style={{ fontSize: "13px" }}>
                                                    <i className="ti ti-alert-circle text-danger fs-5" />
                                                    {diagError}
                                                </div>
                                            </div>
                                        )}

                                        {/* Submit */}
                                        <div className="col-12 mt-1">
                                            <button
                                                type="submit"
                                                className="btn w-100 fw-bold py-2 rounded-3 text-white d-flex align-items-center justify-content-center gap-2"
                                                style={{ fontSize: "15px", border: "none", background: "linear-gradient(135deg, #059669, #10b981)" }}
                                                disabled={diagLoading}
                                            >
                                                {diagLoading ? (
                                                    <><span className="spinner-border spinner-border-sm" /> Booking...</>
                                                ) : (
                                                    <><i className="ti ti-microscope" /> Schedule Diagnostic Test</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ══════ BOOKING MODAL ══════ */}
            {
                showModal && (
                    <div
                        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                        style={{ zIndex: 99999, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
                        onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); } }}
                    >
                        <div className="bg-white rounded-4 shadow-lg d-flex flex-column" style={{ width: "100%", maxWidth: bookSuccess ? "650px" : "760px", margin: "20px", maxHeight: "90vh", overflow: "hidden", transition: "max-width 0.3s ease" }}>
                            {/* Modal Header — fixed */}
                            <div className="d-flex align-items-center justify-content-between p-3 border-bottom flex-shrink-0" style={{ background: "#1d4ed8", borderRadius: "16px 16px 0 0" }}>
                                <div className="d-flex align-items-center gap-3">
                                    <div>
                                        <h5 className="fw-bold text-white mb-0" style={{ fontSize: "16px" }}>Book Appointment</h5>
                                        <small className="text-white opacity-75" style={{ fontSize: "13px" }}>{clinic.name}</small>
                                    </div>
                                </div>
                                <button
                                    className="btn p-0 d-flex align-items-center justify-content-center text-white opacity-75"
                                    style={{ width: 30, height: 30, background: "rgba(255,255,255,0.15)", borderRadius: "50%" }}
                                    onClick={() => setShowModal(false)}
                                >
                                    <i className="ti ti-x fs-6" />
                                </button>
                            </div>

                            {/* Modal Body — scrolls internally */}
                            <div className="p-3 flex-grow-1" id="modal-datepicker-container" style={{ position: "relative", overflowY: "auto", minHeight: 0 }}>
                                {bookSuccess ? (
                                    /* Success State Popup */
                                    <div className="text-center py-3">
                                        <div className="d-flex align-items-center justify-content-center mb-3">
                                            <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 64, height: 64, background: "#eff6ff", border: "2px solid #1d4ed8" }}>
                                                <i className="ti ti-circle-check-filled" style={{ fontSize: 36, color: "#1d4ed8" }} />
                                            </div>
                                        </div>
                                        <h4 className="fw-bold text-dark mb-1" style={{ fontSize: "24px" }}>Appointment Scheduled!</h4>
                                        <p className="text-secondary fw-semibold mb-3" style={{ fontSize: "15px" }}>{bookSuccess}</p>

                                        {/* Appointment ID Details */}
                                        <div className="mb-3 p-4 bg-light rounded-3 text-start border" style={{ borderColor: "#e2e8f0" }}>
                                            <div className={`d-flex justify-content-between ${generatedCreds?.isNewUserCreated ? 'mb-3 pb-3 border-bottom' : ''}`} style={{ borderColor: "#cbd5e1" }}>
                                                <span className="text-secondary fw-semibold" style={{ fontSize: "15px" }}>Appointment ID:</span>
                                                <span className="text-dark fw-bold" style={{ fontSize: "16px" }}>{generatedCreds?.appointmentCode || "AP..."}</span>
                                            </div>

                                            {/* Account Details if user was created */}
                                            {generatedCreds?.isNewUserCreated && (
                                                <div className="mt-3">
                                                    <div className="alert alert-info py-2 px-3 rounded-2 mb-3 d-flex align-items-start gap-2" style={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe", color: "#1e3a8a", fontSize: "14px" }}>
                                                        <i className="ti ti-info-circle-filled mt-1 flex-shrink-0" />
                                                        <span>
                                                            Your login account has been created! A credentials email has been sent to your Gmail.
                                                        </span>
                                                    </div>
                                                    <div className="d-flex justify-content-between mb-2">
                                                        <span className="text-secondary" style={{ fontSize: "14px" }}>Login Email:</span>
                                                        <span className="text-dark fw-bold" style={{ fontSize: "14px" }}>{generatedCreds?.email}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between">
                                                        <span className="text-secondary" style={{ fontSize: "14px" }}>Temporary Password:</span>
                                                        <span className="text-primary fw-bold" style={{ fontSize: "14px", letterSpacing: "0.5px" }}>{generatedCreds?.password}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Redesigned Notes Section - Blue & Black highlighted, detailed */}
                                        <div className="p-4 mb-4 rounded-3 text-start" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                                            <h6 className="fw-bold text-dark mb-3" style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Important Notes</h6>

                                            {/* Note 1 */}
                                            <div className="d-flex align-items-start gap-3 mb-3 pb-3 border-bottom" style={{ borderColor: "#e2e8f0" }}>
                                                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: "28px", height: "28px", background: "#1d4ed8", color: "white" }}>
                                                    <span className="fw-bold" style={{ fontSize: "14px" }}>1</span>
                                                </div>
                                                <div>
                                                    <p className="mb-0 text-dark fw-bold" style={{ fontSize: "15px", lineHeight: "1.5" }}>
                                                        Credentials for logging into the portal have been sent to your email.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Note 2 */}
                                            <div className="d-flex align-items-start gap-3">
                                                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: "28px", height: "28px", background: "#0f172a", color: "white" }}>
                                                    <span className="fw-bold" style={{ fontSize: "14px" }}>2</span>
                                                </div>
                                                <div>
                                                    <p className="mb-0 text-dark fw-bold" style={{ fontSize: "15px", lineHeight: "1.5" }}>
                                                        Please contact the clinic admin at <strong style={{ color: "#1d4ed8", fontSize: "16px" }}>{clinic.phone || clinic.whatsapp}</strong> to confirm your appointment. Your booking is currently scheduled.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom Action Buttons: Call Now, Download Slip, Done in one line */}
                                        <div className="d-flex gap-2">
                                            <a
                                                href={`tel:${clinic.phone}`}
                                                className="btn fw-bold py-2 px-2 rounded-3 text-white flex-grow-1 d-flex align-items-center justify-content-center gap-1 animate-hover"
                                                style={{ background: "#1d4ed8", fontSize: "12px", border: "none" }}
                                            >
                                                <i className="ti ti-phone-call" /> Call Now
                                            </a>
                                            <button
                                                onClick={handleDownloadSlip}
                                                className="btn fw-bold py-2 px-2 rounded-3 flex-grow-1 d-flex align-items-center justify-content-center gap-1 animate-hover"
                                                style={{ border: "1.5px solid #1d4ed8", color: "#1d4ed8", background: "white", fontSize: "12px", transition: "all 0.2s" }}
                                                onMouseOver={(e) => { e.currentTarget.style.background = "#eff6ff"; }}
                                                onMouseOut={(e) => { e.currentTarget.style.background = "white"; }}
                                            >
                                                <i className="ti ti-download" /> Download Slip
                                            </button>
                                            <button
                                                className="btn fw-bold py-2 px-2 rounded-3 text-white flex-grow-1 animate-hover"
                                                style={{ background: "#0f172a", fontSize: "12px", border: "none" }}
                                                onClick={() => setShowModal(false)}
                                            >
                                                Done
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* Booking Form State */
                                    <form onSubmit={handleBookSubmit} noValidate>
                                        <div className="row g-2">
                                            <div className="col-12 mb-2 d-flex justify-content-center">
                                                <div
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        backgroundColor: "#ffffff",
                                                        border: "1px solid #e2e8f0",
                                                        borderRadius: "9999px",
                                                        padding: "4px",
                                                        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.04)",
                                                        cursor: "pointer",
                                                        userSelect: "none",
                                                    }}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => { setIsSessionMode(false); setSelectedServices([]); }}
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "8px",
                                                            padding: "8px 20px",
                                                            borderRadius: "9999px",
                                                            fontSize: "13px",
                                                            fontWeight: 600,
                                                            transition: "all 0.3s ease",
                                                            border: "none",
                                                            outline: "none",
                                                            background: !isSessionMode
                                                                ? "linear-gradient(90deg, #1d4ed8, #3b82f6)"
                                                                : "transparent",
                                                            color: !isSessionMode ? "#ffffff" : "#475569",
                                                            boxShadow: !isSessionMode
                                                                ? "0 4px 12px rgba(29, 78, 216, 0.25)"
                                                                : "none",
                                                        }}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M4 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
                                                            <circle cx="10" cy="7" r="4" />
                                                            <path d="M21 8a2 2 0 0 0 -2 -2h-3a2 2 0 0 0 -2 2v3a2 2 0 0 0 2 2h1l2 2v-2a2 2 0 0 0 1 -2z" />
                                                        </svg>
                                                        Consultation
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsSessionMode(true)}
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "8px",
                                                            padding: "8px 20px",
                                                            borderRadius: "9999px",
                                                            fontSize: "13px",
                                                            fontWeight: 600,
                                                            transition: "all 0.3s ease",
                                                            border: "none",
                                                            outline: "none",
                                                            background: isSessionMode
                                                                ? "linear-gradient(90deg, #1d4ed8, #3b82f6)"
                                                                : "transparent",
                                                            color: isSessionMode ? "#ffffff" : "#475569",
                                                            boxShadow: isSessionMode
                                                                ? "0 4px 12px rgba(29, 78, 216, 0.25)"
                                                                : "none",
                                                        }}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                            <line x1="16" y1="2" x2="16" y2="6" />
                                                            <line x1="8" y1="2" x2="8" y2="6" />
                                                            <line x1="3" y1="10" x2="21" y2="10" />
                                                            <path d="M8 14h.01" />
                                                            <path d="M12 14h.01" />
                                                            <path d="M16 14h.01" />
                                                            <path d="M8 18h.01" />
                                                            <path d="M12 18h.01" />
                                                            <path d="M16 18h.01" />
                                                        </svg>
                                                        Session
                                                    </button>
                                                </div>
                                            </div>
                                            {/* Appointment ID - TOP */}
                                            <div className="col-12">
                                                <div className="d-flex align-items-center gap-2 p-2 rounded-3" style={{ background: "linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)", border: "1px solid #bfdbfe" }}>
                                                    <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 32, height: 32, background: "#1d4ed8", flexShrink: 0 }}>
                                                        <i className="ti ti-hash text-white" style={{ fontSize: "14px" }} />
                                                    </div>
                                                    <div>
                                                        <div className="text-muted" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Appointment ID</div>
                                                        <div className="fw-bold" style={{ fontSize: "15px", color: "#1d4ed8", letterSpacing: "0.5px" }}>{clinic.nextAppointmentCode || "AP..."}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Patient First & Last Name */}
                                            <div className="col-6">
                                                <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "13px" }}>First Name <span className="text-danger">*</span></label>
                                                <IconFormControl
                                                    type="text"
                                                    fieldLabel="first name"
                                                    className={`rounded-3 ${bookFormErrors.firstName ? 'is-invalid' : ''}`}
                                                    placeholder="First name"
                                                    value={bookForm.firstName}
                                                    onChange={e => setBookForm(f => ({ ...f, firstName: e.target.value }))}
                                                    required
                                                    style={{ fontSize: "14px" }}
                                                />
                                                {bookFormErrors.firstName && <div className="invalid-feedback">{bookFormErrors.firstName}</div>}
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "13px" }}>Last Name <span className="text-danger">*</span></label>
                                                <IconFormControl
                                                    type="text"
                                                    fieldLabel="last name"
                                                    className={`rounded-3 ${bookFormErrors.lastName ? 'is-invalid' : ''}`}
                                                    placeholder="Last name"
                                                    value={bookForm.lastName}
                                                    onChange={e => setBookForm(f => ({ ...f, lastName: e.target.value }))}
                                                    required
                                                    style={{ fontSize: "14px" }}
                                                />
                                                {bookFormErrors.lastName && <div className="invalid-feedback">{bookFormErrors.lastName}</div>}
                                            </div>

                                            {/* Email & Phone */}
                                            <div className="col-12">
                                                <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "13px" }}>Email Address <span className="text-danger">*</span></label>
                                                <IconFormControl
                                                    type="email"
                                                    fieldLabel="email"
                                                    className={`rounded-3 ${bookFormErrors.email ? 'is-invalid' : ''}`}
                                                    placeholder="username@example.com"
                                                    value={bookForm.email}
                                                    onChange={e => setBookForm(f => ({ ...f, email: e.target.value }))}
                                                    required
                                                    style={{ fontSize: "14px" }}
                                                />
                                                {bookFormErrors.email && <div className="invalid-feedback">{bookFormErrors.email}</div>}
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "13px" }}>Phone Number <span className="text-danger">*</span></label>
                                                <IconFormControl
                                                    type="tel"
                                                    fieldLabel="phone"
                                                    className={`rounded-3 ${bookFormErrors.phone ? 'is-invalid' : ''}`}
                                                    placeholder="+91 XXXXX XXXXX"
                                                    value={bookForm.phone}
                                                    onChange={e => setBookForm(f => ({ ...f, phone: e.target.value }))}
                                                    required
                                                    style={{ fontSize: "14px" }}
                                                />
                                                {bookFormErrors.phone && <div className="invalid-feedback">{bookFormErrors.phone}</div>}
                                            </div>

                                            {/* Gender */}
                                            <div className="col-6">
                                                <GenderOptionGroup
                                                    showLabel
                                                    required
                                                    value={bookForm.gender}
                                                    onChange={(val) => setBookForm(f => ({ ...f, gender: val }))}
                                                />
                                                {bookFormErrors.gender && <div className="invalid-feedback d-block">{bookFormErrors.gender}</div>}
                                            </div>

                                            {/* Patient Address */}
                                            <div className="col-12">
                                                <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "13px" }}>Address (Optional)</label>
                                                <IconFormControl
                                                    type="text"
                                                    fieldLabel="address"
                                                    className="rounded-3"
                                                    placeholder="House no., Street, City, Pincode"
                                                    value={bookForm.address}
                                                    onChange={e => setBookForm(f => ({ ...f, address: e.target.value }))}
                                                    style={{ fontSize: "14px" }}
                                                />
                                            </div>

                                            {/* Doctor Selection */}
                                            <div className="col-12">
                                                <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "13px" }}>Select Doctor <span className="text-danger">*</span></label>
                                                <select
                                                    className={`form-select rounded-3 text-secondary ${bookFormErrors.doctorId ? 'is-invalid' : ''}`}
                                                    value={bookForm.doctorId}
                                                    onChange={e => setBookForm(f => ({ ...f, doctorId: e.target.value, date: null, time: "" }))}
                                                    style={{ fontSize: "14px" }}
                                                >
                                                    <option value="">Select a doctor</option>
                                                    {clinic.doctors.map((d: any) => (
                                                        <option key={d.id} value={d.id}>
                                                            {d.name}{d.specialization ? ` — ${d.specialization}` : ""}{d.qualification ? ` (${d.qualification})` : ""}
                                                        </option>
                                                    ))}
                                                </select>
                                                {bookFormErrors.doctorId && <div className="invalid-feedback">{bookFormErrors.doctorId}</div>}
                                                {/* Show selected doctor info */}
                                                {(bookForm.doctorId || preselectedDoctor) && (() => {
                                                    const selDoc = clinic.doctors.find((d: any) => d.id === (bookForm.doctorId || preselectedDoctor));
                                                    if (!selDoc) return null;
                                                    return (
                                                        <div className="mt-2 p-2 rounded-3 d-flex align-items-center gap-2" style={{ background: "#f0f9ff", border: "1px solid #bae6fd" }}>
                                                            {selDoc.photo ? (
                                                                <img src={selDoc.photo} alt={selDoc.name} className="rounded-circle" style={{ width: 36, height: 36, objectFit: "cover", flexShrink: 0 }} />
                                                            ) : (
                                                                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 36, height: 36, background: "#1d4ed8", flexShrink: 0 }}>
                                                                    <i className="ti ti-stethoscope text-white" style={{ fontSize: 18 }} />
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className="fw-bold text-dark" style={{ fontSize: 13 }}>{selDoc.name}</div>
                                                                <div className="text-muted" style={{ fontSize: 11 }}>
                                                                    {[selDoc.specialization, selDoc.qualification].filter(Boolean).join(" · ")}
                                                                    {selDoc.experience ? ` · ${selDoc.experience} yrs exp` : ""}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>

                                            {/* Calendar (antd DatePicker with Custom Styles) */}
                                            <div className="col-6">
                                                <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "13px" }}>Date <span className="text-danger">*</span></label>
                                                <DatePicker
                                                    className={`form-control rounded-3 datetimepicker w-100 ${bookFormErrors.date ? 'is-invalid' : ''}`}
                                                    format="DD-MM-YYYY"
                                                    placeholder="DD-MM-YYYY"
                                                    suffixIcon={null}
                                                    cellRender={cellRender}
                                                    value={bookForm.date}
                                                    disabled={!(bookForm.doctorId || preselectedDoctor)}
                                                    onChange={(d: Dayjs | null) => setBookForm(f => ({ ...f, date: d, time: "" }))}
                                                    getPopupContainer={() => document.getElementById("modal-datepicker-container") || document.body}
                                                    style={{ fontSize: "14px", height: "38px" }}
                                                />
                                                {bookFormErrors.date && <div className="invalid-feedback d-block">{bookFormErrors.date}</div>}
                                            </div>

                                            {/* Time Slots */}
                                            <div className="col-6">
                                                {isSlotBookingActive ? (
                                                    <div className="position-relative" ref={landingDropdownRef}>
                                                        <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "13px" }}>Time Slot <span className="text-danger">*</span></label>
                                                        <div
                                                            onClick={() => {
                                                                if (bookForm.date && slotOptions.length > 0) {
                                                                    setShowLandingSlotsDropdown(!showLandingSlotsDropdown);
                                                                }
                                                            }}
                                                            onFocus={() => setIsLandingSlotsDropdownFocused(true)}
                                                            onBlur={() => setIsLandingSlotsDropdownFocused(false)}
                                                            tabIndex={0}
                                                            className={`form-control rounded-3 d-flex align-items-center justify-content-between ${bookFormErrors.time ? 'is-invalid' : ''}`}
                                                            style={{
                                                                minHeight: "38px",
                                                                border: isLandingSlotsDropdownFocused || showLandingSlotsDropdown ? "1px solid #2e37a4" : "1px solid #dee2e6",
                                                                boxShadow: isLandingSlotsDropdownFocused || showLandingSlotsDropdown ? "0 0 0 1px #2e37a4" : "none",
                                                                fontSize: "14px",
                                                                padding: "6px 12px",
                                                                cursor: !bookForm.date || slotOptions.length === 0 ? "not-allowed" : "pointer",
                                                                backgroundColor: !bookForm.date || slotOptions.length === 0 ? "#f8fafc" : "white",
                                                                transition: "all 0.2s ease-in-out",
                                                                outline: "none",
                                                            }}
                                                        >
                                                            <span className={bookForm.time ? "text-dark fw-semibold" : "text-muted"}>
                                                                {!bookForm.date
                                                                    ? "Select date first"
                                                                    : slotOptions.length === 0
                                                                        ? "No slots available"
                                                                        : bookForm.time
                                                                            ? dayjs(`2000-01-01T${bookForm.time}`).format("hh:mm A")
                                                                            : "Select slot"}
                                                            </span>
                                                            <i className={`ti ti-chevron-${showLandingSlotsDropdown ? 'up' : 'down'} text-secondary`} style={{ fontSize: "11px" }} />
                                                        </div>

                                                        {showLandingSlotsDropdown && bookForm.date && slotOptions.length > 0 && (
                                                            <div
                                                                className="position-absolute w-100 mt-1 p-3 border rounded shadow bg-white"
                                                                style={{
                                                                    zIndex: 1050,
                                                                    borderRadius: "10px",
                                                                    borderColor: "#cbd5e1",
                                                                    maxHeight: "250px",
                                                                    overflowY: "auto",
                                                                }}
                                                            >
                                                                <div className="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom">
                                                                    <span className="small text-muted fw-bold">AVAILABLE SLOTS</span>
                                                                    <span className="badge bg-soft-primary text-primary px-2 py-0.5 rounded-pill fs-11" style={{ backgroundColor: "#eef2ff", color: "#6366f1" }}>
                                                                        {slotOptions.length} Options
                                                                    </span>
                                                                </div>
                                                                <div 
                                                                    style={{
                                                                        display: "grid",
                                                                        gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                                                                        gap: "8px",
                                                                    }}
                                                                >
                                                                    <style>{`
                                                                        .select-slot-block {
                                                                            transition: all 0.2s ease-in-out;
                                                                        }
                                                                        .select-slot-block:hover:not(.filled) {
                                                                            transform: translateY(-2px);
                                                                            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                                                                        }
                                                                    `}</style>
                                                                    {slotOptions.map((opt: any, idx: number) => {
                                                                        const isSelected = bookForm.time === opt.value;
                                                                        const isFilled = opt.isDisabled;
                                                                        const isLastSlot = opt.bookingsAvailable === 1;

                                                                        let bg = "#ecfdf5"; // available
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
                                                                            bg = "#2e37a4";
                                                                            border = "#2e37a4";
                                                                            text = "#ffffff";
                                                                        }

                                                                        return (
                                                                            <div
                                                                                key={opt.value || idx}
                                                                                onClick={() => {
                                                                                    if (isFilled) {
                                                                                        toast.warning("This slot is already filled.");
                                                                                        return;
                                                                                    }
                                                                                    setBookForm(f => ({ ...f, time: opt.value }));
                                                                                    setShowLandingSlotsDropdown(false);
                                                                                }}
                                                                                className={`text-center px-2 py-2 select-slot-block ${isFilled ? 'filled' : ''}`}
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
                                                                                    {dayjs(`2000-01-01T${opt.value}`).format("hh:mm A")}
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
                                                        {bookFormErrors.time && <div className="invalid-feedback d-block">{bookFormErrors.time}</div>}
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "13px" }}>Time Slot <span className="text-danger">*</span></label>
                                                        <select
                                                            className={`form-select rounded-3 text-secondary ${bookFormErrors.time ? 'is-invalid' : ''}`}
                                                            value={bookForm.time}
                                                            disabled={!bookForm.date || sessionOptions.length === 0}
                                                            onChange={e => setBookForm(f => ({ ...f, time: e.target.value }))}
                                                            required
                                                            style={{ fontSize: "14px" }}
                                                        >
                                                            <option value="">
                                                                {!bookForm.date
                                                                    ? "Select date first"
                                                                    : sessionOptions.length > 0 ? "Select session" : "No sessions available"}
                                                            </option>
                                                            {sessionOptions.map((opt: any) => (
                                                                <option key={opt.value} value={opt.value} disabled={opt.isDisabled}>
                                                                    {opt.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {bookFormErrors.time && <div className="invalid-feedback">{bookFormErrors.time}</div>}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Services Multi-Select — visible only in Session mode */}
                                            {isSessionMode && (
                                                <div className="col-12">
                                                    <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "13px" }}>Select Services <span className="text-danger">*</span></label>
                                                    <select
                                                        className={`form-select rounded-3 text-secondary ${bookFormErrors.services ? 'is-invalid' : ''}`}
                                                        value={selectedServices.length > 0 ? selectedServices[0] : ""}
                                                        onChange={(e) => setSelectedServices(e.target.value ? [e.target.value] : [])}
                                                        style={{ fontSize: "14px" }}
                                                    >
                                                        <option value="">Select a service</option>
                                                        {clinic?.rawServices?.map((s) => (
                                                            <option key={s.id} value={s.id}>
                                                                {s.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {bookFormErrors.services && <div className="invalid-feedback d-block">{bookFormErrors.services}</div>}
                                                </div>
                                            )}

                                            {/* Reason Symptoms */}
                                            <div className="col-12">
                                                <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "13px" }}>Reason / Symptoms (Optional)</label>
                                                <IconTextarea
                                                    fieldLabel="notes"
                                                    className="rounded-3"
                                                    rows={2}
                                                    placeholder="Brief description of your symptoms..."
                                                    value={bookForm.reason}
                                                    onChange={e => setBookForm(f => ({ ...f, reason: e.target.value }))}
                                                    style={{ fontSize: "14px", resize: "none" }}
                                                />
                                            </div>

                                            {/* Error Message */}
                                            {bookError && (
                                                <div className="col-12">
                                                    <div className="alert alert-danger py-2 px-3 rounded-3 d-flex align-items-center gap-2 mb-0" style={{ fontSize: "13px" }}>
                                                        <i className="ti ti-alert-circle text-danger fs-5" />
                                                        {bookError}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Submit Button */}
                                            <div className="col-12 mt-1">
                                                <button
                                                    type="submit"
                                                    className="btn btn-primary w-100 fw-bold py-2 rounded-3 text-white d-flex align-items-center justify-content-center gap-2"
                                                    style={{ fontSize: "15px", border: "none" }}
                                                    disabled={bookLoading}
                                                >
                                                    {bookLoading ? (
                                                        <><span className="spinner-border spinner-border-sm" /> Booking...</>
                                                    ) : (
                                                        <><i className="ti ti-lock" /> Confirm Appointment</>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Gallery Lightbox Overlay */}
            {activePhoto && (
                <div 
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ zIndex: 999999, background: "rgba(15, 23, 42, 0.9)", backdropFilter: "blur(6px)" }}
                    onClick={() => setActivePhoto(null)}
                >
                    <button 
                        type="button" 
                        className="btn-close btn-close-white position-absolute top-0 end-0 m-4"
                        style={{ fontSize: "1.5rem", filter: "invert(1)" }}
                        onClick={() => setActivePhoto(null)}
                    />
                    <img 
                        src={resolveMediaUrl(activePhoto)} 
                        alt="Gallery Preview" 
                        className="img-fluid rounded-3 shadow-lg" 
                        style={{ maxHeight: "85vh", maxWidth: "95vw", objectFit: "contain" }} 
                    />
                </div>
            )}

        </div >
    );
}
