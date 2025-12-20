import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protects routes based on authentication and user roles.
 * 
 * Props:
 * - allowedRoles: Array of roles allowed to access this route (e.g. ['TEACHER', 'SUPER_ADMIN'])
 */
export default function PrivateRoute({ allowedRoles = [] }) {
    const { user, loading, token } = useAuth();

    if (loading) {
        return <div className="p-4 text-center">Loading...</div>;
    }

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    // Role check
    // Ensure allowedRoles includes user.role. 
    // SUPER_ADMIN should generally bypass, but here we explicitly list allowed roles in routes.
    // If strict role check is needed:
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // Redirect to their appropriate dashboard if they are logged in but unauthorized for this specific page
        if (user.role === 'TEACHER') return <Navigate to="/teacher-dashboard" replace />;
        if (user.role === 'STUDENT') return <Navigate to="/student-dashboard" replace />;
        if (user.role === 'SUPER_ADMIN') return <Navigate to="/admin-dashboard" replace />;

        return <Navigate to="/" replace />; // Fallback
    }

    return <Outlet />;
}
