import React, { useEffect, useState } from 'react';
import axios from '../utils/axios';
import { API } from '../config/api';
import { toast, ToastContainer } from 'react-toastify';
import Swal from 'sweetalert2';
import 'react-toastify/dist/ReactToastify.css';
import DashboardLayout from '../components/DashboardLayout';
import { FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaPlus } from 'react-icons/fa';

interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNo: string;
}

interface Vehicle {
  id: string;
  busNo: string;
  capacity: number;
}

interface StopInput {
  stopName: string;
  stopOrder: number;
  stopTime: string;
  address?: string;
  feeAmount?: number;
}

interface RouteInput {
  id?: string;
  name: string;
  startPoint: string;
  endPoint: string;
  driverId?: string;
  vehicleId?: string;
  status?: string;
  createdAt?: string;
  driver?: Driver;
  stops?: StopInput[];
}

const RouteManagement: React.FC = () => {
  const [routes, setRoutes] = useState<RouteInput[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [allStops, setAllStops] = useState<StopInput[]>([]);
  const [form, setForm] = useState<RouteInput>({
    name: '',
    startPoint: '',
    endPoint: '',
    driverId: '',
    vehicleId: '',
    stops: [],
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [overrideDriver, setOverrideDriver] = useState<boolean>(false);
  const [overrideVehicle, setOverrideVehicle] = useState<boolean>(false);

  useEffect(() => {
    fetchRoutes();
    fetchDrivers();
    fetchVehicles();
    fetchAllStops();
  }, []);

  const fetchRoutes = async () => {
    try {
      const res = await axios.get<RouteInput[]>(API.ROUTES);
      setRoutes(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load routes');
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await axios.get<Driver[]>(API.DRIVERS);
      setDrivers(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load drivers');
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await axios.get<Vehicle[]>(API.VEHICLES);
      setVehicles(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load vehicles');
    }
  };

  const fetchAllStops = async () => {
    try {
      const res = await axios.get<StopInput[]>(`${API.STOPS}/all`);
      setAllStops(res.data);
    } catch {
      toast.error('Failed to fetch available stops');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Utility to ensure unique stop orders
  const reassignStopOrders = (stops: StopInput[]): StopInput[] => {
    return stops.map((stop, index) => ({
      ...stop,
      stopOrder: index + 1,
    }));
  };

  const handleStopChange = async (index: number, field: string, value: any) => {
    const updatedStops = [...(form.stops || [])];
    if (field === 'stopName' && value) {
      // Find the selected stop from allStops
      const selectedStop = allStops.find((stop) => stop.stopName === value);
      if (selectedStop) {
        updatedStops[index] = {
          ...updatedStops[index],
          stopName: selectedStop.stopName,
          stopTime: selectedStop.stopTime || '',
          address: selectedStop.address || '',
          feeAmount: selectedStop.feeAmount || undefined,
        };

        // Check for duplicate stop names within the form
        const stopNames = updatedStops.map((stop) => stop.stopName.toLowerCase());
        const duplicateIndex = stopNames.indexOf(value.toLowerCase());
        if (duplicateIndex !== -1 && duplicateIndex !== index) {
          const proceed = await Swal.fire({
            title: 'Duplicate Stop Name',
            text: `The stop "${value}" is already added to this route. Do you want to keep it?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No',
          });
          if (!proceed.isConfirmed) {
            updatedStops[index] = {
              ...updatedStops[index],
              stopName: '',
              stopTime: '',
              address: '',
              feeAmount: undefined,
            };
          }
        }
      }
    } else if (field === 'stopOrder') {
      updatedStops[index] = {
        ...updatedStops[index],
        [field]: Number(value),
      };
    }

    setForm({ ...form, stops: reassignStopOrders(updatedStops) });
  };

  const addStopField = () => {
    const updatedStops = [
      ...(form.stops || []),
      { stopName: '', stopOrder: (form.stops?.length || 0) + 1, stopTime: '' },
    ];
    setForm({ ...form, stops: reassignStopOrders(updatedStops) });
  };

  const removeStopField = (index: number) => {
    const updatedStops = [...(form.stops || [])];
    updatedStops.splice(index, 1);
    setForm({ ...form, stops: reassignStopOrders(updatedStops) });
  };

  const handleEdit = async (route: RouteInput) => {
    try {
      const res = await axios.get(`${API.ROUTES}/${route.id}`);
      const detailedRoute = res.data as RouteInput;

      const stops = detailedRoute.stops?.length
        ? reassignStopOrders(detailedRoute.stops)
        : [];

      setForm({
        id: detailedRoute.id,
        name: detailedRoute.name,
        startPoint: detailedRoute.startPoint,
        endPoint: detailedRoute.endPoint,
        driverId: detailedRoute.driverId,
        vehicleId: detailedRoute.vehicleId,
        stops,
      });
      setOverrideDriver(false);
      setOverrideVehicle(false);
      setEditingId(detailedRoute.id || null);
      setShowForm(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load route details');
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Route will be permanently deleted!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API.ROUTES}/${id}`);
        toast.success('Successfully deleted route');
        fetchRoutes();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to delete route');
      }
    }
  };

  const handleToggleStatus = async (id: string) => {
    if (!id) return;
    try {
      await axios.patch(`${API.ROUTES}/${id}/status`);
      toast.success('Route status updated successfully');
      fetchRoutes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update route status');
    }
  };

  const handleSubmit = async (override = false) => {
    if (!form.name.trim()) return toast.error('Please enter a route name.');
    if (!form.startPoint.trim()) return toast.error('Please enter a start point.');
    if (!form.endPoint.trim()) return toast.error('Please enter an end point.');
    if (!form.driverId?.trim()) return toast.error('Please select a driver.');
    if (!form.vehicleId?.trim()) return toast.error('Please select a vehicle.');

    // Validate stops: Ensure no empty stop names
    if (form.stops?.some((stop) => !stop.stopName.trim())) {
      return toast.error('Please select a stop name for all stops.');
    }

    // Use override if either driver or vehicle override is set, or if explicitly passed
    const finalOverride = override || overrideDriver || overrideVehicle;
    const payload = { ...form, stops: reassignStopOrders(form.stops || []), override: finalOverride };

    try {
      if (editingId) {
        await axios.put(`${API.ROUTES}/${editingId}`, payload);
        toast.success('Route updated successfully');
      } else {
        await axios.post(API.ROUTES, payload);
        toast.success('Route created successfully');
      }

      setForm({
        name: '',
        startPoint: '',
        endPoint: '',
        driverId: '',
        vehicleId: '',
        stops: [],
      });
      setOverrideDriver(false);
      setOverrideVehicle(false);
      setEditingId(null);
      setShowForm(false);
      await fetchRoutes();
    } catch (err: any) {
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 409 && data?.warning && data?.routeName) {
        Swal.fire({
          title: 'Duplicate Assignment',
          text: `This ${data.field} is already assigned to route "${data.routeName}". Do you want to proceed anyway?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, continue',
          cancelButtonText: 'Cancel',
        }).then((result) => {
          if (result.isConfirmed) {
            if (data.field === 'driver') setOverrideDriver(true);
            if (data.field === 'vehicle') setOverrideVehicle(true);
            handleSubmit(true);
          }
        });
      }
      else if (status === 409 && data?.message?.includes('Stop')) {
        Swal.fire({
          title: 'Duplicate Stop',
          text: data.message || 'One or more stops is already assigned to another route. Do you want to proceed?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, continue',
          cancelButtonText: 'Cancel',
        }).then((result) => {
          if (result.isConfirmed) {
            handleSubmit(true);
          }
        });
      } else {
        console.error('Submission error:', err.response);
        Swal.fire({
        title: 'Warning',
        text: data?.message || 'Conflict detected',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, override',
        cancelButtonText: 'Cancel',
      }).then((result) => {
        if (result.isConfirmed) {
          handleSubmit(true); // Retry with override
        }
      });

      }
    }
  };

  const handleDropdownChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
    type: 'driver' | 'vehicle'
  ) => {
    const selectedId = e.target.value;
    const fieldName = type === 'driver' ? 'driverId' : 'vehicleId';

    if (editingId) {
      const currentRoute = routes.find((route) => route.id === editingId);
      if (currentRoute && currentRoute[fieldName] === selectedId) {
        setForm((prev) => ({ ...prev, [fieldName]: selectedId }));
        if (type === 'driver') setOverrideDriver(false);
        if (type === 'vehicle') setOverrideVehicle(false);
        return;
      }
    }

    const existingRoute = routes.find(
      (route) =>
        route.id !== editingId &&
        (type === 'driver' ? route.driverId === selectedId : route.vehicleId === selectedId)
    );

    if (existingRoute) {
      const proceed = await Swal.fire({
        title: `${type === 'driver' ? 'Driver' : 'Vehicle'} Already Assigned`,
        text: `This ${type} is already assigned to route "${existingRoute.name}". Do you still want to assign it here?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
      });

      if (!proceed.isConfirmed) {
        // Reset the selection if the user cancels
        setForm((prev) => ({ ...prev, [fieldName]: '' }));
        return;
      } else {
        // Set override flag for the selected type
        if (type === 'driver') setOverrideDriver(true);
        if (type === 'vehicle') setOverrideVehicle(true);
      }
    } else {
      // Clear override flag if no conflict
      if (type === 'driver') setOverrideDriver(false);
      if (type === 'vehicle') setOverrideVehicle(false);
    }

    setForm((prev) => ({ ...prev, [fieldName]: selectedId }));
  };

  const filteredRoutes = routes.filter((route) =>
    `${route.name} ${route.startPoint} ${route.endPoint} ${route.driver?.name || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6">
        <ToastContainer position="top-right" />
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-blue-800">Route Management</h2>
        </div>

        <div className="bg-white shadow rounded p-4 overflow-auto">
          <div className="mb-4 flex justify-end gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="border p-2 rounded w-60"
            />
            <button
              onClick={() => setSearchTerm('')}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-2 rounded"
            >
              Reset
            </button>
          </div>

          <table className="w-full table-auto border">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2">Name</th>
                <th className="p-2">Start</th>
                <th className="p-2">End</th>
                <th className="p-2">Vehicle</th>
                <th className="p-2">Driver</th>
                <th className="p-2">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoutes.length > 0 ? (
                filteredRoutes.map((route) => (
                  <tr key={route.id} className="border-t">
                    <td className="p-2">{route.name}</td>
                    <td className="p-2">{route.startPoint}</td>
                    <td className="p-2">{route.endPoint}</td>
                    <td className="p-2">
                      {route.vehicleId
                        ? vehicles.find((v) => v.id === route.vehicleId)?.busNo +
                          ' (' +
                          vehicles.find((v) => v.id === route.vehicleId)?.capacity +
                          ')'
                        : '—'}
                    </td>
                    <td className="p-2">{route.driver?.name || '—'}</td>
                    <td className="p-2">
                      {route.status === 'active' ? (
                        <span className="text-green-600">Active</span>
                      ) : (
                        <span className="text-red-600">Inactive</span>
                      )}
                    </td>
                    <td className="p-2 space-x-4">
                      <button onClick={() => handleEdit(route)} className="text-blue-600">
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDelete(route.id)} className="text-red-600">
                        <FaTrash />
                      </button>
                      <button onClick={() => route.id && handleToggleStatus(route.id)} className="text-yellow-600">
                        {route.status === 'active' ? <FaToggleOn /> : <FaToggleOff />}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-gray-500">
                    No routes found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Floating Add Button */}
        <button
          onClick={() => {
            setForm({
              name: '',
              startPoint: '',
              endPoint: '',
              driverId: '',
              vehicleId: '',
              stops: [],
            });
            setOverrideDriver(false);
            setOverrideVehicle(false);
            setEditingId(null);
            setShowForm(true);
          }}
          title="Add Route"
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 flex items-center justify-center text-2xl shadow-lg z-50"
        >
          <FaPlus />
        </button>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl relative">
              <h3 className="text-xl font-semibold mb-4 text-blue-800">
                {editingId ? 'Edit Route' : 'Add Route'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="absolute top-2 right-3 text-gray-500 text-xl hover:text-black"
              >
                ×
              </button>

              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Route Name"
                  className="w-full border p-2 rounded"
                />
                <input
                  name="startPoint"
                  value={form.startPoint}
                  onChange={handleChange}
                  placeholder="Start Point"
                  className="w-full border p-2 rounded"
                />
                <input
                  name="endPoint"
                  value={form.endPoint}
                  onChange={handleChange}
                  placeholder="End Point"
                  className="w-full border p-2 rounded"
                />
                <select
                  value={form.driverId}
                  onChange={(e) => handleDropdownChange(e, 'driver')}
                  className="w-full border p-2 rounded"
                >
                  <option value="">Select Driver</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} ({driver.phone})
                    </option>
                  ))}
                </select>
                <select
                  value={form.vehicleId}
                  onChange={(e) => handleDropdownChange(e, 'vehicle')}
                  className="w-full border p-2 rounded"
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.busNo} (Capacity: {vehicle.capacity})
                    </option>
                  ))}
                </select>

                {/* Stop Entry Fields */}
                <div className="space-y-3">
                  <h4 className="text-lg font-medium">Stops</h4>
                  {form.stops?.map((stop, index) => (
                    <div key={index} className="border p-3 rounded bg-gray-50 space-y-2">
                      <select
                        value={stop.stopName}
                        onChange={(e) => handleStopChange(index, 'stopName', e.target.value)}
                        className="w-full border p-2 rounded"
                      >
                        <option value="">Select Stop</option>
                        {allStops.map((availableStop, idx) => (
                          <option key={idx} value={availableStop.stopName}>
                            {availableStop.stopName} ({availableStop.stopTime})
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2">
                        <input
                          placeholder="Stop Order"
                          type="number"
                          value={stop.stopOrder}
                          onChange={(e) => handleStopChange(index, 'stopOrder', e.target.value)}
                          className="w-full border p-2 rounded"
                        />
                        <span className="text-sm text-gray-500">(Auto-adjusted to {index + 1} on save)</span>
                      </div>
                      <input
                        placeholder="Stop Time"
                        value={stop.stopTime || 'N/A'}
                        className="w-full border p-2 rounded bg-gray-100 cursor-not-allowed"
                        disabled
                      />
                      <input
                        placeholder="Address"
                        value={stop.address || 'N/A'}
                        className="w-full border p-2 rounded bg-gray-100 cursor-not-allowed"
                        disabled
                      />
                      {/* <input
                        placeholder="Fee Amount"
                        type="number"
                        value={stop.feeAmount ?? 'N/A'}
                        className="w-full border p-2 rounded bg-gray-100 cursor-not-allowed"
                        disabled
                      /> */}
                      <button
                        onClick={() => removeStopField(index)}
                        className="text-red-600 text-sm underline"
                      >
                        Remove Stop
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addStopField}
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:bg-gray-400"
                    disabled={allStops.length === 0}
                  >
                    + Add Stop
                  </button>
                  {allStops.length === 0 && (
                    <p className="text-red-500 text-sm mt-2">No stops available. Please add stops first.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => handleSubmit()}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RouteManagement;