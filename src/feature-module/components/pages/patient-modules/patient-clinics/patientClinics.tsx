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
            title: "Action",
            render: (record: any) => (
                <Link
                    to={`${all_routes.patientdoctors}?clinicId=${record.id}`}
                    className="btn btn-sm btn-outline-primary"
                >
                    View Doctors
                </Link>
            ),
        },
    ];

    return (
        <div className="page-wrapper">
            <div className="content">
                <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-bottom">
                    <div className="flex-grow-1">
                        <h4 className="fw-bold mb-0">Explore Clinics</h4>
                    </div>
                </div>

                <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 mb-3">
                    <div className="search-set">
                        <SearchInput value={searchText} onChange={handleSearch} />
                    </div>
                </div>

                <div className="table-responsive">
                    <Datatable
                        columns={columns}
                        dataSource={clinics}
                        loading={loading}
                        Selection={false}
                        searchText={searchText}
                    />
                </div>
            </div>

            <div className="footer text-center bg-white p-2 border-top">
                <p className="text-dark mb-0">
                    2025 © <Link to="#" className="link-primary">Docyori</Link>, All Rights Reserved
                </p>
            </div>
        </div>
    );
};

export default PatientClinics;
