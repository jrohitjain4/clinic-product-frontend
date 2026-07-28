import { useState, useEffect } from "react";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import { Link, useNavigate } from "react-router";
import { all_routes } from "../../../routes/all_routes";
import { apiUrl } from "../../../../core/config/api";
import { IconFormControl, IconTextarea, GenderOptionGroup } from "../../../../core/common/form-fields";
import type { GenderValue } from "../../../../core/common/form-fields";

interface PackageOption {
  id: string;
  name: string;
  price: number;
  durationInDays: number;
  maxDoctors: number;
  maxPatients: number;
  maxAppointments: number;
}

const RegisterBasic = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const role = "ADMIN";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dob, setDob] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<GenderValue>("Male");

  const [clinicName, setClinicName] = useState("");
  const [gstNo, setGstNo] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");

  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [packages, setPackages] = useState<PackageOption[]>([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [draftUserId, setDraftUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch(apiUrl("/api/auth/packages"))
      .then(res => res.json())
      .then(data => {
        setPackages(data);
        if (data.length > 0) setSelectedPackageId(data[0].id);
      });
  }, []);

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return "";
    const birth = new Date(birthDate);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) years--;
    return years >= 0 ? years.toString() : "0";
  };

  const handleDobChange = (value: string) => {
    setDob(value);
    setAge(calculateAge(value));
  };

  const handleNext = async () => {
    setError("");
    if (step === 1) {
      if (!fullName || !email || !password || !dob || !gender) {
        setError("Please fill all fields.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!clinicName) {
        setError("Clinic name is required.");
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(apiUrl("/api/auth/register-draft"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email, password, fullName, role, dob, age, gender,
            clinicInfo: { name: clinicName, gstNo, address: clinicAddress }
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to save progress");
        setDraftUserId(data.userId);
        setStep(3);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const submitRegistration = async () => {
    setError("");
    setLoading(true);
    try {
      const response = await fetch(apiUrl("/api/auth/complete-registration"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: draftUserId, packageId: selectedPackageId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Plan activation failed");
      setSuccess("Account registered successfully! Redirecting to login...");
      setTimeout(() => navigate(all_routes.login), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => {
    return (
      <div className="d-flex justify-content-center mb-4">
        {[1, 2, 3].map(s => (
          <div key={s} className="d-flex align-items-center">
            <div
              className={`rounded-circle d-flex align-items-center justify-content-center fw-bold ${step === s ? 'bg-primary text-white' : (step > s ? 'bg-success text-white' : 'bg-light text-muted')}`}
              style={{ width: '30px', height: '30px', fontSize: '14px' }}
            >
              {step > s ? <i className="ti ti-check" /> : s}
            </div>
            {s < 3 && <div className={`mx-2 ${step > s ? 'bg-success' : 'bg-light'}`} style={{ height: '2px', width: '30px' }} />}
          </div>
        ))}
      </div>
    );
  };

  const stepLabel = step === 1 ? 'Personal Details' : (step === 2 ? 'Business Information' : 'Select Plan');

  return (
    <>
      <div className="container-fuild position-relative z-1">
        <div className="w-100 overflow-hidden position-relative flex-wrap d-block vh-100 bg-white">
          <div className="row g-2 h-100">
            {/* Left Cover Panel */}
            <div className="col-lg-6 p-0">
              <div className="login-backgrounds login-covers bg-primary d-lg-flex align-items-center justify-content-center d-none flex-wrap p-4 position-relative h-100 z-0">
                <div className="authentication-card w-100">
                  <div className="authen-overlay-item w-100">
                    <div className="authen-head text-center">
                      <h1 className="text-white fs-32 fw-bold mb-2">
                        Join the future of <br /> modern healthcare
                      </h1>
                      <p className="text-light fw-normal">
                        Register your clinic and manage your healthcare journey all in one place.
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

            {/* Right Form Panel */}
            <div className="col-lg-6 col-md-12 col-sm-12">
              <div className="row g-2 justify-content-center align-items-center overflow-auto flex-wrap vh-100">
                <div className="col-md-9 mx-auto py-4">
                  <div className="text-center mb-3">
                    <ImageWithBasePath src="assets/img/logo.svg" className="img-fluid mb-3" alt="Logo" style={{ width: "250px", height: "auto" }} />
                    <h4 className="fw-bold mb-0">Create Your Account</h4>
                    <p className="text-muted fs-13">Step {step}: {stepLabel}</p>
                  </div>

                  <div className="card shadow-md border-1 rounded-3">
                    <div className="card-body p-4">
                      {renderStepIndicator()}

                      {error && <div className="alert alert-danger mb-3 py-2 fs-13"><i className="ti ti-alert-triangle me-2" />{error}</div>}
                      {success && <div className="alert alert-success mb-3 py-2 fs-13"><i className="ti ti-circle-check me-2" />{success}</div>}

                      {step === 1 && (
                        <div>
                          <div className="row g-2">
                            <div className="col-md-12 mb-3">
                              <label className="form-label">Full Name</label>
                              <IconFormControl type="text" fieldLabel="Full Name" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} />
                            </div>
                            <div className="col-md-12 mb-3">
                              <label className="form-label">Email Address</label>
                              <IconFormControl type="email" fieldLabel="Email Address" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                          </div>

                          <div className="row g-2">
                            <div className="col-md-6 mb-3">
                              <label className="form-label">Date of Birth</label>
                              <IconFormControl type="date" fieldLabel="Date of Birth" placeholder="Date of Birth" value={dob} onChange={e => handleDobChange(e.target.value)} />
                            </div>
                            <div className="col-md-6 mb-3">
                              <label className="form-label">Age</label>
                              <IconFormControl type="text" fieldLabel="Age" value={age} disabled placeholder="Age" />
                            </div>
                            <div className="col-md-12 mb-3">
                              <GenderOptionGroup value={gender} onChange={setGender} required showLabel />
                            </div>
                          </div>

                          <div className="row g-2">
                            <div className="col-md-6 mb-3">
                              <label className="form-label">Password</label>
                              <IconFormControl type="password" fieldLabel="Password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                            </div>
                            <div className="col-md-6 mb-3">
                              <label className="form-label">Confirm Password</label>
                              <IconFormControl type="password" fieldLabel="Confirm Password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                            </div>
                          </div>

                          <button type="button" onClick={handleNext} className="btn btn-primary w-100 py-2 fw-bold mt-2">
                            Next: Business Details
                          </button>
                        </div>
                      )}

                      {step === 2 && (
                        <div>
                          <div className="mb-3">
                            <label className="form-label">Clinic Name</label>
                            <IconFormControl type="text" fieldLabel="company" placeholder="Clinic Name" value={clinicName} onChange={e => setClinicName(e.target.value)} />
                          </div>
                          <div className="mb-3">
                            <label className="form-label">GST Number</label>
                            <IconFormControl type="text" placeholder="GST Number" value={gstNo} onChange={e => setGstNo(e.target.value)} />
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Clinic Address</label>
                            <IconTextarea fieldLabel="address" rows={3} placeholder="Clinic Address" value={clinicAddress} onChange={e => setClinicAddress(e.target.value)} />
                          </div>
                          <div className="d-flex gap-2">
                            <button type="button" onClick={() => setStep(1)} className="btn btn-light flex-fill py-2">Back</button>
                            <button type="button" onClick={handleNext} className="btn btn-primary flex-fill py-2">Next: Select Plan</button>
                          </div>
                        </div>
                      )}

                      {step === 3 && (
                        <div>
                          <label className="form-label fw-bold mb-3">Available Subscription Plans</label>
                          <div className="row g-3 mb-4">
                            {packages.map(p => (
                              <div key={p.id} className="col-md-6">
                                <div
                                  className={`card cursor-pointer h-100 transition-all border-2 ${selectedPackageId === p.id ? 'border-primary bg-primary-subtle' : 'border-light shadow-none'}`}
                                  onClick={() => setSelectedPackageId(p.id)}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <div className="card-body p-3">
                                    <div className="d-flex justify-content-between align-items-center">
                                      <div>
                                        <h6 className="mb-0 fw-bold">{p.name}</h6>
                                        <small className="text-muted">{p.durationInDays} Days</small>
                                      </div>
                                      <div className="text-end">
                                        <h6 className="mb-0 text-primary fw-bold">{p.price === 0 ? 'FREE' : `$${p.price}`}</h6>
                                        <div className="form-check m-0 d-inline-block">
                                          <input className="form-check-input" type="radio" checked={selectedPackageId === p.id} readOnly />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="d-flex gap-2">
                            <button type="button" onClick={() => setStep(2)} className="btn btn-light flex-fill py-2">Back</button>
                            <button type="button" onClick={submitRegistration} disabled={loading} className="btn btn-success flex-fill py-2 fw-bold">
                              {loading ? 'Activating Plan...' : 'Activate & Finish'}
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="text-center mt-4 pt-3 border-top">
                        <p className="fs-14 mb-0">Already have an account? <Link to={all_routes.login} className="text-primary fw-bold">Sign In</Link></p>
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-muted mt-3 fs-12">Copyright  2025 - Docyari SaaS Platform</p>
                </div>
              </div>
            </div>
          </div>
        </div >
      </div >
    </>
  );
};

export default RegisterBasic;


