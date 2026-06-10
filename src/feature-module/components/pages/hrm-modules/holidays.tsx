import { useMemo, useState } from "react";
import EmptyState from "../../../../core/common/emptyState";
import { Link } from "react-router";
import Datatable from "../../../../core/common/dataTable";
import HolidaysModal from "./modal/holidaysModal";
import { useHolidays } from "../../../../core/hooks/useHolidays";
import { Calendar, DatePicker } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(isBetween);

const HolidaysList = () => {
  const { holidays, refetch, loading, error } = useHolidays();
  const [selectedHoliday, setSelectedHoliday] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterDatePreset, setFilterDatePreset] = useState("All");
  const [customRange, setCustomRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [viewHoliday, setViewHoliday] = useState<any>(null);

  const clearFilters = () => {
    setFilterDatePreset("All");
    setCustomRange([null, null]);
  };

  const filteredData = useMemo(() => {
    return holidays.filter((h) => {
      if (filterDatePreset === "All") return true;

      const hDate = dayjs(h.date);
      const hEnd = h.endDate ? dayjs(h.endDate) : hDate;

      let matchDate = false;
      const today = dayjs();

      if (filterDatePreset === "Today") {
        matchDate = today.isBetween(hDate.startOf("day"), hEnd.endOf("day"), "day", "[]");
      } else if (filterDatePreset === "This Week") {
        const startOfWeek = today.startOf("week");
        const endOfWeek = today.endOf("week");
        // Check if holiday overlaps with this week
        matchDate = (hDate.isSameOrBefore(endOfWeek) && hEnd.isSameOrAfter(startOfWeek));
      } else if (filterDatePreset === "This Month") {
        const startOfMonth = today.startOf("month");
        const endOfMonth = today.endOf("month");
        matchDate = (hDate.isSameOrBefore(endOfMonth) && hEnd.isSameOrAfter(startOfMonth));
      } else if (filterDatePreset === "This Year") {
        const startOfYear = today.startOf("year");
        const endOfYear = today.endOf("year");
        matchDate = (hDate.isSameOrBefore(endOfYear) && hEnd.isSameOrAfter(startOfYear));
      } else if (filterDatePreset === "Custom") {
        if (customRange[0] && customRange[1]) {
          matchDate = (hDate.isSameOrBefore(customRange[1].endOf("day")) && hEnd.isSameOrAfter(customRange[0].startOf("day")));
        }
      }

      return matchDate;
    });
  }, [holidays, filterDatePreset, customRange]);

  const data = filteredData.map((holiday, index) => {
    const start = new Date(holiday.date);
    const end = holiday.endDate ? new Date(holiday.endDate) : start;

    const startStr = start.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const endStr = end.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return {
      key: holiday.id,
      id: holiday.id,
      S_No: index + 1,
      Name: holiday.title,
      Date:
        startStr === endStr
          ? startStr
          : `${startStr} - ${endStr}`,
      Days:
        diffDays > 1
          ? `${diffDays} Days`
          : "1 Day",
      raw: holiday,
    };
  });

  const columns = [
    {
      title: "S.No",
      dataIndex: "S_No",
      render: (text: number) => (
        <span className="text-dark fw-medium">{text}</span>
      ),
      sorter: (a: any, b: any) => a.S_No - b.S_No,
      width: 60,
    },
    {
      title: "Name",
      dataIndex: "Name",
      render: (text: string) => (
        <span className="text-dark fw-medium">{text}</span>
      ),
      sorter: (a: any, b: any) => a.Name.localeCompare(b.Name),
    },
    {
      title: "Date",
      dataIndex: "Date",
      render: (text: string) => <span className="text-dark">{text}</span>,
      sorter: (a: any, b: any) =>
        new Date(a.raw.date).getTime() - new Date(b.raw.date).getTime(),
    },
    {
      title: "Days",
      dataIndex: "Days",
      render: (text: string) => <span className="text-dark">{text}</span>,
      sorter: (a: any, b: any) => a.Days.localeCompare(b.Days),
    },
    {
      title: "Action",
      align: "center" as const,
      render: (_: string, record: any) => (
        <div className="d-flex align-items-center justify-content-center gap-2">
          {/* View Icon */}
          <button
            className="bg-transparent border-0 text-info p-1"
            title="View Details"
            data-bs-toggle="modal"
            data-bs-target="#view_holiday"
            onClick={() => setViewHoliday(record.raw)}
          >
            <i className="ti ti-eye fs-18"></i>
          </button>

          {/* Edit Icon */}
          <button
            className="bg-transparent border-0 text-primary p-1"
            title="Edit"
            data-bs-toggle="modal"
            data-bs-target="#edit_holiday"
            onClick={() => setSelectedHoliday(record.raw)}
          >
            <i className="ti ti-edit fs-18"></i>
          </button>

          {/* Delete Icon */}
          <button
            className="bg-transparent border-0 text-danger p-1"
            title="Delete"
            data-bs-toggle="modal"
            data-bs-target="#delete_holiday"
            onClick={() => setSelectedHoliday(record.raw)}
          >
            <i className="ti ti-trash fs-18"></i>
          </button>
        </div>
      ),
      width: 100,
    },
  ];

  const cellRender = (current: Dayjs, info: any) => {
    if (info.type === "month") return null;

    const isHoliday = holidays.find((h) => {
      const start = dayjs(h.date).startOf("day");
      const end = h.endDate ? dayjs(h.endDate).endOf("day") : start.endOf("day");
      return (
        current.isSameOrAfter(start) && current.isSameOrBefore(end)
      );
    });

    const isOffDay = current.day() === 0;

    let dotClass = "";

    if (isHoliday) dotClass = "bg-primary";
    else if (isOffDay) dotClass = "bg-danger";
    else dotClass = "bg-success";

    return (
      <div className="d-flex align-items-center justify-content-center w-100 mt-1">
        <div
          className={`rounded-circle ${dotClass}`}
          style={{ width: "6px", height: "6px" }}
        ></div>
      </div>
    );
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Page Header */}
          <div className="page-header d-flex align-items-sm-center flex-sm-row flex-column gap-2 border-bottom pb-3 mb-3">
            <div className="flex-grow-1">
              <h4 className="page-title fw-bold mb-0 d-flex align-items-center">
                Holidays
                <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                  Total : {loading ? "" : filteredData.length}
                </span>
              </h4>
            </div>

            {/* Filter and Action Buttons */}
            <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">
              {/* Clear Filter Button */}
              <button
                type="button"
                className="btn btn-white d-flex align-items-center gap-1 text-danger border"
                onClick={clearFilters}
                style={{
                  minHeight: "38px",
                  fontWeight: "700",
                  fontSize: "13px",
                  borderRadius: "6px"
                }}
              >
                <i className="ti ti-rotate"></i> Clear All
              </button>

              {/* Advanced Date Filter */}
              <div className="dropdown">
                <Link
                  to="#"
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap"
                  style={{ minWidth: "160px", minHeight: "38px" }}
                  data-bs-toggle="dropdown"
                >
                  <span className="text-truncate">
                    <span className="text-muted"><i className="ti ti-calendar me-1"></i></span> {filterDatePreset === "All" ? "Filter Date" : filterDatePreset}
                  </span>
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2" style={{ minWidth: "200px" }}>
                  {["All", "Today", "This Week", "This Month", "This Year", "Custom"].map((preset) => (
                    <li key={preset}>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          setFilterDatePreset(preset);
                        }}
                      >
                        {preset}
                      </Link>
                    </li>
                  ))}
                  {filterDatePreset === "Custom" && (
                    <li className="p-2 border-top mt-2">
                      <DatePicker.RangePicker
                        format="DD-MM-YYYY"
                        className="w-100"
                        value={customRange}
                        onChange={(dates) => setCustomRange(dates ? [dates[0], dates[1]] : [null, null])}
                      />
                    </li>
                  )}
                </ul>
              </div>

              {/* Calendar View Dropdown */}
              <div className="dropdown">
                <Link
                  to="#"
                  className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap"
                  style={{ minWidth: "150px", minHeight: "38px" }}
                  data-bs-toggle="dropdown"
                  data-bs-auto-close="outside"
                >
                  <span className="text-truncate">
                    <i className="ti ti-calendar me-1" /> Calendar View
                  </span>
                </Link>
                <div
                  className="dropdown-menu dropdown-menu-end p-3 shadow"
                  style={{ minWidth: "350px" }}
                >
                  <Calendar fullscreen={false} cellRender={cellRender} />
                  <div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top row-gap-1 flex-wrap">
                    <span className="badge badge-soft-primary border border-primary fs-10">
                      Holiday
                    </span>
                    <span className="badge badge-soft-danger border border-danger fs-10">
                      Off Day
                    </span>
                    <span className="badge badge-soft-success border border-success fs-10">
                      Working
                    </span>
                  </div>
                </div>
              </div>

              {/* Add Holiday Button */}
              <button
                className="btn btn-primary d-flex align-items-center justify-content-center"
                style={{ minHeight: "38px", whiteSpace: "nowrap" }}
                data-bs-toggle="modal"
                data-bs-target="#add_holiday"
                onClick={() => setSelectedHoliday(null)}
              >
                Add Holiday <i className="fa fa-plus ms-2" />
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger d-flex align-items-center justify-content-between mb-3">
              <span>{error}</span>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => refetch()}
              >
                Retry
              </button>
            </div>
          )}

          {/* Table or Empty State */}
          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" role="status" />
              <p className="text-muted mt-2 mb-0">Loading holidays</p>
            </div>
          ) : holidays.length === 0 && !error ? (
            <div className="border rounded bg-white">
              <EmptyState
                title="No holidays yet"
                message="Plan your clinic's annual calendar by adding holidays. Employees will be informed of upcoming time off."
                action={
                  <button
                    className="btn btn-primary"
                    data-bs-toggle="modal"
                    data-bs-target="#add_holiday"
                    onClick={() => setSelectedHoliday(null)}
                  >
                    Add Holiday <i className="ti ti-plus ms-2" />
                  </button>
                }
              />
            </div>
          ) : (
            <div className="table-responsive">
              <Datatable
                columns={columns}
                dataSource={data}
                Selection={true}
                searchText=""
                onSelectionChange={(keys) => setSelectedIds(keys as string[])}
              />
            </div>
          )}

          {/* Delete Selected Bar */}
          {selectedIds.length > 0 && (
            <div className="d-flex justify-content-center pt-4 pb-4 sticky-delete-bar">
              <button
                className="btn btn-danger d-flex align-items-center gap-2 px-4 py-2 shadow"
                data-bs-toggle="modal"
                data-bs-target="#delete_holiday"
                style={{
                  borderRadius: "8px",
                  minHeight: "42px",
                  fontWeight: "bold",
                }}
              >
                <i className="ti ti-trash fs-18"></i>
                Delete Selected ({selectedIds.length})
              </button>
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

      <HolidaysModal
        selectedHoliday={selectedHoliday}
        refetch={refetch}
      />

      {/* ===== VIEW HOLIDAY MODAL ===== */}
      <div id="view_holiday" className="modal fade" role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div
            className="modal-content border-0 shadow-lg"
            style={{ borderRadius: "12px", overflow: "hidden" }}
          >
            <div className="modal-header bg-info text-white">
              <h5 className="modal-title fw-bold">Holiday Details</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                onClick={() => setViewHoliday(null)}
              ></button>
            </div>
            <div className="modal-body">
              {viewHoliday && (
                <div className="row g-3">
                  <div className="col-md-12">
                    <label className="form-label fw-bold small text-uppercase text-muted">
                      Holiday Name
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={viewHoliday.title || ""}
                      readOnly
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-muted">
                      Start Date
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={new Date(
                        viewHoliday.date
                      ).toLocaleDateString("en-GB")}
                      readOnly
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-uppercase text-muted">
                      End Date
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={
                        viewHoliday.endDate
                          ? new Date(viewHoliday.endDate).toLocaleDateString(
                            "en-GB"
                          )
                          : "--"
                      }
                      readOnly
                    />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label fw-bold small text-uppercase text-muted">
                      Description
                    </label>
                    <textarea
                      className="form-control bg-light"
                      rows={3}
                      value={viewHoliday.description || "No description provided"}
                      readOnly
                    />
                  </div>
                  <div className="col-md-12">
                    <div className="p-3 bg-light rounded text-center fw-bold text-primary shadow-sm border">
                      {(() => {
                        const start = new Date(viewHoliday.date);
                        const end = viewHoliday.endDate
                          ? new Date(viewHoliday.endDate)
                          : start;
                        const diff =
                          Math.ceil(
                            Math.abs(end.getTime() - start.getTime()) /
                            (1000 * 60 * 60 * 24)
                          ) + 1;
                        return diff > 1
                          ? `${diff} Days Duration`
                          : `${viewHoliday.dayName || "Single Day"}`;
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer border-top pt-3">
              <button
                type="button"
                className="btn btn-primary px-5"
                data-bs-dismiss="modal"
                onClick={() => setViewHoliday(null)}
                style={{ borderRadius: "6px" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HolidaysList;