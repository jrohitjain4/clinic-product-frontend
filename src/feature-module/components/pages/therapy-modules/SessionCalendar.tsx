import React, { useState } from "react";
import { Link } from "react-router-dom";

const SessionCalendar = () => {
  const [currentWeek, setCurrentWeek] = useState("July 13 - July 19, 2026");

  const calendarEvents = [
    {
      time: "09:00 AM - 10:00 AM",
      monday: { patient: "Mark Davis", therapist: "Dr. John Smith", type: "Physiotherapy" },
      tuesday: null,
      wednesday: { patient: "Alice Miller", therapist: "Dr. Jane Doe", type: "CBT Therapy" },
      thursday: null,
      friday: { patient: "Emma Wilson", therapist: "Dr. Sarah Jenkins", type: "Speech Therapy" },
    },
    {
      time: "11:00 AM - 12:00 PM",
      monday: null,
      tuesday: { patient: "Sophia Martinez", therapist: "Dr. Robert Lee", type: "Occupational Therapy" },
      wednesday: null,
      thursday: { patient: "Mark Davis", therapist: "Dr. John Smith", type: "Physiotherapy" },
      friday: null,
    },
    {
      time: "02:00 PM - 03:00 PM",
      monday: { patient: "Emma Wilson", therapist: "Dr. Sarah Jenkins", type: "Speech Therapy" },
      tuesday: null,
      wednesday: { patient: "James Thompson", therapist: "Dr. Jane Doe", type: "CBT Follow-up" },
      thursday: null,
      friday: { patient: "William Taylor", therapist: "Dr. John Smith", type: "Physiotherapy" },
    },
    {
      time: "04:00 PM - 05:00 PM",
      monday: null,
      tuesday: { patient: "Olivia Brown", therapist: "Dr. Sarah Jenkins", type: "Speech Therapy" },
      wednesday: null,
      thursday: { patient: "James Thompson", therapist: "Dr. Jane Doe", type: "CBT Follow-up" },
      friday: null,
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Page Header */}
        <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
          <div>
            <h4 className="fw-bold mb-0">Sessions Calendar</h4>
            <p className="text-muted mb-0 fs-13">Weekly timetable for therapy room schedules.</p>
          </div>
          <div>
            <Link to="/new-appointment" className="btn btn-primary btn-md">
              <i className="ti ti-plus me-1" /> Book Session
            </Link>
          </div>
        </div>

        {/* Calendar Nav */}
        <div className="card border shadow-sm mb-4">
          <div className="card-body py-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
            <h5 className="mb-0 fw-semibold">{currentWeek}</h5>
            <div className="btn-group">
              <button className="btn btn-sm btn-outline-secondary">
                <i className="ti ti-chevron-left" /> Prev
              </button>
              <button className="btn btn-sm btn-outline-secondary">Today</button>
              <button className="btn btn-sm btn-outline-secondary">
                Next <i className="ti ti-chevron-right" />
              </button>
            </div>
          </div>
        </div>

        {/* Timetable Grid */}
        <div className="card border shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-bordered mb-0 align-middle text-center table-nowrap">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "15%" }}>Time Slot</th>
                    <th style={{ width: "17%" }}>Monday (13)</th>
                    <th style={{ width: "17%" }}>Tuesday (14)</th>
                    <th style={{ width: "17%" }}>Wednesday (15)</th>
                    <th style={{ width: "17%" }}>Thursday (16)</th>
                    <th style={{ width: "17%" }}>Friday (17)</th>
                  </tr>
                </thead>
                <tbody>
                  {calendarEvents.map((row, idx) => (
                    <tr key={idx}>
                      <td className="fw-semibold bg-light fs-13">{row.time}</td>
                      <td>
                        {row.monday ? (
                          <div className="p-2 rounded bg-soft-primary text-start">
                            <h6 className="mb-1 fs-13 fw-semibold text-primary">{row.monday.patient}</h6>
                            <span className="d-block fs-11 text-muted">Therapist: {row.monday.therapist}</span>
                            <span className="badge bg-primary fs-10 mt-1">{row.monday.type}</span>
                          </div>
                        ) : (
                          <span className="text-muted fs-12">-</span>
                        )}
                      </td>
                      <td>
                        {row.tuesday ? (
                          <div className="p-2 rounded bg-soft-warning text-start">
                            <h6 className="mb-1 fs-13 fw-semibold text-warning-emphasis">{row.tuesday.patient}</h6>
                            <span className="d-block fs-11 text-muted">Therapist: {row.tuesday.therapist}</span>
                            <span className="badge bg-warning text-dark fs-10 mt-1">{row.tuesday.type}</span>
                          </div>
                        ) : (
                          <span className="text-muted fs-12">-</span>
                        )}
                      </td>
                      <td>
                        {row.wednesday ? (
                          <div className="p-2 rounded bg-soft-info text-start">
                            <h6 className="mb-1 fs-13 fw-semibold text-info-emphasis">{row.wednesday.patient}</h6>
                            <span className="d-block fs-11 text-muted">Therapist: {row.wednesday.therapist}</span>
                            <span className="badge bg-info text-white fs-10 mt-1">{row.wednesday.type}</span>
                          </div>
                        ) : (
                          <span className="text-muted fs-12">-</span>
                        )}
                      </td>
                      <td>
                        {row.thursday ? (
                          <div className="p-2 rounded bg-soft-success text-start">
                            <h6 className="mb-1 fs-13 fw-semibold text-success">{row.thursday.patient}</h6>
                            <span className="d-block fs-11 text-muted">Therapist: {row.thursday.therapist}</span>
                            <span className="badge bg-success fs-10 mt-1">{row.thursday.type}</span>
                          </div>
                        ) : (
                          <span className="text-muted fs-12">-</span>
                        )}
                      </td>
                      <td>
                        {row.friday ? (
                          <div className="p-2 rounded bg-soft-danger text-start">
                            <h6 className="mb-1 fs-13 fw-semibold text-danger">{row.friday.patient}</h6>
                            <span className="d-block fs-11 text-muted">Therapist: {row.friday.therapist}</span>
                            <span className="badge bg-danger fs-10 mt-1">{row.friday.type}</span>
                          </div>
                        ) : (
                          <span className="text-muted fs-12">-</span>
                        )}
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
  );
};

export default SessionCalendar;
