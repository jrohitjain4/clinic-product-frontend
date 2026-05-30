import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from './store';

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl: 'http://localhost:5000/api', // Adjust base URL as needed based on env variables
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as RootState).auth.token;
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['Patient', 'Doctor', 'Appointment', 'Invoice', 'Auth'],
    endpoints: (builder) => ({
        getPatients: builder.query({
            query: () => '/patients',
            providesTags: ['Patient'],
        }),
        getDoctors: builder.query({
            query: () => '/doctors',
            providesTags: ['Doctor'],
        }),
        getAppointments: builder.query({
            query: () => '/appointments',
            providesTags: ['Appointment'],
        }),
    }),
});

export const {
    useGetPatientsQuery,
    useGetDoctorsQuery,
    useGetAppointmentsQuery,
} = apiSlice;
