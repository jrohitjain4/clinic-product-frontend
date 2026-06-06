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
  const [editTodo, setEditTodo] = useState<any>(null);

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
      toast.error("Task description is required");
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

        toast.success("Task created successfully!", {
          position: "top-center"
        });

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
          toast.info(`Task status updated to ${updates.status}`);
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
        toast.success("Task deleted");
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
      setSelectedIds(todos.map((t) => t.id));
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
    <div className="page-wrapper">
      <div className="content">
        <div className="row">
          <div className="col-md-12">
            <div className="section-header d-flex justify-content-between align-items-center flex-nowrap gap-2 mb-4">
              <div className="d-flex align-items-center gap-3">
                <h4 className="page-title mb-0">Dynamic To Do List</h4>
                {selectedIds.length > 0 && (
                  <button
                    className="btn btn-danger btn-sm d-flex align-items-center gap-2 px-3 shadow-sm"
                    onClick={handleBulkDelete}
                    style={{ borderRadius: '8px', minHeight: '38px' }}
                  >
                    <i className="ti ti-trash fs-18"></i>
                    Delete Selected ({selectedIds.length})
                  </button>
                )}
              </div>
              <button
                className="btn btn-primary d-flex align-items-center justify-content-center"
                style={{ minHeight: '46px', whiteSpace: 'nowrap' }}
                data-bs-toggle="modal"
                data-bs-target="#add_todo"
              >
                <i className="fa fa-plus me-2"></i> Add New Task
              </button>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0 custom-todo-table">
                <thead className="bg-light">
                  <tr>
                    <th style={{ width: "40px" }}>
                      <div className="form-check custom-checkbox">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={todos.length > 0 && selectedIds.length === todos.length}
                          onChange={handleSelectAll}
                        />
                      </div>
                    </th>
                    <th style={{ width: "50px" }}>#</th>
                    <th>Task Description</th>
                    <th>Date</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center p-5">
                        <div className="spinner-border text-primary" role="status"></div>
                        <p className="mt-2 text-muted">Loading your tasks...</p>
                      </td>
                    </tr>
                  ) : todos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-5 text-muted">
                        No tasks found. Click "Add New Task" to get started!
                      </td>
                    </tr>
                  ) : (
                    todos.map((todo, index) => (
                      <tr key={todo.id} className={selectedIds.includes(todo.id) ? 'bg-light-primary' : ''}>
                        <td>
                          <div className="form-check custom-checkbox">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={selectedIds.includes(todo.id)}
                              onChange={() => handleSelectRow(todo.id)}
                            />
                          </div>
                        </td>
                        <td>{index + 1}</td>
                        <td style={{ maxWidth: '300px' }}>
                          <span className={todo.status === 'Completed' ? 'text-decoration-line-through text-muted' : 'fw-medium text-wrap'}>
                            {todo.title}
                          </span>
                        </td>
                        <td>
                          <span className="text-muted fs-13">
                            {todo.taskDate ? new Date(todo.taskDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge rounded-pill ${todo.priority === 'High' ? 'bg-danger' :
                            todo.priority === 'Medium' ? 'bg-warning text-dark' : 'bg-info'
                            }`}>
                            {todo.priority}
                          </span>
                        </td>
                        <td>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={todo.status === 'Completed'}
                              onChange={(e) => handleUpdate(todo.id, { status: e.target.checked ? 'Completed' : 'Pending' })}
                            />
                            <label className="form-check-label ms-1">
                              {todo.status}
                            </label>
                          </div>
                        </td>
                        <td className="text-end">
                          <div className="dropdown dropdown-action">
                            <button className="btn btn-icon btn-sm" onClick={() => handleDelete(todo.id)}>
                              <i className="fa fa-trash-alt text-danger"></i>
                            </button>
                          </div>
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
      <div id="add_todo" className="modal fade" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">Create New Task</h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" id="close_add_todo"></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreate}>
                <div className="mb-3">
                  <label className="form-label fw-bold">Task Description <span className="text-danger">*</span></label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="What needs to be done?"
                    value={newTodo.title}
                    onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                    required
                  ></textarea>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={newTodo.taskDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setNewTodo({ ...newTodo, taskDate: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Priority</label>
                    <select
                      className="form-select"
                      value={newTodo.priority}
                      onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value })}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
                <div className="text-end mt-4">
                  <button type="button" className="btn btn-light me-2 px-4 shadow-sm" data-bs-dismiss="modal">Cancel</button>
                  <button type="submit" className="btn btn-primary px-4 bg-primary text-white border-0 shadow-sm d-flex align-items-center" disabled={loading}>
                    {loading && <i className="fa fa-spinner fa-spin me-2" />}
                    {loading ? 'Creating...' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodoList;
