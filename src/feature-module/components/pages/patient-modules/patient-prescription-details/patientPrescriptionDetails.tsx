import { Link, useSearchParams } from "react-router";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes } from "../../../../routes/all_routes";
import { useState, useEffect } from "react";
import { usePrescriptions } from "../../../../../core/hooks/usePrescriptions";
import html2pdf from 'html2pdf.js';
import { resolveMediaUrl } from "../../../../../core/config/api";

const PatientPrescriptionDetails = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const { getPrescriptionById } = usePrescriptions();
  const [prescription, setPrescription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    getPrescriptionById(id)
      .then((data) => setPrescription(data))
      .catch(() => setPrescription(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => window.print();

  const handleDownload = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !prescription) return;

    const html = `<html>
        <head>
          <title>Prescription - ${prescription.prescriptionCode || 'Record'}</title>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { background: #fff; padding: 30px; font-family: 'Inter', sans-serif; color: #0f172a; }
            .header-banner {
              background: linear-gradient(135deg, #1e3a8a, #3b82f6) !important;
              color: #ffffff !important;
              padding: 24px !important;
              border-radius: 8px !important;
              margin-bottom: 25px !important;
              display: flex;
              justify-content: space-between;
              align-items: center;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .header-banner h4 { color: #ffffff !important; font-weight: 700; margin: 0 0 4px 0; font-size: 22px; }
            .header-banner p { color: #e0f2fe !important; margin: 0; font-size: 13px; }
            .header-banner h6 { color: #ffffff !important; margin: 8px 0 2px 0; font-size: 15px; font-weight: 600; }
            .logo-box { width: 70px; height: 70px; background: #fff; border-radius: 8px; display: flex; align-items: center; justify-content: center; padding: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
            .section-title { font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #0f172a !important; padding-bottom: 8px; margin-bottom: 15px; font-size: 12px; color: #0f172a !important; letter-spacing: 0.5px; }
            .info-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; font-weight: 700; }
            .info-value { font-size: 13px; font-weight: 700; color: #1e293b; }
            .rx-symbol { font-size: 32px; font-weight: 700; color: #1e3a8a; font-family: serif; }
            .med-table th { background: #0f172a !important; color: #ffffff !important; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 12px 10px !important; }
            .med-table td { font-size: 12px; vertical-align: middle; padding: 12px 8px; border-bottom: 1px solid #cbd5e1; color: #0f172a !important; font-weight: 600; }
            .advice-box { padding: 20px; border: 1px solid #e2e8f0; background: #fff; border-radius: 4px; font-size: 13px; min-height: 80px; border-left: 4px solid #1e3a8a; }
            @media print { 
              body { padding: 0; } 
              .no-print { display: none; }
              .header-banner {
                background: linear-gradient(135deg, #1e3a8a, #3b82f6) !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <div class="d-flex align-items-center gap-3">
              <div class="logo-box">
                <img src="${resolveMediaUrl((prescription as any)?.clinic?.landingPage?.logo) || '/logo.png'}" alt="logo" style="max-height: 55px; max-width: 55px; object-fit: contain;">
              </div>
              <div>
                <h4>${(prescription as any).clinicName || "DocYari Health Hub"}</h4>
                <p><i class="ti ti-map-pin"></i> ${(prescription as any).location || "Clinic Location"}</p>
                <h6>${prescription.doctor?.fullName?.startsWith('Dr.') ? prescription.doctor.fullName : `Dr. ${prescription.doctor?.fullName || 'Doctor'}`}</h6>
                <p>${prescription.doctor?.designation?.name || "Consultant"} · ${prescription.doctor?.department?.name || "Medicine"}</p>
              </div>
            </div>
            <div class="text-end text-white">
              <span class="badge bg-white text-primary fw-bold px-3 py-2 mb-2" style="font-size: 12px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                ${prescription.prescriptionCode || "#---"}
              </span>
              <div class="small mt-1 opacity-90">
                <div class="mb-1"><strong>Dept:</strong> ${prescription.doctor?.department?.name || 'General'}</div>
                <div><strong>Date:</strong> ${new Date(prescription.createdAt).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              </div>
            </div>
          </div>

          <div class="bg-light p-3 rounded mb-4 border d-flex justify-content-between">
            <div>
               <div class="info-label">Patient Name</div>
               <div class="info-value" style="font-size: 16px;">${prescription.patient?.firstName} ${prescription.patient?.lastName}</div>
            </div>
            <div class="text-center">
               <div class="info-label">Age / Gender</div>
               <div class="info-value">${prescription.patient?.dob ? Math.floor((Date.now() - new Date(prescription.patient.dob).getTime()) / 31557600000) : '--'}Y / ${prescription.patient?.gender || '--'}</div>
            </div>
            <div class="text-end">
               <div class="info-label">Patient ID</div>
               <div class="info-value">${prescription.patient?.patientCode || 'N/A'}</div>
            </div>
          </div>

          <div class="mb-2 d-flex align-items-center gap-2">
             <span class="rx-symbol">Rx</span>
             <h6 class="section-title mb-0 border-0">Medication Order</h6>
          </div>

          <table class="table med-table mb-4">
             <thead>
                <tr>
                   <th>S.NO</th>
                   <th>MEDICINE NAME</th>
                   <th>DOSAGE</th>
                   <th>FREQUENCY</th>
                   <th>DURATION</th>
                   <th>TIMINGS</th>
                </tr>
             </thead>
             <tbody>
                ${(prescription.medicines || []).map((med: any, i: number) => `
                   <tr>
                      <td class="text-muted fw-bold">${String(i + 1).padStart(2, "0")}</td>
                      <td class="fw-bold text-dark">${med.medicineName}</td>
                      <td>${med.dosage || "—"}</td>
                      <td class="fw-bold text-primary">${med.frequency || "—"}</td>
                      <td>${med.duration || "—"}</td>
                      <td>${med.timings || "—"}</td>
                   </tr>
                `).join('')}
             </tbody>
          </table>

          <div class="row mb-5">
             <div class="col-7">
                <h6 class="section-title">Instructions & Advice</h6>
                <div class="advice-box">
                   ${prescription.advice || "No specific advice provided."}
                </div>
             </div>
             <div class="col-5">
                <h6 class="section-title">Doctor Review</h6>
                <div class="p-3 border rounded">
                   <div class="info-label">Practitioner</div>
                   <div class="info-value">${prescription.doctor?.fullName?.startsWith('Dr.') ? prescription.doctor.fullName : `Dr. ${prescription.doctor?.fullName}`}</div>
                   <div class="info-label">Follow-up Date</div>
                   <div class="info-value text-primary">${prescription.followUpDate ? new Date(prescription.followUpDate).toLocaleDateString() : 'As Needed'}</div>
                </div>
             </div>
          </div>

          <div class="mt-auto pt-5 text-center border-top">
             <div class="d-flex justify-content-between align-items-end mb-3">
                <div class="text-end">
                   <h6 class="fw-bold mb-1">CLINICAL VISIT REPORT</h6>
                   <span class="badge bg-primary px-3 py-1 fw-bold fs-10 text-uppercase">${(prescription as any).status || 'Completed'}</span>
                </div>
                <div class="text-end">
                   <p class="info-label mt-1 mb-1">Authorized Medical Signatory</p>
                   <p class="fw-bold small mb-0">${prescription.doctor?.fullName?.startsWith('Dr.') ? prescription.doctor.fullName : `Dr. ${prescription.doctor?.fullName}`}</p>
                </div>
             </div>
             <p class="mb-1 fw-bold fs-11 text-muted">2025 &copy; Docyari Clinical Solutions</p>
             <p class="mb-0 italic opacity-50" style="font-size: 9px;">This document is digitally signed and valid without a physical rubber stamp.</p>
          </div>

          <script>
            window.onload = () => {
              setTimeout(() => { window.print(); window.close(); }, 500);
            };
          </script>
        </body>
      </html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
          <div className="spinner-border text-primary" />
        </div>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="page-wrapper">
        <div className="content text-center py-5">
          <i className="ti ti-file-off fs-1 text-muted" />
          <p className="text-muted mt-2">Prescription not found.</p>
          <Link to={all_routes.patientPrescriptions} className="btn btn-primary btn-sm">
            Back to Prescriptions
          </Link>
        </div>
      </div>
    );
  }

  const patient = prescription.patient || {};
  const doctor = prescription.doctor || {};
  const medicines = prescription.medicines || [];

  const patientAge = patient.dob
    ? Math.floor((Date.now() - new Date(patient.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="row">
            <div className="col-lg-10 mx-auto">
              <div className="card shadow-sm">
                <div className="card-body">
                  {/* Clinic + Doctor Info */}
                  <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3 flex-wrap gap-2 mt-4">
                    <div className="d-flex align-items-center gap-3">
                      <div className="avatar avatar-xxl rounded bg-light border p-2">
                        <ImageWithBasePath src={(prescription as any).clinic?.landingPage?.logo || "assets/img/logo.png"} alt="clinic" className="img-fluid" />
                      </div>
                      <div>
                        <h5 className="text-dark fw-bold mb-1">{(prescription as any).clinic?.name || (prescription as any).clinicName || "Clinic Center"}</h5>
                        <p className="mb-2 text-muted fs-13 d-flex align-items-center gap-1">
                          <i className="ti ti-map-pin" />
                          {(prescription as any).clinic?.landingPage?.address || (prescription as any).location || "Address Not Specified"}
                        </p>
                        <p className="mb-1 fw-semibold text-dark">
                          {doctor.fullName ? (doctor.fullName.startsWith('Dr.') ? doctor.fullName : `Dr. ${doctor.fullName}`) : "-"}
                        </p>
                        <p className="mb-0 text-muted fs-13">
                          {doctor.designation?.name || ""}{doctor.department?.name ? ` · ${doctor.department.name}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-lg-end">
                      <div className="mb-2">
                        <span className="badge bg-white text-primary border border-primary py-1 px-3 fs-13 fw-medium">
                          {prescription.prescriptionCode || "#---"}
                        </span>
                      </div>
                      <p className="text-dark mb-1">
                        Department: <span className="text-body">{doctor.department?.name || "-"}</span>
                      </p>
                      <p className="text-dark mb-1">
                        Prescribed on: <span className="text-body">
                          {new Date(prescription.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      </p>
                      {prescription.followUpDate && (
                        <p className="text-dark mb-0">
                          Follow Up: <span className="text-body">
                            {new Date(prescription.followUpDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Patient Details */}
                  <div className="mb-3">
                    <h6 className="mb-2 fs-14 fw-medium">Patient Details</h6>
                    <div className="px-3 py-2 bg-light rounded d-flex align-items-center justify-content-between flex-wrap gap-2">
                      <h6 className="m-0 fw-semibold fs-16">
                        {patient.firstName} {patient.lastName}
                      </h6>
                      <div className="d-flex align-items-center gap-3 flex-wrap">
                        {patientAge !== null && (
                          <p className="mb-0 text-dark">{patientAge}Y / {patient.gender || "—"}</p>
                        )}
                        {patient.bloodGroup && (
                          <p className="mb-0 text-dark">
                            <span className="text-body">Blood</span> : {patient.bloodGroup}
                          </p>
                        )}
                        {patient.patientCode && (
                          <p className="mb-0 text-dark">
                            Patient ID <span className="text-body">{patient.patientCode}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Medicines Table */}
                  <div className="mb-4">
                    <h6 className="mb-3 fs-16 fw-semibold text-center">
                      {doctor.department?.name ? `${doctor.department.name} Prescription` : "Prescription"}
                    </h6>
                    <div className="table-responsive border bg-white">
                      <table className="table table-nowrap">
                        <thead className="table-light">
                          <tr>
                            <th className="text-dark">SNO</th>
                            <th className="text-dark">Medicine Name</th>
                            <th className="text-dark">Dosage</th>
                            <th className="text-dark">Frequency</th>
                            <th className="text-dark">Duration</th>
                            <th className="text-dark">Timings</th>
                          </tr>
                        </thead>
                        <tbody>
                          {medicines.length > 0 ? medicines.map((med: any, i: number) => (
                            <tr key={med.id || i}>
                              <td>{String(i + 1).padStart(2, "0")}</td>
                              <td className="fw-medium">{med.medicineName}</td>
                              <td>{med.dosage || "—"}</td>
                              <td className="text-primary fw-medium">{med.frequency || "—"}</td>
                              <td>{med.duration || "—"}</td>
                              <td>{med.timings || "—"}</td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={6} className="text-center text-muted py-3">No medicines added</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Advice */}
                  {prescription.advice && (
                    <div className="pb-3 mb-3 border-bottom">
                      <h6 className="mb-1 fs-16 fw-semibold">Advice</h6>
                      <p className="mb-0">{prescription.advice}</p>
                    </div>
                  )}

                  {/* Follow Up */}
                  <div className="pb-3 mb-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div>
                      <h6 className="mb-1 fs-14 fw-semibold">Follow Up</h6>
                      <p className="mb-0">
                        {prescription.followUpDate
                          ? new Date(prescription.followUpDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
                          : "—"}
                        {prescription.followUpNotes ? ` · ${prescription.followUpNotes}` : ""}
                      </p>
                    </div>
                    <div className="text-end">
                      <img src="/assets/img/icons/signature-img.svg" alt="signature" className="img-fluid mb-1" style={{ maxHeight: '60px' }} />
                      <h6 className="fs-14 fw-semibold mb-0">
                        {doctor.fullName ? (doctor.fullName.startsWith('Dr.') ? doctor.fullName : `Dr. ${doctor.fullName}`) : "—"}
                      </h6>
                      <p className="fs-13 fw-normal text-muted">{doctor.designation?.name || ""}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="text-center d-flex align-items-center justify-content-center gap-2 d-print-none mt-4">
                    <button onClick={handlePrint} className="btn btn-md btn-dark d-flex align-items-center">
                      <i className="ti ti-printer me-1" /> Print
                    </button>
                    <button onClick={handleDownload} className="btn btn-md btn-primary d-flex align-items-center">
                      <i className="ti ti-download me-1" /> Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Prescription */}
      <div id="print-prescription" style={{ display: 'none' }}>
        <div className="p-4" style={{ minHeight: '29.7cm', width: '21cm', margin: 'auto', background: '#fff', color: '#000', fontFamily: "'Inter', sans-serif" }}>
          {/* Header */}
          <div className="d-flex justify-content-between align-items-start mb-4">
            <div className="d-flex gap-3">
              <div className="rounded p-1 d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px', border: '1px dashed #4f46e5', backgroundColor: '#fff' }}>
                <ImageWithBasePath src={(prescription as any)?.clinic?.landingPage?.logo || "assets/img/logo.png"} alt="logo" style={{ maxHeight: '70px', maxWidth: '70px', objectFit: 'contain' }} />
              </div>
              <div>
                <h4 className="fw-bold mb-1 mt-1" style={{ color: '#000', fontSize: '20px' }}>{(prescription as any).clinic?.name || (prescription as any).clinicName || "Clinic Center"}</h4>
                <p className="mb-1 text-muted fs-12 d-flex align-items-center gap-1">
                  <i className="ti ti-map-pin fs-10" /> {(prescription as any).clinic?.landingPage?.address || (prescription as any).location || "Address"}
                </p>
                <h6 className="fw-bold fs-14 mb-0" style={{ color: '#000' }}>
                  {doctor.fullName ? (doctor.fullName.startsWith('Dr.') ? doctor.fullName : `Dr. ${doctor.fullName}`) : ""}
                </h6>
                <p className="text-muted fs-11 mb-0">{doctor.designation?.name || "Consultant"} · {doctor.department?.name || "Medicine"}</p>
              </div>
            </div>
            <div className="text-end">
              <span className="badge bg-white text-primary border border-primary fw-bold px-3 py-2 mb-2" style={{ fontSize: '11px' }}>
                {prescription.prescriptionCode || "#---"}
              </span>
              <div className="text-muted fs-11 mt-1">
                <div className="mb-1 text-dark"><strong>Department:</strong> {doctor.department?.name || "General"}</div>
                <div className="mb-1 text-dark"><strong>Date:</strong> {new Date(prescription.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
              </div>
            </div>
          </div>

          <div className="bg-light px-3 py-2 rounded-1 d-flex justify-content-between align-items-center mb-4 border-top border-bottom border-light-subtle">
            <div className="d-flex align-items-center gap-3">
              <span className="fw-bold text-dark fs-13">Patient Details</span>
              <span style={{ width: '1px', height: '15px', background: '#ccc' }}></span>
              <span className="fw-bold text-dark fs-15">{patient.firstName} {patient.lastName}</span>
            </div>
            <div className="text-muted fs-11 fw-medium d-flex align-items-center gap-2">
              <span>{patientAge !== null ? `${patientAge}Y / ${patient.gender || "N/A"}` : "N/A"}</span>
              <span className="opacity-50">|</span>
              <span>Blood: {patient.bloodGroup || "O+"}</span>
              <span className="opacity-50">|</span>
              <span>Patient ID: <span className="text-dark fw-bold">{patient.patientCode || "#---"}</span></span>
            </div>
          </div>

          <div className="text-center mb-4 pt-2">
            <h5 className="fw-bold text-dark text-uppercase tracking-wider" style={{ borderBottom: '2px solid #eee', display: 'inline-block', paddingBottom: '5px' }}>
              {doctor.department?.name || "Clinical"} Prescription
            </h5>
          </div>

          <div className="mb-5">
            <div className="table-responsive">
              <table className="table table-bordered fs-12 mb-0 border-light-subtle">
                <thead style={{ background: '#f8f9fa' }}>
                  <tr>
                    <th className="py-2 text-center" style={{ width: '50px' }}>SNO</th>
                    <th className="py-2">Medicine Name</th>
                    <th className="py-2 text-center">Dosage</th>
                    <th className="py-2 text-center">Frequency</th>
                    <th className="py-2 text-center">Duration</th>
                    <th className="py-2 text-center">Timings</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((med: any, i: number) => (
                    <tr key={med.id || i}>
                      <td className="py-2 text-center text-muted fw-medium">{String(i + 1).padStart(2, "0")}</td>
                      <td className="py-2 fw-bold text-dark">{med.medicineName}</td>
                      <td className="py-2 text-center">{med.dosage || "—"}</td>
                      <td className="py-2 text-center fw-bold text-primary">{med.frequency || "—"}</td>
                      <td className="py-2 text-center">{med.duration || "—"}</td>
                      <td className="py-2 text-center">{med.timings || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {prescription.advice && (
            <div className="mb-5">
              <h6 className="fw-bold text-dark mb-2 fs-13"><i className="ti ti-notes me-1" /> Advice / Instructions</h6>
              <div className="p-3 border rounded-1 bg-white" style={{ minHeight: '100px', lineHeight: '1.6', fontSize: '14px' }}>
                {prescription.advice}
              </div>
            </div>
          )}

          <div className="mt-auto pt-5">
            <div className="d-flex justify-content-between align-items-end">
              <div>
                <p className="mb-1 text-dark fs-12"><strong>Follow Up Date:</strong> {prescription.followUpDate ? new Date(prescription.followUpDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "—"}</p>
                {prescription.followUpNotes && <p className="mb-0 text-muted fs-11">Notes: {prescription.followUpNotes}</p>}
              </div>
              <div className="text-end" style={{ width: '200px' }}>
                <img src="/assets/img/icons/signature-img.svg" alt="signature" style={{ height: '50px', marginBottom: '5px' }} />
                <h6 className="fw-bold fs-14 mb-0">
                  {doctor.fullName ? (doctor.fullName.startsWith('Dr.') ? doctor.fullName : `Dr. ${doctor.fullName}`) : ""}
                </h6>
                <p className="text-muted fs-11 mb-0">{doctor.designation?.name || "Consultant"}</p>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @media print {
            @page { size: A4; margin: 0; }
            body * { visibility: hidden !important; }
            #print-prescription, #print-prescription * {
                visibility: visible !important;
            }
            #print-prescription {
                visibility: visible !important;
                display: block !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                background: white !important;
                z-index: 99999 !important;
                padding: 1.5cm !important;
                margin: 0 !important;
            }
          }
        `}</style>
      </div>

      <div className="p-3 bg-white border-top text-center d-print-none mt-4">
        <p className="text-dark text-center mb-0">
          2025 © <span className="text-info">Docyari</span>, All Rights Reserved
        </p>
      </div>
    </>
  );
};

export default PatientPrescriptionDetails;
