import { Link } from "react-router";
import "slick-carousel/slick/slick.css";
import DefaultEditor from "react-simple-wysiwyg";
import { DatePicker } from "antd";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { apiUrl } from "../../../../../../core/config/api";
import CommonSelect from "../../../../../../core/common/common-select/commonSelect";
import {
  Assignee,
  Priority,
  StatusActive,
} from "../../../../../../core/common/selectOption";
import ImageWithBasePath from "../../../../../../core/imageWithBasePath";
import TagInput from "../../../../../../core/common/Taginput";
import { all_routes } from "../../../../../routes/all_routes";

const Notes = () => {
  const [tags, setTags] = useState<string[]>(["Pending", "Done"]);
  const handleTagsChange = (newTags: string[]) => {
    setTags(newTags);
  };

  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState({ title: "", content: "", priority: "Medium", noteDate: "" });

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/notes"), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      if (res.ok) setNotes(data);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.title.trim() || !newNote.content.trim()) {
      toast.error("Both Title and Description are mandatory", { position: "top-center" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/notes"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(newNote),
      });
      if (res.ok) {
        const data = await res.json();
        setNotes([data, ...notes]);
        setNewNote({ title: "", content: "", priority: "Medium", noteDate: "" });
        toast.success("Note Successfuly created!", { position: "top-center" });
        const closeBtn = document.getElementById("close_add_note");
        if (closeBtn) closeBtn.click();
      }
    } catch (error) {
      toast.error("Failed to add note");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      const res = await fetch(apiUrl(`/api/notes/${id}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (res.ok) {
        setNotes(notes.filter(n => n._id !== id && n.id !== id));
        toast.success("Note Successfully Deleted", { position: "top-center" });
      }
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const getModalContainer = () => {
    return document.body;
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content pb-0">
          <div className="d-flex align-items-sm-center flex-sm-row g-2 flex-column gap-2 pb-3">
            <div className="flex-grow g-2-1">
              <h4 className="fs-18 fw-semibold mb-0">Clinic Notes</h4>
            </div>
            <div className="text-end">
              <ol className="breadcrumb m-0 py-0">
                <li className="breadcrumb-item">
                  <Link to={all_routes.dashboard}>Home</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Notes
                </li>
              </ol>
            </div>
          </div>

          <div className="row g-2">
            <div className="col-xl-3 col-md-12">
              <div className="notes-sidebar">
                <div className="card shadow-sm border-0">
                  <div className="card-body">
                    <div className="mb-3 pb-3 border-bottom">
                      <button
                        className="btn btn-primary w-100 d-flex align-items-center justify-content-center py-2"
                        data-bs-toggle="modal"
                        data-bs-target="#add_note"
                      >
                        <i className="ti ti-plus me-2" />
                        Add New Note
                      </button>
                    </div>
                    <div className="nav flex-column nav-pills" role="tablist">
                      <button className="nav-link active d-flex align-items-center py-2 px-3 mb-1 border-0 bg-transparent text-start">
                        <i className="ti ti-inbox me-2 fs-18" />
                        All Notes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-9">
              <div className="card shadow-sm border-0">
                <div className="card-body p-4">
                  <div className="tab-content">
                    <div className="tab-pane fade active show">
                      <div className="row g-3">
                        {loading && notes.length === 0 ? (
                          <div className="col-12 text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          </div>
                        ) : notes.length === 0 ? (
                          <div className="col-12 text-center py-5">
                            <div className="mb-3">
                              <i className="ti ti-file-off fs-48 text-muted" />
                            </div>
                            <h5 className="text-muted">No notes found. Create your first clinic note!</h5>
                          </div>
                        ) : (
                          notes.map((note) => (
                            <div key={note._id || note.id} className="col-md-6 col-lg-4">
                              <div className="card h-100 border shadow-none hover-shadow transition-all" style={{ borderRadius: '12px' }}>
                                <div className="card-body p-3">
                                  <div className="d-flex align-items-center justify-content-between mb-3">
                                    <span className={`badge ${note.priority === 'High' ? 'bg-danger-light text-danger' :
                                        note.priority === 'Medium' ? 'bg-warning-light text-warning' :
                                          'bg-info-light text-info'
                                      } rounded-pill px-3`}>
                                      {note.priority}
                                    </span>
                                    <div className="dropdown">
                                      <Link to="#" data-bs-toggle="dropdown">
                                        <i className="ti ti-dots-vertical fs-18 text-muted" />
                                      </Link>
                                      <div className="dropdown-menu dropdown-menu-end shadow-sm border-0">
                                        <Link to="#" className="dropdown-item py-2">
                                          <i className="ti ti-edit me-2" /> Edit
                                        </Link>
                                        <Link
                                          to="#"
                                          className="dropdown-item py-2 text-danger"
                                          onClick={() => handleDeleteNote(note._id || note.id)}
                                        >
                                          <i className="ti ti-trash me-2" /> Delete
                                        </Link>
                                      </div>
                                    </div>
                                  </div>
                                  <h6 className="fs-16 fw-bold mb-2 text-truncate">{note.title}</h6>
                                  <p className="text-muted mb-3 line-clamp-3 fs-14" style={{ minHeight: '3em' }}>
                                    {note.content}
                                  </p>
                                  <div className="d-flex align-items-center justify-content-between pt-3 border-top mt-auto">
                                    <div className="d-flex align-items-center text-muted fs-12">
                                      <i className="ti ti-calendar me-1" />
                                      {note.noteDate || 'No date'}
                                    </div>
                                    <Link to="#" className="btn btn-sm btn-light rounded-pill px-3 fs-12">
                                      View Details
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="footer text-center bg-white p-3 border-top mt-auto">
          <p className="text-dark mb-0">
            2026 <Link to="#" className="link-primary fw-bold">Docyari</Link>, All Rights Reserved
          </p>
        </div>
      </div>

      <div className="modal fade" id="add_note" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
            <div className="modal-header bg-primary text-white border-0 py-3" style={{ borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
              <h5 className="modal-title text-white">Create New Note</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                id="close_add_note"
                aria-label="Close"
              />
            </div>
            <form onSubmit={handleCreateNote}>
              <div className="modal-body p-4">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-bold small text-uppercase">Note Title <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control form-control-lg bg-light border-0"
                      placeholder="e.g. Patient check-up notes"
                      value={newNote.title}
                      onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                      required
                      style={{ borderRadius: '10px' }}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-bold small text-uppercase">Priority</label>
                    <select
                      className="form-select form-control-lg bg-light border-0"
                      value={newNote.priority}
                      onChange={(e) => setNewNote({ ...newNote, priority: e.target.value })}
                      style={{ borderRadius: '10px' }}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-bold small text-uppercase">Date</label>
                    <input
                      type="date"
                      className="form-control form-control-lg bg-light border-0"
                      value={newNote.noteDate}
                      onChange={(e) => setNewNote({ ...newNote, noteDate: e.target.value })}
                      style={{ borderRadius: '10px' }}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-bold small text-uppercase">Description <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control bg-light border-0"
                      rows={4}
                      placeholder="Enter detailed notes here..."
                      value={newNote.content}
                      onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                      required
                      style={{ borderRadius: '10px' }}
                    ></textarea>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 p-4 pt-0">
                <button type="button" className="btn btn-light btn-lg flex-fill" data-bs-dismiss="modal" style={{ borderRadius: '10px' }}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-lg flex-fill" disabled={loading} style={{ borderRadius: '10px' }}>
                  {loading ? 'Creating...' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Notes;
