import { useState, useEffect, useCallback } from "react";
import { apiUrl } from "../config/api";
import { toast } from "react-toastify";

export interface Note {
    id: string;
    title: string;
    content: string;
    priority: string;
    noteDate: string;
    appointmentId?: string;
    createdAt: string;
}

export const useNotes = (filters?: { appointmentId?: string }) => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchNotes = useCallback(async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams();
            if (filters?.appointmentId) query.append("appointmentId", filters.appointmentId);

            const res = await fetch(apiUrl(`/api/notes?${query.toString()}`), {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            const data = await res.json();
            if (res.ok) {
                setNotes(data);
            }
        } catch (error) {
            console.error("Error fetching notes:", error);
        } finally {
            setLoading(false);
        }
    }, [filters?.appointmentId]);

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    const addNote = async (noteData: Partial<Note>) => {
        try {
            const res = await fetch(apiUrl("/api/notes"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    ...noteData,
                    appointmentId: filters?.appointmentId || noteData.appointmentId,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setNotes(prev => [data, ...prev]);
                return data;
            }
            throw new Error(data.message || "Failed to add note");
        } catch (error: any) {
            toast.error(error.message);
            throw error;
        }
    };

    const deleteNote = async (id: string) => {
        try {
            const res = await fetch(apiUrl(`/api/notes/${id}`), {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (res.ok) {
                setNotes(prev => prev.filter(n => n.id !== id));
                toast.success("Note deleted");
            }
        } catch (error) {
            toast.error("Delete failed");
        }
    };

    return { notes, loading, refetch: fetchNotes, addNote, deleteNote };
};
