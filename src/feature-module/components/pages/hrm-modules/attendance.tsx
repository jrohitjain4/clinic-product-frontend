import { useState } from "react";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import { Link } from "react-router";
import SearchInput from "../../../../core/common/dataTable/dataTableSearch";
import { useAttendance } from "../../../../core/hooks/useAttendance";
import { DatePicker, Dropdown, Menu } from "antd";
import dayjs from "dayjs";

const AttendanceList = () => {
  const [searchText, setSearchText] = useState<string>("");
  const [currentDate, setCurrentDate] = useState(dayjs());

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

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="mb-3 pb-3 border-bottom">
            <h4 className="fw-bold mb-0">Attendance</h4>
          </div>
          <div className="d-flex align-items-center justify-content-between flex-wrap">
            <div className="search-set mb-3">
              <div className="d-flex align-items-center">
                <div className="table-search d-flex align-items-center mb-0 me-2">
                  <div className="search-input">
                    <SearchInput value={searchText} onChange={handleSearch} />
                  </div>
                </div>
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
                    <th>%</th>
                    {daysArray.map((d) => (
                      <th key={d}>{String(d).padStart(2, '0')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((emp) => (
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
                        if (status === "HOLIDAY") {
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
        </div>
      </div>
    </>
  );
};

export default AttendanceList;
