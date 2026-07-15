import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

interface Session {
  id: string;
  patientName: string;
  therapistName: string;
  type: string;
  dateTime: string;
  duration: string;
  location: string;
  status: "Scheduled" | "In-Progress" | "Completed" | "Cancelled";
}

const initialSessions: Session[] = [
  {
    id: "S-101",
    patientName: "Alice Miller",
    therapistName: "Dr. Jane Doe",
    type: "Cognitive Behavioral Therapy (CBT)",
    dateTime: "2026-07-14T10:00:00",
    duration: "60 mins",
    location: "Room A",
    status: "Completed",
  },
  {
    id: "S-102",
    patientName: "Mark Davis",
    therapistName: "Dr. John Smith",
    type: "Physical Therapy",
    dateTime: "2026-07-14T11:30:00",
    duration: "45 mins",
    location: "Therapy Gym",
    status: "In-Progress",
  },
  {
    id: "S-103",
    patientName: "Emma Wilson",
    therapistName: "Dr. Sarah Jenkins",
    type: "Speech Therapy",
    dateTime: "2026-07-14T14:00:00",
    duration: "60 mins",
    location: "Room C",
    status: "Scheduled",
  },
  {
    id: "S-104",
    patientName: "James Thompson",
    therapistName: "Dr. Jane Doe",
    type: "CBT Follow-up",
    dateTime: "2026-07-14T16:00:00",
    duration: "60 mins",
    location: "Virtual Room 2",
    status: "Scheduled",
  },
  {
    id: "S-105",
    patientName: "Sophia Martinez",
    therapistName: "Dr. Robert Lee",
    type: "Occupational Therapy",
    dateTime: "2026-07-15T09:30:00",
    duration: "60 mins",
    location: "Room B",
    status: "Scheduled",
  },
  {
    id: "S-106",
    patientName: "William Taylor",
    therapistName: "Dr. John Smith",
    type: "Physical Therapy",
    dateTime: "2026-07-13T15:00:00",
    duration: "45 mins",
    location: "Therapy Gym",
    status: "Completed",
  },
  {
    id: "S-107",
    patientName: "Olivia Brown",
    therapistName: "Dr. Sarah Jenkins",
    type: "Speech Therapy",
    dateTime: "2026-07-12T10:00:00",
    duration: "60 mins",
    location: "Room C",
    status: "Cancelled",
  },
];

const SessionsList = () => {
  const location = useLocation();
  const path = location.pathname;

  let pageTitle = "Therapy Sessions";
  let description = "Manage and track client session logs.";
  let filteredSessions = initialSessions;

  if (path.includes("todays-sessions")) {
    pageTitle = "Today's Sessions";
    description = "Scheduled, active, and completed therapy sessions for today.";
    filteredSessions = initialSessions.filter((s) => s.dateTime.startsWith("2026-07-14"));
  } else if (path.includes("session-history")) {
    pageTitle = "Session History";
    description = "Comprehensive log of completed and cancelled therapy sessions.";
    filteredSessions = initialSessions.filter((s) => s.status === "Completed" || s.status === "Cancelled");
  } else {
    pageTitle = "All Sessions";
    description = "Complete overview of all scheduled, active, and historic therapy sessions.";
  }

  const [sessions] = useState<Session[]>(filteredSessions);
  const [searchTerm, setSearchTerm] = useState("");

  const displaySessions = sessions.filter(
    (s) =>
      s.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.therapistName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: Session["status"]) => {
    switch (status) {
      case "Completed":
        return "bg-soft-success text-success";
      case "In-Progress":
        return "bg-soft-warning text-warning";
      case "Scheduled":
        return "bg-soft-primary text-primary";
      case "Cancelled":
        return "bg-soft-danger text-danger";
      default:
        return "bg-soft-secondary text-secondary";
    }
  };

  const formatDateTime = (dateTimeStr: string) => {
    const dt = new Date(dateTimeStr);
    return dt.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Page Header */}
        <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3 pb-3 border-bottom">
          <div className="flex-grow-1">
            <h4 className="fw-bold mb-0">{pageTitle}</h4>
            <p className="text-muted mb-0 fs-13">{description}</p>
          </div>
          <div className="text-end d-flex">
            <Link to="/new-appointment" className="btn btn-primary ms-2 fs-13 btn-md">
              <i className="ti ti-plus me-1" /> Book Session
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 mb-4">
          <div className="search-set mb-0">
            <div className="d-flex align-items-center flex-wrap gap-2">
              <div className="table-search d-flex align-items-center mb-0">
                <div className="search-input">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by Patient, Therapist, or Type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="card border shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-nowrap mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Session ID</th>
                    <th>Patient</th>
                    <th>Therapist</th>
                    <th>Therapy Type</th>
                    <th>Date & Time</th>
                    <th>Duration</th>
                    <th>Location</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displaySessions.map((session) => (
                    <tr key={session.id}>
                      <td>
                        <span className="fw-semibold text-primary">{session.id}</span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-sm me-2">
                            <span className="avatar-title rounded-circle bg-soft-info text-info fw-semibold fs-12">
                              {session.patientName[0]}
                            </span>
                          </div>
                          <span className="fw-semibold fs-14 text-dark">{session.patientName}</span>
                        </div>
                      </td>
                      <td>{session.therapistName}</td>
                      <td>{session.type}</td>
                      <td>{formatDateTime(session.dateTime)}</td>
                      <td>{session.duration}</td>
                      <td>{session.location}</td>
                      <td>
                        <span className={`badge badge-pill badge-md ${getStatusBadge(session.status)}`}>
                          {session.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {displaySessions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-4 text-muted">
                        No sessions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionsList;
