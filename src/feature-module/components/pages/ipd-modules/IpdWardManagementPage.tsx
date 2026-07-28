import React, { useState, useEffect, useMemo, useCallback } from "react";
import Footer from "../../../../core/common/footer/footer";
import { apiUrl } from "../../../../core/config/api";
import { toast } from "react-toastify";
import { IconFormControl } from "../../../../core/common/form-fields";

interface Ward {
  id: string;
  wardName: string;
  wardCode?: string | null;
  wardType: string;
  totalBeds: number; // Max capacity / beds in room
  occupiedBeds: number;
  chargePerNight: number; // Per night charges
  nursingChargePerNight: number;
  amenities?: string[] | null;
  floorNumber?: string | null;
  description?: string | null;
  status: string;
  createdAt: string;
}

const WARD_TYPES = [
  "General Ward",
  "Semi-Private Room",
  "Deluxe Private Room",
  "VIP Suite Room",
  "ICU / CCU Unit",
  "Isolation Ward",
  "Day Care Ward",
];

const AVAILABLE_AMENITIES = [
  "Air Conditioner (AC)",
  "Television (TV)",
  "Attached Washroom",
  "Oxygen Supply Unit",
  "Ventilator Support",
  "Attendant Sofa / Bed",
  "Free High-Speed Wi-Fi",
  "Electric Recline Bed",
  "Mini Refrigerator",
];

