import { useState, useEffect, useCallback } from 'react';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { all_routes } from '../../routes/all_routes';
import { apiUrl } from '../../../core/config/api';
import { setLocalStorageUser } from '../../../core/utils/apiClient';

const premiumStyles = `
  .premium-dropdown .ant-dropdown-menu {
    border-radius: 16px !important;
    padding: 10px !important;
    border: 1px solid #e2e8f0 !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08) !important;
  }
  .hover-shadow {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }
  .hover-shadow:hover {
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.25) !important;
    transform: translateY(-1px);
  }
  .plan-info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    font-size: 12px;
  }
`;

const formatDuration = (days?: number | null, startsAt?: string | null, expiresAt?: string | null) => {
  let totalDays = days;
  if ((!totalDays || totalDays === 30) && startsAt && expiresAt) {
    const diff = Math.round(dayjs(expiresAt).diff(dayjs(startsAt), 'day', true));
    if (diff > 0) totalDays = diff;
  }

  if (!totalDays || totalDays <= 0) return "1 Month (30 Days)";

  if (totalDays >= 350) {
    const years = Math.round(totalDays / 365);
    return `${years} Year${years > 1 ? 's' : ''} (${totalDays} Days)`;
  }
  if (totalDays >= 25) {
    const months = Math.round(totalDays / 30);
    return `${months} Month${months > 1 ? 's' : ''} (${totalDays} Days)`;
  }
  return `${totalDays} Days`;
};

