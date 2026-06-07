import React from 'react';
import { Link } from "react-router-dom";
import { all_routes } from "../../../routes/all_routes";

interface CtaBannerProps {
  title?: string;
  subtitle?: string;
}

const CtaBanner: React.FC<CtaBannerProps> = ({ 
  title = "Ready To Digitize Your Clinic?", 
  subtitle = "Join modern healthcare providers who trust DocYori to simplify operations and improve patient care." 
}) => {
  return (
    <section className="py-4 bg-white">
      <div className="container" style={{ maxWidth: '1320px' }}>
        <div className="rounded-4 p-4 p-md-5 d-flex align-items-center justify-content-between flex-wrap gap-4 shadow-sm" style={{ background: 'linear-gradient(90deg, #1d4ed8 0%, #06b6d4 100%)' }}>
          <div className="d-flex align-items-center gap-4">
            <div className="d-none d-md-flex bg-white rounded p-3 align-items-center justify-content-center shadow-sm">
              <img src="/hero-image.png" alt="CTA" style={{ width: 100, height: 'auto', borderRadius: '4px' }} />
            </div>
            <div>
              <h2 className="text-white fw-bold mb-2" style={{ fontSize: '2.2rem', fontWeight: 800 }}>{title}</h2>
              <p className="text-white-50 mb-0 fs-15">{subtitle}</p>
            </div>
          </div>
          <div className="d-flex gap-3">
            <Link to={all_routes.registerbasic} className="btn btn-light fw-bold px-4 py-2 d-flex align-items-center justify-content-center" style={{ borderRadius: '8px', minHeight: '44px', color: '#0f172a' }}>
              Start Free Trial
            </Link>
            <Link to="#demo" className="btn btn-light fw-bold px-4 py-2 d-flex align-items-center justify-content-center shadow-sm" style={{ borderRadius: '8px', minHeight: '44px', color: '#0f172a' }}>
              Book Demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaBanner;
