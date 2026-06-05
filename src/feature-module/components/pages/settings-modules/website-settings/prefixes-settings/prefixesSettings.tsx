import { useState, useEffect } from "react"
import { Link } from "react-router"
import SettingsSidebar from "../../../../../../core/common/settings-sidebar/settingsSidebar"

const API = import.meta.env.VITE_API_URL || "http://localhost:5000"

interface Review { name: string; rating: number; feedback: string }

const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <div className="d-flex gap-1 mb-2">
    {[1, 2, 3, 4, 5].map(star => (
      <i key={star} className={`ti ti-star${star <= value ? "-filled" : ""} fs-5`}
        style={{ cursor: "pointer", color: star <= value ? "#f59e0b" : "#d1d5db" }}
        onClick={() => onChange(star)} />
    ))}
  </div>
)

const PrefixesSettings = () => {
  const [reviews, setReviews] = useState<Review[]>([])
  const [newReview, setNewReview] = useState<Review>({ name: "", rating: 5, feedback: "" })
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")

  const user = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}") } catch { return {} } })()
  const clinicId: string = user?.clinicId || user?.clinic?.id || ""

  useEffect(() => {
    if (!clinicId) return
    fetch(`${API}/api/landing/${clinicId}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data.reviews)) setReviews(data.reviews) })
      .catch(() => { })
  }, [clinicId])

  const addReview = () => {
    if (!newReview.name.trim() || !newReview.feedback.trim()) return
    setReviews(p => [...p, newReview])
    setNewReview({ name: "", rating: 5, feedback: "" })
  }

  const removeReview = (i: number) => setReviews(p => p.filter((_, idx) => idx !== i))

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!clinicId) {
      alert("Error: No Clinic ID found. Only Clinic Owners can save these settings.");
      return;
    }
    setSaving(true); setStatus("idle")
    try {
      const token = localStorage.getItem("token")
      const r = await fetch(`${API}/api/landing/${clinicId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reviews }),
      })
      if (!r.ok) throw new Error()
      setStatus("success")
    } catch {
      setStatus("error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="page-wrapper">
        <div className="content" id="profilePage">
          <div className="mb-3 border-bottom pb-3">
            <h4 className="fw-bold mb-0">Settings</h4>
          </div>
          <div className="card">
            <div className="card-body p-0">
              <div className="settings-wrapper d-flex">
                <SettingsSidebar />
                <div className="card flex-fill mb-0 border-0 bg-light-500 shadow-none">
                  <div className="card-header border-bottom px-0 mx-3">
                    <h5 className="fw-bold">Landing Page: Patient Reviews</h5>
                  </div>
                  <div className="card-body px-0 mx-3">

                    {status === "success" && (
                      <div className="alert alert-success d-flex align-items-center gap-2 mb-3">
                        <i className="ti ti-circle-check" /> Reviews saved successfully!
                      </div>
                    )}
                    {status === "error" && (
                      <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
                        <i className="ti ti-alert-circle" /> Failed to save. Please try again.
                      </div>
                    )}

                    <p className="text-muted mb-4">Add and manage patient testimonials shown on your landing page.</p>

                    {/* Current Reviews */}
                    <div className="mb-4">
                      <h6 className="fw-semibold text-muted mb-3">Current Reviews ({reviews.length})</h6>
                      {reviews.length === 0 ? (
                        <p className="text-muted small">No reviews added yet.</p>
                      ) : (
                        <div className="row g-3">
                          {reviews.map((r, i) => (
                            <div key={i} className="col-lg-6">
                              <div className="card border shadow-none h-100">
                                <div className="card-body p-3">
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                      <p className="fw-semibold mb-1">{r.name}</p>
                                      <div className="d-flex gap-1">
                                        {[1, 2, 3, 4, 5].map(s => (
                                          <i key={s} className={`ti ti-star${s <= r.rating ? "-filled" : ""}`}
                                            style={{ color: s <= r.rating ? "#f59e0b" : "#d1d5db" }} />
                                        ))}
                                      </div>
                                    </div>
                                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeReview(i)}>
                                      <i className="ti ti-trash" />
                                    </button>
                                  </div>
                                  <p className="text-muted mb-0 small">"{r.feedback}"</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add New */}
                    <div className="border-top pt-4 mb-4">
                      <h6 className="fw-semibold text-muted mb-3">Add New Review</h6>
                      <div className="row g-3">
                        <div className="col-lg-6">
                          <label className="form-label mb-1">Patient Name</label>
                          <input type="text" className="form-control" placeholder="e.g. Sunita Patel"
                            value={newReview.name}
                            onChange={e => setNewReview(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label mb-1">Star Rating</label>
                          <StarRating value={newReview.rating} onChange={v => setNewReview(p => ({ ...p, rating: v }))} />
                        </div>
                        <div className="col-12">
                          <label className="form-label mb-1">Feedback</label>
                          <textarea className="form-control" rows={3} placeholder="Write the patient's feedback..."
                            value={newReview.feedback}
                            onChange={e => setNewReview(p => ({ ...p, feedback: e.target.value }))} />
                        </div>
                        <div className="col-12">
                          <button type="button" className="btn btn-outline-primary" onClick={addReview}>
                            Add Review <i className="ti ti-plus ms-2" /></button>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex align-items-center justify-content-end">
                      <Link to="#" className="btn btn-light me-3">Cancel</Link>
                      <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Saving...</> : "Save Changes"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025 © <Link to="#" className="link-primary">Docyori</Link>, All Rights Reserved
          </p>
        </div>
      </div>
    </>
  )
}

export default PrefixesSettings
