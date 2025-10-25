import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { attendanceAPI, faceAPI } from '../services/api';
import { 
  Calendar, 
  CheckCircle, 
  Camera, 
  TrendingUp, 
  AlertCircle,
  Clock
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [faceStatus, setFaceStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch attendance statistics
      const attendanceRes = await attendanceAPI.getMyAttendance();
      const attendanceData = attendanceRes.data.data || [];
      const statistics = attendanceRes.data.statistics || {};

      setStats({
        totalDays: statistics.totalDays || 0,
        presentDays: statistics.presentDays || 0,
        attendancePercentage: statistics.attendancePercentage || 0,
      });

      // Get last 5 records
      setRecentAttendance(attendanceData.slice(0, 5));

      // Check face enrollment status
      const faceRes = await faceAPI.getFaceStatus();
      setFaceStatus(faceRes.data.data);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user?.name}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Student ID: {user?.studentId} | {user?.department}
          </p>
        </div>

        {/* Face Enrollment Alert */}
        {!faceStatus?.isFaceEnrolled && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-6 w-6 text-yellow-600 mt-0.5" />
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  Face Enrollment Required
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Please enroll your face to enable automatic attendance marking.
                </p>
                <button
                  onClick={() => navigate('/enroll-face')}
                  className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-medium"
                >
                  Enroll Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Days */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Days</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.totalDays || 0}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Present Days */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Present Days</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats?.presentDays || 0}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Attendance Percentage */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Attendance Rate</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {stats?.attendancePercentage || 0}%
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => navigate('/enroll-face')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6 hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105"
          >
            <div className="flex items-center gap-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <Camera className="h-8 w-8" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold">Enroll Face</h3>
                <p className="text-sm text-blue-100">Register your face for attendance</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/mark-attendance')}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6 hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105"
          >
            <div className="flex items-center gap-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <CheckCircle className="h-8 w-8" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold">Mark Attendance</h3>
                <p className="text-sm text-green-100">Use face recognition to mark attendance</p>
              </div>
            </div>
          </button>
        </div>

        {/* Recent Attendance */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-6 w-6 text-blue-600" />
            Recent Attendance
          </h2>

          {recentAttendance.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-3" />
              <p>No attendance records yet</p>
              <p className="text-sm">Mark your first attendance to see it here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentAttendance.map((record, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.status === 'present'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.method}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {recentAttendance.length > 0 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => navigate('/attendance-history')}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View All History →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
