import { useState } from "react";
import { Link } from "react-router";
import {
  Blood_Group,
  City,
  Country,
  Primary_Doctor,
  State,
  Status,
} from "../../../../../../core/common/selectOption";
import CommonSelect from "../../../../../../core/common/common-select/commonSelect";
import {
  IconFormControl,
  IconSelect,
  GenderOptionGroup,
  type GenderValue,
} from "../../../../../../core/common/form-fields";
import { DatePicker } from "antd";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

const Modals = () => {
  const [phone, setPhone] = useState<string | undefined>()
  const [gender, setGender] = useState<GenderValue>("");

  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body; // Fallback to document.body if modalElement is null
  };

  return (
    <>
      {/* Start Add modal */}
      <div className="modal fade" id="add_modal">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">Add New Patient</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body pb-0">
              {/* form start */}
              <div className="form">
                <h6 className="fw-bold mb-3">Patient Information</h6>
                <div className="row">
                  <div className="col-lg-12">
                    <div className="mb-3 d-flex align-items-center">
                      <label className="form-label mb-0">Profile Image</label>
                      <div className="drag-upload-btn avatar avatar-xxl rounded-circle bg-light text-muted position-relative overflow-hidden z-1 mb-2 ms-4 p-0">
                        <i className="ti ti-user-plus fs-16" />
                        <input
                          type="file"
                          className="form-control image-sign"
                          multiple
                        />
                        <div className="position-absolute bottom-0 end-0 star-0 w-100 h-25 bg-dark d-flex align-items-center justify-content-center z-n1">
                          <Link
                            to="#"
                            className="text-white d-flex align-items-center justify-content-center"
                          >
                            <i className="ti ti-photo fs-14" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">
                        First Name<span className="text-danger ms-1">*</span>
                      </label>
                      <IconFormControl fieldLabel="First Name" type="text" placeholder="Enter first name" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">
                        Last Name<span className="text-danger ms-1">*</span>
                      </label>
                      <IconFormControl fieldLabel="Last Name" type="text" placeholder="Enter last name" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium custom-phoneinput">
                        Phone Number<span className="text-danger ms-1">*</span>
                      </label>
                      <PhoneInput
                        defaultCountry="IN"
                        placeholder="Enter phone number"
                        value={phone}
                        onChange={setPhone}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">
                        Email Address<span className="text-danger ms-1">*</span>
                      </label>
                      <IconFormControl fieldLabel="Email Address" type="email" placeholder="Enter email address" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">
                        DOB<span className="text-danger ms-1">*</span>
                      </label>
                      <div className="input-icon-end position-relative">
                        <DatePicker
                          className="form-control datetimepicker"
                          format={{
                            format: "DD-MM-YYYY",
                            type: "mask",
                          }}
                          getPopupContainer={getModalContainer}
                          placeholder="DD-MM-YYYY"
                          suffixIcon={null}
                        />
                        <span className="input-icon-addon">
                          <i className="ti ti-calendar" />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">
                        Gender<span className="text-danger ms-1">*</span>
                      </label>
                      <GenderOptionGroup value={gender} onChange={setGender} />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">
                        Blood Group<span className="text-danger ms-1">*</span>
                      </label>
                      <IconSelect
                        fieldLabel="Blood Group"
                        options={Blood_Group}
                        className="select"
                        placeholder="Select blood group"
                        defaultValue={Blood_Group[0]}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">
                        Status<span className="text-danger ms-1">*</span>
                      </label>
                      <CommonSelect
                        options={Status}
                        className="select"
                        defaultValue={Status[0]}
                      />
                    </div>
                  </div>
                </div>
                <h6 className="fw-bold mb-3 border-top pt-3">
                  Address Information
                </h6>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">
                        Address 1<span className="text-danger ms-1">*</span>
                      </label>
                      <IconFormControl fieldLabel="Address 1" type="text" placeholder="Enter address line 1" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label mb-1 fw-medium">
                        Address 2<span className="text-danger ms-1">*</span>
                      </label>
                      <IconFormControl fieldLabel="Address 2" type="text" placeholder="Enter address line 2" />
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label mb-1">
                        Country<span className="text-danger ms-1">*</span>
                      </label>
                      <IconSelect
                        fieldLabel="Country"
                        options={Country}
                        className="select"
                        placeholder="Select country"
                        defaultValue={Country[0]}
                      />
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label mb-1">
                        State<span className="text-danger ms-1">*</span>
                      </label>
                      <IconSelect
                        fieldLabel="State"
                        options={State}
                        className="select"
                        placeholder="Select state"
                        defaultValue={State[0]}
                      />
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label mb-1">
                        City<span className="text-danger ms-1">*</span>
                      </label>
                      <IconSelect
                        fieldLabel="City"
                        options={City}
                        className="select"
                        placeholder="Select city"
                        defaultValue={City[0]}
                      />
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label mb-1">
                        Pincode<span className="text-danger ms-1">*</span>
                      </label>
                      <IconFormControl fieldLabel="Pincode" type="text" placeholder="Enter pincode" />
                    </div>
                  </div>
                </div>
              </div>
              {/* form end */}
              <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top mb-3">
                <button
                  type="button"
                  className="btn btn-light px-4 shadow-sm"
                  data-bs-dismiss="modal"
                  style={{ borderRadius: '6px' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary px-4 shadow-sm" style={{ borderRadius: '6px' }}>
                  Add Patient
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* End Add modal  */}
    </>
  );
};

export default Modals;
