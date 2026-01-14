/**
 * =============================================================================
 * Authentication Context Module
 * =============================================================================
 * This module provides authentication state management using React Context API.
 * It handles user login/logout and persists auth state in localStorage.
 * 
 * Context Values:
 * - user: Current authenticated user object
 * - token: JWT access token
 * - login(): Function to log in a user
 * - logout(): Function to log out the current user
 * - loading: Boolean indicating if auth state is being loaded
 * 
 * Usage:
 * 1. Wrap your app with <AuthProvider>
 * 2. Use useAuth() hook in components to access auth state
 * 
 * Storage:
 * - Token stored in localStorage as 'token'
 * - User data stored in localStorage as 'user' (JSON)
 * 
 * Author: Zedny Development Team
 * =============================================================================
 */

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (token && storedUser && storedUser !== 'undefined') {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                // Sync user state from backend to check streak
                syncUser(token);
            } catch (e) {
                console.error("Failed to parse stored user", e);
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, [token]);

    // Handle cross-tab login/logout sync - REMOVED per user request
    // User wants independent tab sessions (at least visually) in this context
    // useEffect(() => { ... window.addEventListener('storage', ...) ... }, []);

    const syncUser = async (authToken) => {
        try {
            const res = await fetch('/api/v1/auth/me', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data);
                localStorage.setItem('user', JSON.stringify(data));

                // If streak was updated today, show a notification
                // Note: We need a way to show notification here.
                // Since NotificationContext is a sibling of AuthProvider in App.jsx,
                // we might need to handle the notification differently or 
                // move NotificationProvider inside AuthProvider.
                if (data.streak_updated) {
                    // Create a custom event to notify parent of streak
                    window.dispatchEvent(new CustomEvent('streakUpdated', {
                        detail: { count: data.streak_count }
                    }));
                }
            } else if (res.status === 401) {
                logout();
            }
        } catch (err) {
            console.error("Failed to sync user", err);
        }
    };

    const login = (newToken, newUser) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading, syncUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
