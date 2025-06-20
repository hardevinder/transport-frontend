import React from 'react';
import DashboardLayout from '../components/DashboardLayout';

const AdminDashboard: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-blue-800">Welcome, Admin</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total Students */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-gray-600 font-semibold">Total Students</h2>
            <p className="text-3xl font-bold text-blue-800">354</p>
          </div>

          {/* Total Drivers */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-gray-600 font-semibold">Total Drivers</h2>
            <p className="text-3xl font-bold text-blue-800">27</p>
          </div>

          {/* Total Routes */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-gray-600 font-semibold">Total Routes</h2>
            <p className="text-3xl font-bold text-blue-800">12</p>
          </div>
        </div>

        {/* Future Enhancements */}
        <div className="bg-white rounded-xl shadow p-6 mt-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Recent Activity</h3>
          <p className="text-gray-500 italic">No recent activity to show.</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
