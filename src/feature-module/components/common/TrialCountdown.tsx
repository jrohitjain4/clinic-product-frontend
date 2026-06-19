import { useState, useEffect } from 'react';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { all_routes } from '../../routes/all_routes';

const premiumStyles = `
  .premium-dropdown .ant-dropdown-menu {
    border-radius: 12px !important;
    padding: 8px !important;
    border: 1px solid #e2e8f0 !important;
  }
  .hover-shadow {
    transition: all 0.3s ease !important;
  }
  .hover-shadow:hover {
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2) !important;
    transform: translateY(-1px);
  }
`;

const TrialCountdown = () => {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    if (user?.role === 'PATIENT') return null;

    const [timeLeft, setTimeLeft] = useState<string>("");
    const [isExpired, setIsExpired] = useState(false);
    const [isPremium, setIsPremium] = useState(false);
    const [packageName, setPackageName] = useState("");
    const [expiresAt, setExpiresAt] = useState<string | null>(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const userStr = localStorage.getItem("user");
            if (!userStr) return;

            const user = JSON.parse(userStr);
            const status = user?.clinic?.status;

            if (status && !['TRIAL', 'TRIAL_EXPIRED', 'TRIAL_COMPLETED_NOT_UPGRADED'].includes(status)) {
                setIsPremium(true);
                setPackageName(
                    user?.subscription?.package?.name ||
                    user?.clinic?.Package?.name ||
                    user?.clinic?.package?.name ||
                    "Premium Plan"
                );
                setExpiresAt(user?.clinic?.packageExpiresAt || user?.subscription?.expiresAt || null);
                return;
            }

            const expiresAt = user?.clinic?.packageExpiresAt;

            if (!expiresAt) return;

            const difference = +new Date(expiresAt) - +new Date();

            if (difference <= 0) {
                setTimeLeft("00:00:00");
                setIsExpired(true);
                // Trigger global event for blur
                window.dispatchEvent(new Event('subscription-expired'));
                return;
            }

            const hours = Math.floor(difference / (1000 * 60 * 60));
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);

            setTimeLeft(
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
            );
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, []);

    if (isPremium) {
        const items: MenuProps['items'] = [
            {
                key: '1',
                label: (
                    <div className="p-2" style={{ width: '280px' }}>
                        <div className="d-flex align-items-center mb-3">
                            <div className="flex-shrink-0 bg-success-subtle p-2 rounded-circle me-3 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                                <i className="ti ti-crown text-success fs-20" />
                            </div>
                            <div className="flex-grow-1">
                                <h6 className="mb-0 fw-bold fs-15 text-dark">{packageName}</h6>
                                <span className="badge bg-success-subtle text-success border border-success-subtle fs-11 px-2 py-0.5 mt-1 d-inline-flex align-items-center">
                                    <i className="ti ti-circle-filled me-1 fs-8" />
                                    Active Plan
                                </span>
                            </div>
                        </div>

                        <div className="border rounded-3 p-3 bg-light-subtle">
                            <div className="d-flex justify-content-between mb-2 pb-2 border-bottom">
                                <span className="text-muted fs-12">Next Billing</span>
                                <span className="fw-semibold fs-12 text-primary">{expiresAt ? dayjs(expiresAt).format('DD MMM, YYYY') : 'Never'}</span>
                            </div>
                            <div className="mt-2">
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="text-muted fs-11 uppercase">Storage Usage</span>
                                    <span className="fw-bold fs-11">85%</span>
                                </div>
                                <div className="progress rounded-pill" style={{ height: '4px' }}>
                                    <div className="progress-bar bg-primary" style={{ width: '85%' }} />
                                </div>
                            </div>
                        </div>

                        <div className="mt-3">
                            <Link
                                to="/super-admin/packages"
                                className="btn btn-primary w-100 rounded-pill fw-bold py-2 shadow-sm d-flex align-items-center justify-content-center gap-2"
                                style={{
                                    background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
                                    border: 'none',
                                    fontSize: '13px',
                                }}
                            >
                                <i className="ti ti-refresh fs-14" />
                                Renew Plan
                            </Link>
                        </div>
                    </div>
                ),
            }
        ];

        return (
            <>
                <style>{premiumStyles}</style>
                <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight" overlayClassName="premium-dropdown shadow-lg border-0">
                    <div
                        className="d-flex align-items-center px-3 py-1.5 rounded-pill me-3 shadow-sm border bg-success-subtle border-success text-success-emphasis cursor-pointer hover-shadow transition-all text-nowrap flex-shrink-0"
                        style={{ fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        <i className="ti ti-rosette-discount-check-filled me-2" style={{ fontSize: '16px' }} />
                        <span className="me-1">{packageName.toUpperCase()}</span>
                        <i className="ti ti-chevron-down fs-11" />
                    </div>
                </Dropdown>
            </>
        );
    }

    if (!timeLeft) return null;

    return (
        <div className={`d-flex align-items-center px-3 py-1.5 rounded-pill me-3 shadow-sm border text-nowrap flex-shrink-0 ${isExpired ? 'bg-danger-subtle border-danger text-danger' : 'bg-warning-subtle border-warning text-warning-emphasis'}`} style={{ fontSize: '13px', fontWeight: 'bold' }}>
            <i className={`ti ti-clock-hour-4 me-2 ${!isExpired && 'animate-spin'}`} style={{ fontSize: '16px' }} />
            <span>{isExpired ? 'TRIAL EXPIRED' : `Trial Ends In: ${timeLeft}`}</span>
        </div>
    );
};

export default TrialCountdown;
