import React from "react";
import ImageWithBasePath from "../imageWithBasePath";

interface EmptyStateProps {
    title?: string;
    message?: string;
    action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    title = "No Data Found",
    message = "We couldn't find any information here. Try adjusting your filters or adding new records.",
    action
}) => {
    return (
        <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center px-3">
            <div className="mb-4" style={{ maxWidth: '320px' }}>
                <ImageWithBasePath
                    src="assets/img/no-data.png"
                    alt="No Data"
                    className="img-fluid"
                    style={{ opacity: 0.9 }}
                />
            </div>
            <h4 className="fw-bold text-dark mb-2">{title}</h4>
            <p className="text-muted fs-14 mb-4 mx-auto" style={{ maxWidth: '400px' }}>
                {message}
            </p>
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
};

export default EmptyState;
