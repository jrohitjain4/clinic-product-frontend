
const FloatingActions = () => {
    const siteSettings = { whatsapp: "+919876543210", phone: "+919876543210" };

    return (
        <div className="dy-floating-actions">
            <a
                href={`https://wa.me/${siteSettings.whatsapp.replace('+', '')}`}
                target="_blank"
                rel="noreferrer"
                className="float-btn whatsapp"
                title="WhatsApp Us"
            >
                <i className="ti ti-brand-whatsapp" />
            </a>
            <a
                href={`tel:${siteSettings.phone}`}
                className="float-btn phone"
                title="Call Us"
            >
                <i className="ti ti-phone" />
            </a>
        </div>
    );
};

export default FloatingActions;
