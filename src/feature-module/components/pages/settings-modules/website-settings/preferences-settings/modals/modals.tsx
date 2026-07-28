import { IconFormControl } from "../../../../../../../core/common/form-fields";

const Modals = () => {
  return (
    <>
  {/* Start Add Mail */}
  <div id="google" className="modal fade">
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="text-dark modal-title fw-bold">
            Google Login Settings
          </h5>
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
                Client ID<span className="text-danger ms-1">*</span>
              </label>
              <IconFormControl type="text" placeholder="Enter client ID" />
            </div>
            <div className="mb-3">
              <label className="form-label">
                Client Secret Key<span className="text-danger ms-1">*</span>
              </label>
              <IconFormControl fieldLabel="Password" type="text" placeholder="Enter client secret key" />
            </div>
            <div className="mb-0">
              <label className="form-label">
                Login Redirect URL<span className="text-danger ms-1">*</span>
              </label>
              <IconFormControl fieldLabel="Website" type="text" placeholder="Enter login redirect URL" />
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
  {/* End Add Mail */}
  {/* Start Add Mail */}
  <div id="facebook" className="modal fade">
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="text-dark modal-title fw-bold">
            Facebook Login Settings
          </h5>
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
                API ID<span className="text-danger ms-1">*</span>
              </label>
              <IconFormControl type="text" placeholder="Enter API ID" />
            </div>
            <div className="mb-3">
              <label className="form-label">
                API Secret Key<span className="text-danger ms-1">*</span>
              </label>
              <IconFormControl fieldLabel="Password" type="text" placeholder="Enter API secret key" />
            </div>
            <div className="mb-0">
              <label className="form-label">
                Login Redirect URL<span className="text-danger ms-1">*</span>
              </label>
              <IconFormControl fieldLabel="Website" type="text" placeholder="Enter login redirect URL" />
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
  {/* End Add Mail */}
</>

  )
}

export default Modals
