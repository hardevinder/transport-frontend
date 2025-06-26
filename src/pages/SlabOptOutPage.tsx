import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { API } from '../config/api';
import { toast } from 'react-toastify';
import DashboardLayout from '../components/DashboardLayout';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Student {
  id: string;
  name: string;
  admissionNumber: string;
  classId: string;
}
interface Class {
  id: string;
  name: string;
}
interface FeeStructure {
  id: string;
  slab: string;
}
interface OptOut {
  id: string;
  studentId: string;
  feeStructureId: string;
  student?: Student;
  feeStructure?: FeeStructure;
}

const SlabOptOutPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [optOuts, setOptOuts] = useState<OptOut[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedTab, setSelectedTab] = useState<'class' | 'admission'>('class');
  const [selectedClass, setSelectedClass] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [admissionInput, setAdmissionInput] = useState('');
  const [slabEntries, setSlabEntries] = useState<{ feeStructureId: string }[]>([{ feeStructureId: '' }]);

  useEffect(() => {
    fetchStudents();
    fetchClasses();
    fetchFeeStructures();
    fetchOptOuts();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await axios.get<Student[]>(API.STUDENTS);
      setStudents(res.data);
    } catch {
      toast.error('Failed to load students');
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await axios.get<Class[]>(API.CLASSES);
      setClasses(res.data);
    } catch {
      toast.error('Failed to load classes');
    }
  };

  const fetchFeeStructures = async () => {
    try {
      const res = await axios.get<FeeStructure[]>(API.FEE_STRUCTURES);
      setFeeStructures(res.data);
    } catch {
      toast.error('Failed to load slabs');
    }
  };

  const fetchOptOuts = async () => {
    try {
      const res = await axios.get<OptOut[]>(API.OPT_OUT_SLABS);
      setOptOuts(res.data);
    } catch {
      toast.error('Failed to load opt-outs');
    }
  };

  const openModal = (mode: 'add' | 'edit' = 'add', studentId?: string) => {
    setModalOpen(true);
    setModalMode(mode);
    setSelectedTab('class');
    setSelectedClass('');
    setFilteredStudents([]);
    setSelectedStudentId('');
    setAdmissionInput('');
    setSlabEntries([{ feeStructureId: '' }]);

    if (mode === 'edit' && studentId) {
      setSelectedStudentId(studentId);
      const studentOptOuts = optOuts.filter(o => o.studentId === studentId);
      setSlabEntries(studentOptOuts.map(o => ({ feeStructureId: o.feeStructureId })));
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedStudentId('');
    setSlabEntries([{ feeStructureId: '' }]);
  };

  const handleSelectByClass = (classId: string) => {
    setSelectedClass(classId);
    setSelectedStudentId('');
    if (classId) {
      const filtered = students.filter(s => s.classId === classId);
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents([]);
    }
  };

  const handleSearchAdmission = () => {
    setSelectedClass('');
    setFilteredStudents([]);
    const stu = students.find(s => s.admissionNumber === admissionInput);
    if (!stu) {
      toast.error('Student not found');
      return;
    }
    setSelectedStudentId(stu.id);
  };

  const addRow = () => setSlabEntries(prev => [...prev, { feeStructureId: '' }]);
  const removeRow = (idx: number) => setSlabEntries(prev => prev.filter((_, i) => i !== idx));
  const updateRow = (idx: number, value: string) =>
    setSlabEntries(prev => prev.map((r, i) => (i === idx ? { feeStructureId: value } : r)));

  const handleSave = async () => {
    if (!selectedStudentId) {
      toast.error('Select a student');
      return;
    }
    const validEntries = slabEntries.filter(r => r.feeStructureId);
    if (validEntries.length === 0) {
      toast.error('Add at least one slab');
      return;
    }

    try {
      if (modalMode === 'edit') {
        // Delete existing opt-outs for the student
        const existingOptOuts = optOuts.filter(o => o.studentId === selectedStudentId);
        await Promise.all(existingOptOuts.map(o => axios.delete(`${API.OPT_OUT_SLABS}/${o.id}`)));
        // Save new opt-outs
        await Promise.all(
          validEntries.map(r =>
            axios.post(API.OPT_OUT_SLABS, {
              studentId: selectedStudentId,
              feeStructureId: r.feeStructureId,
            })
          )
        );
        toast.success('Opt-outs updated');
      } else {
        await Promise.all(
          validEntries.map(r =>
            axios.post(API.OPT_OUT_SLABS, {
              studentId: selectedStudentId,
              feeStructureId: r.feeStructureId,
            })
          )
        );
        toast.success('Opt-outs saved');
      }
      closeModal();
      fetchOptOuts();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Save failed');
    }
  };

  const handleDelete = async (studentId: string) => {
    if (!window.confirm('Are you sure you want to delete all opt-outs for this student?')) return;
    try {
      const studentOptOuts = optOuts.filter(o => o.studentId === studentId);
      await Promise.all(studentOptOuts.map(o => axios.delete(`${API.OPT_OUT_SLABS}/${o.id}`)));
      toast.success('Opt-outs deleted');
      fetchOptOuts();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  // Group opt-outs by student
  const grouped = Object.values(
    optOuts.reduce((acc, o) => {
      if (!acc[o.studentId]) {
        acc[o.studentId] = {
          student: o.student,
          className: classes.find(c => c.id === o.student?.classId)?.name || 'N/A',
          slabs: [],
          ids: [],
        };
      }
      if (o.feeStructure?.slab) {
        acc[o.studentId].slabs.push(o.feeStructure.slab);
        acc[o.studentId].ids.push(o.feeStructureId); // Store feeStructureId for filtering
      }
      return acc;
    }, {} as Record<string, { student?: Student; className: string; slabs: string[]; ids: string[] }>)
  );

  // Get available fee structures for a student (exclude already opted-out slabs)
  const getAvailableFeeStructures = (studentId: string) => {
    const optedOutSlabIds = optOuts
      .filter(o => o.studentId === studentId)
      .map(o => o.feeStructureId);
    return feeStructures.filter(fs => !optedOutSlabIds.includes(fs.id));
  };

   // ⬇️ Insert this right here ⬇️
  const getSelectableFeeStructures = (rowIndex: number) => {
    // 1) all slabs the student has already opted out of
    const optedOut = optOuts
      .filter(o => o.studentId === selectedStudentId)
      .map(o => o.feeStructureId);

    // 2) start from full list minus those global opt-outs
    let available = feeStructures.filter(fs => !optedOut.includes(fs.id));

    // 3) remove slabs picked by any other row
    const pickedElsewhere = slabEntries
      .map((e, i) => (i !== rowIndex ? e.feeStructureId : null))
      .filter(Boolean) as string[];
    available = available.filter(fs => !pickedElsewhere.includes(fs.id));

    // 4) if this row already has a value, put it back at the top
    const me = slabEntries[rowIndex].feeStructureId;
    if (me && !available.find(fs => fs.id === me)) {
      const fs = feeStructures.find(x => x.id === me);
      if (fs) available = [fs, ...available];
    }
    return available;
  };


  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800">Slab Opt-Out Management</h2>
            <button
              onClick={() => openModal('add')}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition duration-200"
            >
              Add Opt-Out
            </button>
          </div>

          <div className="bg-white shadow shadown-md rounded-lg overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-indigo-100">
                  <th className="p-3 text-left text-gray-700 font-semibold">Student</th>
                  <th className="p-3 text-left text-gray-700 font-semibold">Admission Number</th>
                  <th className="p-3 text-left text-gray-700 font-semibold">Class</th>
                  <th className="p-3 text-left text-gray-700 font-semibold">Opted-Out Slabs</th>
                  <th className="p-3 text-left text-gray-700 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map((g, i) => (
                  <tr key={i} className="hover:bg-gray-50 border-b">
                    <td className="p-3 text-gray-800">{g.student?.name || 'N/A'}</td>
                    <td className="p-3 text-gray-800">{g.student?.admissionNumber || 'N/A'}</td>
                    <td className="p-3 text-gray-800">{g.className}</td>
                    <td className="p-3 text-gray-800">{g.slabs.join(', ') || 'None'}</td>
                    <td className="p-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => openModal('edit', g.student?.id)}
                          className="text-indigo-600 hover:text-indigo-800"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(g.student?.id!)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {grouped.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-3 text-center text-gray-600">
                      No opt-outs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {modalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
              <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">
                  {modalMode === 'add' ? 'Add Slab Opt-Out' : 'Edit Slab Opt-Out'}
                </h3>

                <div className="flex mb-6 border-b">
                  <button
                    className={`flex-1 py-3 text-sm font-medium ${selectedTab === 'class' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600'}`}
                    onClick={() => setSelectedTab('class')}
                  >
                    By Class
                  </button>
                  <button
                    className={`flex-1 py-3 text-sm font-medium ${selectedTab === 'admission' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600'}`}
                    onClick={() => setSelectedTab('admission')}
                  >
                    By Admission
                  </button>
                </div>

                {selectedTab === 'class' && modalMode === 'add' ? (
                  <>
                    <select
                      className="w-full mb-4 p-3 border rounded-lg text-gray-700 focus:ring-2 focus:ring-indigo-500"
                      value={selectedClass}
                      onChange={e => handleSelectByClass(e.target.value)}
                    >
                      <option value="">Select Class</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {filteredStudents.length > 0 && (
                      <select
                        className="w-full mb-4 p-3 border rounded-lg text-gray-700 focus:ring-2 focus:ring-indigo-500"
                        value={selectedStudentId}
                        onChange={e => setSelectedStudentId(e.target.value)}
                      >
                        <option value="">Select Student</option>
                        {filteredStudents.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.admissionNumber})
                          </option>
                        ))}
                      </select>
                    )}
                  </>
                ) : modalMode === 'add' ? (
                  <div className="mb-4 flex">
                    <input
                      type="text"
                      placeholder="Admission Number"
                      className="flex-1 p-3 border rounded-l-lg text-gray-700 focus:ring-2 focus:ring-indigo-500"
                      value={admissionInput}
                      onChange={e => setAdmissionInput(e.target.value)}
                    />
                    <button
                      onClick={handleSearchAdmission}
                      className="bg-indigo-600 text-white px-4 py-3 rounded-r-lg hover:bg-indigo-700"
                    >
                      Search
                    </button>
                  </div>
                ) : null}

                {selectedStudentId && (
                  <div className="mb-6">
                    <p className="mb-3 text-gray-700">
                      Student: <span className="font-semibold">{students.find(s => s.id === selectedStudentId)?.name}</span>
                    </p>
                    {slabEntries.map((row, idx) => (
                    <div key={idx} className="flex gap-3 mb-3">
                        <select
                        className="flex-1 p-3 border rounded-lg text-gray-700 focus:ring-2 focus:ring-indigo-500"
                        value={row.feeStructureId}
                        onChange={e => updateRow(idx, e.target.value)}
                        >
                        <option value="">Select Slab</option>
                        {getSelectableFeeStructures(idx).map(fs => (
                            <option key={fs.id} value={fs.id}>
                            {fs.slab}
                            </option>
                        ))}
                        </select>
                        {slabEntries.length > 1 && (
                        <button
                            onClick={() => removeRow(idx)}
                            className="text-red-600 hover:text-red-800 font-medium"
                        >
                            Remove
                        </button>
                        )}
                    </div>
                    ))}
                    <button
                      onClick={addRow}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      disabled={getAvailableFeeStructures(selectedStudentId).length === 0}
                    >
                      + Add Another Slab
                    </button>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    onClick={closeModal}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    {modalMode === 'add' ? 'Save' : 'Update'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SlabOptOutPage;