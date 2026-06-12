import { useState, useEffect } from "react"
import { Link } from "react-router"
import SettingsSidebar from "../../../../../../core/common/settings-sidebar/settingsSidebar"
import { toast } from "react-toastify"

const API = import.meta.env.VITE_API_URL || "http://localhost:5000"

interface OverviewForm {
  about: string; established: string; patientsServed: string; experience: string;
}

const LocalizationSettings = () => {
  const [form, setForm] = useState<OverviewForm>({ about: "", established: "", patientsServed: "", experience: "" })
  const [saving, setSaving] = useState(false)

  const user = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}") } catch { return {} } })()
  const clinicId: string = user?.clinicId || user?.clinic?.id || ""

  useEffect(() => {
    if (!clinicId) return
    fetch(`${API}/api/landing/${clinicId}`)
      .then(r => r.json())
      .then(data => {
        setForm({
          about: data.about || "",
          established: data.established ? String(data.established) : "",
          patientsServed: data.patientsServed || "",
          experience: data.experience ? String(data.experience) : "",
        })
      })
      .catch(() => { })
  }, [clinicId])

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!clinicId) {
      alert("Error: No Clinic ID found. Only Clinic Owners can save these settings.");
      return;
    }
    setSaving(true)
    try {
      const token = localStorage.getItem("token")
      const r = await fetch(`${API}/api/landing/${clinicId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          about: form.about,
          established: form.established ? Number(form.established) : undefined,
          patientsServed: form.patientsServed,
          experience: form.experience ? Number(form.experience) : undefined,
        }),
      })
      if (!r.ok) {
        const errData = await r.json().catch(() => ({}))
        throw new Error(errData.message || `Server error (${r.status})`)
      }
      toast.success("Clinic overview saved! It will now appear on your public landing page.")
    } catch (err: any) {
      toast.error(`Save failed: ${err.message || "Unknown error. Please try again."}`)
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
                    <h5 className="fw-bold">Landing Page: Clinic Overview</h5>
                  </div>
                  <div className="card-body px-0 mx-3">

                    <form onSubmit={handleSave}>
                      <div className="row border-bottom mb-3 pb-2">
                        <div className="col-12 mb-3">
                          <h6 className="fw-semibold text-muted">About the Clinic</h6>
                          <p className="text-muted small mb-0">
                            <i className="ti ti-info-circle me-1 text-primary" />
                            This text is shown in the <strong>About Us</strong> section of your public clinic landing page as the description paragraph.
                          </p>
                        </div>

                        <div className="col-12">
                          <div className="row align-items-start mb-3">
                            <div className="col-lg-2">
                              <label className="form-label mb-0 mt-2">Clinic Overview</label>
                              <small className="d-block text-muted">100–150 words</small>
                            </div>
                            <div className="col-lg-12">
                              <textarea
                                className="form-control"
                                rows={5}
                                placeholder="Write about your clinic – specialties, mission, patient care philosophy, etc."
                                value={form.about}
                                onChange={e => setForm(p => ({ ...p, about: e.target.value }))}
                              />
                              <small className="text-muted">{form.about.trim().split(/\s+/).filter(Boolean).length} words</small>
                            </div>
                          </div>
                        </div>

                        {([
                          { label: "Established Year", key: "established" as keyof OverviewForm, type: "number", ph: "e.g. 2005", min: 1900, max: 2100 },
                          { label: "Patients Served", key: "patientsServed" as keyof OverviewForm, type: "text", ph: "e.g. 5000+" },
                          { label: "Experience (Years)", key: "experience" as keyof OverviewForm, type: "number", ph: "e.g. 18", min: 0 },
                        ] as Array<{ label: string; key: keyof OverviewForm; type: string; ph: string; min?: number; max?: number }>).map((f, i) => (
                          <div key={i} className="col-lg-4">
                            <div className="row align-items-center mb-3">
                              <div className="col-12">
                                <label className="form-label mb-1">{f.label}</label>
                                <input
                                  type={f.type}
                                  className="form-control"
                                  placeholder={f.ph}
                                  value={form[f.key]}
                                  min={f.min}
                                  max={f.max}
                                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="d-flex align-items-center justify-content-end">
                        <Link to="#" className="btn btn-light me-3">Cancel</Link>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                          {saving ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Saving...</> : "Save Changes"}
                        </button>
                      </div>
                    </form>
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

export default LocalizationSettings
