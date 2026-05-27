import { useState } from "react";
import { Link } from "react-router";
import Datatable from "../../../../core/common/dataTable";
import HolidaysModal from "./modal/holidaysModal";
import { useHolidays } from "../../../../core/hooks/useHolidays";

const HolidaysList = () => {
  const { holidays, refetch } = useHolidays();
  const [selectedHoliday, setSelectedHoliday] = useState<any>(null);

  const data = holidays.map((holiday) => {
    const start = new Date(holiday.date);
    const end = holiday.endDate ? new Date(holiday.endDate) : start;

    const startStr = start.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const endStr = end.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return {
      key: holiday.id,
      id: holiday.id,
      Name: holiday.title,
      Date: startStr === endStr ? startStr : `${startStr} - ${endStr}`,
      Days: holiday.dayName || (diffDays > 1 ? `${diffDays} Days` : start.toLocaleDateString("en-US", { weekday: 'long' })),
      raw: holiday,
    };
  });

  const columns = [
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
      title: "",
      render: (_: string, render: any) => (
        <div className="action-item p-2">
          <Link
            to="#"
            data-bs-toggle="dropdown"
            className="btn p-1 btn-white border"
          >
            <i className="ti ti-dots-vertical" />
          </Link>
          <ul className="dropdown-menu p-2">
            <li>
              <Link
                to="#"
                className="dropdown-item d-flex align-items-center"
                data-bs-toggle="modal"
                data-bs-target="#edit_holiday"
                onClick={() => setSelectedHoliday(render.raw)}
              >
                Edit
              </Link>
            </li>
            <li>
              <Link
                to="#"
                className="dropdown-item d-flex align-items-center"
                data-bs-toggle="modal"
                data-bs-target="#delete_holiday"
                onClick={() => setSelectedHoliday(render.raw)}
              >
                Delete
              </Link>
            </li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content" id="profilePage">
          <div className="mb-3 border-bottom pb-3">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <h4 className="fw-bold mb-0 me-2">Holidays</h4>
                <span className="badge badge-soft-primary border border-primary fw-medium">
                  Total Holidays : {holidays.length}
                </span>
              </div>
              <Link
                to="#"
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#add_holiday"
              >
                <i className="ti ti-plus me-1" />
                Add Holiday
              </Link>
            </div>
          </div>
          <div className="table-responsive border">
            <Datatable
              columns={columns}
              dataSource={data}
              Selection={false}
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