const TrialCountdown = () => {
  const [user, setUser] = useState<any>(() => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  });

  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [packageName, setPackageName] = useState("Premium Plan");
  const [durationDays, setDurationDays] = useState<number>(30);
  const [startsAt, setStartsAt] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number>(0);

  // Sync latest user profile from backend
  const refreshUserFromBackend = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(apiUrl("/api/auth/me"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const userObj = data.user || (data.id ? data : null);
        if (userObj) {
          setLocalStorageUser(userObj);
          setUser(userObj);
        }
      }
    } catch (e) {
      console.error("Failed to refresh user plan info", e);
    }
  }, []);

  useEffect(() => {
    refreshUserFromBackend();

    const handlePlanUpdate = () => {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    };

    window.addEventListener("clinic-subscription-updated", handlePlanUpdate);
    window.addEventListener("storage", handlePlanUpdate);
    return () => {
      window.removeEventListener("clinic-subscription-updated", handlePlanUpdate);
      window.removeEventListener("storage", handlePlanUpdate);
    };
  }, [refreshUserFromBackend]);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'PATIENT') return;

    const status = user?.clinic?.status;
    const pkg = user?.clinic?.package || user?.clinic?.Package || user?.subscription?.package;
    const pkgName = pkg?.name || user?.clinic?.packageName || (status === 'TRIAL' ? "Free Trial" : "Premium Plan");
    const pkgExpiresAt = user?.clinic?.packageExpiresAt || user?.subscription?.expiresAt || null;
    const pkgStartsAt = user?.clinic?.packageStartsAt || user?.clinic?.createdAt || null;

    let computedDays = pkg?.durationInDays || user?.clinic?.packageDurationInDays;
    if ((!computedDays || computedDays === 30) && pkgStartsAt && pkgExpiresAt) {
      const diff = Math.round(dayjs(pkgExpiresAt).diff(dayjs(pkgStartsAt), 'day', true));
      if (diff > 0) computedDays = diff;
    }
    if (!computedDays && pkgExpiresAt) {
      const diffFromNow = Math.round(dayjs(pkgExpiresAt).diff(dayjs(), 'day', true));
      if (diffFromNow > 200) computedDays = 365;
      else if (diffFromNow > 45) computedDays = Math.round(diffFromNow / 30) * 30;
      else if (diffFromNow > 0) computedDays = Math.max(30, diffFromNow);
    }
    const pkgDuration = computedDays || 30;

    setPackageName(pkgName);
    setDurationDays(pkgDuration);
    setStartsAt(pkgStartsAt);
    setExpiresAt(pkgExpiresAt);

    if (pkgExpiresAt) {
      const diffDays = dayjs(pkgExpiresAt).diff(dayjs(), 'day');
      setDaysRemaining(Math.max(0, diffDays));
    }

    if (status && !['TRIAL', 'TRIAL_EXPIRED', 'TRIAL_COMPLETED_NOT_UPGRADED'].includes(status)) {
      setIsPremium(true);
    } else {
      setIsPremium(false);
    }

    const calculateTimeLeft = () => {
      if (!pkgExpiresAt) return;
      const difference = +new Date(pkgExpiresAt) - +new Date();

      if (difference <= 0) {
        setTimeLeft("00:00:00");
        setIsExpired(true);
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
  }, [user]);

  if (!user || user.role === 'PATIENT') return null;

  if (isPremium) {
    const items: MenuProps['items'] = [
      {
        key: '1',
        label: (
          <div className="p-2" style={{ width: '310px' }}>
            {/* Header: Crown & Name */}
            <div className="d-flex align-items-center mb-3">
              <div 
                className="flex-shrink-0 bg-success-subtle p-2 rounded-circle me-3 d-flex align-items-center justify-content-center" 
                style={{ width: '48px', height: '48px', border: '1px solid rgba(16, 185, 129, 0.2)' }}
              >
                <i className="ti ti-crown text-success fs-22" />
              </div>
              <div className="flex-grow-1">
                <h6 className="mb-0 fw-bold fs-15 text-dark" style={{ letterSpacing: '-0.2px' }}>{packageName}</h6>
                <div className="d-flex align-items-center gap-2 mt-1">
                  <span className="badge bg-success-subtle text-success border border-success-subtle fs-11 px-2 py-0.5 d-inline-flex align-items-center rounded-pill fw-semibold">
                    <i className="ti ti-circle-filled me-1 fs-8" />
                    Active Plan
                  </span>
                  <span className="badge bg-light text-muted border fs-11 px-2 py-0.5 rounded-pill">
                    {formatDuration(durationDays, startsAt, expiresAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Details Box */}
            <div className="border rounded-3 p-3 bg-light-subtle mb-3">
              <div className="plan-info-row border-bottom pb-2 mb-1">
                <span className="text-muted">Plan Duration:</span>
                <span className="fw-bold text-dark">{formatDuration(durationDays, startsAt, expiresAt)}</span>
              </div>
              {startsAt && (
                <div className="plan-info-row border-bottom pb-2 mb-1">
                  <span className="text-muted">Activated On:</span>
                  <span className="fw-semibold text-secondary">{dayjs(startsAt).format('DD MMM, YYYY')}</span>
                </div>
              )}
              <div className="plan-info-row border-bottom pb-2 mb-1">
                <span className="text-muted">Expires / Next Billing:</span>
                <span className="fw-bold text-primary">{expiresAt ? dayjs(expiresAt).format('DD MMM, YYYY') : 'Never'}</span>
              </div>
              <div className="plan-info-row pt-1">
                <span className="text-muted">Status:</span>
                <span className="badge bg-success text-white fw-bold px-2 py-0.5 rounded-pill fs-11">
                  {daysRemaining > 0 ? `${daysRemaining} Days Left` : 'Active'}
                </span>
              </div>
            </div>

            {/* CTA Button: View Plans & Subscriptions */}
            <Link
              to={all_routes.pricing}
              className="btn btn-primary w-100 rounded-pill fw-bold py-2.5 shadow-sm d-flex align-items-center justify-content-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                border: 'none',
                fontSize: '13px',
              }}
            >
              <i className="ti ti-sparkles fs-15" />
              View Plans & Subscriptions
            </Link>
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
            <i className="ti ti-rosette-discount-check-filled me-2 text-success" style={{ fontSize: '16px' }} />
            <span className="me-1">{packageName.toUpperCase()}</span>
            <i className="ti ti-chevron-down fs-11" />
          </div>
        </Dropdown>
      </>
    );
  }

  // Free Trial Mode Dropdown
  const trialMenuItems: MenuProps['items'] = [
    {
      key: '1',
      label: (
        <div className="p-2" style={{ width: '300px' }}>
          <div className="d-flex align-items-center mb-3">
            <div className="flex-shrink-0 bg-warning-subtle p-2 rounded-circle me-3 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
              <i className="ti ti-clock-hour-4 text-warning fs-22" />
            </div>
            <div className="flex-grow-1">
              <h6 className="mb-0 fw-bold fs-15 text-dark">Free Trial Plan</h6>
              <span className={`badge ${isExpired ? 'bg-danger-subtle text-danger' : 'bg-warning-subtle text-warning-emphasis'} border fs-11 px-2 py-0.5 mt-1 d-inline-flex align-items-center rounded-pill`}>
                <i className="ti ti-circle-filled me-1 fs-8" />
                {isExpired ? "Trial Expired" : "Trial Active"}
              </span>
            </div>
          </div>

          <div className="border rounded-3 p-3 bg-light-subtle mb-3">
            <div className="plan-info-row border-bottom pb-2 mb-1">
              <span className="text-muted">Time Remaining:</span>
              <span className="fw-bold text-danger">{timeLeft || "00:00:00"}</span>
            </div>
            <div className="plan-info-row pt-1">
              <span className="text-muted">Expires On:</span>
              <span className="fw-semibold text-dark">{expiresAt ? dayjs(expiresAt).format('DD MMM, YYYY hh:mm A') : 'N/A'}</span>
            </div>
          </div>

          <Link
            to={all_routes.pricing}
            className="btn btn-primary w-100 rounded-pill fw-bold py-2 shadow-sm d-flex align-items-center justify-content-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              border: 'none',
              fontSize: '13px',
            }}
          >
            <i className="ti ti-arrow-up-right fs-15" />
            Upgrade to Premium Plan
          </Link>
        </div>
      )
    }
  ];

  return (
    <>
      <style>{premiumStyles}</style>
      <Dropdown menu={{ items: trialMenuItems }} trigger={['click']} placement="bottomRight" overlayClassName="premium-dropdown shadow-lg border-0">
        <div
          className={`d-flex align-items-center px-3 py-1.5 rounded-pill me-3 shadow-sm border text-nowrap flex-shrink-0 cursor-pointer hover-shadow transition-all ${isExpired ? 'bg-danger-subtle border-danger text-danger' : 'bg-warning-subtle border-warning text-warning-emphasis'}`}
          style={{ fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          <i className={`ti ti-clock-hour-4 me-2 ${!isExpired && 'animate-spin'}`} style={{ fontSize: '16px' }} />
          <span className="me-1">{isExpired ? 'TRIAL EXPIRED' : `Trial: ${timeLeft}`}</span>
          <i className="ti ti-chevron-down fs-11" />
        </div>
      </Dropdown>
    </>
  );
};

export default TrialCountdown;
