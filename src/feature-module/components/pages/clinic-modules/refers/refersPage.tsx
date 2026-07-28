import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { apiUrl } from "../../../../../core/config/api";
import { IconFormControl } from "../../../../../core/common/form-fields";

interface Refer {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

const RefsPage = () => {
  const [refers, setRefers] = useState<Refer[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editRef, setEditRef] = useState<Refer | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const token = () => localStorage.getItem("token");

  const fetchRefers = () => {
    setLoading(true);
    fetch(apiUrl("/api/refers"), { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(data => setRefers(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Failed to load refers"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRefers(); }, []);

  const openCreate = () => {
    setEditRef(null);
    setName("");
    setDescription("");
    setShowForm(true);
  };

  const openEdit = (r: Refer) => {
    setEditRef(r);
    setName(r.name);
    setDescription(r.description || "");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSubmitting(true);
    try {
      const url = editRef ? apiUrl(`/api/refers/${editRef.id}`) : apiUrl("/api/refers");
      const method = editRef ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error saving");
      }
      toast.success(editRef ? "Refer updated" : "Refer created");
      setShowForm(false);
      fetchRefers();
    } catch (err: any) {
      toast.error(err.message || "Error saving refer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this refer source?")) return;
    try {
      const res = await fetch(apiUrl(`/api/refers/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      toast.success("Refer deleted");
      fetchRefers();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Page Header */}
        <div className="d-md-flex d-block align-items-center justify-content-between mb-4">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Refer Sources</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item"><span>Settings</span></li>
                <li className="breadcrumb-item active" aria-current="page">Refer Sources</li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <button className="btn btn-primary" onClick={openCreate}>
              <i className="ti ti-plus me-2" />Add Refer Source
            </button>
          </div>
        </div>

        {/* Add/Edit Form Card */}
        {showForm && (
          <div className="card mb-4">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="mb-0">{editRef ? "Edit Refer Source" : "Add Refer Source"}</h5>
              <button className="btn btn-sm btn-light" onClick={() => setShowForm(false)}>
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-5">
                    <label className="form-label fw-medium">
                      Name <span className="text-danger">*</span>
                    </label>
                    <IconFormControl
                      fieldLabel="Name"
                      type="text"
                      placeholder="e.g. Google, Walk-in, Doctor Referral"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-5">
                    <label className="form-label fw-medium">
                      Description <span className="text-muted fs-12">(Optional)</span>
                    </label>
                    <IconFormControl
                      fieldLabel="description"
                      type="text"
                      placeholder="Short description (optional)"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="col-md-2 d-flex align-items-end gap-2">
                    <button className="btn btn-primary w-100" type="submit" disabled={submitting}>
                      {submitting ? "Saving..." : editRef ? "Update" : "Save"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Table Card */}
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">All Refer Sources</h5>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status" />
              </div>
            ) : refers.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="ti ti-user-check fs-48 d-block mb-2" />
                No refer sources added yet.
                <br />
                <button className="btn btn-primary mt-3" onClick={openCreate}>
                  Add First Refer Source
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 60 }}>#</th>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Created</th>
                      <th style={{ width: 120 }} className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refers.map((r, i) => (
                      <tr key={r.id}>
                        <td className="text-muted">{i + 1}</td>
                        <td>
                          <span className="fw-semibold text-dark">{r.name}</span>
                        </td>
                        <td className="text-muted">
                          {r.description || <span className="text-muted fst-italic">—</span>}
                        </td>
                        <td className="text-muted fs-13">
                          {new Date(r.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit", month: "short", year: "numeric"
                          })}
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => openEdit(r)}
                            title="Edit"
                          >
                            <i className="ti ti-edit" />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(r.id)}
                            title="Delete"
                          >
                            <i className="ti ti-trash" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefsPage;
