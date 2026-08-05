import React from 'react';

export interface ViewModalDetail {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    fullWidth?: boolean;
}

export interface ViewModalProps {
    id: string;
    title: string;
    subtitle?: string;
    headerIcon?: React.ReactNode;

    // Highlight Banner
    highlightTitle: React.ReactNode;
    highlightIcon?: React.ReactNode;
    highlightStatus?: React.ReactNode;
    highlightRightText?: string;
    highlightRightSubText?: string;
    highlightRightIcon?: React.ReactNode;
    highlightColor?: string;

    // Details Grid
    details: ViewModalDetail[];

    // Footer Actions
    onEdit?: () => void;
    editLabel?: string;
    editModalTarget?: string;
    onBack?: () => void;
    backLabel?: string;
    /** Extra actions on the left side of the footer (e.g. Generate Prescription) */
    footerStart?: React.ReactNode;
    /** Extra actions next to Close on the right */
    footerExtra?: React.ReactNode;
    children?: React.ReactNode;
}

export const ViewModal: React.FC<ViewModalProps> = ({
    id,
    title,
    subtitle,
    headerIcon,
    highlightTitle,
    highlightIcon,
    highlightStatus,
    highlightRightText,
    highlightRightSubText,
    highlightRightIcon,
    highlightColor = "#e0f2fe",
    details,
    onEdit,
    editLabel = "Edit",
    editModalTarget,
    onBack,
    backLabel = "Back",
    footerStart,
    footerExtra,
    children
}) => {
    return (
        <div className="modal fade view-modal-common" id={id} tabIndex={-1} aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "12px", overflow: "hidden" }}>

                    {/* Header — common primary theme */}
                    <div className="modal-header bg-primary text-white py-3 px-4 d-flex align-items-center justify-content-between border-0">
                        <div className="d-flex align-items-center gap-2">
                            <div
                                className="bg-white rounded-circle p-2 d-flex align-items-center justify-content-center"
                                style={{ width: 36, height: 36 }}
                            >
                                <span className="text-primary d-inline-flex" style={{ fontSize: 18 }}>
                                    {headerIcon || <i className="ti ti-eye" />}
                                </span>
                            </div>
                            <div>
                                <h5 className="modal-title fw-bold text-white mb-0">{title}</h5>
                                {subtitle && <p className="mb-0 text-white-50 fs-12">{subtitle}</p>}
                            </div>
                        </div>
                        <button
                            type="button"
                            className="btn-close btn-close-white"
                            data-bs-dismiss="modal"
                            aria-label="Close"
                        />
                    </div>

                    {/* Body */}
                    <div className="modal-body p-4 bg-light-subtle">

                        {/* Highlight Banner */}
                        <div
                            className="rounded-3 p-3 mb-3 d-flex flex-wrap align-items-center justify-content-between view-modal-card"
                            style={{ backgroundColor: "#fff" }}
                        >
                            <div className="d-flex align-items-center mb-2 mb-sm-0">
                                {highlightIcon && (
                                    <div
                                        className="d-flex align-items-center justify-content-center flex-shrink-0 me-3"
                                        style={{
                                            width: 44,
                                            height: 44,
                                            backgroundColor: highlightColor,
                                            borderRadius: 10,
                                            fontSize: 20,
                                            color: "#0f172a",
                                        }}
                                    >
                                        {highlightIcon}
                                    </div>
                                )}
                                <div>
                                    <h5 className="fw-bold text-dark fs-15 mb-1 d-flex align-items-center gap-2">
                                        {highlightTitle}
                                    </h5>
                                    {highlightStatus && <div className="mt-1">{highlightStatus}</div>}
                                </div>
                            </div>

                            {(highlightRightText || highlightRightIcon) && (
                                <div className="d-flex align-items-center">
                                    {highlightRightIcon && (
                                        <div
                                            className="d-flex align-items-center justify-content-center flex-shrink-0 me-2"
                                            style={{
                                                width: 32,
                                                height: 32,
                                                backgroundColor: "#eff6ff",
                                                borderRadius: 6,
                                                color: "#2563eb",
                                            }}
                                        >
                                            {highlightRightIcon}
                                        </div>
                                    )}
                                    <div className="text-end">
                                        <h6 className="fw-semibold text-dark fs-13 mb-0">{highlightRightText}</h6>
                                        {highlightRightSubText && (
                                            <p className="text-muted fs-12 mb-0">{highlightRightSubText}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Details Grid */}
                        <div className="row g-2">
                            {details.map((detail, index) => (
                                <div key={index} className={detail.fullWidth ? "col-12" : "col-md-6"}>
                                    <div
                                        className="d-flex align-items-start p-3 rounded-3 h-100 view-modal-card"
                                        style={{ backgroundColor: detail.fullWidth ? "#f8fafc" : "#ffffff" }}
                                    >
                                        <div
                                            className="d-flex align-items-center justify-content-center flex-shrink-0 me-2 mt-1"
                                            style={{
                                                width: 32,
                                                height: 32,
                                                backgroundColor: "#eff6ff",
                                                color: "#2563eb",
                                                borderRadius: 8,
                                            }}
                                        >
                                            {detail.icon}
                                        </div>
                                        <div>
                                            <p className="text-muted fw-semibold fs-12 mb-1 text-uppercase" style={{ letterSpacing: "0.02em" }}>
                                                {detail.label}
                                            </p>
                                            <div className="text-dark fw-semibold fs-13 text-break">
                                                {detail.value || "—"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {children}
                    </div>

                    {/* Footer */}
                    <div className="modal-footer border-0 px-4 py-3 bg-white d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <div className="d-flex align-items-center gap-2">
                            {onBack && (
                                <button
                                    type="button"
                                    className="btn btn-light d-flex align-items-center fw-medium border"
                                    onClick={onBack}
                                >
                                    <i className="ti ti-arrow-left me-2" />
                                    {backLabel}
                                </button>
                            )}
                            {footerStart}
                        </div>
                        <div className="d-flex gap-2">
                            {footerExtra}
                            {onEdit && (
                                <button
                                    type="button"
                                    className="btn btn-outline-primary fw-medium d-flex align-items-center"
                                    onClick={onEdit}
                                    data-bs-dismiss="modal"
                                    data-bs-toggle={editModalTarget ? "modal" : undefined}
                                    data-bs-target={editModalTarget}
                                >
                                    <i className="ti ti-pencil me-2" />
                                    {editLabel}
                                </button>
                            )}
                            <button type="button" className="btn btn-primary fw-medium px-4" data-bs-dismiss="modal">
                                Close
                            </button>
                        </div>
                    </div>

                    <style>{`
                        .view-modal-common .view-modal-card {
                            border: none !important;
                            box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
                        }
                    `}</style>
                </div>
            </div>
        </div>
    );
};
