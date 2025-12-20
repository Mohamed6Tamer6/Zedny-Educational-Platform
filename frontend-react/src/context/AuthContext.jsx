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
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse stored user", e);
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, [token]);

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
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
