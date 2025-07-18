// src/pages/FeeStructureManagement.tsx
import React, { useEffect, useState, useCallback } from 'react';
import axios from '../utils/axios';
import { API } from '../config/api';
import { toast } from 'react-toastify';
import DashboardLayout from '../components/DashboardLayout';
import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa';

interface Route {
  id: string;
  name: string;
}

interface Stop {
  id: string;
  stopName: string;
}

interface FeeStructure {
  id: string;
  routeId: string;
  stopId: string;
  stop?: Stop;
  slab: string;
  amount: number;
  frequency: string;
}

interface FeeInput {
  stopId: string;
  stopName: string;
  amounts: string[];
}

const frequencyOptions = [
  { value: 'monthly', label: 'Monthly', count: 12, labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] },
  { value: 'quarterly', label: 'Quarterly', count: 4, labels: ['Q1', 'Q2', 'Q3', 'Q4'] },
  { value: 'half-yearly', label: 'Half-Yearly', count: 2, labels: ['H1', 'H2'] },
  { value: 'custom', label: 'Custom', count: 1, labels: ['Custom Installment'] },
];

const FeeStructureManagement: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [fees, setFees] = useState<FeeInput[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [allFeeStructures, setAllFeeStructures] = useState<FeeStructure[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingFeeData, setEditingFeeData] = useState<FeeStructure | null>(null);
  const [editFrequencyLabels, setEditFrequencyLabels] = useState<string[]>([]);

  const getFrequencyMeta = useCallback(() => {
    if (isEditing) {
      return { ...frequencyOptions.find((opt) => opt.value === frequency)!, labels: editFrequencyLabels };
    }
    return frequencyOptions.find((opt) => opt.value === frequency) || frequencyOptions[0];
  }, [frequency, isEditing, editFrequencyLabels]);

  const fetchFeeStructures = async () => {
    try {
      const res = await axios.get<FeeStructure[]>(API.FEE_STRUCTURES);
      setAllFeeStructures(res.data);
    } catch (error) {
      toast.error('Failed to load fee structures');
    }
  };

  useEffect(() => {
    axios.get<Route[]>(API.ROUTES).then((res) => setRoutes(res.data));
    fetchFeeStructures();
  }, []);

  useEffect(() => {
    if (selectedRoute && !isEditing) {
      axios.get<Stop[]>(`${API.STOPS}/${selectedRoute}`).then((res) => {
        const stopsData = res.data;
        setStops(stopsData);
        setFees(
          stopsData.map((stop) => ({
            stopId: stop.id,
            stopName: stop.stopName,
            amounts: Array(getFrequencyMeta().count).fill(''),
          }))
        );
      });
    }
  }, [selectedRoute, frequency, getFrequencyMeta, isEditing]);

  const handleAmountChange = (stopId: string, index: number, value: string) => {
    setFees((prev) =>
      prev.map((fee) =>
        fee.stopId === stopId ? { ...fee, amounts: fee.amounts.map((a, i) => (i === index ? value : a)) } : fee
      )
    );
  };

  const handleEdit = (fee: FeeStructure) => {
    setSelectedRoute(fee.routeId);
    setFrequency(fee.frequency);

    const slabs = [fee.slab];
    setEditFrequencyLabels(slabs);

    const feeInput: FeeInput = {
      stopId: fee.stopId,
      stopName: getStopName(fee.stopId),
      amounts: [fee.amount.toString()],
    };

    setFees([feeInput]);
    setEditingFeeData(fee);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    const installmentLabels = getFrequencyMeta().labels;

    for (let stopFee of fees) {
      for (let i = 0; i < installmentLabels.length; i++) {
        const slabLabel = installmentLabels[i];
        const payload = {
          routeId: selectedRoute,
          stopId: stopFee.stopId,
          slab: slabLabel,
          amount: parseFloat(stopFee.amounts[i]),
          frequency,
          installments: [slabLabel],
          effectiveFrom: new Date().toISOString(),
        };

        try {
          if (isEditing && editingFeeData) {
            await axios.put(`${API.FEE_STRUCTURES}/${editingFeeData.id}`, payload);
          } else {
            await axios.post(API.FEE_STRUCTURES, payload);
          }
        } catch (err) {
          toast.error('Error submitting fee structure');
        }
      }
    }

    toast.success(isEditing ? 'Fee structure updated' : 'Fee structure saved');
    setShowModal(false);
    setIsEditing(false);
    setEditingFeeData(null);
    setEditFrequencyLabels([]);
    fetchFeeStructures();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure to delete this fee structure?')) {
      try {
        await axios.delete(`${API.FEE_STRUCTURES}/${id}`);
        toast.success('Deleted successfully');
        fetchFeeStructures();
      } catch {
        toast.error('Failed to delete');
      }
    }
  };

  const getStopName = (stopId: string) => {
    return stops.find((s) => s.id === stopId)?.stopName || 'N/A';
  };

  return (
    <DashboardLayout>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Transport Fee Structure Management</h2>
          <button onClick={() => {
            setIsEditing(false);
            setEditFrequencyLabels([]);
            setShowModal(true);
          }} className="bg-blue-600 text-white px-3 py-2 rounded flex items-center">
            <FaPlus className="mr-1" /> Add Fee Structure
          </button>
        </div>

        <div className="mb-4">
          <label className="mr-2">Filter by Route:</label>
          <select value={selectedRoute} onChange={(e) => setSelectedRoute(e.target.value)} className="border p-1">
            <option value="">--Select--</option>
            {routes.map((route) => (
              <option key={route.id} value={route.id}>{route.name}</option>
            ))}
          </select>
        </div>

        {selectedRoute && (
          <div className="border rounded p-4 bg-gray-50">
            <h3 className="text-md font-semibold mb-2">Fee Structures for Selected Route</h3>
            <table className="w-full border">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2 text-left">Stop Name</th>
                  <th className="border p-2 text-left">Slab</th>
                  <th className="border p-2 text-left">Amount</th>
                  <th className="border p-2 text-left">Frequency</th>
                  <th className="border p-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allFeeStructures.filter(f => f.routeId === selectedRoute).map(fee => (
                  <tr key={fee.id}>
                    <td className="border p-2">{getStopName(fee.stopId)}</td>
                    <td className="border p-2">{fee.slab}</td>
                    <td className="border p-2">{fee.amount}</td>
                    <td className="border p-2 capitalize">{fee.frequency}</td>
                    <td className="border p-2 text-center">
                      <button onClick={() => handleEdit(fee)} className="text-blue-600 mr-2"><FaEdit /></button>
                      <button onClick={() => handleDelete(fee.id)} className="text-red-600"><FaTrash /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-5xl w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{isEditing ? 'Edit Fee Structure' : 'Add Fee Structure'}</h3>
                <button onClick={() => setShowModal(false)} className="text-red-500 font-bold">✕</button>
              </div>

              <div className="flex gap-4 mb-4">
                <div>
                  <label className="mr-2">Select Route:</label>
                  <select value={selectedRoute} onChange={(e) => setSelectedRoute(e.target.value)} className="border p-1">
                    <option value="">--Select--</option>
                    {routes.map((route) => (
                      <option key={route.id} value={route.id}>{route.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mr-2">Frequency:</label>
                  <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="border p-1" disabled={isEditing}>
                    {frequencyOptions.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {fees.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full border">
                    <thead>
                      <tr>
                        <th className="border px-2 py-1">Stop Name</th>
                        {getFrequencyMeta().labels.map((label, idx) => (
                          <th key={idx} className="border px-2 py-1">{label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {fees.map((fee) => (
                        <tr key={fee.stopId}>
                          <td className="border px-2 py-1">{fee.stopName}</td>
                          {fee.amounts.map((amt, idx) => (
                            <td key={idx} className="border px-2 py-1">
                              <input
                                type="number"
                                value={amt}
                                onChange={(e) => handleAmountChange(fee.stopId, idx, e.target.value)}
                                className="w-20 p-1 border"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end mt-4">
                <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 text-white rounded">{isEditing ? 'Update' : 'Save'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FeeStructureManagement;
