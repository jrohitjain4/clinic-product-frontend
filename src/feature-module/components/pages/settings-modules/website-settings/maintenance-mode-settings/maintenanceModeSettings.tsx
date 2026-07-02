import { useState, useEffect, useRef } from "react"
import { Link } from "react-router"
import { toast } from "react-toastify"
import SettingsSidebar from "../../../../../../core/common/settings-sidebar/settingsSidebar"
import { resolveMediaUrl } from "../../../../../../core/config/api"

const API = import.meta.env.VITE_API_URL || "http://localhost:5000"
const GALLERY_CATEGORIES = ["Reception", "Waiting Area", "Consultation Room", "Equipment", "Other"]

interface GalleryItem { url: string; category: string; caption?: string }

const MaintenanceModeSettings = () => {
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [mapUrl, setMapUrl] = useState("")
  const [directionsUrl, setDirectionsUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const user = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}") } catch { return {} } })()
  const clinicId: string = user?.clinicId || user?.clinic?.id || ""

  useEffect(() => {
    if (!clinicId) return
    fetch(`${API}/api/landing/${clinicId}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.gallery)) setGallery(data.gallery)
        setMapUrl(data.mapUrl || "")
        setDirectionsUrl(data.directionsUrl || "")
      })
      .catch(() => { })
  }, [clinicId])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return;

    setSaving(true);
    let uploadedCount = 0;

    for (const file of files) {
      try {
        const token = localStorage.getItem("token")
        const formData = new FormData();
        formData.append("image", file);

        const res = await fetch(`${API}/api/uploads/landing-image`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Upload failed");
        }

        const data = await res.json();
        setGallery(prev => [...prev, { url: data.url, category: "Reception", caption: "" }]);
        uploadedCount++;
      } catch (err: any) {
        toast.error(`Failed to upload ${file.name}: ${err.message || "Server error"}`);
      }
    }

    setSaving(false);
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (uploadedCount > 0) {
      toast.success(`${uploadedCount} photo(s) uploaded successfully to gallery preview!`);
    }
  }

  const updateItem = (i: number, key: keyof GalleryItem, value: string) =>
    setGallery(prev => prev.map((item, idx) => idx === i ? { ...item, [key]: value } : item))

  const removeItem = (i: number) => setGallery(prev => prev.filter((_, idx) => idx !== i))

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
        body: JSON.stringify({ gallery, mapUrl, directionsUrl }),
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
                    <h5 className="fw-bold">Landing Page: Gallery &amp; Location</h5>
                  </div>
                  <div className="card-body px-0 mx-3">

                    {status === "success" && (
                      <div className="alert alert-success d-flex align-items-center gap-2 mb-3">
                        <i className="ti ti-circle-check" /> Gallery &amp; location saved successfully!
                      </div>
                    )}
                    {status === "error" && (
                      <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
                        <i className="ti ti-alert-circle" /> Failed to save. Please try again.
                      </div>
                    )}

                    {/* ── Gallery ── */}
                    <div className="mb-4 border-bottom pb-4">
                      <h6 className="fw-semibold text-muted mb-3">Clinic Gallery</h6>
                      <div className="mb-3">
                        <button type="button" className="btn btn-outline-primary" onClick={() => fileInputRef.current?.click()}>
                          <i className="ti ti-upload me-2" /> Upload Photos
                        </button>
                        <input type="file" ref={fileInputRef} multiple accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
                        <span className="text-muted small ms-3 fw-medium text-success">JPG, PNG, WEBP – Unlimited size &amp; unlimited uploads</span>
                      </div>

                      {gallery.length > 0 ? (
                        <div className="row g-3">
                          {gallery.map((item, i) => (
                            <div key={i} className="col-lg-4 col-md-6">
                              <div className="card border shadow-none">
                                <div className="position-relative" style={{ height: 160, overflow: "hidden", borderRadius: "0.375rem 0.375rem 0 0" }}>
                                  <img src={resolveMediaUrl(item.url)} alt={item.caption || "gallery"} className="w-100 h-100 object-fit-cover" />
                                  <button type="button" className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
                                    onClick={() => removeItem(i)}><i className="ti ti-x" /></button>
                                </div>
                                <div className="card-body p-2">
                                  <select className="form-select form-select-sm mb-2" value={item.category}
                                    onChange={e => updateItem(i, "category", e.target.value)}>
                                    {GALLERY_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                  </select>
                                  <input type="text" className="form-control form-control-sm" placeholder="Caption (optional)"
                                    value={item.caption || ""}
                                    onChange={e => updateItem(i, "caption", e.target.value)} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border border-dashed rounded d-flex flex-column align-items-center justify-content-center text-muted"
                          style={{ height: 160, cursor: "pointer" }} onClick={() => fileInputRef.current?.click()}>
                          <i className="ti ti-photo fs-1 mb-2 opacity-50" />
                          <p className="mb-0 small">Click to upload clinic photos</p>
                        </div>
                      )}
                    </div>

                    {/* ── Location ── */}
                    <div className="mb-4 border-bottom pb-4">
                      <h6 className="fw-semibold text-muted mb-3">Location &amp; Map</h6>
                      <div className="row g-3">
                        <div className="col-12">
                          <label className="form-label mb-1">Google Maps Embed URL</label>
                          <input type="url" className="form-control"
                            placeholder="Paste the embed src URL from Google Maps → Share → Embed a map"
                            value={mapUrl} onChange={e => setMapUrl(e.target.value)} />
                          <small className="text-muted">Go to <strong>Google Maps → Share → Embed a map</strong>, copy the <code>src</code> URL.</small>
                        </div>
                        {mapUrl && (
                          <div className="col-12">
                            <label className="form-label mb-1">Map Preview</label>
                            <iframe src={mapUrl} width="100%" height="280"
                              style={{ border: 0, borderRadius: 8 }} allowFullScreen loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade" title="Clinic Map" />
                          </div>
                        )}
                        <div className="col-12">
                          <label className="form-label mb-1">Get Directions URL</label>
                          <input type="url" className="form-control"
                            placeholder="e.g. https://maps.google.com/?q=YourClinicAddress"
                            value={directionsUrl} onChange={e => setDirectionsUrl(e.target.value)} />
                          <small className="text-muted">Opens in Google Maps when patient clicks "Get Directions".</small>
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

export default MaintenanceModeSettings
