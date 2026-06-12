import { useState } from "react";
import { Link } from "react-router";
import { all_routes } from "../../../routes/all_routes";
import Datatable from "../../../../core/common/dataTable";
import TicketsModal from "./modal/ticketsModal";
import { useTickets } from "../../../../core/hooks/useTickets";
import type { Ticket } from "../../../../core/hooks/useTickets";
import dayjs from "dayjs";

const TicketsList = () => {
  const { tickets, loading, createTicket, updateStatus } = useTickets();
  const [searchText, setSearchText] = useState<string>("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : {};
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [filterStatus, setFilterStatus] = useState("All");

  const filteredTickets = tickets.filter(t => {
    let matchSearch = true;
    if (searchText) {
      const lower = searchText.toLowerCase();
      matchSearch = !!(
        (t.ticketCode?.toLowerCase().includes(lower)) ||
        (t.subject?.toLowerCase().includes(lower)) ||
        (t.userName?.toLowerCase().includes(lower)) ||
        (t.userEmail?.toLowerCase().includes(lower)) ||
        (t.priority?.toLowerCase().includes(lower))
      );
    }
    let matchStatus = true;
    if (filterStatus !== "All") {
      matchStatus = (t.status || "Pending") === filterStatus;
    }
    return matchSearch && matchStatus;
  });

  const columns = [
    {
      title: "Sr. No.",
      dataIndex: "s_no",
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Ticket ID",
      dataIndex: "ticketCode",
      render: (text: any) => <span className="text-primary fw-medium">{text}</span>,
      sorter: (a: any, b: any) => (a.ticketCode || "").localeCompare(b.ticketCode || ""),
    },
    {
      title: "Created By",
      dataIndex: "userName",
      render: (text: any, record: any) => (
        <div className="d-flex flex-column">
          <span className="fw-semibold text-dark">{text}</span>
          <span className="fs-12 text-muted">{record.userEmail}</span>
          {isSuperAdmin && record.clinic && (
            <span className="badge bg-info-subtle text-info mt-1 px-2 py-1 rounded-pill" style={{ width: 'fit-content' }}>
              {record.clinic.name}
            </span>
          )}
        </div>
      ),
      sorter: (a: any, b: any) => (a.userName || "").localeCompare(b.userName || ""),
    },
    {
      title: "Subject",
      dataIndex: "subject",
      sorter: (a: any, b: any) => (a.subject || "").localeCompare(b.subject || ""),
    },
    {
      title: "Created Date",
      dataIndex: "createdAt",
      render: (text: string) => dayjs(text).format("DD MMM YYYY, hh:mm A"),
      sorter: (a: any, b: any) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      render: (text: any) => (
        <span className="badge border bg-white text-dark fw-semibold px-2 py-1 rounded-pill">
          <i
            className={`ti ti-point-filled ${text === "Low"
              ? "text-success"
              : text === "High"
                ? "text-danger"
                : "text-warning"
              } me-1`}
          />
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => (a.priority || "").localeCompare(b.priority || ""),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: any) => {
        const val = text || "Pending";
        let badgeClass = "badge-soft-warning border-warning text-warning";
        if (val === "Resolved") badgeClass = "badge-soft-success border-success text-success";
        else if (val === "Open") badgeClass = "badge-soft-info border-info text-info";
        else if (val === "Closed" || val === "Rejected") badgeClass = "badge-soft-danger border-danger text-danger";

        return (
          <span className={`badge border ${badgeClass}`}>
            {val}
          </span>
        );
      },
      sorter: (a: any, b: any) => (a.status || "").localeCompare(b.status || ""),
    },
    {
      title: "Action",
      align: "center" as const,
      className: "text-nowrap",
      width: 100,
      render: (record: Ticket) => (
        <div className="d-flex align-items-center justify-content-center gap-2 text-nowrap">
          <button
            type="button"
            className="bg-transparent border-0 text-info p-1"
            title="View Details"
            data-bs-toggle="modal"
            data-bs-target="#view_ticket"
            onClick={() => setSelectedTicket(record)}
          >
            <i className="ti ti-eye fs-18"></i>
          </button>
          {record.status !== 'Resolved' && (
            <button
              type="button"
              className="bg-transparent border-0 text-success p-1"
              title="Mark as Resolved"
              onClick={() => updateStatus(record.id, 'Resolved')}
            >
              <i className="ti ti-check fs-18"></i>
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header d-flex align-items-sm-center flex-sm-row flex-column gap-2 border-bottom pb-3 mb-3">
            <div className="flex-grow-1">
              <h4 className="page-title fw-bold mb-0 d-flex align-items-center">
                Support Tickets
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total Tickets : {tickets.length}
                </span>
              </h4>
            </div>
            <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
              <div className="position-relative">
                <i className="ti ti-search position-absolute top-50 translate-middle-y ms-2 text-muted fs-14" style={{ zIndex: 10 }} />
                <input
                  type="text"
                  className="form-control text-end"
                  placeholder="Search tickets..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ minWidth: '220px', paddingLeft: '30px', height: '38px', fontSize: '13px', borderRadius: '6px' }}
                />
              </div>

              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap w-100" style={{ minWidth: '130px', minHeight: '38px', borderRadius: '6px', fontSize: '13px' }} data-bs-toggle="dropdown">
                  <span className="text-truncate"><span className="text-muted">Status:</span> {filterStatus}</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  {["All", "Pending", "Open", "Inprogress", "Resolved", "Closed", "Rejected"].map(s => (
                    <li key={s}><Link to="#" className="dropdown-item rounded-1" onClick={(e) => { e.preventDefault(); setFilterStatus(s); }}>{s}</Link></li>
                  ))}
                </ul>
              </div>

              {!isSuperAdmin && (
                <button
                  type="button"
                  className="btn btn-primary d-flex align-items-center justify-content-center"
                  style={{ minHeight: '38px', whiteSpace: 'nowrap' }}
                  data-bs-toggle="modal"
                  data-bs-target="#add_tickets"
                  onClick={() => setSelectedTicket(null)}
                >
                  Raise New Ticket <i className="ti ti-plus ms-2" />
                </button>
              )}
            </div>
          </div>

          <div className="table-responsive">
            <Datatable
              columns={columns}
              dataSource={filteredTickets}
              Selection={false}
            />
          </div>
        </div>
        {/* End Content */}
        {/* Footer Start */}
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025
            <Link to="#" className="link-primary">
              Docyari
            </Link>
            , All Rights Reserved
          </p>
        </div>
        {/* Footer End */}
      </div>
      {/* ========================
			End Page Content
		========================= */}

      <TicketsModal createTicket={createTicket} selectedTicket={selectedTicket} />
    </>
  );
};

export default TicketsList;
