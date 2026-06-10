import React, { useState, useEffect } from "react";
import EmptyState from "../../../../../../core/common/emptyState";
import { Link } from "react-router";
import { all_routes } from "../../../../../routes/all_routes";
import { toast } from "react-toastify";
import { apiUrl } from "../../../../../../core/config/api";
import Datatable from "../../../../../../core/common/dataTable";

const Notes = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [newNote, setNewNote] = useState({ title: "", content: "", priority: "Medium", noteDate: new Date().toISOString().split("T")[0] });
  const [editNote, setEditNote] = useState<any>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [filterPriority, setFilterPriority] = useState("");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);

  const filteredNotes = notes.filter((note) => {
    let match = true;
    if (filterPriority && note.priority !== filterPriority) match = false;
    if (filterDate && note.noteDate && note.noteDate.split('T')[0] !== filterDate) match = false;
    return match;
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) {
      const closeBtn = document.getElementById("close_add_note");
      if (closeBtn) closeBtn.click();
      return;
    }
    if (!newNote.title.trim() || !newNote.content.trim()) {
      toast.error("Both Title and Description are required", { position: "top-center" });
      return;
    }
    setLoading(true);
    try {
      if (editNote) {
        const res = await fetch(apiUrl(`/api/notes/${editNote.id || editNote._id}`), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(newNote),
        });
        if (res.ok) {
          const data = await res.json();
          setNotes(notes.map(n => (n.id === editNote.id || n._id === editNote._id) ? data : n));
          setEditNote(null);
          setNewNote({ title: "", content: "", priority: "Medium", noteDate: new Date().toISOString().split("T")[0] });
          toast.success("Note updated successfully!", { position: "top-center" });
          const closeBtn = document.getElementById("close_add_note");
          if (closeBtn) closeBtn.click();
        } else {
          toast.error("Failed to update note", { position: "top-center" });
        }
      } else {
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
          setNewNote({ title: "", content: "", priority: "Medium", noteDate: new Date().toISOString().split("T")[0] });
          toast.success("Note created successfully!", { position: "top-center" });
          const closeBtn = document.getElementById("close_add_note");
          if (closeBtn) closeBtn.click();
        } else {
          toast.error("Failed to add note", { position: "top-center" });
        }
      }
    } catch (error) {
      toast.error(editNote ? "Update failed" : "Create failed", { position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string | null) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/notes/${id}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (res.ok) {
        setNotes(prev => prev.filter(n => (n._id !== id && n.id !== id)));
        toast.success("Note deleted successfully", { position: "top-center" });
        const closeBtn = document.getElementById("close_delete_modal");
        if (closeBtn) closeBtn.click();
      } else {
        toast.error("Failed to delete note");
      }
    } catch (error) {
      toast.error("An error occurred while deleting");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    try {
      const res = await fetch(apiUrl("/api/notes/bulk-delete"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (res.ok) {
        setNotes(notes.filter((n) => !selectedIds.includes(n.id || n._id)));
        setSelectedIds([]);
        toast.success(`Successfully deleted ${selectedIds.length} notes!`, { position: "top-center" });
        const closeBtn = document.getElementById("close_delete_modal");
        if (closeBtn) closeBtn.click();
      }
    } catch (error) {
      toast.error("Bulk delete failed", { position: "top-center" });
    }
  };

  const columns = [
    {
      title: "#",
      dataIndex: "index",
      render: (text: number) => <span>{text}</span>,
      sorter: (a: any, b: any) => a.index - b.index,
      width: 50,
    },
    {
      title: "Note Title",
      dataIndex: "title",
      render: (text: string, record: any) => (
        <span className="fw-medium text-wrap" style={{ display: 'inline-block', maxWidth: '200px' }}>{text}</span>
      ),
      sorter: (a: any, b: any) => a.title.localeCompare(b.title),
    },
    {
      title: "Description",
      dataIndex: "content",
      render: (text: string) => (
        <div style={{ maxWidth: '300px' }}>
          <div
            className="text-muted"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'normal',
              wordBreak: 'break-word'
            }}
            title={text}
          >
            {text}
          </div>
        </div>
      ),
      sorter: (a: any, b: any) => a.content.localeCompare(b.content),
    },
    {
      title: "Date",
      dataIndex: "noteDate",
      render: (text: string) => (
        <span className="text-muted fs-13">
          {text ? new Date(text).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
        </span>
      ),
      sorter: (a: any, b: any) => new Date(a.noteDate || 0).getTime() - new Date(b.noteDate || 0).getTime(),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      render: (text: string) => (
        <span className={`badge rounded-pill ${text === 'High' ? 'bg-danger' :
          text === 'Medium' ? 'bg-warning text-dark' : 'bg-info'
          }`}>
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => a.priority.localeCompare(b.priority),
    },
    {
      title: "Action",
      dataIndex: "action",
      align: "right",
      render: (_: any, record: any) => (
        <div className="text-end d-flex align-items-center justify-content-end gap-2">
          <button
            className="bg-transparent border-0 text-info p-1"
            title="View Note"
            data-bs-toggle="modal"
            data-bs-target="#add_note"
            onClick={(e) => {
              e.preventDefault();
              setEditNote(record);
              setNewNote({ title: record.title, content: record.content, priority: record.priority, noteDate: record.noteDate ? record.noteDate.split('T')[0] : "" });
              setIsViewMode(true);
            }}
          >
            <i className="fa fa-eye fs-16"></i>
          </button>
          <button
            className="bg-transparent border-0 text-primary p-1"
            title="Edit Note"
            data-bs-toggle="modal"
            data-bs-target="#add_note"
            onClick={(e) => {
              e.preventDefault();
              setEditNote(record);
              setNewNote({ title: record.title, content: record.content, priority: record.priority, noteDate: record.noteDate ? record.noteDate.split('T')[0] : "" });
              setIsViewMode(false);
            }}
          >
            <i className="fa fa-edit fs-16"></i>
          </button>
          <button
            className="bg-transparent border-0 text-danger p-1"
            title="Delete Note"
            data-bs-toggle="modal"
            data-bs-target="#delete_modal"
            onClick={(e) => {
              e.preventDefault();
              setDeleteId(record.id || record._id);
            }}
          >
            <i className="fa fa-trash-alt fs-16"></i>
          </button>
        </div>
      ),
    },
  ];

  const tableData = filteredNotes.map((note, index) => ({
    ...note,
    index: index + 1,
    key: note.id || note._id,
  }));

  return (
    <div className="page-wrapper">
      <div className="content d-flex flex-column" style={{ minHeight: 'calc(100vh - 60px)' }}>
        <div className="page-header d-flex align-items-sm-center flex-sm-row flex-column gap-2 border-bottom">
          <div className="flex-grow-1">
            <h4 className="page-title fw-bold mb-0">Clinic Notes</h4>
          </div>
          <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
            <select className="form-select" style={{ width: '120px' }} value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
              <option value="">Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <input type="date" className="form-control" style={{ width: '140px' }} title="Date wise" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
            {(filterPriority || (filterDate !== new Date().toISOString().split("T")[0] && filterDate !== "")) && (
              <button className="btn btn-white border d-flex align-items-center" onClick={() => {
                setFilterPriority("");
                setFilterDate(new Date().toISOString().split("T")[0]);
              }}>
                Clear filter
              </button>
            )}
            <button
              className="btn btn-primary d-flex align-items-center justify-content-center"
              style={{ minHeight: '38px', whiteSpace: 'nowrap' }}
              data-bs-toggle="modal"
              data-bs-target="#add_note"
              onClick={() => {
                setEditNote(null);
                setNewNote({ title: "", content: "", priority: "Medium", noteDate: new Date().toISOString().split("T")[0] });
                setIsViewMode(false);
              }}
            >
              Add New Note <i className="fa fa-plus ms-2"></i>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <span className="spinner-border text-primary" role="status" />
          </div>
        ) : tableData.length === 0 ? (
          <div className="border rounded bg-white mt-3">
            <EmptyState
              title="No notes yet"
              message="Jot down quick reminders, meeting minutes, or patient-related memos here."
              action={
                <button className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#add_note">
                  Add New Note <i className="ti ti-plus ms-2" />
                </button>
              }
            />
          </div>
        ) : (
          <div className="table-responsive">
            <Datatable
              columns={columns}
              dataSource={tableData}
              Selection={true}
              searchText=""
              onSelectionChange={(keys) => setSelectedIds(keys as string[])}
            />
          </div>
        )}

        {selectedIds.length > 0 && (
          <div className="d-flex justify-content-center mt-auto pt-4 pb-4">
            <button
              className="btn btn-danger d-flex align-items-center gap-2 px-4 py-2 shadow"
              data-bs-toggle="modal"
              data-bs-target="#delete_modal"
              onClick={() => setDeleteId(null)}
              style={{ borderRadius: '8px', minHeight: '42px', fontWeight: 'bold' }}
            >
              <i className="ti ti-trash fs-18"></i>
              Delete Selected ({selectedIds.length})
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit/View Note Modal */}
      <div id="add_note" className="modal fade" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">{isViewMode ? "View Note" : (editNote ? "Edit Note" : "Create New Note")}</h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" id="close_add_note"></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-bold">Note Title {isViewMode ? '' : <span className="text-danger">*</span>}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter title"
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    required
                    disabled={isViewMode}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Description {isViewMode ? '' : <span className="text-danger">*</span>}</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Enter detailed notes here..."
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    required
                    disabled={isViewMode}
                  ></textarea>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={newNote.noteDate}
                      onChange={(e) => setNewNote({ ...newNote, noteDate: e.target.value })}
                      disabled={isViewMode}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Priority</label>
                    <select
                      className="form-select"
                      value={newNote.priority}
                      onChange={(e) => setNewNote({ ...newNote, priority: e.target.value })}
                      disabled={isViewMode}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                  <button type="button" className="btn btn-light px-4 shadow-sm" data-bs-dismiss="modal" style={{ borderRadius: '6px' }}>{isViewMode ? 'Close' : 'Cancel'}</button>
                  {!isViewMode && (
                    <button type="submit" className="btn btn-primary px-4 shadow-sm d-flex align-items-center justify-content-center" disabled={loading} style={{ borderRadius: '6px' }}>
                      {loading && <i className="fa fa-spinner fa-spin me-2" />}
                      {loading ? 'Saving...' : (editNote ? 'Save Changes' : 'Create Note')}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <div className="modal fade" id="delete_modal">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
            <div className="modal-body text-center">
              <div className="mb-3">
                <span className="avatar bg-danger rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', margin: '0 auto' }}>
                  <i className="ti ti-trash fs-24 text-white" />
                </span>
              </div>
              <h6 className="mb-1">Delete Confirmation</h6>
              <p className="mb-3">
                {deleteId ? "Are you sure you want to delete this note?" : `Are you sure you want to delete ${selectedIds.length} notes?`}
              </p>
              <div className="d-flex justify-content-center">
                <button
                  type="button"
                  className="btn btn-light me-3"
                  data-bs-dismiss="modal"
                  id="close_delete_modal"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={loading}
                  onClick={() => {
                    if (deleteId) {
                      handleDelete(deleteId);
                    } else {
                      handleBulkDelete();
                    }
                  }}
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notes;
