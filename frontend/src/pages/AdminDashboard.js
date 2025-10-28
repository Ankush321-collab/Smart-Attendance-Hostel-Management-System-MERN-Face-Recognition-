import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { Users, UserCheck, Calendar, Building, TrendingUp, Download, AlertCircle } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/dashboard');
      setDashboardData(response.data.data);
    } catch (error) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportAttendance = async () => {
    try {
      const response = await api.get('/attendance/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'attendance_report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export attendance data');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      </div>
    );
  }

 return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/20 dark:from-gray-900 dark:via-blue-900/10 dark:to-indigo-900/5 transition-all duration-500">
    {/* Floating particles background */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-gradient-to-r from-blue-400/20 to-purple-500/20 dark:from-blue-500/10 dark:to-purple-600/10 animate-float"
          style={{
            width: Math.random() * 60 + 20,
            height: Math.random() * 60 + 20,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${Math.random() * 10 + 10}s`
          }}
        />
      ))}
    </div>

    <Navbar />
    
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 relative z-10">
      {/* Header with glass morphism */}
      <div className="px-4 py-8 sm:px-0 mb-8">
        <div className="relative group">
          {/* Animated gradient border */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
          
          <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-gray-700/30 shadow-2xl">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-2">
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-800 via-blue-600 to-purple-600 dark:from-gray-100 dark:via-blue-300 dark:to-purple-400 bg-clip-text text-transparent animate-gradient-x">
                  Admin Dashboard
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                  Welcome back, <span className="font-semibold text-blue-600 dark:text-blue-400">{user?.name}</span>! Here's what's happening today.
                </p>
              </div>
              
              <button
                onClick={exportAttendance}
                className="group relative inline-flex items-center px-6 py-3 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500/30 dark:focus:ring-blue-400/20"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Download className="h-5 w-5 mr-3 transform group-hover:scale-110 transition-transform duration-300" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-pink-600 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
          <div className="relative p-4 bg-red-100/80 dark:bg-red-900/30 backdrop-blur-xl border border-red-200/50 dark:border-red-700/50 text-red-700 dark:text-red-300 rounded-xl transition-all duration-300">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
              {error}
            </div>
          </div>
        </div>
      )}

      {dashboardData && (
        <>
          {/* Overview Cards with 3D effects */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {[
              {
                icon: Users,
                label: "Total Students",
                value: dashboardData.overview.totalStudents,
                color: "from-blue-500 to-cyan-500",
                bgColor: "bg-blue-500/10"
              },
              {
                icon: UserCheck,
                label: "Face Enrolled",
                value: dashboardData.overview.enrolledStudents,
                color: "from-green-500 to-emerald-500",
                bgColor: "bg-green-500/10"
              },
              {
                icon: Calendar,
                label: "Today's Attendance",
                value: dashboardData.overview.todayAttendance,
                color: "from-purple-500 to-pink-500",
                bgColor: "bg-purple-500/10"
              },
              {
                icon: TrendingUp,
                label: "Attendance Rate",
                value: `${dashboardData.overview.attendancePercentage}%`,
                color: "from-orange-500 to-red-500",
                bgColor: "bg-orange-500/10"
              }
            ].map((card, index) => (
              <div
                key={index}
                className="group relative cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Hover effect layer */}
                <div className="absolute -inset-2 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur rounded-2xl group-hover:animate-pulse"></div>
                
                <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-gray-700/30 shadow-lg hover:shadow-2xl transform transition-all duration-500 group-hover:-translate-y-2 group-hover:scale-105">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-xl ${card.bgColor} transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                      <card.icon className={`h-6 w-6 bg-gradient-to-r ${card.color} bg-clip-text text-transparent`} />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors duration-200">
                        {card.label}
                      </p>
                      <p className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                        {card.value}
                      </p>
                    </div>
                  </div>
                  
                  {/* Animated progress bar for attendance rate card */}
                  {card.label === "Attendance Rate" && (
                    <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${dashboardData.overview.attendancePercentage}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Hostel Overview with enhanced design */}
          <div className="mb-8">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
              <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-gray-700/30 shadow-xl">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-blue-600 dark:from-gray-100 dark:to-blue-400 bg-clip-text text-transparent mb-6">
                  Hostel Overview
                </h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  {[
                    {
                      icon: Building,
                      label: "Total Capacity",
                      value: dashboardData.hostel.totalCapacity,
                      color: "text-blue-500",
                      gradient: "from-blue-500 to-cyan-500"
                    },
                    {
                      icon: Users,
                      label: "Occupied",
                      value: dashboardData.hostel.occupiedBeds,
                      color: "text-green-500",
                      gradient: "from-green-500 to-emerald-500"
                    },
                    {
                      icon: "progress",
                      label: "Occupancy Rate",
                      value: `${dashboardData.hostel.occupancyRate}%`,
                      subValue: `${dashboardData.hostel.availableBeds} Available`,
                      color: "text-purple-500",
                      gradient: "from-purple-500 to-pink-500"
                    }
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="group/item p-4 rounded-lg bg-gradient-to-br from-white/50 to-white/10 dark:from-gray-700/50 dark:to-gray-700/10 hover:from-white/80 hover:to-white/30 dark:hover:from-gray-600/50 dark:hover:to-gray-600/30 border border-white/30 dark:border-gray-600/30 backdrop-blur-sm transform hover:scale-105 transition-all duration-300"
                    >
                      <div className="flex items-center">
                        {item.icon !== "progress" ? (
                          <item.icon className={`h-8 w-8 mr-4 ${item.color} transform group-hover/item:scale-110 transition-transform duration-300`} />
                        ) : (
                          <div className="w-8 h-8 mr-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center transform group-hover/item:scale-110 transition-transform duration-300">
                            <span className="text-white text-sm font-bold">
                              {dashboardData.hostel.occupancyRate}%
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {item.label}
                          </p>
                          <p className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                            {item.value}
                          </p>
                          {item.subValue && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {item.subValue}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Attendance with modern table design */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
            <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-xl border border-white/20 dark:border-gray-700/30 shadow-xl overflow-hidden">
              <div className="px-6 py-5">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-blue-600 dark:from-gray-100 dark:to-blue-400 bg-clip-text text-transparent">
                  Recent Attendance
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-700/80 dark:to-gray-800/80 backdrop-blur-sm">
                      {["Student", "Time", "Method", "Status"].map((header) => (
                        <th
                          key={header}
                          className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200/50 dark:border-gray-600/50"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50 dark:divide-gray-600/50">
                    {dashboardData.recentAttendance.map((record, index) => (
                      <tr
                        key={record._id}
                        className="group/row hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm transform group-hover/row:scale-110 transition-transform duration-300">
                              {record.studentName.charAt(0)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {record.studentName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {record.studentId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                            {record.time}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100/80 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 backdrop-blur-sm border border-blue-200/50 dark:border-blue-700/50">
                            {record.method}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100/80 dark:bg-green-900/50 text-green-800 dark:text-green-300 backdrop-blur-sm border border-green-200/50 dark:border-green-700/50 transform group-hover/row:scale-110 transition-transform duration-300">
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>

    {/* Add custom animations to tailwind.config.js */}
    <style jsx>{`
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(180deg); }
      }
      @keyframes gradient-x {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      @keyframes tilt {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(0.5deg); }
        75% { transform: rotate(-0.5deg); }
      }
      .animate-float { animation: float 10s ease-in-out infinite; }
      .animate-gradient-x { 
        background-size: 200% 200%;
        animation: gradient-x 3s ease infinite;
      }
      .animate-tilt { animation: tilt 10s ease-in-out infinite; }
    `}</style>
  </div>
);
};

export default AdminDashboard;