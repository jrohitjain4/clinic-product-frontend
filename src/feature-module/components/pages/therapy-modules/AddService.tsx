import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { apiGet, apiPost } from "../../../../core/utils/apiClient";
import { resolveMediaUrl, apiUrl } from "../../../../core/config/api";
import ImageCropperModal from "../../../../core/common/crop/ImageCropperModal";

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

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Page Header */}
        <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom">
          <div>
            <h4 className="fw-bold mb-0">Add New Therapy</h4>
            <p className="text-muted fs-13 mb-0">Create and configure schedule settings for therapy services</p>
          </div>
          <div>
            <Link to="/therapy-services" className="btn btn-outline-primary btn-md rounded-pill shadow-sm">
              <i className="ti ti-arrow-left me-1" /> Back to List
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row">
            {/* Primary Details Card */}
            <div className="col-lg-8">
              <div className="card border shadow-sm mb-4">
                <div className="card-header bg-light-purple py-3">
                  <h5 className="mb-0 fw-bold text-dark">Therapy Specifications</h5>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Therapy Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Cognitive Behavioral Therapy (CBT)"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Category <span className="text-danger">*</span></label>
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
                      <input
                        type="text"
                        className="form-control bg-light"
                        readOnly
                        value={code}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Duration (Minutes) <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g. 45"
                        required
                        min="1"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Base Price/Session (₹) <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g. 1500"
                        required
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">Description (Optional)</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Provide details about the therapy, conditions treated, etc."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Session Settings Card */}
              <div className="card border shadow-sm mb-4">
                <div className="card-header bg-light-purple py-3">
                  <h5 className="mb-0 fw-bold text-dark">Session Settings & Frequency</h5>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Minimum Sessions <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        required
                        value={minSessions}
                        onChange={(e) => setMinSessions(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Maximum Sessions <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        required
                        value={maxSessions}
                        onChange={(e) => setMaxSessions(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Session Gap (Days)</label>
                      <input
                        type="number"
                        className="form-control"
                        min="0"
                        disabled={scheduleType !== "custom"}
                        value={sessionGap}
                        onChange={(e) => setSessionGap(e.target.value)}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">Schedule Configuration</label>
                      <div className="d-flex flex-wrap gap-3 mb-3">
                        {["daily", "alternate", "weekly", "custom"].map((type) => (
                          <div key={type} className="form-check form-check-inline">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="scheduleType"
                              id={`schedule-${type}`}
                              value={type}
                              checked={scheduleType === type}
                              onChange={() => {
                                setScheduleType(type);
                                if (type === "daily") {
                                  setSessionGap("0");
                                } else if (type === "alternate") {
                                  setSessionGap("1");
                                } else if (type === "weekly") {
                                  setSessionGap("7");
                                } else {
                                  setSessionGap(""); // Editable for custom
                                }
                              }}
                            />
                            <label className="form-check-label fw-semibold text-capitalize cursor-pointer" htmlFor={`schedule-${type}`}>
                              {type === "alternate" ? "Alternate Day" : type}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Schedule Days Preview */}
                    <div className="col-12">
                      <label className="form-label fw-semibold text-success d-flex align-items-center gap-2">
                        <i className="ti ti-checks fs-18" /> Generated Schedule Preview
                      </label>
                      <div className="d-flex flex-wrap gap-2 p-2 border rounded bg-light">
                        {relativeDays.map((dayNum, idx) => (
                          <span key={idx} className="badge bg-purple-transparent text-purple px-3 py-2 fs-13 rounded-pill border border-purple">
                            Session {idx + 1}: Day {dayNum}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column - Gallery Upload & Crop */}
            <div className="col-lg-4">
              <div className="card border shadow-sm mb-4">
                <div className="card-header bg-light-purple py-3">
                  <h5 className="mb-0 fw-bold text-dark">Gallery & Prescriptions</h5>
                </div>
                <div className="card-body">
                  <label className="form-label fw-semibold mb-2">Upload Therapy Images</label>
                  
                  {/* Upload Trigger Area */}
                  <div
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className="upload-dropzone border border-dashed rounded p-4 text-center cursor-pointer mb-3 hover-light"
                    style={{ borderColor: "#6366f1", borderWidth: "2px", backgroundColor: "#fcfcff" }}
                  >
                    {uploading ? (
                      <div className="py-2">
                        <span className="spinner-border text-primary spinner-border-sm mb-2" />
                        <p className="mb-0 text-muted fs-13">Uploading & processing...</p>
                      </div>
                    ) : (
                      <div className="py-2">
                        <i className="ti ti-camera fs-36 text-primary mb-2" />
                        <h6 className="fw-bold mb-1 fs-14">Add Explanation Images</h6>
                        <p className="text-muted fs-11 mb-0">Crop & add photos of exercises or anatomical views (Hold Ctrl to select multiple)</p>
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

                  {/* Grid showing gallery items */}
                  {gallery.length > 0 && (
                    <div className="row g-2">
                      {gallery.map((imgUrl, idx) => (
                        <div key={idx} className="col-6 position-relative group">
                          <div className="border rounded overflow-hidden shadow-sm" style={{ height: "100px" }}>
                            <img
                              src={resolveMediaUrl(imgUrl)}
                              alt="Gallery Item"
                              className="w-100 h-100 object-fit-cover"
                              style={{ objectFit: "cover" }}
                            />
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger rounded-circle p-1 position-absolute top-0 end-0 m-1 shadow"
                            style={{ width: "24px", height: "24px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
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

              {/* Status & Options Card */}
              <div className="card border shadow-sm mb-4">
                <div className="card-body">
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
                    <button type="submit" className="btn btn-primary btn-lg shadow-sm">
                      <i className="ti ti-plus me-1" /> Save Therapy
                    </button>
                    <Link to="/therapy-services" className="btn btn-outline-secondary">
                      Cancel
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
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
