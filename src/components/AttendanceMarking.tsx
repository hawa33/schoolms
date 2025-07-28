"use client";

import { useState, useEffect } from 'react';
import { Class, Student } from '@prisma/client';
import { CheckCircle, XCircle, Clock, Users } from 'lucide-react';

type StudentWithClass = Student & { 
  class: Class;
};

interface AttendanceMarkingProps {
  students: StudentWithClass[];
  selectedDate: string;
  selectedClassId?: string;
}

interface AttendanceRecord {
  [studentId: string]: 'present' | 'absent' | 'late';
}

const AttendanceMarking = ({ students, selectedDate, selectedClassId }: AttendanceMarkingProps) => {
  const [attendance, setAttendance] = useState<AttendanceRecord>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Initialize attendance records and fetch existing attendance
  useEffect(() => {
    const initialAttendance: AttendanceRecord = {};
    students.forEach(student => {
      initialAttendance[student.id] = 'present';
    });
    setAttendance(initialAttendance);

    fetchExistingAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, selectedDate, selectedClassId]);

  const fetchExistingAttendance = async () => {
    try {
      const response = await fetch(`/api/attendance?date=${selectedDate}&classId=${selectedClassId || ''}`);
      if (response.ok) {
        const existingAttendance = await response.json();
        const attendanceMap: AttendanceRecord = {};

        existingAttendance.forEach((record: any) => {
          // Use record.status instead of just present/absent for late handling
          attendanceMap[record.studentId] = record.status || (record.present ? 'present' : 'absent');
        });

        setAttendance(prev => ({ ...prev, ...attendanceMap }));
      }
    } catch (error) {
      console.error('Error fetching existing attendance:', error);
    }
  };

  const updateAttendance = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const getAttendanceStats = () => {
    const total = students.length;
    const present = Object.values(attendance).filter(status => status === 'present').length;
    const absent = Object.values(attendance).filter(status => status === 'absent').length;
    const late = Object.values(attendance).filter(status => status === 'late').length;

    return { total, present, absent, late };
  };

  const markAllPresent = () => {
    const allPresent: AttendanceRecord = {};
    students.forEach(student => {
      allPresent[student.id] = 'present';
    });
    setAttendance(allPresent);
  };

  const markAllAbsent = () => {
    const allAbsent: AttendanceRecord = {};
    students.forEach(student => {
      allAbsent[student.id] = 'absent';
    });
    setAttendance(allAbsent);
  };

  const saveAttendance = async () => {
    setLoading(true);
    setMessage('');

    try {
      const attendanceData = students.map(student => ({
        studentId: student.id,
        date: selectedDate,
        status: attendance[student.id], // sending 'present' | 'absent' | 'late'
      }));

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendanceData),
      });

      if (response.ok) {
        setMessage('Attendance saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save attendance');
      }
    } catch (error: any) {
      setMessage(`Error saving attendance: ${error.message}`);
      console.error('Error saving attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = getAttendanceStats();

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Total Students</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Present</p>
              <p className="text-2xl font-bold text-green-900">{stats.present}</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-red-600">Absent</p>
              <p className="text-2xl font-bold text-red-900">{stats.absent}</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-600">Late</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.late}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={markAllPresent}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Mark All Present
          </button>
          <button
            onClick={markAllAbsent}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Mark All Absent
          </button>
        </div>

        <button
          onClick={saveAttendance}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.toLowerCase().includes('error')
            ? 'bg-red-100 text-red-800 border border-red-200'
            : 'bg-green-100 text-green-800 border border-green-200'
        }`}>
          {message}
        </div>
      )}

      {/* Student List */}
      <div className="space-y-2">
        {students.map(student => (
          <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {student.name.charAt(0)}{student.surname?.charAt(0)}
                </span>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900">
                  {student.name} {student.surname}
                </h3>
                <p className="text-sm text-gray-500">
                  {student.username} • {student.class.name}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => updateAttendance(student.id, 'present')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  attendance[student.id] === 'present'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                }`}
              >
                Present
              </button>
              <button
                onClick={() => updateAttendance(student.id, 'late')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  attendance[student.id] === 'late'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-yellow-100'
                }`}
              >
                Late
              </button>
              <button
                onClick={() => updateAttendance(student.id, 'absent')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  attendance[student.id] === 'absent'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                }`}
              >
                Absent
              </button>
            </div>
          </div>
        ))}
      </div>

      {students.length === 0 && (
        <div className="text-center py-8">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try selecting a different class or adjusting your search.
          </p>
        </div>
      )}
    </div>
  );
};

export default AttendanceMarking;
