import { useState, useEffect } from "react"
import { Link } from "react-router"
import SettingsSidebar from "../../../../../../core/common/settings-sidebar/settingsSidebar"

const API = import.meta.env.VITE_API_URL || "http://localhost:5000"

interface Service { icon: string; label: string; enabled: boolean }

const DEFAULT_SERVICES: Service[] = [
  { icon: "ti ti-stethoscope", label: "General Physician", enabled: true },
  { icon: "ti ti-tooth", label: "Dental Care", enabled: true },
  { icon: "ti ti-baby-carriage", label: "Child Care", enabled: true },
  { icon: "ti ti-gender-female", label: "Gynecology", enabled: true },
  { icon: "ti ti-flask", label: "Pathology", enabled: true },
  { icon: "ti ti-vaccine", label: "Vaccination", enabled: true },
  { icon: "ti ti-walk", label: "Physiotherapy", enabled: false },
  { icon: "ti ti-brain", label: "Neurology", enabled: false },
  { icon: "ti ti-eye", label: "Ophthalmology", enabled: false },
  { icon: "ti ti-heart-rate-monitor", label: "Cardiology", enabled: false },
]

const SeoSetupSettings = () => {
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES)
  const [newLabel, setNewLabel] = useState("")
  const [newIcon, setNewIcon] = useState("ti ti-stethoscope")
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")

  const user = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}") } catch { return {} } })()
  const clinicId: string = user?.clinicId || user?.clinic?.id || ""

  useEffect(() => {
    if (!clinicId) return
    fetch(`${API}/api/landing/${clinicId}`)
      .then(r => r.json())
      .then(data => {
        if (data.services && Array.isArray(data.services) && data.services.length > 0) {
          // Merge saved services with defaults
          const saved: { icon: string; label: string }[] = data.services
          const merged = DEFAULT_SERVICES.map(d => ({
            ...d,
            enabled: saved.some(s => s.label === d.label),
          }))
          // Add any custom services not in defaults
          saved.forEach(s => {
            if (!merged.find(m => m.label === s.label)) {
              merged.push({ ...s, enabled: true })
            }
          })
          setServices(merged)
        }
      })
      .catch(() => { })
  }, [clinicId])

  const toggle = (i: number) =>
    setServices(prev => prev.map((s, idx) => idx === i ? { ...s, enabled: !s.enabled } : s))

  const addCustom = () => {
    if (!newLabel.trim()) return
    setServices(prev => [...prev, { icon: newIcon || "ti ti-stethoscope", label: newLabel.trim(), enabled: true }])
    setNewLabel(""); setNewIcon("ti ti-stethoscope")
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!clinicId) {
      alert("Error: No Clinic ID found. Only Clinic Owners can save these settings.");
      return;
    }
    setSaving(true); setStatus("idle")
    try {
      const token = localStorage.getItem("token")
      const enabled = services.filter(s => s.enabled).map(({ icon, label }) => ({ icon, label }))
      const r = await fetch(`${API}/api/landing/${clinicId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ services: enabled }),
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
                    <h5 className="fw-bold">Landing Page: Services We Offer</h5>
                  </div>
                  <div className="card-body px-0 mx-3">

                    {status === "success" && (
                      <div className="alert alert-success d-flex align-items-center gap-2 mb-3">
                        <i className="ti ti-circle-check" /> Services saved successfully!
                      </div>
                    )}
                    {status === "error" && (
                      <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
                        <i className="ti ti-alert-circle" /> Failed to save. Please try again.
                      </div>
                    )}

                    <p className="text-muted mb-4">
                      Toggle the services you want displayed on your public landing page.
                      <span className="ms-2 badge bg-primary-subtle text-primary">{services.filter(s => s.enabled).length} enabled</span>
                    </p>

                    <div className="row g-3 mb-4">
                      {services.map((svc, i) => (
                        <div key={i} className="col-lg-4 col-md-6">
                          <div
                            className={`border rounded p-3 d-flex align-items-center gap-3 ${svc.enabled ? "border-primary bg-primary bg-opacity-10" : "bg-white"}`}
                            style={{ cursor: "pointer" }}
                            onClick={() => toggle(i)}
                          >
                            <i className={`${svc.icon} fs-4 ${svc.enabled ? "text-primary" : "text-muted"}`} />
                            <p className={`mb-0 fw-medium flex-grow-1 ${svc.enabled ? "text-primary" : "text-dark"}`}>{svc.label}</p>
                            <div className="form-check form-switch mb-0 ms-auto">
                              <input className="form-check-input" type="checkbox" checked={svc.enabled}
                                onChange={() => toggle(i)} onClick={e => e.stopPropagation()} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Custom */}
                    <div className="border-top pt-4 mb-4">
                      <h6 className="fw-semibold text-muted mb-3">Add Custom Service</h6>
                      <div className="row g-2 align-items-end">
                        <div className="col-lg-5">
                          <label className="form-label mb-1">Service Name</label>
                          <input type="text" className="form-control" placeholder="e.g. Dermatology"
                            value={newLabel} onChange={e => setNewLabel(e.target.value)} />
                        </div>
                        <div className="col-lg-4">
                          <label className="form-label mb-1">Icon Class (Tabler)</label>
                          <input type="text" className="form-control" placeholder="e.g. ti ti-microscope"
                            value={newIcon} onChange={e => setNewIcon(e.target.value)} />
                        </div>
                        <div className="col-lg-3">
                          <button type="button" className="btn btn-outline-primary w-100" onClick={addCustom}>
                            <i className="ti ti-plus me-1" /> Add
                          </button>
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

export default SeoSetupSettings
