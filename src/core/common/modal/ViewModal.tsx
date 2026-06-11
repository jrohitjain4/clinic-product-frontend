import React from 'react';
import { Link } from 'react-router-dom';

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
    highlightStatus?: React.ReactNode; // e.g., badge component
    highlightRightText?: string;
    highlightRightSubText?: string;
    highlightRightIcon?: React.ReactNode;
    highlightColor?: string; // CSS color string (e.g., "#e0f2fe", "#dcfce7", "#f3e8ff")

    // Details Grid
    details: ViewModalDetail[];

    // Footer Actions
    onEdit?: () => void;
    editLabel?: string;
    editModalTarget?: string; // e.g. "#edit_holiday"
    onBack?: () => void; // Optional back button function
    backLabel?: string;
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
    highlightColor = "#e0f2fe", // Default light blueish
    details,
    onEdit,
    editLabel = "Edit",
    editModalTarget,
    onBack,
    backLabel = "Back"
}) => {
    return (
        <div className="modal fade" id={id} tabIndex={-1} aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px", overflow: "hidden" }}>
                    
                    {/* Header */}
                    <div className="modal-header border-0 d-flex align-items-center position-relative pb-2" style={{ backgroundColor: "#fbfbfe" }}>
                        {/* Decorative background shape */}
                        <div className="position-absolute top-0 end-0 h-100" style={{ width: "30%", background: "linear-gradient(to right, transparent, #ede9fe)", opacity: 0.5, borderBottomLeftRadius: "100%" }}></div>
                        
                        <div className="d-flex align-items-center w-100 position-relative z-1">
                            <div className="d-flex align-items-center justify-content-center flex-shrink-0 me-3" style={{ width: "40px", height: "40px", backgroundColor: "#f3e8ff", color: "#6d28d9", borderRadius: "50%", fontSize: "18px" }}>
                                {headerIcon || <i className="ti ti-file-text" />}
                            </div>
                            <div>
                                <h4 className="modal-title fw-bold text-dark mb-0 fs-16">{title}</h4>
                                {subtitle && <p className="text-dark fs-13 mb-0">{subtitle}</p>}
                            </div>
                        </div>
                        <button type="button" className="btn-close flex-shrink-0 position-relative z-1 bg-light rounded-circle p-2" data-bs-dismiss="modal" aria-label="Close" style={{ fontSize: "10px" }}></button>
                    </div>

                    {/* Body */}
                    <div className="modal-body p-3 bg-white">
                        
                        {/* Highlight Banner */}
                        <div className="rounded-3 p-2 mb-3 d-flex flex-wrap align-items-center justify-content-between border" style={{ backgroundColor: "#f8fafc", borderColor: "#cbd5e1" }}>
                            <div className="d-flex align-items-center mb-2 mb-sm-0">
                                {highlightIcon && (
                                    <div className="d-flex align-items-center justify-content-center flex-shrink-0 me-3" style={{ width: "50px", height: "50px", backgroundColor: highlightColor, borderRadius: "10px", fontSize: "24px", color: "#0f172a" }}>
                                        {highlightIcon}
                                    </div>
                                )}
                                <div>
                                    <h5 className="fw-bold text-dark fs-16 mb-1 d-flex align-items-center gap-2">
                                        {highlightTitle}
                                    </h5>
                                    {highlightStatus && (
                                        <div className="mt-1">{highlightStatus}</div>
                                    )}
                                </div>
                            </div>
                            
                            {(highlightRightText || highlightRightIcon) && (
                                <div className="d-flex align-items-center">
                                    {highlightRightIcon && (
                                        <div className="d-flex align-items-center justify-content-center flex-shrink-0 me-2" style={{ width: "32px", height: "32px", backgroundColor: "#f1f5f9", borderRadius: "6px", color: "#64748b" }}>
                                            {highlightRightIcon}
                                        </div>
                                    )}
                                    <div className="text-end">
                                        <h6 className="fw-semibold text-dark fs-13 mb-0">{highlightRightText}</h6>
                                        {highlightRightSubText && <p className="text-dark fs-12 mb-0">{highlightRightSubText}</p>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Details Grid */}
                        <div className="row g-2">
                            {details.map((detail, index) => (
                                <div key={index} className={detail.fullWidth ? "col-12" : "col-md-6"}>
                                    <div className="d-flex align-items-start p-2 rounded-3 h-100" style={{ border: "1px solid #cbd5e1", backgroundColor: detail.fullWidth ? "#fbfbfe" : "#ffffff" }}>
                                        <div className="d-flex align-items-center justify-content-center flex-shrink-0 me-2 mt-1" style={{ width: "32px", height: "32px", backgroundColor: "#f3e8ff", color: "#6d28d9", borderRadius: "6px" }}>
                                            {detail.icon}
                                        </div>
                                        <div>
                                            <p className="text-dark fw-bold fs-12 mb-1">{detail.label}</p>
                                            <div className="text-dark fw-semibold fs-13 text-break">
                                                {detail.value || "—"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="modal-footer border-top px-4 py-3 bg-white d-flex align-items-center justify-content-between">
                        <div>
                            {onBack && (
                                <button type="button" className="btn btn-light d-flex align-items-center fw-medium border" onClick={onBack}>
                                    <i className="ti ti-arrow-left me-2" />
                                    {backLabel}
                                </button>
                            )}
                        </div>
                        <div className="d-flex gap-2">
                            {onEdit && (
                                <button type="button" className="btn btn-outline-primary fw-medium d-flex align-items-center" onClick={onEdit} data-bs-dismiss="modal" data-bs-toggle={editModalTarget ? "modal" : undefined} data-bs-target={editModalTarget}>
                                    <i className="ti ti-pencil me-2" />
                                    {editLabel}
                                </button>
                            )}
                            <button type="button" className="btn btn-primary fw-medium px-4" data-bs-dismiss="modal">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
