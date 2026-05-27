import { useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import type { EventApi } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ImageWithBasePath from "../../imageWithBasePath";

export interface CalendarEventInput {
  id?: string;
  title?: string;
  start: string;
  end?: string;
  extendedProps?: {
    image?: string;
    appointmentId?: string;
    doctorName?: string;
    status?: string;
    mode?: string;
  };
}

interface EventCalendarProps {
  events?: CalendarEventInput[];
}

const EventCalendar = ({ events: externalEvents }: EventCalendarProps) => {
  const calendarRef = useRef(null);
  const [selectedEvent, setSelectedEvent] = useState<EventApi | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fallbackEvents: CalendarEventInput[] = [
    {
      title: "Sample",
      start: new Date().toISOString(),
      extendedProps: { image: "assets/img/users/user-01.jpg" },
    },
  ];

  const events = externalEvents?.length ? externalEvents : fallbackEvents;

  const renderEventContent = (eventInfo: any) => {
    const { image } = eventInfo.event.extendedProps;
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        {image && (
          <span
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "50%",
            }}
          >
            <ImageWithBasePath
              src={image}
              alt="icon"
              className="avatar-xs rounded-circle"
            />
          </span>
        )}
      </div>
    );
  };

  const handleEventClick = (clickInfo: any) => {
    setSelectedEvent(clickInfo.event);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedEvent(null);
  };

  return (
    <div className="p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        headerToolbar={{
          start: "today,prev,next",
          center: "title",
          end: "dayGridMonth,dayGridWeek,dayGridDay",
        }}
        eventContent={renderEventContent}
        eventClick={handleEventClick}
        ref={calendarRef}
      />

      {selectedEvent && (
        <div
          className={`modal fade ${modalOpen ? "show d-block" : ""}`}
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
           onClick={closeModal} 
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header bg-dark modal-bg">
                <h5 className="modal-title text-white">
                  {selectedEvent.title || "Appointment"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={closeModal}
                ></button>
              </div>
              <div className="modal-body">
                <p className="d-flex align-items-center fw-medium text-black mb-3">
                  <i className="ti ti-calendar-check text-default me-2" />
                  {selectedEvent.start?.toLocaleString() || "—"}
                </p>
                <p className="d-flex align-items-center fw-medium text-black mb-3">
                  <i className="ti ti-user text-default me-2" />
                  Doctor:{" "}
                  {(selectedEvent.extendedProps as { doctorName?: string })
                    ?.doctorName || "—"}
                </p>
                <p className="d-flex align-items-center fw-medium text-black mb-3">
                  <i className="ti ti-info-circle text-default me-2" />
                  Status:{" "}
                  {(selectedEvent.extendedProps as { status?: string })?.status ||
                    "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCalendar;
