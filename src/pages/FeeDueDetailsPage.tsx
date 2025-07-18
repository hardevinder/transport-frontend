import React, { useEffect, useState } from 'react';
import axios from '../utils/axios';
import DashboardLayout from '../components/DashboardLayout';

interface Slab {
  slab: string;
  feeStructureId: string;
  dueAmount: number;
  finalPayable: number;
  concession: number;
  fine: number;
  paidAmount: number;
  status: string;
}

interface FeeDue {
  studentId: string;
  studentName: string;
  class: string;
  admissionNo: string;
  route: string;
  stop: string;
  slabs: Slab[];
  vehicle?: string;
}

const FeeDueDetailsPage: React.FC = () => {
  const [data, setData] = useState<FeeDue[]>([]);
  const [filtered, setFiltered] = useState<FeeDue[]>([]);
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [routeOptions, setRouteOptions] = useState<string[]>([]);
  const [busOptions, setBusOptions] = useState<string[]>([]);
  const [slabOptions, setSlabOptions] = useState<string[]>([]);

  const [filters, setFilters] = useState({
    class: '',
    route: '',
    vehicle: '',
    slab: '',
    admissionNo: '',
  });

  useEffect(() => {
    axios
      .get<{ count: number; data: FeeDue[] }>('/transactions/fee-due-details')
      .then(res => {
        const allData = res.data.data;
        setData(allData);
        setFiltered(allData);

        setClassOptions([...new Set(allData.map(d => d.class))].filter(Boolean));
        setRouteOptions([...new Set(allData.map(d => d.route))].filter(Boolean));
        setBusOptions([...new Set(allData.map(d => d.vehicle).filter((v): v is string => typeof v === 'string'))]);

        // Extract all unique slab names
        const slabs = new Set<string>();
        allData.forEach(d => d.slabs.forEach(s => slabs.add(s.slab)));
        setSlabOptions([...slabs]);
      })
      .catch(err => console.error('Error loading fee due details', err));
  }, []);

  const handleFilter = () => {
    const { class: cls, route, vehicle, slab, admissionNo } = filters;
    const result = data
      .map(d => ({
        ...d,
        slabs: d.slabs.filter(s =>
          !slab || s.slab === slab
        )
      }))
      .filter(d =>
        (!cls || d.class === cls) &&
        (!route || d.route === route) &&
        (!vehicle || d.vehicle === vehicle) &&
        (!admissionNo || d.admissionNo?.includes(admissionNo)) &&
        d.slabs.length > 0
      );

    setFiltered(result);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 Fee Due Details</h2>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-4">
          <select className="border p-2 rounded" value={filters.class}
            onChange={e => setFilters({ ...filters, class: e.target.value })}>
            <option value="">All Classes</option>
            {classOptions.map(cls => <option key={cls} value={cls}>{cls}</option>)}
          </select>

          <select className="border p-2 rounded" value={filters.route}
            onChange={e => setFilters({ ...filters, route: e.target.value })}>
            <option value="">All Routes</option>
            {routeOptions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <select className="border p-2 rounded" value={filters.vehicle}
            onChange={e => setFilters({ ...filters, vehicle: e.target.value })}>
            <option value="">All Buses</option>
            {busOptions.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          <select className="border p-2 rounded" value={filters.slab}
            onChange={e => setFilters({ ...filters, slab: e.target.value })}>
            <option value="">All Slabs</option>
            {slabOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <input
            type="text"
            placeholder="Admission No"
            className="border p-2 rounded"
            value={filters.admissionNo}
            onChange={e => setFilters({ ...filters, admissionNo: e.target.value })}
          />
        </div>

        <button
          onClick={handleFilter}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-4"
        >
          🔍 Filter
        </button>

        {/* Table */}
        <div className="overflow-x-auto rounded shadow bg-white">
          <table className="w-full table-auto border border-gray-200">
            <thead className="bg-gray-100 text-sm font-semibold text-center">
              <tr>
                <th className="p-2 border">#</th>
                <th className="p-2 border">Adm No</th>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Class</th>
                <th className="p-2 border">Route</th>
                <th className="p-2 border">Stop</th>
                <th className="p-2 border">Bus</th>
                <th className="p-2 border">Slab</th>
                <th className="p-2 border">Due ₹</th>
                <th className="p-2 border">Paid ₹</th>
                <th className="p-2 border">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={11} className="text-center py-4 text-gray-500">No data found</td></tr>
              )}
              {filtered.map((student, i) =>
                student.slabs.map((slab, j) => (
                  <tr key={`${student.studentId}-${j}`} className="text-center hover:bg-gray-50">
                    <td className="p-2 border">{i + 1}</td>
                    <td className="p-2 border">{student.admissionNo}</td>
                    <td className="p-2 border">{student.studentName}</td>
                    <td className="p-2 border">{student.class}</td>
                    <td className="p-2 border">{student.route}</td>
                    <td className="p-2 border">{student.stop}</td>
                    <td className="p-2 border">{student.vehicle ?? '—'}</td>
                    <td className="p-2 border">{slab.slab}</td>
                    <td className="p-2 border">₹{slab.finalPayable}</td>
                    <td className="p-2 border text-green-700 font-medium">₹{slab.paidAmount}</td>
                    <td className={`p-2 border ${slab.status === 'Paid' ? 'text-green-600' : 'text-red-600'}`}>
                      {slab.status}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FeeDueDetailsPage;
