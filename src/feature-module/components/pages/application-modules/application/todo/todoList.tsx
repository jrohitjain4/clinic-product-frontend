import React, { useState, useEffect } from "react";
import EmptyState from "../../../../../../core/common/emptyState";
import { Link } from "react-router";
import { all_routes } from "../../../../../routes/all_routes";
import { toast } from "react-toastify";
import { apiUrl } from "../../../../../../core/config/api";
import Datatable from "../../../../../../core/common/dataTable";

const TodoList = () => {
  const [todos, setTodos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [newTodo, setNewTodo] = useState({ title: "", priority: "Medium", taskDate: new Date().toISOString().split("T")[0] });
  const [editTodo, setEditTodo] = useState<any>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) {
      const closeBtn = document.getElementById("close_add_todo");
      if (closeBtn) closeBtn.click();
      return;
    }
    if (!newTodo.title.trim()) {
      toast.error("Task description is required");
      return;
    }
    setLoading(true);
    try {
      if (editTodo) {
        const res = await fetch(apiUrl(`/api/todos/${editTodo.id}`), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(newTodo),
        });
        if (res.ok) {
          const data = await res.json();
          setTodos(todos.map(t => t.id === editTodo.id ? data : t));
          setEditTodo(null);
          setNewTodo({ title: "", priority: "Medium", taskDate: new Date().toISOString().split("T")[0] });
          toast.success("Task updated successfully!", { position: "top-center" });
          const closeBtn = document.getElementById("close_add_todo");
          if (closeBtn) closeBtn.click();
        } else {
          toast.error("Failed to update task", { position: "top-center" });
        }
      } else {
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
          setNewTodo({ title: "", priority: "Medium", taskDate: new Date().toISOString().split("T")[0] });
          toast.success("Task created successfully!", { position: "top-center" });
          const closeBtn = document.getElementById("close_add_todo");
          if (closeBtn) closeBtn.click();
        } else {
          toast.error("Failed to add task", { position: "top-center" });
        }
      }
    } catch (error) {
      toast.error(editTodo ? "Update failed" : "Create failed", { position: "top-center" });
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

  const handleDelete = async (id: string | null) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/todos/${id}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (res.ok) {
        setTodos(prev => prev.filter(t => t.id !== id));
        toast.success("Task deleted successfully", { position: "top-center" });
        const closeBtn = document.getElementById("close_delete_modal");
        if (closeBtn) closeBtn.click();
      } else {
        toast.error("Failed to delete task");
      }
    } catch (error) {
      toast.error("An error occurred during deletion");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

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
        const closeBtn = document.getElementById("close_delete_modal");
        if (closeBtn) closeBtn.click();
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

  const columns = [
    {
      title: "#",
      dataIndex: "index",
      render: (text: number) => <span>{text}</span>,
      sorter: (a: any, b: any) => a.index - b.index,
      width: 50,
    },
    {
      title: "Task Description",
      dataIndex: "title",
      render: (text: string, record: any) => (
        <div style={{ maxWidth: '300px' }}>
          <div
            className={record.status === 'Completed' ? 'text-decoration-line-through text-muted' : 'fw-medium'}
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
      sorter: (a: any, b: any) => a.title.localeCompare(b.title),
    },
    {
      title: "Date",
      dataIndex: "taskDate",
      render: (text: string) => (
        <span className="text-muted fs-13">
          {text ? new Date(text).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
        </span>
      ),
      sorter: (a: any, b: any) => new Date(a.taskDate || 0).getTime() - new Date(b.taskDate || 0).getTime(),
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
      title: "Status",
      dataIndex: "status",
      render: (text: string, record: any) => (
        <div className="form-check form-switch d-flex align-items-center">
          <input
            className="form-check-input me-2"
            type="checkbox"
            checked={text === 'Completed'}
            onChange={(e) => handleUpdate(record.id, { status: e.target.checked ? 'Completed' : 'Pending' })}
          />
          <label className="form-check-label text-muted fs-13 mb-0">{text}</label>
        </div>
      ),
      sorter: (a: any, b: any) => a.status.localeCompare(b.status),
    },
    {
      title: "Action",
      dataIndex: "action",
      align: "right",
      render: (_: any, record: any) => (
        <div className="text-end d-flex align-items-center justify-content-end gap-2">
          <button
            className="bg-transparent border-0 text-info p-1"
            title="View Task"
            data-bs-toggle="modal"
            data-bs-target="#add_todo"
            onClick={(e) => {
              e.preventDefault();
              setEditTodo(record);
              setNewTodo({ title: record.title, priority: record.priority, taskDate: record.taskDate ? record.taskDate.split('T')[0] : "" });
              setIsViewMode(true);
            }}
          >
            <i className="fa fa-eye fs-16"></i>
          </button>
          <button
            className="bg-transparent border-0 text-primary p-1"
            title="Edit Task"
            data-bs-toggle="modal"
            data-bs-target="#add_todo"
            onClick={(e) => {
              e.preventDefault();
              setEditTodo(record);
              setNewTodo({ title: record.title, priority: record.priority, taskDate: record.taskDate ? record.taskDate.split('T')[0] : "" });
              setIsViewMode(false);
            }}
          >
            <i className="fa fa-edit fs-16"></i>
          </button>
          <button
            className="bg-transparent border-0 text-danger p-1"
            title="Delete Task"
            data-bs-toggle="modal"
            data-bs-target="#delete_modal"
            onClick={(e) => {
              e.preventDefault();
              setDeleteId(record.id);
            }}
          >
            <i className="fa fa-trash-alt fs-16"></i>
          </button>
        </div>
      ),
    },
  ];

  const tableData = filteredTodos.map((todo, index) => ({
    ...todo,
    index: index + 1,
    key: todo.id,
  }));

  return (
    <div className="page-wrapper">
      <div className="content d-flex flex-column" style={{ minHeight: 'calc(100vh - 60px)' }}>
        <div className="page-header d-flex align-items-sm-center flex-sm-row flex-column gap-2 border-bottom">
          <div className="flex-grow-1">
            <h4 className="page-title fw-bold mb-0">Dynamic To Do List</h4>
          </div>
          <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
            <select className="form-select" style={{ width: '120px' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">Status</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
            <select className="form-select" style={{ width: '120px' }} value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
              <option value="">Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <input type="date" className="form-control" style={{ width: '140px' }} title="Date wise" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
            {(filterStatus || filterPriority || (filterDate !== new Date().toISOString().split("T")[0] && filterDate !== "")) && (
              <button className="btn btn-white border d-flex align-items-center" onClick={() => {
                setFilterStatus("");
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
              data-bs-target="#add_todo"
              onClick={() => {
                setEditTodo(null);
                setNewTodo({ title: "", priority: "Medium", taskDate: new Date().toISOString().split("T")[0] });
                setIsViewMode(false);
              }}
            >
              Add New Task <i className="fa fa-plus ms-2"></i>
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
              title="No tasks yet"
              message="Keep track of your clinical duties and administrative work by adding your first task."
              action={
                <button className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#add_todo">
                  Add New Task <i className="ti ti-plus ms-2" />
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

      {/* Add/Edit/View Todo Modal */}
      <div id="add_todo" className="modal fade" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">{isViewMode ? "View Task" : (editTodo ? "Edit Task" : "Create New Task")}</h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" id="close_add_todo"></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-bold">Task Description {isViewMode ? '' : <span className="text-danger">*</span>}</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="What needs to be done?"
                    value={newTodo.title}
                    onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
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
                      value={newTodo.taskDate}
                      onChange={(e) => setNewTodo({ ...newTodo, taskDate: e.target.value })}
                      disabled={isViewMode}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Priority</label>
                    <select
                      className="form-select"
                      value={newTodo.priority}
                      onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value })}
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
                      {loading ? 'Saving...' : (editTodo ? 'Save Changes' : 'Create Task')}
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
                {deleteId ? "Are you sure you want to delete this task?" : `Are you sure you want to delete ${selectedIds.length} tasks?`}
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

export default TodoList;
