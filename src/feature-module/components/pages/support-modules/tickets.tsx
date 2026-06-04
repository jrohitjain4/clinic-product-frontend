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

  const columns = [
    {
      title: "Ticket ID",
      dataIndex: "ticketCode",
      render: (text: any) => <span className="text-primary">{text}</span>,
      sorter: (a: any, b: any) => a.ticketCode.localeCompare(b.ticketCode),
    },
    {
      title: "Created By",
      dataIndex: "userName",
      render: (text: any, record: any) => (
        <div className="d-flex flex-column">
          <span className="fw-medium text-dark">{text}</span>
          <span className="fs-12 text-muted">{record.userEmail}</span>
          {isSuperAdmin && record.clinic && (
            <span className="badge bg-soft-info text-info mt-1" style={{ width: 'fit-content' }}>
              {record.clinic.name}
            </span>
          )}
        </div>
      ),
      sorter: (a: any, b: any) => a.userName.localeCompare(b.userName),
    },
    {
      title: "Subject",
      dataIndex: "subject",
      sorter: (a: any, b: any) => a.subject.localeCompare(b.subject),
    },
    {
      title: "Created Date",
      dataIndex: "createdAt",
      render: (text: string) => dayjs(text).format("DD MMM YYYY, hh:mm A"),
      sorter: (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      render: (text: any) => (
        <span className="badge border bg-white text-dark fw-medium">
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
      sorter: (a: any, b: any) => a.priority.localeCompare(b.priority),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: any, record: Ticket) => (
        <div className="dropdown">
          <span
            className={`badge fw-medium dropdown-toggle pointer ${text === "Solved"
              ? "bg-soft-success text-success border-success"
              : text === "In Progress"
                ? "bg-soft-warning text-warning border-warning"
                : "bg-soft-danger text-danger border-danger"
              } border`}
            data-bs-toggle={isSuperAdmin ? "dropdown" : ""}
          >
            {text}
          </span>
          {isSuperAdmin && (
            <ul className="dropdown-menu p-2">
              <li>
                <button
                  className="dropdown-item rounded-1"
                  onClick={() => updateStatus(record.id, "Pending")}
                >
                  Pending
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item rounded-1"
                  onClick={() => updateStatus(record.id, "In Progress")}
                >
                  In Progress
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item rounded-1"
                  onClick={() => updateStatus(record.id, "Solved")}
                >
                  Solved
                </button>
              </li>
            </ul>
          )}
        </div>
      ),
      sorter: (a: any, b: any) => a.status.localeCompare(b.status),
    },
    {
      title: "Action",
      render: (record: Ticket) => (
        <div className="action-item">
          <Link
            to="#"
            className="btn btn-sm btn-white border me-2"
            data-bs-toggle="modal"
            data-bs-target="#view_ticket"
            onClick={() => setSelectedTicket(record)}
          >
            <i className="ti ti-eye me-1" /> View
          </Link>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pb-3 mb-3 border-bottom">
            <div className="d-flex align-items-center">
              <h4 className="fw-bold mb-0 me-2">Support Tickets</h4>
              <span className="badge badge-soft-primary border pt-1 px-2 border-primary fw-medium">
                Total Tickets : {tickets.length}
              </span>
            </div>
            {!isSuperAdmin && (
              <div className="text-end">
                <Link
                  to="#"
                  className="btn btn-primary"
                  data-bs-toggle="modal"
                  data-bs-target="#add_tickets"
                >
                  <i className="ti ti-plus me-1" />
                  Raise New Ticket
                </Link>
              </div>
            )}
          </div>

          <div className="table-responsive">
            <Datatable
              columns={columns}
              dataSource={tickets}
              Selection={false}
              searchText={searchText}
              loading={loading}
            />
          </div>
        </div>

        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025 <Link to="#" className="link-primary">Docyari</Link>, All Rights Reserved
          </p>
        </div>
      </div>

      <TicketsModal
        createTicket={createTicket}
        selectedTicket={selectedTicket}
      />
    </>
  );
};

export default TicketsList;
