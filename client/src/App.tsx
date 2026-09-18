import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { Navbar } from './components/Navbar';
import { WorkerKioskPage } from './pages/WorkerKioskPage';
import { LoginPage } from './pages/LoginPage';
import { AdminLayout } from './pages/AdminLayout';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminEquipmentPage } from './pages/AdminEquipmentPage';
import { AdminWorkersPage } from './pages/AdminWorkersPage';
import { AdminCamerasPage } from './pages/AdminCamerasPage';
import { AdminHistoryPage } from './pages/AdminHistoryPage';
import { AdminReportsPage } from './pages/AdminReportsPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <Routes>
            {/* Worker Check-In Kiosk */}
            <Route
              path="/kiosk"
              element={
                <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
                  <Navbar />
                  <main className="flex-1">
                    <WorkerKioskPage />
                  </main>
                </div>
              }
            />
            
            {/* Root redirects to Kiosk */}
            <Route path="/" element={<Navigate to="/kiosk" replace />} />

            {/* Admin Login */}
            <Route
              path="/login"
              element={
                <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
                  <Navbar />
                  <main className="flex-1">
                    <LoginPage />
                  </main>
                </div>
              }
            />

            {/* Admin Portal Layout & Sub-routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="equipment" element={<AdminEquipmentPage />} />
              <Route path="workers" element={<AdminWorkersPage />} />
              <Route path="cameras" element={<AdminCamerasPage />} />
              <Route path="history" element={<AdminHistoryPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            {/* Catch-all redirect to kiosk */}
            <Route path="*" element={<Navigate to="/kiosk" replace />} />
          </Routes>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
