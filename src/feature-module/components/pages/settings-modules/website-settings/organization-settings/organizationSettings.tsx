import { useState, useEffect } from "react"
import { Link } from "react-router"
import SettingsSidebar from "../../../../../../core/common/settings-sidebar/settingsSidebar"
import ImageWithBasePath from "../../../../../../core/imageWithBasePath"

const API = import.meta.env.VITE_API_URL || "http://localhost:5000"

interface HeroForm {
  name: string; tagline: string; phone: string; whatsapp: string; email: string;
  facebook: string; instagram: string; mapUrl: string;
  address1: string; address2: string; city: string; state: string; pincode: string;
}

const EMPTY: HeroForm = {
  name: "", tagline: "", phone: "", whatsapp: "", email: "",
  facebook: "", instagram: "", mapUrl: "",
  address1: "", address2: "", city: "", state: "", pincode: "",
}

const OrganizationSettings = () => {
  const [form, setForm] = useState<HeroForm>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")

  // Get clinic id from logged-in user
  const user = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}") } catch { return {} } })()
  const clinicId: string = user?.clinicId || user?.clinic?.id || ""

  useEffect(() => {
    if (!clinicId) return
    fetch(`${API}/api/landing/${clinicId}`)
      .then(r => r.json())
      .then(data => {
        setForm({
          name: data.name || "",
          tagline: data.tagline || "",
          phone: data.phone || "",
          whatsapp: data.whatsapp || "",
          email: data.email || "",
          facebook: data.facebook || "",
          instagram: data.instagram || "",
          mapUrl: data.mapUrl || "",
          address1: data.address || "",
          address2: "",
          city: data.city || "",
          state: "",
          pincode: "",
        })
      })
      .catch(() => { })
  }, [clinicId])

  const set = (k: keyof HeroForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

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
        body: JSON.stringify({
          tagline: form.tagline,
          whatsapp: form.whatsapp,
          email: form.email,
          facebook: form.facebook,
          instagram: form.instagram,
          mapUrl: form.mapUrl,
        }),
      })
      if (!r.ok) throw new Error("Save failed")
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
                    <h5 className="fw-bold">Landing Page: Hero &amp; Contact</h5>
                  </div>
                  <div className="card-body px-0 mx-3">

                    {status === "success" && (
                      <div className="alert alert-success d-flex align-items-center gap-2 mb-3">
                        <i className="ti ti-circle-check" /> Hero section saved successfully!
                      </div>
                    )}
                    {status === "error" && (
                      <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
                        <i className="ti ti-alert-circle" /> Failed to save. Please try again.
                      </div>
                    )}

                    <form onSubmit={handleSave}>
                      {/* ── Hero Info ── */}
                      <div className="row border-bottom mb-3 pb-2">
                        <div className="col-12 mb-3">
                          <h6 className="fw-semibold text-muted">Hero Section</h6>
                        </div>

                        {([
                          { label: "Clinic Name / Title", key: "name" as keyof HeroForm, type: "text", ph: "e.g. HealthCare Plus Clinic", required: true, disabled: true },
                          { label: "Tagline", key: "tagline" as keyof HeroForm, type: "text", ph: "e.g. Trusted Healthcare for Your Family", required: true },
                          { label: "Phone Number", key: "phone" as keyof HeroForm, type: "text", ph: "+91 98765 43210", required: true, disabled: true },
                          { label: "WhatsApp Number", key: "whatsapp" as keyof HeroForm, type: "text", ph: "+91 98765 43210" },
                          { label: "Email Address", key: "email" as keyof HeroForm, type: "email", ph: "clinic@example.com" },
                          { label: "Social – Facebook", key: "facebook" as keyof HeroForm, type: "url", ph: "https://facebook.com/yourclinic" },
                          { label: "Social – Instagram", key: "instagram" as keyof HeroForm, type: "url", ph: "https://instagram.com/yourclinic" },
                          { label: "Google Map Embed URL", key: "mapUrl" as keyof HeroForm, type: "url", ph: "Paste Google Maps embed link" },
                        ] as Array<{ label: string; key: keyof HeroForm; type: string; ph: string; required?: boolean; disabled?: boolean }>).map((f, i) => (
                          <div key={i} className="col-lg-6">
                            <div className="row align-items-center mb-3">
                              <div className="col-lg-4">
                                <label className="form-label mb-0">
                                  {f.label}{f.required && <span className="text-danger ms-1">*</span>}
                                </label>
                              </div>
                              <div className="col-lg-8">
                                <input
                                  type={f.type}
                                  className="form-control"
                                  placeholder={f.ph}
                                  value={form[f.key]}
                                  onChange={set(f.key)}
                                  disabled={f.disabled}
                                />
                                {f.disabled && <small className="text-muted">Managed from Profile Settings</small>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* ── Address (read-only from clinic) ── */}
                      <div className="row border-bottom mb-3 pb-2">
                        <div className="col-12 mb-3">
                          <h6 className="fw-semibold text-muted">Clinic Address <small className="text-muted fw-normal">(managed from Profile Settings)</small></h6>
                        </div>
                        <div className="col-12">
                          <input type="text" className="form-control" value={form.address1} disabled placeholder="Address" />
                        </div>
                      </div>

                      {/* ── Clinic Logo ── */}
                      <div className="row mb-3 pb-2">
                        <div className="col-12 mb-3">
                          <h6 className="fw-semibold text-muted">Clinic Logo</h6>
                        </div>
                        <div className="col-lg-6">
                          <div className="d-flex align-items-center mb-3">
                            <div className="me-3">
                              <div className="profile-container">
                                <ImageWithBasePath src="assets/img/logo.svg" alt="Logo" className="img-fluid object-fit-contain p-1" />
                              </div>
                            </div>
                            <div>
                              <p className="fw-medium text-dark mb-1">Clinic Logo</p>
                              <span className="text-muted small">Recommended: 250×100 px</span>
                            </div>
                          </div>
                        </div>
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

export default OrganizationSettings
