import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// Types
interface ClinicInfo {
    id: string;
    name: string;
    subdomain?: string | null;
    status?: string;
    packageId?: string | null;
}

interface AuthUser {
    id: string;
    email: string;
    fullName: string;
    role: string;
    clinicId?: string | null;
    clinic?: ClinicInfo | null;
    permissions?: Record<string, boolean> | null;
}

interface AuthState {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
}

// Load initial state from localStorage (hydration)
const loadAuthFromStorage = (): AuthState => {
    try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (token && userStr) {
            return {
                token,
                user: JSON.parse(userStr),
                isAuthenticated: true,
            };
        }
    } catch {
        // Corrupt storage — clear it
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
    return { user: null, token: null, isAuthenticated: false };
};

const initialState: AuthState = loadAuthFromStorage();

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginSuccess(state, action: PayloadAction<{ user: AuthUser; token: string }>) {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
            // Persist to localStorage
            localStorage.setItem('token', action.payload.token);
            localStorage.setItem('user', JSON.stringify(action.payload.user));
        },
        logout(state) {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        },
        updateUser(state, action: PayloadAction<Partial<AuthUser>>) {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
                localStorage.setItem('user', JSON.stringify(state.user));
            }
        },
    },
});

export const { loginSuccess, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectAuthUser = (state: { auth: AuthState }) => state.auth.user;
export const selectAuthToken = (state: { auth: AuthState }) => state.auth.token;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectUserRole = (state: { auth: AuthState }) => state.auth.user?.role;
export const selectClinicId = (state: { auth: AuthState }) => state.auth.user?.clinicId;
