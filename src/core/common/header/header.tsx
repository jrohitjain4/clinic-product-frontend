/* eslint-disable */
import { Link, useNavigate } from "react-router-dom";
import ImageWithBasePath from "../../imageWithBasePath";
import { useEffect, useState, useRef } from "react";
import { apiGet } from "../../utils/apiClient";
import { updateTheme } from "../../redux/themeSlice";
import { useDispatch, useSelector } from "react-redux";
import { setMobileSidebar } from "../../redux/sidebarSlice";
import { all_routes } from "../../../feature-module/routes/all_routes";
import TrialCountdown from "../../../feature-module/components/common/TrialCountdown";
import { useNotifications } from "../../hooks/useNotifications";
import moment from "moment";
import { Button } from "../button/Button";
import { Input } from "../input/Input";
import { Search } from "react-feather";

const Header = () => {

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const themeSettings = useSelector((state: any) => state.theme.themeSettings);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ patients: any[], doctors: any[], appointments: any[] }>({ patients: [], doctors: [], appointments: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim() === "") {
        setSearchResults({ patients: [], doctors: [], appointments: [] });
        setShowDropdown(false);
        return;
      }
      setIsSearching(true);
      try {
        const data = await apiGet<{ patients: any[], doctors: any[], appointments: any[] }>(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(data);
        setShowDropdown(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const [user, setUser] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/c/${user?.clinic?.username || 'clinic'}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = all_routes.login;
  };
  const [isHiddenLayoutActive, setIsHiddenLayoutActive] = useState(() => {
    const saved = localStorage.getItem("hiddenLayoutActive");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    const htmlElement: any = document.documentElement;
    Object.entries(themeSettings).forEach(([key, value]) => {
      htmlElement.setAttribute(key, value);
    });
  }, [themeSettings]);

  const handleUpdateTheme = (key: string, value: string) => {
    if (themeSettings["dir"] === "rtl" && key !== "dir") {
      dispatch(updateTheme({ dir: "ltr" }));
    }
    dispatch(updateTheme({ [key]: value }));
  };

  const mobileSidebar = useSelector(
    (state: any) => state.sidebarSlice.mobileSidebar
  );

  const toggleMobileSidebar = () => {
    dispatch(setMobileSidebar(!mobileSidebar));
  };

  const handleToggleHiddenLayout = () => {
    // Only apply this functionality when layout is "hidden"
    if (themeSettings["data-layout"] === "hidden") {
      const newState = !isHiddenLayoutActive;
      setIsHiddenLayoutActive(newState);
      localStorage.setItem("hiddenLayoutActive", JSON.stringify(newState));
    }
  };

  // Sync body class with hidden layout state
  useEffect(() => {
    const bodyElement = document.body;
    if (themeSettings["data-layout"] === "hidden") {
      if (isHiddenLayoutActive) {
        bodyElement.classList.add("hidden-layout");
      } else {
        bodyElement.classList.remove("hidden-layout");
      }
    } else {
      bodyElement.classList.remove("hidden-layout");
      setIsHiddenLayoutActive(false);
      localStorage.removeItem("hiddenLayoutActive");
    }
  }, [isHiddenLayoutActive, themeSettings["data-layout"]]);

  return (
    <>
      {/* Topbar Start */}
      <header className="navbar-header">
        <div className="page-container topbar-menu">
          <div className="d-flex align-items-center gap-2">
            {/* Logo */}
            <Link to={all_routes.dashboard} className="logo">
              {/* Logo Normal */}
              <span className="logo-light">
                <span className="logo-lg">
                  <ImageWithBasePath src="docyari-logo.svg" alt="logo" style={{ width: '165px', height: '165px', marginTop: '-65px', marginBottom: '-65px', marginLeft: '-15px' }} />
                </span>
                <span className="logo-sm">
                  <ImageWithBasePath
                    src="docyari-logo.svg"
                    alt="small logo"
                    style={{ width: '60px', height: 'auto', marginLeft: '-10px' }}
                  />
                </span>
              </span>
              {/* Logo Dark */}
              <span className="logo-dark">
                <span className="logo-lg">
                  <ImageWithBasePath
                    src="docyari-logo.svg"
                    alt="dark logo"
                    style={{ width: '165px', height: '165px', marginTop: '-65px', marginBottom: '-65px', marginLeft: '-15px' }}
                  />
                </span>
                <span className="logo-sm">
                  <ImageWithBasePath
                    src="docyari-logo.svg"
                    alt="small logo"
                    style={{ width: '60px', height: 'auto', marginLeft: '-10px' }}
                  />
                </span>
              </span>
            </Link>
            {/* Sidebar Mobile Button */}
            <Link
              id="mobile_btn"
              className="mobile-btn"
              to="#"
              onClick={toggleMobileSidebar}
            >
              <i className="ti ti-menu-deep fs-24" />
            </Link>
            <button
              className="sidenav-toggle-btn btn border-0 p-0 active"
              id="toggle_btn2"
              onClick={handleToggleHiddenLayout}
            >
              <i className="ti ti-arrow-right" />
            </button>
            {/* Search */}
            <div className="me-auto d-flex align-items-center header-search d-lg-flex d-none me-3" ref={searchRef} style={{ position: 'relative' }}>
              <div className="me-2" style={{ width: '240px', transition: 'width 0.3s ease-in-out' }}>
                <Input
                  className="mb-0 navbar-search"
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { if (searchQuery.trim() !== "") setShowDropdown(true); }}
                  leftAddon={<Search size={16} strokeWidth={2.5} color="#64748b" />}
                  rightIcon={
                    <span className="text-dark shadow-sm fs-12 fw-bold d-inline-flex px-1 bg-light rounded border align-items-center justify-content-center" style={{ height: '22px' }}>
                      <i className="ti ti-command me-1" /> K
                    </span>
                  }
                />
              </div>

              {/* Dropdown */}
              {showDropdown && (
                <div className="position-absolute bg-white border rounded shadow-sm" style={{ top: '100%', left: 0, width: '300px', zIndex: 1000, maxHeight: '400px', overflowY: 'auto' }}>
                  {isSearching ? (
                    <div className="p-3 text-center text-muted">Searching...</div>
                  ) : (
                    <>
                      {searchResults.patients.length > 0 && (
                        <div className="p-2 border-bottom">
                          <h6 className="fs-12 text-muted mb-2 text-uppercase">Patients</h6>
                          {searchResults.patients.map(p => (
                            <div key={p.id} className="dropdown-item d-flex align-items-center p-2 hover-bg-light rounded" style={{ cursor: "pointer" }} onClick={() => { setShowDropdown(false); navigate(all_routes.patientDetails.replace(":id", p.id)); }}>
                              <div className="ms-2">
                                <div className="fw-semibold text-dark">{p.firstName} {p.lastName}</div>
                                <div className="fs-12 text-muted">{p.patientCode}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {searchResults.doctors.length > 0 && (
                        <div className="p-2 border-bottom">
                          <h6 className="fs-12 text-muted mb-2 text-uppercase">Doctors</h6>
                          {searchResults.doctors.map(d => (
                            <div key={d.id} className="dropdown-item d-flex align-items-center p-2 hover-bg-light rounded" style={{ cursor: "pointer" }} onClick={() => { setShowDropdown(false); navigate(all_routes.doctorsDetails.replace(":id", d.id)); }}>
                              <div className="ms-2">
                                <div className="fw-semibold text-dark">{d.fullName}</div>
                                <div className="fs-12 text-muted">{d.doctorCode}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {searchResults.appointments.length > 0 && (
                        <div className="p-2">
                          <h6 className="fs-12 text-muted mb-2 text-uppercase">Appointments</h6>
                          {searchResults.appointments.map(a => (
                            <div key={a.id} className="dropdown-item d-flex align-items-center p-2 hover-bg-light rounded" style={{ cursor: "pointer" }} onClick={() => {
                              setShowDropdown(false);
                              if (user?.role === "DOCTOR") {
                                navigate(all_routes.doctorsappointmentdetails.replace(":id", a.id));
                              } else if (user?.role === "PATIENT") {
                                navigate(all_routes.patientappointmentdetails?.replace(":id", a.id) || all_routes.patientappointments);
                              } else {
                                navigate(all_routes.appointmentDetails.replace(":id", a.id));
                              }
                            }}>
                              <div className="ms-2">
                                <div className="fw-semibold text-dark">{a.patient?.firstName} {a.patient?.lastName}</div>
                                <div className="fs-12 text-muted">{a.appointmentCode} • {new Date(a.scheduledAt).toLocaleDateString()}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {searchResults.patients.length === 0 && searchResults.doctors.length === 0 && searchResults.appointments.length === 0 && (
                        <div className="p-3 text-center text-muted">No results found</div>
                      )}
                    </>
                  )}
                </div>
              )}
              {/* Copy URL */}
              {user?.clinic?.id && user?.role !== 'PATIENT' && (
                <div
                  className="ms-2 d-flex align-items-center bg-white border rounded px-2 px-xl-3 text-nowrap shadow-sm flex-shrink-0"
                  style={{ height: '38px' }}
                  title={copied ? "Copied!" : "Copy Link"}
                >
                  <span className="fw-semibold text-primary fs-13 user-select-all d-none d-xl-inline">
                    {window.location.host}/c/{user.clinic.username || 'clinic'}
                  </span>
                  <button
                    className="btn btn-sm btn-icon border-0 p-0 text-muted ms-xl-2"
                    onClick={handleCopyLink}
                  >
                    <i className={copied ? "ti ti-check text-success fs-15" : "ti ti-copy fs-15 hover-primary"} />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="d-flex align-items-center">
            {/* Search for Mobile */}
            <div className="header-item d-flex d-lg-none me-2">
              <button
                className="topbar-link btn btn-icon"
                data-bs-toggle="modal"
                data-bs-target="#searchModal"
                type="button"
              >
                <i className="ti ti-search fs-16" />
              </button>
            </div>
            {/* Trial Countdown */}
            <TrialCountdown />

            {/* AI Assistance and Premium Plan removed as requested */}

            {/* Live Website */}
            {user?.clinic?.id && user?.role !== 'PATIENT' && (
              <div className="header-item">
                <div className="dropdown me-2">
                  <a
                    href={`/c/${user.clinic.username || 'clinic'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="d-flex align-items-center text-nowrap"
                    style={{ textDecoration: 'none' }}
                  >
                    <Button variant="primary" icon={<i className="ti ti-world" />} className="text-nowrap">
                      <span className="d-none d-md-inline fw-medium fs-14 text-nowrap">Live Website</span>
                    </Button>
                  </a>
                </div>
              </div>
            )}

            {/* Appointment */}
            {/* Settings */}
            <div className="header-item">
              <div className="dropdown me-2">
                <Link to={all_routes.profilesettings} className="btn topbar-link">
                  <i className="ti ti-settings-2" />
                </Link>
              </div>
            </div>
            {/* Settings */}
            {/* Light/Dark Mode Button */}
            <div className="header-item d-none d-sm-flex me-2">
              <Link
                to="#"
                id="dark-mode-toggle"
                className={`topbar-link btn btn-icon topbar-link header-togglebtn ${themeSettings["data-bs-theme"] === "dark" ? "activate" : ""
                  }`}
                onClick={() => handleUpdateTheme("data-bs-theme", "light")}
              >
                <i className="ti ti-sun fs-16" />
              </Link>
              {/* Light Mode Toggle */}
              <Link
                to="#"
                id="light-mode-toggle"
                className={`topbar-link btn btn-icon topbar-link header-togglebtn ${themeSettings["data-bs-theme"] === "light" ? "activate" : ""
                  }`}
                onClick={() => handleUpdateTheme("data-bs-theme", "dark")}
              >
                <i className="ti ti-moon fs-16" />
              </Link>
            </div>
            {/* Notification Dropdown */}
            <div className="header-item">
              <div className="dropdown me-3">
                <button
                  className="topbar-link btn btn-icon topbar-link dropdown-toggle drop-arrow-none"
                  data-bs-toggle="dropdown"
                  data-bs-offset="0,24"
                  type="button"
                  aria-haspopup="false"
                  aria-expanded="false"
                >
                  <i className="ti ti-bell-check fs-16 animate-ring" />
                  {unreadCount > 0 && <span className="notification-badge" />}
                </button>
                <div
                  className="dropdown-menu p-0 dropdown-menu-end dropdown-menu-lg"
                  style={{ minHeight: 300 }}
                >
                  <div className="p-2 border-bottom">
                    <div className="row align-items-center">
                      <div className="col">
                        <h6 className="m-0 fs-16 fw-semibold">Notifications</h6>
                      </div>
                      {unreadCount > 0 && (
                        <div className="col-auto">
                          <button onClick={markAllAsRead} className="btn btn-sm btn-link p-0 text-primary">
                            Mark all as read
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Notification Body */}
                  <div
                    className="notification-body position-relative z-2 rounded-0 overflow-auto"
                    data-simplebar=""
                    style={{ maxHeight: '350px' }}
                  >
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-muted">
                        <p className="mb-0">No notifications yet.</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`dropdown-item notification-item py-3 text-wrap border-bottom ${!notification.isRead ? 'bg-light' : ''}`}
                        >
                          <div className="d-flex">
                            <div className="me-2 position-relative flex-shrink-0">
                              <span className="avatar avatar-md rounded-circle bg-primary text-white d-flex align-items-center justify-content-center">
                                <i className={`ti ${notification.type === 'INVOICE' ? 'ti-file-invoice' : notification.type === 'APPOINTMENT' ? 'ti-calendar' : notification.type === 'DOCTOR_ADDED' ? 'ti-user-plus' : 'ti-bell'}`} />
                              </span>
                            </div>
                            <div className="flex-grow-1">
                              <p className="mb-0 fw-medium text-dark">{notification.title}</p>
                              <p className="mb-1 text-wrap">{notification.message}</p>
                              <div className="d-flex justify-content-between align-items-center">
                                <span className="fs-12">
                                  <i className="ti ti-clock me-1" />
                                  {moment(notification.createdAt).fromNow()}
                                </span>
                                <div className="notification-action d-flex align-items-center float-end gap-2">
                                  {!notification.isRead && (
                                    <button
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); markAsRead(notification.id); }}
                                      className="btn btn-sm btn-icon rounded-circle bg-primary text-white"
                                      data-bs-toggle="tooltip"
                                      title="Mark as Read"
                                      aria-label="Mark as Read"
                                    >
                                      <i className="ti ti-check" />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteNotification(notification.id); }}
                                    className="btn btn-sm btn-icon rounded-circle bg-light text-danger p-0"
                                    data-bs-toggle="tooltip"
                                    title="Delete"
                                  >
                                    <i className="ti ti-trash" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {/* View All*/}
                  <div className="p-2 rounded-bottom border-top text-center">
                    <Link
                      to={all_routes.notifications || "#"}
                      className="text-center text-decoration-underline fs-14 mb-0"
                    >
                      View All Notifications
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            {/* User Dropdown */}
            <div className="dropdown profile-dropdown d-flex align-items-center justify-content-center">
              <Link
                to="#"
                className="topbar-link dropdown-toggle drop-arrow-none position-relative"
                data-bs-toggle="dropdown"
                data-bs-offset="0,22"
                aria-haspopup="false"
                aria-expanded="false"
              >
                <ImageWithBasePath
                  src="assets/img/users/user-01.jpg"
                  width={32}
                  className="rounded-circle d-flex"
                  alt="user-image"
                />
                <span className="online text-success">
                  <i className="ti ti-circle-filled d-flex bg-white rounded-circle border border-1 border-white" />
                </span>
              </Link>
              <div className="dropdown-menu dropdown-menu-end dropdown-menu-md p-2 border border-primary shadow-lg">
                <style>{`
                  .profile-dropdown .dropdown-item:not(.text-danger) {
                    color: #000000 !important;
                    font-weight: 550 !important;
                  }
                  .profile-dropdown .dropdown-item:hover:not(.text-danger) {
                    color: #2e37a4 !important;
                    background-color: rgba(46, 55, 164, 0.06) !important;
                  }
                `}</style>
                <div className="d-flex align-items-center bg-light rounded-3 p-2 mb-2">
                  <ImageWithBasePath
                    src="assets/img/users/user-01.jpg"
                    className="rounded-circle"
                    width={42}
                    height={42}
                    alt=""
                  />
                  <div className="ms-2 text-truncate" style={{ maxWidth: '150px' }}>
                    <p className="fw-medium text-dark mb-0 text-truncate">{user?.fullName || "Admin"}</p>
                    <span className="d-block fs-13 text-muted">{user?.role?.replace('_', ' ')?.toLowerCase() || "Administrator"}</span>
                  </div>
                </div>
                {/* Item*/}
                <Link to={all_routes.profilesettings} className="dropdown-item">
                  <i className="ti ti-user-circle me-1 align-middle" />
                  <span className="align-middle">Profile Settings</span>
                </Link>
                {/* Item*/}
                <Link to={all_routes.profilesettings} className="dropdown-item">
                  <i className="ti ti-settings me-1 align-middle" />
                  <span className="align-middle">Account Settings</span>
                </Link>
                {/* Landing Page Settings */}
                {user?.role !== 'PATIENT' && (
                  <Link to={all_routes.organizationsettings} className="dropdown-item">
                    <i className="ti ti-browser-check me-1 align-middle" />
                    <span className="align-middle">Landing Page Settings</span>
                  </Link>
                )}
                {/* Theme Customizer Trigger */}
                <Link
                  to="#"
                  className="dropdown-item"
                  data-bs-toggle="offcanvas"
                  data-bs-target="#theme-setting"
                >
                  <i className="ti ti-color-swatch me-1 align-middle" />
                  <span className="align-middle">Theme Customizer</span>
                </Link>
                {/* Item*/}
                <div className="pt-2 mt-2 border-top">
                  <Link to="#" onClick={handleLogout} className="dropdown-item text-danger">
                    <i className="ti ti-logout me-1 fs-17 align-middle" />
                    <span className="align-middle">Log Out</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      {/* Topbar End */}
      {/* Search Modal */}
      <div className="modal fade" id="searchModal">
        <div className="modal-dialog modal-lg">
          <div className="modal-content bg-transparent">
            <div className="card shadow-none mb-0">
              <div
                className="px-3 py-2 d-flex flex-row align-items-center"
                id="search-top"
              >
                <i className="ti ti-search fs-22" />
                <input
                  type="search"
                  className="form-control border-0"
                  placeholder="Search"
                />
                <button
                  type="button"
                  className="btn p-0"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <i className="ti ti-x fs-22" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
