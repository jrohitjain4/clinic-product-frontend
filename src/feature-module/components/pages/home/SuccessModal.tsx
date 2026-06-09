import React from "react";
import { Modal } from "react-bootstrap";

interface SuccessModalProps {
    show: boolean;
    onHide: () => void;
    title?: string;
    message?: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
    show,
    onHide,
    title = "Demo Request Submitted!",
    message = "We will reach you before your preferred time."
}) => {
    return (
        <Modal show={show} onHide={onHide} centered backdrop="static" size="sm">
            <div className="modal-content border-0 shadow-lg text-center p-4" style={{ borderRadius: '16px' }}>
                <div className="d-flex justify-content-center mb-3">
                    <div 
                        className="d-flex align-items-center justify-content-center rounded-circle"
                        style={{ 
                            width: '80px', 
                            height: '80px', 
                            backgroundColor: '#d1fae5', 
                            color: '#10b981',
                            fontSize: '2.5rem',
                            animation: 'bounceIn 0.6s ease'
                        }}
                    >
                        <i className="ti ti-circle-check" />
                    </div>
                </div>
                <h4 className="fw-bold mb-2 text-dark" style={{ fontSize: '1.25rem' }}>{title}</h4>
                <p className="text-muted mb-4 px-2" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{message}</p>
                <div className="d-grid">
                    <button 
                        type="button" 
                        className="btn btn-primary py-2 fw-semibold" 
                        style={{ borderRadius: '8px' }}
                        onClick={onHide}
                    >
                        Okay, Got It
                    </button>
                </div>
            </div>
            
            <style>{`
                @keyframes bounceIn {
                    from, 20%, 40%, 60%, 80%, to {
                        animation-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
                    }
                    0% {
                        opacity: 0;
                        transform: scale3d(0.3, 0.3, 0.3);
                    }
                    20% {
                        transform: scale3d(1.1, 1.1, 1.1);
                    }
                    40% {
                        transform: scale3d(0.9, 0.9, 0.9);
                    }
                    60% {
                        opacity: 1;
                        transform: scale3d(1.03, 1.03, 1.03);
                    }
                    80% {
                        transform: scale3d(0.97, 0.97, 0.97);
                    }
                    to {
                        opacity: 1;
                        transform: scale3d(1, 1, 1);
                    }
                }
            `}</style>
        </Modal>
    );
};
