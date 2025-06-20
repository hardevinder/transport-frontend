import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginScreen from './pages/LoginScreen';
import AdminDashboard from './pages/AdminDashboard';
import TransportOrgProfile from './pages/TransportOrgProfile';
import DriverManagement from './pages/DriverManagement';
import RouteManagement from './pages/RouteManagement';
import StopManagement from './pages/StopManagement'; // ✅ NEW import

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/transport-org-profile" element={<TransportOrgProfile />} />
        <Route path="/drivers" element={<DriverManagement />} />
        <Route path="/routes" element={<RouteManagement />} />
        <Route path="/stops" element={<StopManagement />} /> {/* ✅ NEW route */}
      </Routes>
    </Router>
  );
}

export default App;
