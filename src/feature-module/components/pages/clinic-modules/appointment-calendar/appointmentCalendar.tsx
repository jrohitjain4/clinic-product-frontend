import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import EventCalendar, {
  type CalendarEventInput,
} from "../../../../../core/common/event-calendar/eventCalendar";
import { all_routes } from "../../../../routes/all_routes";
import { apiUrl } from "../../../../../core/config/api";

const AppointmentCalendar = () => {
  const [events, setEvents] = useState<CalendarEventInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTitle, setCurrentTitle] = useState("");
  const [activeView, setActiveView] = useState("dayGridMonth");
  const calendarRef = useRef<any>(null);

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

  const getApi = () => calendarRef.current?.getApi?.();

  const goToday = () => { getApi()?.today(); updateTitle(); };
  const goPrev = () => { getApi()?.prev(); updateTitle(); };
  const goNext = () => { getApi()?.next(); updateTitle(); };
  const changeView = (v: string) => { getApi()?.changeView(v); setActiveView(v); updateTitle(); };

  const updateTitle = () => {
    setTimeout(() => {
      const t = getApi()?.getCurrentData?.().viewTitle;
      if (t) setCurrentTitle(t);
    }, 50);
  };

  const viewBtnClass = (v: string) =>
    `btn btn-sm ${activeView === v ? "btn-primary" : "btn-outline-secondary"}`;

  return (
    <div className="page-wrapper">
      <div className="content" style={{ paddingBottom: 0 }}>
        {/* Single merged header row */}
        <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom flex-nowrap overflow-auto">
          {/* Left: Title & View Toggles */}
          <div className="d-flex align-items-center gap-3 flex-shrink-0">
            <h4 className="fw-semibold mb-0">Appointment</h4>
            <div className="d-flex align-items-center gap-1 bg-light p-1 rounded">
              <button className={viewBtnClass("dayGridDay")} onClick={() => changeView("dayGridDay")}>Day</button>
              <button className={viewBtnClass("dayGridWeek")} onClick={() => changeView("dayGridWeek")}>Week</button>
              <button className={viewBtnClass("dayGridMonth")} onClick={() => changeView("dayGridMonth")}>Month</button>
            </div>
          </div>

          {/* Center: Navigation & Date */}
          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            <button className="btn btn-sm btn-primary px-3" onClick={goToday}>Today</button>
            <button
              className="btn btn-icon btn-sm bg-white text-dark border"
              style={{ width: 32, height: 32, borderRadius: '8px' }}
              onClick={goPrev}
            >
              <i className="ti ti-chevron-left fs-14" />
            </button>
            <div className="fw-semibold fs-15 text-dark text-center" style={{ minWidth: '140px' }}>
              {currentTitle}
            </div>
            <button
              className="btn btn-icon btn-sm bg-white text-dark border"
              style={{ width: 32, height: 32, borderRadius: '8px' }}
              onClick={goNext}
            >
              <i className="ti ti-chevron-right fs-14" />
            </button>
          </div>

          {/* Right: Actions */}
          <div className="d-flex align-items-center gap-3 flex-shrink-0">
            <div className="d-flex align-items-center gap-2">
              <Link
                to={all_routes.appointments}
                className="btn btn-icon btn-sm bg-white text-dark border d-flex align-items-center justify-content-center"
                style={{ width: '38px', height: '38px', borderRadius: '8px' }}
              >
                <i className="ti ti-list-tree fs-16" />
              </Link>
              <Link
                to={all_routes.appointmentCalendar}
                className="btn btn-icon btn-sm bg-primary-subtle text-primary border border-primary d-flex align-items-center justify-content-center"
                style={{ width: '38px', height: '38px', borderRadius: '8px' }}
              >
                <i className="ti ti-calendar-event fs-16" />
              </Link>
            </div>

            <Link
              to={all_routes.newAppointment}
              className="btn btn-primary fs-13 btn-md"
            >
              <i className="ti ti-plus ms-1" /> New Appointment
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <span className="spinner-border text-primary" role="status" />
          </div>
        ) : (
          <EventCalendar events={events} calendarRef={calendarRef} />
        )}
      </div>
    </div>
  );
};

export default AppointmentCalendar;
