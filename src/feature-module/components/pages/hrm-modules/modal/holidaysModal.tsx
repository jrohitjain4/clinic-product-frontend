import { Link } from "react-router";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { DatePicker, Spin } from "antd";
import { useState, useEffect } from "react";
import { apiPost, apiPut, apiDelete } from "../../../../../core/utils/apiClient";
import dayjs from "dayjs";
import { toast } from "react-toastify";

interface HolidaysModalProps {
  selectedHoliday?: any;
  refetch: () => void;
}

const HolidaysModal: React.FC<HolidaysModalProps> = ({ selectedHoliday, refetch }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<dayjs.Dayjs | null>(null);
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedHoliday) {
      setTitle(selectedHoliday.title || "");
      setDescription(selectedHoliday.description || "");
      setDate(selectedHoliday.date ? dayjs(selectedHoliday.date) : null);
      setEndDate(selectedHoliday.endDate ? dayjs(selectedHoliday.endDate) : null);
    } else {
      setTitle("");
      setDescription("");
      setDate(null);
      setEndDate(null);
    }
  }, [selectedHoliday]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate(null);
    setEndDate(null);
  };

  const handleAdd = async (e: any) => {
    e.preventDefault();
    if (!title || !date) return;
    setLoading(true);
    try {
      await apiPost("/api/holidays", {
        title,
        description,
        date: date.format("YYYY-MM-DD"),
        endDate: endDate ? endDate.format("YYYY-MM-DD") : undefined
      });
      toast.success("Holiday added successfully");
      refetch();
      resetForm();
      document.querySelector<HTMLElement>("#add_holiday .btn-close")?.click();
    } catch (err: any) {
      toast.error(err?.message || "Failed to add holiday");
    }
    setLoading(false);
  };

  const handleEdit = async (e: any) => {
    e.preventDefault();
    if (!selectedHoliday || !title || !date) return;
    setLoading(true);
    try {
      await apiPut(`/api/holidays/${selectedHoliday.id}`, {
        title,
        description,
        date: date.format("YYYY-MM-DD"),
        endDate: endDate ? endDate.format("YYYY-MM-DD") : undefined
      });
      toast.success("Holiday updated successfully");
      refetch();
      document.querySelector<HTMLElement>("#edit_holiday .btn-close")?.click();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update holiday");
    }
    setLoading(false);
  };

  const handleDelete = async (e: any) => {
    e.preventDefault();
    if (!selectedHoliday) return;
    setLoading(true);
    try {
      await apiDelete(`/api/holidays/${selectedHoliday.id}`);
      toast.success("Holiday deleted successfully");
      refetch();
      document.querySelector<HTMLElement>("#delete_holiday .btn-close")?.click();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete holiday");
    }
    setLoading(false);
  };

  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body;
  };

  return (
    <>
      <div id="add_holiday" className="modal fade" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">Add Holiday</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAdd}>
                <div className="mb-3">
                  <label className="form-label">
                    Title<span className="text-danger ms-1">*</span>
                  </label>
                  <input type="text" className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Christmas Day" required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description"
                  />
                </div>
                <div className="row mb-0">
                  <div className="col-6">
                    <label className="form-label">
                      Start Date<span className="text-danger ms-1">*</span>
                    </label>
                    <div className="input-icon-end position-relative">
                      <DatePicker
                        className="form-control datetimepicker"
                        format="DD-MM-YYYY"
                        getPopupContainer={getModalContainer}
                        placeholder="DD-MM-YYYY"
                        suffixIcon={null}
                        value={date}
                        onChange={(val) => setDate(val)}
                      />
                      <span className="input-icon-addon">
                        <i className="ti ti-calendar" />
                      </span>
                    </div>
                  </div>
                  <div className="col-6">
                    <label className="form-label">
                      End Date
                    </label>
                    <div className="input-icon-end position-relative">
                      <DatePicker
                        className="form-control datetimepicker"
                        format="DD-MM-YYYY"
                        getPopupContainer={getModalContainer}
                        placeholder="DD-MM-YYYY (Optional)"
                        suffixIcon={null}
                        value={endDate}
                        onChange={(val) => setEndDate(val)}
                        disabledDate={(current) => {
                          return date ? current && current < date.startOf('day') : false;
                        }}
                      />
                      <span className="input-icon-addon">
                        <i className="ti ti-calendar" />
                      </span>
                    </div>
                  </div>
                </div>
                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                  <button type="button" className="btn btn-light px-4 shadow-sm" data-bs-dismiss="modal" style={{ borderRadius: '6px' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4 shadow-sm d-flex align-items-center justify-content-center" disabled={loading} style={{ borderRadius: '6px' }}>
                    {loading && <i className="fa fa-spinner fa-spin me-2" />}
                    {loading ? 'Saving...' : 'Add Holiday'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div id="edit_holiday" className="modal fade" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">Edit Holiday</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleEdit}>
                <div className="mb-3">
                  <label className="form-label">
                    Title<span className="text-danger ms-1">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Christmas Day"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description"
                  />
                </div>
                <div className="row mb-0">
                  <div className="col-6">
                    <label className="form-label">
                      Start Date<span className="text-danger ms-1">*</span>
                    </label>
                    <div className="input-icon-end position-relative">
                      <DatePicker
                        className="form-control datetimepicker"
                        format="DD-MM-YYYY"
                        getPopupContainer={getModalContainer}
                        placeholder="DD-MM-YYYY"
                        suffixIcon={null}
                        value={date}
                        onChange={(val) => setDate(val)}
                      />
                      <span className="input-icon-addon">
                        <i className="ti ti-calendar" />
                      </span>
                    </div>
                  </div>
                  <div className="col-6">
                    <label className="form-label">
                      End Date
                    </label>
                    <div className="input-icon-end position-relative">
                      <DatePicker
                        className="form-control datetimepicker"
                        format="DD-MM-YYYY"
                        getPopupContainer={getModalContainer}
                        placeholder="DD-MM-YYYY (Optional)"
                        suffixIcon={null}
                        value={endDate}
                        onChange={(val) => setEndDate(val)}
                        disabledDate={(current) => {
                          return date ? current && current < date.startOf('day') : false;
                        }}
                      />
                      <span className="input-icon-addon">
                        <i className="ti ti-calendar" />
                      </span>
                    </div>
                  </div>
                </div>
                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                  <button type="button" className="btn btn-light px-4 shadow-sm" data-bs-dismiss="modal" style={{ borderRadius: '6px' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4 shadow-sm d-flex align-items-center justify-content-center" disabled={loading} style={{ borderRadius: '6px' }}>
                    {loading && <i className="fa fa-spinner fa-spin me-2" />}
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div className="modal fade" id="delete_holiday">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
            <div className="modal-body text-center position-relative">
              <ImageWithBasePath
                src="assets/img/bg/delete-modal-bg-01.png"
                alt=""
                className="img-fluid position-absolute top-0 start-0"
              />
              <ImageWithBasePath
                src="assets/img/bg/delete-modal-bg-02.png"
                alt=""
                className="img-fluid position-absolute bottom-0 end-0"
              />
              <div className="mb-3">
                <span className="avatar avatar-lg bg-danger text-white">
                  <i className="ti ti-trash fs-24" />
                </span>
              </div>
              <h5 className="fw-bold mb-1">Delete Confirmation</h5>
              <p className="mb-3">Are you sure want to delete?</p>
              <div className="d-flex justify-content-center">
                <Link
                  to="#"
                  className="btn btn-light position-relative z-1 me-3"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </Link>
                <Link
                  to="#"
                  onClick={handleDelete}
                  className="btn btn-danger position-relative z-1"
                >
                  {loading ? <Spin size="small" /> : 'Yes, Delete'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HolidaysModal;
