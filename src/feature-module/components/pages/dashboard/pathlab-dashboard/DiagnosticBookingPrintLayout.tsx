import React from "react";
import { createPortal } from "react-dom";
import DiagnosticPrintSlip from "./DiagnosticPrintSlip";

interface DiagnosticBookingPrintLayoutProps {
  booking: any;
  doctors?: any[];
  staff?: any[];
}

/** Portal print layout for pathlab Diagnostic Booking Slip. */
const DiagnosticBookingPrintLayout: React.FC<DiagnosticBookingPrintLayoutProps> = ({
  booking,
  doctors = [],
  staff = [],
}) => {
  if (!booking) return null;

  const printNode = (
    <div id="diagnostic-booking-print" className="diag-booking-print-root">
      <div className="diag-booking-print-page">
        <DiagnosticPrintSlip booking={booking} doctors={doctors} staff={staff} />
      </div>

      <style>{`
        .diag-booking-print-root {
          position: fixed;
          left: -10000px;
          top: 0;
          width: 210mm;
          opacity: 0;
          pointer-events: none;
          z-index: -1;
        }
        .diag-booking-print-page {
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
          body > *:not(#diagnostic-booking-print) {
            display: none !important;
          }
          #diagnostic-booking-print.diag-booking-print-root {
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
          #diagnostic-booking-print,
          #diagnostic-booking-print * {
            visibility: visible !important;
          }
          .diag-booking-print-page,
          .diag-booking-print-page .dbs-slip {
            width: 100% !important;
            max-width: 210mm !important;
            min-height: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }
        }
      `}</style>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(printNode, document.body);
};

export default DiagnosticBookingPrintLayout;
