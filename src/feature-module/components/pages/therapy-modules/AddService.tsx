import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { apiGet, apiPost } from "../../../../core/utils/apiClient";
import { resolveMediaUrl, apiUrl } from "../../../../core/config/api";
import ImageCropperModal from "../../../../core/common/crop/ImageCropperModal";
import { IconFormControl, IconTextarea } from "../../../../core/common/form-fields";

interface CategoryOption {
  id: string;
  name: string;
}

const AddService = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [code, setCode] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Active");

  // Gallery
  const [gallery, setGallery] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("therapy-gallery.jpg");

  // Session Settings
  const [minSessions, setMinSessions] = useState("1");
  const [maxSessions, setMaxSessions] = useState("10");
  const [sessionGap, setSessionGap] = useState("0"); // Daily = 0 default
  const [scheduleType, setScheduleType] = useState("daily"); // daily, alternate, weekly, custom

  // Categories list
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // Auto Generate Therapy Code on load
  useEffect(() => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setCode(`TH-${randomNum}`);
  }, []);

  // Fetch Categories on Mount
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const data = await apiGet<any[]>("/api/specializations?type=therapy");
        setCategories(Array.isArray(data) ? data : []);
      } catch (err: any) {
        toast.error("Failed to load therapy categories");
      } finally {
        setLoadingCats(false);
      }
    };
    fetchCats();
  }, []);

  // Dynamic Relative Days Generation for Preview
  const getRelativeScheduledDays = () => {
    const days: number[] = [];
    const count = minSessions ? parseInt(minSessions) : 1;

    let increment = 1;
    if (scheduleType === "daily") {
      increment = 1;
    } else if (scheduleType === "alternate") {
      increment = 2;
    } else if (scheduleType === "weekly") {
      increment = 7;
    } else if (scheduleType === "custom") {
      increment = sessionGap ? parseInt(sessionGap) : 1;
    }

    for (let i = 0; i < count; i++) {
      days.push(1 + i * increment);
    }
    return days;
  };

  const relativeDays = getRelativeScheduledDays();

  // Gallery Upload Handlers (Handles single file cropping & multi-file direct uploads)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length === 1) {
      // Single file -> open cropper
      const file = files[0];
      setSelectedFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setSelectedImageSrc(reader.result as string);
          setIsCropOpen(true);
        }
      };
      reader.readAsDataURL(file);
    } else {
      // Multiple files -> upload directly in parallel
      setUploading(true);
      try {
        const token = localStorage.getItem("token");
        const uploadPromises = Array.from(files).map(async (file) => {
          const formData = new FormData();
          formData.append("image", file);

          const res = await fetch(apiUrl("/api/uploads/therapy-image"), {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
          });

          if (!res.ok) throw new Error("Upload failed");
          const data = await res.json();
          return data.url;
        });

        const urls = await Promise.all(uploadPromises);
        setGallery((prev) => [...prev, ...urls]);
        toast.success("All images uploaded successfully!");
      } catch (err: any) {
        toast.error("Some images failed to upload");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

  const handleUploadCroppedFile = async (file: File) => {
    setUploading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(apiUrl("/api/uploads/therapy-image"), {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Upload failed");
      }

      const data = await res.json();
      setGallery([...gallery, data.url]);
      toast.success("Image uploaded to gallery!");
    } catch (e: any) {
      toast.error(e.message || "Failed to upload image");
    } finally {
      setUploading(false);
      setIsCropOpen(false);
      setSelectedImageSrc(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeGalleryImage = (idxToRemove: number) => {
    setGallery(gallery.filter((_, idx) => idx !== idxToRemove));
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !duration || !price || !minSessions || !maxSessions) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await apiPost("/api/services", {
        serviceName: name,
        serviceCode: code,
        serviceType: "therapy",
        specializationId: category,
        price: parseFloat(price),
        duration: `${duration} mins`,
        description,
        gallery,
        minSessions: parseInt(minSessions),
        maxSessions: parseInt(maxSessions),
        sessionGap: sessionGap ? parseInt(sessionGap) : 0,
        scheduleType,
        customDates: relativeDays.map((d) => `Day ${d}`),
        status,
      });

      toast.success("Therapy service created successfully!");
      navigate("/therapy-services"); // Navigate to therapy list
    } catch (err: any) {
      toast.error(err.message || "Failed to create therapy service");
    }
  };

  const scheduleOptions = [
    { value: "daily", label: "Daily", icon: "ti ti-calendar-event" },
    { value: "alternate", label: "Alternate Day", icon: "ti ti-calendar-stats" },
    { value: "weekly", label: "Weekly", icon: "ti ti-calendar-week" },
    { value: "custom", label: "Custom", icon: "ti ti-adjustments" },
  ];

  return (
    <div className="page-wrapper">
      <div className="content add-therapy-page">
        <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4 pb-3 border-bottom">
          <div className="d-flex align-items-center gap-3 min-w-0">
            <div className="at-page-icon d-flex align-items-center justify-content-center flex-shrink-0">
              <i className="ti ti-massage" />
            </div>
            <div className="min-w-0">
              <h4 className="fw-bold mb-0 text-dark">Add New Therapy</h4>
              <p className="text-muted fs-13 mb-0">
                Create and configure schedule settings for therapy services
              </p>
            </div>
          </div>
          <Link
            to="/therapy-services"
            className="btn btn-outline-primary d-inline-flex align-items-center justify-content-center gap-1 flex-shrink-0"
            style={{ minHeight: 38, borderRadius: 8 }}
          >
            <i className="ti ti-arrow-left" /> Back to List
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-lg-8">
              <div className="at-card bg-white border mb-3 overflow-hidden">
                <div className="at-card-head d-flex align-items-center gap-3 px-3 px-md-4 py-3">
                  <div className="at-section-icon" style={{ background: "#e8f1ff", color: "#0d6efd" }}>
                    <i className="ti ti-clipboard-list" />
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold text-dark fs-16">Therapy Specifications</h5>
                    <span className="fs-12 text-muted">Basic details for this therapy service</span>
                  </div>
                </div>
                <div className="px-3 px-md-4 py-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Therapy Name <span className="text-danger">*</span>
                      </label>
                      <IconFormControl
                        fieldLabel="service"
                        type="text"
                        placeholder="e.g. Cognitive Behavioral Therapy (CBT)"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Category <span className="text-danger">*</span>
                      </label>
                      {loadingCats ? (
                        <select className="form-select" disabled>
                          <option>Loading categories...</option>
                        </select>
                      ) : (
                        <select
                          className="form-select"
                          required
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          <option value="">Select Category</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Therapy Code (Auto)</label>
                      <IconFormControl
                        type="text"
                        fieldLabel="service"
                        className="bg-light"
                        readOnly
                        value={code}
                        placeholder="Therapy Code (Auto)"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">
                        Duration (Minutes) <span className="text-danger">*</span>
                      </label>
                      <IconFormControl
                        type="number"
                        fieldLabel="time"
                        placeholder="Duration (Minutes)"
                        required
                        min="1"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">
                        Base Price/Session (₹) <span className="text-danger">*</span>
                      </label>
                      <IconFormControl
                        fieldLabel="price"
                        type="number"
                        placeholder="e.g. 1500"
                        required
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">Description (Optional)</label>
                      <IconTextarea
                        fieldLabel="description"
                        rows={3}
                        placeholder="Provide details about the therapy, conditions treated, etc."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="at-card bg-white border mb-3 overflow-hidden">
                <div className="at-card-head d-flex align-items-center gap-3 px-3 px-md-4 py-3">
                  <div className="at-section-icon" style={{ background: "#e8f8ef", color: "#198754" }}>
                    <i className="ti ti-calendar-time" />
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold text-dark fs-16">Session Settings & Frequency</h5>
                    <span className="fs-12 text-muted">Define how sessions are scheduled</span>
                  </div>
                </div>
                <div className="px-3 px-md-4 py-4">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">
                        Minimum Sessions <span className="text-danger">*</span>
                      </label>
                      <IconFormControl
                        type="number"
                        fieldLabel="quantity"
                        placeholder="Minimum Sessions"
                        min="1"
                        required
                        value={minSessions}
                        onChange={(e) => setMinSessions(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">
                        Maximum Sessions <span className="text-danger">*</span>
                      </label>
                      <IconFormControl
                        type="number"
                        fieldLabel="quantity"
                        placeholder="Maximum Sessions"
                        min="1"
                        required
                        value={maxSessions}
                        onChange={(e) => setMaxSessions(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Session Gap (Days)</label>
                      <IconFormControl
                        type="number"
                        fieldLabel="time"
                        placeholder="Session Gap (Days)"
                        min="0"
                        disabled={scheduleType !== "custom"}
                        value={sessionGap}
                        onChange={(e) => setSessionGap(e.target.value)}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">Schedule Configuration</label>
                      <div className="d-flex flex-wrap gap-2 mb-1">
                        {scheduleOptions.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            className={`at-schedule-chip ${scheduleType === opt.value ? "active" : ""}`}
                            onClick={() => {
                              setScheduleType(opt.value);
                              if (opt.value === "daily") {
                                setSessionGap("0");
                              } else if (opt.value === "alternate") {
                                setSessionGap("1");
                              } else if (opt.value === "weekly") {
                                setSessionGap("7");
                              } else {
                                setSessionGap("");
                              }
                            }}
                          >
                            <i className={opt.icon} />
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold text-success d-flex align-items-center gap-2 mb-2">
                        <i className="ti ti-checks fs-18" /> Generated Schedule Preview
                      </label>
                      <div className="at-preview-panel d-flex flex-wrap gap-2 p-3 border">
                        {relativeDays.map((dayNum, idx) => (
                          <span key={idx} className="at-preview-pill">
                            Session {idx + 1}: Day {dayNum}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="at-card bg-white border mb-3 overflow-hidden">
                <div className="at-card-head d-flex align-items-center gap-3 px-3 px-md-4 py-3">
                  <div className="at-section-icon" style={{ background: "#fff4e8", color: "#e67700" }}>
                    <i className="ti ti-photo" />
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold text-dark fs-16">Gallery & Prescriptions</h5>
                    <span className="fs-12 text-muted">Visual guides for therapists</span>
                  </div>
                </div>
                <div className="px-3 px-md-4 py-4">
                  <label className="form-label fw-semibold mb-2">Upload Therapy Images</label>

                  <div
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className="at-dropzone text-center cursor-pointer mb-3"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (!uploading) fileInputRef.current?.click();
                      }
                    }}
                  >
                    {uploading ? (
                      <div className="py-3">
                        <span className="spinner-border text-primary spinner-border-sm mb-2" />
                        <p className="mb-0 text-muted fs-13">Uploading & processing...</p>
                      </div>
                    ) : (
                      <div className="py-3">
                        <div className="at-dropzone-icon mx-auto mb-2 d-flex align-items-center justify-content-center">
                          <i className="ti ti-camera" />
                        </div>
                        <h6 className="fw-bold mb-1 fs-14">Add Explanation Images</h6>
                        <p className="text-muted fs-11 mb-0 px-2">
                          Crop & add photos of exercises or anatomical views (Hold Ctrl to select multiple)
                        </p>
                      </div>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: "none" }}
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                  />

                  {gallery.length > 0 && (
                    <div className="row g-2">
                      {gallery.map((imgUrl, idx) => (
                        <div key={idx} className="col-6 position-relative">
                          <div className="at-gallery-thumb border overflow-hidden">
                            <img
                              src={resolveMediaUrl(imgUrl)}
                              alt="Gallery Item"
                              className="w-100 h-100"
                              style={{ objectFit: "cover" }}
                            />
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger rounded-circle p-1 position-absolute top-0 end-0 m-1 shadow"
                            style={{
                              width: "24px",
                              height: "24px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            onClick={() => removeGalleryImage(idx)}
                          >
                            <i className="ti ti-trash fs-12" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="at-card bg-white border mb-3 overflow-hidden">
                <div className="at-card-head d-flex align-items-center gap-3 px-3 px-md-4 py-3">
                  <div className="at-section-icon" style={{ background: "#eee8ff", color: "#4f46e5" }}>
                    <i className="ti ti-rocket" />
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold text-dark fs-16">Status & Actions</h5>
                    <span className="fs-12 text-muted">Publish this therapy service</span>
                  </div>
                </div>
                <div className="px-3 px-md-4 py-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Status</label>
                    <select
                      className="form-select"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="d-grid gap-2">
                    <button type="submit" className="at-btn-premium d-flex align-items-center justify-content-center gap-1">
                      <i className="ti ti-plus" /> Save Therapy
                    </button>
                    <Link
                      to="/therapy-services"
                      className="btn btn-outline-danger d-flex align-items-center justify-content-center"
                      style={{ minHeight: 42, borderRadius: 8, borderColor: "#b91c1c", color: "#b91c1c" }}
                    >
                      Cancel
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        <style>{`
          .add-therapy-page .at-page-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background: rgba(79, 70, 229, 0.12);
            color: #4f46e5;
            font-size: 22px;
          }
          .add-therapy-page .at-card {
            border-radius: 12px;
            box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
          }
          .add-therapy-page .at-card-head {
            border-bottom: 1px solid rgba(0,0,0,0.06);
            background: #f8fafc;
          }
          .add-therapy-page .at-section-icon {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            flex-shrink: 0;
          }
          .add-therapy-page .at-schedule-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            border: 1px solid #e2e8f0;
            background: #fff;
            color: #475569;
            border-radius: 999px;
            padding: 8px 14px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .add-therapy-page .at-schedule-chip:hover {
            border-color: #a5b4fc;
            color: #4f46e5;
          }
          .add-therapy-page .at-schedule-chip.active {
            background: rgba(79, 70, 229, 0.1);
            border-color: #6366f1;
            color: #4f46e5;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
          }
          .add-therapy-page .at-preview-panel {
            border-radius: 10px;
            background: rgba(25, 135, 84, 0.05);
            border-color: rgba(25, 135, 84, 0.2) !important;
            min-height: 52px;
          }
          .add-therapy-page .at-preview-pill {
            display: inline-flex;
            align-items: center;
            background: #fff;
            color: #198754;
            border: 1px solid rgba(25, 135, 84, 0.35);
            border-radius: 999px;
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 600;
          }
          .add-therapy-page .at-dropzone {
            border: 2px dashed #a5b4fc;
            border-radius: 12px;
            background: linear-gradient(180deg, #f8f9ff 0%, #fff 100%);
            transition: border-color 0.15s ease, background 0.15s ease;
          }
          .add-therapy-page .at-dropzone:hover {
            border-color: #6366f1;
            background: #f5f6ff;
          }
          .add-therapy-page .at-dropzone-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background: rgba(79, 70, 229, 0.12);
            color: #4f46e5;
            font-size: 22px;
          }
          .add-therapy-page .at-gallery-thumb {
            height: 100px;
            border-radius: 10px;
          }
          .add-therapy-page .at-btn-premium {
            min-height: 46px;
            border: 0;
            border-radius: 10px;
            color: #fff !important;
            font-weight: 600;
            background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%) !important;
            box-shadow: 0 8px 18px rgba(79, 70, 229, 0.25);
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          }
          .add-therapy-page .at-btn-premium:hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 22px rgba(79, 70, 229, 0.32);
          }
        `}</style>
      </div>

      {isCropOpen && selectedImageSrc && (
        <ImageCropperModal
          isOpen={isCropOpen}
          imageSrc={selectedImageSrc}
          onClose={() => {
            setIsCropOpen(false);
            setSelectedImageSrc(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
          onCropComplete={handleUploadCroppedFile}
          title="Crop Therapy Image"
          fileName={selectedFileName}
        />
      )}
    </div>
  );
};

export default AddService;
