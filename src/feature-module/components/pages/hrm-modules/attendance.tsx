import { useMemo, useState } from "react";
import EmptyState from "../../../../core/common/emptyState";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import { Link } from "react-router";
import { useAttendance } from "../../../../core/hooks/useAttendance";
import { DatePicker, Dropdown, Menu, Pagination } from "antd";
import dayjs from "dayjs";

const AttendanceList = () => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [filterType, setFilterType] = useState("All");
  const [filterDept, setFilterDept] = useState("All");

  const month = currentDate.month() + 1;
  const year = currentDate.year();
  const daysInMonth = currentDate.daysInMonth();

  const { data, loading, error, markAttendance, refetch } = useAttendance(month, year);

  const daysArray = Array.from({ length: daysInMonth }, (_, k) => k + 1);

  const getStatusIcon = (status: string) => {
    if (status === "PRESENT")
      return (
        <span className="text-success" title="Present">
          <i className="ti ti-square-filled fs-14"></i>
        </span>
      );
    if (status === "ABSENT")
      return (
        <span className="text-danger" title="Absent">
          <i className="ti ti-square-filled fs-14"></i>
        </span>
      );
    if (status === "HALF_DAY")
      return (
        <span className="text-warning" title="Half Day">
          <i className="ti ti-square-filled fs-14"></i>
        </span>
      );
    if (status === "HOLIDAY")
      return (
        <span className="text-info" title="Holiday">
          <i className="ti ti-square-filled fs-14"></i>
        </span>
      );
    if (status === "OFF")
      return (
        <span
          className="text-secondary"
          style={{ opacity: 0.5 }}
          title="Off"
        >
          <i className="ti ti-square-minus-filled fs-14"></i>
        </span>
      );
    if (status === "LEAVE")
      return (
        <span
          style={{ color: "#7c3aed" }}
          title="Leave"
        >
          <i className="ti ti-square-filled fs-14"></i>
        </span>
      );
    return (
      <span className="text-secondary" style={{ opacity: 0.3 }} title="Not Marked">
        <i className="ti ti-square fs-14"></i>
      </span>
    );
  };

  const handleMark = async (
    empId: string,
    empType: string,
    day: number,
    status: string
  ) => {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    await markAttendance(empId, empType, dateStr, status);
  };

  const buildMenu = (empId: string, empType: string, day: number) => {
    return (
      <Menu
        onClick={(info) => handleMark(empId, empType, day, info.key)}
        items={[
          {
            key: "PRESENT",
            label: (
              <>
                <i className="ti ti-square-filled text-success me-2"></i>
                Mark Present
              </>
            ),
          },
          {
            key: "ABSENT",
            label: (
              <>
                <i className="ti ti-square-filled text-danger me-2"></i>
                Mark Absent
              </>
            ),
          },
          {
            key: "HALF_DAY",
            label: (
              <>
                <i className="ti ti-square-filled text-warning me-2"></i>
                Mark Half Day
              </>
            ),
          },
          {
            key: "",
            label: (
              <>
                <i className="ti ti-square text-secondary me-2"></i>
                Clear
              </>
            ),
          },
        ]}
      />
    );
  };

  const departments = useMemo(() => {
    const list = Array.from(
      new Set(data.map((emp) => emp.department).filter((d): d is string => Boolean(d)))
    );
    return ["All", ...list];
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((emp) => {
      const matchType = filterType === "All" || emp.type === filterType;
      const matchDept = filterDept === "All" || emp.department === filterDept;

      return matchType && matchDept;
    });
  }, [data, filterType, filterDept]);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Page Header */}
          <div className="page-header d-flex align-items-sm-center flex-sm-row flex-column gap-2 border-bottom pb-3 mb-3">
            <div className="flex-grow-1">
              <h4 className="page-title fw-bold mb-0 d-flex align-items-center">
                Attendance
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total : {loading ? "" : filteredData.length}
                </span>
              </h4>
            </div>

            {/* Filter and Action Buttons */}
            <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
              {/* Type Filter */}
              <div className="dropdown">
                <Link
                  to="#"
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap"
                  style={{ minWidth: "120px", minHeight: "38px" }}
                  data-bs-toggle="dropdown"
                >
                  <span className="text-truncate">
                    <span className="text-muted">Type:</span> {filterType}
                  </span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setFilterType("All");
                      }}
                    >
                      All
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setFilterType("Doctor");
                      }}
                    >
                      Doctor
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="#"
                      className="dropdown-item rounded-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setFilterType("Staff");
                      }}
                    >
                      Staff
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Department Filter */}
              <div className="dropdown">
                <Link
                  to="#"
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap"
                  style={{ minWidth: "160px", minHeight: "38px" }}
                  data-bs-toggle="dropdown"
                >
                  <span className="text-truncate">
                    <span className="text-muted">Dept:</span> {filterDept}
                  </span>
                </Link>
                <ul
                  className="dropdown-menu dropdown-menu-end p-2"
                  style={{ maxHeight: "200px", overflowY: "auto" }}
                >
                  {departments.map((d) => (
                    <li key={d}>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          setFilterDept(d);
                        }}
                      >
                        {d}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Month/Year Picker */}
              <DatePicker
                picker="month"
                value={currentDate}
                onChange={(d) => d && setCurrentDate(d)}
                allowClear={true}
                className="form-select text-dark"
                style={{
                  width: "140px",
                  minHeight: "38px",
                  paddingTop: "7px",
                }}
                format="MMM YYYY"
                suffixIcon={<i className="ti ti-calendar"></i>}
              />
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger d-flex align-items-center justify-content-between mb-3">
              <span>{error}</span>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={refetch}
              >
                Retry
              </button>
            </div>
          )}

          {/* Legend */}
          <div className="d-flex align-items-center justify-content-between flex-wrap mb-3 p-2 bg-light rounded border">
            <div className="d-flex align-items-center flex-wrap gap-2">
              <span className="badge badge-sm badge-soft-success border border-success fw-medium">
                <i className="ti ti-square-filled me-1"></i>Present
              </span>
              <span className="badge badge-sm badge-soft-danger border border-danger fw-medium">
                <i className="ti ti-square-filled me-1"></i>Absent
              </span>
              <span className="badge badge-sm badge-soft-warning border border-warning fw-medium">
                <i className="ti ti-square-filled me-1"></i>Half Day
              </span>
              <span className="badge badge-sm badge-soft-info border border-info fw-medium">
                <i className="ti ti-square-filled me-1"></i>Holiday
              </span>
              <span
                className="badge badge-sm fw-medium"
                style={{
                  background: "#ede9fe",
                  color: "#7c3aed",
                  border: "1px solid #7c3aed",
                }}
              >
                <i className="ti ti-square-filled me-1"></i>Leave
              </span>
            </div>
            <div className="text-muted fs-13">
              Showing {paginatedData.length} of {filteredData.length} records
            </div>
          </div>

          {/* Table or Empty State */}
          <div className="table-responsive border rounded bg-white shadow-sm">
            {loading ? (
              <div className="text-center p-5">
                <span className="spinner-border text-primary me-2" role="status" />
                <span className="text-muted">Loading attendance...</span>
              </div>
            ) : filteredData.length === 0 && !error ? (
              <div className="py-3">
                <EmptyState
                  title="No attendance records found"
                  message="We couldn't find any attendance logs for the selected criteria. Try adjusting your filters or date range."
                />
              </div>
            ) : (
              <table className="table table-nowrap mb-0 attendance-table">
                <thead className="bg-light">
                  <tr>
                    <th
                      className="sticky-col fw-semibold text-dark"
                      style={{
                        position: "sticky",
                        left: 0,
                        backgroundColor: "#f8f9fa",
                        zIndex: 2,
                      }}
                    >
                      Staff
                    </th>
                    <th className="fw-semibold text-dark text-center">
                      Working
                    </th>
                    <th className="fw-semibold text-dark text-center">
                      Present
                    </th>
                    <th className="fw-semibold text-dark text-center">%</th>
                    {daysArray.map((d) => (
                      <th
                        key={d}
                        className="text-center fw-semibold text-dark"
                      >
                        {String(d).padStart(2, "0")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((emp) => (
                    <tr key={emp.id}>
                      <td
                        className="sticky-col"
                        style={{
                          position: "sticky",
                          left: 0,
                          backgroundColor: "#fff",
                          zIndex: 1,
                        }}
                      >
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-sm me-2">
                            <ImageWithBasePath
                              src={
                                emp.img?.startsWith("/")
                                  ? emp.img
                                  : emp.img
                                    ? `assets/img/users/${emp.img}`
                                    : "assets/img/users/avatar-21.jpg"
                              }
                              alt="User"
                              className="rounded-circle"
                            />
                          </div>
                          <div>
                            <h6 className="mb-0 fs-13 fw-semibold text-dark">
                              {emp.name}
                            </h6>
                            <span className="fs-11 text-muted">
                              {emp.type}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="badge badge-soft-primary border border-primary fw-medium">
                          {emp.totalWorkingDays}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="badge badge-soft-success border border-success fw-medium">
                          {emp.presentDays}
                        </span>
                      </td>
                      <td className="text-center">
                        <span
                          className={`badge border fw-medium ${parseInt(emp.percentage) < 50
                              ? "badge-soft-danger border-danger"
                              : parseInt(emp.percentage) < 80
                                ? "badge-soft-warning border-warning"
                                : "badge-soft-success border-success"
                            }`}
                        >
                          {emp.percentage}%
                        </span>
                      </td>
                      {daysArray.map((day) => {
                        const status = emp.attendance[day] || "";
                        if (
                          status === "HOLIDAY" ||
                          status === "OFF" ||
                          status === "LEAVE"
                        ) {
                          return (
                            <td key={day} className="text-center">
                              {getStatusIcon(status)}
                            </td>
                          );
                        }
                        return (
                          <td key={day} className="text-center">
                            <Dropdown
                              overlay={buildMenu(emp.id, emp.type, day)}
                              trigger={["click"]}
                              placement="bottomCenter"
                            >
                              <div
                                style={{
                                  cursor: "pointer",
                                  display: "inline-block",
                                }}
                              >
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

          {/* Pagination */}
          {filteredData.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="text-muted fs-13">
                Page {currentPage} of{" "}
                {Math.ceil(filteredData.length / pageSize)}
              </div>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredData.length}
                onChange={(page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                }}
                showSizeChanger
                size="small"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025
            <Link to="#" className="link-primary">
              Docyari
            </Link>
            , All Rights Reserved
          </p>
        </div>
      </div>

      <style>{`
        .attendance-table th, .attendance-table td {
          padding: 12px 8px;
          vertical-align: middle;
          border-bottom: 1px solid #e9ecef;
        }

        .attendance-table th {
          font-weight: 600;
          background-color: #f8f9fa;
        }

        .attendance-table tbody tr:hover {
          background-color: #f8f9fa;
        }

        .sticky-col {
          box-shadow: 2px 0 5px -2px rgba(0, 0, 0, 0.1);
        }

        .attendance-table td {
          color: #212529;
        }

        .attendance-table .badge {
          font-size: 11px;
          padding: 4px 8px;
        }

        @media (max-width: 768px) {
          .attendance-table th, .attendance-table td {
            padding: 8px 4px;
            font-size: 12px;
          }

          .attendance-table {
            font-size: 12px;
          }
        }
      `}</style>
    </>
  );
};

export default AttendanceList;