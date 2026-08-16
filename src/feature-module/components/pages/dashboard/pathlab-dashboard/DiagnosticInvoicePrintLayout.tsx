import React from "react";
import { createPortal } from "react-dom";
import InvoiceSlip from "../../patient-modules/patient-invoice-details/InvoiceSlip";

interface DiagnosticInvoicePrintLayoutProps {
  invoice: any;
}

/** Dedicated print layout for pathlab Diagnostic Invoice — same InvoiceSlip as modal preview. */
const DiagnosticInvoicePrintLayout: React.FC<DiagnosticInvoicePrintLayoutProps> = ({ invoice }) => {
  if (!invoice) return null;

  const printNode = (
    <div id="diagnostic-invoice-print" className="diag-inv-print-root">
      <div className="diag-inv-print-page">
        <InvoiceSlip invoice={invoice} />
      </div>

      <style>{`
        .diag-inv-print-root {
          position: fixed;
          left: -10000px;
          top: 0;
          width: 210mm;
          opacity: 0;
          pointer-events: none;
          z-index: -1;
        }
        .diag-inv-print-page {
          width: 210mm;
          background: #fff;
        }

        @media print {
          @page { size: A4; margin: 0; }
          html, body {
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body > *:not(#diagnostic-invoice-print) {
            display: none !important;
          }
          #diagnostic-invoice-print.diag-inv-print-root {
            display: block !important;
            position: static !important;
            left: auto !important;
            top: auto !important;
            width: 100% !important;
            max-width: 210mm !important;
            margin: 0 auto !important;
            opacity: 1 !important;
            pointer-events: auto !important;
            z-index: auto !important;
            visibility: visible !important;
          }
          #diagnostic-invoice-print,
          #diagnostic-invoice-print * {
            visibility: visible !important;
          }
          .diag-inv-print-page,
          .diag-inv-print-page .inv-slip {
            width: 100% !important;
            max-width: 210mm !important;
            min-height: 0 !important;
            height: auto !important;
            overflow: visible !important;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(printNode, document.body);
};

export default DiagnosticInvoicePrintLayout;
