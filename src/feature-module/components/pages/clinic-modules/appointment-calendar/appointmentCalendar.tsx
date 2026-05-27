import { useEffect, useState } from "react";
import { Link } from "react-router";
import EventCalendar, {
  type CalendarEventInput,
} from "../../../../../core/common/event-calendar/eventCalendar";
import { all_routes } from "../../../../routes/all_routes";
import { apiUrl } from "../../../../../core/config/api";

const AppointmentCalendar = () => {
  const [events, setEvents] = useState<CalendarEventInput[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const from = new Date();
    from.setMonth(from.getMonth() - 1);
    const to = new Date();
    to.setMonth(to.getMonth() + 2);
    const q = new URLSearchParams({
      dateFrom: from.toISOString(),
      dateTo: to.toISOString(),
    });
    fetch(apiUrl(`/api/appointments/calendar?${q}`), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-1 border-bottom">
          <div className="flex-grow-1">
            <h4 className="fw-semibold mb-0">Appointment</h4>
          </div>
          <div className="text-end d-flex">
            <div className="bg-white border shadow-sm rounded px-1 pb-0 text-center d-flex align-items-center justify-content-center me-2">
              <Link
                to={all_routes.appointments}
                className="bg-white rounded p-1 d-flex align-items-center justify-content-center"
              >
                <i className="ti ti-list fs-14 text-body" />
              </Link>
              <span className="bg-light rounded p-1 d-flex align-items-center justify-content-center">
                <i className="ti ti-calendar-event fs-14 text-dark" />
              </span>
            </div>
            <Link
              to={all_routes.newAppointment}
              className="btn btn-primary ms-2 fs-13 btn-md"
            >
              <i className="ti ti-plus me-1" /> New Appointment
            </Link>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-5">
            <span className="spinner-border text-primary" role="status" />
          </div>
        ) : (
          <EventCalendar events={events} />
        )}
      </div>
    </div>
  );
};

export default AppointmentCalendar;
