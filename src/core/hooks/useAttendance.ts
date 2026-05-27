import { useState, useCallback, useEffect } from "react";
import { apiUrl } from "../config/api";

type AttendanceRecord = {
    id: string;
    name: string;
    type: string;
    img: string;
    percentage: string;
    attendance: Record<number, string>;
};

export const useAttendance = (month: number, year: number) => {
    const [data, setData] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAttendance = useCallback(async () => {
        try {
            const resp = await fetch(apiUrl(`/api/attendance?month=${month}&year=${year}`), {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (resp.ok) {
                const result = await resp.json();
                setData(result);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    const markAttendance = async (
        employeeId: string,
        employeeType: string,
        dateString: string,
        status: string
    ) => {
        try {
            const resp = await fetch(apiUrl("/api/attendance/mark"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    employeeId,
                    employeeType,
                    date: dateString,
                    status,
                }),
            });

            if (resp.ok) {
                await fetchAttendance(); // reload
                return true;
            }
            return false;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    return { data, loading, markAttendance };
};
