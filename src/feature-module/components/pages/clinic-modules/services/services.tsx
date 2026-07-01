import { Link } from "react-router";
import Modals from "./modals/modals";
import { useState, useMemo } from "react";
import Datatable from "../../../../../core/common/dataTable";
import { useClinicServices } from "../../../../../core/hooks/useClinicServices";
import { useClinicProducts } from "../../../../../core/hooks/useClinicProducts";
import { useClinicDepartments } from "../../../../../core/hooks/useClinicDepartments";
import { apiDelete } from "../../../../../core/utils/apiClient";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { toast } from "react-toastify";

const Services = () => {
  const { services, refetch: refetchServices } = useClinicServices();
  const { products, refetch: refetchProducts } = useClinicProducts();
  const { departments } = useClinicDepartments();
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Filters
  const [filterType, setFilterType] = useState("All");
  const [filterDept, setFilterDept] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchText] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const refetchAll = () => {
    refetchServices();
    refetchProducts();
  };

  const handleBulkDelete = async () => {
    try {
      for (const key of selectedIds) {
        const parts = key.split("-");
        const type = parts[0];
        const id = parts.slice(1).join("-");
        if (type === "service") await apiDelete(`/api/services/${id}`);
        else if (type === "product") await apiDelete(`/api/products/${id}`);
      }
      setSelectedIds([]);
      refetchAll();
      toast.success("Selected items deleted successfully");
      document.getElementById("close-bulk-delete-modal")?.click();
    } catch (err) {
      console.error(err);
    }
  };

  // Merge services and products into one table
  const rawData = useMemo(() => [
    ...services.map(s => ({
      key: "service-" + s.id,
      id: s.id,
      Type: "Service",
      originalService: s,
      ServiceName: s.serviceName,
      Department: s.department?.name || "N/A",
      Price: s.price,
      Duration: s.duration || "N/A",
      Status: s.status || "Active",
    })),
    ...products.map(p => ({
      key: "product-" + p.id,
      id: p.id,
      Type: "Product",
      originalService: p,
      ServiceName: p.name,
      Department: p.key || "N/A",
      Price: p.price,
      Duration: "N/A",
      Status: "Active",
    })),
  ], [services, products]);

  const filteredData = useMemo(() => {
    return rawData.filter(item => {
      const matchesDept = filterDept === "All" || item.Department === filterDept;
      const matchesType = filterType === "All" || item.Type === filterType;
      const matchesStatus = filterStatus === "All" || item.Status === filterStatus;

      return matchesDept && matchesType && matchesStatus;
    });
  }, [rawData, filterDept, filterType, filterStatus]);

  const columns = [
    {
      title: "Sr No.",
      dataIndex: "sr_no",
      render: (_: any, __: any, index: number) => <span className="fs-13 fw-medium">{index + 1}</span>,
    },
    {
      title: "Name",
      dataIndex: "ServiceName",
      render: (text: string, record: any) => (
        <div className="d-flex align-items-center">
          <span className="fw-medium text-dark">{text}</span>
          {record.Type === "Product" ? (
            <span className="badge badge-soft-info border border-info ms-2 px-2 py-1 fs-11">Medicine</span>
          ) : (
            <span className="badge badge-soft-primary border border-primary ms-2 px-2 py-1 fs-11">Service</span>
          )}
        </div>
      ),
      sorter: (a: any, b: any) => a.ServiceName.localeCompare(b.ServiceName),
    },
    {
      title: "Dept / Key",
      dataIndex: "Department",
      render: (text: string) => <span className="text-dark">{text}</span>,
      sorter: (a: any, b: any) => a.Department.localeCompare(b.Department),
    },
    {
      title: "Price",
      dataIndex: "Price",
      render: (text: number) => <span className="text-dark fw-semibold">₹{text}</span>,
      sorter: (a: any, b: any) => a.Price - b.Price,
    },
    {
      title: "Duration",
      dataIndex: "Duration",
      render: (text: string) => <span className="text-dark">{text}</span>,
      sorter: (a: any, b: any) => a.Duration.localeCompare(b.Duration),
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => (
        <span
          className={`badge ${text === "Active"
            ? "badge-soft-success border-success"
            : "badge-soft-danger border-danger"
            } border px-2 py-1 fs-12 fw-medium`}
        >
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => a.Status.localeCompare(b.Status),
    },
    {
      title: "Action",
      dataIndex: "action",
      align: "center",
      className: "text-nowrap",
      render: (_text: string, record: any) => (
        <div className="d-flex align-items-center gap-2 justify-content-center text-nowrap">
          <Link
            to="#"
            className="text-primary p-1"
            title="Edit"
            data-bs-toggle="modal"
            data-bs-target={record.Type === "Service" ? "#edit_service" : "#edit_product"}
            onClick={() => {
              if (record.Type === "Service") setSelectedService(record.originalService);
              else setSelectedProduct(record.originalService);
            }}
          >
            <i className="ti ti-edit fs-18" />
          </Link>
          <button
            className="bg-transparent border-0 text-danger p-1"
            title="Delete"
            data-bs-toggle="modal"
            data-bs-target={record.Type === "Service" ? "#delete_service" : "#delete_product"}
            onClick={() => {
              if (record.Type === "Service") setSelectedService(record.originalService);
              else setSelectedProduct(record.originalService);
            }}
          >
            <i className="ti ti-trash fs-18" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Page Header */}
        <div className="page-header d-flex align-items-sm-center flex-sm-row flex-column gap-2 border-bottom mb-3 pb-3">
          <div className="flex-grow-1">
            <h4 className="page-title fw-bold mb-0">
              Services & Medicines
              <span className="badge badge-soft-primary fs-13 fw-medium ms-2">
                Total: {filteredData.length}
              </span>
            </h4>
          </div>
          <div className="d-flex align-items-center justify-content-sm-end justify-content-start flex-wrap gap-2">

            {/* Type Filter */}
            <div className="dropdown">
              <Link
                to="#"
                className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap"
                style={{ minWidth: "140px", minHeight: "38px" }}
                data-bs-toggle="dropdown"
              >
                <span><span className="text-muted">Type:</span> {filterType}</span>
              </Link>
              <ul className="dropdown-menu dropdown-menu-end p-2">
                {["All", "Service", "Product"].map(t => (
                  <li key={t}>
                    <Link to="#" className="dropdown-item rounded-1" onClick={(e) => { e.preventDefault(); setFilterType(t); }}>
                      {t === "Product" ? "Medicine" : t}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Department Filter */}
            <div className="dropdown">
              <Link
                to="#"
                className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap"
                style={{ minWidth: "180px", minHeight: "38px" }}
                data-bs-toggle="dropdown"
              >
                <span className="text-truncate"><span className="text-muted">Dept:</span> {filterDept}</span>
              </Link>
              <ul className="dropdown-menu dropdown-menu-end p-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <li>
                  <Link to="#" className="dropdown-item rounded-1" onClick={(e) => { e.preventDefault(); setFilterDept("All"); }}>
                    All
                  </Link>
                </li>
                {departments.map((d: any) => (
                  <li key={d.id}>
                    <Link to="#" className="dropdown-item rounded-1" onClick={(e) => { e.preventDefault(); setFilterDept(d.name); }}>
                      {d.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Status Filter */}
            <div className="dropdown">
              <Link
                to="#"
                className="form-select text-dark text-decoration-none d-flex align-items-center justify-content-between text-nowrap"
                style={{ minWidth: "130px", minHeight: "38px" }}
                data-bs-toggle="dropdown"
              >
                <span><span className="text-muted">Status:</span> {filterStatus}</span>
              </Link>
              <ul className="dropdown-menu dropdown-menu-end p-2">
                {["All", "Active", "Inactive"].map(s => (
                  <li key={s}>
                    <Link to="#" className="dropdown-item rounded-1" onClick={(e) => { e.preventDefault(); setFilterStatus(s); }}>
                      {s}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              to="#"
              data-bs-toggle="modal"
              data-bs-target="#add_service"
              className="btn btn-primary d-flex align-items-center"
              style={{ minHeight: '38px' }}
            >
              New Service <i className="ti ti-plus ms-1" />
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <Datatable
            columns={columns}
            dataSource={filteredData}
            Selection={true}
            searchText={searchText}
            onSelectionChange={(keys) => setSelectedIds(keys as string[])}
          />
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="d-flex justify-content-center mt-4">
            <button
              data-bs-toggle="modal"
              data-bs-target="#bulk_delete_modal"
              className="btn btn-danger d-flex align-items-center gap-2 px-4 py-2 shadow"
              style={{ borderRadius: '8px', fontWeight: 'bold' }}
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
          2025 –{" "}
          <Link to="#" className="link-primary">
            Docyari
          </Link>
          , All Rights Reserved
        </p>
      </div>

      <Modals
        selectedService={selectedService}
        selectedProduct={selectedProduct}
        refetch={refetchAll}
      />

      {/* Start Bulk Delete Modal */}
      <div className="modal fade" id="bulk_delete_modal">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
            <div className="modal-body text-center position-relative z-1">
              <ImageWithBasePath src="assets/img/bg/delete-modal-bg-01.png" alt="" className="img-fluid position-absolute top-0 start-0 z-n1" />
              <ImageWithBasePath src="assets/img/bg/delete-modal-bg-02.png" alt="" className="img-fluid position-absolute bottom-0 end-0 z-n1" />
              <div className="mb-3">
                <span className="avatar avatar-lg bg-danger text-white"><i className="ti ti-trash fs-24" /></span>
              </div>
              <h5 className="fw-bold mb-1">Delete Confirmation</h5>
              <p className="mb-3">Are you sure want to delete selected items?</p>
              <div className="d-flex justify-content-center">
                <button type="button" className="btn btn-light position-relative z-1 me-3" data-bs-dismiss="modal" id="close-bulk-delete-modal">Cancel</button>
                <button type="button" className="btn btn-danger position-relative z-1" onClick={handleBulkDelete}>Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;
