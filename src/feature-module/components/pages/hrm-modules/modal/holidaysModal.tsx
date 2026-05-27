import { Link } from "react-router";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { DatePicker, Spin } from "antd";
import { useState, useEffect } from "react";
import { apiPost, apiPut, apiDelete } from "../../../../../core/utils/apiClient";
import dayjs from "dayjs";

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
      refetch();
      resetForm();
      document.querySelector<HTMLElement>("#add_holiday .btn-close")?.click();
    } catch (err) {
      console.error(err);
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
      refetch();
      document.querySelector<HTMLElement>("#edit_holiday .btn-close")?.click();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleDelete = async (e: any) => {
    e.preventDefault();
    if (!selectedHoliday) return;
    setLoading(true);
    try {
      await apiDelete(`/api/holidays/${selectedHoliday.id}`);
      refetch();
      document.querySelector<HTMLElement>("#delete_holiday .btn-close")?.click();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body;
  };

  return (
    <>
      <div id="add_holiday" className="modal fade">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="text-dark modal-title fw-bold">Add Holiday</h5>
              <button
                type="button"
                className="btn-close btn-close-modal custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="fa-solid fa-x" />
              </button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">
                    Title<span className="text-danger ms-1">*</span>
                  </label>
                  <input type="text" className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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
              </div>
              <div className="modal-footer d-flex align-items-center gap-1">
                <button
                  type="button"
                  className="btn btn-white border"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <Spin size="small" /> : 'Add Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div id="edit_holiday" className="modal fade">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="text-dark modal-title fw-bold">Edit Holiday</h5>
              <button
                type="button"
                className="btn-close btn-close-modal custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="fa-solid fa-x" />
              </button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">
                    Title<span className="text-danger ms-1">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
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
              </div>
              <div className="modal-footer d-flex align-items-center gap-1">
                <button
                  type="button"
                  className="btn btn-white border"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <Spin size="small" /> : 'Save Changes'}
                </button>
              </div>
            </form>
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