const IpdWardManagementPage: React.FC = () => {
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("All");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [wardName, setWardName] = useState("");
  const [wardCode, setWardCode] = useState("");
  const [wardType, setWardType] = useState("General Ward");
  const [totalBeds, setTotalBeds] = useState("1"); // Kitne log / beds in room
  const [chargePerNight, setChargePerNight] = useState(""); // Charges per night
  const [nursingChargePerNight, setNursingChargePerNight] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(["Air Conditioner (AC)", "Attached Washroom"]);
  const [floorNumber, setFloorNumber] = useState("1st Floor");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Active");

  // Fetch Wards
  const fetchWards = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(apiUrl("/api/ipd/wards"), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to load wards");
      const data = await res.json();
      setWards(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load ward management data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWards();
  }, [fetchWards]);

  // Summary Metrics
  const stats = useMemo(() => {
    let totalBedsCount = 0;
    let occupiedBedsCount = 0;
    wards.forEach((w) => {
      totalBedsCount += w.totalBeds || 0;
      occupiedBedsCount += w.occupiedBeds || 0;
    });
    return {
      totalWards: wards.length,
      totalBeds: totalBedsCount,
      occupiedBeds: occupiedBedsCount,
      availableBeds: totalBedsCount - occupiedBedsCount,
    };
  }, [wards]);

  // Reset Form
  const resetForm = () => {
    setWardName("");
    setWardCode("");
    setWardType("General Ward");
    setTotalBeds("1");
    setChargePerNight("");
    setNursingChargePerNight("");
    setSelectedAmenities(["Air Conditioner (AC)", "Attached Washroom"]);
    setFloorNumber("1st Floor");
    setDescription("");
    setStatus("Active");
    setIsEditing(false);
    setEditingId(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (ward: Ward) => {
    setEditingId(ward.id);
    setIsEditing(true);
    setWardName(ward.wardName || "");
    setWardCode(ward.wardCode || "");
    setWardType(ward.wardType || "General Ward");
    setTotalBeds(ward.totalBeds ? String(ward.totalBeds) : "1");
    setChargePerNight(ward.chargePerNight ? String(ward.chargePerNight) : "");
    setNursingChargePerNight(ward.nursingChargePerNight ? String(ward.nursingChargePerNight) : "");
    setSelectedAmenities(Array.isArray(ward.amenities) ? ward.amenities : []);
    setFloorNumber(ward.floorNumber || "1st Floor");
    setDescription(ward.description || "");
    setStatus(ward.status || "Active");
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this Ward / Room?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(apiUrl(`/api/ipd/wards/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete ward");
      toast.success("Ward deleted successfully");
      fetchWards();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wardName.trim()) {
      toast.error("Ward / Room name is required");
      return;
    }
    if (!chargePerNight || parseFloat(chargePerNight) < 0) {
      toast.error("Please enter a valid Per Night Room Charge");
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem("token");
    const payload = {
      wardName: wardName.trim(),
      wardCode: wardCode.trim() || undefined,
      wardType,
      totalBeds: parseInt(totalBeds, 10) || 1,
      chargePerNight: parseFloat(chargePerNight) || 0,
      nursingChargePerNight: parseFloat(nursingChargePerNight) || 0,
      amenities: selectedAmenities,
      floorNumber: floorNumber.trim() || undefined,
      description: description.trim() || undefined,
      status,
    };

    try {
      const res = await fetch(
        apiUrl(isEditing ? `/api/ipd/wards/${editingId}` : "/api/ipd/wards"),
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Saving ward failed");
      }

      toast.success(isEditing ? "Ward / Room updated successfully!" : "New Ward / Room added successfully!");
      setShowModal(false);
      resetForm();
      fetchWards();
    } catch (err: any) {
      toast.error(err.message || "Error saving ward");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered List
  const filteredWards = useMemo(() => {
    return wards.filter((w) => {
      const matchQuery =
        w.wardName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.wardCode && w.wardCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (w.floorNumber && w.floorNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchType = selectedTypeFilter === "All" || w.wardType === selectedTypeFilter;
      return matchQuery && matchType;
    });
  }, [wards, searchQuery, selectedTypeFilter]);

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Page Header */}
        <div className="d-md-flex d-block align-items-center justify-content-between mb-4 gap-3 flex-wrap">
          <div>
            <h3 className="page-title mb-0">Ward & Room Management</h3>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* Search Input */}
            <IconFormControl
              fieldLabel="search"
              type="text"
              className="form-control-sm"
              style={{ width: "200px" }}
              placeholder="Search ward/code/floor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Ward Type Select */}
            <select
              className="form-select form-select-sm"
              style={{ width: "160px" }}
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
            >
              <option value="All">All Ward Types</option>
              {WARD_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            {(searchQuery || selectedTypeFilter !== "All") && (
              <button
                className="btn btn-sm btn-light border fw-semibold"
                style={{ fontSize: '12px', borderRadius: '6px' }}
                onClick={() => { setSearchQuery(""); setSelectedTypeFilter("All"); }}
              >
                <i className="ti ti-x me-1" />Clear
              </button>
            )}

            <button className="btn btn-primary btn-sm" onClick={handleOpenAddModal}>
              <i className="ti ti-plus me-1" /> + Add Ward / Room
            </button>
          </div>
        </div>

        {/* Overview Metric Cards */}
        <div className="row g-3 mb-4">
          <div className="col-xl-3 col-sm-6">
            <div className="card border-0 shadow-sm border-start border-4 border-primary">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted fs-12 fw-semibold d-block">TOTAL WARDS & ROOMS</span>
                    <h3 className="fw-bold mb-0 text-dark">{stats.totalWards}</h3>
                  </div>
                  <div className="avatar avatar-md bg-soft-primary text-primary rounded-circle">
                    <i className="ti ti-building-hospital fs-20" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-sm-6">
            <div className="card border-0 shadow-sm border-start border-4 border-info">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted fs-12 fw-semibold d-block">TOTAL CAPACITY (BEDS)</span>
                    <h3 className="fw-bold mb-0 text-info">{stats.totalBeds}</h3>
                  </div>
                  <div className="avatar avatar-md bg-soft-info text-info rounded-circle">
                    <i className="ti ti-bed fs-20" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-sm-6">
            <div className="card border-0 shadow-sm border-start border-4 border-success">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted fs-12 fw-semibold d-block">AVAILABLE BEDS</span>
                    <h3 className="fw-bold mb-0 text-success">{stats.availableBeds}</h3>
                  </div>
                  <div className="avatar avatar-md bg-soft-success text-success rounded-circle">
                    <i className="ti ti-circle-check fs-20" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-sm-6">
            <div className="card border-0 shadow-sm border-start border-4 border-warning">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted fs-12 fw-semibold d-block">OCCUPIED BEDS</span>
                    <h3 className="fw-bold mb-0 text-warning">{stats.occupiedBeds}</h3>
                  </div>
                  <div className="avatar avatar-md bg-soft-warning text-warning rounded-circle">
                    <i className="ti ti-user-check fs-20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wards Cards Grid / Table View */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="text-muted mt-2 mb-0">Loading Ward & Room Management data...</p>
          </div>
        ) : filteredWards.length === 0 ? (
          <div className="card border-0 shadow-sm text-center py-5">
            <i className="ti ti-building-hospital fs-40 text-muted mb-2 d-block" />
            <h5 className="fw-bold">No Wards or Rooms Found</h5>
            <p className="text-muted fs-13 mb-3">
              Add your first ward or room with room charges per night and bed capacity limits.
            </p>
            <div>
              <button className="btn btn-primary btn-sm" onClick={handleOpenAddModal}>
                <i className="ti ti-plus me-1" /> + Add Ward / Room
              </button>
            </div>
          </div>
        ) : (
          <div className="row g-3">
            {filteredWards.map((w) => {
              const totalBedsNum = w.totalBeds || 1;
              const occupiedNum = w.occupiedBeds || 0;
              const availableNum = totalBedsNum - occupiedNum;
              const occupancyPct = Math.min(100, Math.round((occupiedNum / totalBedsNum) * 100));
              const isFull = occupiedNum >= totalBedsNum;

              return (
                <div key={w.id} className="col-lg-4 col-md-6">
                  <div
                    className={`card h-100 border-0 shadow-sm border-top border-3 ${
                      isFull ? "border-danger" : "border-primary"
                    }`}
                    style={isFull ? { boxShadow: "0 0 0 1px rgba(220,53,69,0.25)" } : {}}
                  >
                    <div className="card-body p-3 d-flex flex-column justify-content-between">
                      <div>
                        {/* Header Badge & Title */}
                        <div className="d-flex align-items-start justify-content-between mb-2">
                          <div>
                            <span className="badge bg-soft-dark text-dark fw-bold me-1">
                              {w.wardCode || "WARD"}
                            </span>
                            <span className="badge bg-soft-info text-info fw-semibold">
                              {w.wardType}
                            </span>
                          </div>
                          <div className="d-flex align-items-center gap-1">
                            {isFull && (
                              <span
                                className="badge bg-danger text-white fw-bold"
                                style={{
                                  animation: "pulse 1.5s infinite",
                                  fontSize: "11px",
                                }}
                              >
                                🔴 WARD FULL
                              </span>
                            )}
                            <span
                              className={`badge ${
                                w.status === "Active" ? "bg-soft-success text-success" : "bg-soft-danger text-danger"
                              }`}
                            >
                              {w.status}
                            </span>
                          </div>
                        </div>

                        <h5 className="fw-bold text-dark mb-1">{w.wardName}</h5>
                        {w.floorNumber && (
                          <small className="text-muted d-block mb-3">
                            <i className="ti ti-map-pin me-1 text-primary" />
                            {w.floorNumber}
                          </small>
                        )}

                        {/* Charges Card */}
                        <div className="p-2 bg-light rounded-3 mb-3 border">
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <span className="fs-12 text-muted fw-semibold">Room Charge (Per Night):</span>
                            <span className="fw-bold text-success fs-15">₹{w.chargePerNight.toLocaleString("en-IN")}</span>
                          </div>
                          {w.nursingChargePerNight > 0 && (
                            <div className="d-flex align-items-center justify-content-between">
                              <span className="fs-12 text-muted">Nursing Charge (Per Night):</span>
                              <span className="fw-semibold text-dark fs-13">₹{w.nursingChargePerNight.toLocaleString("en-IN")}</span>
                            </div>
                          )}
                        </div>

                        {/* Capacity & Occupancy Bar */}
                        <div className="mb-3">
                          <div className="d-flex align-items-center justify-content-between fs-13 mb-1">
                            <span className="fw-semibold text-dark">
                              <i className="ti ti-bed me-1 text-primary" />
                              Bed Capacity Limit:
                            </span>
                            <span className="fw-bold text-primary">
                              {totalBedsNum} {totalBedsNum === 1 ? "Person / Bed" : "Beds"}
                            </span>
                          </div>

                          <div className="progress" style={{ height: "8px" }}>
                            <div
                              className={`progress-bar ${
                                occupancyPct >= 90 ? "bg-danger" : occupancyPct > 50 ? "bg-warning" : "bg-success"
                              }`}
                              role="progressbar"
                              style={{ width: `${occupancyPct}%` }}
                            />
                          </div>

                          <div className="d-flex justify-content-between fs-11 text-muted mt-1">
                             <span>Occupied: {occupiedNum} / {totalBedsNum}</span>
                             <span className={`fw-bold ${
                               isFull ? "text-danger" : availableNum <= 1 ? "text-warning" : "text-success"
                             }`}>
                               {isFull ? "⚠️ No Beds Available" : `Available: ${availableNum}`}
                             </span>
                           </div>
                        </div>

                        {/* Amenities */}
                        {Array.isArray(w.amenities) && w.amenities.length > 0 && (
                          <div className="mb-3">
                            <small className="text-muted d-block mb-1 fs-11 fw-bold text-uppercase">
                              Room Amenities:
                            </small>
                            <div className="d-flex flex-wrap gap-1">
                              {w.amenities.slice(0, 4).map((a) => (
                                <span key={a} className="badge bg-soft-secondary text-secondary fs-10">
                                  {a}
                                </span>
                              ))}
                              {w.amenities.length > 4 && (
                                <span className="badge bg-soft-dark text-dark fs-10">
                                  +{w.amenities.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="d-flex align-items-center justify-content-between border-top pt-2 mt-2">
                        <small className="text-muted">
                          Added: {new Date(w.createdAt).toLocaleDateString()}
                        </small>

                        <div>
                          <button
                            className="btn btn-sm btn-icon btn-light me-1"
                            onClick={() => handleEdit(w)}
                            title="Edit Ward"
                          >
                            <i className="ti ti-edit text-primary" />
                          </button>
                          <button
                            className="btn btn-sm btn-icon btn-light text-danger"
                            onClick={() => handleDelete(w.id)}
                            title="Delete Ward"
                          >
                            <i className="ti ti-trash" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT WARD */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold text-white">
                  <i className="ti ti-building-hospital me-2" />
                  {isEditing ? "Edit Ward / Room" : "Add Ward / Room Management"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                />
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  {/* Basic Ward Info */}
                  <h6 className="fw-bold text-dark border-bottom pb-2 mb-3 d-flex align-items-center gap-2">
                    <span className="badge bg-primary rounded-circle p-1" style={{ width: "8px", height: "8px" }} />
                    Ward & Room Details
                  </h6>

                  <div className="row g-3 mb-4">
                    <div className="col-md-7">
                      <label className="form-label fw-semibold">
                        Ward / Room Name <span className="text-danger">*</span>
                      </label>
                      <IconFormControl
                        fieldLabel="name"
                        type="text"
                        placeholder="e.g. Deluxe AC Room 101, General Male Ward A"
                        value={wardName}
                        onChange={(e) => setWardName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-md-5">
                      <label className="form-label fw-semibold">
                        Ward / Room Code <span className="text-muted font-normal">(Optional)</span>
                      </label>
                      <IconFormControl
                        fieldLabel="Title"
                        type="text"
                        placeholder="Enter ward / room code"
                        value={wardCode}
                        onChange={(e) => setWardCode(e.target.value)}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">
                        Ward Type <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={wardType}
                        onChange={(e) => setWardType(e.target.value)}
                        required
                      >
                        {WARD_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">
                        Bed Capacity Limit <span className="text-danger">*</span>
                      </label>
                      <IconFormControl
                        fieldLabel="bed"
                        type="number"
                        placeholder="Kitne log / beds (e.g. 1, 4, 10)"
                        value={totalBeds}
                        onChange={(e) => setTotalBeds(e.target.value)}
                        min={1}
                        required
                      />
                      <small className="text-muted fs-11">Max capacity / patients in room</small>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Floor Location</label>
                      <IconFormControl
                        fieldLabel="location"
                        type="text"
                        placeholder="e.g. 1st Floor, 2nd Floor"
                        value={floorNumber}
                        onChange={(e) => setFloorNumber(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Charges Per Night Section */}
                  <h6 className="fw-bold text-dark border-bottom pb-2 mb-3 d-flex align-items-center gap-2">
                    <span className="badge bg-success rounded-circle p-1" style={{ width: "8px", height: "8px" }} />
                    Per Night Tariff / Charges
                  </h6>

                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <div className="p-3 bg-soft-success border border-success rounded-3">
                        <label className="form-label fw-bold text-dark mb-1">
                          <i className="ti ti-currency-rupee text-success me-1" />
                          Room Charge Per Night (₹) <span className="text-danger">*</span>
                        </label>
                        <IconFormControl
                          fieldLabel="amount"
                          type="number"
                          className="fw-bold text-success fs-16"
                          placeholder="e.g. 1500 (per night rate)"
                          value={chargePerNight}
                          onChange={(e) => setChargePerNight(e.target.value)}
                          min={0}
                          required
                        />
                        <small className="text-muted fs-11">Daily 24-hour stay charge</small>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="p-3 bg-light border rounded-3">
                        <label className="form-label fw-bold text-dark mb-1">
                          Nursing Charge Per Night (₹) <span className="text-muted font-normal">(Optional)</span>
                        </label>
                        <IconFormControl
                          fieldLabel="amount"
                          type="number"
                          placeholder="e.g. 500 (optional per night)"
                          value={nursingChargePerNight}
                          onChange={(e) => setNursingChargePerNight(e.target.value)}
                          min={0}
                        />
                        <small className="text-muted fs-11">Daily nursing & care charge</small>
                      </div>
                    </div>
                  </div>

                  {/* Amenities */}
                  <h6 className="fw-bold text-dark border-bottom pb-2 mb-3 d-flex align-items-center gap-2">
                    <span className="badge bg-info rounded-circle p-1" style={{ width: "8px", height: "8px" }} />
                    Room Amenities & Facilities
                  </h6>

                  <div className="row g-2 mb-4">
                    {AVAILABLE_AMENITIES.map((amenity) => {
                      const isChecked = selectedAmenities.includes(amenity);
                      return (
                        <div key={amenity} className="col-md-4 col-6">
                          <div
                            className={`p-2 border rounded cursor-pointer d-flex align-items-center gap-2 ${
                              isChecked ? "bg-soft-primary border-primary" : "bg-light"
                            }`}
                            onClick={() => toggleAmenity(amenity)}
                            style={{ cursor: "pointer" }}
                          >
                            <i
                              className={`ti ti-${isChecked ? "checkbox text-primary" : "square text-muted"}`}
                            />
                            <span className="fs-12 fw-medium">{amenity}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Status & Description */}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Ward Status</label>
                      <select
                        className="form-select"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <option value="Active">Active (Available)</option>
                        <option value="Maintenance">Under Maintenance</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Description / Notes</label>
                      <IconFormControl
                        fieldLabel="description"
                        type="text"
                        placeholder="Additional details about ward..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light border-top">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 fw-bold"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Saving...
                      </>
                    ) : isEditing ? (
                      "Update Ward"
                    ) : (
                      "Save Ward"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default IpdWardManagementPage;
