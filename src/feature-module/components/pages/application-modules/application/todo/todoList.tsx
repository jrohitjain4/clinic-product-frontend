import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import { all_routes } from "../../../../../routes/all_routes";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { apiUrl } from "../../../../../../core/config/api";

const TodoList = () => {
  const [todos, setTodos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTodo, setNewTodo] = useState({ title: "", priority: "Medium" });
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
        setNewTodo({ title: "", priority: "Medium" });
        toast.success("Task added successfully!");
        // Close modal manually if needed or use state
        const closeBtn = document.getElementById("close_add_todo");
        if (closeBtn) closeBtn.click();
      }
    } catch (error) {
      toast.error("Failed to add task");
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

  return (
    <div className="page-wrapper">
      <ToastContainer position="top-right" autoClose={2000} />
      <div className="content">
        <div className="row">
          <div className="col-md-12">
            <div className="section-header d-flex justify-content-between align-items-center mb-4">
              <h4 className="page-title">Dynamic To Do List</h4>
              <button className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#add_todo">
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
                    <th style={{ width: "50px" }}>#</th>
                    <th>Task Description</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center p-5">
                        <div className="spinner-border text-primary" role="status"></div>
                        <p className="mt-2 text-muted">Loading your tasks...</p>
                      </td>
                    </tr>
                  ) : todos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-5 text-muted">
                        No tasks found. Click "Add New Task" to get started!
                      </td>
                    </tr>
                  ) : (
                    todos.map((todo, index) => (
                      <tr key={todo.id}>
                        <td>{index + 1}</td>
                        <td>
                          <span className={todo.status === 'Completed' ? 'text-decoration-line-through text-muted' : 'fw-medium'}>
                            {todo.title}
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
                  <label className="form-label fw-bold">Task Description</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="What needs to be done?"
                    value={newTodo.title}
                    onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Priority</label>
                  <select
                    className="form-select form-select-lg"
                    value={newTodo.priority}
                    onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="text-end mt-4">
                  <button type="button" className="btn btn-light me-2 px-4" data-bs-dismiss="modal">Cancel</button>
                  <button type="submit" className="btn btn-primary px-4 bg-primary text-white border-0">Create Task</button>
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
