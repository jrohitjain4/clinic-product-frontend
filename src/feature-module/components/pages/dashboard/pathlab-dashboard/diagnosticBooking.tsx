import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Datatable from "../../../../../core/common/dataTable";
import { Link } from "react-router";
import { ViewModal } from "../../../../../core/common/modal/ViewModal";
import DeleteModal from "../../../../../core/common/modal/DeleteModal";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { DatePicker } from "antd";
import { useLabBookings } from "../../../../../core/hooks/useLabBookings";
import { useLabTests } from "../../../../../core/hooks/useLabTests";
import { useLabCategories } from "../../../../../core/hooks/useLabCategories";
import { useClinicPatients } from "../../../../../core/hooks/useClinicPatients";
import { useClinicDoctors } from "../../../../../core/hooks/useClinicDoctors";
import { useClinicStaff } from "../../../../../core/hooks/useClinicStaff";
import EmptyState from "../../../../../core/common/emptyState";
import AddPatientModal from "../../clinic-modules/appointments/modals/addPatientModal";
import { statusBadgeClass } from "../../../../../core/utils/appointmentForm";
import AppointmentPrintSlip from "../../clinic-modules/appointments/AppointmentPrintSlip";
import { resolveMediaUrl } from "../../../../../core/config/api";
import CommonSelect from "../../../../../core/common/common-select/commonSelect";
import { IconFormControl, IconTextarea } from "../../../../../core/common/form-fields";

const customSelectStyles = `
  @media print {
    @page { size: A4; margin: 0; }
    body { visibility: hidden !important; }
    #print-appointment, #print-appointment * {
      visibility: visible !important;
    }
    #print-appointment {
      visibility: visible !important;
      display: block !important;
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      background: white !important;
      z-index: 99999 !important;
      padding: 1.5cm !important;
      margin: 0 !important;
    }
    .bg-light { background-color: #f8f9fa !important; -webkit-print-color-adjust: exact; }
  }
`;

