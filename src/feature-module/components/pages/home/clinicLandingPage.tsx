import { useEffect, useState, useMemo } from "react";
import { Link, useParams } from "react-router";
import { all_routes } from "../../../routes/all_routes";
import FooterFront from "./FooterFront";
import { DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { resolveMediaUrl } from "../../../../core/config/api";

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
    bio: string;
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
    gallery: { url: string; category: string }[];
    workingDays: { schedules: any[]; offDays: number[] } | null;
    onboardingStep?: number;
    nextAppointmentCode?: string;
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
    const [bookSuccess, setBookSuccess] = useState<string | null>(null);
    const [bookError, setBookError] = useState<string | null>(null);

    // Credentials returned on new registration
    const [generatedCreds, setGeneratedCreds] = useState<{
        email?: string;
        password?: string;
        isNewUserCreated?: boolean;
        appointmentCode?: string;
    } | null>(null);

    // Selected Doctor's Availability State
    const [availability, setAvailability] = useState<{
        schedules: any;
        duration?: number;
        holidays: any[];
        leaves: any[];
        appointments: any[];
        clinicWorkingDays?: number[];
        clinicSchedules?: any[];
    } | null>(null);

    // ── Doctor Profile Modal State ──
    const [selectedDocDetails, setSelectedDocDetails] = useState<Doctor | null>(null);
    const [activeTab, setActiveTab] = useState("Monday");

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

            return {
                value: session.from,
                label: `${sessionLabel}: ${fromFormatted} – ${toFormatted}`,
            };
        });
    }, [availability, bookForm.date]);

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
                    reason: bookForm.reason
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

    const avgRating = clinic.reviews.length
        ? Math.round(clinic.reviews.reduce((s, r) => s + r.rating, 0) / clinic.reviews.length)
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

    const totalReviews = clinic.reviews.length > 0 ? clinic.reviews.length : "350+";

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
                        <li><a href="#contact" onClick={(e) => { e.preventDefault(); setSelectedDocDetails(null); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }}>Contact</a></li>
                    </ul>

                    <div className="dy-nav-actions d-flex align-items-center gap-2">
                        <Link
                            to={all_routes.login}
                            className="btn btn-outline-primary px-4 py-2 fw-semibold d-flex align-items-center justify-content-center"
                            style={{ borderRadius: '8px', minHeight: '44px', border: '2px solid #1d4ed8', color: '#1d4ed8' }}
                        >
                            Login
                        </Link>
                        <button
                            type="button"
                            onClick={() => openBooking("")}
                            className="btn btn-primary px-4 py-2 fw-semibold d-flex align-items-center justify-content-center"
                            style={{ borderRadius: '8px', minHeight: '44px' }}
                        >
                            Book Appointment
                        </button>
                    </div>
                </div>
            </nav>

            {/* ══════ DOCTOR DETAILS PROFILE PAGE MODE (CLONE OF ADMIN PANEL) ══════ */}
            {selectedDocDetails ? (
                <div className="page-wrapper" style={{ background: "#f1f5f9", minHeight: "calc(100vh - 80px)", margin: 0 }}>
                    <div className="container-fluid p-0">
                        {/* ═══ Main Layout Row with Left Sidebar Ads ═══ */}
                        <div className="row g-0">
                            {/* Left Sidebar Ads (The Functional Sidebar) */}
                            <div className="col-lg-3 d-none d-lg-block bg-white border-end shadow-sm" style={{ maxWidth: "300px", minHeight: "calc(100vh - 80px)" }}>
                                <div className="sticky-top p-3" style={{ top: "80px", zIndex: 10 }}>
                                    <div className="card border-0 mb-3 overflow-hidden rounded shadow-sm">
                                        <img src="/assets/img/ad-banner-1.png" className="img-fluid w-100" alt="Ad 1" />
                                    </div>
                                    <div className="card bg-primary text-white border-0 mb-3 p-3 rounded shadow-sm">
                                        <h6 className="fw-bold mb-2 text-white">Health Tip</h6>
                                        <p className="fs-12 mb-0 opacity-75">Stay hydrated and exercise daily for a better heart health. Book a consultation now!</p>
                                    </div>
                                    <div className="card border-0 mb-3 overflow-hidden rounded shadow-sm">
                                        <img src="/assets/img/ad-banner-tall.png" className="img-fluid w-100" alt="Tall Ad" />
                                    </div>
                                    <div className="card border-0 mb-3 overflow-hidden rounded shadow-sm">
                                        <img src="/assets/img/ad-banner-2.png" className="img-fluid w-100" alt="Ad 2" />
                                    </div>
                                    <div className="card bg-success text-white border-0 mb-3 p-3 rounded shadow-sm">
                                        <h6 className="fw-bold mb-2 text-white">Latest News</h6>
                                        <p className="fs-12 mb-0 opacity-75">New cardiology department opening next week. Modern equipment and top specialists.</p>
                                    </div>
                                    <div className="card border-0 mb-3 overflow-hidden rounded shadow-sm">
                                        <img src="/assets/img/ad-banner-3.png" className="img-fluid w-100" alt="Ad 3" />
                                    </div>

                                    {/* ═══ Left Sidebar Extra Content ═══ */}
                                    <div className="card bg-danger text-white border-0 mb-3 p-3 rounded shadow-sm">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="bg-white text-danger rounded-circle p-2 d-flex align-items-center justify-content-center shadow-sm" style={{ width: 45, height: 45 }}>
                                                <i className="ti ti-phone-filled fs-4" />
                                            </div>
                                            <div>
                                                <h6 className="fw-bold mb-0 text-white">Emergency Call</h6>
                                                <p className="fs-14 fw-bold mb-0">+91 12345 67890</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Doctor Content Area */}
                            <div className="col-lg-9 flex-fill p-4">
                                {/* Top Navigation */}
                                <div className="mb-4">
                                    <h6 className="fw-semibold fs-14 mb-0">
                                        <a href="#" onClick={(e) => { e.preventDefault(); setSelectedDocDetails(null); }} className="text-secondary text-decoration-none hover-primary">
                                            <i className="ti ti-arrow-left me-1" />
                                            Back to Search Results
                                        </a>
                                    </h6>
                                </div>

                                {/* Top Hero Card */}
                                <div className="card border-0 shadow-sm mb-4">
                                    <div className="card-body p-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
                                        <div className="d-flex align-items-center flex-sm-nowrap flex-wrap gap-3">
                                            <div className="me-3 doctor-profile-img">
                                                <img
                                                    src={selectedDocDetails.photo ? (
                                                        selectedDocDetails.photo.startsWith('http') || selectedDocDetails.photo.startsWith('data:')
                                                            ? selectedDocDetails.photo
                                                            : selectedDocDetails.photo.includes('uploads')
                                                                ? `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${selectedDocDetails.photo.startsWith('/') ? '' : '/'}${selectedDocDetails.photo}`
                                                                : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/uploads/doctors/${selectedDocDetails.photo}`
                                                    ) : `https://placehold.co/120x120/1d4ed8/FFF?text=${selectedDocDetails.name.slice(0, 2).toUpperCase()}`}
                                                    alt={selectedDocDetails.name}
                                                    className="rounded"
                                                    style={{ width: "100px", height: "100px", objectFit: "cover" }}
                                                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `https://placehold.co/120x120/1d4ed8/FFF?text=${selectedDocDetails.name.slice(0, 2).toUpperCase()}` }}
                                                />
                                            </div>
                                            <div className="flex-fill">
                                                <div className="d-flex align-items-center mb-1 flex-wrap gap-2">
                                                    <h6 className="mb-0 fw-semibold">{selectedDocDetails.name}</h6>
                                                    {selectedDocDetails.specialization && (
                                                        <span className="badge border bg-white text-dark fw-medium">
                                                            <i className="ti ti-point-filled me-1 text-info" />
                                                            {selectedDocDetails.specialization}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="d-block mb-3 fs-13">
                                                    {selectedDocDetails.qualification} {(selectedDocDetails as any).medicalLicenseNumber ? ` · License: ${(selectedDocDetails as any).medicalLicenseNumber}` : ""}
                                                </span>
                                                <div className="d-flex align-items-center flex-wrap gap-2">
                                                    <p className="mb-0 fs-13">
                                                        <i className="ti ti-building-hospital me-1" />
                                                        Clinic : {(selectedDocDetails as any).clinicName || clinic.name}
                                                    </p>
                                                    <span className="badge fw-medium badge-soft-success">
                                                        <i className="ti ti-point-filled me-1 text-success" />
                                                        Available
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-end">
                                            <p className="mb-2">Consultation Charge</p>
                                            <h6 className="fs-18 fw-bold mb-3 text-dark">
                                                ₹{selectedDocDetails.fee}
                                                <span className="fw-normal text-secondary fs-14">
                                                    {" "}
                                                    / 30 Min
                                                </span>
                                            </h6>
                                            <button
                                                type="button"
                                                onClick={() => openBooking(selectedDocDetails.id)}
                                                className="btn btn-primary"
                                            >
                                                <i className="ti ti-calendar-event me-1" />
                                                Book Appointment
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="row g-3">
                                    <div className="col-lg-8">
                                        <div className="card mb-3">
                                            <div className="card-body">
                                                <h5 className="fw-bold mb-3">Availability</h5>
                                                <ul className="nav nav-tabs nav-bordered nav-border-bottom mb-3">
                                                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                                                        <li key={day} className="nav-item flex-fill">
                                                            <button
                                                                type="button"
                                                                className={`nav-link text-center w-100 fw-semibold bg-transparent ${activeTab === day ? "active" : ""}`}
                                                                onClick={() => setActiveTab(day)}
                                                            >
                                                                {day}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                                <div className="d-flex align-items-center flex-wrap gap-2">
                                                    {(() => {
                                                        let scheds = (selectedDocDetails as any).schedules;
                                                        if (typeof scheds === 'string') {
                                                            try { scheds = JSON.parse(scheds); } catch (e) { scheds = {}; }
                                                        }
                                                        if (!scheds || typeof scheds !== 'object') scheds = {};

                                                        const slots = (scheds as any)[activeTab] || [];
                                                        if (!Array.isArray(slots) || slots.length === 0) {
                                                            return <span className="text-muted">Not Available</span>;
                                                        }

                                                        return slots.map((slot: any, idx: number) => (
                                                            <span key={idx} className="d-inline-flex align-items-center bg-light rounded flex-fill text-center justify-content-center p-2 text-dark" style={{ minWidth: "140px" }}>
                                                                {slot.session ? `${slot.session}: ` : ""}{slot.from || slot.startTime} - {slot.to || slot.endTime}
                                                            </span>
                                                        ));
                                                    })()}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="card mb-3">
                                            <div className="card-body">
                                                <h5 className="fw-bold mb-3">Short Bio</h5>
                                                <p className="mb-0 text-muted">{selectedDocDetails.bio || "No bio provided."}</p>
                                            </div>
                                        </div>

                                        <div className="card mb-3">
                                            <div className="card-body">
                                                <h5 className="fw-bold mb-3">Education Information</h5>
                                                {((selectedDocDetails as any).educations || []).length > 0 ? (
                                                    <ul className="activity-feed rounded mb-0">
                                                        {((selectedDocDetails as any).educations || []).map((edu: any, idx: number) => (
                                                            <li key={`edu-${idx}`} className="feed-item timeline-item" style={{ listStyle: "none", position: "relative", paddingLeft: "30px", marginBottom: "20px", borderLeft: "2px solid #e2e8f0" }}>
                                                                <h6 className="fw-bold mb-1 fs-14">{edu.university ? `${edu.university} - ` : ""}{edu.degree}</h6>
                                                                <p className="mb-0 text-muted fs-13">
                                                                    {edu.from ? new Date(edu.from).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) : ""} - {edu.to ? new Date(edu.to).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) : "Present"}
                                                                </p>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-muted mb-0">No education information added.</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="card mb-3">
                                            <div className="card-body">
                                                <h5 className="fw-bold mb-3">Awards &amp; Recognition</h5>
                                                {((selectedDocDetails as any).awards || []).length > 0 ? (
                                                    ((selectedDocDetails as any).awards || []).map((award: any, idx: number) => (
                                                        <div key={`award-${idx}`} className={idx < (selectedDocDetails as any).awards.length - 1 ? "mb-3" : ""}>
                                                            <div className="d-flex align-items-center mb-2">
                                                                <span className="me-2">
                                                                    <i className="ti ti-award" />
                                                                </span>
                                                                <h6 className="mb-0 fw-bold">{award.name || award.award} {award.year ? `(${award.year})` : ""}</h6>
                                                            </div>
                                                            <p className="mb-0 text-muted fs-13">{award.description || "—"}</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-muted mb-0">No awards added.</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="card">
                                            <div className="card-body">
                                                <h5 className="fw-bold mb-3">Certifications</h5>
                                                {((selectedDocDetails as any).certifications || []).length > 0 ? (
                                                    ((selectedDocDetails as any).certifications || []).map((cert: any, idx: number) => (
                                                        <div key={`cert-${idx}`} className={idx < (selectedDocDetails as any).certifications.length - 1 ? "mb-3" : ""}>
                                                            <div className="d-flex align-items-center mb-2">
                                                                <span className="me-2">
                                                                    <i className="ti ti-award" />
                                                                </span>
                                                                <h6 className="mb-0 fw-bold">{cert.name || cert.certification} {cert.year ? `(${cert.year})` : ""}</h6>
                                                            </div>
                                                            <p className="mb-0 text-muted fs-13">{cert.description || "—"}</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-muted mb-0">No certifications added.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-lg-4">
                                        <div className="card">
                                            <div className="card-body">
                                                <h6 className="fw-bold mb-4 fs-16">About</h6>
                                                <div className="d-flex flex-column gap-3">
                                                    <div className="d-flex align-items-center">
                                                        <span className="avatar rounded-circle bg-light text-dark fs-16 flex-shrink-0 me-3 d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                                                            <i className="ti ti-file" />
                                                        </span>
                                                        <div>
                                                            <h6 className="fw-semibold fs-13 mb-1">Medical License Number</h6>
                                                            <p className="mb-0 text-secondary" style={{ fontSize: "14px" }}>{(selectedDocDetails as any).medicalLicenseNumber || "—"}</p>
                                                        </div>
                                                    </div>

                                                    <div className="d-flex align-items-center">
                                                        <span className="avatar rounded-circle bg-light text-dark fs-16 flex-shrink-0 me-3 d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                                                            <i className="ti ti-map-pin" />
                                                        </span>
                                                        <div>
                                                            <h6 className="fw-semibold fs-13 mb-1">Location</h6>
                                                            <p className="mb-0 text-secondary" style={{ fontSize: "14px" }}>{clinic.address}</p>
                                                        </div>
                                                    </div>

                                                    <div className="d-flex align-items-center">
                                                        <span className="avatar rounded-circle bg-light text-dark fs-16 flex-shrink-0 me-3 d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                                                            <i className="ti ti-calendar-event" />
                                                        </span>
                                                        <div>
                                                            <h6 className="fw-semibold fs-13 mb-1">DOB</h6>
                                                            <p className="mb-0 text-secondary" style={{ fontSize: "14px" }}>{(selectedDocDetails as any).dob ? new Date((selectedDocDetails as any).dob).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) : "—"}</p>
                                                        </div>
                                                    </div>

                                                    <div className="d-flex align-items-center">
                                                        <span className="avatar rounded-circle bg-light text-dark fs-16 flex-shrink-0 me-3 d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                                                            <i className="ti ti-droplet-filled" />
                                                        </span>
                                                        <div>
                                                            <h6 className="fw-semibold fs-13 mb-1">Blood Group</h6>
                                                            <p className="mb-0 text-secondary" style={{ fontSize: "14px" }}>{(selectedDocDetails as any).bloodGroup || "—"}</p>
                                                        </div>
                                                    </div>

                                                    <div className="d-flex align-items-center">
                                                        <span className="avatar rounded-circle bg-light text-dark fs-16 flex-shrink-0 me-3 d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                                                            <i className="ti ti-user-check" />
                                                        </span>
                                                        <div>
                                                            <h6 className="fw-semibold fs-13 mb-1">Year of Experience</h6>
                                                            <p className="mb-0 text-secondary" style={{ fontSize: "14px" }}>{selectedDocDetails.experience ? `${selectedDocDetails.experience}+ Years` : "—"}</p>
                                                        </div>
                                                    </div>

                                                    <div className="d-flex align-items-center">
                                                        <span className="avatar rounded-circle bg-light text-dark fs-16 flex-shrink-0 me-3 d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                                                            <i className="ti ti-gender-male" />
                                                        </span>
                                                        <div>
                                                            <h6 className="fw-semibold fs-13 mb-1">Gender</h6>
                                                            <p className="mb-0 text-secondary" style={{ fontSize: "14px" }}>{(selectedDocDetails as any).gender || "—"}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ═══ Right Sidebar Fill Widgets ═══ */}
                                        <div className="card border-0 shadow-sm mb-4">
                                            <div className="card-body p-2 px-3">
                                                <h6 className="fw-bold mb-2 fs-14 d-flex align-items-center">
                                                    <i className="ti ti-clock-hour-4 me-2 text-primary" />
                                                    Clinic Hours
                                                </h6>
                                                <table className="table table-borderless table-sm mb-0">
                                                    <tbody className="fs-13">
                                                        {clinic.workingDays?.schedules ? (
                                                            clinic.workingDays.schedules.map((s: any, i: number) => {
                                                                const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                                                                return (
                                                                    <tr key={i} className={!s.isActive ? 'opacity-50' : ''}>
                                                                        <td>{dayNames[s.day]}</td>
                                                                        <td className={`text-end fw-medium ${s.isActive ? 'text-primary' : 'text-danger'}`}>
                                                                            {s.isActive ? `${s.startTime} - ${s.endTime}` : 'Closed'}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })
                                                        ) : (
                                                            <>
                                                                <tr><td>Mon - Fri</td><td className="text-end text-primary fw-medium">09:00 - 18:00</td></tr>
                                                                <tr className="text-danger"><td>Saturday</td><td className="text-end fw-medium">10:00 - 14:00</td></tr>
                                                                <tr className="opacity-50"><td>Sunday</td><td className="text-end">Closed</td></tr>
                                                            </>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Proper Section: Patient Reviews & Trust elements */}
                                <div className="mt-4">
                                    <div className="card shadow-sm border-0">
                                        <div className="card-body p-4">
                                            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
                                                <h5 className="fw-bold mb-0">Patient Reviews & Feedback</h5>
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className="badge bg-soft-primary text-primary px-3 py-2 rounded-pill fw-bold">4.8 / 5.0 Rating</span>
                                                </div>
                                            </div>

                                            {/* Stylized Review Cards */}
                                            <div className="row g-3">
                                                {[
                                                    { name: "Rahul Sharma", date: "12 May 2026", rating: 5, initial: "R", color: "primary", comment: "Excellent experience. The doctor was very professional and explained the diagnosis clearly." },
                                                    { name: "Sanya Gupta", date: "05 May 2026", rating: 5, initial: "S", color: "success", comment: "The staff was helpful and the treatment was very effective. Minimal wait time." },
                                                    { name: "Ankit Verma", date: "28 April 2026", rating: 4, initial: "A", color: "info", comment: "Highly recommended for orthopedic consultation. Modern clinic and great facilities." }
                                                ].map((rev, i) => (
                                                    <div key={i} className="col-lg-4">
                                                        <div className="p-3 rounded-3 border bg-white h-100 shadow-none hover-shadow-sm transition-all">
                                                            <div className="d-flex align-items-center mb-3">
                                                                <div className={`avatar avatar-sm rounded-circle bg-soft-${rev.color} text-${rev.color} fw-bold me-2 d-flex align-items-center justify-content-center`} style={{ width: 35, height: 35 }}>{rev.initial}</div>
                                                                <div className="flex-fill">
                                                                    <div className="text-warning small mb-0">
                                                                        {Array.from({ length: rev.rating }).map((_, idx) => <i key={idx} className="ti ti-star-filled" />)}
                                                                    </div>
                                                                    <small className="text-muted fs-11">{rev.date}</small>
                                                                </div>
                                                            </div>
                                                            <h6 className="fw-bold fs-13 mb-1">{rev.name}</h6>
                                                            <p className="text-secondary fs-12 mb-0 line-clamp-3">"{rev.comment}"</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="text-center mt-4">
                                                <button className="btn btn-primary px-5 py-2 rounded-pill fw-bold shadow-sm">
                                                    View All 120+ Reviews
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Final Action Bar */}
                                    <div className="card shadow-sm border-0 mt-4 overflow-hidden" style={{ background: "linear-gradient(90deg, #1d4ed8 0%, #3b82f6 100%)" }}>
                                        <div className="card-body p-4">
                                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-4 text-white">
                                                <div>
                                                    <h5 className="fw-bold text-white mb-1">Still Have Questions?</h5>
                                                    <p className="mb-0 opacity-75 fs-14">Get a free pre-consultation chat with our support team to clear your doubts.</p>
                                                </div>
                                                <div className="d-flex gap-3">
                                                    <button className="btn btn-light fw-bold px-4" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>Contact Support</button>
                                                    <button type="button" onClick={() => openBooking("")} className="btn btn-warning fw-bold px-4">Book Appointment</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* ══════ HERO ══════ */}
                    <section id="hero" className="position-relative overflow-hidden" style={{ padding: "40px 0 110px", background: "transparent" }}>
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
                                                <small className="text-secondary fw-medium">{totalReviews} Reviews</small>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-3">
                                            <i className="ti ti-user-scan text-primary fs-3" />
                                            <div>
                                                <h6 className="mb-0 fw-bold fs-5 text-dark">{clinic.doctors.length}+ Doctors</h6>
                                                <small className="text-secondary fw-medium">Experienced</small>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-3">
                                            <i className="ti ti-shield-check text-primary fs-3" />
                                            <div>
                                                <h6 className="mb-0 fw-bold fs-5 text-dark">{clinic.patientsServed}</h6>
                                                <small className="text-secondary fw-medium">Patients Treated</small>
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
                                            {clinic.phone}
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

                    {/* ══════ FEATURE BAR ══════ */}
                    <div className="position-relative z-2" style={{ marginTop: "-55px" }}>
                        <div className="container">
                            <div className="col-lg-11 mx-auto">
                                <div className="bg-white rounded-4 shadow-lg py-3 px-2" style={{ border: "1px solid #f1f5f9" }}>
                                    <div className="row text-center g-2 row-cols-2 row-cols-md-3 row-cols-lg-6 justify-content-center">
                                        {[
                                            { icon: "ti-user-circle", text: "Experienced Doctors" },
                                            { icon: "ti-device-heart-monitor", text: "Modern Equipment" },
                                            { icon: "ti-calendar-time", text: "Online Booking" },
                                            { icon: "ti-pill", text: "Digital Prescriptions" },
                                            { icon: "ti-wallet", text: "Affordable Fees" },
                                            { icon: "ti-headset", text: "24/7 Support Emergency" },
                                        ].map((f, i) => (
                                            <div key={i} className="col">
                                                <div className="d-flex flex-column align-items-center gap-2">
                                                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44 }}>
                                                        <i className={`ti ${f.icon} fs-4`} style={{ color: "#1d4ed8" }} />
                                                    </div>
                                                    <span className="fw-bold text-dark mt-1" style={{ fontSize: "12.5px", letterSpacing: "-0.2px" }}>{f.text}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ══════ ABOUT US ══════ */}
                    <section id="about" className="bg-white">
                        <div className="container py-5 border-top">
                            <div className="row g-5 align-items-center">
                                {/* Text Content */}
                                <div className="col-lg-6">
                                    <h5 className="fw-bold text-uppercase mb-4" style={{ color: "#1d4ed8", letterSpacing: "1px" }}>ABOUT {clinic.name.toUpperCase()}</h5>
                                    <p className="fs-5 text-dark mb-4" style={{ lineHeight: 1.6 }}>
                                        {clinic.about
                                            ? clinic.about
                                            : `${clinic.name} is a multi-speciality healthcare center committed to providing high-quality medical services with compassion and care. We have a team of experienced doctors and modern facilities to ensure the best treatment for you and your family.`
                                        }
                                    </p>

                                    <div className="row g-3 mt-4 text-center">
                                        <div className="col-4">
                                            <div className="border rounded-4 p-3 shadow-sm h-100 d-flex flex-column justify-content-center">
                                                <h4 className="fw-bold mb-1" style={{ color: "#1d4ed8" }}>{clinic.established || "—"}</h4>
                                                <small className="text-secondary fw-semibold">Established</small>
                                            </div>
                                        </div>
                                        <div className="col-4">
                                            <div className="border rounded-4 p-3 shadow-sm h-100 d-flex flex-column justify-content-center">
                                                <h4 className="fw-bold mb-1" style={{ color: "#1d4ed8" }}>{clinic.patientsServed || "—"}</h4>
                                                <small className="text-secondary fw-semibold">Patients Served</small>
                                            </div>
                                        </div>
                                        <div className="col-4">
                                            <div className="border rounded-4 p-3 shadow-sm h-100 d-flex flex-column justify-content-center">
                                                <h4 className="fw-bold mb-1" style={{ color: "#1d4ed8" }}>{clinic.experience ? `${clinic.experience}+` : "—"}</h4>
                                                <small className="text-secondary fw-semibold">Years Experience</small>
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
                                <h3 className="fw-bold text-uppercase" style={{ letterSpacing: "1px", color: "#1d4ed8" }}>OUR DOCTORS</h3>
                            </div>

                            <div className="row g-4 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-5 justify-content-center">
                                {displayDoctors.map((doc, idx) => (
                                    <div key={idx} className="col">
                                        <div
                                            className="card h-100 border bg-white shadow-sm rounded-4 text-center overflow-hidden d-flex flex-column"
                                            style={{ cursor: "pointer", transition: "all 0.2s ease-in-out" }}
                                            onMouseOver={e => e.currentTarget.style.transform = "translateY(-5px)"}
                                            onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}
                                        >
                                            <div onClick={() => setSelectedDocDetails(doc)}>
                                                {/* Photo at the very top */}
                                                <div className="pt-4 bg-white d-flex justify-content-center">
                                                    <img
                                                        src={doc.photo ? (
                                                            doc.photo.startsWith('http') || doc.photo.startsWith('data:')
                                                                ? doc.photo
                                                                : doc.photo.includes('uploads')
                                                                    ? `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${doc.photo.startsWith('/') ? '' : '/'}${doc.photo}`
                                                                    : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/uploads/doctors/${doc.photo}`
                                                        ) : "/assets/img/doctor-placeholder.png"}
                                                        alt={doc.name}
                                                        className="rounded-circle object-fit-cover shadow-sm bg-light"
                                                        style={{ width: "110px", height: "110px", border: "4px solid #f8f9fa" }}
                                                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/assets/img/doctor-placeholder.png" }}
                                                    />
                                                </div>
                                                <div className="card-body px-3 pt-3 pb-2 d-flex flex-column" style={{ minHeight: "0" }}>
                                                    <h5 className="fw-bold mb-1 text-dark fs-6">{doc.name}</h5>
                                                    <p className="text-dark fw-semibold small mb-1">{doc.qualification}</p>
                                                    <p className="text-secondary small mb-1">{doc.experience} Years Exp.</p>
                                                    <p className="text-secondary small mb-3">{doc.specialization}</p>

                                                    <h4 className="text-success fw-bold mb-1 fs-5 mt-2">₹{doc.fee}</h4>
                                                    <small className="d-block text-secondary fw-medium mb-3">{doc.days} | {doc.timing}</small>
                                                </div>
                                            </div>
                                            <div className="px-3 pb-4 mt-auto">
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); openBooking(doc.id); }}
                                                    className="btn btn-primary w-100 fw-bold rounded-3"
                                                >
                                                    Book Appointment
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ══════ INFO WIDGET GRID ══════ */}
                    <section id="services" className="py-5" style={{ background: "#f8f9fa" }}>
                        <div className="container">
                            <div className="row g-4">
                                {/* Services Card */}
                                <div className="col-lg-4">
                                    <div className="card h-100 p-4 border rounded-4 shadow-sm bg-white text-center d-flex flex-column">
                                        <h6 className="fw-bold mb-4" style={{ color: "#1d4ed8", letterSpacing: "0.5px" }}>SERVICES WE OFFER</h6>
                                        <div className="row row-cols-2 g-3 flex-grow-1">
                                            {[
                                                { i: "ti-stethoscope", t: "General Physician" },
                                                { i: "ti-tooth", t: "Dental Care" },
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
                                        <button
                                            className="btn w-100 mt-3 fw-bold py-2"
                                            style={{ border: "2px solid #1d4ed8", color: "#1d4ed8", fontSize: "14px" }}
                                            onClick={() => document.getElementById('booking-widget')?.scrollIntoView({ behavior: 'smooth' })}
                                        >
                                            View All Services
                                        </button>
                                    </div>
                                </div>

                                {/* Booking Card */}
                                <div className="col-lg-4">
                                    <div id="booking-widget" className="card h-100 p-4 border-0 rounded-4 shadow-sm text-white d-flex flex-column justify-content-between" style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)" }}>
                                        <div>
                                            <div className="d-flex align-items-center justify-content-center mb-3 rounded-circle bg-white bg-opacity-10" style={{ width: "50px", height: "50px" }}>
                                                <i className="ti ti-calendar-event fs-3 text-white" />
                                            </div>
                                            <h5 className="fw-bold mb-3 text-white" style={{ letterSpacing: "0.5px" }}>Book Appointment Online</h5>
                                            <p className="text-white text-opacity-80 small mb-4" style={{ lineHeight: "1.6" }}>
                                                Skip the queue! Book your appointment directly online with our simplified booking system.
                                            </p>
                                            
                                            <div className="d-flex flex-column gap-3 mb-4">
                                                <div className="d-flex gap-3 align-items-start">
                                                    <div className="d-flex align-items-center justify-content-center rounded-circle bg-white bg-opacity-20 mt-1" style={{ width: "24px", height: "24px", minWidth: "24px" }}>
                                                        <span className="fw-bold small" style={{ fontSize: "11px" }}>1</span>
                                                    </div>
                                                    <div>
                                                        <h6 className="fw-bold mb-1 text-white small">Choose Your Doctor</h6>
                                                        <p className="text-white text-opacity-70 mb-0" style={{ fontSize: "12px" }}>Select from our team of qualified specialists.</p>
                                                    </div>
                                                </div>
                                                <div className="d-flex gap-3 align-items-start">
                                                    <div className="d-flex align-items-center justify-content-center rounded-circle bg-white bg-opacity-20 mt-1" style={{ width: "24px", height: "24px", minWidth: "24px" }}>
                                                        <span className="fw-bold small" style={{ fontSize: "11px" }}>2</span>
                                                    </div>
                                                    <div>
                                                        <h6 className="fw-bold mb-1 text-white small">Select Date & Time</h6>
                                                        <p className="text-white text-opacity-70 mb-0" style={{ fontSize: "12px" }}>Pick a slot from the live availability calendar.</p>
                                                    </div>
                                                </div>
                                                <div className="d-flex gap-3 align-items-start">
                                                    <div className="d-flex align-items-center justify-content-center rounded-circle bg-white bg-opacity-20 mt-1" style={{ width: "24px", height: "24px", minWidth: "24px" }}>
                                                        <span className="fw-bold small" style={{ fontSize: "11px" }}>3</span>
                                                    </div>
                                                    <div>
                                                        <h6 className="fw-bold mb-1 text-white small">Instant Account Info</h6>
                                                        <p className="text-white text-opacity-70 mb-0" style={{ fontSize: "12px" }}>Receive credentials & confirmation instantly via email.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => openBooking("")}
                                            className="btn w-100 mt-auto fw-bold text-dark bg-white shadow py-3 rounded-3 d-flex align-items-center justify-content-center gap-2 border-0"
                                            style={{ fontSize: "14px", transition: "all 0.3s ease" }}
                                        >
                                            <i className="ti ti-circle-plus fs-5" /> Book Online Appointment
                                        </button>
                                    </div>
                                </div>

                                {/* Timings Card */}
                                <div className="col-lg-4">
                                    <div className="card h-100 p-4 border rounded-4 shadow-sm bg-white d-flex flex-column">
                                        <h6 className="fw-bold mb-4" style={{ color: "#1d4ed8", letterSpacing: "0.5px" }}>CLINIC TIMINGS</h6>
                                        <div className="d-flex flex-column gap-3 flex-grow g-2-1">
                                            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(day => (
                                                <div key={day} className="d-flex justify-content-between align-items-center border-bottom pb-2">
                                                    <span className="fw-bold text-dark" style={{ fontSize: "14px" }}>{day}</span>
                                                    <span className="text-secondary fw-semibold" style={{ fontSize: "13px" }}>09:00 AM - 08:00 PM</span>
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
                    <section id="reviews" className="bg-white border-top border-bottom">
                        <div className="container py-5">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div className="d-flex align-items-center gap-3">
                                    <h6 className="fw-bold text-uppercase mb-0" style={{ color: "#1d4ed8", letterSpacing: "0.5px" }}>PATIENT REVIEWS</h6>
                                    <div className="d-flex align-items-center gap-2">
                                        <Stars n={avgRating} size={15} />
                                        <span className="text-secondary fw-semibold" style={{ fontSize: "13px" }}>({totalReviews} Reviews)</span>
                                    </div>
                                </div>
                                <button className="btn btn-sm bg-white fw-bold px-3 rounded-pill" style={{ color: "#1d4ed8", border: "1px solid #e2e8f0", fontSize: "13px" }}>View All Reviews</button>
                            </div>

                            <div className="row g-3">
                                {clinic.reviews.slice(0, 4).length > 0 ? clinic.reviews.slice(0, 4).map((r, i) => (
                                    <div key={i} className="col-12 col-sm-6 col-lg-3">
                                        <div className="card h-100 border p-3 rounded-3 shadow-none bg-white">
                                            <div className="mb-2">
                                                <Stars n={r.rating} size={14} />
                                            </div>
                                            <p className="text-dark mb-0 fw-medium" style={{ fontSize: "13px", lineHeight: 1.5 }}>
                                                {r.feedback.length > 80 ? r.feedback.substring(0, 80) + '...' : r.feedback}
                                            </p>
                                            <div className="mt-4 pt-3">
                                                <span className="text-secondary fw-semibold mb-0 d-block" style={{ fontSize: "11.5px" }}>— {r.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    /* Fallback Mock Reviews if none exist */
                                    [
                                        { f: "Excellent experience with City Care Clinic. Doctors are very cooperative and staff is also very helpful.", n: "Rahul Verma" },
                                        { f: "Very clean clinic and good treatment. I got my dental treatment here. Highly recommended!", n: "Priya Sinha" },
                                        { f: "Best child specialist doctor. My child is much better now. Thank you so much!", n: "Anjali Kumari" },
                                        { f: "Quick appointment and proper guidance. Very satisfied with the service.", n: "Sandeep Kumar" }
                                    ].map((r, i) => (
                                        <div key={i} className="col-12 col-sm-6 col-lg-3">
                                            <div className="card h-100 border p-3 rounded-3 shadow-none bg-white">
                                                <div className="mb-2">
                                                    <Stars n={5} size={14} />
                                                </div>
                                                <p className="text-dark mb-0 fw-medium" style={{ fontSize: "13px", lineHeight: 1.5 }}>{r.f}</p>
                                                <div className="mt-4 pt-3">
                                                    <span className="text-secondary fw-semibold mb-0 d-block" style={{ fontSize: "11.5px" }}>— {r.n}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </section>

                    {/* ══════ GALLERY ══════ */}
                    {
                        clinic.gallery.length > 0 && (
                            <section id="gallery" className="py-5 bg-white">
                                <div className="container py-4 text-center">
                                    <h5 className="fw-bold text-uppercase mb-4" style={{ color: "#1d4ed8", letterSpacing: "1px" }}>CLINIC GALLERY</h5>

                                    <div className="d-flex gap-4 overflow-auto pb-4 px-2 custom-scrollbar justify-content-lg-center">
                                        {clinic.gallery.map((img, i) => (
                                            <div key={i} style={{ minWidth: "280px", maxWidth: "280px" }}>
                                                <div className="card border-0 bg-transparent text-center">
                                                    <img src={img.url} alt={img.category} className="img-fluid rounded-4 shadow-sm mb-3" style={{ height: "160px", objectFit: "cover", width: "100%", border: "2px solid #f1f5f9" }} />
                                                    <span className="fs-14 text-dark fw-bold">{img.category || "Gallery Image"}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )
                    }

                    {/* ══════ PACKAGES & FAQ ══════ */}
                    <section className="py-5" style={{ background: "#f8f9fa" }}>
                        <div className="container py-4">

                            <h5 className="fw-bold text-center text-uppercase mb-4" style={{ color: "#1d4ed8", letterSpacing: "1px" }}>HEALTH PACKAGES / OFFERS</h5>

                            <div className="row g-2 row-cols-1 row-cols-md-2 row-cols-lg-5 justify-content-center mb-5">
                                {/* Package 1 */}
                                <div className="col">
                                    <div className="card border p-3 rounded-3 shadow-none bg-white text-start">
                                        <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: "13px" }}>Full Body Checkup</h6>
                                        <span className="text-secondary d-block fw-medium mb-3" style={{ fontSize: "11px" }}>Complete Health Analysis</span>

                                        <div className="d-flex align-items-end gap-2 mb-2">
                                            <h4 className="fw-bold text-success mb-0">₹1499</h4>
                                            <span className="text-secondary text-decoration-line-through fw-medium" style={{ fontSize: "12px", paddingBottom: "2px" }}>₹2000</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Package 2 */}
                                <div className="col">
                                    <div className="card border p-3 rounded-3 shadow-none bg-white text-start">
                                        <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: "13px" }}>Diabetes Package</h6>
                                        <span className="text-secondary d-block fw-medium mb-3" style={{ fontSize: "11px" }}>Sugar & Related Tests</span>

                                        <div className="d-flex align-items-end gap-2 mb-2">
                                            <h4 className="fw-bold text-success mb-0">₹799</h4>
                                            <span className="text-secondary text-decoration-line-through fw-medium" style={{ fontSize: "12px", paddingBottom: "2px" }}>₹1200</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Package 3 */}
                                <div className="col">
                                    <div className="card border p-3 rounded-3 shadow-none bg-white text-start">
                                        <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: "13px" }}>Dental Care Package</h6>
                                        <span className="text-secondary d-block fw-medium mb-3" style={{ fontSize: "11px" }}>Dental Checkup + Cleaning</span>

                                        <div className="d-flex align-items-end gap-2 mb-2">
                                            <h4 className="fw-bold text-success mb-0">₹999</h4>
                                            <span className="text-secondary text-decoration-line-through fw-medium" style={{ fontSize: "12px", paddingBottom: "2px" }}>₹1500</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Package 4 */}
                                <div className="col">
                                    <div className="card border p-3 rounded-3 shadow-none bg-white text-start">
                                        <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: "13px" }}>Women Health Package</h6>
                                        <span className="text-secondary d-block fw-medium mb-3" style={{ fontSize: "11px" }}>Complete Women Care</span>

                                        <div className="d-flex align-items-end gap-2 mb-2">
                                            <h4 className="fw-bold text-success mb-0">₹1299</h4>
                                            <span className="text-secondary text-decoration-line-through fw-medium" style={{ fontSize: "12px", paddingBottom: "2px" }}>₹1800</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Insurance Info */}
                                <div className="col">
                                    <div className="card border p-2 rounded-3 shadow-none bg-white text-center">
                                        <h6 className="fw-bold mb-1" style={{ color: "#1d4ed8", fontSize: "11px" }}>Insurance & Cashless Facility</h6>
                                        <p className="text-secondary fw-semibold mb-2 px-1" style={{ fontSize: "9.5px", lineHeight: 1.3 }}>
                                            We accept all major insurance providers for cashless treatment.
                                        </p>
                                        <div className="d-flex justify-content-center align-items-center flex-wrap gap-1">
                                            <span className="fw-bold text-primary" style={{ fontSize: "9px", letterSpacing: "-0.5px" }}><i className="ti ti-star-filled text-primary" /> STAR</span>
                                            <span className="fw-bold text-white bg-danger px-1" style={{ fontSize: "8px" }}>HDFC ERGO</span>
                                            <span className="fw-bold text-primary" style={{ fontSize: "9px", letterSpacing: "-0.5px" }}><i className="ti ti-bolt text-danger" /> ICICI Lombard</span>
                                            <div className="w-100 m-0" />
                                            <span className="fw-bold text-primary" style={{ fontSize: "9px", letterSpacing: "-0.5px" }}>BAJAJ Allianz</span>
                                            <span className="text-secondary fw-semibold" style={{ fontSize: "9px" }}>& More</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <h6 className="fw-bold text-center text-uppercase mb-4 mt-4" style={{ color: "#1d4ed8", fontSize: "14px", letterSpacing: "0.5px" }}>FREQUENTLY ASKED QUESTIONS</h6>
                            <div className="row g-2 justify-content-center mb-3">
                                <div className="col-lg-12">
                                    <div className="row g-2">
                                        {[
                                            { q: 'How can I book an appointment?', a: 'You can book an appointment online through our portal or by calling our clinic reception directly.' },
                                            { q: 'What are the consultation charges?', a: 'Consultation charges vary by doctor and specialty. Please check the doctor profile for exact fees.' },
                                            { q: 'Do you provide online consultation?', a: 'Yes, we offer video consultations for selected specialties to help you consult from home.' },
                                            { q: 'Is walk-in consultation available?', a: 'Walk-ins are welcome, but we highly recommend booking an appointment online to avoid waiting.' },
                                            { q: 'When will I get my test reports?', a: 'Most standard test reports are available within 24 hours online or can be collected at the clinic.' },
                                            { q: 'Do you provide home sample collection?', a: 'Yes, we provide home sample collection for lab tests within a 10km radius.' }
                                        ].map((faq, i) => (
                                            <div key={i} className="col-md-6">
                                                <div className="card shadow-none rounded-2 border" style={{ borderColor: "#f1f5f9" }}>
                                                    <div
                                                        className="d-flex justify-content-between align-items-center py-2 px-3 text-dark fw-medium"
                                                        style={{ fontSize: "12px", cursor: "pointer" }}
                                                        data-bs-toggle="collapse"
                                                        data-bs-target={`#faq-${i}`}
                                                    >
                                                        <span>{faq.q}</span>
                                                        <i className="ti ti-chevron-down text-secondary" style={{ fontSize: "12px" }} />
                                                    </div>
                                                    <div id={`faq-${i}`} className="collapse">
                                                        <div className="card-body pt-0 pb-2 px-3 text-secondary" style={{ fontSize: "11.5px" }}>
                                                            {faq.a}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </>
            )
            }

            {/* ══════ FOOTER ══════ */}
            <footer id="contact" className="bg-white py-4 mt-2 border-top">
                <div className="container">
                    <div className="row g-4 align-items-center justify-content-between">

                        {/* Map Image */}
                        <div className="col-lg-4">
                            <h6 className="fw-bold text-uppercase mb-3" style={{ color: "#1d4ed8", fontSize: "12px" }}>OUR LOCATION</h6>
                            <div className="position-relative rounded-3 overflow-hidden border bg-light" style={{ height: "140px" }}>
                                <img src="https://placehold.co/600x200/e2e8f0/94a3b8?text=Map+Location" alt="Map Location" className="w-100 h-100 object-fit-cover opacity-50 pe-none" />
                                <div className="position-absolute bg-white rounded shadow-sm p-2" style={{ top: "10px", left: "10px", width: "160px" }}>
                                    <h6 className="fw-bold mb-1 text-dark" style={{ fontSize: "11px" }}>{clinic.name}</h6>
                                    <small className="text-secondary d-block lh-sm mb-1" style={{ fontSize: "9px" }}>{clinic.address}, {clinic.city}</small>
                                    <a href={clinic.directionsUrl} className="text-primary text-decoration-none fw-bold mt-1 d-block" style={{ fontSize: "9px" }}>View larger map</a>
                                </div>
                                <div className="position-absolute" style={{ top: "60%", left: "55%", transform: "translate(-50%, -50%)" }}>
                                    <div className="d-flex align-items-center gap-1">
                                        <i className="ti ti-map-pin-filled text-danger drop-shadow" style={{ fontSize: "28px" }} />
                                        <span className="text-danger fw-bold shadow-sm px-1 rounded bg-white" style={{ fontSize: "10px" }}>{clinic.name}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Get Directions */}
                        <div className="col-lg-2 text-center">
                            <h6 className="fw-bold text-uppercase mb-2" style={{ color: "#1d4ed8", fontSize: "12px" }}>GET DIRECTIONS</h6>
                            <p className="text-secondary fw-bold mx-auto mb-3" style={{ fontSize: "10px", lineHeight: 1.4, maxWidth: "150px" }}>{clinic.address}, {clinic.city}</p>
                            <a href={clinic.directionsUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary rounded-2 fw-bold px-3 py-1" style={{ fontSize: "11px", color: "#1d4ed8", borderColor: "#e2e8f0" }}>
                                Get Directions <i className="ti ti-external-link ms-1" />
                            </a>
                        </div>

                        {/* Contact Us */}
                        <div className="col-lg-3 border-start ps-4">
                            <h6 className="fw-bold text-uppercase mb-3" style={{ color: "#1d4ed8", fontSize: "12px" }}>CONTACT US</h6>
                            <ul className="list-unstyled d-flex flex-column gap-2 mb-0 fw-bold text-secondary" style={{ fontSize: "10.5px" }}>
                                <li className="d-flex align-items-center gap-2"><i className="ti ti-phone-call text-primary fs-6" style={{ color: "#1d4ed8" }} /> {clinic.phone}</li>
                                <li className="d-flex align-items-center gap-2"><i className="ti ti-brand-whatsapp text-success fs-6" /> {clinic.whatsapp}</li>
                                <li className="d-flex align-items-center gap-2 text-break"><i className="ti ti-mail text-primary fs-6" style={{ color: "#1d4ed8" }} /> {clinic.email || 'info@clinic.com'}</li>
                                <li className="d-flex align-items-center gap-2"><i className="ti ti-world text-primary fs-6" style={{ color: "#1d4ed8" }} /> www.clinic.com</li>
                                <li className="d-flex align-items-start gap-2 pt-1"><i className="ti ti-map-pin text-primary fs-6" style={{ color: "#1d4ed8" }} /> <span>{clinic.address}, {clinic.city}</span></li>
                            </ul>
                        </div>

                        {/* Follow Us */}
                        <div className="col-lg-2 text-center">
                            <h6 className="fw-bold text-uppercase mb-3" style={{ color: "#1d4ed8", fontSize: "12px" }}>FOLLOW US</h6>
                            <div className="d-flex gap-2 justify-content-center">
                                <a href={clinic.facebook} className="btn rounded-circle p-0 d-flex align-items-center justify-content-center text-white" style={{ width: 28, height: 28, background: "#1877f2" }}><i className="ti ti-brand-facebook fs-6" /></a>
                                <a href={clinic.instagram} className="btn rounded-circle p-0 d-flex align-items-center justify-content-center text-white" style={{ width: 28, height: 28, background: "#e1306c" }}><i className="ti ti-brand-instagram fs-6" /></a>
                                <a href="#" className="btn rounded-circle p-0 d-flex align-items-center justify-content-center text-white" style={{ width: 28, height: 28, background: "#ff0000" }}><i className="ti ti-brand-youtube fs-6" /></a>
                                <a href="#" className="btn rounded-circle p-0 d-flex align-items-center justify-content-center text-white" style={{ width: 28, height: 28, background: "#0077b5" }}><i className="ti ti-brand-linkedin fs-6" /></a>
                            </div>
                        </div>

                    </div>
                </div>
            </footer>
            {/* ══════ DARK BOTTOM FOOTER ══════ */}
            <FooterFront />

            {/* WA FAB */}
            <a href={`https://wa.me/${clinic.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                className="position-fixed shadow-lg rounded-circle d-flex align-items-center justify-content-center"
                style={{ bottom: "30px", right: "30px", width: "60px", height: "60px", background: "#25D366", color: "white", zIndex: 9999, transition: "transform 0.2s" }}
                onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
                <i className="ti ti-brand-whatsapp" style={{ fontSize: "36px" }} />
            </a>

            {/* ══════ BOOKING MODAL ══════ */}
            {
                showModal && (
                    <div
                        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                        style={{ zIndex: 99999, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
                        onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); } }}
                    >
                        <div className="bg-white rounded-4 shadow-lg d-flex flex-column" style={{ width: "100%", maxWidth: bookSuccess ? "460px" : "760px", margin: "20px", maxHeight: "90vh", overflow: "hidden", transition: "max-width 0.3s ease" }}>
                            {/* Modal Header — fixed */}
                            <div className="d-flex align-items-center justify-content-between p-3 border-bottom flex-shrink-0" style={{ background: "#1d4ed8", borderRadius: "16px 16px 0 0" }}>
                                <div className="d-flex align-items-center gap-3">
                                    <div className="bg-white bg-opacity-20 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                                        <i className="ti ti-calendar-event text-white fs-5" />
                                    </div>
                                    <div>
                                        <h5 className="fw-bold text-white mb-0" style={{ fontSize: "15px" }}>Book Appointment</h5>
                                        <small className="text-white opacity-75" style={{ fontSize: "12px" }}>{clinic.name}</small>
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
                                        <h5 className="fw-bold text-dark mb-1">Appointment Scheduled!</h5>
                                        <p className="text-secondary fw-semibold mb-3" style={{ fontSize: "12px" }}>{bookSuccess}</p>
                                        
                                        {/* Appointment ID Details */}
                                        <div className="mb-3 p-3 bg-light rounded-3 text-start border" style={{ borderColor: "#e2e8f0" }}>
                                            <div className={`d-flex justify-content-between ${generatedCreds?.isNewUserCreated ? 'mb-2 pb-2 border-bottom' : ''}`} style={{ borderColor: "#cbd5e1" }}>
                                                <span className="text-secondary fw-semibold fs-13">Appointment ID:</span>
                                                <span className="text-dark fw-bold fs-13">{generatedCreds?.appointmentCode || "AP..."}</span>
                                            </div>
                                            
                                            {/* Account Details if user was created */}
                                            {generatedCreds?.isNewUserCreated && (
                                                <div className="mt-2">
                                                    <div className="alert alert-info py-2 px-3 rounded-2 fs-12 mb-2 d-flex align-items-start gap-2" style={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe", color: "#1e3a8a" }}>
                                                        <i className="ti ti-info-circle-filled mt-0.5 flex-shrink-0" />
                                                        <span>
                                                            Your login account has been created! A credentials email has been sent to your Gmail.
                                                        </span>
                                                    </div>
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span className="text-secondary fs-12">Login Email:</span>
                                                        <span className="text-dark fw-bold fs-12">{generatedCreds?.email}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between">
                                                        <span className="text-secondary fs-12">Temporary Password:</span>
                                                        <span className="text-primary fw-bold fs-12" style={{ letterSpacing: "0.5px" }}>{generatedCreds?.password}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Redesigned Notes Section - Blue & Black highlighted, detailed */}
                                        <div className="p-3 mb-4 rounded-3 text-start" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                                            <h6 className="fw-bold text-dark mb-3" style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Important Notes</h6>
                                            
                                            {/* Note 1 */}
                                            <div className="d-flex align-items-start gap-2 mb-3 pb-3 border-bottom" style={{ borderColor: "#e2e8f0" }}>
                                                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: "22px", height: "22px", background: "#1d4ed8", color: "white" }}>
                                                    <span className="fw-bold" style={{ fontSize: "10px" }}>1</span>
                                                </div>
                                                <div>
                                                    <p className="mb-0 text-dark fw-bold" style={{ fontSize: "12px", lineHeight: "1.4" }}>
                                                        Credentials for logging into the portal have been sent to your email.
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Note 2 */}
                                            <div className="d-flex align-items-start gap-2">
                                                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: "22px", height: "22px", background: "#0f172a", color: "white" }}>
                                                    <span className="fw-bold" style={{ fontSize: "10px" }}>2</span>
                                                </div>
                                                <div>
                                                    <p className="mb-0 text-dark fw-bold" style={{ fontSize: "12px", lineHeight: "1.4" }}>
                                                        Call admin to confirm your booking. Now it is just scheduled.
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
                                                <input
                                                    type="text"
                                                    className={`form-control rounded-3 ${bookFormErrors.firstName ? 'is-invalid' : ''}`}
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
                                                <input
                                                    type="text"
                                                    className={`form-control rounded-3 ${bookFormErrors.lastName ? 'is-invalid' : ''}`}
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
                                                <input
                                                    type="email"
                                                    className={`form-control rounded-3 ${bookFormErrors.email ? 'is-invalid' : ''}`}
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
                                                <input
                                                    type="tel"
                                                    className={`form-control rounded-3 ${bookFormErrors.phone ? 'is-invalid' : ''}`}
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
                                                <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "13px" }}>Gender <span className="text-danger">*</span></label>
                                                <select
                                                    className={`form-select rounded-3 text-secondary ${bookFormErrors.gender ? 'is-invalid' : ''}`}
                                                    value={bookForm.gender}
                                                    onChange={e => setBookForm(f => ({ ...f, gender: e.target.value }))}
                                                    required
                                                    style={{ fontSize: "14px" }}
                                                >
                                                    <option value="">Select Gender</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                                {bookFormErrors.gender && <div className="invalid-feedback">{bookFormErrors.gender}</div>}
                                            </div>

                                            {/* Patient Address */}
                                            <div className="col-12">
                                                <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "13px" }}>Address (Optional)</label>
                                                <input
                                                    type="text"
                                                    className="form-control rounded-3"
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
                                                            : sessionOptions.length > 0
                                                                ? "Select slot"
                                                                : "No slots available"}
                                                    </option>
                                                    {sessionOptions.map((opt: any) => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                {bookFormErrors.time && <div className="invalid-feedback">{bookFormErrors.time}</div>}
                                            </div>

                                            {/* Reason Symptoms */}
                                            <div className="col-12">
                                                <label className="form-label fw-bold text-dark mb-1" style={{ fontSize: "13px" }}>Reason / Symptoms (Optional)</label>
                                                <textarea
                                                    className="form-control rounded-3"
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

        </div >
    );
}
