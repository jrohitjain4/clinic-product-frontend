import { useState } from "react";
import { Link } from "react-router";
import Datatable from "../../../../core/common/dataTable";
import HolidaysModal from "./modal/holidaysModal";
import { useHolidays } from "../../../../core/hooks/useHolidays";
import { Calendar } from "antd";
import type { Dayjs } from 'dayjs';
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const HolidaysList = () => {
  const { holidays, refetch } = useHolidays();
  const [selectedHoliday, setSelectedHoliday] = useState<any>(null);

  const data = holidays.map((holiday, index) => {
    const start = new Date(holiday.date);
    const end = holiday.endDate ? new Date(holiday.endDate) : start;

    const startStr = start.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const endStr = end.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return {
      key: holiday.id,
      id: holiday.id,
      S_No: index + 1,
      Name: holiday.title,
      Date: startStr === endStr ? startStr : `${startStr} - ${endStr}`,
      Days: holiday.dayName || (diffDays > 1 ? `${diffDays} Days` : start.toLocaleDateString("en-US", { weekday: 'long' })),
      raw: holiday,
    };
  });

  const columns = [
    {
      title: "S.No",
      dataIndex: "S_No",
      sorter: (a: any, b: any) => a.S_No - b.S_No,
    },
    {
      title: "Name",
      dataIndex: "Name",
      sorter: (a: any, b: any) => a.Name.length - b.Name.length,
    },
    {
      title: "Date",
      dataIndex: "Date",
      sorter: (a: any, b: any) => a.Date.length - b.Date.length,
    },
    {
      title: "Days",
      dataIndex: "Days",
      sorter: (a: any, b: any) => a.Days.length - b.Days.length,
    },
    {
      title: "Action",
      render: (_: string, render: any) => (
        <div className="d-flex align-items-center gap-2">
          <Link
            to="#"
            className="avatar avatar-sm border text-primary rounded-circle d-flex align-items-center justify-content-center bg-transparent"
            data-bs-toggle="modal"
            data-bs-target="#edit_holiday"
            onClick={() => setSelectedHoliday(render.raw)}
          >
            <i className="ti ti-edit fs-16" />
          </Link>
          <Link
            to="#"
            className="avatar avatar-sm border text-danger rounded-circle d-flex align-items-center justify-content-center bg-transparent"
            data-bs-toggle="modal"
            data-bs-target="#delete_holiday"
            onClick={() => setSelectedHoliday(render.raw)}
          >
            <i className="ti ti-trash fs-16" />
          </Link>
        </div>
      ),
    },
  ];

  const cellRender = (current: Dayjs, info: any) => {
    if (info.type === 'month') return null;

    const isHoliday = holidays.find(h => {
      const start = dayjs(h.date).startOf('day');
      const end = h.endDate ? dayjs(h.endDate).endOf('day') : start.endOf('day');
      return current.isSameOrAfter(start) && current.isSameOrBefore(end);
    });

    const isOffDay = current.day() === 0;

    let dotClass = "";

    if (isHoliday) {
      dotClass = "bg-primary";
    } else if (isOffDay) {
      dotClass = "bg-danger";
    } else {
      dotClass = "bg-success";
    }

    return (
      <div className="d-flex align-items-center justify-content-center w-100 mt-1">
        <div className={`rounded-circle ${dotClass}`} style={{ width: "6px", height: "6px" }}></div>
      </div>
    );
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content" id="profilePage">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3 pb-3 border-bottom">
            <h4 className="fw-bold mb-0 d-flex align-items-center">
              Holidays
              <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                Total: {holidays.length}
              </span>
            </h4>
            <div className="d-flex align-items-center gap-2">
              <div className="dropdown">
                <Link to="#" className="dropdown-toggle btn bg-white btn-md d-inline-flex align-items-center fw-normal rounded border text-dark px-2 py-1 fs-14" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                  <i className="ti ti-calendar me-1" /> Calendar View
                </Link>
                <div className="dropdown-menu dropdown-menu-end p-3 shadow" style={{ minWidth: "350px" }}>
                  <Calendar fullscreen={false} cellRender={cellRender} />
                  <div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top">
                    <span className="badge badge-soft-primary border border-primary fs-10">Holiday</span>
                    <span className="badge badge-soft-danger border border-danger fs-10">Off Day</span>
                    <span className="badge badge-soft-success border border-success fs-10">Working</span>
                  </div>
                </div>
              </div>

              <div className="dropdown">
                <Link to="#" className="dropdown-toggle btn bg-white btn-md d-inline-flex align-items-center fw-normal rounded border text-dark px-2 py-1 fs-14" data-bs-toggle="dropdown">
                  <span className="me-1"> Date : </span> Select
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1">All</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Today</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">This Week</Link></li>
                </ul>
              </div>

              <div className="dropdown me-2">
                <Link to="#" className="dropdown-toggle btn bg-white btn-md d-inline-flex align-items-center fw-normal rounded border text-dark px-2 py-1 fs-14" data-bs-toggle="dropdown">
                  <span className="me-1"> Sort By : </span> Recent
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-2">
                  <li><Link to="#" className="dropdown-item rounded-1">Recent</Link></li>
                  <li><Link to="#" className="dropdown-item rounded-1">Oldest</Link></li>
                </ul>
              </div>

              <Link
                to="#"
                className="btn btn-primary btn-md"
                data-bs-toggle="modal"
                data-bs-target="#add_holiday"
              >
                Add Holiday <i className="ti ti-plus ms-1" />
              </Link>
            </div>
          </div>

          <div className="table-responsive border">
            <Datatable
              columns={columns}
              dataSource={data}
              Selection={true}
              searchText={""}
            />
          </div>
        </div>
      </div>
      <HolidaysModal selectedHoliday={selectedHoliday} refetch={refetch} />
    </>
  );
};

export default HolidaysList;
