import { Link } from "react-router";
import { useState } from "react";
import Datatable from "../../../../../core/common/dataTable";
import SearchInput from "../../../../../core/common/dataTable/dataTableSearch";
import { useClinics } from "../../../../../core/hooks/useClinics";
import { all_routes } from "../../../../routes/all_routes";

const PatientClinics = () => {
    const { clinics, loading } = useClinics();
    const [searchText, setSearchText] = useState<string>("");

    const handleSearch = (value: string) => {
        setSearchText(value);
    };

    const columns = [
        {
            title: "Sr No",
            dataIndex: "id",
            render: (_: any, __: any, index: number) => (
                <span className="fw-bold">{String(index + 1).padStart(2, "0")}</span>
            ),
        },
        {
            title: "Clinic Name",
            dataIndex: "name",
            render: (text: string, record: any) => (
                <div className="d-flex align-items-center">
                    <Link to={`/patient/patient-doctors?clinicId=${record.id}`} className="text-dark fw-semibold hover-primary">
                        {text}
                    </Link>
                </div>
            ),
            sorter: (a: any, b: any) => a.name.localeCompare(b.name),
        },
        {
            title: "Address",
            dataIndex: "address",
            render: (text: string) => text || "—",
            sorter: (a: any, b: any) => (a.address || "").localeCompare(b.address || ""),
        },
        {
            title: "Phone",
            dataIndex: "phone",
            render: (text: string) => text || "—",
            sorter: (a: any, b: any) => (a.phone || "").localeCompare(b.phone || ""),
        },
        {
            title: "Doctors Count",
            dataIndex: "doctorsCount",
            render: (text: any, record: any) => (
                <span className="badge bg-soft-info text-info">
                    {record.doctorsCount || record.doctors?.length || 0} Doctors
                </span>
            ),
            sorter: (a: any, b: any) => (a.doctorsCount || 0) - (b.doctorsCount || 0),
        },
        {
            title: "Action",
            render: (record: any) => (
                <Link
                    to={`${all_routes.patientdoctors}?clinicId=${record.id}`}
                    className="btn btn-sm btn-soft-primary fw-bold"
                >
                    View Doctors
                </Link>
            ),
        },
    ];

    return (
        <div className="page-wrapper">
            <div className="content">
                <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-1 mb-4 border-bottom">
                    <div className="flex-grow-1">
                        <h6 className="fw-bold mb-1 d-flex align-items-center text-muted fs-12 text-uppercase">
                            <Link to={all_routes.patientdashboard} className="text-muted hover-primary">Dashboard</Link>
                            <i className="ti ti-chevron-right mx-2" />
                            <span className="text-primary">Explore Clinics</span>
                        </h6>
                        <h3 className="fw-bold mb-0">Clinic Directory</h3>
                    </div>
                </div>

                <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 mb-4">
                    <div className="search-set">
                        <SearchInput value={searchText} onChange={handleSearch} />
                    </div>
                </div>

                <div className="table-responsive bg-white rounded shadow-sm border p-0">
                    <Datatable
                        columns={columns}
                        dataSource={clinics}
                        loading={loading}
                        Selection={true}
                        searchText={searchText}
                    />
                </div>
            </div>

            <div className="footer text-center bg-white p-2 border-top mt-4">
                <p className="text-dark mb-0">
                    2025 © <Link to="#" className="link-primary fw-bold">Docyari</Link>, All Rights Reserved
                </p>
            </div>

            <style>{`
                .btn-soft-primary { background-color: rgba(79, 70, 229, 0.1); color: #4f46e5; border: none; }
                .btn-soft-primary:hover { background-color: #4f46e5; color: white; }
                .bg-soft-info { background-color: rgba(13, 202, 240, 0.1); color: #0dcaf0; }
                .hover-primary:hover { color: #4f46e5 !important; }
            `}</style>
        </div>
    );
};

export default PatientClinics;
