const AboutDocYori = () => {
  return (
    <div className="page-wrapper">
      <div className="content" style={{ padding: '32px', maxWidth: '1600px', margin: '0 auto' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        .about-docyori-wrapper {
          font-family: 'Inter', sans-serif;
          background: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(0,0,0,0.06);
          margin-bottom: 28px;
        }

        /* ─── MAIN CONTENT AREA ─── */
        .about-dy-main {
          display: grid;
          grid-template-columns: 280px 1fr 300px;
          min-height: 520px;
        }

        /* ─── LEFT PANEL ─── */
        .about-dy-left {
          background: linear-gradient(180deg, #f0f4ff 0%, #e8eeff 50%, #f5f7ff 100%);
          padding: 36px 28px 28px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          position: relative;
          overflow: hidden;
        }
        .about-dy-left::before {
          content: '';
          position: absolute;
          top: -60px;
          right: -60px;
          width: 180px;
          height: 180px;
          border-radius: 50%;
          background: rgba(99, 102, 241, 0.08);
          pointer-events: none;
        }
        .about-dy-left-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        .about-dy-left-logo-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }
        .about-dy-left-logo-icon::after {
          content: '+';
          position: absolute;
          top: -2px;
          right: -2px;
          width: 16px;
          height: 16px;
          background: #10b981;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          color: white;
          border: 2px solid #f0f4ff;
        }
        .about-dy-left-logo-icon svg {
          width: 26px;
          height: 26px;
          fill: white;
        }
        .about-dy-left-brand {
          font-size: 26px;
          font-weight: 800;
          color: #1e293b;
          letter-spacing: -0.5px;
          line-height: 1;
        }
        .about-dy-left-brand span {
          color: #10b981;
        }
        .about-dy-left-tagline {
          font-size: 11px;
          font-weight: 500;
          color: #64748b;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-top: 2px;
          margin-bottom: 28px;
        }
        .about-dy-left-divider {
          width: 40px;
          height: 3px;
          background: linear-gradient(90deg, #6366f1, #10b981);
          border-radius: 4px;
          margin-bottom: 16px;
        }
        .about-dy-left-heading {
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 4px;
        }
        .about-dy-left-heading span {
          color: #10b981;
        }
        .about-dy-left-desc {
          font-size: 12.5px;
          color: #64748b;
          line-height: 1.7;
          margin-bottom: 24px;
          max-width: 240px;
        }
        .about-dy-left-illustration {
          margin-top: auto;
          width: 100%;
          display: flex;
          justify-content: center;
          position: relative;
        }
        .about-dy-left-illustration img {
          width: 100%;
          max-width: 240px;
          height: auto;
          border-radius: 12px;
          filter: drop-shadow(0 8px 20px rgba(0,0,0,0.08));
        }
        .about-dy-monitor {
          background: #1e293b;
          border-radius: 10px;
          padding: 8px;
          width: 100%;
          max-width: 230px;
          position: relative;
        }
        .about-dy-monitor-screen {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 6px;
          padding: 12px;
          min-height: 130px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .about-dy-monitor-stand {
          width: 50px;
          height: 20px;
          background: #334155;
          margin: 0 auto;
          border-radius: 0 0 8px 8px;
        }
        .about-dy-monitor-base {
          width: 80px;
          height: 6px;
          background: #475569;
          margin: 0 auto;
          border-radius: 4px;
        }
        .about-dy-screen-bar {
          height: 6px;
          border-radius: 3px;
          background: rgba(255,255,255,0.3);
        }
        .about-dy-screen-bar.w60 { width: 60%; }
        .about-dy-screen-bar.w80 { width: 80%; }
        .about-dy-screen-bar.w45 { width: 45%; }
        .about-dy-screen-bar.w70 { width: 70%; }
        .about-dy-stethoscope {
          position: absolute;
          bottom: 30px;
          left: -15px;
          font-size: 40px;
          opacity: 0.15;
          transform: rotate(-20deg);
          color: #6366f1;
        }

        /* ─── CENTER PANEL ─── */
        .about-dy-center {
          padding: 36px 36px 28px;
          display: flex;
          flex-direction: column;
        }
        .about-dy-center-title {
          font-size: 28px;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 16px;
          letter-spacing: -0.5px;
        }
        .about-dy-center-title span {
          color: #6366f1;
        }
        .about-dy-center-desc {
          font-size: 13.5px;
          color: #475569;
          line-height: 1.8;
          margin-bottom: 28px;
          max-width: 480px;
        }
        .about-dy-center-logo-block {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 32px;
        }
        .about-dy-center-logo-circle {
          width: 90px;
          height: 90px;
          background: linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .about-dy-center-logo-circle::after {
          content: '';
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 2px dashed rgba(99, 102, 241, 0.2);
        }
        .about-dy-center-logo-inner {
          width: 52px;
          height: 52px;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
        }
        .about-dy-center-logo-text {
          margin-left: 16px;
        }
        .about-dy-center-logo-text h3 {
          font-size: 20px;
          font-weight: 800;
          color: #1e293b;
          margin: 0;
          letter-spacing: -0.3px;
        }
        .about-dy-center-logo-text h3 span {
          color: #10b981;
        }
        .about-dy-center-logo-text p {
          font-size: 11px;
          color: #6366f1;
          font-weight: 600;
          margin: 2px 0 0;
          letter-spacing: 0.5px;
        }

        /* Why DocYori */
        .about-dy-why-label {
          font-size: 11px;
          font-weight: 700;
          color: #6366f1;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .about-dy-why-label::before {
          content: '';
          width: 24px;
          height: 2px;
          background: #6366f1;
          border-radius: 2px;
        }
        .about-dy-why-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }
        .about-dy-why-item {
          text-align: center;
          padding: 16px 8px;
        }
        .about-dy-why-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 10px;
          font-size: 20px;
        }
        .about-dy-why-text {
          font-size: 12px;
          font-weight: 600;
          color: #334155;
          line-height: 1.4;
        }

        /* Key Modules */
        .about-dy-modules-label {
          font-size: 11px;
          font-weight: 700;
          color: #6366f1;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .about-dy-modules-label::before {
          content: '';
          width: 24px;
          height: 2px;
          background: #6366f1;
          border-radius: 2px;
        }
        .about-dy-modules-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        .about-dy-module-item {
          text-align: center;
          padding: 14px 6px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #f1f5f9;
          transition: all 0.2s ease;
        }
        .about-dy-module-item:hover {
          background: #f1f5f9;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
        }
        .about-dy-module-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 8px;
          font-size: 17px;
        }
        .about-dy-module-text {
          font-size: 11px;
          font-weight: 600;
          color: #475569;
          line-height: 1.3;
        }

        /* Bottom modules row */
        .about-dy-modules-grid-2 {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
        }

        /* ─── RIGHT PANEL ─── */
        .about-dy-right {
          padding: 36px 24px 28px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: #fafbff;
          border-left: 1px solid #f1f5f9;
        }
        .about-dy-version-card {
          background: #ffffff;
          border: 1px solid #e8ecf4;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .about-dy-version-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .about-dy-version-info h4 {
          font-size: 22px;
          font-weight: 800;
          color: #1e293b;
          margin: 0;
          letter-spacing: -0.3px;
        }
        .about-dy-version-info p {
          font-size: 11px;
          margin: 0;
        }
        .about-dy-version-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
          margin-top: 4px;
        }
        .about-dy-updated-card {
          background: #ffffff;
          border: 1px solid #e8ecf4;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .about-dy-updated-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .about-dy-updated-info h4 {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }
        .about-dy-updated-info p {
          font-size: 11px;
          color: #94a3b8;
          margin: 2px 0 0;
        }
        .about-dy-updated-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
          margin-top: 6px;
          background: #dcfce7;
          color: #059669;
        }
        .about-dy-quote-card {
          background: #ffffff;
          border: 1px solid #e8ecf4;
          border-radius: 16px;
          padding: 20px;
          flex: 1;
        }
        .about-dy-quote-mark {
          font-size: 36px;
          color: #cbd5e1;
          line-height: 1;
          margin-bottom: 8px;
          font-family: Georgia, serif;
        }
        .about-dy-quote-text {
          font-size: 12.5px;
          color: #475569;
          line-height: 1.7;
          font-style: italic;
        }
        .about-dy-built-card {
          background: linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%);
          border: 1px solid #c7d2fe;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .about-dy-built-icon {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }
        .about-dy-built-text h4 {
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }
        .about-dy-built-text p {
          font-size: 12px;
          color: #6366f1;
          font-weight: 600;
          margin: 2px 0 0;
        }

        /* ─── FOOTER ─── */
        .about-dy-footer {
          background: #1e293b;
          padding: 16px 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-radius: 0 0 20px 20px;
        }
        .about-dy-footer-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .about-dy-footer-left span {
          font-size: 10px;
          color: #94a3b8;
          font-weight: 500;
        }
        .about-dy-footer-brand {
          font-size: 14px;
          font-weight: 700;
          color: #f1f5f9;
        }
        .about-dy-footer-brand span {
          color: #f97316;
        }
        .about-dy-footer-links {
          display: flex;
          align-items: center;
          gap: 28px;
        }
        .about-dy-footer-link {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #94a3b8;
          text-decoration: none;
          transition: color 0.2s;
        }
        .about-dy-footer-link:hover {
          color: #e2e8f0;
        }
        .about-dy-footer-link i {
          font-size: 14px;
          color: #6366f1;
        }
        .about-dy-footer-copy {
          font-size: 11px;
          color: #64748b;
        }

        /* ─── RESPONSIVE ─── */
        @media (max-width: 1199.98px) {
          .about-dy-main {
            grid-template-columns: 1fr;
          }
          .about-dy-left {
            display: none;
          }
          .about-dy-right {
            border-left: none;
            border-top: 1px solid #f1f5f9;
          }
          .about-dy-why-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .about-dy-modules-grid,
          .about-dy-modules-grid-2 {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 767.98px) {
          .about-dy-center {
            padding: 24px 20px;
          }
          .about-dy-modules-grid,
          .about-dy-modules-grid-2 {
            grid-template-columns: repeat(2, 1fr);
          }
          .about-dy-footer {
            flex-direction: column;
            gap: 12px;
            text-align: center;
            padding: 16px 20px;
          }
          .about-dy-footer-links {
            flex-wrap: wrap;
            justify-content: center;
            gap: 16px;
          }
        }
      `}</style>

      <div className="about-docyori-wrapper">
        <div className="about-dy-main">
          {/* ─── LEFT PANEL ─── */}
          <div className="about-dy-left">
            <div className="about-dy-left-logo">
              <div className="about-dy-left-logo-icon">
                <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM13 15H11V13H9V11H11V9H13V11H15V13H13V15Z"/>
                </svg>
              </div>
              <div>
                <div className="about-dy-left-brand">Doc<span>Yori</span></div>
              </div>
            </div>
            <div className="about-dy-left-tagline">Smart Clinic Management</div>

            <div className="about-dy-left-divider"></div>

            <div className="about-dy-left-heading">
              Manage Smarter.<br />
              <span>Care Better.</span>
            </div>
            <div className="about-dy-left-desc">
              DocYori helps clinics and healthcare centers streamline operations, manage patients efficiently and deliver better care.
            </div>

            {/* Monitor Illustration */}
            <div className="about-dy-left-illustration">
              <div>
                <div className="about-dy-monitor">
                  <div className="about-dy-monitor-screen">
                    <div className="about-dy-screen-bar w80"></div>
                    <div className="about-dy-screen-bar w60"></div>
                    <div className="about-dy-screen-bar w45"></div>
                    <div className="about-dy-screen-bar w70"></div>
                    <div className="about-dy-screen-bar w60"></div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <div style={{ width: '40%', height: '30px', background: 'rgba(255,255,255,0.15)', borderRadius: '4px' }}></div>
                      <div style={{ width: '60%', height: '30px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                  <div className="about-dy-monitor-stand"></div>
                  <div className="about-dy-monitor-base"></div>
                </div>
                <div className="about-dy-stethoscope">
                  <i className="ti ti-stethoscope"></i>
                </div>
              </div>
            </div>
          </div>

          {/* ─── CENTER PANEL ─── */}
          <div className="about-dy-center">
            <div className="about-dy-center-title">
              About <span>DocYori</span>
            </div>

            <div className="about-dy-center-desc">
              DocYori is an intelligent and comprehensive clinic management platform built to simplify the daily operations of clinics, hospitals and healthcare centers. From patient appointments to billing, prescriptions to reports – everything is managed in one secure, smart and easy-to-use system.
            </div>

            {/* Logo Block */}
            <div className="about-dy-center-logo-block">
              <div className="about-dy-center-logo-circle">
                <div className="about-dy-center-logo-inner">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM13 15H11V13H9V11H11V9H13V11H15V13H13V15Z"/>
                  </svg>
                </div>
              </div>
              <div className="about-dy-center-logo-text">
                <h3>Doc<span>Yori</span></h3>
                <p>Smart Clinic Management</p>
              </div>
            </div>

            {/* WHY DOCYORI */}
            <div className="about-dy-why-label">WHY DOCYORI?</div>
            <div className="about-dy-why-grid">
              <div className="about-dy-why-item">
                <div className="about-dy-why-icon" style={{ background: '#dcfce7', color: '#059669' }}>
                  <i className="ti ti-shield-check"></i>
                </div>
                <div className="about-dy-why-text">Secure<br />& Reliable</div>
              </div>
              <div className="about-dy-why-item">
                <div className="about-dy-why-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                  <i className="ti ti-bolt"></i>
                </div>
                <div className="about-dy-why-text">Fast<br />& Efficient</div>
              </div>
              <div className="about-dy-why-item">
                <div className="about-dy-why-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
                  <i className="ti ti-cloud"></i>
                </div>
                <div className="about-dy-why-text">Cloud<br />Powered</div>
              </div>
              <div className="about-dy-why-item">
                <div className="about-dy-why-icon" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
                  <i className="ti ti-brain"></i>
                </div>
                <div className="about-dy-why-text">Smart<br />& Scalable</div>
              </div>
            </div>

            {/* KEY MODULES */}
            <div className="about-dy-modules-label">KEY MODULES</div>
            <div className="about-dy-modules-grid">
              <div className="about-dy-module-item">
                <div className="about-dy-module-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
                  <i className="ti ti-users"></i>
                </div>
                <div className="about-dy-module-text">Patient<br />Management</div>
              </div>
              <div className="about-dy-module-item">
                <div className="about-dy-module-icon" style={{ background: '#dcfce7', color: '#059669' }}>
                  <i className="ti ti-calendar-event"></i>
                </div>
                <div className="about-dy-module-text">Appointment<br />Management</div>
              </div>
              <div className="about-dy-module-item">
                <div className="about-dy-module-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                  <i className="ti ti-stethoscope"></i>
                </div>
                <div className="about-dy-module-text">Doctor<br />Management</div>
              </div>
              <div className="about-dy-module-item">
                <div className="about-dy-module-icon" style={{ background: '#fce7f3', color: '#db2777' }}>
                  <i className="ti ti-pill"></i>
                </div>
                <div className="about-dy-module-text">Pharmacy<br />Management</div>
              </div>
              <div className="about-dy-module-item">
                <div className="about-dy-module-icon" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
                  <i className="ti ti-microscope"></i>
                </div>
                <div className="about-dy-module-text">Pathology<br />Management</div>
              </div>
            </div>

            <div className="about-dy-modules-grid-2">
              <div className="about-dy-module-item">
                <div className="about-dy-module-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                  <i className="ti ti-receipt"></i>
                </div>
                <div className="about-dy-module-text">Accounts<br />& Finance</div>
              </div>
              <div className="about-dy-module-item">
                <div className="about-dy-module-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                  <i className="ti ti-building"></i>
                </div>
                <div className="about-dy-module-text">HRM<br />& Payroll</div>
              </div>
              <div className="about-dy-module-item">
                <div className="about-dy-module-icon" style={{ background: '#dcfce7', color: '#059669' }}>
                  <i className="ti ti-id-badge-2"></i>
                </div>
                <div className="about-dy-module-text">Staff<br />Management</div>
              </div>
              <div className="about-dy-module-item">
                <div className="about-dy-module-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
                  <i className="ti ti-chart-bar"></i>
                </div>
                <div className="about-dy-module-text">Reports<br />& Analytics</div>
              </div>
              <div className="about-dy-module-item">
                <div className="about-dy-module-icon" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
                  <i className="ti ti-apps"></i>
                </div>
                <div className="about-dy-module-text">More<br />Modules</div>
              </div>
            </div>
          </div>

          {/* ─── RIGHT PANEL ─── */}
          <div className="about-dy-right">
            {/* Version Card */}
            <div className="about-dy-version-card">
              <div className="about-dy-version-icon" style={{ background: '#ede9fe', color: '#6366f1' }}>
                <i className="ti ti-package"></i>
              </div>
              <div className="about-dy-version-info">
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 2px', fontWeight: 500 }}>Current Version</p>
                <h4>v 2.4.0</h4>
                <div className="about-dy-version-badge" style={{ background: '#dcfce7', color: '#059669' }}>
                  Stable Release
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="about-dy-updated-card">
              <div className="about-dy-updated-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
                <i className="ti ti-calendar-time"></i>
              </div>
              <div className="about-dy-updated-info">
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 2px', fontWeight: 500 }}>Last Updated</p>
                <h4>26 June 2026</h4>
                <p>10:30 AM</p>
                <div className="about-dy-updated-badge">
                  <i className="ti ti-check" style={{ fontSize: '10px', marginRight: '3px' }}></i> System is up to date
                </div>
              </div>
            </div>

            {/* Quote */}
            <div className="about-dy-quote-card">
              <div className="about-dy-quote-mark">"</div>
              <div className="about-dy-quote-text">
                Our mission is to simplify healthcare management so you can focus on what matters most – your patients.
              </div>
            </div>

            {/* Built for Healthcare */}
            <div className="about-dy-built-card">
              <div className="about-dy-built-icon">
                <i className="ti ti-check" style={{ color: 'white', fontSize: '20px' }}></i>
              </div>
              <div className="about-dy-built-text">
                <h4>Built for Healthcare.</h4>
                <p>Designed for You.</p>
              </div>
            </div>

            {/* Adaptable text */}
            <div style={{ padding: '8px 4px' }}>
              <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.7, margin: 0 }}>
                Whether you run a small clinic or a multi-specialty hospital, DocYori adapts to your workflow and grows with your needs.
              </p>
            </div>
          </div>
        </div>

        {/* ─── FOOTER ─── */}
        <div className="about-dy-footer">
          <div className="about-dy-footer-left">
            <span>Product by</span>
            <div className="about-dy-footer-brand">Soft<span>FYR</span></div>
            <span style={{ fontSize: '9px', color: '#64748b' }}>Technologies</span>
          </div>
          <div className="about-dy-footer-links">
            <a href="https://www.softfyr.com" className="about-dy-footer-link" target="_blank" rel="noreferrer">
              <i className="ti ti-world"></i> www.softfyr.com
            </a>
            <a href="mailto:info@softfyr.com" className="about-dy-footer-link">
              <i className="ti ti-mail"></i> info@softfyr.com
            </a>
            <a href="tel:+917301628383" className="about-dy-footer-link">
              <i className="ti ti-phone"></i> +91 730 162 8383
            </a>
          </div>
          <div className="about-dy-footer-copy">
            © 2026 SoftFYR Technologies.<br />All rights reserved.
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default AboutDocYori;
