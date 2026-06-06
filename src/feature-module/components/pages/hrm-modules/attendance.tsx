import { useState } from "react";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import { Link } from "react-router";
import SearchInput from "../../../../core/common/dataTable/dataTableSearch";
import { useAttendance } from "../../../../core/hooks/useAttendance";
import { DatePicker, Dropdown, Menu, Pagination } from "antd";
import dayjs from "dayjs";

const AttendanceList = () => {
  const [searchText, setSearchText] = useState<string>("");
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const month = currentDate.month() + 1; // 1-12
  const year = currentDate.year();
  const daysInMonth = currentDate.daysInMonth();

  const { data, loading, markAttendance } = useAttendance(month, year);

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const daysArray = Array.from({ length: daysInMonth }, (_, k) => k + 1);

  const getStatusIcon = (status: string) => {
    if (status === "PRESENT") return <span className="text-success"><i className="ti ti-square-filled fs-14" /></span>;
    if (status === "ABSENT") return <span className="text-danger"><i className="ti ti-square-filled fs-14" /></span>;
    if (status === "HALF_DAY") return <span className="text-warning"><i className="ti ti-square-filled fs-14" /></span>;
    if (status === "HOLIDAY") return <span className="text-info"><i className="ti ti-square-filled fs-14" /></span>;
    if (status === "OFF") return <span className="text-secondary" style={{ opacity: 0.5 }}><i className="ti ti-square-minus-filled fs-14" /></span>;
    if (status === "LEAVE") return <span style={{ color: "#7c3aed" }}><i className="ti ti-square-filled fs-14" /></span>;
    return <span className="text-secondary" style={{ opacity: 0.3 }}><i className="ti ti-square fs-14" /></span>; // Empty box
  };

  const handleMark = async (empId: string, empType: string, day: number, status: string) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    await markAttendance(empId, empType, dateStr, status);
  };

  const buildMenu = (empId: string, empType: string, day: number) => {
    return (
      <Menu
        onClick={(info) => handleMark(empId, empType, day, info.key)}
        items={[
          { key: "PRESENT", label: <><i className="ti ti-square-filled text-success me-1" /> Mark Present</> },
          { key: "ABSENT", label: <><i className="ti ti-square-filled text-danger me-1" /> Mark Absent</> },
          { key: "HALF_DAY", label: <><i className="ti ti-square-filled text-warning me-1" /> Mark Half Day</> },
          { key: "", label: <><i className="ti ti-square text-secondary me-1" /> Clear</> },
        ]}
      />
    );
  };

  const filteredData = data.filter(emp => emp.name.toLowerCase().includes(searchText.toLowerCase()));
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header d-flex align-items-sm-center flex-sm-row flex-column gap-2 border-bottom pb-3 mb-3">
            <div className="flex-grow-1">
              <h4 className="page-title fw-bold mb-0 d-flex align-items-center">
                Attendance
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total: {data.length}
                </span>
              </h4>
            </div>
            <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between" style={{ minWidth: '150px', minHeight: '38px' }} data-bs-toggle="dropdown">
                  <span><i className="ti ti-search me-1" /> {searchText ? searchText : "Search Name"}</span>
                </Link>
                <div className="dropdown-menu dropdown-menu-end p-2" style={{ minWidth: "220px" }} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    className="form-control form-control-sm mb-2"
                    placeholder="Type name here..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                  <ul className="list-unstyled mb-0 overflow-auto" style={{ maxHeight: "200px" }}>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={(e) => { e.preventDefault(); setSearchText(""); document.body.click(); }}>All Names</Link>
                    </li>
                    {data.filter(emp => emp.name.toLowerCase().includes(searchText.toLowerCase())).map(emp => (
                      <li key={emp.id}>
                        <Link to="#" className="dropdown-item rounded-1" onClick={(e) => { e.preventDefault(); setSearchText(emp.name); document.body.click(); }}>{emp.name}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between" style={{ width: '120px', minHeight: '38px' }} data-bs-toggle="dropdown">
                  <span><span className="text-muted">Type:</span> All</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1">All</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Doctor</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Staff</Link></li>
                </ul>
              </div>

              <div className="dropdown">
                <Link to="#" className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between" style={{ width: '160px', minHeight: '38px' }} data-bs-toggle="dropdown">
                  <span><span className="text-muted">Department:</span> All</span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1">All</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Cardiology</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Orthopedics</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="d-flex align-items-center justify-content-between flex-wrap">
            <div className="search-set mb-3">
              <div className="d-flex align-items-center">

                <div className="d-flex right-content align-items-center flex-wrap">
                  <DatePicker
                    picker="month"
                    value={currentDate}
                    onChange={(d) => d && setCurrentDate(d)}
                    allowClear={false}
                  />
                </div>
              </div>
            </div>
            <div className="d-flex table-dropdown mb-3 right-content align-items-center flex-wrap row-gap-3">
              <span className="badge badge-sm badge-soft-success border border-success fw-medium me-2">Present</span>
              <span className="badge badge-sm badge-soft-danger border border-danger fw-medium me-2">Absent</span>
              <span className="badge badge-sm badge-soft-warning border border-warning fw-medium me-2">Half Day</span>
              <span className="badge badge-sm badge-soft-info border border-info fw-medium me-2">Holiday</span>
              <span className="badge badge-sm fw-medium" style={{ background: "#ede9fe", color: "#7c3aed", border: "1px solid #7c3aed" }}>Leave</span>
            </div>
          </div>
          <div className="table-responsive">
            {loading ? (
              <div className="text-center p-5">Loading attendance...</div>
            ) : (
              <table className="table table-nowrap datatable">
                <thead className="thead-light">
                  <tr>
                    <th>Staff</th>
                    <th>Working</th>
                    <th>Present</th>
                    <th>%</th>
                    {daysArray.map((d) => (
                      <th key={d}>{String(d).padStart(2, '0')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((emp) => (
                    <tr key={emp.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <Link to="#" className="avatar me-2">
                            <ImageWithBasePath
                              src={emp.img?.startsWith('/') ? emp.img : `assets/img/users/${emp.img}`}
                              alt="User"
                              className="rounded-circle"
                            />
                          </Link>
                          <div>
                            <h6 className="mb-0 fs-14 fw-semibold">
                              <Link to="#">{emp.name}</Link>
                            </h6>
                            <span className="fs-12 text-muted">{emp.type}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-soft-primary border border-primary fw-medium">{emp.totalWorkingDays}</span>
                      </td>
                      <td>
                        <span className="badge badge-soft-success border border-success fw-medium">{emp.presentDays}</span>
                      </td>
                      <td>
                        <span className={`badge border fw-medium ${parseInt(emp.percentage) < 50
                          ? "badge-soft-danger border-danger"
                          : parseInt(emp.percentage) < 80
                            ? "badge-soft-warning border-warning"
                            : "badge-soft-success border-success"
                          }`}>
                          {emp.percentage}
                        </span>
                      </td>
                      {daysArray.map((day) => {
                        const status = emp.attendance[day] || "";
                        if (status === "HOLIDAY" || status === "OFF") {
                          return (
                            <td key={day}>
                              {getStatusIcon(status)}
                            </td>
                          );
                        }
                        return (
                          <td key={day}>
                            <Dropdown
                              overlay={buildMenu(emp.id, emp.type, day)}
                              trigger={["click"]}
                              placement="bottom"
                            >
                              <div style={{ cursor: "pointer", display: "inline-block" }}>
                                {getStatusIcon(status)}
                              </div>
                            </Dropdown>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="d-flex justify-content-end mt-3">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredData.length}
              onChange={(page, size) => { setCurrentPage(page); setPageSize(size); }}
              showSizeChanger
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default AttendanceList;
