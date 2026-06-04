import { useState, useEffect } from "react";
import { apiUrl } from "../../../../../../core/config/api";
import { message, TimePicker, Button } from "antd";
import dayjs from "dayjs";
import SettingsSidebar from "../../../../../../core/common/settings-sidebar/settingsSidebar";

interface DaySchedule {
    day: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
}

const WorkingHoursSettings = () => {
    const [schedules, setSchedules] = useState<DaySchedule[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const daysName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch(apiUrl("/api/settings/working-days/config"), {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.schedules) {
                    setSchedules(data.schedules);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleDay = (day: number) => {
        if (!isEditing) return;
        setSchedules(prev =>
            prev.map(s => s.day === day ? { ...s, isActive: !s.isActive } : s)
        );
    };

    const updateTime = (day: number, field: 'startTime' | 'endTime', value: string) => {
        setSchedules(prev =>
            prev.map(s => s.day === day ? { ...s, [field]: value } : s)
        );
    };

    const handleSave = async () => {
        setSubmitting(true);
        const offDays = schedules.filter(s => !s.isActive).map(s => s.day);

        try {
            const res = await fetch(apiUrl("/api/settings/working-days/config"), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ schedules, offDays })
            });
            if (res.ok) {
                message.success("Clinic timing updated successfully");
                setIsEditing(false);
            } else {
                message.error("Failed to update settings");
            }
        } catch (err) {
            message.error("Connection error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        fetchConfig(); // Revert changes
    };

    return (
        <div className="page-wrapper">
            <div className="content">
                <div className="mb-3 border-bottom pb-3">
                    <h4 className="fw-bold mb-0">Settings</h4>
                </div>

                <div className="card">
                    <div className="card-body p-0">
                        <div className="settings-wrapper d-flex">
                            <SettingsSidebar />

                            <div className="card flex-fill mb-0 border-0 bg-light-500 shadow-none">
                                <div className="card-header border-bottom px-0 mx-3 d-flex align-items-center justify-content-between">
                                    <h5 className="fw-bold mb-0">Clinic Timing & Working Days</h5>
                                    {!isEditing ? (
                                        <Button
                                            type="primary"
                                            icon={<i className="ti ti-edit me-2" />}
                                            onClick={() => setIsEditing(true)}
                                            className="btn-edit-main pill px-4"
                                        >
                                            Edit Schedule
                                        </Button>
                                    ) : (
                                        <div className="d-flex gap-2">
                                            <Button onClick={handleCancel} className="pill px-4">Cancel</Button>
                                            <Button
                                                type="primary"
                                                loading={submitting}
                                                onClick={handleSave}
                                                className="pill px-4 btn-save-main"
                                            >
                                                Save Changes
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <div className="card-body px-0 mx-3">
                                    <div className="table-responsive">
                                        <table className="table table-nowrap align-middle mb-0 custom-timing-table">
                                            <thead className="bg-light">
                                                <tr>
                                                    <th className="ps-4 py-3">Day</th>
                                                    <th className="py-3">Status</th>
                                                    <th className="py-3">Opening Time</th>
                                                    <th className="py-3">Closing Time</th>
                                                    <th className="pe-4 text-end py-3">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {schedules.map((s) => (
                                                    <tr key={s.day} className={!s.isActive ? 'bg-soft-light' : ''}>
                                                        <td className="ps-4">
                                                            <span className="fw-bold fs-14 text-dark">{daysName[s.day]}</span>
                                                        </td>
                                                        <td>
                                                            <span className={`badge rounded-pill ${s.isActive ? 'bg-soft-success text-success' : 'bg-soft-danger text-danger'} px-3 py-2 fs-11`}>
                                                                {s.isActive ? 'WORKING' : 'CLOSED'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {isEditing && s.isActive ? (
                                                                <TimePicker
                                                                    format="HH:mm"
                                                                    className="w-100"
                                                                    size="small"
                                                                    value={dayjs(s.startTime, 'HH:mm')}
                                                                    onChange={(t) => updateTime(s.day, 'startTime', t?.format('HH:mm') || '09:00')}
                                                                    allowClear={false}
                                                                />
                                                            ) : (
                                                                <span className="fw-medium text-muted fs-13">
                                                                    {s.isActive ? s.startTime : '-- : --'}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            {isEditing && s.isActive ? (
                                                                <TimePicker
                                                                    format="HH:mm"
                                                                    className="w-100"
                                                                    size="small"
                                                                    value={dayjs(s.endTime, 'HH:mm')}
                                                                    onChange={(t) => updateTime(s.day, 'endTime', t?.format('HH:mm') || '18:00')}
                                                                    allowClear={false}
                                                                />
                                                            ) : (
                                                                <span className="fw-medium text-muted fs-13">
                                                                    {s.isActive ? s.endTime : '-- : --'}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="pe-4 text-end">
                                                            <div className="form-check form-switch d-inline-block m-0">
                                                                <input
                                                                    className="form-check-input scale-110"
                                                                    type="checkbox"
                                                                    checked={s.isActive}
                                                                    disabled={!isEditing}
                                                                    onChange={() => toggleDay(s.day)}
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .settings-wrapper { min-height: 600px; }
                .pill { border-radius: 50px; }
                .btn-edit-main { background: #3b82f6; border: none; }
                .btn-save-main { background: #10b981; border: none; }
                .scale-110 { transform: scale(1.1); }
                .bg-soft-success { background: rgba(16, 185, 129, 0.1); }
                .bg-soft-danger { background: rgba(239, 68, 68, 0.1); }
                .bg-soft-light { background: #f8fafc; opacity: 0.7; }
                .custom-timing-table thead th { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
            `}</style>
        </div>
    );
};

export default WorkingHoursSettings;
