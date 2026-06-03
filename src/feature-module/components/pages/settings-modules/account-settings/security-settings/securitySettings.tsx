import { Link } from "react-router"
import SettingsSidebar from "../../../../../../core/common/settings-sidebar/settingsSidebar"
import Modals from "./modals/modals"


const SecuritySettings = () => {
  return (
    <>
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper">
        {/* Start Content */}
        <div className="content" id="profilePage">
          {/* Page Header */}
          <div className="mb-3 border-bottom pb-3">
            <h4 className="fw-bold mb-0">Settings</h4>
          </div>
          {/* End Page Header */}
          <div className="card">
            <div className="card-body p-0">
              <div className="settings-wrapper d-flex">
                {/* Start Settings Sidebar */}
                <SettingsSidebar />
                {/* End Settings Sidebar */}
                <div className="card flex-fill mb-0 border-0 bg-light-500 shadow-none">
                  <div className="card-header border-bottom px-0 mx-3">
                    <div className="d-flex">
                      <h5 className="fw-bold">Security</h5>
                    </div>
                  </div>
                  <div className="card-body px-0 mx-3">
                    {/* start row */}
                    <div className="row">
                      <div className="col-lg-12">
                        <div>
                          <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 border-bottom mb-3 pb-3">
                            <div className="d-flex align-items-center">
                              <div>
                                <h5 className="fs-16 fw-semibold mb-1">Password</h5>
                                <p className="fs-14">
                                  Set a unique password to secure the account
                                </p>
                              </div>
                            </div>
                            <div className="d-flex align-items-center">
                              <Link
                                to="#"
                                data-bs-toggle="modal"
                                data-bs-target="#change_password"
                              >
                                <span className="btn btn-md btn-light p-1 shadow-sm border">
                                  <i className="ti ti-edit" />
                                </span>
                              </Link>
                            </div>
                          </div>

                          <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 border-bottom mb-3 pb-3">
                            <div className="d-flex align-items-center">
                              <div>
                                <h5 className="fs-16 fw-semibold mb-1">
                                  Phone Number
                                </h5>
                                <p className="fs-14">
                                  Phone Number associated with the account
                                </p>
                              </div>
                            </div>
                            <div className="d-flex align-items-center">
                              <Link
                                to="#"
                                className="me-3"
                                data-bs-toggle="modal"
                                data-bs-target="#phone_verification"
                              >
                                <span className="btn btn-md btn-light border shadow-sm p-1">
                                  <i className="ti ti-edit" />
                                </span>
                              </Link>
                            </div>
                          </div>

                          <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 mb-3 pb-3">
                            <div className="d-flex align-items-center">
                              <div>
                                <h5 className="fs-16 fw-semibold mb-1">
                                  Email Address
                                </h5>
                                <p className="fs-14">
                                  Email Address associated with the account
                                </p>
                              </div>
                            </div>
                            <div className="d-flex align-items-center">
                              <Link
                                to="#"
                                className="me-3"
                                data-bs-toggle="modal"
                                data-bs-target="#email_verification"
                              >
                                <span className="btn btn-md btn-light border shadow-sm p-1">
                                  <i className="ti ti-edit" />
                                </span>
                              </Link>
                            </div>
                          </div>

                        </div>
                      </div>
                      {/* end col */}

                    </div>
                    {/* end row */}
                  </div>
                  {/* end card body */}
                </div>
                {/* end card */}
              </div>
            </div>
            {/* end card body */}
          </div>
          {/* end card */}
        </div>
        {/* End Content */}
        {/* Footer Start */}
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025 ©
            <Link to="#" className="link-primary">
              DocYori
            </Link>
            , All Rights Reserved
          </p>
        </div>
        {/* Footer End */}
      </div>
      {/* ========================
			End Page Content
		========================= */}
      <Modals />
    </>

  )
}

export default SecuritySettings
