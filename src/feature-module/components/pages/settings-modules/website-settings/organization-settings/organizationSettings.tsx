import { useState, useEffect, useRef } from "react"
import { Link } from "react-router"
import SettingsSidebar from "../../../../../../core/common/settings-sidebar/settingsSidebar"
import { apiUrl, resolveMediaUrl } from "../../../../../../core/config/api"
import { toast } from "react-toastify"
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000"

interface HeroForm {
  name: string; tagline: string; phone: string; whatsapp: string; email: string;
  facebook: string; instagram: string; mapUrl: string;
  address1: string; address2: string; city: string; state: string; pincode: string;
  headerImage: string;
  aboutImage: string;
  logo: string;
}

const EMPTY: HeroForm = {
  name: "", tagline: "", phone: "", whatsapp: "", email: "",
  facebook: "", instagram: "", mapUrl: "",
  address1: "", address2: "", city: "", state: "", pincode: "",
  headerImage: "",
  aboutImage: "",
  logo: "",
}



// Reusable image uploader component with built-in crop
const LandingImageUpload = ({
  label,
  value,
  onChange,
  hint,
  aspect,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  aspect?: number;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [srcImg, setSrcImg] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const centered = centerCrop(
      makeAspectCrop({ unit: "%", width: 90 }, aspect || 16 / 9, width, height),
      width,
      height
    );
    setCrop(centered);
    setCompletedCrop(centered);
  };

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setSrcImg(reader.result as string);
    reader.readAsDataURL(file);
  };

  const getCroppedBlob = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const image = imgRef.current;
      if (!image || !completedCrop?.width || !completedCrop?.height) {
        resolve(null);
        return;
      }
      const canvas = document.createElement("canvas");
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Use pixel values
      let pxX = completedCrop.x;
      let pxY = completedCrop.y;
      let pxW = completedCrop.width;
      let pxH = completedCrop.height;

      if (completedCrop.unit === "%") {
        pxX = (completedCrop.x / 100) * image.width;
        pxY = (completedCrop.y / 100) * image.height;
        pxW = (completedCrop.width / 100) * image.width;
        pxH = (completedCrop.height / 100) * image.height;
      }

      canvas.width = pxW * scaleX;
      canvas.height = pxH * scaleY;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(
        image,
        pxX * scaleX, pxY * scaleY,
        pxW * scaleX, pxH * scaleY,
        0, 0,
        canvas.width, canvas.height
      );
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
    });
  };

  const handleCropConfirm = async () => {
    const blob = await getCroppedBlob();
    if (!blob) return;
    setError(null);
    setUploading(true);
    setSrcImg(null);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("image", blob, "cropped.jpg");
      const res = await fetch(apiUrl("/api/uploads/landing-image"), {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Upload failed");
      }
      const data = await res.json();
      onChange(data.url);
      toast.success(`${label} uploaded successfully!`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      setError(msg);
      toast.error(`Error: ${msg}`);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const displayUrl = value ? resolveMediaUrl(value) : null;

  return (
    <div className="mb-4">
      <h6 className="fw-semibold text-muted mb-3">{label}</h6>
      <div className="d-flex align-items-start gap-4 flex-wrap">
        {/* Preview */}
        <div
          className="rounded-3 overflow-hidden border bg-light d-flex align-items-center justify-content-center"
          style={{ width: 220, height: 130, flexShrink: 0, position: "relative" }}
        >
          {displayUrl ? (
            <img src={displayUrl} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div className="text-center text-muted">
              <i className="ti ti-photo fs-2 d-block mb-1" />
              <small>No image</small>
            </div>
          )}
          {uploading && (
            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50" style={{ zIndex: 2 }}>
              <span className="spinner-border spinner-border-sm text-white" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div>
          <div className="mb-2">
            <label className="btn btn-primary btn-sm" style={{ cursor: "pointer" }}>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
                style={{ display: "none" }}
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              <i className="ti ti-upload me-1" />
              {uploading ? "Uploading..." : "Browse Image"}
            </label>
            {value && (
              <button type="button" className="btn btn-outline-danger btn-sm ms-2" onClick={() => onChange("")} disabled={uploading}>
                <i className="ti ti-trash me-1" />Remove
              </button>
            )}
          </div>
          {hint && <p className="fs-12 text-muted mb-0">{hint}</p>}
          {error && <p className="text-danger fs-12 mt-1 mb-0">{error}</p>}
        </div>
      </div>

      {/* Crop Modal */}
      {srcImg && (
        <>
          <div className="modal show d-block" style={{ zIndex: 1060 }} role="dialog">
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 700 }}>
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 12 }}>
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">
                    <i className="ti ti-crop me-2" />Crop Image — {label}
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => { setSrcImg(null); if (inputRef.current) inputRef.current.value = ""; }} />
                </div>
                <div className="modal-body text-center" style={{ background: "#1a1a2e", padding: "1.5rem", maxHeight: "65vh", overflow: "auto" }}>
                  <p className="text-white-50 fs-12 mb-3">
                    <i className="ti ti-info-circle me-1" />Drag and resize the selection rectangle to crop your image.
                  </p>
                  <ReactCrop
                    crop={crop}
                    onChange={(_, pct) => setCrop(pct)}
                    onComplete={(_, pct) => setCompletedCrop(pct)}
                    aspect={aspect}
                    style={{ maxWidth: "100%", maxHeight: "50vh" }}
                  >
                    <img
                      ref={imgRef}
                      src={srcImg}
                      alt="crop-source"
                      onLoad={onImageLoad}
                      style={{ maxWidth: "100%", maxHeight: "50vh", objectFit: "contain" }}
                    />
                  </ReactCrop>
                </div>
                <div className="modal-footer" style={{ gap: 8 }}>
                  <button type="button" className="btn btn-light px-4" onClick={() => { setSrcImg(null); if (inputRef.current) inputRef.current.value = ""; }}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-primary px-4 d-flex align-items-center gap-2" onClick={handleCropConfirm}>
                    <i className="ti ti-check" /> Apply Crop & Upload
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1050 }} />
        </>
      )}
    </div>
  );
};


