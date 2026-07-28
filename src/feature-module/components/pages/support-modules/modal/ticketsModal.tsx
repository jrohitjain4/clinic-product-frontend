import { useState, useEffect } from "react";
import { Priority as PriorityOptions } from "../../../../../core/common/selectOption";
import CommonSelect from "../../../../../core/common/common-select/commonSelect";
import type { Ticket } from "../../../../../core/hooks/useTickets";
import dayjs from "dayjs";
import { IconFormControl, IconTextarea } from "../../../../../core/common/form-fields";

interface TicketsModalProps {
  createTicket: (data: { subject: string; description: string; priority: string }) => Promise<boolean>;
  selectedTicket: Ticket | null;
}

const TicketsModal: React.FC<TicketsModalProps> = ({ createTicket, selectedTicket }) => {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");

  useEffect(() => {
    if (selectedTicket) {
      setSubject(selectedTicket.subject);
      setDescription(selectedTicket.description);
      setPriority(selectedTicket.priority);
    } else {
      setSubject("");
      setDescription("");
      setPriority("Medium");
    }
  }, [selectedTicket]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description) return;

    const success = await createTicket({ subject, description, priority });
    if (success) {
      setSubject("");
      setDescription("");
      // Close modal using bootstrap
      const modalElement = document.getElementById('add_tickets');
      if (modalElement) {
        const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
        modal?.hide();
      }
    }
  };

  return (
    <>
      {/* Start Add Ticket */}
      <div id="add_tickets" className="modal fade">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="text-dark modal-title fw-bold">Raise New Support Ticket</h5>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="fa-solid fa-x" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Subject<span className="text-danger ms-1">*</span>
                      </label>
                      <IconFormControl
                        type="text"
                        fieldLabel="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g., Cannot access billing page"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Priority<span className="text-danger ms-1">*</span>
                      </label>
                      <CommonSelect
                        options={PriorityOptions}
                        className="select"
                        defaultValue={PriorityOptions.find(p => p.value === priority) || PriorityOptions[1]}
                        onChange={(val: any) => setPriority(val.value)}
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Description / Problem Details<span className="text-danger ms-1">*</span>
                      </label>
                      <IconTextarea
                        fieldLabel="description"
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your issue in detail..."
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer d-flex align-items-center gap-1">
                <button
                  type="button"
                  className="btn btn-light border"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* View Ticket Modal */}
      <div id="view_ticket" className="modal fade">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-light">
              <h5 className="text-dark modal-title fw-bold">Ticket Details: {selectedTicket?.ticketCode}</h5>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="fa-solid fa-x" />
              </button>
            </div>
            <div className="modal-body">
              {selectedTicket && (
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="fs-12 text-muted mb-0">Status</label>
                    <div>
                      <span className={`badge border ${selectedTicket.status === "Solved" ? "bg-soft-success text-success border-success" :
                        selectedTicket.status === "In Progress" ? "bg-soft-warning text-warning border-warning" :
                          "bg-soft-danger text-danger border-danger"
                        }`}>
                        {selectedTicket.status}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3 text-md-end">
                    <label className="fs-12 text-muted mb-0">Priority</label>
                    <div>
                      <span className="fw-medium">{selectedTicket.priority}</span>
                    </div>
                  </div>
                  <div className="col-12 mb-3">
                    <label className="fs-12 text-muted mb-0">Subject</label>
                    <div className="fw-bold text-dark fs-16">{selectedTicket.subject}</div>
                  </div>
                  <div className="col-12 mb-3">
                    <label className="fs-12 text-muted mb-0">Description</label>
                    <div className="p-3 bg-light rounded border fs-14" style={{ whiteSpace: 'pre-wrap' }}>
                      {selectedTicket.description}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="fs-12 text-muted mb-0">Created On</label>
                    <div className="fs-13">{dayjs(selectedTicket.createdAt).format("DD MMM YYYY, hh:mm A")}</div>
                  </div>
                  <div className="col-md-6 text-md-end">
                    <label className="fs-12 text-muted mb-0">Raised By</label>
                    <div className="fs-13">{selectedTicket.userName}</div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TicketsModal;
