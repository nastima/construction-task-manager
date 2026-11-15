import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import ManagerPage from '@/pages/ManagerPage';
import ExecutorPage from '@/pages/ExecutorPage';
import { ProtectedRoute } from '@/app/router/ProtectedRoute';

export function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route
                    path="/manager"
                    element={
                        <ProtectedRoute requiredRole="manager">
                            <ManagerPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/executor"
                    element={
                        <ProtectedRoute requiredRole="executor">
                            <ExecutorPage />
                        </ProtectedRoute>
                    }
                />

                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}