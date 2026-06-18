import React, { useState, useEffect } from "react";
import EmptyState from "../../../../../../core/common/emptyState";
import { Link } from "react-router";
import { all_routes } from "../../../../../routes/all_routes";
import { toast } from "react-toastify";
import { apiUrl } from "../../../../../../core/config/api";
import Datatable from "../../../../../../core/common/dataTable";
import { DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

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
  const [filterDatePreset, setFilterDatePreset] = useState("All");
  const [customRange, setCustomRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);

  const filteredTodos = todos.filter((todo) => {
    let match = true;
    if (filterStatus && todo.status !== filterStatus) match = false;
    if (filterPriority && todo.priority !== filterPriority) match = false;

    if (filterDatePreset !== "All") {
      const itemDate = dayjs(todo.taskDate);
      if (filterDatePreset === "Today") {
        match = itemDate.isSame(dayjs(), "day");
      } else if (filterDatePreset === "Yesterday") {
        match = itemDate.isSame(dayjs().subtract(1, "day"), "day");
      } else if (filterDatePreset === "This Week") {
        match = itemDate.isAfter(dayjs().startOf("week").subtract(1, "day")) && itemDate.isBefore(dayjs().endOf("week").add(1, "day"));
      } else if (filterDatePreset === "This Month") {
        match = itemDate.isSame(dayjs(), "month");
      } else if (filterDatePreset === "Custom") {
        if (customRange[0] && customRange[1]) {
          match = itemDate.isAfter(customRange[0].startOf("day").subtract(1, "second")) && itemDate.isBefore(customRange[1].endOf("day").add(1, "second"));
        }
      }
    }
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

  const columns = [
    {
      title: "#",
      dataIndex: "index",
      render: (text: number) => <span className="text-dark fw-medium">{text}</span>,
      sorter: (a: any, b: any) => a.index - b.index,
      width: 50,
    },
    {
      title: "Task Description",
      dataIndex: "title",
      render: (text: string, record: any) => (
        <div style={{ maxWidth: '300px' }}>
          <div
            className={record.status === 'Completed' ? 'text-decoration-line-through text-muted' : 'text-dark fw-bold fs-14'}
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
        <span className="text-dark fw-medium fs-13">
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
          <label className="form-check-label text-dark fw-bold fs-13 mb-0">{text}</label>
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
        {/* Page Header */}
        <div className="page-header d-flex align-items-sm-center flex-sm-row flex-column gap-2 border-bottom pb-3 mb-3">
          <div className="flex-grow-1">
            <h4 className="page-title fw-bold mb-0 d-flex align-items-center">
              Dynamic To Do List
              <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                Total Tasks : {todos.length}
              </span>
            </h4>
          </div>

          <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
            {(filterStatus || filterPriority) && (
              <button
                type="button"
                className="btn btn-white d-flex align-items-center gap-1 text-danger border"
                onClick={() => {
                  setFilterStatus("");
                  setFilterPriority("");
                  setFilterDatePreset("All");
                  setCustomRange([null, null]);
                }}
                style={{ minHeight: "38px", fontWeight: "700", fontSize: "13px", borderRadius: "6px" }}
              >
                <i className="ti ti-rotate"></i> Clear All
              </button>
            )}

            {/* Status Filter */}
            <div className="dropdown">
              <Link
                to="#"
                className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap"
                style={{ minWidth: "130px", minHeight: "38px" }}
                data-bs-toggle="dropdown"
              >
                <span className="text-truncate">
                  <span className="text-muted">Status:</span> {filterStatus || "All"}
                </span>
              </Link>
              <ul className="dropdown-menu dropdown-menu-end p-2">
                {["", "Pending", "Completed"].map((s) => (
                  <li key={s}>
                    <Link to="#" className="dropdown-item rounded-1" onClick={(e) => { e.preventDefault(); setFilterStatus(s); }}>{s || "All"}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Priority Filter */}
            <div className="dropdown">
              <Link
                to="#"
                className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap"
                style={{ minWidth: "130px", minHeight: "38px" }}
                data-bs-toggle="dropdown"
              >
                <span className="text-truncate">
                  <span className="text-muted">Priority:</span> {filterPriority || "All"}
                </span>
              </Link>
              <ul className="dropdown-menu dropdown-menu-end p-2">
                {["", "High", "Medium", "Low"].map((p) => (
                  <li key={p}>
                    <Link to="#" className="dropdown-item rounded-1" onClick={(e) => { e.preventDefault(); setFilterPriority(p); }}>{p || "All"}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Date Filter */}
            <div className="dropdown">
              <Link
                to="#"
                className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap"
                style={{ minWidth: "160px", minHeight: "38px" }}
                data-bs-toggle="dropdown"
              >
                <span className="text-truncate">
                  <span className="text-muted"><i className="ti ti-calendar me-1"></i></span> {filterDatePreset === "All" ? "Select Date" : filterDatePreset}
                </span>
              </Link>
              <ul className="dropdown-menu dropdown-menu-end p-2" style={{ minWidth: "200px" }}>
                {["All", "Today", "Yesterday", "This Week", "This Month", "Custom"].map((preset) => (
                  <li key={preset}>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => {
                        e.preventDefault();
                        if (preset === "Custom") e.stopPropagation();
                        setFilterDatePreset(preset);
                      }}
                    >
                      {preset}
                    </Link>
                  </li>
                ))}
                {filterDatePreset === "Custom" && (
                  <li className="p-2 border-top mt-2">
                    <DatePicker.RangePicker
                      format="DD-MM-YYYY"
                      className="w-100"
                      value={customRange}
                      onChange={(dates) => setCustomRange(dates ? [dates[0], dates[1]] : [null, null])}
                    />
                  </li>
                )}
              </ul>
            </div>

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
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px', overflow: 'hidden' }}>
            <div className="modal-header border-0 bg-transparent pt-4 px-4 pb-0">
              <div className="d-flex align-items-center">
                <div className="bg-primary-subtle rounded-circle p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                  <i className="ti ti-clipboard-list text-primary fs-20" />
                </div>
                <div>
                  <h5 className="modal-title fw-bold fs-18 mb-1">{isViewMode ? "Task Details" : (editTodo ? "Edit Task" : "Create New Task")}</h5>
                  <p className="text-muted fs-13 mb-0">{isViewMode ? "View comprehensive task information" : "Fill in the details below"}</p>
                </div>
              </div>
              <button type="button" className="btn-close" data-bs-dismiss="modal" id="close_add_todo"></button>
            </div>

            <div className="modal-body p-4">
              {isViewMode ? (
                <div className="row g-3">
                  <div className="col-12">
                    <div className="card bg-white border border-dark shadow-none mb-0" style={{ borderRadius: '10px' }}>
                      <div className="card-body p-3 d-flex justify-content-between align-items-center">
                        <div>
                          <h4 className="fw-bold mb-1 text-dark">{newTodo.title}</h4>
                          <span className={`badge border ${newTodo.priority === 'High' ? 'badge-soft-danger border-danger' :
                            newTodo.priority === 'Medium' ? 'badge-soft-warning border-warning' : 'badge-soft-info border-info'}`}>
                            <i className="fas fa-circle fs-8 me-1" /> {newTodo.priority} Priority
                          </span>
                        </div>
                        <div className="text-end">
                          <span className="text-dark fw-bold fs-12 d-block">Current Status</span>
                          <span className={`badge ${editTodo?.status === 'Completed' ? 'bg-success' : 'bg-warning'} text-white rounded-pill px-3 pb-1 pt-1 mt-1`}>
                            {editTodo?.status || 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="border border-dark rounded p-3 d-flex align-items-center h-100 bg-white text-dark">
                      <div className="bg-primary-subtle rounded p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                        <i className="ti ti-calendar text-primary fs-18" />
                      </div>
                      <div>
                        <span className="text-dark fs-12 d-block fw-bold mb-1 uppercase">Task Date</span>
                        <h6 className="mb-0 fw-bold fs-14 text-dark">{newTodo.taskDate ? new Date(newTodo.taskDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'No date set'}</h6>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="border border-dark rounded p-3 d-flex align-items-center h-100 bg-white text-dark">
                      <div className="bg-info-subtle rounded p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                        <i className="ti ti-flag text-info fs-18" />
                      </div>
                      <div>
                        <span className="text-dark fs-12 d-block fw-bold mb-1 uppercase">Priority Level</span>
                        <h6 className="mb-0 fw-bold fs-14 text-dark">{newTodo.priority}</h6>
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="border border-dark rounded p-3 bg-white text-dark">
                      <div className="d-flex align-items-center mb-2">
                        <div className="bg-danger-subtle rounded p-2 me-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                          <i className="ti ti-notes text-danger fs-14" />
                        </div>
                        <span className="text-dark fs-12 fw-bold uppercase">Description</span>
                      </div>
                      <h6 className="mb-0 fw-medium fs-14 text-dark lh-base">{newTodo.title}</h6>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
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
                </form>
              )}
            </div>

            <div className="modal-footer border-top pt-3 pb-3 px-4 d-flex align-items-center gap-2">
              {isViewMode ? (
                <>
                  <button
                    type="button"
                    className="btn btn-outline-primary d-flex align-items-center gap-2"
                    onClick={() => setIsViewMode(false)}
                    style={{ borderRadius: '8px', minWidth: '140px' }}
                  >
                    <i className="ti ti-edit fs-16" /> Edit Task
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary px-4"
                    data-bs-dismiss="modal"
                    style={{ borderRadius: '8px', minWidth: '100px', backgroundColor: '#624bff', borderColor: '#624bff' }}
                  >
                    Close
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="btn btn-light px-4 border" data-bs-dismiss="modal" style={{ borderRadius: '6px' }}>Cancel</button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 d-flex align-items-center justify-content-center"
                    disabled={loading}
                    style={{ borderRadius: '6px' }}
                    onClick={(e) => handleSubmit(e as any)}
                  >
                    {loading && <i className="fa fa-spinner fa-spin me-2" />}
                    {loading ? 'Saving...' : (editTodo ? 'Save Changes' : 'Create Task')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div id="delete_modal" className="modal fade" role="dialog">
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
                <button type="button" className="btn btn-light me-3" data-bs-dismiss="modal" id="close_delete_modal">Cancel</button>
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
