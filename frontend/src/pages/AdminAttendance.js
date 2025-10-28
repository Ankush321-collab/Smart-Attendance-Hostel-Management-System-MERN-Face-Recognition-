import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { Search, Filter, Download, Calendar, Trash2, AlertCircle, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const AdminAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    date: '',
    studentId: '',
    status: '',
    startDate: '',
    endDate: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...filters
      });

      if (searchTerm) {
        params.append('studentId', searchTerm);
      }

      const response = await api.get(`/attendance?${params}`);
      setAttendance(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      setError('Failed to fetch attendance data');
      console.error('Fetch attendance error:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, searchTerm]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAttendance();
  };

  const clearFilters = () => {
    setFilters({
      date: '',
      studentId: '',
      status: '',
      startDate: '',
      endDate: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const exportAttendance = async () => {
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/attendance/export?${params}`, { 
        responseType: 'blob' 
      });
      
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

  const deleteAttendance = async (id) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) {
      return;
    }

    try {
      await api.delete(`/attendance/${id}`);
      fetchAttendance();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete attendance record');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'absent':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'late':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case 'face':
        return '🤖';
      case 'qr':
        return '📱';
      case 'manual':
        return '✋';
      default:
        return '📋';
    }
  };

 return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-gray-900 dark:via-blue-900/10 dark:to-indigo-900/5 transition-all duration-500">
    {/* Floating Particles Background */}
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -inset-10 opacity-50">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-400/20 dark:bg-blue-300/10 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>
    </div>

    <Navbar />
    
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 relative z-10">
      <div className="px-4 py-6 sm:px-0">
        {/* Header with Glass Morphism */}
        <div className="group relative mb-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-2xl">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 dark:from-gray-100 dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent transition-all duration-300">
                  Attendance Management
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 transition-colors duration-300 font-light">
                  View, filter, and manage attendance records with precision
                </p>
              </div>
              <button
                onClick={exportAttendance}
                className="group relative inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <Download className="h-5 w-5 mr-2 transition-transform duration-300 group-hover:scale-110" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-100/80 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl backdrop-blur-sm transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              {error}
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div className="group relative mb-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/50 via-transparent to-purple-500/50 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
          <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/30 dark:border-gray-700/50 shadow-xl transition-all duration-500 hover:shadow-2xl">
            <div className="flex items-center mb-6">
              <Filter className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Advanced Filters
              </h3>
            </div>
            
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Search with Enhanced Styling */}
              <div className="group relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                  Search Student ID
                </label>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-300"></div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="relative block w-full pl-10 pr-4 py-3 border-0 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white dark:focus:bg-gray-700 transition-all duration-300 shadow-lg"
                    placeholder="STU001"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400 dark:text-gray-500 transition-colors duration-300" />
                  </div>
                </div>
              </div>

              {/* Status Filter */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                  Status
                </label>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-300"></div>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="relative block w-full pl-3 pr-10 py-3 border-0 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white dark:focus:bg-gray-700 transition-all duration-300 shadow-lg appearance-none"
                  >
                    <option value="">All Status</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
              </div>

              {/* Date Range */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                  Start Date
                </label>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-300"></div>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="relative block w-full px-4 py-3 border-0 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white dark:focus:bg-gray-700 transition-all duration-300 shadow-lg"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                  End Date
                </label>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-300"></div>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="relative block w-full px-4 py-3 border-0 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white dark:focus:bg-gray-700 transition-all duration-300 shadow-lg"
                  />
                </div>
              </div>
            </form>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                onClick={handleSearch}
                className="group relative inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-lg overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <Filter className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:scale-110" />
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className="group relative inline-flex items-center px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-white dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-lg"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="group relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/30 via-transparent to-purple-500/30 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
          <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-700/50 shadow-2xl overflow-hidden transition-all duration-500 hover:shadow-3xl">
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-white/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                  Attendance Records
                </h3>
                {attendance.length > 0 && (
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-700/50 px-3 py-1 rounded-full backdrop-blur-sm">
                    {attendance.length} records
                  </span>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin"></div>
                  <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
                </div>
              </div>
            ) : attendance.length === 0 ? (
              <div className="text-center py-16">
                <div className="relative inline-block">
                  <Calendar className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur opacity-20 animate-pulse"></div>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">No attendance records</h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  No attendance records found matching your current filter criteria.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
                    <thead className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm">
                      <tr>
                        {['Student', 'Date & Time', 'Status', 'Method', 'Location', 'Actions'].map((header) => (
                          <th
                            key={header}
                            className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/30 dark:divide-gray-700/30 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
                      {attendance.map((record, index) => (
                        <tr 
                          key={record._id} 
                          className="group/row transition-all duration-300 hover:bg-white/50 dark:hover:bg-gray-700/50 transform hover:scale-[1.02] hover:shadow-lg"
                          style={{
                            animationDelay: `${index * 50}ms`,
                            animationFillMode: 'both'
                          }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300">
                                {record.studentName}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                                {record.studentId}
                              </div>
                              {record.student?.department && (
                                <div className="text-xs text-gray-500 dark:text-gray-500 transition-colors duration-300">
                                  {record.student.department}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors duration-300">
                                {new Date(record.date).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                                {record.time}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-sm border transition-all duration-300 transform hover:scale-105 ${getStatusColor(record.status)}`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900 dark:text-gray-100 transition-colors duration-300">
                              <span className="mr-2 transition-transform duration-300 group-hover/row:scale-110">
                                {getMethodIcon(record.method)}
                              </span>
                              {record.method}
                              {record.confidence && (
                                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                                  ({record.confidence}%)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                            {record.location}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => deleteAttendance(record._id)}
                              className="group/delete inline-flex items-center p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 bg-red-50/50 dark:bg-red-900/20 rounded-lg backdrop-blur-sm transition-all duration-300 transform hover:scale-110 hover:bg-red-100 dark:hover:bg-red-900/40 hover:shadow-lg"
                              title="Delete record"
                            >
                              <Trash2 className="h-4 w-4 transition-transform duration-300 group-hover/delete:scale-110" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-white/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">
                      Page <span className="font-semibold">{currentPage}</span> of{' '}
                      <span className="font-semibold">{totalPages}</span>
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="group relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-white dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1 transition-transform duration-300 group-hover:-translate-x-1" />
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="group relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-white dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Add CSS for animations */}
    <style jsx>{`
      @keyframes float {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(180deg); }
      }
      .animate-float {
        animation: float linear infinite;
      }
    `}</style>
  </div>
);
};

export default AdminAttendance;