import { Link } from "react-router";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import { all_routes } from "../../../routes/all_routes";

const Error404 = () => {
  return (
    <>
      <div className="container-fuild position-relative z-1">
        <div className="w-100 overflow-hidden position-relative flex-wrap d-block vh-100 bg-white">
          <div className="row">
            {/* Left Cover Panel */}
            <div className="col-lg-6 p-0">
              <div className="login-backgrounds login-covers bg-primary d-lg-flex align-items-center justify-content-center d-none flex-wrap p-4 position-relative h-100 z-0">
                <div className="authentication-card w-100">
                  <div className="authen-overlay-item w-100">
                    <div className="authen-head text-center">
                      <h1 className="text-white fs-32 fw-bold mb-2">
                        Oops! Page <br /> not found
                      </h1>
                      <p className="text-light fw-normal">
                        It looks like the page you're looking for has been moved
                        or doesn't exist. Let us help you find your way back.
                      </p>
                    </div>
                    <div className="mt-4 mx-auto authen-overlay-img">
                      <ImageWithBasePath src="assets/img/auth/cover-imgs-1.png" alt="Img" />
                    </div>
                  </div>
                </div>
                <ImageWithBasePath
                  src="assets/img/auth/cover-imgs-2.png"
                  alt="cover-imgs-2"
                  className="img-fluid cover-img"
                />
              </div>
            </div>

            {/* Right Content Panel */}
            <div className="col-lg-6 col-md-12 col-sm-12">
              <div className="row justify-content-center align-items-center overflow-auto flex-wrap vh-100">
                <div className="col-md-8 mx-auto text-center p-4">
                  <div className="mx-auto mb-4">
                    <ImageWithBasePath src="assets/img/logo.svg" className="img-fluid" alt="Logo" />
                  </div>
                  <div className="error-images mb-4">
                    <ImageWithBasePath
                      src="assets/img/error-404.svg"
                      alt="404 Error"
                      className="img-fluid"
                    />
                  </div>
                  <h4 className="mb-2 fw-bold">Oops, something went wrong</h4>
                  <p className="fs-14 text-muted mb-4">
                    Error 404 — Page not found. Sorry, the page you're looking for doesn't exist or has been moved.
                  </p>
                  <Link
                    to={all_routes.dashboard}
                    className="btn btn-primary d-inline-flex align-items-center"
                  >
                    <i className="ti ti-chevron-left me-2" />
                    Back to Dashboard
                  </Link>
                  <p className="fs-14 text-dark text-center mt-5">Copyright © 2025 - Preclinic.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Error404;