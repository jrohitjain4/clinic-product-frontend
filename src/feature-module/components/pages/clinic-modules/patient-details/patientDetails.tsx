import { Link, useParams } from "react-router";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes } from "../../../../routes/all_routes";
import { useState, useMemo, useEffect } from "react";
import SearchInput from "../../../../../core/common/dataTable/dataTableSearch";
import Modals from "./modals/modals";
import { useClinicPatient } from "../../../../../core/hooks/useClinicPatient";
import { useClinicAppointments } from "../../../../../core/hooks/useClinicAppointments";
import { useClinicInvoices } from "../../../../../core/hooks/useClinicInvoices";
import { useLabBookings } from "../../../../../core/hooks/useLabBookings";
import { usePrescriptions } from "../../../../../core/hooks/usePrescriptions";
import { apiUrl } from "../../../../../core/config/api";
import IpdViewDetailsModal from "../../ipd-modules/IpdViewDetailsModal";
import dayjs from "dayjs";
import {
  formatPatientDateLong,
  statusToLabel,
} from "../../../../../core/utils/patientForm";

type MainTab = "overview" | "opd" | "ipd" | "therapy";
type ModuleSubTab = "overview" | "visits" | "invoices" | "prescriptions";

const statusBadgeClass = (status: string) => {
  switch (status) {
    case "Checked Out":
      return "badge-soft-info text-info";
    case "Checked In":
      return "badge-soft-warning text-warning";
    case "Confirmed":
      return "badge-soft-success text-success";
    case "Cancelled":
      return "badge-soft-danger text-danger";
    default:
      return "badge-soft-primary text-primary";
  }
};

const paymentStatusBadgeClass = (status: string) => {
  const s = status ? status.toLowerCase() : "";
  if (s.includes("paid") && !s.includes("unpaid") && !s.includes("partial")) {
    return "badge-soft-success border-success text-success";
  }
  if (s.includes("unpaid")) return "badge-soft-danger border-danger text-danger";
  if (s.includes("partial") || s.includes("part") || s.includes("pending")) {
    return "badge-soft-warning border-warning text-warning";
  }
  return "badge-soft-primary border-primary text-primary";
};

const displayPaymentStatus = (status: string) => {
  const s = status ? status.trim().toUpperCase() : "";
  if (s === "PENDING" || s === "PARTIAL") return "PARTIAL PAYMENT";
  return s || "—";
};

const typeBadgeClass = (type: string) => {
  if (type.includes("Pharmacy")) return "badge-soft-warning border-warning text-warning";
  if (type.includes("Pathlab") || type.includes("Diagnostic")) return "badge-soft-info border-info text-info";
  if (type.includes("Therapy")) return "badge-soft-danger border-danger text-danger";
  if (type.includes("IPD")) return "badge-soft-secondary border-secondary text-secondary";
  return "badge-soft-primary border-primary text-primary";
};

const formatMoney = (amount: number) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const ProfileField = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div className="mb-3">
    <p className="mb-0 fs-12 text-muted">{label}</p>
    <h6 className="fs-14 fw-bold mb-0 text-dark text-break">{value || "—"}</h6>
  </div>
);

const StatCard = ({
  icon,
  label,
  value,
  tone = "primary",
}: {
  icon: string;
  label: string;
  value: string | number;
  tone?: string;
}) => (
  <div className="card border-0 shadow-sm h-100">
    <div className="card-body d-flex align-items-center gap-3">
      <span className={`avatar avatar-md rounded-circle bg-${tone}-subtle text-${tone} flex-shrink-0`}>
        <i className={`ti ${icon} fs-18`} />
      </span>
      <div>
        <p className="mb-0 fs-12 text-muted">{label}</p>
        <h5 className="mb-0 fw-bold">{value}</h5>
      </div>
    </div>
  </div>
);

const EmptyRow = ({ cols, text }: { cols: number; text: string }) => (
  <tr>
    <td colSpan={cols} className="text-center py-4 text-muted">
      {text}
    </td>
  </tr>
);

const PatientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { patient, loading, error } = useClinicPatient(id);
  const { appointments, loading: apptLoading } = useClinicAppointments(
    id ? { patientId: id } : undefined
  );
  const { bookings, loading: labLoading } = useLabBookings();
  const { invoices, loading: invLoading } = useClinicInvoices();
  const { prescriptions, loading: rxLoading } = usePrescriptions();

  const [mainTab, setMainTab] = useState<MainTab>("overview");
  const [moduleSubTab, setModuleSubTab] = useState<ModuleSubTab>("overview");
  const [searchText, setSearchText] = useState("");

  const [ipdAdmissions, setIpdAdmissions] = useState<any[]>([]);
  const [ipdPrescriptions, setIpdPrescriptions] = useState<any[]>([]);
  const [ipdInvoicesApi, setIpdInvoicesApi] = useState<any[]>([]);
  const [therapyConsultations, setTherapyConsultations] = useState<any[]>([]);
  const [showIpdModal, setShowIpdModal] = useState(false);
  const [selectedIpdAdmission, setSelectedIpdAdmission] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    const load = async () => {
      try {
        const [admRes, rxRes, invRes, consultRes] = await Promise.all([
          fetch(apiUrl("/api/ipd/admissions"), { headers }),
          fetch(apiUrl(`/api/ipd/prescriptions?patientId=${id}`), { headers }),
          fetch(apiUrl(`/api/ipd/invoices?patientId=${id}`), { headers }),
          fetch(apiUrl(`/api/consultations?patientId=${id}`), { headers }),
        ]);

        if (admRes.ok) {
          const data = await admRes.json();
          if (Array.isArray(data)) {
            setIpdAdmissions(
              data.filter((adm: any) => adm.patientId === id || adm.patient?.id === id)
            );
          }
        }
        if (rxRes.ok) {
          const data = await rxRes.json();
          setIpdPrescriptions(Array.isArray(data) ? data : []);
        }
        if (invRes.ok) {
          const data = await invRes.json();
          setIpdInvoicesApi(Array.isArray(data) ? data : []);
        }
        if (consultRes.ok) {
          const data = await consultRes.json();
          setTherapyConsultations(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Error loading patient module data:", err);
      }
    };

    load();
  }, [id]);

  useEffect(() => {
    setModuleSubTab("overview");
    setSearchText("");
  }, [mainTab]);

  const visits = useMemo(() => {
    const appts = appointments.map((a) => {
      const isTherapy = a.appointmentType === "therapy";
      return {
        id: a.id,
        scheduledAt: a.scheduledAt,
        doctorName: a.doctorName || a.doctor?.fullName || "—",
        doctorDesignation: a.doctor?.designation?.name || "Doctor",
        doctorImage: a.doctor?.profileImage || "assets/img/doctor-placeholder.png",
        department: isTherapy
          ? "Therapy"
          : a.department?.name || a.doctor?.department?.name || "General",
        mode:
          a.mode === "Online" ||
          a.mode === "Clinic Landing" ||
          a.mode === "Clinic Landing page" ||
          (a as any).appointmentType === "Online Booking"
            ? "Online"
            : "Walk In",
        status: a.status,
        module: isTherapy ? ("therapy" as const) : ("opd" as const),
        type: isTherapy ? "Therapy" : "OPD / Clinic",
        link: isTherapy ? "/therapy-appointments" : `/appointments/appointment-details/${a.id}`,
        raw: a,
      };
    });

    const diag = (bookings || [])
      .filter((b) => b.patientId === id)
      .map((b) => ({
        id: b.id,
        scheduledAt: b.scheduledAt,
        doctorName: b.test?.name || "Diagnostic Test",
        doctorDesignation: b.test?.testCode ? `Test Code: ${b.test.testCode}` : "Diagnostic Test",
        doctorImage: "assets/img/icons/lab-placeholder.png",
        department: "Diagnostic",
        mode: "Walk In",
        status: b.status,
        module: "opd" as const,
        type: "Diagnostic",
        link: "/pathlab/bookings",
        raw: b,
      }));

    const ipd = (ipdAdmissions || []).map((adm) => ({
      id: adm.id,
      scheduledAt: adm.admissionDate,
      doctorName: adm.doctor?.fullName ? `Dr. ${adm.doctor.fullName}` : "Primary Doctor",
      doctorDesignation: adm.ward?.wardName ? `Ward: ${adm.ward.wardName}` : "IPD Inpatient",
      doctorImage: adm.doctor?.profileImage || "assets/img/doctor-placeholder.png",
      department: "IPD Admission",
      mode: "Inpatient",
      status: adm.status === "Admitted" ? "Active Inpatient" : "Discharged",
      module: "ipd" as const,
      type: "IPD Admission",
      link: "/ipd/admissions",
      raw: adm,
    }));

    return [...appts, ...diag, ...ipd].sort(
      (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
    );
  }, [appointments, bookings, ipdAdmissions, id]);

  const classifyInvoiceType = (inv: any) => {
    const isPharmacy = inv.otherInfo === "Pharmacy" || inv.invoiceCode?.startsWith("PH-");
    const isPathlab =
      inv.invoiceCode?.startsWith("INV-AUTO-LB") || inv.otherInfo === "Pathlab";
    const isTherapy =
      inv.appointment?.appointmentType === "therapy" ||
      inv.consultationId != null ||
      inv.otherInfo === "Therapy";
    if (isPharmacy) return { type: "Pharmacy", module: "opd" as const };
    if (isPathlab) return { type: "Pathlab", module: "opd" as const };
    if (isTherapy) return { type: "Therapy", module: "therapy" as const };
    return { type: "OPD / Clinic", module: "opd" as const };
  };

  const allInvoices = useMemo(() => {
    const regular = invoices
      .filter((inv) => inv.patientId === id)
      .map((inv) => {
        const { type, module } = classifyInvoiceType(inv);
        return {
          id: inv.id,
          invoiceCode: inv.invoiceCode,
          type,
          module,
          description: inv.items?.[0]?.description || "Invoice Details",
          date: inv.invoiceDate,
          paymentMethod: inv.paymentMethod || "—",
          amount: inv.totalAmount,
          paymentStatus: inv.paymentStatus,
          isIpd: false,
          raw: inv,
        };
      });

    const fromIpdApi = (ipdInvoicesApi || []).map((inv) => ({
      id: inv.id,
      invoiceCode: inv.invoiceCode || inv.billNo || "IPD Invoice",
      type: "IPD",
      module: "ipd" as const,
      description: inv.items?.[0]?.description || inv.notes || "IPD Billing",
      date: inv.invoiceDate || inv.createdAt,
      paymentMethod: inv.paymentMethod || "—",
      amount: inv.totalAmount || inv.grandTotal || 0,
      paymentStatus: inv.paymentStatus || "Pending",
      isIpd: true,
      raw: inv,
    }));

    const fromAdmissions = (ipdAdmissions || [])
      .filter((adm) => !fromIpdApi.some((i) => i.raw?.admissionId === adm.id))
      .map((adm) => {
        const doctorName = adm.doctor?.fullName ? `Dr. ${adm.doctor.fullName}` : "Doctor";
        const wardName = adm.ward?.wardName || "Ward";
        return {
          id: adm.id,
          invoiceCode: adm.admissionCode || "IPD Stay",
          type: "IPD Admission",
          module: "ipd" as const,
          description: `IPD Stay — Ward: ${wardName} (${doctorName})`,
          date: adm.admissionDate,
          paymentMethod: adm.paymentMethod || "Cash",
          amount: adm.totalAmount || adm.totalBilled || 0,
          paymentStatus: adm.paymentStatus || (adm.dueAmount > 0 ? "Partial" : "Paid"),
          isIpd: true,
          raw: adm,
        };
      });

    return [...regular, ...fromIpdApi, ...fromAdmissions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [invoices, ipdAdmissions, ipdInvoicesApi, id]);

  const allPrescriptions = useMemo(() => {
    const clinicRx = (prescriptions || [])
      .filter((p) => p.patientId === id || p.patient?.id === id)
      .map((p) => {
        const isTherapy =
          p.appointment?.appointmentType === "therapy" ||
          p.otherInfo === "Therapy" ||
          p.source === "therapy";
        return {
          id: p.id,
          code: p.prescriptionCode || `#PRES-${String(p.id).slice(-4)}`,
          doctorName: p.doctor?.fullName
            ? p.doctor.fullName.startsWith("Dr.")
              ? p.doctor.fullName
              : `Dr. ${p.doctor.fullName}`
            : p.doctorName || "Doctor",
          doctorImage: p.doctor?.profileImage || "assets/img/doctor-placeholder.png",
          role: p.doctor?.designation?.name || "Practitioner",
          date: p.createdAt || p.prescribedAt,
          module: isTherapy ? ("therapy" as const) : ("opd" as const),
          type: isTherapy ? "Therapy" : "OPD",
          medicinesCount: Array.isArray(p.medicines)
            ? p.medicines.length
            : Array.isArray(p.items)
              ? p.items.length
              : 0,
          raw: p,
        };
      });

    const therapyRx = (therapyConsultations || [])
      .filter((c) => {
        const hasMeds =
          (Array.isArray(c.medicines) && c.medicines.length > 0) ||
          (Array.isArray(c.prescription) && c.prescription.length > 0) ||
          !!c.advice;
        return hasMeds;
      })
      .map((c) => ({
        id: c.id,
        code: c.consultationCode || `#THR-${String(c.id).slice(-4)}`,
        doctorName: c.doctor?.fullName
          ? c.doctor.fullName.startsWith("Dr.")
            ? c.doctor.fullName
            : `Dr. ${c.doctor.fullName}`
          : "Therapist",
        doctorImage: c.doctor?.profileImage || "assets/img/doctor-placeholder.png",
        role: c.doctor?.designation?.name || "Therapy",
        date: c.createdAt || c.updatedAt,
        module: "therapy" as const,
        type: "Therapy Plan",
        medicinesCount: Array.isArray(c.medicines)
          ? c.medicines.length
          : Array.isArray(c.prescription)
            ? c.prescription.length
            : 0,
        raw: c,
      }));

    const ipdRx = (ipdPrescriptions || []).map((p) => ({
      id: p.id,
      code: p.prescriptionCode || `#IPD-RX-${String(p.id).slice(-4)}`,
      doctorName: p.doctor?.fullName
        ? p.doctor.fullName.startsWith("Dr.")
          ? p.doctor.fullName
          : `Dr. ${p.doctor.fullName}`
        : "Doctor",
      doctorImage: p.doctor?.profileImage || "assets/img/doctor-placeholder.png",
      role: p.doctor?.designation?.name || "IPD",
      date: p.createdAt || p.prescribedAt,
      module: "ipd" as const,
      type: "IPD",
      medicinesCount: Array.isArray(p.medicines)
        ? p.medicines.length
        : Array.isArray(p.items)
          ? p.items.length
          : 0,
      raw: p,
    }));

    // Avoid duplicate therapy rows if also present in clinic prescriptions
    const therapyIds = new Set(clinicRx.filter((r) => r.module === "therapy").map((r) => r.id));
    const uniqueTherapy = therapyRx.filter((r) => !therapyIds.has(r.id));

    return [...clinicRx, ...uniqueTherapy, ...ipdRx].sort(
      (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    );
  }, [prescriptions, therapyConsultations, ipdPrescriptions, id]);

  const doctorsVisited = useMemo(() => {
    const map = new Map<
      string,
      { name: string; image: string; role: string; modules: Set<string>; visits: number; lastVisit: string }
    >();

    visits.forEach((v) => {
      if (v.type === "Diagnostic") return;
      const key = v.doctorName.trim().toLowerCase();
      if (!key || key === "—") return;
      const existing = map.get(key);
      if (existing) {
        existing.visits += 1;
        existing.modules.add(v.module);
        if (new Date(v.scheduledAt) > new Date(existing.lastVisit)) {
          existing.lastVisit = v.scheduledAt;
        }
      } else {
        map.set(key, {
          name: v.doctorName,
          image: v.doctorImage,
          role: v.doctorDesignation,
          modules: new Set([v.module]),
          visits: 1,
          lastVisit: v.scheduledAt,
        });
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime()
    );
  }, [visits]);

  const filterByModule = <T extends { module: string }>(items: T[], module: MainTab) =>
    module === "overview" ? items : items.filter((i) => i.module === module);

  const moduleVisits = useMemo(
    () => filterByModule(visits, mainTab === "overview" ? "overview" : mainTab),
    [visits, mainTab]
  );
  const moduleInvoices = useMemo(
    () => filterByModule(allInvoices, mainTab === "overview" ? "overview" : mainTab),
    [allInvoices, mainTab]
  );
  const modulePrescriptions = useMemo(
    () => filterByModule(allPrescriptions, mainTab === "overview" ? "overview" : mainTab),
    [allPrescriptions, mainTab]
  );

  const moduleTransactions = useMemo(
    () =>
      moduleInvoices.filter((inv) => {
        const s = (inv.paymentStatus || "").toLowerCase();
        return s.includes("paid") || s.includes("completed");
      }),
    [moduleInvoices]
  );

  const searchMatch = (text: string) =>
    !searchText || text.toLowerCase().includes(searchText.toLowerCase());

  const filteredVisits = useMemo(
    () =>
      moduleVisits.filter((v) =>
        searchMatch(
          `${v.doctorName} ${v.doctorDesignation} ${v.department} ${v.status} ${v.type}`
        )
      ),
    [moduleVisits, searchText]
  );

  const filteredInvoices = useMemo(
    () =>
      moduleInvoices.filter((inv) =>
        searchMatch(`${inv.invoiceCode} ${inv.type} ${inv.description} ${inv.paymentStatus}`)
      ),
    [moduleInvoices, searchText]
  );

  const filteredPrescriptions = useMemo(
    () =>
      modulePrescriptions.filter((rx) =>
        searchMatch(`${rx.code} ${rx.doctorName} ${rx.type} ${rx.role}`)
      ),
    [modulePrescriptions, searchText]
  );

  const isInvalidImage = (img?: string | null) =>
    !img || img.trim() === "" || img.includes("300x300") || img.includes("placeholder");

  const profileSrc = isInvalidImage(patient?.profileImage)
    ? "assets/img/patient-placeholder.png"
    : patient?.profileImage || "assets/img/patient-placeholder.png";

  const displayName =
    patient?.fullName || (patient ? `${patient.firstName} ${patient.lastName}` : "Patient");
  const statusLabel = patient ? statusToLabel(patient.status) : "";

  const openIpd = (adm: any) => {
    setSelectedIpdAdmission(adm);
    setShowIpdModal(true);
  };

  const renderVisitsTable = (rows: typeof filteredVisits, loadingRows: boolean) => (
    <div className="table-responsive">
      <table className="table table-nowrap">
        <thead className="thead-light">
          <tr>
            <th>Doctor / Service</th>
            <th>Department</th>
            <th>Date & Time</th>
            <th>Mode</th>
            <th>Type</th>
            <th>Status</th>
            <th className="text-end">Action</th>
          </tr>
        </thead>
        <tbody>
          {loadingRows ? (
            <tr>
              <td colSpan={7} className="text-center py-4">
                <span className="spinner-border spinner-border-sm text-primary" role="status" />
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <EmptyRow cols={7} text="No visits found" />
          ) : (
            rows.map((a) => (
              <tr key={`${a.module}-${a.id}`}>
                <td>
                  <div className="d-flex align-items-center">
                    <span className="avatar avatar-sm me-2">
                      <ImageWithBasePath
                        src={a.doctorImage}
                        alt={a.doctorName}
                        className="rounded-circle"
                      />
                    </span>
                    <div>
                      <h6 className="fs-14 fw-bold mb-0">{a.doctorName}</h6>
                      <p className="mb-0 fs-12 text-muted">{a.doctorDesignation}</p>
                    </div>
                  </div>
                </td>
                <td className="text-dark">{a.department}</td>
                <td className="text-dark">
                  {a.scheduledAt ? dayjs(a.scheduledAt).format("DD MMM YYYY, hh:mm A") : "—"}
                </td>
                <td className="text-dark">{a.mode}</td>
                <td>
                  <span className={`badge border ${typeBadgeClass(a.type)} fs-11`}>{a.type}</span>
                </td>
                <td>
                  <span className={`badge ${statusBadgeClass(a.status)}`}>{a.status}</span>
                </td>
                <td className="text-end">
                  {a.module === "ipd" ? (
                    <button
                      type="button"
                      className="btn btn-icon btn-sm bg-primary-subtle text-primary rounded-circle"
                      onClick={() => openIpd(a.raw)}
                    >
                      <i className="ti ti-eye fs-13" />
                    </button>
                  ) : (
                    <Link
                      to={a.link}
                      className="btn btn-icon btn-sm bg-primary-subtle text-primary rounded-circle"
                    >
                      <i className="ti ti-eye fs-13" />
                    </Link>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderInvoicesTable = (rows: typeof filteredInvoices, showTransactionsOnly = false) => {
    const data = showTransactionsOnly
      ? rows.filter((inv) => {
          const s = (inv.paymentStatus || "").toLowerCase();
          return s.includes("paid") || s.includes("completed");
        })
      : rows;

    return (
      <div className="table-responsive">
        <table className="table table-nowrap">
          <thead className="thead-light">
            <tr>
              <th>Invoice / Txn</th>
              <th>Type</th>
              <th>Description</th>
              <th>Date</th>
              <th>Payment Method</th>
              <th>Amount</th>
              <th>Status</th>
              <th className="text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            {invLoading ? (
              <tr>
                <td colSpan={8} className="text-center py-4">
                  <span className="spinner-border spinner-border-sm text-primary" role="status" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <EmptyRow cols={8} text={showTransactionsOnly ? "No transactions found" : "No invoices found"} />
            ) : (
              data.map((inv) => (
                <tr key={`${inv.module}-${inv.id}`}>
                  <td>
                    {inv.isIpd ? (
                      <button
                        type="button"
                        className="btn btn-link p-0 fw-bold text-primary text-decoration-none"
                        onClick={() => openIpd(inv.raw?.admission || inv.raw)}
                      >
                        {inv.invoiceCode}
                      </button>
                    ) : (
                      <Link
                        to={all_routes.invoicesDetails.replace(":id", inv.id)}
                        className="fw-bold text-dark"
                      >
                        {inv.invoiceCode}
                      </Link>
                    )}
                  </td>
                  <td>
                    <span className={`badge border ${typeBadgeClass(inv.type)} fs-11`}>{inv.type}</span>
                  </td>
                  <td className="text-dark">{inv.description}</td>
                  <td className="text-dark">
                    {inv.date ? dayjs(inv.date).format("DD MMM YYYY") : "—"}
                  </td>
                  <td className="text-dark">{inv.paymentMethod}</td>
                  <td className="text-dark fw-bold">{formatMoney(inv.amount)}</td>
                  <td>
                    <span
                      className={`badge border fs-12 fw-bold ${paymentStatusBadgeClass(inv.paymentStatus)}`}
                    >
                      {displayPaymentStatus(inv.paymentStatus)}
                    </span>
                  </td>
                  <td className="text-end">
                    {inv.isIpd ? (
                      <button
                        type="button"
                        className="btn btn-icon btn-sm bg-primary-subtle text-primary rounded-circle"
                        onClick={() => openIpd(inv.raw?.admission || inv.raw)}
                      >
                        <i className="ti ti-eye fs-13" />
                      </button>
                    ) : (
                      <Link
                        to={all_routes.invoicesDetails.replace(":id", inv.id)}
                        className="btn btn-icon btn-sm bg-primary-subtle text-primary rounded-circle"
                      >
                        <i className="ti ti-eye fs-13" />
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPrescriptionsTable = (rows: typeof filteredPrescriptions) => (
    <div className="table-responsive">
      <table className="table table-nowrap">
        <thead className="thead-light">
          <tr>
            <th>Prescription</th>
            <th>Doctor</th>
            <th>Type</th>
            <th>Date</th>
            <th>Medicines</th>
          </tr>
        </thead>
        <tbody>
          {rxLoading ? (
            <tr>
              <td colSpan={5} className="text-center py-4">
                <span className="spinner-border spinner-border-sm text-primary" role="status" />
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <EmptyRow cols={5} text="No prescriptions found" />
          ) : (
            rows.map((rx) => (
              <tr key={`${rx.module}-${rx.id}`}>
                <td className="fw-bold text-dark">{rx.code}</td>
                <td>
                  <div className="d-flex align-items-center">
                    <span className="avatar avatar-sm me-2">
                      <ImageWithBasePath
                        src={rx.doctorImage}
                        alt={rx.doctorName}
                        className="rounded-circle"
                      />
                    </span>
                    <div>
                      <h6 className="fs-14 fw-bold mb-0">{rx.doctorName}</h6>
                      <p className="mb-0 fs-12 text-muted">{rx.role}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge border ${typeBadgeClass(rx.type)} fs-11`}>{rx.type}</span>
                </td>
                <td className="text-dark">
                  {rx.date ? dayjs(rx.date).format("DD MMM YYYY") : "—"}
                </td>
                <td className="text-dark">{rx.medicinesCount || "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderModuleOverview = (module: Exclude<MainTab, "overview">) => {
    const v = visits.filter((x) => x.module === module);
    const inv = allInvoices.filter((x) => x.module === module);
    const rx = allPrescriptions.filter((x) => x.module === module);
    const txn = inv.filter((x) => {
      const s = (x.paymentStatus || "").toLowerCase();
      return s.includes("paid") || s.includes("completed");
    });
    const docs = new Set(
      v.filter((x) => x.type !== "Diagnostic").map((x) => x.doctorName.trim().toLowerCase())
    );
    const billed = inv.reduce((sum, x) => sum + Number(x.amount || 0), 0);
    const labels = {
      opd: {
        title: "OPD Overview",
        visits: "OPD Visits",
        hint: "Clinic visits, diagnostics, pharmacy & pathlab billing",
      },
      ipd: {
        title: "IPD Overview",
        visits: "Admissions",
        hint: "Inpatient admissions, stay billing & IPD prescriptions",
      },
      therapy: {
        title: "Therapy Overview",
        visits: "Therapy Sessions",
        hint: "Therapy appointments, plans, invoices & prescriptions",
      },
    }[module];

    return (
      <>
        <p className="text-muted mb-3">{labels.hint}</p>
        <div className="row g-3 mb-4">
          <div className="col-md-3 col-sm-6">
            <StatCard icon="ti-calendar-event" label={labels.visits} value={v.length} />
          </div>
          <div className="col-md-3 col-sm-6">
            <StatCard icon="ti-stethoscope" label="Doctors Visited" value={docs.size} tone="success" />
          </div>
          <div className="col-md-3 col-sm-6">
            <StatCard icon="ti-file-invoice" label="Invoices" value={inv.length} tone="warning" />
          </div>
          <div className="col-md-3 col-sm-6">
            <StatCard icon="ti-prescription" label="Prescriptions" value={rx.length} tone="info" />
          </div>
        </div>
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <StatCard icon="ti-cash" label="Total Billed" value={formatMoney(billed)} tone="danger" />
          </div>
          <div className="col-md-4">
            <StatCard icon="ti-receipt" label="Paid Transactions" value={txn.length} tone="success" />
          </div>
          <div className="col-md-4">
            <StatCard
              icon="ti-clock"
              label="Last Activity"
              value={
                v[0]?.scheduledAt
                  ? dayjs(v[0].scheduledAt).format("DD MMM YYYY")
                  : inv[0]?.date
                    ? dayjs(inv[0].date).format("DD MMM YYYY")
                    : "—"
              }
            />
          </div>
        </div>
        <div className="card shadow-sm">
          <div className="card-header">
            <h6 className="fw-bold mb-0">Recent Visits</h6>
          </div>
          <div className="card-body p-0">{renderVisitsTable(v.slice(0, 5), apptLoading || labLoading)}</div>
        </div>
      </>
    );
  };

  const renderModuleContent = () => {
    if (mainTab === "overview") return null;

    const subTabs: { key: ModuleSubTab; label: string; count?: number }[] = [
      { key: "overview", label: "Overview" },
      { key: "visits", label: "Doctor Visits", count: moduleVisits.length },
      { key: "invoices", label: "Invoices & Transactions", count: moduleInvoices.length },
      { key: "prescriptions", label: "Prescriptions", count: modulePrescriptions.length },
    ];

    return (
      <div className="card shadow-sm">
        <div className="card-body">
          <ul className="nav nav-pills gap-2 mb-3 flex-wrap">
            {subTabs.map((t) => (
              <li className="nav-item" key={t.key}>
                <button
                  type="button"
                  className={`nav-link ${moduleSubTab === t.key ? "active" : ""}`}
                  onClick={() => {
                    setModuleSubTab(t.key);
                    setSearchText("");
                  }}
                >
                  {t.label}
                  {typeof t.count === "number" ? (
                    <span className="badge bg-white text-primary ms-2">{t.count}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>

          {moduleSubTab !== "overview" && (
            <div className="mb-3" style={{ maxWidth: 280 }}>
              <SearchInput value={searchText} onChange={setSearchText} />
            </div>
          )}

          {moduleSubTab === "overview" && renderModuleOverview(mainTab)}
          {moduleSubTab === "visits" && renderVisitsTable(filteredVisits, apptLoading || labLoading)}
          {moduleSubTab === "invoices" && (
            <>
              <h6 className="fw-bold mb-2">Invoices</h6>
              {renderInvoicesTable(filteredInvoices)}
              <h6 className="fw-bold mb-2 mt-4">Paid Transactions</h6>
              {renderInvoicesTable(filteredInvoices, true)}
            </>
          )}
          {moduleSubTab === "prescriptions" && renderPrescriptionsTable(filteredPrescriptions)}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content text-center py-5">
          <span className="spinner-border text-primary" role="status" />
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-danger">{error || "Patient not found"}</div>
          <Link to={all_routes.patients} className="btn btn-primary">
            Back to Patients
          </Link>
        </div>
      </div>
    );
  }

  const assignedDoctors = patient.doctors?.length
    ? patient.doctors
    : patient.primaryDoctor
      ? [patient.primaryDoctor]
      : [];

  let patientAge: number | null = null;
  if ((patient as any)?.age != null && (patient as any).age !== "") {
    patientAge = Number((patient as any).age);
  } else if (patient.dob) {
    const years = dayjs().diff(dayjs(patient.dob), "year");
    patientAge = years >= 0 ? years : null;
  }

  const locationLabel =
    [patient.city, patient.state, patient.country].filter(Boolean).join(", ") ||
    patient.fullAddress ||
    "—";

  const totalBillsAmount = allInvoices.reduce(
    (sum, inv) => sum + Number(inv.amount || 0),
    0
  );

  const dueAmount = allInvoices.reduce((sum, inv) => {
    const s = (inv.paymentStatus || "").toLowerCase();
    if (s.includes("paid") && !s.includes("unpaid") && !s.includes("partial")) return sum;
    if (s.includes("completed")) return sum;
    const raw = inv.raw || {};
    const due =
      raw.dueAmount ??
      raw.balanceAmount ??
      (s.includes("partial") || s.includes("unpaid") || s.includes("pending")
        ? Number(inv.amount || 0)
        : 0);
    return sum + Number(due || 0);
  }, 0);

  const isActivePatient =
    patient.status === "Active" || statusLabel === "Available" || statusLabel === "Active";

  const metaParts = [
    patient.patientCode ? `P#${patient.patientCode}` : null,
    patient.gender || null,
    patientAge != null ? `${patientAge} Years` : null,
    patient.dob ? dayjs(patient.dob).format("DD MMM YYYY") : null,
  ].filter(Boolean);

  const formatStatMoney = (amount: number) => {
    const n = Number(amount || 0);
    return `₹${n.toLocaleString("en-IN", {
      minimumFractionDigits: n % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const headerStatCards = [
    {
      key: "visits",
      label: "Total Visits",
      value: String(visits.length),
      icon: "ti-calendar-event",
      bg: "#F3F0FF",
      iconBg: "#E4DBFF",
      iconColor: "#5B21B6",
      labelColor: "#5B21B6",
    },
    {
      key: "bills",
      label: "Total Bills",
      value: formatStatMoney(totalBillsAmount),
      icon: "ti-currency-rupee",
      bg: "#ECFDF3",
      iconBg: "#D1FADF",
      iconColor: "#15803D",
      labelColor: "#15803D",
    },
    {
      key: "rx",
      label: "Prescriptions",
      value: String(allPrescriptions.length),
      icon: "ti-file-text",
      bg: "#EFF6FF",
      iconBg: "#DBEAFE",
      iconColor: "#1D4ED8",
      labelColor: "#1D4ED8",
    },
    {
      key: "due",
      label: "Due Amount",
      value: formatStatMoney(dueAmount),
      icon: "ti-alert-triangle",
      bg: "#FFFBEB",
      iconBg: "#FEF3C7",
      iconColor: "#B45309",
      labelColor: "#B45309",
    },
  ];

  return (
    <>
      <div className="page-wrapper patient-details-page">
        <div className="content">
          <div className="mb-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
            <h6 className="fw-bold mb-0 d-flex align-items-center">
              <Link to={all_routes.patients} className="text-dark">
                <i className="ti ti-chevron-left me-1" />
                Patients
              </Link>
            </h6>
            <div className="d-flex align-items-center gap-2">
              <a
                href={`tel:${patient.phone || ""}`}
                className="btn btn-outline-primary btn-sm rounded-circle d-inline-flex align-items-center justify-content-center"
                style={{ width: 36, height: 36 }}
                title="Call Patient"
              >
                <i className="ti ti-phone" />
              </a>
              <a
                href={`https://wa.me/${(patient.phone || "").replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-success btn-sm rounded-circle d-inline-flex align-items-center justify-content-center"
                style={{ width: 36, height: 36 }}
                title="WhatsApp Patient"
              >
                <i className="ti ti-brand-whatsapp" />
              </a>
              <Link
                to={`${all_routes.newAppointment}?patientId=${patient.id}`}
                className="btn btn-primary btn-sm"
              >
                <i className="ti ti-calendar-event me-1" />
                Book Appointment
              </Link>
            </div>
          </div>

          {/* Force all patient-view cards: no border + soft shadow */}
          <style>{`
            .page-wrapper.patient-details-page .card,
            .page-wrapper.patient-details-page .content .card {
              border: none !important;
              border-width: 0 !important;
              border-style: none !important;
              border-color: transparent !important;
              outline: none !important;
              border-radius: 16px !important;
              box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08) !important;
              background: #ffffff !important;
            }
            .page-wrapper.patient-details-page .card:hover {
              box-shadow: 0 12px 28px rgba(15, 23, 42, 0.10) !important;
            }
            .page-wrapper.patient-details-page .card .card-header {
              border-bottom-color: #f1f5f9 !important;
              background: transparent !important;
            }
            .page-wrapper .card.patient-profile-hero,
            .page-wrapper .patient-profile-hero.card {
              background: #ffffff !important;
              border: none !important;
              border-width: 0 !important;
              border-radius: 16px !important;
              box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08) !important;
              padding: 22px 24px;
              overflow-x: auto;
            }
            .patient-profile-hero .hero-avatar {
              width: 72px;
              height: 72px;
              border-radius: 50%;
              object-fit: cover;
              flex-shrink: 0;
            }
            .patient-profile-hero .hero-name {
              font-size: 1.25rem;
              font-weight: 700;
              color: #0f172a;
              margin: 0;
              line-height: 1.3;
            }
            .patient-profile-hero .status-pill {
              display: inline-flex;
              align-items: center;
              padding: 2px 10px;
              border-radius: 999px;
              font-size: 12px;
              font-weight: 600;
              line-height: 1.4;
            }
            .patient-profile-hero .status-pill.active {
              background: #dcfce7;
              color: #15803d;
            }
            .patient-profile-hero .status-pill.inactive {
              background: #fee2e2;
              color: #b91c1c;
            }
            .patient-profile-hero .meta-row {
              color: #64748b;
              font-size: 13px;
              margin: 6px 0 10px;
            }
            .patient-profile-hero .meta-sep {
              margin: 0 8px;
              color: #cbd5e1;
            }
            .patient-profile-hero .contact-row i {
              color: #64748b;
              font-size: 15px;
              flex-shrink: 0;
            }
            .patient-profile-hero .hero-row {
              display: flex;
              flex-wrap: nowrap !important;
              align-items: center;
              justify-content: space-between;
              gap: 24px;
              width: 100%;
              min-width: 980px;
            }
            .patient-profile-hero .hero-info {
              display: flex;
              align-items: center;
              gap: 12px;
              flex: 1 1 auto;
              min-width: 0;
            }
            .patient-profile-hero .hero-info-text {
              min-width: 0;
              overflow: hidden;
            }
            .patient-profile-hero .meta-row,
            .patient-profile-hero .contact-row {
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .patient-profile-hero .contact-row {
              display: flex;
              flex-wrap: nowrap;
              gap: 14px;
              color: #475569;
              font-size: 13px;
            }
            .patient-profile-hero .contact-row span {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              flex-shrink: 1;
              min-width: 0;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .patient-mini-stat {
              display: flex;
              align-items: center;
              gap: 10px;
              border-radius: 12px;
              padding: 10px 12px;
              flex: 0 0 auto;
              width: 148px;
              border: none !important;
              box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08) !important;
            }
            .patient-mini-stat .stat-icon {
              width: 36px;
              height: 36px;
              border-radius: 10px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
              margin: 0;
              font-size: 16px;
            }
            .patient-mini-stat .stat-text {
              display: flex;
              flex-direction: column;
              min-width: 0;
              line-height: 1.2;
            }
            .patient-mini-stat .stat-label {
              font-size: 11px;
              font-weight: 600;
              margin: 0 0 2px;
              white-space: nowrap;
            }
            .patient-mini-stat .stat-value {
              font-size: 1.2rem;
              font-weight: 700;
              color: #0f172a;
              line-height: 1.15;
              margin: 0 0 1px;
              white-space: nowrap;
            }
            .patient-mini-stat .stat-footer {
              font-size: 10px;
              color: #94a3b8;
              margin: 0;
            }
            .patient-profile-hero .hero-stats {
              display: flex;
              flex-wrap: nowrap;
              gap: 10px;
              justify-content: flex-end;
              align-items: center;
              flex: 0 0 auto;
              margin-left: auto;
            }
          `}</style>

          <div className="card patient-profile-hero mb-3">
            <div className="hero-row">
              <div className="hero-info">
                <Link to={all_routes.editPatient.replace(":id", patient.id)} className="flex-shrink-0">
                  <ImageWithBasePath
                    src={profileSrc}
                    alt={displayName}
                    className="hero-avatar"
                  />
                </Link>
                <div className="hero-info-text">
                  <div className="d-flex align-items-center flex-wrap gap-2 mb-1">
                    <h4 className="hero-name">{displayName}</h4>
                    <span className={`status-pill ${isActivePatient ? "active" : "inactive"}`}>
                      {isActivePatient ? "Active" : "Inactive"}
                    </span>
                    {patient.suggestIPD ? (
                      <span className="status-pill" style={{ background: "#FEF3C7", color: "#B45309" }}>
                        IPD Suggested
                      </span>
                    ) : null}
                  </div>
                  {metaParts.length > 0 && (
                    <p className="meta-row mb-0">
                      {metaParts.map((part, idx) => (
                        <span key={`${part}-${idx}`}>
                          {idx > 0 && <span className="meta-sep">|</span>}
                          {part}
                        </span>
                      ))}
                    </p>
                  )}
                  <div className="contact-row mt-2">
                    <span>
                      <i className="ti ti-phone" />
                      {patient.phone || "—"}
                    </span>
                    <span>
                      <i className="ti ti-mail" />
                      {patient.email || "—"}
                    </span>
                    <span>
                      <i className="ti ti-map-pin" />
                      {locationLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="hero-stats">
                {headerStatCards.map((stat) => (
                  <div
                    key={stat.key}
                    className="patient-mini-stat"
                    style={{ background: stat.bg }}
                  >
                    <span
                      className="stat-icon"
                      style={{ background: stat.iconBg, color: stat.iconColor }}
                    >
                      <i className={`ti ${stat.icon}`} />
                    </span>
                    <div className="stat-text">
                      <div className="stat-label" style={{ color: stat.labelColor }}>
                        {stat.label}
                      </div>
                      <div className="stat-value">{stat.value}</div>
                      <p className="stat-footer">All Time</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main tabs */}
          <ul className="nav nav-tabs nav-bordered mb-3">
            {(
              [
                { key: "overview", label: "Overview" },
                { key: "opd", label: "OPD" },
                { key: "ipd", label: "IPD" },
                { key: "therapy", label: "Therapy" },
              ] as const
            ).map((t) => (
              <li className="nav-item" key={t.key}>
                <button
                  type="button"
                  className={`nav-link bg-transparent ${mainTab === t.key ? "active" : ""}`}
                  onClick={() => setMainTab(t.key)}
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>

          {/* OVERVIEW */}
          {mainTab === "overview" && (
            <>
              <div className="row g-3 mb-3">
                <div className="col-xl-5 d-flex">
                  <div className="card shadow-sm flex-fill w-100">
                    <div className="card-header">
                      <h5 className="fw-bold mb-0">
                        <i className="ti ti-user-star me-1" />
                        Profile Details
                      </h5>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-sm-6">
                          <ProfileField label="First Name" value={patient.firstName} />
                        </div>
                        <div className="col-sm-6">
                          <ProfileField label="Middle Name" value={(patient as any).middleName} />
                        </div>
                        <div className="col-sm-6">
                          <ProfileField label="Last Name" value={patient.lastName} />
                        </div>
                        <div className="col-sm-6">
                          <ProfileField label="Gender" value={patient.gender} />
                        </div>
                        <div className="col-sm-6">
                          <ProfileField label="DOB" value={formatPatientDateLong(patient.dob)} />
                        </div>
                        <div className="col-sm-6">
                          <ProfileField label="Age" value={(patient as any).age} />
                        </div>
                        <div className="col-sm-6">
                          <ProfileField label="Blood Group" value={patient.bloodGroup} />
                        </div>
                        <div className="col-sm-6">
                          <ProfileField label="Marital Status" value={patient.maritalStatus} />
                        </div>
                        <div className="col-sm-6">
                          <ProfileField label="Email" value={patient.email} />
                        </div>
                        <div className="col-sm-6">
                          <ProfileField label="Phone" value={patient.phone} />
                        </div>
                        <div className="col-sm-6">
                          <ProfileField
                            label="Alternate Mobile"
                            value={(patient as any).alternateMobile}
                          />
                        </div>
                        <div className="col-sm-6">
                          <ProfileField label="Occupation" value={patient.occupation} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-xl-7 d-flex">
                  <div className="card shadow-sm flex-fill w-100">
                    <div className="card-header">
                      <h5 className="fw-bold mb-0">
                        <i className="ti ti-id me-1" />
                        Additional Information
                      </h5>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-sm-4">
                          <ProfileField label="Aadhaar Number" value={patient.aadhaarNumber} />
                        </div>
                        <div className="col-sm-4">
                          <ProfileField label="Passport Number" value={patient.passportNumber} />
                        </div>
                        <div className="col-sm-4">
                          <ProfileField label="Referred By" value={patient.referredBy} />
                        </div>
                        <div className="col-sm-4">
                          <ProfileField label="Refer ID" value={(patient as any).referId} />
                        </div>
                        <div className="col-sm-4">
                          <ProfileField label="Country" value={patient.country} />
                        </div>
                        <div className="col-sm-4">
                          <ProfileField label="State" value={patient.state} />
                        </div>
                        <div className="col-sm-4">
                          <ProfileField label="City" value={patient.city} />
                        </div>
                        <div className="col-sm-4">
                          <ProfileField label="Pincode" value={patient.pincode} />
                        </div>
                        <div className="col-sm-4">
                          <ProfileField label="Address Line 1" value={patient.address1} />
                        </div>
                        <div className="col-12">
                          <ProfileField label="Address Line 2" value={patient.address2} />
                        </div>
                      </div>

                      <div className="border-top pt-3 mt-1">
                        <h6 className="fs-13 fw-bold text-primary mb-2">
                          <i className="ti ti-phone-outgoing me-1" />
                          Emergency Contact
                        </h6>
                        <div className="row">
                          <div className="col-md-4">
                            <ProfileField label="Name" value={patient.emergencyContactName} />
                          </div>
                          <div className="col-md-4">
                            <ProfileField
                              label="Relation"
                              value={patient.emergencyContactRelation}
                            />
                          </div>
                          <div className="col-md-4">
                            <ProfileField label="Phone" value={patient.emergencyContactPhone} />
                          </div>
                        </div>
                      </div>

                      {patient.vitals && Object.keys(patient.vitals).length > 0 ? (
                        <div className="border-top pt-3 mt-1">
                          <h6 className="fs-13 fw-bold text-primary mb-2">
                            <i className="ti ti-heartbeat me-1" />
                            Vitals
                          </h6>
                          <div className="row">
                            {Object.entries(patient.vitals).map(([key, val]) => (
                              <div className="col-md-4" key={key}>
                                <ProfileField
                                  label={key}
                                  value={val == null ? "—" : String(val)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-xl-6">
                  <div className="card shadow-sm h-100">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h5 className="fw-bold mb-0">
                        <i className="ti ti-stethoscope me-1" />
                        Doctors Visited
                      </h5>
                      <span className="badge bg-primary-subtle text-primary">
                        {doctorsVisited.length}
                      </span>
                    </div>
                    <div className="card-body">
                      {doctorsVisited.length === 0 ? (
                        <p className="text-muted mb-0">No doctor visits recorded yet.</p>
                      ) : (
                        <div className="d-flex flex-column gap-3">
                          {doctorsVisited.map((doc) => (
                            <div
                              key={doc.name}
                              className="d-flex align-items-center justify-content-between flex-wrap gap-2"
                            >
                              <div className="d-flex align-items-center">
                                <span className="avatar avatar-md me-2">
                                  <ImageWithBasePath
                                    src={doc.image}
                                    alt={doc.name}
                                    className="rounded-circle"
                                  />
                                </span>
                                <div>
                                  <h6 className="fs-14 fw-bold mb-0">{doc.name}</h6>
                                  <p className="mb-0 fs-12 text-muted">{doc.role}</p>
                                </div>
                              </div>
                              <div className="text-end">
                                <div className="d-flex gap-1 justify-content-end mb-1 flex-wrap">
                                  {Array.from(doc.modules).map((m) => (
                                    <span
                                      key={m}
                                      className={`badge border ${typeBadgeClass(m)} fs-10 text-uppercase`}
                                    >
                                      {m}
                                    </span>
                                  ))}
                                </div>
                                <p className="mb-0 fs-12 text-muted">
                                  {doc.visits} visit{doc.visits > 1 ? "s" : ""} · Last{" "}
                                  {dayjs(doc.lastVisit).format("DD MMM YYYY")}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-xl-6">
                  <div className="card shadow-sm h-100">
                    <div className="card-header">
                      <h5 className="fw-bold mb-0">
                        <i className="ti ti-user-check me-1" />
                        Assigned Doctors (Profile)
                      </h5>
                    </div>
                    <div className="card-body">
                      {assignedDoctors.length === 0 ? (
                        <p className="text-muted mb-0">No doctors assigned on profile.</p>
                      ) : (
                        <div className="d-flex flex-column gap-3">
                          {assignedDoctors.map((doc) => (
                            <div className="d-flex align-items-center" key={doc.id}>
                              <span className="avatar avatar-md me-2">
                                <ImageWithBasePath
                                  src={
                                    doc.profileImage || "assets/img/doctor-placeholder.png"
                                  }
                                  alt={doc.fullName}
                                  className="rounded-circle"
                                />
                              </span>
                              <div>
                                <h6 className="fs-14 fw-bold mb-0">
                                  {doc.fullName.startsWith("Dr.")
                                    ? doc.fullName
                                    : `Dr. ${doc.fullName}`}
                                </h6>
                                <p className="mb-0 fs-12 text-muted">
                                  {doc.designation?.name || "Doctor"}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-4">
                  <div className="card shadow-sm h-100">
                    <div className="card-header d-flex justify-content-between">
                      <h6 className="fw-bold mb-0">OPD Snapshot</h6>
                      <button
                        type="button"
                        className="btn btn-sm btn-link p-0"
                        onClick={() => setMainTab("opd")}
                      >
                        View
                      </button>
                    </div>
                    <div className="card-body">
                      <p className="mb-1">
                        Visits: <strong>{visits.filter((v) => v.module === "opd").length}</strong>
                      </p>
                      <p className="mb-1">
                        Invoices:{" "}
                        <strong>{allInvoices.filter((v) => v.module === "opd").length}</strong>
                      </p>
                      <p className="mb-0">
                        Prescriptions:{" "}
                        <strong>
                          {allPrescriptions.filter((v) => v.module === "opd").length}
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card shadow-sm h-100">
                    <div className="card-header d-flex justify-content-between">
                      <h6 className="fw-bold mb-0">IPD Snapshot</h6>
                      <button
                        type="button"
                        className="btn btn-sm btn-link p-0"
                        onClick={() => setMainTab("ipd")}
                      >
                        View
                      </button>
                    </div>
                    <div className="card-body">
                      <p className="mb-1">
                        Admissions:{" "}
                        <strong>{visits.filter((v) => v.module === "ipd").length}</strong>
                      </p>
                      <p className="mb-1">
                        Invoices:{" "}
                        <strong>{allInvoices.filter((v) => v.module === "ipd").length}</strong>
                      </p>
                      <p className="mb-0">
                        Prescriptions:{" "}
                        <strong>
                          {allPrescriptions.filter((v) => v.module === "ipd").length}
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card shadow-sm h-100">
                    <div className="card-header d-flex justify-content-between">
                      <h6 className="fw-bold mb-0">Therapy Snapshot</h6>
                      <button
                        type="button"
                        className="btn btn-sm btn-link p-0"
                        onClick={() => setMainTab("therapy")}
                      >
                        View
                      </button>
                    </div>
                    <div className="card-body">
                      <p className="mb-1">
                        Sessions:{" "}
                        <strong>{visits.filter((v) => v.module === "therapy").length}</strong>
                      </p>
                      <p className="mb-1">
                        Invoices:{" "}
                        <strong>
                          {allInvoices.filter((v) => v.module === "therapy").length}
                        </strong>
                      </p>
                      <p className="mb-0">
                        Prescriptions:{" "}
                        <strong>
                          {allPrescriptions.filter((v) => v.module === "therapy").length}
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* MODULE TABS */}
          {(mainTab === "opd" || mainTab === "ipd" || mainTab === "therapy") &&
            renderModuleContent()}
        </div>

        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025
            <Link to="#" className="link-primary">
              {" "}
              Docyari
            </Link>
            , All Rights Reserved
          </p>
        </div>
      </div>

      <IpdViewDetailsModal
        show={showIpdModal}
        onClose={() => setShowIpdModal(false)}
        admission={selectedIpdAdmission}
      />
      <Modals />
    </>
  );
};

export default PatientDetails;
