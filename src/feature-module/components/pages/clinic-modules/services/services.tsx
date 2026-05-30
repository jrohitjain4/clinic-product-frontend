import { Link } from "react-router";
import Modals from "./modals/modals";
import { useState } from "react";
import SearchInput from "../../../../../core/common/dataTable/dataTableSearch";
import Datatable from "../../../../../core/common/dataTable";
import { useClinicServices } from "../../../../../core/hooks/useClinicServices";
import { useClinicProducts } from "../../../../../core/hooks/useClinicProducts";

const Services = () => {
  const { services, refetch: refetchServices } = useClinicServices();
  const { products, refetch: refetchProducts } = useClinicProducts();
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const refetchAll = () => {
    refetchServices();
    refetchProducts();
  };

  // Merge services and products into one table
  const data = [
    ...services.map(s => ({
      key: "service-" + s.id,
      id: s.id,
      Type: "Service",
      originalService: s,
      ServiceName: s.serviceName,
      Department: s.department?.name || "—",
      Price: "$" + s.price,
      Status: s.status || "Active",
    })),
    ...products.map(p => ({
      key: "product-" + p.id,
      id: p.id,
      Type: "Product",
      originalService: p,
      ServiceName: p.name,
      Department: p.key || "—",
      Price: "$" + p.price,
      Status: "Active",
    })),
  ];

  const columns = [
    {
      title: "Name",
      dataIndex: "ServiceName",
      render: (text: string, record: any) => (
        <div className="d-flex align-items-center">
          <span className="fw-medium">{text}</span>
          {record.Type === "Product" ? (
            <span className="badge badge-soft-info border border-info ms-2 px-2 py-1 fs-11">Product</span>
          ) : (
            <span className="badge badge-soft-primary border border-primary ms-2 px-2 py-1 fs-11">Service</span>
          )}
        </div>
      ),
      sorter: (a: any, b: any) => a.ServiceName.length - b.ServiceName.length,
    },
    {
      title: "Dept / Key",
      dataIndex: "Department",
      sorter: (a: any, b: any) => a.Department.length - b.Department.length,
    },
    {
      title: "Price",
      dataIndex: "Price",
      sorter: (a: any, b: any) => a.Price.length - b.Price.length,
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => (
        <span
          className={`badge ${text === "Active"
            ? "badge-soft-success border-success"
            : "badge-soft-danger border-danger"
            } border px-2 py-1 fs-13 fw-medium`}
        >
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => a.Status.length - b.Status.length,
    },
    {
      title: "",
      render: (_text: string, record: any) => (
        <div className="action-item">
          <Link to="#" data-bs-toggle="dropdown">
            <i className="ti ti-dots-vertical" />
          </Link>
          <ul className="dropdown-menu p-2">
            <li>
              <Link
                to="#"
                className="dropdown-item d-flex align-items-center"
                data-bs-toggle="modal"
                data-bs-target={record.Type === "Service" ? "#edit_service" : "#edit_product"}
                onClick={() => {
                  if (record.Type === "Service") setSelectedService(record.originalService);
                  else setSelectedProduct(record.originalService);
                }}
              >
                Edit
              </Link>
            </li>
            <li>
              <Link
                to="#"
                className="dropdown-item d-flex align-items-center"
                data-bs-toggle="modal"
                data-bs-target={record.Type === "Service" ? "#delete_service" : "#delete_product"}
                onClick={() => {
                  if (record.Type === "Service") setSelectedService(record.originalService);
                  else setSelectedProduct(record.originalService);
                }}
              >
                Delete
              </Link>
            </li>
          </ul>
        </div>
      ),
    },
  ];

  const [searchText, setSearchText] = useState<string>("");

  return (
    <>
      <>
        {/* ========================
				Start Page Content
			========================= */}
        <div className="page-wrapper">
          {/* Start Content */}
          <div className="content">
            {/* Start Page Header */}
            <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3 pb-3 border-bottom">
              <div className="flex-grow-1">
                <h4 className="fw-bold mb-0">
                  Services and Products
                  <span className="badge badge-soft-primary border border-primary fs-13 fw-medium ms-2">
                    Total: {data.length}
                  </span>
                </h4>
              </div>
              <div className="text-end d-flex gap-2">
                <Link
                  to="#"
                  data-bs-toggle="modal"
                  data-bs-target="#add_service"
                  className="btn btn-primary btn-md fs-13"
                >
                  <i className="ti ti-plus me-1" />
                  New Service
                </Link>
                <Link
                  to="#"
                  data-bs-toggle="modal"
                  data-bs-target="#add_product"
                  className="btn btn-info btn-md fs-13"
                >
                  <i className="ti ti-plus me-1" />
                  New Product
                </Link>
              </div>
            </div>
            {/* End Page Header */}
            {/* Start Filter */}
            <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 mb-3">
              <div className="search-set">
                <div className="d-flex align-items-center flex-wrap gap-2">
                  <div className="table-search d-flex align-items-center mb-0">
                    <div className="search-input">
                      <SearchInput value={searchText} onChange={setSearchText} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* End Filter */}
            {/* Start Table */}
            <div className="table-responsive">
              <Datatable
                columns={columns}
                dataSource={data}
                Selection={false}
                searchText={searchText}
              />
            </div>
            {/* End Table */}
          </div>
          {/* End Content */}
          {/* Footer */}
          <div className="footer text-center bg-white p-2 border-top">
            <p className="text-dark mb-0">
              2025 ©{" "}
              <Link to="#" className="link-primary">
                Preclinic
              </Link>
              , All Rights Reserved
            </p>
          </div>
        </div>

        {/* ========================
				End Page Content
			========================= */}

      </>

      <Modals selectedService={selectedService} selectedProduct={selectedProduct} refetch={refetchAll} />
    </>
  );
};

export default Services;
