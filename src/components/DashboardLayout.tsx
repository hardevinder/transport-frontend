import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBars, FaUserCircle, FaTimes } from 'react-icons/fa';

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const profileRef = useRef<HTMLDivElement>(null);

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    return localStorage.getItem('sidebarOpen') === 'true';
  });

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const toggleProfileMenu = () => setProfileMenuOpen(prev => !prev);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    localStorage.setItem('sidebarOpen', String(sidebarOpen));
  }, [sidebarOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Top Bar */}
      <header className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between shadow fixed top-0 left-0 right-0 z-30 h-[64px]">
        <button onClick={toggleSidebar}>
          <FaBars className="text-xl" />
        </button>
        <div className="flex items-center gap-3 relative" ref={profileRef}>
          <span className="text-sm hidden sm:block">Admin</span>
          <button onClick={toggleProfileMenu}>
            <FaUserCircle className="text-2xl cursor-pointer" />
          </button>
          {profileMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-40 bg-white text-gray-800 rounded shadow-lg z-40">
              <Link
                to="/edit-profile"
                className="block px-4 py-2 hover:bg-gray-100"
                onClick={() => setProfileMenuOpen(false)}
              >
                Edit Profile
              </Link>
              <Link
                to="/routes"
                className={`block px-4 py-2 hover:bg-gray-100 ${isActive('/routes') ? 'bg-gray-100 font-medium' : ''}`}
                onClick={() => setProfileMenuOpen(false)}
              >
                Routes
              </Link>
              <Link
                to="/drivers"
                className={`block px-4 py-2 hover:bg-gray-100 ${isActive('/drivers') ? 'bg-gray-100 font-medium' : ''}`}
                onClick={() => setProfileMenuOpen(false)}
              >
                Drivers
              </Link>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.href = '/';
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Layout Body */}
      <div className="flex flex-1 pt-[64px]">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 bg-blue-900 text-white fixed top-[64px] bottom-0 left-0 z-20 shadow-lg p-4 overflow-y-auto">
            <div className="flex justify-end mb-4">
              <button onClick={() => setSidebarOpen(false)}>
                <FaTimes className="text-white text-xl" />
              </button>
            </div>
            <nav className="space-y-4">
              <div>
                <div className="text-sm uppercase tracking-wider text-gray-300 mb-2">General</div>
                <Link to="/dashboard" className={`block p-2 rounded hover:bg-blue-700 ${isActive('/dashboard') ? 'bg-blue-800' : ''}`}>
                  Dashboard
                </Link>
                <Link to="/transport-org-profile" className={`block p-2 rounded hover:bg-blue-700 ${isActive('/transport-org-profile') ? 'bg-blue-800' : ''}`}>
                  Transport Org Profile
                </Link>
              </div>
              <div>
                <div className="text-sm uppercase tracking-wider text-gray-300 mb-2">Master Data</div>
                <Link to="/classes" className={`block p-2 rounded hover:bg-blue-700 ${isActive('/classes') ? 'bg-blue-800' : ''}`}>
                  Classes
                </Link>
                <Link to="/routes" className={`block p-2 rounded hover:bg-blue-700 ${isActive('/routes') ? 'bg-blue-800' : ''}`}>
                  Routes
                </Link>
                <Link to="/stops" className={`block p-2 rounded hover:bg-blue-700 ${isActive('/stops') ? 'bg-blue-800' : ''}`}>
                  Stops
                </Link>
                <Link to="/drivers" className={`block p-2 rounded hover:bg-blue-700 ${isActive('/drivers') ? 'bg-blue-800' : ''}`}>
                  Drivers
                </Link>
                <Link to="/vehicles" className={`block p-2 rounded hover:bg-blue-700 ${isActive('/vehicles') ? 'bg-blue-800' : ''}`}>
                  Vehicles
                </Link>
              </div>
              <div>
                <div className="text-sm uppercase tracking-wider text-gray-300 mb-2">Students</div>
                <Link to="/students" className={`block p-2 rounded hover:bg-blue-700 ${isActive('/students') ? 'bg-blue-800' : ''}`}>
                  Student Management
                </Link>
              </div>
              <div>
                <div className="text-sm uppercase tracking-wider text-gray-300 mb-2">Fee Management</div>
                <Link to="/fee-structures" className={`block p-2 rounded hover:bg-blue-700 ${isActive('/fee-structures') ? 'bg-blue-800' : ''}`}>
                  Fee Structure
                </Link>
                <Link to="/fee-collection" className={`block p-2 rounded hover:bg-blue-700 ${isActive('/fee-collection') ? 'bg-blue-800' : ''}`}>
                  Fee Collection
                </Link>
                <Link to="/transactions" className={`block p-2 rounded hover:bg-blue-700 ${isActive('/transactions') ? 'bg-blue-800' : ''}`}>
                  Transactions
                </Link>
                <Link to="/fine-settings" className={`block p-2 rounded hover:bg-blue-700 ${isActive('/fine-settings') ? 'bg-blue-800' : ''}`}>
                  Fine Settings
                </Link>
                {/* NEW: Slab Opt-Out Link */}
                <Link to="/slab-opt-out" className={`block p-2 rounded hover:bg-blue-700 ${isActive('/slab-opt-out') ? 'bg-blue-800' : ''}`}>
                  Slab Opt-Out
                </Link>
              </div>
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 px-4 py-6 ${sidebarOpen ? 'ml-64' : ''}`}>
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-gray-200 text-center text-sm text-gray-600 py-2 mt-auto">
        © 2025 Transport ERP. All rights reserved.
      </footer>
    </div>
  );
};

export default DashboardLayout;
