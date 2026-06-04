import { useState, useEffect } from 'react';
import { message } from 'antd';

const API_URL = 'http://localhost:5000/api';

export interface Ticket {
    id: string;
    ticketCode: string;
    subject: string;
    description: string;
    priority: string;
    status: string;
    clinicId: string | null;
    userId: string;
    userName: string;
    userEmail: string;
    createdAt: string;
    clinic?: {
        name: string;
    };
}

export const useTickets = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/support/tickets`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setTickets(data);
        } catch (error) {
            console.error('Error fetching tickets:', error);
            message.error('Failed to load tickets');
        } finally {
            setLoading(false);
        }
    };

    const createTicket = async (data: { subject: string; description: string; priority: string }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/support/tickets`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Failed to create');
            message.success('Ticket created successfully');
            fetchTickets();
            return true;
        } catch (error) {
            console.error('Error creating ticket:', error);
            message.error('Failed to create ticket');
            return false;
        }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/support/tickets/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status }),
            });
            if (!response.ok) throw new Error('Failed to update');
            message.success('Ticket status updated');
            fetchTickets();
            return true;
        } catch (error) {
            console.error('Error updating status:', error);
            message.error('Failed to update status');
            return false;
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    return { tickets, loading, fetchTickets, createTicket, updateStatus };
};
