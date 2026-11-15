import { Navigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import type { UserRole } from '@/features/auth/api/profile';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole: UserRole;
}

export function ProtectedRoute({
    children,
    requiredRole,
}: ProtectedRouteProps) {
    const { user, profile, isLoading } = useAuth();

    // Ждём восстановления сессии и загрузки профиля
    if (isLoading) {
        return <p>Загрузка...</p>;
    }

    // Если пользователь не авторизован
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Если профиль не найден
    if (!profile) {
        return <p>Не удалось загрузить профиль пользователя.</p>;
    }

    // Если роль не соответствует требуемой
    if (profile.role !== requiredRole) {
        if (profile.role === 'manager') {
            return <Navigate to="/manager" replace />;
        }

        if (profile.role === 'executor') {
            return <Navigate to="/executor" replace />;
        }

        return <Navigate to="/login" replace />;
    }

    return children;
}