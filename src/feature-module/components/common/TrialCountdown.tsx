import { useState, useEffect } from 'react';

const TrialCountdown = () => {
    const [timeLeft, setTimeLeft] = useState<string>("");
    const [isExpired, setIsExpired] = useState(false);
    const [isPremium, setIsPremium] = useState(false);
    const [packageName, setPackageName] = useState("");

    useEffect(() => {
        const calculateTimeLeft = () => {
            const userStr = localStorage.getItem("user");
            if (!userStr) return;

            const user = JSON.parse(userStr);
            const status = user?.clinic?.status;

            if (status && status !== 'TRIAL') {
                setIsPremium(true);
                // Try different common paths where package name might be stored, fallback to default text
                setPackageName(
                    user?.subscription?.package?.name ||
                    user?.clinic?.Package?.name ||
                    user?.clinic?.package?.name ||
                    "Premium Plan"
                );
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
        return (
            <div className="d-flex align-items-center px-3 py-1.5 rounded-pill me-3 shadow-sm border bg-success-subtle border-success text-success-emphasis" style={{ fontSize: '13px', fontWeight: 'bold' }}>
                <i className="ti ti-rosette-discount-check-filled me-2" style={{ fontSize: '16px' }} />
                <span>{packageName.toUpperCase()}</span>
            </div>
        );
    }

    if (!timeLeft) return null;

    return (
        <div className={`d-flex align-items-center px-3 py-1.5 rounded-pill me-3 shadow-sm border ${isExpired ? 'bg-danger-subtle border-danger text-danger' : 'bg-warning-subtle border-warning text-warning-emphasis'}`} style={{ fontSize: '13px', fontWeight: 'bold' }}>
            <i className={`ti ti-clock-hour-4 me-2 ${!isExpired && 'animate-spin'}`} style={{ fontSize: '16px' }} />
            <span>{isExpired ? 'TRIAL EXPIRED' : `Trial Ends In: ${timeLeft}`}</span>
        </div>
    );
};

export default TrialCountdown;
