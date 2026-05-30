import { useState, useEffect } from "react";
import { Link } from "react-router";
import CommonSelect from "../../../../../../core/common/common-select/commonSelect";
import ImageWithBasePath from "../../../../../../core/imageWithBasePath";
import { StatusActive } from "../../../../../../core/common/selectOption";
import { useClinicDepartments } from "../../../../../../core/hooks/useClinicDepartments";
import { apiPost, apiPut, apiDelete } from "../../../../../../core/utils/apiClient";

interface ModalsProps {
  selectedService?: any;
  selectedProduct?: any;
  refetch?: () => void;
}

const Modals = ({ selectedService, selectedProduct, refetch }: ModalsProps) => {
  const { departments } = useClinicDepartments();
  const deptOptions = departments.map((d) => ({ value: d.id, label: d.name }));

  // Add Service State
  const [addName, setAddName] = useState("");
  const [addPrice, setAddPrice] = useState("");
  const [addDept, setAddDept] = useState<any>(null);

  const handleAddSubmit = async (e: any) => {
    e.preventDefault();
    if (!addName || !addDept || !addPrice) return;
    try {
      await apiPost("/api/services", {
        serviceName: addName,
        departmentId: addDept.value,
        price: addPrice,
        status: "Active",
      });
      refetch?.();
      setAddName(""); setAddPrice(""); setAddDept(null);
      document.getElementById("close-add-modal")?.click();
    } catch (err) { console.error(err); }
  };

  // Edit Service State
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDept, setEditDept] = useState<any>(null);
  const [editStatus, setEditStatus] = useState<any>(null);

  useEffect(() => {
    if (selectedService) {
      setEditName(selectedService.serviceName);
      setEditPrice(String(selectedService.price));
      setEditDept(selectedService.departmentId && selectedService.department
        ? { value: selectedService.departmentId, label: selectedService.department.name }
        : null);
      setEditStatus(selectedService.status
        ? { value: selectedService.status, label: selectedService.status }
        : null);
    }
  }, [selectedService]);

  const handleEditSubmit = async (e: any) => {
    e.preventDefault();
    if (!selectedService || !editName || !editDept || !editPrice || !editStatus) return;
    try {
      await apiPut(`/api/services/${selectedService.id}`, {
        serviceName: editName,
        departmentId: editDept.value,
        price: editPrice,
        status: editStatus.value,
      });
      refetch?.();
      document.getElementById("close-edit-modal")?.click();
    } catch (err) { console.error(err); }
  };

  // Delete Service State
  const handleDelete = async (e: any) => {
    e.preventDefault();
    if (!selectedService) return;
    try {
      await apiDelete(`/api/services/${selectedService.id}`);
      refetch?.();
      document.getElementById("close-delete-modal")?.click();
    } catch (err) { console.error(err); }
  };

  // Add Product State
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [productKey, setProductKey] = useState("");

  const handleAddProductSubmit = async (e: any) => {
    e.preventDefault();
    if (!productName || !productPrice || !productKey || !productDesc) return;
    try {
      await apiPost("/api/products", {
        name: productName,
        description: productDesc,
        price: productPrice,
        key: productKey,
      });
      refetch?.();
      setProductName(""); setProductPrice(""); setProductDesc(""); setProductKey("");
      document.getElementById("close-add-product-modal")?.click();
    } catch (err) { console.error(err); }
  };

  // Edit Product State
  const [editProductName, setEditProductName] = useState("");
  const [editProductPrice, setEditProductPrice] = useState("");
  const [editProductDesc, setEditProductDesc] = useState("");
  const [editProductKey, setEditProductKey] = useState("");

  useEffect(() => {
    if (selectedProduct) {
      setEditProductName(selectedProduct.name);
      setEditProductPrice(String(selectedProduct.price));
      setEditProductDesc(selectedProduct.description || "");
      setEditProductKey(selectedProduct.key || "");
    }
  }, [selectedProduct]);

  const handleEditProductSubmit = async (e: any) => {
    e.preventDefault();
    if (!selectedProduct || !editProductName || !editProductPrice) return;
    try {
      await apiPut(`/api/products/${selectedProduct.id}`, {
        name: editProductName,
        description: editProductDesc,
        price: editProductPrice,
        key: editProductKey,
      });
      refetch?.();
      document.getElementById("close-edit-product-modal")?.click();
    } catch (err) { console.error(err); }
  };

  // Delete Product State
  const handleDeleteProduct = async (e: any) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await apiDelete(`/api/products/${selectedProduct.id}`);
      refetch?.();
      document.getElementById("close-delete-product-modal")?.click();
    } catch (err) { console.error(err); }
  };

  return (
    <>
      {/* Start Add Service Modal */}
      <div id="add_service" className="modal fade">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="text-dark modal-title fw-bold">New Service</h4>
              <button type="button" className="btn-close btn-close-modal custom-btn-close" data-bs-dismiss="modal" aria-label="Close" />
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Service Name<span className="text-danger ms-1">*</span></label>
                  <input type="text" className="form-control" value={addName} onChange={(e) => setAddName(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Department<span className="text-danger ms-1">*</span></label>
                  <CommonSelect options={deptOptions} className="select" value={addDept} onChange={(val) => setAddDept(val)} />
                </div>
                <div className="mb-0">
                  <label className="form-label">Price<span className="text-danger ms-1">*</span></label>
                  <input type="number" className="form-control" value={addPrice} onChange={(e) => setAddPrice(e.target.value)} required />
                </div>
              </div>
              <div className="modal-footer d-flex align-items-center gap-1">
                <button type="button" className="btn btn-white border" data-bs-dismiss="modal" id="close-add-modal">Cancel</button>
                <button type="submit" className="btn btn-primary">Add New Service</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Start Edit Service Modal */}
      <div id="edit_service" className="modal fade">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="text-dark modal-title fw-bold">Edit Service</h4>
              <button type="button" className="btn-close btn-close-modal custom-btn-close" data-bs-dismiss="modal" aria-label="Close" />
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Service Name<span className="text-danger ms-1">*</span></label>
                  <input type="text" className="form-control" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Department<span className="text-danger ms-1">*</span></label>
                  <CommonSelect options={deptOptions} className="select" value={editDept} onChange={(val) => setEditDept(val)} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Price<span className="text-danger ms-1">*</span></label>
                  <input type="number" className="form-control" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} required />
                </div>
                <div className="mb-0">
                  <label className="form-label">Status<span className="text-danger ms-1">*</span></label>
                  <CommonSelect options={StatusActive} className="select" value={editStatus} onChange={(val) => setEditStatus(val)} />
                </div>
              </div>
              <div className="modal-footer d-flex align-items-center gap-1">
                <button type="button" className="btn btn-white border" data-bs-dismiss="modal" id="close-edit-modal">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Start Delete Service Modal */}
      <div className="modal fade" id="delete_service">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
            <div className="modal-body text-center position-relative z-1">
              <ImageWithBasePath src="assets/img/bg/delete-modal-bg-01.png" alt="" className="img-fluid position-absolute top-0 start-0 z-n1" />
              <ImageWithBasePath src="assets/img/bg/delete-modal-bg-02.png" alt="" className="img-fluid position-absolute bottom-0 end-0 z-n1" />
              <div className="mb-3">
                <span className="avatar avatar-lg bg-danger text-white"><i className="ti ti-trash fs-24" /></span>
              </div>
              <h5 className="fw-bold mb-1">Delete Confirmation</h5>
              <p className="mb-3">Are you sure want to delete?</p>
              <div className="d-flex justify-content-center">
                <button type="button" className="btn btn-light position-relative z-1 me-3" data-bs-dismiss="modal" id="close-delete-modal">Cancel</button>
                <button type="button" className="btn btn-danger position-relative z-1" onClick={handleDelete}>Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Start Add Product Modal */}
      <div id="add_product" className="modal fade">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="text-dark modal-title fw-bold">New Product</h4>
              <button type="button" className="btn-close btn-close-modal custom-btn-close" data-bs-dismiss="modal" aria-label="Close" />
            </div>
            <form onSubmit={handleAddProductSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Name<span className="text-danger ms-1">*</span></label>
                  <input type="text" className="form-control" value={productName} onChange={(e) => setProductName(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description<span className="text-danger ms-1">*</span></label>
                  <textarea className="form-control" value={productDesc} onChange={(e) => setProductDesc(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Price<span className="text-danger ms-1">*</span></label>
                  <input type="number" className="form-control" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} required />
                </div>
                <div className="mb-0">
                  <label className="form-label">Key<span className="text-danger ms-1">*</span></label>
                  <input type="text" className="form-control" value={productKey} onChange={(e) => setProductKey(e.target.value)} required />
                </div>
              </div>
              <div className="modal-footer d-flex align-items-center gap-1">
                <button type="button" className="btn btn-white border" data-bs-dismiss="modal" id="close-add-product-modal">Cancel</button>
                <button type="submit" className="btn btn-info">Add New Product</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Start Edit Product Modal */}
      <div id="edit_product" className="modal fade">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="text-dark modal-title fw-bold">Edit Product</h4>
              <button type="button" className="btn-close btn-close-modal custom-btn-close" data-bs-dismiss="modal" aria-label="Close" />
            </div>
            <form onSubmit={handleEditProductSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Name<span className="text-danger ms-1">*</span></label>
                  <input type="text" className="form-control" value={editProductName} onChange={(e) => setEditProductName(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description<span className="text-danger ms-1">*</span></label>
                  <textarea className="form-control" value={editProductDesc} onChange={(e) => setEditProductDesc(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Price<span className="text-danger ms-1">*</span></label>
                  <input type="number" className="form-control" value={editProductPrice} onChange={(e) => setEditProductPrice(e.target.value)} required />
                </div>
                <div className="mb-0">
                  <label className="form-label">Key<span className="text-danger ms-1">*</span></label>
                  <input type="text" className="form-control" value={editProductKey} onChange={(e) => setEditProductKey(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer d-flex align-items-center gap-1">
                <button type="button" className="btn btn-white border" data-bs-dismiss="modal" id="close-edit-product-modal">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Start Delete Product Modal */}
      <div id="delete_product" className="modal fade">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body pb-0 text-center">
              <span className="avatar avatar-xxl bg-transparent text-danger mb-3 border border-danger">
                <i className="ti ti-trash-x fs-36" />
              </span>
              <h4 className="mb-2">Delete this product?</h4>
              <p>This action cannot be undone.</p>
              <div className="d-flex align-items-center justify-content-center mt-4">
                <Link to="#" className="btn btn-light me-2" data-bs-dismiss="modal" id="close-delete-product-modal">Cancel</Link>
                <button onClick={handleDeleteProduct} className="btn btn-danger">Yes, Delete it</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Modals;
