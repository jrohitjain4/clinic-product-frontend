import { useState } from "react";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import { Link } from "react-router";
import { all_routes } from "../../../routes/all_routes";
import { IconFormControl } from "../../../../core/common/form-fields";
type PasswordField = "password" | "confirmPassword";

const LockScreen = () => {
  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false,
    confirmPassword: false,
  });

  const togglePasswordVisibility = (field: PasswordField) => {
    setPasswordVisibility((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };
  return (
    <>
      {/* Start Content */}
      <div className="container-fuild position-relative z-1">
        <div className="w-100 overflow-hidden position-relative flex-wrap d-block vh-100">
          {/* start row */}
          <div className="row justify-content-center align-items-center vh-100 overflow-auto flex-wrap ">
            <div className="col-lg-4 mx-auto">
              <form
                className="d-flex justify-content-center align-items-center"
              >
                <div className="d-flex flex-column justify-content-lg-center p-4 p-lg-0 pb-0 flex-fill">
                  <div className=" mx-auto mb-5 text-center">
                    <ImageWithBasePath
                      src="assets/img/logo.svg"
                      className="img-fluid"
                      alt="Logo"
                     style={{ width: "250px", height: "auto" }} />
                  </div>
                  <div className="card border-1 p-lg-3 shadow-md rounded-3">
                    <div className="card-body">
                      <div className="text-center mb-3">
                        <h5 className="mb-1 fs-20 fw-bold">Welcome Back!</h5>
                      </div>
                      <div className="text-center mb-3">
                        <span className="avatar avatar-xxxl rounded-circle flex-shrink-0">
                          <ImageWithBasePath
                            src="assets/img/users/user-01.jpg"
                            className="rounded-circle"
                            alt="img"
                          />
                        </span>
                        <p className="text-dark"> John Carter </p>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Password</label>
                        <div className="position-relative">
                          <div className="pass-group position-relative">
                            <IconFormControl
                              type={
                                passwordVisibility.password
                                  ? "text"
                                  : "password"
                              }
                              fieldLabel="Password"
                              placeholder="Password"
                              className="pass-input pe-5"
                            />
                            <span
                              className={`ti toggle-password text-dark fs-14 ${
                                passwordVisibility.password
                                  ? "ti-eye"
                                  : "ti-eye-off"
                              }`}
                              onClick={() =>
                                togglePasswordVisibility("password")
                              }
                            ></span>
                          </div>
                        </div>
                      </div>
                      <div className="mb-2">
                        <Link
                          to={all_routes.loginCover}
                          className="btn bg-primary text-white w-100"
                        >
                          Login
                        </Link>
                      </div>
                    </div>
                    {/* end card body */}
                  </div>
                  {/* end card */}
                </div>
              </form>
            </div>
            {/* end col */}
          </div>
          {/* end row */}
        </div>
      </div>
      {/* End Content */}
      {/* Start Bg Content */}
      <ImageWithBasePath
        src="assets/img/auth/auth-bg-top.png"
        alt=""
        className="img-fluid element-01"
      />
      <ImageWithBasePath
        src="assets/img/auth/auth-bg-bot.png"
        alt=""
        className="img-fluid element-02"
      />
      {/* End Bg Content */}
    </>
  );
};

export default LockScreen;


