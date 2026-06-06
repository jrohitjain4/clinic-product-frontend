import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import { all_routes } from "../../../../../routes/all_routes";
import { toast } from "react-toastify";
import { apiUrl } from "../../../../../../core/config/api";

const TodoList = () => {
  const [todos, setTodos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [newTodo, setNewTodo] = useState({ title: "", priority: "Medium", taskDate: "" });

  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const filteredTodos = todos.filter((todo) => {
    let match = true;
    if (filterStatus && todo.status !== filterStatus) match = false;
    if (filterPriority && todo.priority !== filterPriority) match = false;
    if (filterDate && todo.taskDate && !todo.taskDate.startsWith(filterDate)) match = false;
    return match;
  });

  const fetchTodos = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/todos"), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      if (res.ok) setTodos(data);
    } catch (error) {
      console.error("Error fetching todos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.title.trim()) {
      toast.error("Task description is required", { position: "top-center" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/todos"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(newTodo),
      });
      if (res.ok) {
        const data = await res.json();
        setTodos([data, ...todos]);
        setNewTodo({ title: "", priority: "Medium", taskDate: "" });
        toast.success("Task created successfully!", { position: "top-center" });
        const closeBtn = document.getElementById("close_add_todo");
        if (closeBtn) closeBtn.click();
      }
    } catch (error) {
      toast.error("Failed to add task", { position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string, updates: any) => {
    try {
      const res = await fetch(apiUrl(`/api/todos/${id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setTodos(todos.map(t => t.id === id ? data : t));
        if (updates.status) {
          toast.info(`Task status updated to ${updates.status}`, { position: "top-center" });
        }
      }
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(apiUrl(`/api/todos/${id}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (res.ok) {
        setTodos(todos.filter(t => t.id !== id));
        toast.success("Task deleted", { position: "top-center" });
      }
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} tasks?`)) return;

    try {
      const res = await fetch(apiUrl("/api/todos/bulk-delete"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (res.ok) {
        setTodos(todos.filter((t) => !selectedIds.includes(t.id)));
        setSelectedIds([]);
        toast.success(`Successfully deleted ${selectedIds.length} tasks!`, { position: "top-center" });
      }
    } catch (error) {
      toast.error("Bulk delete failed", { position: "top-center" });
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredTodos.map((t) => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Header */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 p-4 bg-white shadow-sm border-0" style={{ borderRadius: '15px' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-primary-light p-2 rounded-3 text-primary">
                    <i className="ti ti-checklist fs-24"></i>
                  </div>
                  <div>
                    <h4 className="fw-bold mb-0">Hamonis To Do List</h4>
                    <p className="text-muted small mb-0">Manage your daily clinical tasks</p>
                  </div>
                  {selectedIds.length > 0 && (
                    <button
                      className="btn btn-danger btn-sm d-flex align-items-center gap-2 px-3 ms-2 transition-all"
                      onClick={handleBulkDelete}
                      style={{ borderRadius: '10px' }}
                    >
                      <i className="ti ti-trash"></i>
                      Bulk Delete ({selectedIds.length})
                    </button>
                  )}
                </div>
                <button
                  className="btn btn-primary d-flex align-items-center px-4 py-2 shadow-sm"
                  style={{ borderRadius: '12px' }}
                  data-bs-toggle="modal"
                  data-bs-target="#add_todo"
                >
                  <i className="ti ti-plus me-2"></i> Add New Task
                </button>
              </div>
            </div>
          </div>

          {/* Tasks Table */}
          <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '15px' }}>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0 custom-todo-table align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th className="ps-4" style={{ width: "60px" }}>
                        <div className="form-check custom-checkbox">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={todos.length > 0 && selectedIds.length === todos.length}
                            onChange={handleSelectAll}
                          />
                        </div>
                      </th>
                      <th>Task Details</th>
                      <th>Target Date</th>
                      <th>Priority</th>
                      <th>Progress</th>
                      <th className="text-end pe-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="text-center p-5">
                          <div className="spinner-border text-primary" role="status"></div>
                          <p className="mt-2 text-muted">Synchronizing tasks...</p>
                        </td>
                      </tr>
                    ) : todos.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center p-5">
                          <div className="text-muted mb-3"><i className="ti ti-clipboard-list fs-48"></i></div>
                          <h6 className="text-muted">No pending tasks. You're all caught up!</h6>
                        </td>
                      </tr>
                    ) : (
                      todos.map((todo, index) => (
                        <tr key={todo.id} className={selectedIds.includes(todo.id) ? 'bg-light-primary' : ''}>
                          <td className="ps-4">
                            <div className="form-check custom-checkbox">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={selectedIds.includes(todo.id)}
                                onChange={() => handleSelectRow(todo.id)}
                              />
                            </div>
                          </td>
                          <td>
                            <div className="d-flex flex-column">
                              <span className={`fw-bold ${todo.status === 'Completed' ? 'text-decoration-line-through text-muted' : 'text-dark'}`}>
                                {todo.title}
                              </span>
                              <span className="small text-muted">ID: #{todo.id.slice(-5)}</span>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center text-muted small fw-semibold">
                              <i className="ti ti-calendar me-2 fs-14"></i>
                              {todo.taskDate ? new Date(todo.taskDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Flexible'}
                            </div>
                          </td>
                          <td>
                            <span className={`badge rounded-pill px-3 py-2 ${todo.priority === 'High' ? 'bg-danger-light text-danger' :
                                todo.priority === 'Medium' ? 'bg-warning-light text-warning' : 'bg-info-light text-info'
                              }`}>
                              {todo.priority}
                            </span>
                          </td>
                          <td>
                            <div className="form-check form-switch custom-switch-primary">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                checked={todo.status === 'Completed'}
                                onChange={(e) => handleUpdate(todo.id, { status: e.target.checked ? 'Completed' : 'Pending' })}
                              />
                              <label className={`form-check-label small fw-bold ms-2 ${todo.status === 'Completed' ? 'text-success' : 'text-primary'}`}>
                                {todo.status}
                              </label>
                            </div>
                          </td>
                          <td className="text-end pe-4">
                            <button className="btn btn-light btn-icon btn-sm rounded-3 shadow-none hover-danger" onClick={() => handleDelete(todo.id)}>
                              <i className="ti ti-trash text-danger"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Add Todo Modal */}
        <div id="add_todo" className="modal fade" tabIndex={-1} aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px' }}>
              <div className="modal-header bg-primary text-white border-0 py-3" style={{ borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }}>
                <h5 className="modal-title text-white">Create New Task</h5>
                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" id="close_add_todo"></button>
              </div>
              <div className="modal-body p-4">
                <form onSubmit={handleCreate}>
                  <div className="mb-3">
                    <label className="form-label fw-bold text-uppercase fs-12">Task Description <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control bg-light border-0 py-3"
                      rows={3}
                      placeholder="Enter task details..."
                      value={newTodo.title}
                      onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                      required
                      style={{ borderRadius: '12px' }}
                    ></textarea>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold text-uppercase fs-12">Target Date</label>
                      <input
                        type="date"
                        className="form-control bg-light border-0 py-2"
                        value={newTodo.taskDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setNewTodo({ ...newTodo, taskDate: e.target.value })}
                        style={{ borderRadius: '10px' }}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold text-uppercase fs-12">Priority</label>
                      <select
                        className="form-select bg-light border-0 py-2"
                        value={newTodo.priority}
                        onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value })}
                        style={{ borderRadius: '10px' }}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>
                  <div className="d-grid gap-2 mt-4">
                    <button type="submit" className="btn btn-primary d-flex align-items-center justify-content-center py-2 shadow-sm" disabled={loading} style={{ borderRadius: '12px' }}>
                      {loading ? <div className="spinner-border spinner-border-sm me-2"></div> : <i className="ti ti-device-floppy me-2"></i>}
                      {loading ? 'Creating...' : 'Finalize Task'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TodoList;
