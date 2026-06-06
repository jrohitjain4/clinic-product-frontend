import { useState, useEffect, useRef } from "react"
import { Link } from "react-router"
import SettingsSidebar from "../../../../../../core/common/settings-sidebar/settingsSidebar"
import { toast } from "react-toastify"

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

// Popular Tabler icons for medical/clinic use
const ICON_OPTIONS = [
  { icon: "ti ti-stethoscope", label: "Stethoscope" },
  { icon: "ti ti-tooth", label: "Tooth" },
  { icon: "ti ti-baby-carriage", label: "Child Care" },
  { icon: "ti ti-gender-female", label: "Gynecology" },
  { icon: "ti ti-flask", label: "Lab Flask" },
  { icon: "ti ti-vaccine", label: "Vaccine" },
  { icon: "ti ti-walk", label: "Walk / Physio" },
  { icon: "ti ti-brain", label: "Brain / Neuro" },
  { icon: "ti ti-eye", label: "Eye" },
  { icon: "ti ti-heart-rate-monitor", label: "Cardiology" },
  { icon: "ti ti-pill", label: "Pill" },
  { icon: "ti ti-microscope", label: "Microscope" },
  { icon: "ti ti-wheelchair", label: "Wheelchair" },
  { icon: "ti ti-bone", label: "Bone / Ortho" },
  { icon: "ti ti-lungs", label: "Lungs" },
  { icon: "ti ti-medical-cross", label: "Medical Cross" },
  { icon: "ti ti-user-scan", label: "Scan / Radiology" },
  { icon: "ti ti-heartbeat", label: "Heartbeat" },
  { icon: "ti ti-ambulance", label: "Ambulance" },
  { icon: "ti ti-bandage", label: "Bandage" },
  { icon: "ti ti-first-aid-kit", label: "First Aid" },
  { icon: "ti ti-dna", label: "DNA / Genetics" },
  { icon: "ti ti-virus", label: "Virus" },
  { icon: "ti ti-sleep", label: "Sleep / ENT" },
  { icon: "ti ti-ear", label: "Ear" },
  { icon: "ti ti-hand-sanitizer", label: "Sanitizer" },
  { icon: "ti ti-activity", label: "Activity" },
  { icon: "ti ti-clipboard-heart", label: "Health Record" },
  { icon: "ti ti-shield-heart", label: "Health Shield" },
  { icon: "ti ti-thermometer", label: "Thermometer" },
]

// Icon Picker Component
const IconPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = ICON_OPTIONS.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    o.icon.toLowerCase().includes(search.toLowerCase())
  )

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger */}
      <div
        className="form-control d-flex align-items-center gap-2"
        style={{ cursor: "pointer", userSelect: "none" }}
        onClick={() => setOpen(o => !o)}
      >
        <i className={`${value} fs-5 text-primary`} />
        <span className="text-muted small flex-grow-1">{value || "Select icon..."}</span>
        <i className={`ti ti-chevron-${open ? "up" : "down"} text-muted`} />
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="bg-white border rounded-3 shadow-lg p-3"
          style={{
            position: "absolute", zIndex: 1050, top: "100%", left: 0, right: 0,
            marginTop: 4, maxHeight: 320, overflowY: "auto"
          }}
        >
          {/* Search */}
          <input
            type="text"
            className="form-control form-control-sm mb-3"
            placeholder="Search icons..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
            onClick={e => e.stopPropagation()}
          />

          {/* Manual class entry */}
          <div className="mb-3 pb-2 border-bottom">
            <label className="form-label mb-1 small text-muted">Or type custom class</label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="e.g. ti ti-microscope"
              value={value}
              onChange={e => onChange(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>

          {/* Icon Grid */}
          <div className="d-flex flex-wrap gap-2">
            {filtered.map((opt, i) => (
              <button
                key={i}
                type="button"
                title={opt.label}
                className={`btn btn-sm d-flex flex-column align-items-center gap-1 p-2 ${value === opt.icon ? "btn-primary" : "btn-outline-secondary"}`}
                style={{ width: 64, fontSize: 11 }}
                onClick={() => { onChange(opt.icon); setOpen(false); setSearch("") }}
              >
                <i className={`${opt.icon} fs-4`} />
                <span style={{ fontSize: 10, lineHeight: 1.1, textAlign: "center" }}>{opt.label}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-muted small mb-0">No icons found. Type a custom class above.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const SeoSetupSettings = () => {
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES)
  const [newLabel, setNewLabel] = useState("")
  const [newIcon, setNewIcon] = useState("ti ti-stethoscope")
  const [saving, setSaving] = useState(false)

  const user = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}") } catch { return {} } })()
  const clinicId: string = user?.clinicId || user?.clinic?.id || ""

  useEffect(() => {
    if (!clinicId) return
    fetch(`${API}/api/landing/${clinicId}`)
      .then(r => r.json())
      .then(data => {
        if (data.services && Array.isArray(data.services) && data.services.length > 0) {
          const saved: { icon: string; label: string }[] = data.services
          const merged = DEFAULT_SERVICES.map(d => ({
            ...d,
            enabled: saved.some(s => s.label === d.label),
          }))
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
    if (!newLabel.trim()) { toast.error("Please enter a service name"); return }
    setServices(prev => [...prev, { icon: newIcon || "ti ti-stethoscope", label: newLabel.trim(), enabled: true }])
    setNewLabel(""); setNewIcon("ti ti-stethoscope")
    toast.success(`"${newLabel.trim()}" added!`)
  }

  const handleSave = async () => {
    if (!clinicId) {
      toast.error("No Clinic ID found. Only Clinic Owners can save these settings.")
      return
    }
    setSaving(true)
    try {
      const token = localStorage.getItem("token")
      const enabled = services.filter(s => s.enabled).map(({ icon, label }) => ({ icon, label }))
      const r = await fetch(`${API}/api/landing/${clinicId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ services: enabled }),
      })
      if (!r.ok) {
        const errData = await r.json().catch(() => ({}))
        throw new Error(errData.message || `Server error (${r.status})`)
      }
      toast.success("✅ Services saved successfully!")
    } catch (err: any) {
      toast.error(`❌ Save failed: ${err.message || "Unknown error"}`)
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
                            value={newLabel} onChange={e => setNewLabel(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && addCustom()}
                          />
                        </div>
                        <div className="col-lg-5">
                          <label className="form-label mb-1 d-flex align-items-center gap-2">
                            Choose Icon
                            {newIcon && <i className={`${newIcon} text-primary`} title="Preview" />}
                          </label>
                          <IconPicker value={newIcon} onChange={setNewIcon} />
                        </div>
                        <div className="col-lg-2">
                          <button type="button" className="btn btn-outline-primary w-100" onClick={addCustom}>
                            Add <i className="ti ti-plus ms-1" />
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
