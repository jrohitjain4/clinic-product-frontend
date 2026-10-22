import { Link, useSearchParams } from "react-router";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes } from "../../../../routes/all_routes";
import { useState, useEffect } from "react";
import { usePrescriptions } from "../../../../../core/hooks/usePrescriptions";
import html2pdf from 'html2pdf.js';
import { resolveMediaUrl } from "../../../../../core/config/api";
import PrescriptionPadSlip from "../../clinic-modules/appointments/PrescriptionPadSlip";

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
    const element = document.getElementById('print-prescription');
    if (!element || !prescription) return;

    const opt = {
      margin: 0,
      filename: `prescription_${prescription?.prescriptionCode || 'report'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0, windowY: 0 },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      pagebreak: { mode: ['avoid-all'] as const }
    };

    const originalStyle = element.getAttribute('style') || '';
    element.style.display = 'block';
    element.style.visibility = 'visible';
    element.style.position = 'fixed';
    element.style.left = '-9999px';
    element.style.background = 'white';
    element.style.padding = '0';

    setTimeout(() => {
      html2pdf().set(opt).from(element).save().finally(() => {
        element.setAttribute('style', originalStyle);
      });
    }, 500);
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
                  <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', color: '#ffffff', padding: '24px', borderRadius: '8px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ width: '70px', height: '70px', background: '#fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                        {(prescription as any)?.clinic?.landingPage?.logo ? (
                          <img src={resolveMediaUrl((prescription as any).clinic.landingPage.logo)} alt="logo" style={{ maxHeight: '55px', maxWidth: '55px', objectFit: 'contain' }} onError={(e: any) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span style="font-size:11px;font-weight:700;color:#1e3a8a;text-align:center">CLINIC</span>'; }} />
                        ) : (
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#1e3a8a', textAlign: 'center' }}>CLINIC</span>
                        )}
                      </div>
                      <div>
                        <h4 style={{ color: '#ffffff', fontWeight: 700, margin: '0 0 4px 0', fontSize: '22px' }}>{(prescription as any).clinic?.name || (prescription as any).clinicName || "Clinic Center"}</h4>
                        <p style={{ color: '#e0f2fe', margin: 0, fontSize: '13px' }}>
                          <i className="ti ti-map-pin me-1" />
                          {(prescription as any).clinic?.landingPage?.address || (prescription as any).location || "Address Not Specified"}
                        </p>
                        <h6 style={{ color: '#ffffff', margin: '8px 0 2px 0', fontSize: '15px', fontWeight: 600 }}>
                          {doctor.fullName ? (doctor.fullName.startsWith('Dr.') ? doctor.fullName : `Dr. ${doctor.fullName}`) : ""}
                        </h6>
                        <p style={{ color: '#e0f2fe', margin: 0, fontSize: '13px' }}>{doctor.designation?.name || "Consultant"} · {doctor.department?.name || "Medicine"}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', color: '#fff' }}>
                      <span style={{ background: '#fff', color: '#1e3a8a', fontWeight: 'bold', padding: '5px 15px', borderRadius: '4px', fontSize: '12px', display: 'inline-block', marginBottom: '10px' }}>
                        {prescription.prescriptionCode || "#---"}
                      </span>
                      <div style={{ fontSize: '12px', opacity: 0.9 }}>
                        <div style={{ marginBottom: '4px' }}><strong>Dept:</strong> {doctor.department?.name || "General"}</div>
                        <div><strong>Date:</strong> {new Date(prescription.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                      </div>
                    </div>
                  </div>

                  {/* Patient Details */}
                  <div style={{ marginBottom: '25px' }}>
                    <h6 style={{ fontWeight: 700, textTransform: 'uppercase', borderBottom: '2px solid #0f172a', paddingBottom: '8px', marginBottom: '15px', fontSize: '12px', color: '#0f172a' }}>Patient Clinical Profile</h6>
                    <div className="table-responsive">
                      <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #0f172a', minWidth: '500px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#0f172a', color: '#fff' }}>
                            <th style={{ padding: '12px', fontSize: '12px', border: '1px solid #0f172a', textAlign: 'left' }}>PATIENT NAME</th>
                            <th style={{ padding: '12px', fontSize: '12px', border: '1px solid #0f172a', textAlign: 'center' }}>AGE / GENDER</th>
                            <th style={{ padding: '12px', fontSize: '12px', border: '1px solid #0f172a', textAlign: 'center' }}>BLOOD GROUP</th>
                            <th style={{ padding: '12px', fontSize: '12px', border: '1px solid #0f172a', textAlign: 'center' }}>PATIENT ID</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ padding: '12px', fontSize: '14px', fontWeight: 'bold', color: '#1e3a8a', border: '1px solid #334155' }}>{patient.firstName} {patient.lastName}</td>
                            <td style={{ padding: '12px', fontSize: '13px', textAlign: 'center', border: '1px solid #334155' }}>{patientAge !== null ? `${patientAge}Y / ${patient.gender || "N/A"}` : "N/A"}</td>
                            <td style={{ padding: '12px', fontSize: '13px', textAlign: 'center', border: '1px solid #334155' }}>{patient.bloodGroup || "O+"}</td>
                            <td style={{ padding: '12px', fontSize: '13px', textAlign: 'center', border: '1px solid #334155' }}>{patient.patientCode || "#---"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Medicines Table */}
                  <div style={{ textAlign: 'center', marginBottom: '25px', paddingTop: '15px' }}>
                    <h5 style={{ fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', borderBottom: '3px solid #0f172a', display: 'inline-block', paddingBottom: '8px' }}>
                      Prescription Summary
                    </h5>
                  </div>

                  <div style={{ marginBottom: '25px' }}>
                    <h6 style={{ fontWeight: 700, textTransform: 'uppercase', borderBottom: '2px solid #0f172a', paddingBottom: '8px', marginBottom: '15px', fontSize: '12px', color: '#0f172a' }}>Medicines Details</h6>
                    <div className="table-responsive">
                      <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #0f172a', minWidth: '600px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#0f172a', color: '#fff' }}>
                            <th style={{ padding: '12px', fontSize: '12px', border: '1px solid #0f172a', textAlign: 'center' }}>S.NO</th>
                            <th style={{ padding: '12px', fontSize: '12px', border: '1px solid #0f172a', textAlign: 'left' }}>Medicine Name</th>
                            <th style={{ padding: '12px', fontSize: '12px', border: '1px solid #0f172a', textAlign: 'left' }}>Dosage</th>
                            <th style={{ padding: '12px', fontSize: '12px', border: '1px solid #0f172a', textAlign: 'center' }}>Frequency</th>
                            <th style={{ padding: '12px', fontSize: '12px', border: '1px solid #0f172a', textAlign: 'center' }}>Duration</th>
                            <th style={{ padding: '12px', fontSize: '12px', border: '1px solid #0f172a', textAlign: 'center' }}>Timings</th>
                          </tr>
                        </thead>
                        <tbody>
                          {medicines.length > 0 ? medicines.map((med: any, i: number) => (
                            <tr key={med.id || i}>
                              <td style={{ padding: '12px', border: '1px solid #334155', fontSize: '13px', color: '#0f172a', textAlign: 'center' }}>{String(i + 1).padStart(2, "0")}</td>
                              <td style={{ padding: '12px', border: '1px solid #334155', fontSize: '13px', color: '#1e3a8a', fontWeight: 700 }}>{med.medicineName}</td>
                              <td style={{ padding: '12px', border: '1px solid #334155', fontSize: '13px', color: '#0f172a' }}>{med.dosage || "—"}</td>
                              <td style={{ padding: '12px', border: '1px solid #334155', fontSize: '13px', color: '#0f172a', textAlign: 'center', fontWeight: 'bold' }}>{med.frequency || "—"}</td>
                              <td style={{ padding: '12px', border: '1px solid #334155', fontSize: '13px', color: '#0f172a', textAlign: 'center' }}>{med.duration || "—"}</td>
                              <td style={{ padding: '12px', border: '1px solid #334155', fontSize: '13px', color: '#0f172a', textAlign: 'center' }}>{med.timings || "—"}</td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={6} style={{ padding: '12px', border: '1px solid #334155', fontSize: '13px', color: '#64748b', textAlign: 'center' }}>No medicines added</td>
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
        <PrescriptionPadSlip
          appointment={prescription.appointment || null}
          prescription={prescription}
        />
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
                width: 210mm !important;
                max-height: 297mm !important;
                height: auto !important;
                overflow: hidden !important;
                background: white !important;
                z-index: 99999 !important;
                padding: 0 !important;
                margin: 0 !important;
                page-break-after: avoid !important;
                page-break-inside: avoid !important;
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