const DiagnosticBooking = () => {
  const { bookings, loading, createBooking, updateBooking, deleteBooking, bulkDeleteBookings } = useLabBookings();
  const { tests: allTests } = useLabTests();
  const { categories: allCategories } = useLabCategories();
  const { patients: allPatients } = useClinicPatients();
  const { doctors } = useClinicDoctors();
  const { staffs: staff } = useClinicStaff();


  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [searchText, setSearchText] = useState<string>("");

  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [viewBooking, setViewBooking] = useState<any>(null);
  const [printBooking, setPrintBooking] = useState<any | null>(null);
  const [expandedBookingIds, setExpandedBookingIds] = useState<string[]>([]);

  const toggleExpandBooking = (id: string) => {
    setExpandedBookingIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getBookingTests = (bk: any) => {
    if (Array.isArray(bk?.testsList) && bk.testsList.length > 0) {
      return bk.testsList;
    }
    if (bk?.test) {
      return [
        {
          testId: bk.test.id,
          name: bk.test.name,
          price: bk.test.price || 0,
          categoryName: bk.test.category?.name || "—",
          status:
            bk.status === "Checked Out" || bk.status === "Completed"
              ? "Completed"
              : "Pending",
        },
      ];
    }
    return [];
  };

  const [filterDate, setFilterDate] = useState("");
  const [datePreset, setDatePreset] = useState("All");
  const [filterPatient, setFilterPatient] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterSlot, setFilterSlot] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterTest, setFilterTest] = useState("");

  const counts = useMemo(() => ({
    all: bookings.length,
    schedule: bookings.filter((b) => b.status === "Schedule" || b.status === "Pending").length,
    confirmed: bookings.filter((b) => b.status === "Confirmed").length,
    checkedIn: bookings.filter((b) => b.status === "Checked In").length,
    checkedOut: bookings.filter((b) => b.status === "Checked Out" || b.status === "Completed").length,
    cancelled: bookings.filter((b) => b.status === "Cancelled").length,
  }), [bookings]);

  const patientList = useMemo(() => {
    const names = Array.from(new Set(bookings.map(b => b.patient ? `${b.patient.firstName} ${b.patient.lastName}` : "")));
    return names.filter(n => n).sort();
  }, [bookings]);

  const doctorList = useMemo(() => {
    const names = Array.from(new Set(bookings.map(b => doctors.find((d: any) => d.id === b.assignedUserId)?.fullName || staff.find((s: any) => s.id === b.assignedUserId)?.fullName)));
    return names.filter((n): n is string => !!n).sort();
  }, [bookings, doctors, staff]);

  const slotList = useMemo(() => {
    const names = Array.from(new Set(bookings.map(b => b.sessionSlot)));
    return names.filter((n): n is string => !!n).sort();
  }, [bookings]);

  const categoryList = useMemo(() => {
    const names = Array.from(new Set(bookings.map(b => b.test?.category?.name || "")));
    return names.filter(n => n).sort();
  }, [bookings]);

  const testList = useMemo(() => {
    const filtered = filterCategory
      ? bookings.filter(b => b.test?.category?.name === filterCategory)
      : bookings;
    const names = Array.from(new Set(filtered.map(b => b.test?.name || "")));
    return names.filter(n => n).sort();
  }, [bookings, filterCategory]);

  useEffect(() => {
    if (printBooking) {
      const handleAfterPrint = () => {
        setPrintBooking(null);
        window.removeEventListener("afterprint", handleAfterPrint);
      };
      window.addEventListener("afterprint", handleAfterPrint);
      const timer = setTimeout(() => { window.print(); }, 300);
      return () => { clearTimeout(timer); window.removeEventListener("afterprint", handleAfterPrint); };
    }
  }, [printBooking]);

  const [formPatientId, setFormPatientId] = useState("");

  const patientOptions = useMemo(() => {
    return allPatients.map((p: any) => ({
      value: p.id,
      label: `${p.firstName} ${p.lastName} (${p.patientCode || ""})`,
    }));
  }, [allPatients]);

  const selectedPatientOption = useMemo(() => {
    return patientOptions.find((opt) => opt.value === formPatientId) || null;
  }, [patientOptions, formPatientId]);
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formTestId, setFormTestId] = useState("");
  const [formDate, setFormDate] = useState<dayjs.Dayjs | null>(null);
  const [formStatus, setFormStatus] = useState("Schedule");
  // Wizard state replaced by single form state
  const [formSessionSlot, setFormSessionSlot] = useState("");
  const [formAssignedUserId, setFormAssignedUserId] = useState("");
  const [formRemarks, setFormRemarks] = useState("");
  const [formReferredBy, setFormReferredBy] = useState("");
  const [formDiscountPercent, setFormDiscountPercent] = useState<number>(0);
  const [formDiscountAmount, setFormDiscountAmount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<"percent" | "amount">("percent");
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showDiagSlotsDropdown, setShowDiagSlotsDropdown] = useState(false);
  const [isDiagSlotsDropdownFocused, setIsDiagSlotsDropdownFocused] = useState(false);
  const diagDropdownRef = useRef<HTMLDivElement>(null);

  const [showTestListDropdown, setShowTestListDropdown] = useState(false);
  const testDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (diagDropdownRef.current && !diagDropdownRef.current.contains(event.target as Node)) {
        setShowDiagSlotsDropdown(false);
      }
      if (testDropdownRef.current && !testDropdownRef.current.contains(event.target as Node)) {
        setShowTestListDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    let nextStatus = currentStatus;
    if (currentStatus === "Schedule") nextStatus = "Confirmed";
    else if (currentStatus === "Confirmed") nextStatus = "Checked In";
    else if (currentStatus === "Checked In") nextStatus = "Checked Out";

    if (nextStatus === currentStatus) return; // No toggle available

    setTogglingId(id);
    try {
      await updateBooking(id, { status: nextStatus });
      toast.success(`Booking status updated to ${nextStatus}!`);
    } catch (err: any) {
      toast.error("Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  // Dynamic tests based on selected category
  const filteredTests = useMemo(() => {
    let list = allTests.filter(t => t.status === "Active");
    if (formCategoryId) {
      list = list.filter(t => t.categoryId === formCategoryId);
    }
    if (user?.role === "DOCTOR" && user?.doctorId) {
      const docId = user.doctorId;
      list = list.filter(t => {
        const doctors = Array.isArray(t.assignedDoctors) ? t.assignedDoctors : [];
        return doctors.some((d: any) => {
          if (typeof d === "string") return d === docId;
          if (d && typeof d === "object") return d.value === docId;
          return false;
        });
      });
    }
    return list;
  }, [allTests, formCategoryId, user]);

  const [formTestsList, setFormTestsList] = useState<{testId: string, name: string, categoryName: string, price: number, status: string, assignedUserId?: string}[]>([]);

  const totalAmount = useMemo(() => {
    return formTestsList.reduce((acc, t) => acc + (t.price || 0), 0);
  }, [formTestsList]);

  const activeSchedulingTest = useMemo(() => {
    if (formTestsList.length === 0) return null;
    return allTests.find(t => t.id === formTestsList[0].testId) || null;
  }, [allTests, formTestsList]);

  const selectedTestObj = activeSchedulingTest;
  const mappedPrice = totalAmount;
  const finalAmount = useMemo(() => {
    let discAmt = 0;
    if (discountType === "percent") {
      discAmt = totalAmount * (formDiscountPercent / 100);
    } else {
      discAmt = formDiscountAmount;
    }
    return Math.max(0, totalAmount - discAmt);
  }, [totalAmount, formDiscountPercent, formDiscountAmount, discountType]);

  // Derived discount amount for display/submit
  const resolvedDiscountAmount = useMemo(() => {
    if (discountType === "percent") return totalAmount * (formDiscountPercent / 100);
    return Math.min(formDiscountAmount, totalAmount);
  }, [discountType, totalAmount, formDiscountPercent, formDiscountAmount]);

  const handleAddTest = (testId: string) => {
    if (!testId) return;
    const test = allTests.find(t => t.id === testId);
    if (!test) return;

    if (formTestsList.some(t => t.testId === testId)) {
      toast.warning("Test already added to booking.");
      return;
    }

    const category = allCategories.find(c => c.id === test.categoryId);
    setFormTestsList(prev => [
      ...prev,
      {
        testId: test.id,
        name: test.name,
        categoryName: category?.name || "General",
        price: test.price || 0,
        status: "Pending"
      }
    ]);
  };

  const handleOpenAdd = () => {
    setFormMode("add");
    setFormPatientId(user?.role === "PATIENT" ? (user?.patientId || user?.details?.id || "") : "");
    setFormCategoryId("");
    setFormTestId("");
    setFormTestsList([]);
    setFormDate(null);
    setFormSessionSlot("");
    setFormAssignedUserId(user?.role === "DOCTOR" && user?.doctorId ? user.doctorId : "");
    setFormRemarks("");
    setFormReferredBy("");
    setFormStatus("Schedule");
    setFormDiscountPercent(0);
    setFormDiscountAmount(0);
    setDiscountType("percent");
    setShowFormModal(true);
  };

  const handleOpenEdit = (bk: any) => {
    setFormMode("edit");
    setSelectedBooking(bk);
    setFormPatientId(bk.patientId || "");
    setFormCategoryId(bk.test?.category?.id || "");
    setFormTestId(bk.testId || "");
    if (bk.testsList && Array.isArray(bk.testsList)) {
      setFormTestsList(bk.testsList);
    } else if (bk.test) {
      setFormTestsList([{
        testId: bk.testId,
        name: bk.test.name,
        categoryName: bk.test.category?.name || "General",
        price: bk.test.price || 0,
        status: bk.status === "Completed" || bk.status === "Checked Out" ? "Completed" : "Pending"
      }]);
    } else {
      setFormTestsList([]);
    }
    setFormDate(dayjs(bk.scheduledAt));
    setFormSessionSlot(bk.sessionSlot || "");
    setFormAssignedUserId(bk.assignedUserId || "");
    setFormRemarks(bk.remarks || "");
    setFormReferredBy(bk.referredBy || "");
    setFormStatus(bk.status || "Schedule");
    // Restore discount — always stored as flat amount in DB, restore as amount type
    const savedDiscount = bk.discount || 0;
    setDiscountType("amount");
    setFormDiscountAmount(savedDiscount);
    setFormDiscountPercent(0);
    setShowFormModal(true);
  };

  const handleCategoryChange = (catId: string) => {
    setFormCategoryId(catId);
    setFormTestId("");
  };

  // Schedule Logic
  const availableSchedules = useMemo(() => {
    if (!selectedTestObj?.schedules) return null;
    try {
      const parsed = typeof selectedTestObj.schedules === "string" ? JSON.parse(selectedTestObj.schedules) : selectedTestObj.schedules;
      return typeof parsed === "object" && parsed !== null ? parsed : null;
    } catch {
      return null;
    }
  }, [selectedTestObj]);

  const availableDays = useMemo(() => {
    if (!availableSchedules) return [];
    return Object.keys(availableSchedules).filter(day => Array.isArray(availableSchedules[day]) && availableSchedules[day].length > 0);
  }, [availableSchedules]);

  const disabledDate = (current: any) => {
    if (!current) return false;
    if (current < dayjs().startOf('day')) return true;
    if (availableDays.length === 0) return false; // If no schedule defined, allow all
    const currentDay = current.format('dddd');
    return !availableDays.includes(currentDay);
  };

  const cellRender = (current: any, info: any) => {
    if (info.type !== 'date') return info.originNode;
    const currentDay = current.format('dddd');
    const isAvailable = availableDays.includes(currentDay);
    const isPast = current < dayjs().startOf('day');

    if (availableDays.length > 0) {
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

  const dateOptions = useMemo(() => {
    if (!formDate || !availableSchedules) return [];
    const currentDay = formDate.format('dddd');
    const daySessions = availableSchedules[currentDay];
    if (!Array.isArray(daySessions) || daySessions.length === 0) return [];

    let options: { label: string; value: string }[] = [];
    const isSlotEnabled = selectedTestObj?.isSlotBookingEnabled;
    const slotDur = selectedTestObj?.slotDuration || 30;

    daySessions.forEach((session: any) => {
      // Assuming session has `session`, `from`, `to`
      const sessionName = session.session || "Session";
      const startTime = session.from || "00:00:00";
      const endTime = session.to || "23:59:59";

      if (!isSlotEnabled) {
        options.push({ label: `${sessionName} (${startTime} - ${endTime})`, value: `${sessionName} (${startTime} - ${endTime})` });
      } else {
        let currentSlotTime = dayjs(`${formDate.format("YYYY-MM-DD")}T${startTime}`);
        const endSessionTime = dayjs(`${formDate.format("YYYY-MM-DD")}T${endTime}`);

        while (currentSlotTime.add(slotDur, 'minute').isBefore(endSessionTime) || currentSlotTime.add(slotDur, 'minute').isSame(endSessionTime)) {
          const slotEnd = currentSlotTime.add(slotDur, 'minute');
          const slotStr = `${currentSlotTime.format("HH:mm")} - ${slotEnd.format("HH:mm")}`;
          options.push({ label: slotStr, value: slotStr });
          currentSlotTime = slotEnd;
        }
      }
    });
    return options;
  }, [formDate, availableSchedules, selectedTestObj]);

  const maxLimit = selectedTestObj?.maxBookingsPerSlot || 1;
  const slotAvailabilities = useMemo(() => {
    const availabilities: Record<string, { booked: number; limit: number; isFull: boolean }> = {};
    dateOptions.forEach(opt => {
      const bookedCount = bookings.filter((b: any) => b.testId === formTestId && dayjs(b.scheduledAt).format("YYYY-MM-DD") === formDate?.format("YYYY-MM-DD") && b.sessionSlot === opt.value && b.status !== "Cancelled").length;
      availabilities[opt.value] = { booked: bookedCount, limit: maxLimit, isFull: bookedCount >= maxLimit };
    });
    return availabilities;
  }, [bookings, formTestId, formDate, dateOptions, maxLimit]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formPatientId) { toast.error("Patient is required"); return; }
    if (formTestsList.length === 0) { toast.error("Please add at least one diagnostic test"); return; }
    if (!formDate) { toast.error("Date is required"); return; }
    if (!formSessionSlot) { toast.error("Please select a valid time slot or session."); return; }

    setSubmitting(true);
    try {
      let startTime = "10:00";
      if (formSessionSlot) {
        const match = formSessionSlot.match(/(\d{2}:\d{2})/);
        if (match) startTime = match[1];
      }
      const scheduledAt = formDate.format("YYYY-MM-DD") + "T" + startTime + ":00";
      const tax = 0;
      const discountAmount = resolvedDiscountAmount;
      const finalTotalAmount = Math.max(0, totalAmount - discountAmount);

      if (formMode === "add") {
        await createBooking({
          patientId: formPatientId,
          testId: formTestsList[0].testId,
          testsList: formTestsList,
          scheduledAt,
          status: user?.role === "PATIENT" ? "Schedule" : formStatus,
          paymentStatus: "Unpaid",
          discount: discountAmount,
          tax,
          totalAmount: finalTotalAmount,
          sessionSlot: formSessionSlot,
          assignedUserId: formAssignedUserId,
          remarks: formRemarks,
          referredBy: formReferredBy,
        });
        toast.success("Booking created successfully!");
      } else if (formMode === "edit" && selectedBooking) {
        await updateBooking(selectedBooking.id, {
          patientId: formPatientId,
          testId: formTestsList[0].testId,
          testsList: formTestsList,
          scheduledAt,
          status: formStatus,
          discount: discountAmount,
          tax,
          totalAmount: finalTotalAmount,
          sessionSlot: formSessionSlot,
          assignedUserId: formAssignedUserId,
          remarks: formRemarks,
          referredBy: formReferredBy,
        });
        toast.success("Booking updated successfully!");
        setSelectedBooking(null);
      }
      setShowFormModal(false);
    } catch (err: any) {
      toast.error(err.message || (formMode === "add" ? "Failed to create booking" : "Failed to update booking"));
    } finally { setSubmitting(false); }
  };

  const handleOpenDelete = (bk: any) => { setSelectedBooking(bk); setShowDeleteModal(true); };

  const handleDeleteConfirm = async () => {
    if (selectedBooking) {
      setSubmitting(true);
      try {
        await deleteBooking(selectedBooking.id);
        setSelectedIds(selectedIds.filter(id => id !== selectedBooking.id));
        toast.success("Booking deleted!");
        setShowDeleteModal(false);
        setSelectedBooking(null);
      } catch (err: any) { /* handled */ } finally { setSubmitting(false); }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setSubmitting(true);
    try {
      await bulkDeleteBookings(selectedIds);
      setSelectedIds([]);
      toast.success("Selected bookings deleted!");
    } catch (err: any) { /* handled */ } finally { setSubmitting(false); }
  };

  const filteredData = useMemo(() => {
    return bookings.filter((bk) => {
      const displayStatus = bk.status === "Pending" ? "Schedule" : bk.status === "Completed" ? "Checked Out" : bk.status;
      const matchStatus = filterStatus === "All" || displayStatus === filterStatus;
      const patientName = bk.patient ? `${bk.patient.firstName} ${bk.patient.lastName}` : "";
      const matchSearch =
        searchText === "" ||
        patientName.toLowerCase().includes(searchText.toLowerCase()) ||
        (bk.bookingCode || "").toLowerCase().includes(searchText.toLowerCase()) ||
        (bk.test?.name || "").toLowerCase().includes(searchText.toLowerCase());
      // Date Filter Logic
      let matchDate = true;
      const rowDate = dayjs(bk.scheduledAt);
      if (datePreset === "Today") {
        matchDate = rowDate.isSame(dayjs(), 'day');
      } else if (datePreset === "Yesterday") {
        matchDate = rowDate.isSame(dayjs().subtract(1, 'day'), 'day');
      } else if (datePreset === "Last 7 Days") {
        matchDate = rowDate.isAfter(dayjs().subtract(7, 'day'));
      } else if (datePreset === "Custom" && filterDate) {
        matchDate = rowDate.format("YYYY-MM-DD") === filterDate;
      }

      const matchPatient = filterPatient ? patientName === filterPatient : true;

      const assignedName = doctors.find((d: any) => d.id === bk.assignedUserId)?.fullName || staff.find((s: any) => s.id === bk.assignedUserId)?.fullName || "";
      const matchDoctor = filterDoctor ? assignedName === filterDoctor : true;
      const matchSlot = filterSlot ? bk.sessionSlot === filterSlot : true;
      const matchCategory = filterCategory ? bk.test?.category?.name === filterCategory : true;
      const matchTest = filterTest ? bk.test?.name === filterTest : true;

      return matchStatus && matchSearch && matchDate && matchPatient && matchDoctor && matchSlot && matchCategory && matchTest;
    });
  }, [bookings, filterStatus, searchText, datePreset, filterDate, filterPatient, filterDoctor, filterSlot, filterCategory, filterTest, doctors, staff]);

  const handleExportCSV = () => {
    const headers = ["Sr No", "Date & Time", "Patient", "Test", "Category", "Price", "Status"];
    const csvData = filteredData.map((bk, i) => [
      i + 1,
      dayjs(bk.scheduledAt).format("DD MMM YYYY, hh:mm A"),
      bk.patient ? `${bk.patient.firstName} ${bk.patient.lastName}` : "N/A",
      bk.test?.name || "N/A",
      bk.test?.category?.name || "N/A",
      (bk.test?.price || 0).toString(),
      bk.status === "Pending" ? "Schedule" : bk.status === "Completed" ? "Checked Out" : bk.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...csvData].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "diagnostic_bookings_report.csv";
    link.click();
  };

  const handleDownloadCopy = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const reportHtml = `
  <html>
        <head>
          <title>Diagnostic Bookings Report</title>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css">
          <style>
            body { padding: 40px; background: #fff; font-family: 'Inter', sans-serif; color: #1e293b; }
            th { background-color: #1e293b !important; color: #ffffff !important; text-transform: uppercase; font-size: 11px; font-weight: 700; border-color: #334155 !important; }
            td { font-size: 12px; vertical-align: middle; border-color: #e2e8f0 !important; color: #475569; }
            .fw-heavy { font-weight: 800; color: #0f172a; }
            .badge-custom { padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 10px; border: 1px solid #cbd5e1; background: #f8fafc; }
            @media print { body { padding: 1.5cm; } }
          </style>
        </head>
        <body>
          <div class="d-flex justify-content-between align-items-start mb-5 pb-4 border-bottom">
            <div>
              <h4 class="fw-bold mb-1 mt-1" style="color: #000; font-size: 24px;">DIAGNOSTIC BOOKINGS MASTER LEDGER</h4>
              <p class="text-primary small fw-bold mb-0">TOTAL RECORDS: ${filteredData.length}</p>
            </div>
          </div>
          <table class="table table-bordered shadow-sm">
            <thead>
              <tr>
                <th class="py-3 px-3 text-center">SR NO</th>
                <th class="py-3 px-3">DATE & TIME</th>
                <th class="py-3 px-3">PATIENT NAME</th>
                <th class="py-3 px-3">DIAGNOSTIC TEST</th>
                <th class="py-3 px-3 text-center">PRICE</th>
                <th class="py-3 px-3 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map((r, i) => `
                <tr style="background: ${i % 2 === 0 ? '#fcfcfc' : '#ffffff'};">
                  <td class="text-center fw-heavy">#${i + 1}</td>
                  <td class="fw-bold text-dark">${dayjs(r.scheduledAt).format("DD MMM YYYY, hh:mm A")}</td>
                  <td class="fw-heavy text-primary" style="font-size: 13px;">${r.patient ? r.patient.firstName + ' ' + r.patient.lastName : "N/A"}</td>
                  <td class="fw-bold">${r.test?.name}</td>
                  <td class="text-center fw-medium">₹${(r.test?.price || 0).toLocaleString("en-IN")}</td>
                  <td class="text-center"><span class="badge-custom text-uppercase">${r.status === "Pending" ? "Schedule" : r.status === "Completed" ? "Checked Out" : r.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    printWindow.document.write(reportHtml);
    printWindow.document.close();
  };

  const handleTestStatusToggle = async (bookingId: string, testId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    let updatedTestsList = [];
    if (Array.isArray(booking.testsList)) {
      updatedTestsList = booking.testsList.map((t: any) => {
        if (t.testId === testId) {
          return { ...t, status: t.status === "Completed" ? "Pending" : "Completed" };
        }
        return t;
      });
    } else {
      updatedTestsList = [{
        testId: booking.test?.id || testId,
        name: booking.test?.name || "Test",
        price: booking.test?.price || 0,
        status: booking.status === "Completed" || booking.status === "Checked Out" ? "Pending" : "Completed"
      }];
    }

    const totalCount = updatedTestsList.length;
    const completedCount = updatedTestsList.filter((t: any) => t.status === "Completed").length;

    let nextStatus = booking.status;
    if (completedCount === totalCount && totalCount > 0) {
      nextStatus = "Checked Out";
    } else if (booking.status === "Checked Out" || booking.status === "Completed") {
      nextStatus = "Checked In";
    }

    try {
      await updateBooking(bookingId, {
        testsList: updatedTestsList,
        status: nextStatus
      });
      setViewBooking((prev: any) => {
        if (prev && prev.id === bookingId) {
          return {
            ...prev,
            testsList: updatedTestsList,
            status: nextStatus
          };
        }
        return prev;
      });
      toast.success("Test completion status updated!");
    } catch (err: any) {
      toast.error("Failed to update test status.");
    }
  };

  const data = useMemo(() => {
    return filteredData.map((bk, index) => {
      const tests = getBookingTests(bk).map((t: any) => ({
        ...t,
        bookingId: bk.id,
        bookingCode: bk.bookingCode,
        scheduledAt: bk.scheduledAt,
      }));
      const isMultiple = tests.length >= 2;
      const testNames = tests.length > 0 ? tests.map((t: any) => t.name).join(", ") : "—";
      const categoryNames =
        tests.length > 0
          ? Array.from(new Set(tests.map((t: any) => t.categoryName).filter(Boolean))).join(", ") || "—"
          : "—";
      const priceAmount = tests.reduce((acc: number, t: any) => acc + (Number(t.price) || 0), 0);

      return {
        key: bk.id,
        id: bk.id,
        S_No: index + 1,
        BookingCode: bk.bookingCode || "—",
        Patient: bk.patient ? `${bk.patient.firstName} ${bk.patient.lastName}` : "—",
        PatientCode: bk.patient?.patientCode || "",
        Test: testNames,
        Category: categoryNames,
        Date_Time: dayjs(bk.scheduledAt).format("DD MMM YYYY, hh:mm A"),
        Price: `₹${priceAmount.toLocaleString("en-IN")}`,
        Status:
          bk.status === "Pending"
            ? "Schedule"
            : bk.status === "Completed"
              ? "Checked Out"
              : bk.status,
        testCount: tests.length,
        canExpand: isMultiple,
        tests,
        allBookings: [bk],
        raw: bk,
      };
    });
  }, [filteredData]);

  const renderExpandedRow = useCallback((record: (typeof data)[0]) => {
    const tests = record.tests || getBookingTests(record.raw);
    const showBookingCol = (record.allBookings?.length || 0) > 1;
    return (
      <div className="pathlab-booking-expanded p-2">
        <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
          <span className="fw-bold text-dark fs-13">
            <i className="ti ti-test-pipe me-1 text-primary" />
            Booked Diagnostic Tests for {record.Patient}
          </span>
          <span className="badge bg-soft-primary text-primary fw-bold">
            {tests.length} Test{tests.length !== 1 ? "s" : ""}
          </span>
        </div>

        {tests.length === 0 ? (
          <div className="text-center py-3 text-muted fs-13">No tests found for this booking.</div>
        ) : (
          <div className="table-responsive border rounded mb-2">
            <table className="table table-bordered table-sm align-middle mb-0 fs-13">
              <thead style={{ background: "#E6E6FF" }}>
                <tr>
                  <th style={{ width: 50 }}>#</th>
                  {showBookingCol && <th>Booking</th>}
                  <th>Test Name</th>
                  <th>Category</th>
                  <th className="text-center">Price (₹)</th>
                  <th className="text-center">Status</th>
                  {user?.role !== "PATIENT" && record.Status !== "Schedule" && (
                    <th className="text-center">Mark Done</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {tests.map((t: any, idx: number) => {
                  const isDone = t.status === "Completed";
                  const bookingId = t.bookingId || record.id;
                  return (
                    <tr key={t.testId || `${record.id}-${idx}`}>
                      <td className="fw-semibold text-muted">{idx + 1}</td>
                      {showBookingCol && (
                        <td className="fw-bold text-primary fs-12">{t.bookingCode || "—"}</td>
                      )}
                      <td className="fw-bold text-dark">{t.name || "—"}</td>
                      <td className="text-muted">{t.categoryName || "—"}</td>
                      <td className="text-center fw-bold">
                        ₹{Number(t.price || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="text-center">
                        <span
                          className={`badge rounded-pill px-2 py-1 ${
                            isDone ? "bg-soft-success text-success" : "bg-soft-warning text-warning"
                          }`}
                        >
                          {isDone ? "Completed" : "Pending"}
                        </span>
                      </td>
                      {user?.role !== "PATIENT" && record.Status !== "Schedule" && (
                        <td className="text-center">
                          <div className="form-check form-switch d-inline-flex justify-content-center m-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              role="switch"
                              checked={isDone}
                              onChange={() => handleTestStatusToggle(bookingId, t.testId)}
                              style={{ cursor: "pointer" }}
                            />
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="d-flex flex-wrap align-items-center gap-4 pt-1">
          <div>
            <span className="text-muted fs-11 fw-semibold d-block">TOTAL TESTS</span>
            <strong className="text-dark fs-14">{tests.length}</strong>
          </div>
          <div>
            <span className="text-muted fs-11 fw-semibold d-block">TOTAL AMOUNT</span>
            <strong className="text-dark fs-14">{record.Price}</strong>
          </div>
          <div>
            <span className="text-muted fs-11 fw-semibold d-block">COMPLETED</span>
            <strong className="text-success fs-14">
              {tests.filter((t: any) => t.status === "Completed").length}/{tests.length}
            </strong>
          </div>
        </div>
      </div>
    );
  }, [user?.role]);

  const columns = [
    { title: "S.No", dataIndex: "S_No", render: (text: number) => <span className="text-dark fw-semibold">{text}</span>, sorter: (a: any, b: any) => a.S_No - b.S_No, width: 70 },
    { title: "Booking Code", dataIndex: "BookingCode", render: (text: string) => <span className="text-primary fw-bold">{text}</span>, sorter: (a: any, b: any) => a.BookingCode.localeCompare(b.BookingCode) },
    {
      title: "Patient", dataIndex: "Patient",
      render: (text: string, record: any) => (
        <div className="d-flex flex-column">
          <span className="text-dark fw-bold">{text}</span>
          <span className="text-muted fs-11">{record.PatientCode}</span>
        </div>
      ),
      sorter: (a: any, b: any) => a.Patient.localeCompare(b.Patient),
    },
    {
      title: "Diagnostic Test", dataIndex: "Test",
      render: (text: string, record: any) => (
        <div className="d-flex flex-column">
          {record.canExpand ? (
            <button
              type="button"
              className="badge bg-soft-primary text-primary fw-bold border-0 align-self-start mb-1"
              onClick={() => toggleExpandBooking(record.key)}
            >
              <i className="ti ti-test-pipe me-1" />
              {record.testCount} Tests {expandedBookingIds.includes(record.key) ? "▲" : "▼"}
            </button>
          ) : (
            <span className="text-dark fw-medium text-wrap" style={{ maxWidth: "240px" }}>{text}</span>
          )}
          <span className="text-muted fs-11" style={{ opacity: 0.85 }}>
            {record.canExpand ? "Click + to view all tests" : `Category: ${record.Category}`}
          </span>
        </div>
      ),
      sorter: (a: any, b: any) => a.Test.localeCompare(b.Test),
    },
    { title: "Date & Time", dataIndex: "Date_Time", render: (text: string) => <span className="text-dark">{text}</span>, sorter: (a: any, b: any) => new Date(a.raw.scheduledAt).getTime() - new Date(b.raw.scheduledAt).getTime() },
    { title: "Price", dataIndex: "Price", render: (text: string) => <span className="text-dark fw-bold">{text}</span>, sorter: (a: any, b: any) => {
      const pa = a.tests?.reduce((s: number, t: any) => s + (Number(t.price) || 0), 0) || 0;
      const pb = b.tests?.reduce((s: number, t: any) => s + (Number(t.price) || 0), 0) || 0;
      return pa - pb;
    }},
    {
      title: "Status", dataIndex: "Status",
      render: (text: string, record: any) => {
        const raw = record.raw;
        const isMultiple = record.canExpand;
        const isSchedule = text === "Schedule";
        const totalTests = record.testCount || 1;
        const completedTests = isMultiple
          ? (record.tests || []).filter((t: any) => t.status === "Completed").length
          : (text === "Checked Out" || text === "Completed" ? 1 : 0);

        return (
          <div className="d-flex flex-column align-items-start gap-1">
            <span className={`badge ${statusBadgeClass(text)} px-2 py-1 text-uppercase`} style={{ fontSize: '10px' }}>
              {text}
            </span>
            {isMultiple && !isSchedule && (
              <span className="fw-bold text-muted small ms-1" style={{ fontSize: '11px' }}>
                {completedTests}/{totalTests}
              </span>
            )}
            {!isMultiple && user?.role !== "PATIENT" && ["Schedule", "Confirmed", "Checked In"].includes(text) && (
              <div className="form-check form-switch p-0 ms-1 mt-1" style={{ minHeight: 'auto' }}>
                <input
                  className="form-check-input ms-0"
                  type="checkbox"
                  role="switch"
                  checked={togglingId === raw.id}
                  onChange={() => handleStatusToggle(raw.id, text)}
                  style={{ cursor: 'pointer', width: '30px', height: '16px' }}
                  disabled={togglingId === raw.id}
                />
                <label className="text-black fw-bold small ms-1" style={{ fontSize: '10px' }}>
                  {text === "Schedule" ? "Confirm" : text === "Confirmed" ? "Checkin" : "Checkout"}
                </label>
              </div>
            )}
          </div>
        );
      },
      sorter: (a: any, b: any) => a.Status.localeCompare(b.Status),
    },
    {
      title: "Action", align: "center" as const, width: 150,
      render: (_: string, record: any) => {
        const isExpanded = expandedBookingIds.includes(record.key);
        return (
          <div className="d-flex align-items-center justify-content-center gap-2">
            <button className="bg-transparent border-0 text-info p-1" title="View" data-bs-toggle="modal" data-bs-target="#view_booking" onClick={() => setViewBooking(record.raw)}><i className="ti ti-eye fs-18"></i></button>
            <button className="bg-transparent border-0 text-secondary p-1" onClick={() => setPrintBooking(record.raw)} title="Print"><i className="ti ti-printer fs-18" /></button>
            {record.canExpand && (
              <button
                type="button"
                className={`bg-transparent border-0 p-1 ${isExpanded ? "text-dark" : "text-warning"}`}
                title={isExpanded ? "Hide tests" : "View all tests"}
                onClick={() => toggleExpandBooking(record.key)}
              >
                <i className={`ti ti-${isExpanded ? "chevron-up" : "list-details"} fs-18`} />
              </button>
            )}
            {user?.role !== "PATIENT" && (
              <>
                <button className="bg-transparent border-0 text-primary p-1" title="Edit Booking" onClick={() => handleOpenEdit(record.raw)}><i className="ti ti-edit fs-18"></i></button>
                <button className="bg-transparent border-0 text-danger p-1" title="Delete" onClick={() => handleOpenDelete(record.raw)}><i className="ti ti-trash fs-18"></i></button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  const expandableConfig = useMemo(
    () => ({
      expandedRowKeys: expandedBookingIds,
      onExpand: (_expanded: boolean, record: any) => {
        if (record.canExpand) toggleExpandBooking(record.key);
      },
      rowExpandable: (record: any) => !!record.canExpand,
      expandedRowRender: renderExpandedRow,
      expandIcon: ({ expanded, onExpand, record }: any) => {
        if (!record.canExpand) {
          return <span style={{ display: "inline-block", width: 28 }} />;
        }
        return (
          <button
            type="button"
            className="btn btn-sm d-inline-flex align-items-center justify-content-center p-0"
            title={expanded ? "Hide tests" : "View booked tests"}
            onClick={(e) => onExpand(record, e)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: "1px solid #bfdbfe",
              background: "#eff6ff",
              color: "#2563eb",
            }}
          >
            <i className={`ti ti-${expanded ? "minus" : "plus"} fs-14`} />
          </button>
        );
      },
    }),
    [expandedBookingIds, renderExpandedRow]
  );

  return (
    <>
      <style>{`
        ${customSelectStyles}
        .pathlab-booking-expanded thead th {
          background: #E6E6FF !important;
          color: #1e293b !important;
          font-weight: 700 !important;
        }
      `}</style>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center flex-wrap pb-3 mb-3 border-bottom gap-2">
            <h4 className="fw-bold mb-0 me-2 flex-shrink-0">{user?.role === "DOCTOR" || user?.role === "PATIENT" ? "Diagnostic Appointment" : "Diagnostic Booking"}</h4>
            {["All", "Schedule", "Confirmed", "Checked In"].map((s) => (
              <button
                key={s}
                className={`btn btn-sm ${filterStatus === s || (s === "All" && filterStatus === "") ? "btn-primary shadow-sm" : "btn-light border bg-white"} py-1 px-2 fs-12 fw-bold flex-shrink-0 d-flex align-items-center gap-1`}
                onClick={() => setFilterStatus(s)}
                style={{ borderRadius: '6px', height: '36px' }}
              >
                {s}
                <span className={`badge ${filterStatus === s || (s === "All" && filterStatus === "") ? "bg-white text-primary" : "bg-light text-dark"} ms-1`}>
                  {s === "All" ? counts.all : s === "Schedule" ? counts.schedule : s === "Confirmed" ? counts.confirmed : s === "Checked In" ? counts.checkedIn : 0}
                </span>
              </button>
            ))}

            <div className="search-field position-relative ms-1" style={{ width: "110px" }}>
              <IconFormControl fieldLabel="search" type="text" className="fs-13" style={{ height: '36px', paddingLeft: '8px', paddingRight: '8px' }} placeholder="Search..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
            </div>



            <div className="d-flex align-items-center gap-2 ms-auto flex-shrink-0">
              {(filterStatus !== "All" || filterPatient !== "" || filterDoctor !== "" || filterSlot !== "" || datePreset !== "All" || filterDate !== "" || searchText !== "") ? (
                <button
                  className="btn btn-soft-danger d-flex align-items-center justify-content-center"
                  style={{ height: '36px', borderRadius: '6px', fontWeight: 'bold' }}
                  onClick={() => {
                    setFilterStatus("All");
                    setFilterPatient("");
                    setFilterDoctor("");
                    setFilterSlot("");
                    setDatePreset("All");
                    setFilterDate("");
                    setSearchText("");
                  }}
                >
                  <i className="ti ti-refresh me-2 fs-14" /> Clear
                </button>
              ) : (
                <button className="btn d-flex align-items-center justify-content-center" style={{ height: "36px", borderRadius: '6px', fontWeight: 'bold', backgroundColor: '#fff', borderColor: '#6366f1', color: '#6366f1', border: '1px solid #6366f1' }} data-bs-toggle="offcanvas" data-bs-target="#filter_drawer">
                  <i className="ti ti-filter me-2 fs-14" /> Filters
                </button>
              )}
              <button className="btn btn-primary d-flex align-items-center justify-content-center" style={{ height: "36px", whiteSpace: "nowrap", borderRadius: '6px', fontWeight: 'bold' }} onClick={handleOpenAdd}>
                <i className="fa fa-plus me-2 fs-14" /> New Booking
              </button>
            </div>
          </div>

          {user?.role === "PATIENT" && (
            <div className="alert alert-warning border-0 shadow-sm d-flex align-items-center mb-4 p-3" style={{ borderRadius: '8px', backgroundColor: '#fffbeb', color: '#b45309' }}>
              <i className="ti ti-info-circle me-3 fs-22" style={{ color: '#d97706' }} />
              <div>
                <strong className="d-block fw-bold mb-0.5" style={{ fontSize: '14px' }}>Appointment Status Details</strong>
                <span className="fs-13">Your appointment has been scheduled. Please speak with the clinic owner to get it confirmed.</span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-5"><span className="spinner-border text-primary" role="status" /><p className="text-muted mt-2 mb-0">Loading bookings...</p></div>
          ) : bookings.length === 0 ? (
            <div className="border rounded bg-white"><EmptyState title="No bookings yet" message="Create your first diagnostic booking." /></div>
          ) : (
            <div className="table-responsive">
              <Datatable
                columns={columns}
                dataSource={data}
                Selection={user?.role !== "PATIENT"}
                searchText={searchText}
                onSelectionChange={(keys) => setSelectedIds(keys as string[])}
                expandable={expandableConfig}
              />
            </div>
          )}

          {user?.role !== "PATIENT" && selectedIds.length > 0 && (
            <div className="d-flex justify-content-center pt-4 pb-4 sticky-delete-bar">
              <button className="btn btn-danger d-flex align-items-center gap-2 px-4 py-2 shadow" onClick={handleBulkDelete} disabled={submitting} style={{ borderRadius: "8px", minHeight: "42px", fontWeight: "bold" }}>
                <i className="ti ti-trash fs-18"></i> Delete Selected ({selectedIds.length})
              </button>
            </div>
          )}
        </div>
        <div className="footer text-center bg-white p-2 border-top"><p className="text-dark mb-0">2025 <Link to="#" className="link-primary">Docyari</Link>, All Rights Reserved</p></div>
      </div>

      {/* FORM MODAL (ADD & EDIT) */}
      {showFormModal && !showAddPatientModal && (
        <div className="modal fade show d-block" style={{ zIndex: 1050 }}>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={() => setShowFormModal(false)} />
          <div className="modal-dialog modal-dialog-centered modal-lg" style={{ zIndex: 1050 }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'visible' }}>
              <div className="modal-header bg-primary text-white" style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}><h5 className="modal-title text-white">{formMode === "add" ? "New Diagnostic Booking" : "Edit Diagnostic Booking"}</h5><button type="button" className="btn-close btn-close-white" onClick={() => setShowFormModal(false)}></button></div>
              <form onSubmit={handleFormSubmit}>
                <div className="modal-body p-4">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label fw-semibold mb-0">Patient <span className="text-danger">*</span></label>
                        {user?.role !== "PATIENT" && (
                          <button type="button" className="btn btn-primary btn-sm d-flex align-items-center py-1 px-2" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAddPatientModal(true); }}>
                            <i className="ti ti-plus me-1" /> Add New
                          </button>
                        )}
                      </div>
                      <CommonSelect
                        options={patientOptions}
                        value={selectedPatientOption}
                        onChange={(option: any) => setFormPatientId(option ? option.value : "")}
                        placeholder="Select Patient"
                        isDisabled={user?.role === "PATIENT"}
                        styles={{
                          control: (base: any, state: any) => ({
                            ...base,
                            minHeight: "38px",
                            height: "38px",
                            borderRadius: "6px",
                            border: state.isDisabled
                              ? "1px solid #cbd5e1"
                              : state.isFocused
                                ? "1px solid #86b7fe"
                                : "1px solid #dee2e6",
                            boxShadow: state.isFocused ? "0 0 0 0.25rem rgba(13, 110, 253, 0.25)" : "none",
                            fontSize: "14px",
                            transition: "all 0.2s ease-in-out",
                            "&:hover": {
                              border: state.isDisabled ? "1px solid #cbd5e1" : "1px solid #86b7fe",
                            }
                          }),
                          valueContainer: (base: any) => ({
                            ...base,
                            padding: "0 6px",
                            height: "36px",
                          }),
                          indicatorsContainer: (base: any) => ({
                            ...base,
                            height: "36px",
                          }),
                        }}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Category Filter</label>
                      <select className="form-select" value={formCategoryId} onChange={(e) => handleCategoryChange(e.target.value)}>
                        <option value="">All Categories</option>
                        {allCategories.filter(c => c.status === "Active").map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Select Diagnostic Tests <span className="text-danger">*</span></label>
                      <div className="position-relative" ref={testDropdownRef}>
                        <button 
                          type="button"
                          className="form-select text-start d-flex align-items-center justify-content-between text-truncate bg-white"
                          onClick={() => setShowTestListDropdown(!showTestListDropdown)}
                          style={{ minHeight: '38px' }}
                        >
                          <span className="text-muted fw-semibold">
                            {formTestsList.length > 0 ? `${formTestsList.length} Test(s) Added` : "Select Tests..."}
                          </span>
                        </button>
                        
                        {showTestListDropdown && (
                          <div className="dropdown-menu show w-100 shadow border-0 py-2 px-1 mt-1 bg-white" style={{ maxHeight: '260px', overflowY: 'auto', zIndex: 1060 }}>
                            {filteredTests.length === 0 ? (
                              <div className="text-center text-muted py-2 small">No tests found in this category</div>
                            ) : (
                              filteredTests.map((t) => {
                                const isAdded = formTestsList.some(item => item.testId === t.id);
                                return (
                                  <div 
                                    key={t.id}
                                    className="dropdown-item py-2 px-2.5 rounded d-flex align-items-center justify-content-between cursor-pointer mb-0.5"
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevents the dropdown from closing on select!
                                      if (isAdded) {
                                        setFormTestsList(prev => prev.filter(item => item.testId !== t.id));
                                      } else {
                                        handleAddTest(t.id);
                                      }
                                    }}
                                    style={{ 
                                      backgroundColor: isAdded ? '#eef2ff' : 'transparent',
                                      color: isAdded ? '#4f46e5' : '#1e293b'
                                    }}
                                  >
                                    <div className="d-flex align-items-center gap-2">
                                      <input 
                                        type="checkbox" 
                                        checked={isAdded}
                                        onChange={() => {}} // toggled via parent div onClick
                                        className="form-check-input mt-0 border-secondary"
                                        style={{ cursor: 'pointer' }}
                                      />
                                      <span className="fw-semibold fs-12.5">{t.name}</span>
                                    </div>
                                    <span className={`badge ${isAdded ? 'bg-primary text-white' : 'bg-light text-dark'} fw-bold`}>₹{t.price}</span>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Total Price (₹)</label>
                      <IconFormControl fieldLabel="Amount" type="text" className="bg-light fw-bold text-dark" value={`₹${totalAmount.toLocaleString("en-IN")}`} disabled />
                    </div>
                  </div>

                  {/* Selected Tests Ledger with individual doctor/staff assignment dropdowns */}
                  {formTestsList.length > 0 && (
                    <div className="row">
                      <div className="col-md-12 mb-3">
                        <label className="form-label fw-bold text-dark fs-12 mb-2">SELECTED TESTS & ASSIGNED PRACTITIONERS ({formTestsList.length})</label>
                        <div className="table-responsive border rounded bg-white">
                          <table className="table table-sm align-middle mb-0" style={{ fontSize: '12px' }}>
                            <thead className="bg-light">
                              <tr>
                                <th className="px-3 py-2 text-start">Test Name</th>
                                <th className="px-3 py-2 text-start" style={{ width: '280px' }}>Assign Doctor / Staff</th>
                                <th className="px-3 py-2 text-center" style={{ width: '90px' }}>Price</th>
                                <th className="px-3 py-2 text-center" style={{ width: '45px' }}>Remove</th>
                              </tr>
                            </thead>
                            <tbody>
                              {formTestsList.map((t, idx) => {
                                const testObj = allTests.find(item => item.id === t.testId);
                                return (
                                  <tr key={t.testId || idx}>
                                    <td className="px-3 py-2 fw-semibold text-dark text-start">{t.name}</td>
                                    <td className="px-3 py-2 text-start">
                                      {user?.role === "DOCTOR" && user?.doctorId ? (
                                        <span className="small fw-semibold text-dark">
                                          Dr. {doctors.find((d: any) => d.id === user.doctorId)?.fullName || "Me"}
                                        </span>
                                      ) : (
                                        <select 
                                          className="form-select form-select-sm"
                                          value={t.assignedUserId || ""}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setFormTestsList(prev => prev.map(item => {
                                              if (item.testId === t.testId) {
                                                return { ...item, assignedUserId: val };
                                              }
                                              return item;
                                            }));
                                          }}
                                        >
                                          <option value="">Auto / Any Available</option>
                                          {testObj?.assignedDoctors?.map((d: any) => (
                                            <option key={d.value} value={d.value}>Dr. {d.label} (Doctor)</option>
                                          ))}
                                          {testObj?.assignedStaff?.map((s: any) => (
                                            <option key={s.value} value={s.value}>{s.label} (Staff)</option>
                                          ))}
                                        </select>
                                      )}
                                    </td>
                                    <td className="px-3 py-2 fw-bold text-dark text-center">₹{(t.price || 0).toLocaleString("en-IN")}</td>
                                    <td className="px-3 py-2 text-center">
                                      <button 
                                        type="button" 
                                        className="btn btn-sm btn-link text-danger p-0 border-0"
                                        onClick={() => setFormTestsList(prev => prev.filter(item => item.testId !== t.testId))}
                                      >
                                        <i className="ti ti-trash fs-14" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Referred By</label>
                      <IconFormControl fieldLabel="doctor" type="text" value={formReferredBy} onChange={(e) => setFormReferredBy(e.target.value)} placeholder="e.g. Dr. Amit Sharma, Self" />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-12 mb-3">
                      <label className="form-label fw-semibold">Remarks</label>
                      <IconTextarea fieldLabel="notes" rows={2} value={formRemarks} onChange={(e) => setFormRemarks(e.target.value)} placeholder="Any special notes or remarks..." />
                    </div>
                  </div>
                  <hr className="my-2" />
                  <h6 className="fw-bold mb-3 mt-2">Schedule & Slot</h6>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold d-block">Booking Date <span className="text-danger">*</span></label>
                      <DatePicker
                        format="YYYY-MM-DD"
                        className="form-control py-2 fs-14"
                        value={formDate}
                        onChange={(d) => { setFormDate(d); setFormSessionSlot(""); }}
                        disabledDate={disabledDate}
                        cellRender={cellRender}
                        disabled={formTestsList.length === 0}
                        placeholder={formTestsList.length === 0 ? "Select test first" : "Select Date"}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      {selectedTestObj?.isSlotBookingEnabled ? (
                        <div className="position-relative" ref={diagDropdownRef}>
                          <label className="form-label fw-semibold mb-1">
                            Booking Slot <span className="text-danger">*</span>
                          </label>
                          <div
                            onClick={() => {
                              if (formDate && dateOptions.length > 0) {
                                setShowDiagSlotsDropdown(!showDiagSlotsDropdown);
                              }
                            }}
                            onFocus={() => setIsDiagSlotsDropdownFocused(true)}
                            onBlur={() => setIsDiagSlotsDropdownFocused(false)}
                            tabIndex={0}
                            className="form-control d-flex align-items-center justify-content-between"
                            style={{
                              minHeight: "38px",
                              borderRadius: "6px",
                              border: isDiagSlotsDropdownFocused || showDiagSlotsDropdown ? "1px solid #2e37a4" : "1px solid #dee2e6",
                              boxShadow: isDiagSlotsDropdownFocused || showDiagSlotsDropdown ? "0 0 0 1px #2e37a4" : "none",
                              fontSize: "14px",
                              padding: "6px 12px",
                              cursor: !formDate || dateOptions.length === 0 ? "not-allowed" : "pointer",
                              backgroundColor: !formDate || dateOptions.length === 0 ? "#f8fafc" : "white",
                              transition: "all 0.2s ease-in-out",
                              outline: "none",
                            }}
                          >
                            <span className={formSessionSlot ? "text-dark fw-semibold" : "text-muted"}>
                              {!formDate
                                ? "Select date first"
                                : dateOptions.length === 0
                                  ? "No slots available on this day"
                                  : formSessionSlot
                                    ? formSessionSlot
                                    : "Select slot"}
                            </span>
                            <i className={`ti ti-chevron-${showDiagSlotsDropdown ? 'up' : 'down'} text-secondary`} style={{ fontSize: "11px" }} />
                          </div>

                          {showDiagSlotsDropdown && formDate && dateOptions.length > 0 && (
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
                                  {dateOptions.length} Options
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
                                {dateOptions.map((opt: any, idx: number) => {
                                  const isSelected = formSessionSlot === opt.value;
                                  const avail = slotAvailabilities[opt.value];
                                  const bookingsAvailable = avail ? Math.max(0, avail.limit - avail.booked) : 0;
                                  const isFilled = avail ? avail.isFull : true;
                                  const isLastSlot = bookingsAvailable === 1;

                                  let bg = "#ecfdf5"; // available
                                  let border = "#a7f3d0";
                                  let text = "#047857";
                                  let badgeText = `${bookingsAvailable} Left`;

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
                                        setFormSessionSlot(opt.value);
                                        setShowDiagSlotsDropdown(false);
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
                                        {opt.value}
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
                          <label className="form-label fw-semibold">Booking Session <span className="text-danger">*</span></label>
                          <select className="form-select" value={formSessionSlot} onChange={(e) => setFormSessionSlot(e.target.value)} disabled={!formDate || dateOptions.length === 0} required>
                            <option value="">Select Session</option>
                            {dateOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                  {user?.role !== "PATIENT" && (
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">Status <span className="text-danger">*</span></label>
                        <select className="form-select" value={formStatus} onChange={(e) => setFormStatus(e.target.value)} required>
                          <option value="Schedule">Schedule</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Checked In">Checked In</option>
                          <option value="Checked Out">Checked Out</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
                <div
                  className="modal-footer border-top-0"
                  style={{
                    background: 'linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)',
                    borderBottomLeftRadius: '16px',
                    borderBottomRightRadius: '16px',
                    padding: '16px 24px',
                    flexDirection: 'column',
                    gap: '14px',
                    alignItems: 'stretch',
                  }}
                >
                  {/* ── Billing Summary Bar ── */}
                  <div
                    className="d-flex align-items-center flex-wrap"
                    style={{ gap: '6px' }}
                  >
                    {/* Sub Total */}
                    <div
                      className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 bg-white border"
                      style={{ minWidth: '120px', flex: '0 0 auto' }}
                    >
                      <i className="ti ti-receipt text-muted" style={{ fontSize: '16px' }} />
                      <div>
                        <div className="text-muted" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase' }}>Subtotal</div>
                        <div className="fw-bold text-dark" style={{ fontSize: '15px', lineHeight: 1.2 }}>₹{totalAmount.toLocaleString("en-IN")}</div>
                      </div>
                    </div>

                    <i className="ti ti-minus text-muted" style={{ fontSize: '14px', opacity: 0.5 }} />

                    {/* Discount control — inline pill toggle + input */}
                    <div
                      className="d-flex align-items-center gap-0 rounded-3 bg-white border overflow-hidden"
                      style={{ flex: '0 0 auto', height: '52px' }}
                    >
                      {/* Label */}
                      <div className="px-3 border-end d-flex align-items-center" style={{ height: '100%', background: '#f8fafc' }}>
                        <i className="ti ti-tag text-primary" style={{ fontSize: '15px' }} />
                        <span className="ms-1 text-muted" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase' }}>Discount</span>
                      </div>

                      {/* Pill type toggle */}
                      <div
                        className="d-flex align-items-center mx-2 rounded-pill p-1"
                        style={{ background: '#f1f3f8', gap: '2px', height: '32px' }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setDiscountType("percent");
                            setFormDiscountPercent(totalAmount > 0 ? Math.round((formDiscountAmount / totalAmount) * 100) : 0);
                          }}
                          className="border-0 fw-bold rounded-pill"
                          style={{
                            fontSize: '11px',
                            padding: '2px 10px',
                            height: '24px',
                            background: discountType === "percent" ? '#3b82f6' : 'transparent',
                            color: discountType === "percent" ? '#fff' : '#6b7280',
                            transition: 'all 0.18s',
                            cursor: 'pointer',
                          }}
                        >
                          % Off
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDiscountType("amount");
                            setFormDiscountAmount(Math.round(totalAmount * (formDiscountPercent / 100)));
                          }}
                          className="border-0 fw-bold rounded-pill"
                          style={{
                            fontSize: '11px',
                            padding: '2px 10px',
                            height: '24px',
                            background: discountType === "amount" ? '#16a34a' : 'transparent',
                            color: discountType === "amount" ? '#fff' : '#6b7280',
                            transition: 'all 0.18s',
                            cursor: 'pointer',
                          }}
                        >
                          ₹ Flat
                        </button>
                      </div>

                      {/* Input */}
                      {discountType === "percent" ? (
                        <div className="d-flex align-items-center pe-3" style={{ gap: '4px' }}>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="form-control form-control-sm text-center fw-bold border-0 bg-transparent"
                            style={{ width: '58px', height: '32px', fontSize: '15px', padding: '2px 4px', outline: 'none', boxShadow: 'none' }}
                            value={formDiscountPercent}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setFormDiscountPercent(isNaN(val) ? 0 : Math.min(100, Math.max(0, val)));
                            }}
                          />
                          <span className="fw-bold text-muted" style={{ fontSize: '13px' }}>%</span>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center pe-3" style={{ gap: '3px' }}>
                          <span className="fw-bold text-muted" style={{ fontSize: '13px' }}>₹</span>
                          <input
                            type="number"
                            min="0"
                            max={totalAmount}
                            className="form-control form-control-sm text-center fw-bold border-0 bg-transparent"
                            style={{ width: '72px', height: '32px', fontSize: '15px', padding: '2px 4px', outline: 'none', boxShadow: 'none' }}
                            value={formDiscountAmount}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setFormDiscountAmount(isNaN(val) ? 0 : Math.min(totalAmount, Math.max(0, val)));
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Resolved discount badge */}
                    {resolvedDiscountAmount > 0 && (
                      <div
                        className="d-flex align-items-center gap-1 px-2 py-1 rounded-pill"
                        style={{ background: '#fef2f2', border: '1px solid #fecaca', flex: '0 0 auto' }}
                      >
                        <i className="ti ti-arrow-down text-danger" style={{ fontSize: '12px' }} />
                        <span className="fw-bold text-danger" style={{ fontSize: '13px' }}>-₹{resolvedDiscountAmount.toLocaleString("en-IN")}</span>
                      </div>
                    )}

                    <i className="ti ti-equal text-muted" style={{ fontSize: '14px', opacity: 0.5 }} />

                    {/* Final Amount */}
                    <div
                      className="d-flex align-items-center gap-2 px-3 py-2 rounded-3"
                      style={{
                        minWidth: '130px',
                        flex: '0 0 auto',
                        background: finalAmount > 0 ? 'linear-gradient(135deg,#dcfce7,#bbf7d0)' : '#f1f5f9',
                        border: `1px solid ${finalAmount > 0 ? '#86efac' : '#e2e8f0'}`,
                      }}
                    >
                      <i className="ti ti-cash text-success" style={{ fontSize: '16px' }} />
                      <div>
                        <div className="text-success" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase' }}>Final Amount</div>
                        <div className="fw-bold text-success" style={{ fontSize: '17px', lineHeight: 1.2 }}>₹{finalAmount.toLocaleString("en-IN")}</div>
                      </div>
                    </div>
                  </div>

                  {/* ── Action Buttons ── */}
                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-light border fw-semibold px-4"
                      style={{ borderRadius: '8px', fontSize: '13px' }}
                      onClick={() => setShowFormModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary fw-semibold px-5"
                      style={{ borderRadius: '8px', fontSize: '13px' }}
                      disabled={submitting}
                    >
                      {submitting
                        ? (formMode === "add" ? "Creating..." : "Updating...")
                        : (formMode === "add" ? <><i className="ti ti-plus me-1" />Create Booking</> : <><i className="ti ti-check me-1" />Update Booking</>)
                      }
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      <DeleteModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Booking?"
        message={<>Are you sure you want to delete <strong>{selectedBooking?.bookingCode}</strong>?</>}
        submitting={submitting}
      />

      {/* VIEW MODAL */}
      <ViewModal id="view_booking" title="Diagnostic Booking Details" subtitle="View booking details" headerIcon={<i className="ti ti-calendar-event" />}
        highlightTitle={viewBooking?.patient ? `${viewBooking.patient.firstName} ${viewBooking.patient.lastName}` : "Patient"}
        highlightStatus={
          <span className={`badge border ${statusBadgeClass(viewBooking?.status === "Pending" ? "Schedule" : viewBooking?.status === "Completed" ? "Checked Out" : viewBooking?.status || "Schedule")} fw-bold px-2 py-1`} style={{ fontSize: "10px", borderRadius: "10px" }}>
            <i className="ti ti-point-filled me-1"></i>{viewBooking?.status === "Pending" ? "Schedule" : viewBooking?.status === "Completed" ? "Checked Out" : viewBooking?.status || "Schedule"}
          </span>
        }
        highlightColor="#e0e7ff"
        details={[
          { icon: <i className="ti ti-hash" />, label: "Booking Code", value: viewBooking?.bookingCode || "--" },
          { icon: <i className="ti ti-user" />, label: "Patient", value: viewBooking?.patient ? `${viewBooking.patient.firstName} ${viewBooking.patient.lastName} (${viewBooking.patient.patientCode})` : "--", fullWidth: true },
          { icon: <i className="ti ti-phone" />, label: "Phone", value: viewBooking?.patient?.phone || "--" },
          {
            icon: <i className="ti ti-microscope" />,
            label: "Test(s)",
            value: Array.isArray(viewBooking?.testsList) && viewBooking.testsList.length > 0
              ? viewBooking.testsList.map((t: any) => t.name).join(", ")
              : (viewBooking?.test?.name || "--")
          },
          {
            icon: <i className="ti ti-tags" />,
            label: "Category",
            value: Array.isArray(viewBooking?.testsList) && viewBooking.testsList.length > 0
              ? Array.from(new Set(viewBooking.testsList.map((t: any) => t.categoryName))).join(", ")
              : (viewBooking?.test?.category?.name || "--")
          },
          { icon: <i className="ti ti-calendar" />, label: "Scheduled Date", value: viewBooking?.scheduledAt ? dayjs(viewBooking.scheduledAt).format("DD MMM YYYY") : "--" },
          { icon: <i className="ti ti-clock" />, label: "Time Slot/Session", value: viewBooking?.sessionSlot || (viewBooking?.scheduledAt ? dayjs(viewBooking.scheduledAt).format("hh:mm A") : "--") },
          { icon: <i className="ti ti-user-plus" />, label: "Assigned To", value: doctors?.find((d: any) => d.id === viewBooking?.assignedUserId)?.fullName || staff?.find((s: any) => s.id === viewBooking?.assignedUserId)?.fullName || "Auto / Any" },
          {
            icon: <i className="ti ti-currency-rupee" />,
            label: "Base Price",
            value: `₹${(
              Array.isArray(viewBooking?.testsList) && viewBooking.testsList.length > 0
                ? viewBooking.testsList.reduce((acc: number, t: any) => acc + (t.price || 0), 0)
                : (viewBooking?.test?.price || 0)
            ).toLocaleString("en-IN")}`
          },
          { icon: <i className="ti ti-tag" />, label: "Discount", value: `₹${(viewBooking?.discount || 0).toLocaleString("en-IN")}` },
          { icon: <i className="ti ti-cash" />, label: "Total Amount", value: `₹${(viewBooking?.totalAmount || 0).toLocaleString("en-IN")}` },
          { icon: <i className="ti ti-user-check" />, label: "Referred By", value: viewBooking?.referredBy || "--" },
          { icon: <i className="ti ti-file-description" />, label: "Remarks", value: viewBooking?.remarks || "--", fullWidth: true },
        ]}
        onEdit={() => { handleOpenEdit(viewBooking); }} editLabel="Edit Booking" editModalTarget=""
        children={
          (() => {
            const hasTests = Array.isArray(viewBooking?.testsList) && viewBooking.testsList.length > 0;
            if (!hasTests) return null;

            const getAssignedName = (assignedUserId?: string) => {
              if (!assignedUserId) return "Auto / Any";
              const doc = doctors.find((d: any) => d.id === assignedUserId);
              if (doc) return `Dr. ${doc.fullName}`;
              const stf = staff.find((s: any) => s.id === assignedUserId);
              if (stf) return stf.fullName;
              return "Auto / Any";
            };

            return (
              <div className="mt-4 border-top pt-3">
                <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                  <i className="ti ti-checklist text-primary fs-18" /> Tests Progress & Status Toggle
                </h6>
                <div className="table-responsive border rounded bg-light-subtle">
                  <table className="table table-sm table-nowrap align-middle mb-0" style={{ fontSize: '13px' }}>
                    <thead className="bg-light">
                      <tr>
                        <th className="px-3 py-2.5 text-start">Test Name</th>
                        <th className="px-3 py-2.5 text-start">Category</th>
                        <th className="px-3 py-2.5 text-start">Assigned Practitioner</th>
                        <th className="px-3 py-2.5 text-center" style={{ width: '150px' }}>Completion Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewBooking.testsList.map((t: any) => {
                        const isCompleted = t.status === "Completed";
                        return (
                          <tr key={t.testId}>
                            <td className="px-3 py-2.5 fw-semibold text-dark text-start">{t.name}</td>
                            <td className="px-3 py-2.5 text-muted text-start">{t.categoryName}</td>
                            <td className="px-3 py-2.5 text-start fw-medium text-dark">{getAssignedName(t.assignedUserId)}</td>
                            <td className="px-3 py-2.5 text-center">
                              {user?.role === "PATIENT" ? (
                                <span className={`badge bg-soft-${isCompleted ? 'success' : 'secondary'} text-${isCompleted ? 'success' : 'secondary'} px-2 py-1`}>
                                  {isCompleted ? "Completed" : "Pending"}
                                </span>
                              ) : (
                                <div className="form-check form-switch d-inline-block p-0" style={{ minHeight: 'auto' }}>
                                  <input
                                    className="form-check-input ms-0"
                                    type="checkbox"
                                    role="switch"
                                    checked={isCompleted}
                                    onChange={() => handleTestStatusToggle(viewBooking.id, t.testId)}
                                    style={{ cursor: 'pointer', width: '36px', height: '18px' }}
                                  />
                                  <span className={`fw-bold ms-1 text-${isCompleted ? 'success' : 'secondary'}`} style={{ fontSize: '11px' }}>
                                    {isCompleted ? "Completed" : "Pending"}
                                  </span>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()
        }
      />
      <AddPatientModal
        show={showAddPatientModal}
        onHide={() => setShowAddPatientModal(false)}
        onSuccess={(newPatient) => {
          setFormPatientId(newPatient.id);
        }}
      />

      {/* Advanced Filter Drawer */}
      <div className="offcanvas offcanvas-end" tabIndex={-1} id="filter_drawer" aria-labelledby="filter_drawer_label">
        <div className="offcanvas-header border-bottom">
          <h5 className="offcanvas-title fw-bold" id="filter_drawer_label">Advanced Filters</h5>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div className="offcanvas-body">
          <div className="mb-3">
            <label className="form-label fw-bold small text-uppercase">Patient</label>
            <select className="form-select fs-13" value={filterPatient} onChange={(e) => setFilterPatient(e.target.value)}>
              <option value="">All Patients</option>
              {patientList.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold small text-uppercase">Assigned Doctor/Staff</label>
            <select className="form-select fs-13" value={filterDoctor} onChange={(e) => setFilterDoctor(e.target.value)}>
              <option value="">All Assignees</option>
              {doctorList.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold small text-uppercase">Session Slot</label>
            <select className="form-select fs-13" value={filterSlot} onChange={(e) => setFilterSlot(e.target.value)}>
              <option value="">All Slots</option>
              {slotList.map(s => (
                <option key={s} value={s || ""}>{s}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold small text-uppercase">Category</label>
            <select className="form-select fs-13" value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setFilterTest(""); }}>
              <option value="">All Categories</option>
              {categoryList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold small text-uppercase">Diagnostic Test</label>
            <select className="form-select fs-13" value={filterTest} onChange={(e) => setFilterTest(e.target.value)}>
              <option value="">All Tests</option>
              {testList.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold small text-uppercase">Status</label>
            <select className="form-select fs-13" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="All">All Status</option>
              <option value="Schedule">Schedule</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Checked In">Checked In</option>
              <option value="Checked Out">Checked Out</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold small text-uppercase">Date Range</label>
            <select className="form-select fs-13 mb-2" value={datePreset} onChange={(e) => setDatePreset(e.target.value)}>
              <option value="All">All Dates</option>
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Custom">Choose Custom Date</option>
            </select>
            {datePreset === "Custom" && (
              <IconFormControl fieldLabel="Date" type="date" className="fs-13" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
            )}
          </div>

          <hr />

          <div className="d-grid gap-2">
            <button className="btn btn-soft-danger fw-bold py-2" onClick={() => {
              setFilterStatus("All"); setFilterPatient(""); setFilterDoctor(""); setFilterSlot(""); setDatePreset("All"); setFilterDate(""); setSearchText(""); setFilterCategory(""); setFilterTest("");
            }}>
              <i className="ti ti-refresh me-2" />Clear All Filters
            </button>
            <button className="btn btn-soft-info fw-bold py-2" onClick={handleDownloadCopy}><i className="ti ti-download me-2" />Download Ledger</button>
            <button className="btn btn-soft-success fw-bold py-2" onClick={handleExportCSV}><i className="ti ti-file-export me-2" />Export CSV</button>
          </div>
        </div>
      </div>

      {printBooking && (
        <div id="print-appointment" style={{ display: 'none' }}>
          <AppointmentPrintSlip appointment={printBooking} isDiagnostic={true} />
        </div>
      )}
    </>
  );
};

export default DiagnosticBooking;
