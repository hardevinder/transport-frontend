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

// ← NEW: import the slab-opt-out page
import SlabOptOutPage from './pages/SlabOptOutPage';

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
        {/* ✅ NEW ROUTE for managing slab opt-outs */}
        <Route path="/slab-opt-out" element={<SlabOptOutPage />} />
      </Routes>
    </Router>
  );
}

export default App;
