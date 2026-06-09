import { useEffect, useMemo, useState } from "react";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { useAttendance } from "../../../../../core/hooks/useAttendance";
import { useClinicDoctors } from "../../../../../core/hooks/useClinicDoctors";
import { Link } from "react-router";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { resolveMediaUrl } from "../../../../../core/config/api";

const MyAttendance = () => {
    const [currentDate, setCurrentDate] = useState(dayjs());
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const month = currentDate.month() + 1;
    const year = currentDate.year();
    const daysInMonth = currentDate.daysInMonth();

    const { doctors, loading: loadingDoctors } = useClinicDoctors();
    const { data, loading, error } = useAttendance(month, year);
    const daysArray = Array.from({ length: daysInMonth }, (_, k) => k + 1);

    const currentDoctor = useMemo(() => {
        if (!user || user.role !== "DOCTOR" || doctors.length === 0) return null;
        return doctors.find(
            (d: any) => d.email === user.email || d.userId === user.id || d.id === user.id
        );
    }, [doctors, user]);

    const myAttendanceData = useMemo(() => {
        if (!currentDoctor) return [];
        // Filter by name or email (if exists in data)
        return data.filter(emp => {
            const dr = currentDoctor as any;
            const empAny = emp as any;

            // Priority 1: Check by email (most reliable)
            if (dr.email && empAny.email && dr.email === empAny.email) return true;

            // Priority 2: Check by userId
            if (dr.userId && empAny.userId && dr.userId === empAny.userId) return true;

            // Priority 3: Check by id
            if (dr.id && emp.id && dr.id === emp.id) return true;

            // Fallback: Check by name (last resort)
            if (dr.fullName && emp.name && dr.fullName.trim() === emp.name.trim()) return true;

            return false;
        });
    }, [data, currentDoctor]);

    const getStatusIcon = (status: string) => {
        if (status === "PRESENT")
            return <span className="text-success" title="Present"><i className="ti ti-square-filled fs-14"></i></span>;
        if (status === "ABSENT")
            return <span className="text-danger" title="Absent"><i className="ti ti-square-filled fs-14"></i></span>;
        if (status === "HALF_DAY")
            return <span className="text-warning" title="Half Day"><i className="ti ti-square-filled fs-14"></i></span>;
        if (status === "HOLIDAY")
            return <span className="text-info" title="Holiday"><i className="ti ti-square-filled fs-14"></i></span>;
        if (status === "OFF")
            return <span className="text-secondary" style={{ opacity: 0.5 }} title="Off"><i className="ti ti-square-minus-filled fs-14"></i></span>;
        if (status === "LEAVE")
            return <span style={{ color: "#7c3aed" }} title="Leave"><i className="ti ti-square-filled fs-14"></i></span>;
        return <span className="text-secondary" style={{ opacity: 0.3 }} title="Not Marked"><i className="ti ti-square fs-14"></i></span>;
    };

    return (
        <div className="page-wrapper">
            <div className="content">
                <div className="page-header d-flex align-items-sm-center flex-sm-row flex-column gap-2 border-bottom pb-3 mb-3">
                    <div className="flex-grow-1">
                        <h4 className="page-title fw-bold mb-0 text-dark">My Attendance</h4>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <DatePicker
                            picker="month"
                            value={currentDate}
                            onChange={(d) => d && setCurrentDate(d)}
                            className="form-select text-dark"
                            style={{ width: "160px", minHeight: "38px" }}
                            format="MMM YYYY"
                        />
                    </div>
                </div>

                <div className="d-flex align-items-center justify-content-between flex-wrap mb-3 p-2 bg-light rounded border">
                    <div className="d-flex align-items-center flex-wrap gap-2">
                        <span className="badge badge-sm badge-soft-success border border-success fw-medium"><i className="ti ti-square-filled me-1"></i>Present</span>
                        <span className="badge badge-sm badge-soft-danger border border-danger fw-medium"><i className="ti ti-square-filled me-1"></i>Absent</span>
                        <span className="badge badge-sm badge-soft-warning border border-warning fw-medium"><i className="ti ti-square-filled me-1"></i>Half Day</span>
                        <span className="badge badge-sm badge-soft-info border border-info fw-medium"><i className="ti ti-square-filled me-1"></i>Holiday</span>
                        <span className="badge badge-sm fw-medium" style={{ background: "#ede9fe", color: "#7c3aed", border: "1px solid #7c3aed" }}><i className="ti ti-square-filled me-1"></i>Leave</span>
                    </div>
                </div>

                <div className="table-responsive border rounded bg-white shadow-sm overflow-auto">
                    {loading ? (
                        <div className="text-center p-5">
                            <span className="spinner-border text-primary me-2" />
                            <span className="text-muted">Loading your attendance...</span>
                        </div>
                    ) : myAttendanceData.length === 0 ? (
                        <div className="text-center p-5">
                            <i className="ti ti-calendar-x fs-1 text-muted d-block mb-2" />
                            <h6 className="fw-bold text-dark">No records found for this month</h6>
                        </div>
                    ) : (
                        <table className="table table-nowrap mb-0 attendance-table">
                            <thead className="bg-light">
                                <tr>
                                    <th className="sticky-col fw-bold text-dark" style={{ position: "sticky", left: 0, backgroundColor: "#f8f9fa", zIndex: 2 }}>Staff</th>
                                    <th className="text-center fw-bold text-dark">Working</th>
                                    <th className="text-center fw-bold text-dark">Present</th>
                                    <th className="text-center fw-bold text-dark">%</th>
                                    {daysArray.map((d) => (
                                        <th key={d} className="text-center fw-bold text-dark">{String(d).padStart(2, "0")}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {myAttendanceData.map((emp) => (
                                    <tr key={emp.id}>
                                        <td className="sticky-col" style={{ position: "sticky", left: 0, backgroundColor: "#fff", zIndex: 1 }}>
                                            <div className="d-flex align-items-center">
                                                <div className="avatar avatar-sm me-2">
                                                    <ImageWithBasePath
                                                        src="assets/img/doctor-placeholder.png"
                                                        className="rounded-circle"
                                                        width={30}
                                                        height={30}
                                                    />
                                                </div>
                                                <div>
                                                    <h6 className="mb-0 fs-13 fw-bold text-dark">{emp.name}</h6>
                                                    <span className="fs-11 text-muted">{emp.type}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-center"><span className="badge badge-soft-primary border border-primary fw-bold text-primary">{emp.totalWorkingDays}</span></td>
                                        <td className="text-center"><span className="badge badge-soft-success border border-success fw-bold text-success">{emp.presentDays}</span></td>
                                        <td className="text-center"><span className={`badge border fw-bold ${parseInt(emp.percentage) < 80 ? "badge-soft-warning border-warning" : "badge-soft-success border-success"}`}>{emp.percentage}%</span></td>
                                        {daysArray.map((day) => (
                                            <td key={day} className="text-center">{getStatusIcon(emp.attendance[day] || "")}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            <style>{`
        .attendance-table th, .attendance-table td { padding: 12px 8px; vertical-align: middle; border-bottom: 1px solid #e9ecef; }
        .attendance-table th { background-color: #f8f9fa; }
        .sticky-col { box-shadow: 2px 0 5px -2px rgba(0, 0, 0, 0.1); }
      `}</style>
        </div>
    );
};

export default MyAttendance;