const OrganizationSettings = () => {
  const [form, setForm] = useState<HeroForm>(EMPTY)
  const [saving, setSaving] = useState(false)

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
          headerImage: data.headerImage || "",
          aboutImage: data.aboutImage || "",
          logo: data.logo || "",
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
    setSaving(true)
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
          headerImage: form.headerImage,
          aboutImage: form.aboutImage,
          logo: form.logo,
        }),
      })
      if (!r.ok) {
        const errData = await r.json().catch(() => ({}))
        throw new Error(errData.message || `Server error (${r.status})`)
      }
      toast.success("✅ Landing page settings saved successfully!")
    } catch (err: any) {
      toast.error(`❌ Save failed: ${err.message || "Unknown error. Please try again."}`)
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
                          { label: "Social – Facebook", key: "facebook" as keyof HeroForm, type: "text", ph: "https://facebook.com/yourclinic" },
                          { label: "Social – Instagram", key: "instagram" as keyof HeroForm, type: "text", ph: "https://instagram.com/yourclinic" },
                          { label: "Google Map Embed URL", key: "mapUrl" as keyof HeroForm, type: "text", ph: "Paste Google Maps embed link" },
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

                      {/* ── Hero Image ── */}
                      <div className="row border-bottom mb-3 pb-4">
                        <div className="col-12">
                          <LandingImageUpload
                            label="Hero Section Image"
                            value={form.headerImage}
                            onChange={(url) => setForm(p => ({ ...p, headerImage: url }))}
                            hint="Shown in the hero banner on your public clinic page. Recommended: 1200×600px"
                            aspect={2 / 1}
                          />
                        </div>
                      </div>

                      {/* ── About Image ── */}
                      <div className="row border-bottom mb-3 pb-4">
                        <div className="col-12">
                          <LandingImageUpload
                            label="About Section Image"
                            value={form.aboutImage}
                            onChange={(url) => setForm(p => ({ ...p, aboutImage: url }))}
                            hint="Shown in the About Us section on your public clinic page. Recommended: 800×600px"
                            aspect={4 / 3}
                          />
                        </div>
                      </div>

                      {/* ── Clinic Logo ── */}
                      <div className="row mb-3 pb-4">
                        <div className="col-12">
                          <LandingImageUpload
                            label="Clinic Logo"
                            value={form.logo}
                            onChange={(url) => setForm(p => ({ ...p, logo: url }))}
                            hint="Recommended image size is 250px x 100px. Used in prescription headers and landing page."
                            aspect={5 / 2}
                          />
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
