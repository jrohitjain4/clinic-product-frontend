import { useCallback, useEffect, useMemo, useState } from "react";
import { TimePicker } from "antd";
import dayjs from "dayjs";
import { Link } from "react-router";
import { Session } from "../../../../../core/common/selectOption";
import CommonSelect from "../../../../../core/common/common-select/commonSelect";
import { useClinicDoctors } from "../../../../../core/hooks/useClinicDoctors";
import { apiUrl } from "../../../../../core/config/api";
import { toast } from "react-toastify";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface SlotRow {
  id: number;
  session: string;
  from: string;
  to: string;
}

type ScheduleMap = Record<string, SlotRow[]>;

const emptySchedule = (): ScheduleMap =>
  Object.fromEntries(WEEKDAYS.map((d) => [d, [{ id: Date.now() + Math.random(), session: "Session 1", from: "", to: "" }]]));

const DoctorSchedules = () => {
  const { doctors, loading: loadingDoctors } = useClinicDoctors();
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [user, setUser] = useState<any>(null);

  // Initialize user
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Auto-select doctor ID from the list if current user is a doctor
  useEffect(() => {
    if (user?.role === "DOCTOR" && doctors.length > 0) {
      const currentDoctor = doctors.find(
        (d: any) =>
          d.email === user.email ||
          d.userId === user.id ||
          d.id === user.id
      );
      if (currentDoctor && currentDoctor.id !== selectedDoctorId) {
        setSelectedDoctorId(currentDoctor.id);
      }
    }
  }, [doctors, user, selectedDoctorId]);

  const [schedules, setSchedules] = useState<ScheduleMap>(emptySchedule());
  const [activeDay, setActiveDay] = useState("Monday");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const doctorOptions = useMemo(
    () => doctors.map((d: any) => ({ value: d.id, label: d.fullName })),
    [doctors]
  );

  const selectedDoctor = useMemo(
    () => doctors.find((d: any) => d.id === selectedDoctorId),
    [doctors, selectedDoctorId]
  );

  // Load schedule when doctor changes
  const loadSchedule = useCallback(async () => {
    if (!selectedDoctorId) {
      setSchedules(emptySchedule());
      return;
    }
    setLoadingSchedule(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl(`/api/doctors/${selectedDoctorId}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to load doctor");
      const data = await res.json();

      let parsed: any = data.schedules;
      if (typeof parsed === "string") {
        try { parsed = JSON.parse(parsed); } catch { parsed = {}; }
      }
      if (!parsed || typeof parsed !== "object") parsed = {};

      const newSchedule: ScheduleMap = {};
      for (const day of WEEKDAYS) {
        const slots = parsed[day];
        if (Array.isArray(slots) && slots.length > 0) {
          newSchedule[day] = slots.map((s: any, idx: number) => ({
            id: Date.now() + idx + Math.random(),
            session: s.session || s.label || `Session ${idx + 1}`,
            from: s.from || s.startTime || "",
            to: s.to || s.endTime || "",
          }));
        } else {
          newSchedule[day] = [];
        }
      }
      setSchedules(newSchedule);
      setEditing(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to load schedule");
    } finally {
      setLoadingSchedule(false);
    }
  }, [selectedDoctorId]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // Add / Delete rows
  const addSlot = (day: string) => {
    setSchedules((prev) => ({
      ...prev,
      [day]: [...(prev[day] || []), { id: Date.now() + Math.random(), session: `Session ${(prev[day]?.length || 0) + 1}`, from: "", to: "" }],
    }));
  };

  const deleteSlot = (day: string, id: number) => {
    setSchedules((prev) => ({
      ...prev,
      [day]: prev[day].filter((s) => s.id !== id),
    }));
  };

  const updateSlot = (day: string, id: number, field: "session" | "from" | "to", value: string) => {
    setSchedules((prev) => ({
      ...prev,
      [day]: prev[day].map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    }));
  };

  // Save schedule
  const handleSave = async () => {
    if (!selectedDoctorId) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const payload: any = {};
      for (const day of WEEKDAYS) {
        const slots = schedules[day] || [];
        if (slots.length > 0 && slots.some((s) => s.from && s.to)) {
          payload[day] = slots
            .filter((s) => s.from && s.to)
            .map((s) => ({ session: s.session, from: s.from, to: s.to }));
        }
      }
      const res = await fetch(apiUrl(`/api/doctors/${selectedDoctorId}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ schedules: payload }),
      });
      if (!res.ok) throw new Error("Failed to save schedule");
      toast.success("Schedule saved successfully!");
      setEditing(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save schedule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="row g-2">
          <div className="col-lg-12">
            {/* Page Header */}
            <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3 pb-3 border-bottom">
              <div className="flex-grow-1">
                <h4 className="fw-bold mb-0">Doctor Schedule</h4>
              </div>
              <div className="text-end d-flex gap-2">
                {user?.role === "DOCTOR" && selectedDoctorId && (
                  <div className="d-flex gap-2">
                    {!editing ? (
                      <button className="btn btn-primary d-flex align-items-center gap-1 shadow-sm px-3" onClick={() => setEditing(true)}>
                        <i className="ti ti-edit fs-16" /> Edit My Schedule
                      </button>
                    ) : (
                      <>
                        <button className="btn btn-success d-flex align-items-center gap-1 shadow-sm px-3" onClick={handleSave} disabled={saving}>
                          {saving ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="ti ti-device-floppy fs-16" />}
                          Save Changes
                        </button>
                        <button className="btn btn-light border shadow-sm" onClick={() => { setEditing(false); loadSchedule(); }}>
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                )}
                <div className="dropdown">
                  <Link
                    to="#"
                    className="btn btn-md fs-14 fw-normal border bg-white rounded text-dark d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Export <i className="ti ti-chevron-down ms-2" />
                  </Link>
                  <ul className="dropdown-menu p-2">
                    <li><Link className="dropdown-item" to="#">Download as PDF</Link></li>
                    <li><Link className="dropdown-item" to="#">Download as Excel</Link></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Select Doctor Card (Admin only) */}
            {user?.role !== "DOCTOR" && (
              <div className="card mb-3 shadow-sm border-0">
                <div className="card-body py-3">
                  <div className="row align-items-end g-3">
                    <div className="col-lg-6 col-md-8">
                      <label className="form-label fw-semibold mb-1">Select Doctor</label>
                      <CommonSelect
                        options={doctorOptions}
                        className="select"
                        placeholder={loadingDoctors ? "Loading doctors…" : "Choose a doctor to view/edit schedule"}
                        isDisabled={loadingDoctors}
                        value={doctorOptions.find((o: any) => o.value === selectedDoctorId) || null}
                        onChange={(opt: any) => setSelectedDoctorId(opt?.value || "")}
                      />
                    </div>
                    {selectedDoctorId && (
                      <div className="col-auto d-flex gap-2">
                        {!editing ? (
                          <button
                            className="btn btn-outline-primary d-flex align-items-center gap-1"
                            onClick={() => setEditing(true)}
                          >
                            <i className="ti ti-edit fs-16" /> Edit Schedule
                          </button>
                        ) : (
                          <>
                            <button
                              className="btn btn-primary d-flex align-items-center gap-1"
                              onClick={handleSave}
                              disabled={saving}
                            >
                              {saving ? (
                                <><span className="spinner-border spinner-border-sm me-1" /> Saving…</>
                              ) : (
                                <><i className="ti ti-device-floppy fs-16" /> Save Schedule</>
                              )}
                            </button>
                            <button
                              className="btn btn-light border"
                              onClick={() => { setEditing(false); loadSchedule(); }}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Schedule Display */}
            {!selectedDoctorId ? (
              <div className="card">
                <div className="card-body text-center py-5">
                  <i className="ti ti-calendar-event fs-1 text-muted d-block mb-2" />
                  <h6 className="fw-bold text-muted">Select a doctor above</h6>
                  <p className="text-muted mb-0">Choose a doctor from the dropdown to view or edit their weekly schedule.</p>
                </div>
              </div>
            ) : loadingSchedule ? (
              <div className="card">
                <div className="card-body text-center py-5">
                  <span className="spinner-border text-primary" role="status" />
                  <p className="text-muted mt-2 mb-0">Loading schedule…</p>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="card-body">
                  {/* Doctor Info Banner */}
                  {selectedDoctor && (
                    <div className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom">
                      <img
                        src={(selectedDoctor as any).profileImage || "/assets/img/doctor-placeholder.png"}
                        alt={(selectedDoctor as any).fullName}
                        className="rounded-circle border"
                        style={{ width: 50, height: 50, objectFit: "cover" }}
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/assets/img/doctor-placeholder.png"; }}
                      />
                      <div>
                        <h6 className="fw-bold mb-0">{(selectedDoctor as any).fullName}</h6>
                        <span className="text-muted fs-13">
                          {(selectedDoctor as any).department?.name || "—"} · {(selectedDoctor as any).designation?.name || "Doctor"}
                        </span>
                      </div>
                      <span className={`badge ms-auto ${(selectedDoctor as any).status === "Active" ? "badge-soft-success" : "badge-soft-danger"}`}>
                        {(selectedDoctor as any).status === "Active" ? "Available" : "Unable"}
                      </span>
                    </div>
                  )}

                  <h6 className="fw-bold mb-3">Weekly Schedule</h6>

                  {/* Day Tabs */}
                  <ul className="nav nav-pills schedule-tab mb-3 gap-2">
                    {WEEKDAYS.map((day) => {
                      const hasSlots = (schedules[day] || []).some((s) => s.from && s.to);
                      return (
                        <li key={day} className="nav-item">
                          <button
                            className={`nav-link border fw-bold px-4 py-2 ${activeDay === day ? "active shadow-sm" : "bg-white text-dark"}`}
                            type="button"
                            onClick={() => setActiveDay(day)}
                            style={{ borderRadius: '10px', minWidth: '120px' }}
                          >
                            {day}
                            {hasSlots && <i className="ti ti-circle-check-filled ms-2 text-white fs-12" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Day Content */}
                  <div className="add-schedule-list">
                    {(schedules[activeDay] || []).length === 0 ? (
                      <div className="text-center py-4 border rounded bg-light mb-3">
                        <p className="text-muted mb-2">No schedule set for {activeDay}</p>
                        {editing && (
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => addSlot(activeDay)}
                          >
                            <i className="ti ti-plus me-1" /> Add Session
                          </button>
                        )}
                      </div>
                    ) : (
                      (schedules[activeDay] || []).map((row, idx) => (
                        <div className="row gx-3 align-items-end" key={row.id}>
                          <div className="col-xl-4 col-lg-6 col-md-6 col-12">
                            <div className="mb-3">
                              <label className="form-label">Session</label>
                              {editing ? (
                                <CommonSelect
                                  options={Session}
                                  className="select"
                                  defaultValue={Session.find((s: any) => s.value === row.session) || Session[0]}
                                  onChange={(opt: any) => updateSlot(activeDay, row.id, "session", opt?.value || "Session 1")}
                                />
                              ) : (
                                <input className="form-control" value={row.session} disabled />
                              )}
                            </div>
                          </div>
                          <div className="col-xl-3 col-lg-6 col-md-6 col-12">
                            <div className="mb-3">
                              <label className="form-label">From</label>
                              <div className="input-icon-end position-relative">
                                {editing ? (
                                  <TimePicker
                                    className="form-control"
                                    format="HH:mm"
                                    value={row.from ? dayjs(row.from, "HH:mm") : null}
                                    onChange={(_, timeStr) => updateSlot(activeDay, row.id, "from", timeStr as string)}
                                  />
                                ) : (
                                  <input className="form-control" value={row.from ? dayjs(row.from, "HH:mm").format("hh:mm A") : "—"} disabled />
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="col-xl-3 col-lg-6 col-md-6 col-12">
                            <div className="mb-3">
                              <label className="form-label">To</label>
                              <div className="input-icon-end position-relative">
                                {editing ? (
                                  <TimePicker
                                    className="form-control"
                                    format="HH:mm"
                                    value={row.to ? dayjs(row.to, "HH:mm") : null}
                                    onChange={(_, timeStr) => updateSlot(activeDay, row.id, "to", timeStr as string)}
                                  />
                                ) : (
                                  <input className="form-control" value={row.to ? dayjs(row.to, "HH:mm").format("hh:mm A") : "—"} disabled />
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="col-xl-2 col-lg-6 col-md-6 col-12">
                            <div className="mb-3 d-flex gap-2">
                              {editing && idx === 0 && (
                                <button
                                  className="btn btn-icon btn-sm bg-light text-dark rounded d-flex align-items-center justify-content-center"
                                  onClick={() => addSlot(activeDay)}
                                  title="Add Session"
                                  type="button"
                                >
                                  <i className="ti ti-plus fs-16" />
                                </button>
                              )}
                              {editing && idx > 0 && (
                                <button
                                  className="btn btn-icon btn-sm bg-danger text-white rounded d-flex align-items-center justify-content-center"
                                  onClick={() => deleteSlot(activeDay, row.id)}
                                  title="Delete"
                                  type="button"
                                >
                                  <i className="ti ti-trash fs-16" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}

                    {editing && (schedules[activeDay] || []).length > 0 && (
                      <button
                        className="btn btn-sm btn-outline-primary mt-1"
                        onClick={() => addSlot(activeDay)}
                        type="button"
                      >
                        <i className="ti ti-plus me-1" /> Add Another Session
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="footer text-center bg-white p-2 border-top">
        <p className="text-dark mb-0">
          2025{" "}
          <Link to="#" className="link-primary">Docyari</Link>, All Rights Reserved
        </p>
      </div>
    </div>
  );
};

export default DoctorSchedules;
