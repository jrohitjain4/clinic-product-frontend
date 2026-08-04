import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiGet, apiPost, apiPut, authHeaders } from "../../../../core/utils/apiClient";
import { apiUrl } from "../../../../core/config/api";
import { toast } from "react-toastify";
import { all_routes } from "../../../routes/all_routes";
import { DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { IconFormControl, IconTextarea } from "../../../../core/common/form-fields";
import BodyDiagram3D from "./BodyDiagram3D";
import type { BodyPartDef } from "./BodyDiagram3D";
import ConsultationPrintPlan from "./ConsultationPrintPlan";
import ConsultationPreviewPrint from "./ConsultationPreviewPrint";

const routes = all_routes;

// ─── Body Part Definitions ───────────────────────────────────
const BODY_PARTS: BodyPartDef[] = [
  // Front
  { id: "head", label: "Head", view: "front", x: 145, y: 18, r: 22 },
  { id: "neck", label: "Neck", view: "front", x: 145, y: 54, r: 12 },
  { id: "left_shoulder", label: "Left Shoulder", view: "front", x: 95, y: 76, r: 14 },
  { id: "right_shoulder", label: "Right Shoulder", view: "front", x: 195, y: 76, r: 14 },
  { id: "chest", label: "Chest", view: "front", x: 145, y: 105, r: 22 },
  { id: "abdomen", label: "Abdomen", view: "front", x: 145, y: 145, r: 22 },
  { id: "left_arm", label: "Left Arm", view: "front", x: 70, y: 125, r: 13 },
  { id: "right_arm", label: "Right Arm", view: "front", x: 220, y: 125, r: 13 },
  { id: "left_forearm", label: "Left Forearm", view: "front", x: 55, y: 165, r: 11 },
  { id: "right_forearm", label: "Right Forearm", view: "front", x: 235, y: 165, r: 11 },
  { id: "left_hand", label: "Left Hand", view: "front", x: 45, y: 200, r: 10 },
  { id: "right_hand", label: "Right Hand", view: "front", x: 245, y: 200, r: 10 },
  { id: "left_hip", label: "Left Hip", view: "front", x: 115, y: 178, r: 14 },
  { id: "right_hip", label: "Right Hip", view: "front", x: 175, y: 178, r: 14 },
  { id: "left_thigh", label: "Left Thigh", view: "front", x: 118, y: 218, r: 15 },
  { id: "right_thigh", label: "Right Thigh", view: "front", x: 172, y: 218, r: 15 },
  { id: "left_knee", label: "Left Knee", view: "front", x: 115, y: 258, r: 12 },
  { id: "right_knee", label: "Right Knee", view: "front", x: 175, y: 258, r: 12 },
  { id: "left_shin", label: "Left Shin", view: "front", x: 112, y: 295, r: 11 },
  { id: "right_shin", label: "Right Shin", view: "front", x: 178, y: 295, r: 11 },
  { id: "left_foot", label: "Left Foot", view: "front", x: 108, y: 330, r: 10 },
  { id: "right_foot", label: "Right Foot", view: "front", x: 182, y: 330, r: 10 },
  // Back
  { id: "upper_back", label: "Upper Back", view: "back", x: 145, y: 95, r: 22 },
  { id: "lower_back", label: "Lower Back", view: "back", x: 145, y: 138, r: 18 },
  { id: "left_gluteal", label: "Left Gluteal", view: "back", x: 115, y: 175, r: 14 },
  { id: "right_gluteal", label: "Right Gluteal", view: "back", x: 175, y: 175, r: 14 },
  { id: "left_calf", label: "Left Calf", view: "back", x: 112, y: 290, r: 11 },
  { id: "right_calf", label: "Right Calf", view: "back", x: 178, y: 290, r: 11 },
];

const severityColor = (s: number) => {
  if (s <= 3) return "#2563eb"; // mild / selected → blue
  if (s <= 6) return "#f59e0b";
  return "#ef4444";
};

// ─── Availability Helpers ─────────────────────────────────────
const isDateAvailable = (date: Date, availability: any): boolean => {
  if (!availability) return true;

  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ...
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = dayNames[dayOfWeek];

  // 1. Clinic Off Day
  const clinicOffDays = availability.clinicWorkingDays || [0];
  if (clinicOffDays.includes(dayOfWeek)) {
    return false;
  }

  // 2. Doctor Weekly Off (Active Schedule check)
  const daySchedule = availability.schedules?.[dayName];
  const isWorking = Array.isArray(daySchedule) && daySchedule.length > 0;
  if (!isWorking) {
    return false;
  }

  // 3. Holiday
  const time = date.getTime();
  const isHoliday = availability.holidays?.some((h: any) => {
    const start = new Date(h.date);
    start.setHours(0, 0, 0, 0);
    const end = h.endDate ? new Date(h.endDate) : new Date(h.date);
    end.setHours(23, 59, 59, 999);
    return time >= start.getTime() && time <= end.getTime();
  });
  if (isHoliday) {
    return false;
  }

  // 4. Leave
  const isLeave = availability.leaves?.some((l: any) => {
    const s = new Date(l.start);
    s.setHours(0, 0, 0, 0);
    const e = new Date(l.end);
    e.setHours(23, 59, 59, 999);
    return time >= s.getTime() && time <= e.getTime();
  });
  if (isLeave) {
    return false;
  }

  return true;
};

const getNextAvailableDate = (startDate: Date, availability: any): Date => {
  const date = new Date(startDate);
  for (let i = 0; i < 365; i++) {
    if (isDateAvailable(date, availability)) {
      return date;
    }
    date.setDate(date.getDate() + 1);
  }
  return date;
};

// ─── Types ────────────────────────────────────────────────────
interface BodyPoint {
  part: string;
  label: string;
  remark: string;
  severity: number;
  daysSince: number;
}

interface TherapyPlanRow {
  therapyCategoryId: string;
  therapyCategoryName: string;
  therapyId: string;
  therapyName: string;
  totalSessions: number | "";
  sessionFee: number | "";
  startDate: string;
  sessionTime: string;
  scheduleType: string;
  notes: string;
}

const emptyPlan = (): TherapyPlanRow => ({
  therapyCategoryId: "",
  therapyCategoryName: "",
  therapyId: "",
  therapyName: "",
  totalSessions: 1,
  sessionFee: 0,
  startDate: "",
  sessionTime: "",
  scheduleType: "daily",
  notes: "",
});

/** Parse stored sessionTime ("14:30" or "02:30 PM") → clock + period for inputs */
const parseSessionTimeParts = (value: string): { clock: string; period: "AM" | "PM" } => {
  if (!value?.trim()) return { clock: "", period: "AM" };
  const upper = value.trim().toUpperCase();
  const hasAm = /\bAM\b/.test(upper);
  const hasPm = /\bPM\b/.test(upper);
  let clock = upper.replace(/\s*(AM|PM)\s*/g, "").trim();

  // Legacy 24h "HH:mm" → 12h display
  if (!hasAm && !hasPm && /^\d{1,2}:\d{2}$/.test(clock)) {
    const [hStr, mStr] = clock.split(":");
    let h = parseInt(hStr, 10);
    let period: "AM" | "PM" = "AM";
    if (h === 0) {
      h = 12;
      period = "AM";
    } else if (h === 12) {
      period = "PM";
    } else if (h > 12) {
      h -= 12;
      period = "PM";
    }
    return { clock: `${h}:${mStr}`, period };
  }

  return { clock, period: hasPm ? "PM" : "AM" };
};

const buildSessionTimeValue = (clock: string, period: "AM" | "PM"): string => {
  const cleaned = clock.replace(/[^\d:]/g, "").slice(0, 5);
  if (!cleaned) return "";
  return `${cleaned} ${period}`;
};

// ─── Main Component ───────────────────────────────────────────
const ConsultationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isViewMode = !!id;
  const [isEditing, setIsEditing] = useState(false);
  const [searchParams] = useSearchParams();
  const queryApptId = searchParams.get("appointmentId");

  const [step, setStep] = useState(1);

  // Data
  const [appointments, setAppointments] = useState<any[]>([]);
  const [therapyCategories, setTherapyCategories] = useState<any[]>([]);
  const [therapyServices, setTherapyServices] = useState<any[]>([]);

  // View mode states
  const [loadingConsultation, setLoadingConsultation] = useState(false);
  const [consultationData, setConsultationData] = useState<any>(null);
  const [isSavingExam, setIsSavingExam] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  // Step 1 – Appointment & Examination
  const [appointmentId, setAppointmentId] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [availability, setAvailability] = useState<any>(null);

  useEffect(() => {
    const doctorId = selectedAppointment?.doctorId || consultationData?.doctor?.id;
    if (!doctorId) {
      setAvailability(null);
      return;
    }
    const today = new Date();
    const start = today.toISOString().split("T")[0];
    const end = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate()).toISOString().split("T")[0];
    
    fetch(apiUrl(`/api/doctors/${doctorId}/availability?startDate=${start}&endDate=${end}`), {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.message) {
          setAvailability(data);
        } else {
          setAvailability(null);
        }
      })
      .catch(() => {
        setAvailability(null);
      });
  }, [selectedAppointment?.doctorId, consultationData?.doctor?.id]);

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

    const daySchedule = availability.schedules?.[dayName];
    const isWorking = Array.isArray(daySchedule) && daySchedule.length > 0;

    // 3. Doctor Weekly Off (Red)
    if (!isWorking) {
      return (
        <div className="ant-picker-cell-inner" style={{ backgroundColor: '#fff1f0', border: '1px solid #ffa39e', borderRadius: '4px', color: '#a8071a' }}>
          {current.date()}
        </div>
      );
    }

    // 3. Leave (Yellow)
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

    // 4. Working Day (Green)
    if (isWorking) {
      return (
        <div className="ant-picker-cell-inner" style={{ backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '4px', color: '#237804' }}>
          {current.date()}
        </div>
      );
    }

    return info.originNode;
  };
  const [bodyPoints, setBodyPoints] = useState<BodyPoint[]>([]);
  const [pendingPart, setPendingPart] = useState<(typeof BODY_PARTS)[0] | null>(null);
  const [remarkDraft, setRemarkDraft] = useState("");
  const [severityDraft, setSeverityDraft] = useState(5);
  const [daysSinceDraft, setDaysSinceDraft] = useState(0);
  const [generalNotes, setGeneralNotes] = useState("");

  // Step 2 – Therapy Plans & Pricing
  const [therapyPlans, setTherapyPlans] = useState<TherapyPlanRow[]>([emptyPlan()]);
  const [discountType, setDiscountType] = useState<"none" | "percentage" | "fixed">("none");
  const [discountValue, setDiscountValue] = useState<number | "">("");
  const [amountPaid, setAmountPaid] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [whatsappNotification, setWhatsappNotification] = useState(false);

  // Step 2 – Prescription & Advice
  const [advice, setAdvice] = useState("");
  const [medicines, setMedicines] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // Submission
  const [submitting, setSubmitting] = useState(false);

  // Load data
  useEffect(() => {
    const loadAll = async () => {
      try {
        const appts = await apiGet<any[]>("/api/appointments?appointmentType=therapy");
        const list = Array.isArray(appts) ? appts : [];
        setAppointments(list);

        if (queryApptId && !id) {
          setAppointmentId(queryApptId);
          const matched = list.find((a: any) => a.id === queryApptId);
          if (matched) {
            setSelectedAppointment(matched);
          }
        }
        
        const svcs = await apiGet<any[]>("/api/services?type=therapy");
        setTherapyServices(Array.isArray(svcs) ? svcs : []);
        
        const cats = await apiGet<any[]>("/api/specializations");
        setTherapyCategories(Array.isArray(cats) ? cats : []);

        if (id) {
          setLoadingConsultation(true);
          const consult = await apiGet<any>(`/api/consultations/${id}`);
          setConsultationData(consult);
          setAppointmentId(consult.appointmentId);
          setSelectedAppointment(consult.appointment);
          setBodyPoints(consult.bodyPoints || []);
          setGeneralNotes(consult.examinationNotes || "");
          setAdvice(consult.advice || "");
          setMedicines(consult.medicines || []);
          setAttachments(consult.attachments || []);
          setPaymentAmount(Math.max(0, (consult.finalTotalAmount || 0) - (consult.amountPaid || 0)));
          
          // Populate therapy plans from saved data
          if (consult.therapyPlans && consult.therapyPlans.length > 0) {
            setTherapyPlans(consult.therapyPlans.map((p: any) => ({
              therapyCategoryId: p.therapyCategoryId || "",
              therapyCategoryName: p.therapyCategoryName || "",
              therapyId: p.therapyId || "",
              therapyName: p.therapyName || "",
              totalSessions: p.totalSessions || 1,
              sessionFee: p.sessionFee || 0,
              startDate: p.startDate ? new Date(p.startDate).toISOString().split("T")[0] : "",
              sessionTime: p.sessionTime || "",
              scheduleType: p.scheduleType || "daily",
              notes: p.notes || "",
            })));
          }
          
          // Populate pricing fields
          setDiscountType(consult.discountType || "none");
          setDiscountValue(consult.discountValue || "");
          setAmountPaid(consult.amountPaid || "");
          setPaymentMethod(consult.paymentMethod || "Cash");
          setWhatsappNotification(consult.whatsappNotification || false);
          
          setIsEditing(false);
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load details");
      } finally {
        setLoadingConsultation(false);
      }
    };
    loadAll();
  }, [id]);

  const handleSaveExam = async () => {
    if (!id) return;
    setIsSavingExam(true);
    try {
      const res = await apiPut<any>(`/api/consultations/${id}`, {
        examinationNotes: generalNotes,
        bodyPoints,
        medicines,
        advice,
        attachments,
      });
      setConsultationData(res);
      toast.success("Consultation changes saved successfully!");
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update consultation details");
    } finally {
      setIsSavingExam(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !consultationData) return;
    if (paymentAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    const newPaid = (consultationData.amountPaid || 0) + paymentAmount;
    if (newPaid > (consultationData.finalTotalAmount || 0)) {
      toast.error("Amount paid cannot exceed final total amount");
      return;
    }
    setIsRecordingPayment(true);
    try {
      const res = await apiPut<any>(`/api/consultations/${id}/payment`, {
        amountPaid: newPaid,
        paymentMethod: paymentMode,
      });
      setConsultationData(res);
      toast.success("Payment recorded successfully!");
      setPaymentAmount(Math.max(0, (res.finalTotalAmount || 0) - (res.amountPaid || 0)));
    } catch (err: any) {
      toast.error(err.message || "Failed to record payment");
    } finally {
      setIsRecordingPayment(false);
    }
  };

  // When appointment selected, auto-fill consultation fee
  const handleAppointmentSelect = useCallback(
    (id: string) => {
      setAppointmentId(id);
      const appt = appointments.find((a) => a.id === id);
      setSelectedAppointment(appt || null);
    },
    [appointments]
  );

  // Computed pricing
  const consultationFee = selectedAppointment?.finalFee || selectedAppointment?.consultationFee || 0;
  const therapyTotal = therapyPlans.reduce(
    (s, p) => s + (Number(p.totalSessions) || 0) * (Number(p.sessionFee) || 0),
    0
  );
  const subtotal = consultationFee + therapyTotal;
  let discountAmt = 0;
  const discValue = Number(discountValue) || 0;
  if (discountType === "percentage") discountAmt = (subtotal * discValue) / 100;
  else if (discountType === "fixed") discountAmt = discValue;
  const finalTotal = Math.max(0, subtotal - discountAmt);

  // Body diagram — click selects part and cycles severity color (live preview until Save)
  const cycleSeverity = (current: number) => {
    if (current <= 3) return 5; // mild → moderate (orange)
    if (current <= 6) return 8; // moderate → severe (red)
    return 2; // severe → mild (green)
  };

  const handleBodyClick = (part: (typeof BODY_PARTS)[0]) => {
    const existing = bodyPoints.find((bp) => bp.part === part.id);

    // Re-click same pending circle → cycle color bands (green / orange / red)
    if (pendingPart?.id === part.id) {
      setSeverityDraft((prev) => cycleSeverity(prev));
      return;
    }

    if (existing) {
      setPendingPart(part);
      setRemarkDraft(existing.remark);
      setSeverityDraft(existing.severity);
      setDaysSinceDraft(existing.daysSince);
    } else {
      setPendingPart(part);
      setRemarkDraft("");
      // Start on mild green so click visibly changes from unmarked orange
      setSeverityDraft(2);
      setDaysSinceDraft(0);
    }
  };

  const saveBodyPoint = () => {
    if (!pendingPart) return;
    setBodyPoints((prev) => {
      const filtered = prev.filter((bp) => bp.part !== pendingPart.id);
      return [
        ...filtered,
        {
          part: pendingPart.id,
          label: pendingPart.label,
          remark: remarkDraft,
          severity: severityDraft,
          daysSince: daysSinceDraft,
        },
      ];
    });
    setPendingPart(null);
  };

  const removeBodyPoint = (partId: string) => {
    setBodyPoints((prev) => prev.filter((bp) => bp.part !== partId));
  };

  const examHasFront = useMemo(
    () =>
      bodyPoints.some((bp) => BODY_PARTS.find((p) => p.id === bp.part)?.view === "front"),
    [bodyPoints]
  );
  const examHasBack = useMemo(
    () =>
      bodyPoints.some((bp) => BODY_PARTS.find((p) => p.id === bp.part)?.view === "back"),
    [bodyPoints]
  );

  const getClinicForPrint = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const clinic = user?.clinic || {};
      const address = [
        clinic.addressLine1,
        clinic.addressLine2,
        clinic.city,
        clinic.state,
        clinic.country,
        clinic.pincode ? `- ${clinic.pincode}` : "",
      ]
        .filter(Boolean)
        .join(", ");
      return {
        name: clinic.name || clinic.clinicName || user?.clinicName || "Clinic",
        phone: clinic.phone || clinic.mobile || "",
        email: clinic.email || "",
        address,
        logo:
          [clinic.landingPage?.logo, clinic.clinicLogo, clinic.logo, clinic.profileImage]
            .map((v) => (typeof v === "string" ? v.trim() : ""))
            .find((v) => v.length > 0 && v !== "null" && v !== "undefined") || "",
      };
    } catch {
      return { name: "Clinic" };
    }
  };

  const captureDiagramsForPrint = (root: HTMLElement | null) => {
    const created: HTMLImageElement[] = [];
    root?.querySelectorAll<HTMLCanvasElement>(".body-diagram-3d canvas").forEach((canvas) => {
      try {
        const dataUrl = canvas.toDataURL("image/png");
        const img = document.createElement("img");
        img.src = dataUrl;
        img.className = "consult-print-canvas-img";
        img.alt = "Body diagram";
        Object.assign(img.style, {
          width: "100%",
          height: "auto",
          display: "block",
          borderRadius: "12px",
        });
        canvas.style.visibility = "hidden";
        canvas.parentElement?.appendChild(img);
        created.push(img);
      } catch {
        /* canvas may be tainted; skip */
      }
    });
    const cleanup = () => {
      created.forEach((img) => img.remove());
      root?.querySelectorAll<HTMLCanvasElement>(".body-diagram-3d canvas").forEach((c) => {
        c.style.visibility = "";
      });
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    setTimeout(cleanup, 2500);
  };

  const handlePrintConsultationPlan = () => {
    const root = document.getElementById("consultation-print-plan");
    if (!root) {
      toast.error("Print layout not ready");
      return;
    }
    // Allow off-screen WebGL diagrams a moment to paint before capture
    requestAnimationFrame(() => {
      setTimeout(() => {
        captureDiagramsForPrint(root);
        window.print();
      }, 350);
    });
  };

  const handleConsultPrint = () => {
    const root = document.getElementById("consultation-preview-print");
    if (!root) {
      toast.error("Print layout not ready");
      return;
    }
    requestAnimationFrame(() => {
      setTimeout(() => {
        captureDiagramsForPrint(root);
        window.print();
      }, 350);
    });
  };

  // Therapy plan row update
  const updatePlan = (idx: number, field: keyof TherapyPlanRow, value: any) => {
    setTherapyPlans((prev) =>
      prev.map((p, i) => {
        if (i !== idx) return p;
        const updated = { ...p, [field]: value };
        // If therapyId changed, auto-fill name and fee
        if (field === "therapyId") {
          const svc = therapyServices.find((s) => s.id === value);
          if (svc) {
            updated.therapyName = svc.serviceName;
            updated.sessionFee = svc.price || 0;
            updated.therapyCategoryId = svc.specializationId || "";
            updated.therapyCategoryName = svc.specialization?.name || "";
          }
        }
        return updated;
      })
    );
  };

  // Submit
  const handleSubmit = async () => {
    if (!appointmentId) {
      toast.error("Please select an appointment");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        appointmentId,
        examinationNotes: generalNotes,
        bodyPoints,
        medicines,
        advice,
        attachments,
        therapyPlans: therapyPlans.map((p) => ({
          ...p,
          totalSessions: parseInt(String(p.totalSessions)) || 1,
          sessionFee: parseFloat(String(p.sessionFee)) || 0,
        })),
        consultationFee,
        discountType,
        discountValue: Number(discountValue) || 0,
        amountPaid: Number(amountPaid) || 0,
        paymentMethod,
        whatsappNotification,
        status: "Confirmed",
      };
      if (id) {
        // Update existing Draft consultation
        await apiPut<any>(`/api/consultations/${id}`, payload);
        toast.success("Consultation confirmed! Sessions booked successfully.");
      } else {
        // Create new consultation
        await apiPost<any>("/api/consultations", payload);
        toast.success("Consultation created! Sessions booked successfully.");
      }
      navigate(routes.therapyConsultations);
    } catch (err: any) {
      toast.error(err.message || "Failed to create consultation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAttachment(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(apiUrl("/api/uploads/therapy-image"), {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to upload file");
      }

      const resData = await res.json();
      setAttachments((prev) => [...prev, { url: resData.url, remark: "" }]);
      toast.success("Image uploaded successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload file");
    } finally {
      setUploadingAttachment(false);
      if (e.target) e.target.value = "";
    }
  };

  const addMedicineRow = () => {
    setMedicines((prev) => [
      ...prev,
      { name: "", dosage: "1-0-1", duration: "5 Days", instructions: "After Food" },
    ]);
  };

  const updateMedicineRow = (idx: number, field: string, value: string) => {
    setMedicines((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
    );
  };

  const removeMedicineRow = (idx: number) => {
    setMedicines((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateAttachmentRemark = (idx: number, remark: string) => {
    setAttachments((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, remark } : a))
    );
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const renderPrescriptionEditor = () => {
    if (isViewMode && !isEditing) {
      return (
        <div className="card tc-card mb-3">
          <div className="card-header tc-card-head px-3 px-md-4 py-3">
            <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
              <span className="tc-section-icon" style={{ background: "#e8f1ff", color: "#4f46e5" }}>
                <i className="ti ti-pill" />
              </span>
              Prescription & Advice
            </h6>
          </div>
          <div className="card-body px-4 py-3">
            <div className="mb-4">
              <label className="form-label fw-bold small text-muted">Doctor Advice / Instruction</label>
              <div className="p-3 bg-light rounded text-slate-700 fs-13" style={{ whiteSpace: "pre-wrap", borderLeft: "4px solid #6366f1" }}>
                {advice || "No advice recorded."}
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-bold small text-muted mb-2 d-block">Prescribed Medicines</label>
              {medicines.length === 0 ? (
                <div className="text-center py-4 border rounded-3 bg-light" style={{ borderStyle: "dashed" }}>
                  <span className="text-muted small">No medicines prescribed.</span>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        <th className="border-0 py-2">Medicine Name</th>
                        <th className="border-0 py-2" style={{ width: 140 }}>Dosage</th>
                        <th className="border-0 py-2" style={{ width: 120 }}>Duration</th>
                        <th className="border-0 py-2" style={{ width: 160 }}>Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicines.map((m, idx) => (
                        <tr key={idx}>
                          <td className="border-0 py-2 fw-semibold text-dark">{m.name || m.medicineName}</td>
                          <td className="border-0 py-2">{m.dosage || m.frequency}</td>
                          <td className="border-0 py-2">{m.duration}</td>
                          <td className="border-0 py-2">{m.instructions || m.timings}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {attachments.length > 0 && (
              <div>
                <label className="form-label fw-bold small text-muted mb-2 d-block">Diagnostic Scans & Attachments</label>
                <div className="row g-3">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="col-md-6 col-lg-4">
                      <div className="p-2 rounded-3 bg-white h-100 tc-soft-panel d-flex flex-column gap-2">
                        <img
                          src={att.url.startsWith("/") ? apiUrl(att.url) : att.url}
                          alt="Scan"
                          className="rounded-2"
                          style={{ width: "100%", height: 120, objectFit: "cover" }}
                        />
                        <div className="small text-dark fw-medium mt-1 px-1">{att.remark || "No remark"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="card tc-card mb-3">
        <div className="card-header tc-card-head px-3 px-md-4 py-3 d-flex align-items-center justify-content-between">
          <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
            <span className="tc-section-icon" style={{ background: "#e8f1ff", color: "#4f46e5" }}>
              <i className="ti ti-pill" />
            </span>
            Prescription & Advice
          </h6>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
            style={{ borderRadius: 8 }}
            onClick={addMedicineRow}
          >
            <i className="ti ti-plus" /> Add Medicine
          </button>
        </div>
        <div className="card-body px-4 py-3">
          {/* General Advice */}
          <div className="mb-4">
            <label className="form-label fw-bold small">Doctor Advice / Instruction</label>
            <IconTextarea
              fieldLabel="notes"
              rows={3}
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              placeholder="Enter dietary, resting or general exercise instructions..."
              style={{ borderRadius: 10, fontSize: 13 }}
            />
          </div>

          {/* Medicines List */}
          <div className="mb-4">
            <label className="form-label fw-bold small mb-2 d-block">Prescribed Medicines</label>
            {medicines.length === 0 ? (
              <div className="text-center py-4 border rounded-3 bg-light" style={{ borderStyle: "dashed" }}>
                <span className="text-muted small">No medicines prescribed yet. Click "+ Add Medicine" to prescribe.</span>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th className="border-0 py-2">Medicine Name *</th>
                      <th className="border-0 py-2" style={{ width: 140 }}>Dosage</th>
                      <th className="border-0 py-2" style={{ width: 120 }}>Duration</th>
                      <th className="border-0 py-2" style={{ width: 160 }}>Instructions</th>
                      <th className="border-0 py-2 text-end" style={{ width: 60 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicines.map((m, idx) => (
                      <tr key={idx}>
                        <td className="border-0 py-1">
                          <IconFormControl
                            type="text"
                            fieldLabel="medicine"
                            className="form-control-sm"
                            placeholder="Medicine Name"
                            value={m.name}
                            onChange={(e) => updateMedicineRow(idx, "name", e.target.value)}
                            style={{ borderRadius: 6 }}
                          />
                        </td>
                        <td className="border-0 py-1">
                          <select
                            className="form-select form-select-sm"
                            value={m.dosage}
                            onChange={(e) => updateMedicineRow(idx, "dosage", e.target.value)}
                            style={{ borderRadius: 6 }}
                          >
                            <option value="1-0-1">1-0-1 (Morning & Night)</option>
                            <option value="1-1-1">1-1-1 (Thrice a day)</option>
                            <option value="1-0-0">1-0-0 (Morning only)</option>
                            <option value="0-1-0">0-1-0 (Afternoon only)</option>
                            <option value="0-0-1">0-0-1 (Night only)</option>
                            <option value="1-1-1-1">1-1-1-1 (Four times)</option>
                          </select>
                        </td>
                        <td className="border-0 py-1">
                          <IconFormControl
                            type="text"
                            fieldLabel="time"
                            className="form-control-sm"
                            placeholder="Duration"
                            value={m.duration}
                            onChange={(e) => updateMedicineRow(idx, "duration", e.target.value)}
                            style={{ borderRadius: 6 }}
                          />
                        </td>
                        <td className="border-0 py-1">
                          <select
                            className="form-select form-select-sm"
                            value={m.instructions}
                            onChange={(e) => updateMedicineRow(idx, "instructions", e.target.value)}
                            style={{ borderRadius: 6 }}
                          >
                            <option value="After Food">After Food</option>
                            <option value="Before Food">Before Food</option>
                            <option value="With Food">With Food</option>
                            <option value="Empty Stomach">Empty Stomach</option>
                          </select>
                        </td>
                        <td className="border-0 py-1 text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-danger p-0"
                            onClick={() => removeMedicineRow(idx)}
                          >
                            <i className="ti ti-trash fs-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Diagnostic Scans / Attachments */}
          <div>
            <label className="form-label fw-bold small mb-2 d-block">Diagnostic Scans & Attachments (Multiple)</label>
            <div className="d-flex align-items-center gap-3 mb-3">
              <input
                type="file"
                id="consultation-file-input"
                className="d-none"
                accept="image/*"
                onChange={handleFileChange}
              />
              <button
                type="button"
                className="btn btn-outline-secondary d-flex align-items-center gap-2"
                onClick={() => document.getElementById("consultation-file-input")?.click()}
                disabled={uploadingAttachment}
                style={{ borderRadius: 10, padding: "8px 16px" }}
              >
                {uploadingAttachment ? (
                  <>
                    <span className="spinner-border spinner-border-sm" /> Uploading...
                  </>
                ) : (
                  <>
                    <i className="ti ti-upload" /> Upload Image Scan
                  </>
                )}
              </button>
              <span className="text-muted small">Supports JPG, PNG images.</span>
            </div>

            {attachments.length > 0 && (
              <div className="row g-3">
                {attachments.map((att, idx) => (
                  <div key={idx} className="col-md-6 col-lg-4">
                    <div className="p-2 rounded-3 bg-white h-100 tc-soft-panel d-flex flex-column gap-2" style={{ position: "relative" }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger rounded-circle p-1 d-flex align-items-center justify-content-center"
                        onClick={() => removeAttachment(idx)}
                        style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, zIndex: 10 }}
                      >
                        <i className="ti ti-x" style={{ fontSize: 10 }} />
                      </button>
                      <img
                        src={att.url.startsWith("/") ? apiUrl(att.url) : att.url}
                        alt="Scan"
                        className="rounded-2"
                        style={{ width: "100%", height: 120, objectFit: "cover" }}
                      />
                      <IconFormControl
                        type="text"
                        fieldLabel="notes"
                        className="form-control-sm"
                        placeholder="Add caption / remark..."
                        value={att.remark}
                        onChange={(e) => updateAttachmentRemark(idx, e.target.value)}
                        style={{ borderRadius: 6, fontSize: 12 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loadingConsultation) {
    return (
      <div className="page-wrapper">
        <div className="content d-flex align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (isViewMode && consultationData && !isEditing && consultationData.status !== "Draft") {
    const allChildAppts = (consultationData.therapyPlans || []).flatMap((p: any) =>
      (p.childAppointments || []).map((a: any) => ({
        ...a,
        therapyName: p.therapyName,
      }))
    );
    allChildAppts.sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

    const pendingBalance = Math.max(0, (consultationData.finalTotalAmount || 0) - (consultationData.amountPaid || 0));

    return (
      <div className="page-wrapper">
        <div className="content therapy-consult-page">
          {/* Header */}
          <div className="page-header d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 border-bottom pb-3 mb-3">
            <div className="d-flex align-items-center gap-3 min-w-0">
              <div className="tc-page-icon">
                <i className="ti ti-file-description" />
              </div>
              <div className="min-w-0">
                <h4 className="fw-bold mb-0 text-dark">Consultation Details</h4>
                <p className="text-muted fs-13 mb-0">{consultationData.consultationCode}</p>
              </div>
            </div>
            <div className="d-flex flex-wrap gap-2">
                {consultationData.status === "Confirmed" && (
                  <button
                    type="button"
                    className="btn btn-warning text-white d-flex align-items-center gap-2"
                    onClick={() => {
                      setGeneralNotes(consultationData.examinationNotes || "");
                      setAdvice(consultationData.advice || "");
                      setMedicines(consultationData.medicines || []);
                      setBodyPoints(consultationData.bodyPoints || []);
                      setAttachments(consultationData.attachments || []);
                      setIsEditing(true);
                      setStep(1);
                    }}
                    style={{ borderRadius: "10px", fontWeight: 600, minHeight: 38 }}
                  >
                    <i className="ti ti-edit" />
                    Edit Details
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-light d-flex align-items-center gap-2"
                  onClick={handlePrintConsultationPlan}
                  style={{ borderRadius: "10px", fontWeight: 600, minHeight: 38 }}
                >
                  <i className="ti ti-printer" /> Print Plan
                </button>
                <a
                  href={routes.therapyConsultations}
                  className="btn btn-primary d-flex align-items-center gap-2"
                  style={{ borderRadius: "10px", fontWeight: 600, minHeight: 38 }}
                >
                  <i className="ti ti-arrow-left" /> Back to List
                </a>
            </div>
          </div>

          {/* Top Info Card */}
          <div className="card tc-card mb-3">
            <div className="card-body py-3">
              <div className="row g-3 align-items-center">
                <div className="col-md-6 border-end">
                  <div className="d-flex align-items-center gap-3">
                    {consultationData.patient?.profileImage ? (
                      <img
                        src={consultationData.patient.profileImage}
                        alt=""
                        className="rounded-circle"
                        style={{ width: 52, height: 52, objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-primary"
                        style={{ width: 52, height: 52, background: "#6366f118", fontSize: 18 }}
                      >
                        {(consultationData.patient?.firstName?.[0] || "P").toUpperCase()}
                      </div>
                    )}
                    <div>
                      <span className="text-muted small d-block mb-1">PATIENT</span>
                      <h5 className="mb-0 fw-bold fs-16">
                        {consultationData.patient?.firstName} {consultationData.patient?.lastName}
                      </h5>
                      <div className="text-muted small">{consultationData.patient?.phone || "—"}</div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 ps-md-4">
                  <div className="row g-3">
                    <div className="col-6">
                      <span className="text-muted small d-block mb-1">THERAPIST</span>
                      <strong className="fw-semibold">Dr. {consultationData.doctor?.fullName || "—"}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted small d-block mb-1">PARENT APPOINTMENT</span>
                      <strong className="fw-semibold">{consultationData.appointment?.appointmentCode || "—"}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3">
            {/* Left Column: Editable Examination Details */}
            <div className="col-lg-6">
              <div className="card tc-card mb-3 h-100">
                <div className="card-header tc-card-head d-flex align-items-center justify-content-between px-3 px-md-4 py-3">
                  <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                    <span className="tc-section-icon" style={{ background: "#e8f1ff", color: "#4f46e5" }}>
                      <i className="ti ti-body-scan" />
                    </span>
                    Body Diagram Findings {isEditing && "(Click to Edit Points)"}
                  </h6>
                </div>

                <div className="card-body px-3 px-md-4 py-3">
                  <div className="row g-3">
                    <div className="col-12 d-flex justify-content-center">
                      <BodyDiagram3D
                        parts={BODY_PARTS}
                        marks={bodyPoints}
                        interactive={isEditing}
                        onPartClick={handleBodyClick}
                        severityColor={severityColor}
                        height={300}
                        previewPartId={isEditing ? pendingPart?.id : null}
                        previewSeverity={severityDraft}
                      />
                    </div>

                    <div className="col-12 d-flex flex-column gap-3">
                      {isEditing && pendingPart && (
                        <div className="p-3 rounded-3 bg-light tc-soft-panel">
                          <div className="fw-bold mb-2 text-primary">{pendingPart.label}</div>
                          <div className="mb-2">
                            <label className="form-label fw-semibold small mb-1">Remark</label>
                            <IconTextarea
                              fieldLabel="notes"
                              className="form-control-sm"
                              rows={2}
                              value={remarkDraft}
                              onChange={(e) => setRemarkDraft(e.target.value)}
                            />
                          </div>
                          <div className="mb-2">
                            <label className="form-label fw-semibold small mb-1">
                              Severity: <strong style={{ color: severityColor(severityDraft) }}>{severityDraft}/10</strong>
                            </label>
                            <input
                              type="range"
                              className="form-range"
                              min={1}
                              max={10}
                              value={severityDraft}
                              onChange={(e) => setSeverityDraft(parseInt(e.target.value))}
                            />
                          </div>
                          <div className="mb-3">
                            <label className="form-label fw-semibold small mb-1">Days Since</label>
                            <IconFormControl
                              type="number"
                              fieldLabel="time"
                              className="form-control-sm"
                              placeholder="Days Since"
                              value={daysSinceDraft}
                              onChange={(e) => setDaysSinceDraft(parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="d-flex gap-2">
                            <button type="button" className="btn btn-sm btn-primary" onClick={saveBodyPoint}>Save</button>
                            <button type="button" className="btn btn-sm btn-cancel-danger" onClick={() => setPendingPart(null)}>Cancel</button>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="form-label fw-bold small">General Examination Notes</label>
                        {isEditing ? (
                          <IconTextarea
                            fieldLabel="notes"
                            rows={3}
                            value={generalNotes}
                            onChange={(e) => setGeneralNotes(e.target.value)}
                            placeholder="General examination notes..."
                            style={{ borderRadius: 10, fontSize: 13 }}
                          />
                        ) : (
                          <div className="p-3 bg-light rounded text-slate-700 fs-13" style={{ whiteSpace: "pre-wrap" }}>
                            {consultationData.examinationNotes || "No examination notes recorded."}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {bodyPoints.length > 0 && (
                    <div className="mt-3">
                      <h6 className="fw-bold mb-2 small">Marked Areas ({bodyPoints.length})</h6>
                      <div className="row g-2">
                        {bodyPoints.map((bp) => (
                          <div key={bp.part} className="col-md-6">
                            <div className="p-3 rounded-3 h-100 tc-soft-panel">
                              <div className="fw-bold d-flex align-items-center justify-content-between small">
                                <span className="d-flex align-items-center gap-2">
                                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: severityColor(bp.severity) }} />
                                  {bp.label}
                                </span>
                                <div className="d-flex align-items-center gap-2">
                                  <span className="badge bg-light text-secondary">{bp.severity}/10</span>
                                  {isEditing && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-link text-danger p-0"
                                      onClick={() => setBodyPoints(bodyPoints.filter(p => p.part !== bp.part))}
                                      title="Remove"
                                    >
                                      <i className="ti ti-trash" style={{ fontSize: 11 }} />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="text-muted small mt-1">Since {bp.daysSince} days</div>
                              {bp.remark && <div className="small mt-2 text-dark">{bp.remark}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Recommended Therapies Card */}
              <div className="card tc-card mb-3">
                <div className="card-header tc-card-head px-3 px-md-4 py-3">
                  <h6 className="fw-bold mb-0">Recommended Therapy Plan</h6>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table align-middle mb-0" style={{ fontSize: 13 }}>
                      <thead style={{ background: "#f8fafc" }}>
                        <tr>
                          <th className="px-4 py-2 border-0 fw-semibold text-muted">Therapy</th>
                          <th className="py-2 border-0 fw-semibold text-muted">Sessions</th>
                          <th className="py-2 border-0 fw-semibold text-muted">Schedule</th>
                          <th className="py-2 border-0 fw-semibold text-muted">Start Date</th>
                          <th className="py-2 border-0 fw-semibold text-muted">Time Slot</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(consultationData.therapyPlans || []).map((p: any, i: number) => (
                          <tr key={p.id || i}>
                            <td className="px-4 fw-semibold">{p.therapyName}</td>
                            <td>{p.totalSessions} sessions</td>
                            <td className="text-capitalize">{p.scheduleType}</td>
                            <td>{p.startDate ? new Date(p.startDate).toLocaleDateString("en-GB") : "—"}</td>
                            <td>{p.sessionTime || "Any available"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {renderPrescriptionEditor()}
            </div>

            {/* Right Column: Invoicing, Payment Capture, and Child Appointments */}
            <div className="col-lg-6">
              {/* Payment Summary & Record Payment */}
              <div className="card tc-card mb-3">
                <div className="card-body">
                  <h6 className="fw-bold mb-3">Billing & Payment Summary</h6>
                  <div className="d-flex flex-column gap-2 mb-3" style={{ fontSize: 13 }}>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Total Amount</span>
                      <span className="fw-bold">₹{consultationData.finalTotalAmount?.toLocaleString()}</span>
                    </div>
                    <div className="d-flex justify-content-between text-success">
                      <span>Total Paid</span>
                      <span className="fw-bold">₹{consultationData.amountPaid?.toLocaleString()}</span>
                    </div>
                    <div className="d-flex justify-content-between text-danger">
                      <span>Balance Due</span>
                      <span className="fw-bold">₹{pendingBalance.toLocaleString()}</span>
                    </div>
                    <div className="mt-2">
                      <span
                        className={`badge ${
                          consultationData.paymentStatus === "Paid"
                            ? "bg-success-subtle text-success"
                            : consultationData.paymentStatus === "Partial Paid"
                            ? "bg-warning-subtle text-warning"
                            : "bg-danger-subtle text-danger"
                        }`}
                        style={{ borderRadius: 6, padding: "4px 10px" }}
                      >
                        {consultationData.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {pendingBalance > 0 && (
                    <form onSubmit={handleRecordPayment} className="border-top pt-3">
                      <h6 className="fw-bold mb-2 small">Collect Payment</h6>
                      <div className="row g-2">
                        <div className="col-7">
                          <IconFormControl
                            type="number"
                            fieldLabel="amount"
                            className="form-control-sm"
                            max={pendingBalance}
                            min={1}
                            placeholder="Amount (₹)"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="col-5">
                          <select
                            className="form-select form-select-sm"
                            value={paymentMode}
                            onChange={(e) => setPaymentMode(e.target.value)}
                          >
                            <option value="Cash">Cash</option>
                            <option value="Card">Card</option>
                            <option value="UPI">UPI</option>
                          </select>
                        </div>
                        <div className="col-12 mt-2">
                          <button
                            type="submit"
                            className="btn btn-sm btn-success w-100"
                            disabled={isRecordingPayment}
                          >
                            {isRecordingPayment ? (
                              <span className="spinner-border spinner-border-sm me-1" />
                            ) : (
                              "Record Transaction"
                            )}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Generated Appointments List */}
              <div className="card tc-card mb-3">
                <div className="card-header tc-card-head px-3 px-md-4 py-3">
                  <h6 className="fw-bold mb-0">Scheduled Therapy Sessions ({allChildAppts.length})</h6>
                </div>
                <div className="card-body p-0">
                  <div className="d-flex flex-column" style={{ maxHeight: 400, overflowY: "auto" }}>
                    {allChildAppts.map((appt: any, idx: number) => (
                      <div
                        key={appt.id || idx}
                        className="p-3 border-bottom d-flex align-items-center justify-content-between"
                        style={{ fontSize: 13 }}
                      >
                        <div>
                          <div className="fw-semibold">
                            Session {appt.sessionNumber} – {appt.therapyName}
                          </div>
                          <div className="text-muted small mt-1">
                            {new Date(appt.scheduledAt).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}{" "}
                            at{" "}
                            {new Date(appt.scheduledAt).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </div>
                          <div className="text-muted small">Code: <span className="font-monospace text-primary">{appt.appointmentCode}</span></div>
                        </div>
                        <div className="d-flex flex-column align-items-end gap-1">
                          <span className={`badge bg-light text-secondary`} style={{ borderRadius: 6 }}>
                            {appt.status}
                          </span>
                          <span
                            className={`badge bg-${
                              appt.paymentStatus === "Paid"
                                ? "success"
                                : appt.paymentStatus === "Partial Paid"
                                ? "warning"
                                : "danger"
                            }-subtle text-${
                              appt.paymentStatus === "Paid"
                                ? "success"
                                : appt.paymentStatus === "Partial Paid"
                                ? "warning"
                                : "danger"
                            }`}
                            style={{ borderRadius: 6, fontSize: 10 }}
                          >
                            {appt.paymentStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ConsultationPrintPlan
            clinic={getClinicForPrint()}
            consultationCode={consultationData.consultationCode}
            status={consultationData.status}
            createdAt={consultationData.createdAt || consultationData.confirmedAt}
            patient={consultationData.patient}
            doctor={consultationData.doctor}
            appointment={consultationData.appointment}
            bodyParts={BODY_PARTS}
            bodyPoints={bodyPoints}
            examHasFront={examHasFront}
            examHasBack={examHasBack}
            examinationNotes={consultationData.examinationNotes || generalNotes}
            therapyPlans={consultationData.therapyPlans || []}
            sessions={allChildAppts}
            billing={{
              consultationFee: consultationData.consultationFee,
              therapyTotal: (consultationData.therapyPlans || []).reduce(
                (sum: number, p: any) =>
                  sum + (Number(p.totalSessions) || 0) * (Number(p.sessionFee) || 0),
                0
              ),
              discountType: consultationData.discountType,
              discountValue: consultationData.discountValue,
              finalTotalAmount: consultationData.finalTotalAmount,
              amountPaid: consultationData.amountPaid,
              paymentStatus: consultationData.paymentStatus,
              paymentMethod: consultationData.paymentMethod || consultationData.invoice?.paymentMethod,
              invoiceCode: consultationData.invoice?.invoiceCode,
            }}
            medicines={consultationData.medicines || medicines}
            advice={consultationData.advice || advice}
            severityColor={severityColor}
            availability={availability}
          />

        <style>{`
          .therapy-consult-page .tc-page-icon {
            width: 48px; height: 48px; border-radius: 12px;
            background: rgba(79,70,229,0.12); color: #4f46e5;
            display: inline-flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0;
          }
          .therapy-consult-page .tc-card,
          .therapy-consult-page .card {
            border: none !important;
            border-radius: 14px !important;
            box-shadow: 0 4px 18px rgba(15, 23, 42, 0.08) !important;
            background: #fff;
          }
          .therapy-consult-page .tc-card-head,
          .therapy-consult-page .card-header:not(.tc-gradient-head) {
            border-bottom: 1px solid rgba(15,23,42,0.05) !important;
            background: #f8fafc !important;
            border-radius: 14px 14px 0 0 !important;
          }
          .therapy-consult-page .tc-section-icon {
            width: 32px; height: 32px; border-radius: 9px;
            display: inline-flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0;
          }
          .therapy-consult-page .tc-soft-panel {
            background: #f8fafc !important;
            border: none !important;
            box-shadow: 0 1px 4px rgba(15,23,42,0.05);
          }
          .therapy-consult-page .tc-pending-card {
            box-shadow: 0 8px 24px rgba(79,70,229,0.14) !important;
          }
          .therapy-consult-page .tc-plan-block {
            background: #f8fafc !important;
            border: none !important;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(15,23,42,0.06);
          }
          .therapy-consult-page .btn-cancel-danger {
            border: 1px solid #b91c1c !important;
            color: #b91c1c !important;
            background: #fff !important;
          }
          .therapy-consult-page .btn-cancel-danger:hover {
            background: #fef2f2 !important;
            color: #991b1b !important;
            border-color: #991b1b !important;
          }
          .therapy-consult-page .row.g-4 { --bs-gutter-y: 0.85rem; --bs-gutter-x: 0.85rem; }
          .therapy-consult-page .card-body { padding-top: 1rem; padding-bottom: 1rem; }
        `}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content therapy-consult-page">
        {/* Header */}
        <div className="page-header d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 border-bottom pb-3 mb-3">
          <div className="d-flex align-items-center gap-3 min-w-0">
            <div className="tc-page-icon">
              <i className="ti ti-stethoscope" />
            </div>
            <div className="min-w-0">
              <h4 className="fw-bold mb-0 text-dark">
                {isEditing
                  ? `Edit Consultation - ${consultationData?.consultationCode}`
                  : "New Consultation"}
              </h4>
              <p className="text-muted fs-13 mb-0">
                {isEditing ? "Update examination & therapy plan" : "Create examination & therapy plan"}
              </p>
            </div>
          </div>
          {isEditing && (
            <button
              type="button"
              className="btn btn-cancel-danger d-flex align-items-center gap-2"
              onClick={() => setIsEditing(false)}
              style={{ borderRadius: 10, fontWeight: 600, minHeight: 38 }}
            >
              <i className="ti ti-x" /> Cancel Edit
            </button>
          )}
        </div>

        {/* Step Indicator */}
        <div className="card tc-card mb-3">
          <div className="card-body py-3 px-4">
            <div className="d-flex align-items-center gap-0">
              {[
                { n: 1, label: "Examination", icon: "ti-stethoscope" },
                { n: 2, label: "Therapy Plan & Pricing", icon: "ti-calendar-plus" },
                { n: 3, label: "Preview & Confirm", icon: "ti-eye-check" },
              ].map((s, i) => (
                <div key={s.n} className="d-flex align-items-center" style={{ flex: i < 2 ? 1 : "auto" }}>
                  <div
                    className="d-flex align-items-center gap-2 cursor-pointer"
                    onClick={() => step > s.n && setStep(s.n)}
                    style={{ cursor: step > s.n ? "pointer" : "default" }}
                  >
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                      style={{
                        width: 38,
                        height: 38,
                        background: step === s.n ? "#6366f1" : step > s.n ? "#10b981" : "#f1f5f9",
                        color: step >= s.n ? "#fff" : "#94a3b8",
                        fontSize: 14,
                        transition: "all 0.3s",
                        flexShrink: 0,
                      }}
                    >
                      {step > s.n ? <i className="ti ti-check" /> : <i className={`ti ${s.icon}`} />}
                    </div>
                    <div className="d-none d-md-block">
                      <div
                        className="fw-semibold"
                        style={{ fontSize: 13, color: step >= s.n ? "#1e293b" : "#94a3b8" }}
                      >
                        Step {s.n}
                      </div>
                      <div style={{ fontSize: 12, color: step >= s.n ? "#6366f1" : "#cbd5e1" }}>
                        {s.label}
                      </div>
                    </div>
                  </div>
                  {i < 2 && (
                    <div
                      style={{
                        flex: 1,
                        height: 2,
                        background: step > s.n ? "#10b981" : "#e2e8f0",
                        margin: "0 12px",
                        transition: "all 0.3s",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── STEP 1: EXAMINATION ─────────────────────────────── */}
        {step === 1 && (
          <div className="row g-4">
            {/* Appointment Selection */}
            <div className="col-12">
              <div className="card tc-card">
                <div className="card-body">
                  <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                    <span
                      className="rounded-2 d-flex align-items-center justify-content-center"
                      style={{ width: 28, height: 28, background: "#6366f118" }}
                    >
                      <i className="ti ti-calendar-event" style={{ color: "#6366f1", fontSize: 14 }} />
                    </span>
                    Select Parent Appointment
                  </h6>
                  <div className="row g-3">
                    <div className="col-md-8">
                      <select
                        className="form-select"
                        value={appointmentId}
                        onChange={(e) => handleAppointmentSelect(e.target.value)}
                        required
                        style={{ borderRadius: 10, minHeight: 46 }}
                      >
                        <option value="">— Select Therapy Appointment —</option>
                        {appointments.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.appointmentCode} | {a.patient?.firstName} {a.patient?.lastName} |{" "}
                            {a.doctor?.fullName} |{" "}
                            {new Date(a.scheduledAt).toLocaleDateString("en-GB")}
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedAppointment && (
                      <div className="col-md-4">
                        <div
                          className="p-3 h-100 d-flex align-items-center gap-3"
                          style={{ background: "#f8fafc", borderRadius: 10 }}
                        >
                          <div>
                            <div className="fw-semibold" style={{ fontSize: 14 }}>
                              {selectedAppointment.patient?.firstName}{" "}
                              {selectedAppointment.patient?.lastName}
                            </div>
                            <div className="text-muted" style={{ fontSize: 12 }}>
                              Dr. {selectedAppointment.doctor?.fullName}
                            </div>
                            <div className="text-muted" style={{ fontSize: 12 }}>
                              Consultation Fee: ₹{consultationFee.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Body Diagram — fixed height (does not stretch with right panel) */}
            <div className="col-lg-6">
              <div className="card tc-card">
                <div className="card-header tc-card-head d-flex align-items-center justify-content-between px-3 px-md-4 py-3">
                  <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                    <span className="tc-section-icon" style={{ background: "#e8f1ff", color: "#4f46e5" }}>
                      <i className="ti ti-body-scan" />
                    </span>
                    Body Diagram – Click to Mark
                  </h6>
                </div>
                <div className="card-body" style={{ padding: "8px 16px 12px" }}>
                  <BodyDiagram3D
                    parts={BODY_PARTS}
                    marks={bodyPoints}
                    interactive
                    onPartClick={handleBodyClick}
                    severityColor={severityColor}
                    height={pendingPart ? 420 : 320}
                    previewPartId={pendingPart?.id}
                    previewSeverity={severityDraft}
                  />
                  <div className="d-flex align-items-center gap-3 flex-wrap pt-3">
                    <span style={{ fontSize: 12, color: "#64748b" }}>Severity Scale:</span>
                    {[
                      { color: "#2563eb", label: "1–3 Mild" },
                      { color: "#f59e0b", label: "4–6 Moderate" },
                      { color: "#ef4444", label: "7–10 Severe" },
                    ].map((s) => (
                      <div key={s.label} className="d-flex align-items-center gap-1">
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color }} />
                        <span style={{ fontSize: 11, color: "#64748b" }}>{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Point Details + General Notes */}
            <div className="col-lg-6 d-flex flex-column gap-3">
              {/* Add Remark Modal/Panel */}
              {pendingPart && (
                <div className="card tc-card tc-pending-card">
                  <div className="card-body">
                    <div className="fw-bold mb-3" style={{ color: "#6366f1" }}>
                      <i className="ti ti-map-pin me-2" />
                      {pendingPart.label}
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
                        Remark
                      </label>
                      <IconTextarea
                        fieldLabel="notes"
                        rows={2}
                        value={remarkDraft}
                        onChange={(e) => setRemarkDraft(e.target.value)}
                        placeholder="Describe the complaint..."
                        style={{ borderRadius: 8, fontSize: 13 }}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
                        Severity: <strong style={{ color: severityColor(severityDraft) }}>{severityDraft}/10</strong>
                      </label>
                      <input
                        type="range"
                        className="form-range"
                        min={1}
                        max={10}
                        value={severityDraft}
                        onChange={(e) => setSeverityDraft(parseInt(e.target.value))}
                        style={{ accentColor: severityColor(severityDraft) }}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
                        Since how many days?
                      </label>
                      <IconFormControl
                        type="number"
                        fieldLabel="time"
                        placeholder="Since how many days?"
                        min={0}
                        value={daysSinceDraft}
                        onChange={(e) => setDaysSinceDraft(parseInt(e.target.value) || 0)}
                        style={{ borderRadius: 8, fontSize: 13 }}
                      />
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ borderRadius: 8, flex: 1 }}
                        onClick={saveBodyPoint}
                      >
                        <i className="ti ti-check me-1" />Save
                      </button>
                      {bodyPoints.find((bp) => bp.part === pendingPart.id) && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          style={{ borderRadius: 8 }}
                          onClick={() => { removeBodyPoint(pendingPart.id); setPendingPart(null); }}
                        >
                          <i className="ti ti-trash" />
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-cancel-danger btn-sm"
                        style={{ borderRadius: 8 }}
                        onClick={() => setPendingPart(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Marked Points List */}
              {bodyPoints.length > 0 && (
                <div className="card tc-card">
                  <div className="card-body">
                    <h6 className="fw-bold mb-3" style={{ fontSize: 14 }}>
                      <i className="ti ti-map-2 me-2 text-primary" />
                      Marked Areas ({bodyPoints.length})
                    </h6>
                    <div className="d-flex flex-column gap-2" style={{ maxHeight: 240, overflowY: "auto" }}>
                      {bodyPoints.map((bp) => (
                        <div
                          key={bp.part}
                          className="d-flex align-items-start justify-content-between p-2"
                          style={{ background: "#f8fafc", borderRadius: 8 }}
                        >
                          <div>
                            <div className="fw-semibold d-flex align-items-center gap-2" style={{ fontSize: 13 }}>
                              <div
                                style={{
                                  width: 10, height: 10, borderRadius: "50%",
                                  background: severityColor(bp.severity),
                                  flexShrink: 0,
                                }}
                              />
                              {bp.label}
                              <span className="text-muted" style={{ fontSize: 11 }}>
                                ({bp.severity}/10, {bp.daysSince} days)
                              </span>
                            </div>
                            {bp.remark && (
                              <div className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>
                                {bp.remark}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-danger p-0 ms-2"
                            onClick={() => removeBodyPoint(bp.part)}
                          >
                            <i className="ti ti-x" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* General Notes */}
              <div className="card tc-card">
                <div className="card-body">
                  <h6 className="fw-bold mb-3" style={{ fontSize: 14 }}>
                    <i className="ti ti-notes me-2 text-primary" />
                    General Examination Notes (Optional)
                  </h6>
                  <IconTextarea
                    fieldLabel="notes"
                    rows={4}
                    value={generalNotes}
                    onChange={(e) => setGeneralNotes(e.target.value)}
                    placeholder="Add general examination observations..."
                    style={{ borderRadius: 10, fontSize: 13, resize: "vertical" }}
                  />
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="col-12 d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-cancel-danger"
                style={{ borderRadius: 10, padding: "10px 28px" }}
                onClick={() => navigate(routes.therapyConsultations)}
              >
                Cancel
              </button>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  style={{ borderRadius: 10, padding: "10px 24px" }}
                  onClick={() => setStep(2)}
                >
                  Skip Examination <i className="ti ti-arrow-right ms-1" />
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ borderRadius: 10, padding: "10px 28px" }}
                  onClick={() => {
                    if (!appointmentId) { toast.error("Please select an appointment"); return; }
                    setStep(2);
                  }}
                >
                  Next: Therapy Plan <i className="ti ti-arrow-right ms-1" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 2: THERAPY PLAN & PRICING ─────────────────── */}
        {step === 2 && (
          <div className="row g-4">
            {/* Examination body parts — reference for recommending therapies */}
            <div className="col-12">
              <div className="card tc-card">
                <div className="card-header tc-card-head px-3 px-md-4 py-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                    <span className="tc-section-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
                      <i className="ti ti-map-pin" />
                    </span>
                    Examination Findings — Body Parts for Therapy
                    <span
                      className="badge ms-1"
                      style={{
                        background: "#fff7ed",
                        color: "#c2410c",
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: 8,
                      }}
                    >
                      {bodyPoints.length}
                    </span>
                  </h6>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    style={{ borderRadius: 8 }}
                    onClick={() => setStep(1)}
                  >
                    <i className="ti ti-edit me-1" />
                    Edit on Examination
                  </button>
                </div>
                <div className="card-body px-3 px-md-4 py-3">
                  {bodyPoints.length === 0 ? (
                    <div
                      className="d-flex align-items-center gap-2 px-3 py-2"
                      style={{ background: "#f8fafc", borderRadius: 10, color: "#64748b", fontSize: 13 }}
                    >
                      <i className="ti ti-info-circle" />
                      No body parts marked in Step 1. Go back to Examination to mark areas that need therapy.
                    </div>
                  ) : (
                    <div className="d-flex flex-wrap gap-2">
                      {bodyPoints.map((bp) => (
                        <div
                          key={bp.part}
                          className="d-flex flex-column gap-1 px-3 py-2"
                          style={{
                            background: "#f8fafc",
                            borderRadius: 10,
                            borderLeft: `3px solid ${severityColor(bp.severity)}`,
                            minWidth: 160,
                            maxWidth: 280,
                          }}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: severityColor(bp.severity),
                                flexShrink: 0,
                              }}
                            />
                            <span className="fw-semibold text-dark" style={{ fontSize: 13 }}>
                              {bp.label}
                            </span>
                            <span
                              className="badge border ms-auto"
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: severityColor(bp.severity),
                                borderColor: severityColor(bp.severity),
                                background: `${severityColor(bp.severity)}14`,
                              }}
                            >
                              {bp.severity}/10
                            </span>
                          </div>
                          <div className="text-muted" style={{ fontSize: 11 }}>
                            {bp.daysSince > 0 ? `${bp.daysSince} day(s)` : "Duration not set"}
                            {bp.remark ? ` · ${bp.remark}` : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Therapy Plans */}
            <div className="col-lg-7">
              <div className="card tc-card h-100">
                <div className="card-header tc-card-head px-3 px-md-4 py-3 d-flex align-items-center justify-content-between">
                  <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                    <span className="tc-section-icon" style={{ background: "#e8f1ff", color: "#4f46e5" }}>
                      <i className="ti ti-list-check" />
                    </span>
                    Recommended Therapies
                  </h6>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    style={{ borderRadius: 8 }}
                    onClick={() => setTherapyPlans((prev) => [...prev, emptyPlan()])}
                  >
                    <i className="ti ti-plus me-1" />
                    Add Therapy
                  </button>
                </div>
                <div className="card-body">
                  <div className="d-flex flex-column gap-4">
                    {therapyPlans.map((plan, idx) => (
                      <div
                        key={idx}
                        className="p-3 p-md-4 tc-plan-block"
                        style={{ position: "relative" }}
                      >
                        {/* Remove btn */}
                        {therapyPlans.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            style={{
                              position: "absolute",
                              top: 12,
                              right: 12,
                              borderRadius: 8,
                              padding: "4px 10px",
                              fontSize: 12,
                            }}
                            onClick={() => setTherapyPlans((prev) => prev.filter((_, i) => i !== idx))}
                          >
                            <i className="ti ti-trash me-1" />Remove
                          </button>
                        )}

                        <div className="fw-semibold mb-3" style={{ color: "#6366f1", fontSize: 14 }}>
                          <i className="ti ti-leaf me-2" />
                          Therapy #{idx + 1}
                        </div>

                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
                              Therapy Service *
                            </label>
                            <select
                              className="form-select"
                              value={plan.therapyId}
                              onChange={(e) => updatePlan(idx, "therapyId", e.target.value)}
                              style={{ borderRadius: 8, fontSize: 13 }}
                            >
                              <option value="">— Select Service —</option>
                              {therapyServices.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.serviceName} {s.price ? `(₹${s.price})` : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-3">
                            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
                              Total Sessions *
                            </label>
                            <IconFormControl
                              type="number"
                              fieldLabel="quantity"
                              placeholder="Total Sessions"
                              min={1}
                              value={plan.totalSessions}
                              onChange={(e) => {
                                const val = e.target.value;
                                updatePlan(idx, "totalSessions", val === "" ? "" : parseInt(val));
                              }}
                              style={{ borderRadius: 8, fontSize: 13 }}
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
                              Fee per Session (₹) *
                            </label>
                            <IconFormControl
                              type="number"
                              fieldLabel="price"
                              placeholder="Fee per Session (₹)"
                              min={0}
                              value={plan.sessionFee}
                              onChange={(e) => {
                                const val = e.target.value;
                                updatePlan(idx, "sessionFee", val === "" ? "" : parseFloat(val));
                              }}
                              style={{ borderRadius: 8, fontSize: 13 }}
                            />
                          </div>

                          <div className="col-md-4">
                            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
                              Start Date *
                            </label>
                            <div className="input-icon-end position-relative">
                              <DatePicker
                                className="form-control datetimepicker w-100"
                                format={{ format: "DD-MM-YYYY", type: "mask" }}
                                placeholder="DD-MM-YYYY"
                                suffixIcon={null}
                                cellRender={cellRender}
                                value={plan.startDate ? dayjs(plan.startDate) : null}
                                onChange={(d: Dayjs | null) =>
                                  updatePlan(idx, "startDate", d ? d.format("YYYY-MM-DD") : "")
                                }
                                style={{ borderRadius: 8, fontSize: 13, height: 38 }}
                              />
                              <span className="input-icon-addon">
                                <i className="ti ti-calendar" />
                              </span>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
                              Session Time (Optional)
                            </label>
                            {(() => {
                              const { clock, period } = parseSessionTimeParts(plan.sessionTime);
                              return (
                                <div className="d-flex gap-2 align-items-center">
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="hh:mm"
                                    inputMode="numeric"
                                    autoComplete="off"
                                    value={clock}
                                    onChange={(e) => {
                                      let v = e.target.value.replace(/[^\d:]/g, "");
                                      if (v.length === 2 && !v.includes(":") && clock.length < 2) {
                                        v = `${v}:`;
                                      }
                                      v = v.slice(0, 5);
                                      updatePlan(idx, "sessionTime", buildSessionTimeValue(v, period));
                                    }}
                                    style={{ borderRadius: 8, fontSize: 13, flex: 1, minWidth: 0 }}
                                  />
                                  <select
                                    className="form-select"
                                    value={period}
                                    onChange={(e) =>
                                      updatePlan(
                                        idx,
                                        "sessionTime",
                                        buildSessionTimeValue(clock, e.target.value as "AM" | "PM")
                                      )
                                    }
                                    style={{ borderRadius: 8, fontSize: 13, width: 88, flexShrink: 0 }}
                                  >
                                    <option value="AM">AM</option>
                                    <option value="PM">PM</option>
                                  </select>
                                </div>
                              );
                            })()}
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
                              Schedule Type
                            </label>
                            <select
                              className="form-select"
                              value={plan.scheduleType}
                              onChange={(e) => updatePlan(idx, "scheduleType", e.target.value)}
                              style={{ borderRadius: 8, fontSize: 13 }}
                            >
                              <option value="daily">Daily</option>
                              <option value="alternate">Alternate Days</option>
                              <option value="weekly">Weekly</option>
                            </select>
                          </div>
                          <div className="col-12">
                            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
                              Notes (Optional)
                            </label>
                            <IconFormControl
                              fieldLabel="notes"
                              type="text"
                              placeholder="Any instructions..."
                              value={plan.notes}
                              onChange={(e) => updatePlan(idx, "notes", e.target.value)}
                              style={{ borderRadius: 8, fontSize: 13 }}
                            />
                          </div>
                        </div>

                        {/* Session summary */}
                        <div
                          className="mt-3 px-3 py-2 d-flex align-items-center gap-4"
                          style={{ background: "#fff", borderRadius: 8, fontSize: 13 }}
                        >
                          <span className="text-muted">Sessions: <strong>{plan.totalSessions}</strong></span>
                          <span className="text-muted">
                            Fee/Session: <strong>₹{Number(plan.sessionFee).toLocaleString()}</strong>
                          </span>
                          <span className="fw-semibold" style={{ color: "#6366f1" }}>
                            Subtotal: ₹{(Number(plan.totalSessions) * Number(plan.sessionFee)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>


            {/* Pricing */}
            <div className="col-lg-5">
              <div className="card tc-card h-100">
                <div className="card-body">
                  <h6 className="fw-bold mb-4 d-flex align-items-center gap-2">
                    <span className="tc-section-icon" style={{ background: "#e8f1ff", color: "#4f46e5" }}>
                      <i className="ti ti-receipt" />
                    </span>
                    Pricing Summary
                  </h6>

                  {/* Line items */}
                  <div className="d-flex flex-column gap-2 mb-3">
                    <div className="d-flex justify-content-between" style={{ fontSize: 13 }}>
                      <span className="text-muted">Consultation Fee</span>
                      <span className="fw-semibold">₹{consultationFee.toLocaleString()}</span>
                    </div>
                    {therapyPlans.map((p, i) => (
                      <div key={i} className="d-flex justify-content-between" style={{ fontSize: 13 }}>
                        <span className="text-muted">
                          {p.therapyName || `Therapy #${i + 1}`} ({p.totalSessions} × ₹{p.sessionFee})
                        </span>
                        <span className="fw-semibold">
                          ₹{(Number(p.totalSessions) * Number(p.sessionFee)).toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <hr className="my-1" />
                    <div className="d-flex justify-content-between" style={{ fontSize: 14 }}>
                      <span className="fw-semibold">Subtotal</span>
                      <span className="fw-bold">₹{subtotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Discount */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Discount</label>
                    <div className="d-flex gap-2">
                      <select
                        className="form-select"
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value as any)}
                        style={{ borderRadius: 8, fontSize: 13, flex: "0 0 140px" }}
                      >
                        <option value="none">No Discount</option>
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed (₹)</option>
                      </select>
                      {discountType !== "none" && (
                        <IconFormControl
                          fieldLabel="amount"
                          type="number"
                          min={0}
                          value={discountValue}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDiscountValue(val === "" ? "" : parseFloat(val));
                          }}
                          placeholder={discountType === "percentage" ? "%" : "₹"}
                          style={{ borderRadius: 8, fontSize: 13 }}
                        />
                      )}
                    </div>
                    {discountAmt > 0 && (
                      <div className="text-success mt-1" style={{ fontSize: 12 }}>
                        Discount: −₹{discountAmt.toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Final */}
                  <div
                    className="d-flex justify-content-between align-items-center px-3 py-3 mb-3"
                    style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)", borderRadius: 12 }}
                  >
                    <span className="text-white fw-semibold">Final Total</span>
                    <span className="text-white fw-bold fs-5">₹{finalTotal.toLocaleString()}</span>
                  </div>

                  {/* Payment */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Amount Paid Now (₹)</label>
                    <IconFormControl
                      fieldLabel="amount"
                      type="number"
                      min={0}
                      max={finalTotal}
                      value={amountPaid}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAmountPaid(val === "" ? "" : parseFloat(val));
                      }}
                      style={{ borderRadius: 8, fontSize: 13 }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Payment Method</label>
                    <select
                      className="form-select"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      style={{ borderRadius: 8, fontSize: 13 }}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="UPI">UPI</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Online Transfer">Online Transfer</option>
                    </select>
                  </div>

                  {/* Balance */}
                  <div className="d-flex justify-content-between" style={{ fontSize: 13 }}>
                    <span className="text-muted">Balance Due</span>
                    <span
                      className={`fw-bold ${Number(finalTotal) - Number(amountPaid) > 0 ? "text-danger" : "text-success"}`}
                    >
                      ₹{Math.max(0, Number(finalTotal) - Number(amountPaid)).toLocaleString()}
                    </span>
                  </div>

                  {/* WhatsApp */}
                  <div className="form-check form-switch mt-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="whatsappSwitch"
                      checked={whatsappNotification}
                      onChange={(e) => setWhatsappNotification(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="whatsappSwitch" style={{ fontSize: 13 }}>
                      <i className="ti ti-brand-whatsapp me-1 text-success" />
                      Send WhatsApp Notification
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12">
              {renderPrescriptionEditor()}
            </div>

            {/* Navigation */}
            <div className="col-12 d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-light"
                style={{ borderRadius: 10, padding: "10px 28px" }}
                onClick={() => setStep(1)}
              >
                <i className="ti ti-arrow-left me-1" />Back
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ borderRadius: 10, padding: "10px 28px" }}
                onClick={async () => {
                  // Auto-save Draft data before preview
                  if (id && consultationData?.status === "Draft") {
                    try {
                      await apiPut<any>(`/api/consultations/${id}`, {
                        examinationNotes: generalNotes,
                        bodyPoints,
                        medicines,
                        advice,
                        attachments,
                        status: "Draft",
                        therapyPlans: therapyPlans.map((p) => ({
                          ...p,
                          totalSessions: parseInt(String(p.totalSessions)) || 1,
                          sessionFee: parseFloat(String(p.sessionFee)) || 0,
                        })),
                        consultationFee,
                        discountType,
                        discountValue: Number(discountValue) || 0,
                        amountPaid: Number(amountPaid) || 0,
                        paymentMethod,
                        whatsappNotification,
                      });
                    } catch (err) {
                      // Silently continue to preview
                    }
                  }
                  setStep(3);
                }}
              >
                Preview <i className="ti ti-arrow-right ms-1" />
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: PREVIEW & CONFIRM ───────────────────────── */}
        {step === 3 && (
          <div className="row g-4">
            <div className="col-12">
              <div
                className="card tc-card"
                id="consultation-preview"
              >
                {/* ═══ PRINT PAGE 1: Patient + Examination + Body diagrams ═══ */}
                <div className="consult-print-page">
                {/* Header */}
                <div
                  className="card-header tc-gradient-head text-white"
                  style={{
                    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                    borderRadius: "14px 14px 0 0",
                    padding: "24px 28px",
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h4 className="mb-1 fw-bold text-white">Consultation Plan</h4>
                      <div style={{ opacity: 0.85, fontSize: 14 }}>
                        {selectedAppointment?.patient?.firstName} {selectedAppointment?.patient?.lastName} &nbsp;|&nbsp; Dr.{" "}
                        {selectedAppointment?.doctor?.fullName}
                      </div>
                      <div style={{ opacity: 0.7, fontSize: 12, marginTop: 4 }}>
                        {selectedAppointment?.appointmentCode && (
                          <span className="me-2">Appt: {selectedAppointment.appointmentCode}</span>
                        )}
                        {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-light btn-sm"
                      style={{ borderRadius: 8 }}
                      onClick={handleConsultPrint}
                    >
                      <i className="ti ti-printer me-1" />Print / Download
                    </button>
                  </div>
                </div>

                <div className="card-body p-4">
                  {/* Examination Summary */}
                  <div className="mb-4">
                      <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                        <i className="ti ti-stethoscope text-primary" />
                        Examination Findings
                      </h6>
                      {bodyPoints.length > 0 ? (
                        <div className="row g-2 mb-3">
                          {bodyPoints.map((bp) => (
                            <div key={bp.part} className="col-md-6 col-lg-4">
                              <div
                                className="p-3 h-100"
                                style={{
                                  borderRadius: 10,
                                  border: `2px solid ${severityColor(bp.severity)}40`,
                                  background: `${severityColor(bp.severity)}08`,
                                }}
                              >
                                <div className="d-flex align-items-center gap-2 mb-1">
                                  <div
                                    style={{
                                      width: 8, height: 8, borderRadius: "50%",
                                      background: severityColor(bp.severity), flexShrink: 0,
                                    }}
                                  />
                                  <span className="fw-semibold" style={{ fontSize: 13 }}>{bp.label}</span>
                                  <span
                                    className="ms-auto badge"
                                    style={{
                                      background: `${severityColor(bp.severity)}20`,
                                      color: severityColor(bp.severity),
                                      borderRadius: 6,
                                      fontSize: 11,
                                    }}
                                  >
                                    {bp.severity}/10
                                  </span>
                                </div>
                                {bp.daysSince > 0 && (
                                  <div className="text-muted" style={{ fontSize: 11 }}>
                                    Since {bp.daysSince} days
                                  </div>
                                )}
                                {bp.remark && (
                                  <div style={{ fontSize: 12, marginTop: 4, color: "#475569" }}>{bp.remark}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-muted mb-3" style={{ fontSize: 13 }}>
                          No body parts marked during examination.
                        </div>
                      )}
                      {generalNotes && (
                        <div
                          className="p-3 mb-3"
                          style={{ background: "#f8fafc", borderRadius: 10, fontSize: 13 }}
                        >
                          <strong>General Notes:</strong> {generalNotes}
                        </div>
                      )}

                      {/* Body diagrams — front / back based on selected parts */}
                      {bodyPoints.length > 0 && (examHasFront || examHasBack) && (
                        <div className="mt-3 consult-body-diagrams-section">
                          <h6 className="fw-bold mb-2 d-flex align-items-center gap-2" style={{ fontSize: 14 }}>
                            <i className="ti ti-body-scan text-primary" />
                            Body Diagram
                          </h6>
                          <div
                            className={
                              examHasFront && examHasBack
                                ? "consult-body-diagrams-pair"
                                : "d-flex justify-content-center"
                            }
                          >
                            {examHasFront && (
                              <div
                                className={
                                  examHasBack
                                    ? "consult-body-diagram-item"
                                    : "consult-body-diagram-single"
                                }
                                style={
                                  examHasBack
                                    ? undefined
                                    : { width: "100%", maxWidth: 320 }
                                }
                              >
                                <BodyDiagram3D
                                  parts={BODY_PARTS}
                                  marks={bodyPoints}
                                  interactive={false}
                                  severityColor={severityColor}
                                  height={examHasBack ? 240 : 280}
                                  lockedView="front"
                                />
                              </div>
                            )}
                            {examHasBack && (
                              <div
                                className={
                                  examHasFront
                                    ? "consult-body-diagram-item"
                                    : "consult-body-diagram-single"
                                }
                                style={
                                  examHasFront
                                    ? undefined
                                    : { width: "100%", maxWidth: 320 }
                                }
                              >
                                <BodyDiagram3D
                                  parts={BODY_PARTS}
                                  marks={bodyPoints}
                                  interactive={false}
                                  severityColor={severityColor}
                                  height={examHasFront ? 240 : 280}
                                  lockedView="back"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
                </div>{/* end print page 1 */}

                {/* ═══ PRINT PAGE 2: Therapy plan & sessions ═══ */}
                <div className="consult-print-page">
                <div className="card-body p-4 pt-4">
                  {/* Therapy Plans Table */}
                  <div className="mb-5">
                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                      <i className="ti ti-calendar-plus text-primary" />
                      Therapy Plan & Sessions
                    </h6>
                    <div className="table-responsive">
                      <table className="table align-middle" style={{ fontSize: 13 }}>
                        <thead style={{ background: "#f8fafc" }}>
                          <tr>
                            <th className="fw-semibold border-0 py-2">#</th>
                            <th className="fw-semibold border-0 py-2">Therapy</th>
                            <th className="fw-semibold border-0 py-2">Sessions</th>
                            <th className="fw-semibold border-0 py-2">Start Date</th>
                            <th className="fw-semibold border-0 py-2">Schedule</th>
                            <th className="fw-semibold border-0 py-2">Fee/Session</th>
                            <th className="fw-semibold border-0 py-2">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {therapyPlans.map((p, i) => (
                            <tr key={i}>
                              <td>{i + 1}</td>
                              <td className="fw-semibold">{p.therapyName || "—"}</td>
                              <td>{p.totalSessions}</td>
                              <td>
                                {p.startDate
                                  ? new Date(p.startDate).toLocaleDateString("en-GB")
                                  : "—"}
                              </td>
                              <td style={{ textTransform: "capitalize" }}>{p.scheduleType}</td>
                              <td>₹{Number(p.sessionFee).toLocaleString()}</td>
                              <td className="fw-semibold" style={{ color: "#6366f1" }}>
                                ₹{(Number(p.totalSessions) * Number(p.sessionFee)).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Session Schedule Details */}
                  {therapyPlans.length > 0 && (
                    <div className="mb-2">
                      <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                        <i className="ti ti-calendar-event text-primary" />
                        Daily Session Schedule
                      </h6>
                      {therapyPlans.map((plan, pIdx) => {
                        const sessions = Number(plan.totalSessions) || 0;
                        const startDt = plan.startDate ? new Date(plan.startDate) : null;
                        const scheduleEntries: { day: number; date: Date }[] = [];
                        if (startDt && sessions > 0) {
                          let current = new Date(startDt);
                          for (let s = 0; s < sessions; s++) {
                            current = getNextAvailableDate(current, availability);
                            scheduleEntries.push({ day: s + 1, date: new Date(current) });
                            if (plan.scheduleType === "daily") {
                              current.setDate(current.getDate() + 1);
                            } else if (plan.scheduleType === "alternate") {
                              current.setDate(current.getDate() + 1);
                              const skipped = getNextAvailableDate(current, availability);
                              current = new Date(skipped);
                              current.setDate(current.getDate() + 1);
                            } else if (plan.scheduleType === "weekly") {
                              current.setDate(current.getDate() + 7);
                            } else {
                              current.setDate(current.getDate() + 1);
                            }
                          }
                        }
                        const totalDays = scheduleEntries.length >= 2
                          ? Math.ceil((scheduleEntries[scheduleEntries.length - 1].date.getTime() - scheduleEntries[0].date.getTime()) / (1000 * 60 * 60 * 24)) + 1
                          : sessions;
                        return (
                          <div key={pIdx} className="mb-3">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <span className="badge" style={{ background: '#6366f120', color: '#6366f1', borderRadius: 6, fontSize: 12, padding: '4px 10px' }}>
                                {plan.therapyName || `Plan ${pIdx + 1}`}
                              </span>
                              <span className="text-muted" style={{ fontSize: 12 }}>
                                {sessions} sessions over {totalDays} days ({plan.scheduleType})
                              </span>
                            </div>
                            {scheduleEntries.length > 0 ? (
                              <div className="table-responsive">
                                <table className="table table-sm align-middle mb-0" style={{ fontSize: 12 }}>
                                  <thead style={{ background: '#f8fafc' }}>
                                    <tr>
                                      <th className="fw-semibold border-0 py-2" style={{ width: 60 }}>Day</th>
                                      <th className="fw-semibold border-0 py-2">Date</th>
                                      <th className="fw-semibold border-0 py-2">Day of Week</th>
                                      <th className="fw-semibold border-0 py-2">Time</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {scheduleEntries.map((entry) => (
                                      <tr key={entry.day}>
                                        <td>
                                          <span className="badge bg-light text-dark" style={{ borderRadius: 6, fontSize: 11 }}>Day {entry.day}</span>
                                        </td>
                                        <td className="fw-semibold">
                                          {entry.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="text-muted">
                                          {entry.date.toLocaleDateString('en-US', { weekday: 'long' })}
                                        </td>
                                        <td>{plan.sessionTime || 'Any available'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-muted" style={{ fontSize: 12 }}>Start date not set — schedule will be generated upon confirmation.</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                </div>{/* end print page 2 */}

                {/* ═══ PRINT PAGE 3: Payments ═══ */}
                <div className="consult-print-page">
                <div className="card-body p-4 pt-4">
                  <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                    <i className="ti ti-receipt text-primary" />
                    Payment Details
                  </h6>
                  {/* Pricing Summary */}
                  <div className="row">
                    <div className="col-md-7 col-lg-5">
                      <div
                        className="p-4"
                        style={{ background: "#f8fafc", borderRadius: 14, border: "1px solid #e2e8f0" }}
                      >
                        <h6 className="fw-bold mb-3">Invoice Summary</h6>
                        <div className="d-flex flex-column gap-2" style={{ fontSize: 13 }}>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Consultation Fee</span>
                            <span>₹{consultationFee.toLocaleString()}</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Therapy Total</span>
                            <span>₹{therapyTotal.toLocaleString()}</span>
                          </div>
                          {discountAmt > 0 && (
                            <div className="d-flex justify-content-between text-success">
                              <span>Discount ({discountType === "percentage" ? `${discountValue}%` : `₹${discountValue}`})</span>
                              <span>−₹{discountAmt.toFixed(2)}</span>
                            </div>
                          )}
                          <hr className="my-1" />
                          <div className="d-flex justify-content-between fw-bold fs-6">
                            <span>Total</span>
                            <span style={{ color: "#6366f1" }}>₹{finalTotal.toLocaleString()}</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Amount Paid ({paymentMethod})</span>
                            <span className="text-success fw-semibold">₹{Number(amountPaid).toLocaleString()}</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Balance Due</span>
                            <span
                              className={`fw-bold ${Number(finalTotal) - Number(amountPaid) > 0 ? "text-danger" : "text-success"}`}
                            >
                              ₹{Math.max(0, Number(finalTotal) - Number(amountPaid)).toLocaleString()}
                            </span>
                          </div>
                          <div className="mt-1">
                            <span
                              className={`badge ${
                                Number(amountPaid) >= Number(finalTotal) && Number(finalTotal) > 0
                                  ? "bg-success-subtle text-success"
                                  : Number(amountPaid) > 0
                                  ? "bg-warning-subtle text-warning"
                                  : "bg-danger-subtle text-danger"
                              }`}
                              style={{ borderRadius: 6, padding: "4px 10px" }}
                            >
                              {Number(amountPaid) >= Number(finalTotal) && Number(finalTotal) > 0
                                ? "Paid"
                                : Number(amountPaid) > 0
                                ? "Partial Paid"
                                : "Unpaid"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sessions to be created */}
                  <div className="mt-4 p-3" style={{ background: "#f0fdf4", borderRadius: 10, border: "1px solid #bbf7d0" }}>
                    <div className="d-flex align-items-center gap-2">
                      <i className="ti ti-calendar-check text-success" />
                      <strong className="text-success" style={{ fontSize: 14 }}>
                        {therapyPlans.reduce((s, p) => s + Number(p.totalSessions), 0)} Appointment Sessions
                      </strong>
                      <span className="text-muted" style={{ fontSize: 13 }}>
                        will be created and linked to parent appointment{" "}
                        <strong>{selectedAppointment?.appointmentCode}</strong>
                      </span>
                    </div>
                  </div>

                  {whatsappNotification && (
                    <div className="mt-3 p-3" style={{ background: "#f0fdf4", borderRadius: 10, border: "1px solid #bbf7d0" }}>
                      <i className="ti ti-brand-whatsapp text-success me-2" />
                      <span style={{ fontSize: 13 }}>
                        WhatsApp notification will be sent to{" "}
                        <strong>{selectedAppointment?.patient?.phone || "patient"}</strong>
                      </span>
                    </div>
                  )}
                </div>
                </div>{/* end print page 3 */}
              </div>
            </div>

            {/* Navigation */}
            <div className="col-12 d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-light"
                style={{ borderRadius: 10, padding: "10px 28px" }}
                onClick={() => setStep(2)}
              >
                <i className="ti ti-arrow-left me-1" />Back
              </button>
              <button
                type="button"
                className="btn btn-success"
                style={{ borderRadius: 10, padding: "10px 32px", fontWeight: 600 }}
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="ti ti-check me-2" />
                    {isEditing ? "Save Changes" : "Confirm & Create Sessions"}
                  </>
                )}
              </button>
            </div>

            <ConsultationPreviewPrint
              clinic={getClinicForPrint()}
              patient={selectedAppointment?.patient}
              doctor={selectedAppointment?.doctor}
              appointmentCode={selectedAppointment?.appointmentCode}
              bodyParts={BODY_PARTS}
              bodyPoints={bodyPoints}
              examHasFront={examHasFront}
              examHasBack={examHasBack}
              examinationNotes={generalNotes}
              therapyPlans={therapyPlans}
              consultationFee={consultationFee}
              therapyTotal={therapyTotal}
              discountType={discountType}
              discountValue={discountValue}
              discountAmt={discountAmt}
              finalTotal={finalTotal}
              medicines={medicines}
              advice={advice}
              severityColor={severityColor}
              availability={availability}
            />
          </div>
        )}
        <style>{`
          .therapy-consult-page .tc-page-icon {
            width: 48px; height: 48px; border-radius: 12px;
            background: rgba(79,70,229,0.12); color: #4f46e5;
            display: inline-flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0;
          }
          .therapy-consult-page .tc-card,
          .therapy-consult-page .card {
            border: none !important;
            border-radius: 14px !important;
            box-shadow: 0 4px 18px rgba(15, 23, 42, 0.08) !important;
            background: #fff;
          }
          .therapy-consult-page .tc-card-head,
          .therapy-consult-page .card-header:not(.tc-gradient-head) {
            border-bottom: 1px solid rgba(15,23,42,0.05) !important;
            background: #f8fafc !important;
            border-radius: 14px 14px 0 0 !important;
          }
          .therapy-consult-page .tc-section-icon {
            width: 32px; height: 32px; border-radius: 9px;
            display: inline-flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0;
          }
          .therapy-consult-page .tc-soft-panel {
            background: #f8fafc !important;
            border: none !important;
            box-shadow: 0 1px 4px rgba(15,23,42,0.05);
          }
          .therapy-consult-page .tc-pending-card {
            box-shadow: 0 8px 24px rgba(79,70,229,0.14) !important;
          }
          .therapy-consult-page .tc-plan-block {
            background: #f8fafc !important;
            border: none !important;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(15,23,42,0.06);
          }
          .therapy-consult-page .btn-cancel-danger {
            border: 1px solid #b91c1c !important;
            color: #b91c1c !important;
            background: #fff !important;
          }
          .therapy-consult-page .btn-cancel-danger:hover {
            background: #fef2f2 !important;
            color: #991b1b !important;
            border-color: #991b1b !important;
          }
          .therapy-consult-page .row.g-4 { --bs-gutter-y: 0.85rem; --bs-gutter-x: 0.85rem; }
          .therapy-consult-page .card-body { padding-top: 1rem; padding-bottom: 1rem; }

          .consult-body-diagrams-pair {
            display: flex;
            flex-direction: row;
            flex-wrap: nowrap;
            gap: 12px;
            align-items: stretch;
          }
          .consult-body-diagram-item {
            flex: 1 1 0;
            min-width: 0;
            max-width: 50%;
          }
          .consult-body-diagram-single {
            max-width: 320px;
            width: 100%;
            margin-left: auto;
            margin-right: auto;
          }
        `}</style>
      </div>
    </div>
  );
};

export default ConsultationForm;
