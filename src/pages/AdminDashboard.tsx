import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import axios from 'axios';
import { API } from '../config/api';

const AdminDashboard: React.FC = () => {
  const [collectionSummary, setCollectionSummary] = useState<any[]>([]);
  const [totalCollection, setTotalCollection] = useState<number>(0);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [studentRoutes, setStudentRoutes] = useState<any[]>([]);
  const [totalRoutes, setTotalRoutes] = useState<number>(0);
  const [totalDrivers, setTotalDrivers] = useState<number>(0);

  useEffect(() => {
    // Fetch Collection Summary
    const fetchCollectionSummary = async () => {
      try {
        const res = await axios.get<{ status: number; message: string; data: any[] }>(
          API.COLLECTION_SUMMARY_CARDS
        );
        const data = res.data?.data || [];
        setCollectionSummary(data);

        const total = data.reduce((sum: number, route: any) => {
          const routeTotal = route.slabs.reduce((s: number, slab: any) => s + slab.totalAmount, 0);
          return sum + routeTotal;
        }, 0);

        setTotalCollection(total);
      } catch (err) {
        console.error('Error fetching collection summary:', err);
      }
    };

    // Fetch Student Count by Route
    const fetchStudentCount = async () => {
      try {
      const token = localStorage.getItem('token');
      const res = await axios.get<{ status: number; message: string; data: { routes: any[]; total: number } }>(
        API.STUDENT_COUNT_BY_ROUTE,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );


        const { routes, total } = res.data?.data || { routes: [], total: 0 };
        setTotalStudents(total);
        setStudentRoutes(routes);
      } catch (err) {
        console.error('Error fetching student count:', err);
      }
    };

    // Fetch Total Routes
    const fetchTotalRoutes = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get<{ status: number; message: string; data: { totalRoutes: number } }>(
          API.ROUTE_COUNT,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const total = res.data?.data?.totalRoutes || 0;
        setTotalRoutes(total);
      } catch (err) {
        console.error('Error fetching total routes:', err);
      }
    };

    // Fetch Total Drivers
    const fetchTotalDrivers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get<{ status: number; message: string; data: { totalDrivers: number } }>(
          API.DRIVER_COUNT,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const total = res.data?.data?.totalDrivers || 0;
        setTotalDrivers(total);
      } catch (err) {
        console.error('Error fetching total drivers:', err);
      }
    };



    fetchCollectionSummary();
    fetchStudentCount();
    fetchTotalRoutes();
    fetchTotalDrivers();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-blue-800">Welcome, Admin</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Students */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-gray-600 font-semibold">Total Students</h2>
            <p className="text-3xl font-bold text-blue-800">{totalStudents.toLocaleString('en-IN')}</p>
          </div>

          {/* Total Drivers */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-gray-600 font-semibold">Total Drivers</h2>
            <p className="text-3xl font-bold text-blue-800">{totalDrivers.toLocaleString('en-IN')}</p>
          </div>

          {/* Total Routes */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-gray-600 font-semibold">Total Routes</h2>
            <p className="text-3xl font-bold text-blue-800">{totalRoutes.toLocaleString('en-IN')}</p>
          </div>

          {/* Total Collection */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-gray-600 font-semibold">Total Collection (₹)</h2>
            <p className="text-3xl font-bold text-green-700">
              ₹{totalCollection.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Route-wise Student Count Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {studentRoutes.map((route) => (
            <div
              key={route.routeId}
              className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-300 rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-indigo-800">{route.routeName}</h3>
                <span className="bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1 rounded-full shadow-sm">
                  {route.studentCount.toLocaleString('en-IN')} Students
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Route-wise Collection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {collectionSummary.map((route) => {
            const routeTotal = route.slabs.reduce(
              (sum: number, slab: any) => sum + slab.totalAmount,
              0
            );

            return (
              <div
                key={route.routeId}
                className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-300 rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-blue-800">{route.routeName}</h3>
                  <span className="bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full shadow-sm">
                    ₹{routeTotal.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="space-y-3">
                  {route.slabs.map((slab: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-white rounded-xl p-3 shadow-sm border border-blue-100"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-600 font-medium">{slab.slab}</span>
                        <span className="text-blue-900 font-semibold">
                          ₹{slab.totalAmount.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 text-sm mt-1">
                        {slab.modes?.map((mode: any, index: number) => {
                          const modeLabel =
                            mode.mode === 'cash'
                              ? '💵 Cash'
                              : mode.mode === 'online'
                              ? '💳 Online'
                              : mode.mode;

                          return (
                            <span
                              key={index}
                              className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium"
                            >
                              {modeLabel}: ₹{mode.amount.toLocaleString('en-IN')}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
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