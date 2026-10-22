import { IconFormControl } from "../../../../../../../core/common/form-fields";

const Modals = () => {
  return (
    <>
      {/* Start Add Categories */}
      <div id="add_storage" className="modal fade">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="text-dark modal-title fw-bold">AWS</h5>
              <button
                type="button"
                className="btn-close btn-close-modal custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="fa-solid fa-x" />
              </button>
            </div>
            <form>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">
                    AWS Access Key<span className="text-danger ms-1">*</span>
                  </label>
                  <IconFormControl type="text" placeholder="Enter AWS access key" />
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    Secret Key<span className="text-danger ms-1">*</span>
                  </label>
                  <IconFormControl fieldLabel="Password" type="text" placeholder="Enter secret key" />
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    Bucket Name<span className="text-danger ms-1">*</span>
                  </label>
                  <IconFormControl type="text" placeholder="Enter bucket name" />
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    Region<span className="text-danger ms-1">*</span>
                  </label>
                  <IconFormControl fieldLabel="Location" type="text" placeholder="Enter region" />
                </div>
                <div className="mb-0">
                  <label className="form-label">
                    Base URL<span className="text-danger ms-1">*</span>
                  </label>
                  <IconFormControl fieldLabel="Website" type="text" placeholder="Enter base URL" />
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
                <button type="submit" className="btn btn-primary">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* End Add Categories */}
    </>
  );
};

export default Modals;
