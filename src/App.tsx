import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LoginScreen from './pages/LoginScreen';
import AdminDashboard from './pages/AdminDashboard';
import TransportOrgProfile from './pages/TransportOrgProfile';
import DriverManagement from './pages/DriverManagement';
import RouteManagement from './pages/RouteManagement';
import StopManagement from './pages/StopManagement';
import VehicleManagement from './pages/VehicleManagement';
import StudentManagement from './pages/StudentManagement';
import ClassManagement from './pages/ClassManagement';
import FineSettings from './pages/FineSettings';
import FeeStructureManagement from './pages/FeeStructureManagement';
import FeeCollectionPage from './pages/FeeCollectionPage';
import SlabOptOutPage from './pages/SlabOptOutPage';

// ✅ NEW: Student login, dashboard & pay
import StudentLoginPage from './pages/StudentLoginPage';
import StudentDashboard from './pages/StudentDashboard';
import StudentPayPage from './pages/StudentPayPage'; // ✅ Add this import

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/transport-org-profile" element={<TransportOrgProfile />} />
        <Route path="/drivers" element={<DriverManagement />} />
        <Route path="/routes" element={<RouteManagement />} />
        <Route path="/stops" element={<StopManagement />} />
        <Route path="/vehicles" element={<VehicleManagement />} />
        <Route path="/students" element={<StudentManagement />} />
        <Route path="/classes" element={<ClassManagement />} />
        <Route path="/fine-settings" element={<FineSettings />} />
        <Route path="/fee-structures" element={<FeeStructureManagement />} />
        <Route path="/fee-collection" element={<FeeCollectionPage />} />
        <Route path="/slab-opt-out" element={<SlabOptOutPage />} />

        {/* ✅ Student login, dashboard and payment */}
        <Route path="/student/login" element={<StudentLoginPage />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/pay" element={<StudentPayPage />} /> {/* ✅ New route */}
      </Routes>
    </Router>
  );
}

export default App;
