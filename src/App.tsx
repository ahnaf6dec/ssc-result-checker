import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminPage } from './pages/AdminPage';
import { HomePage } from './pages/HomePage';
import { ResultPage } from './pages/ResultPage';
import { ServiceUnavailable } from './pages/ServiceUnavailable';
import { useMaintenanceFlag } from './lib/maintenance';
export function App() {
  // When maintenance mode is ON, every PUBLIC route serves the 503 page.
  // The /admin panel stays reachable so an administrator can bring the site
  // back online (and remains behind its own login gate).
  const maintenance = useMaintenanceFlag();
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={maintenance ? <ServiceUnavailable /> : <HomePage />} />
        

        <Route
          path="/result"
          element={maintenance ? <ServiceUnavailable /> : <ResultPage />} />
        

        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>);

}