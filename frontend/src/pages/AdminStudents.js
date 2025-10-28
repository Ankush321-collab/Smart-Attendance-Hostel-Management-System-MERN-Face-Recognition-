import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import Navbar from '../components/Navbar';
import { Users, Search, Edit, Trash2, Eye, UserCheck, UserX, AlertCircle } from 'lucide-react';

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    semester: '',
    enrolled: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 0,
    total: 0
  });

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };

      const response = await adminAPI.getAllStudents(params);
      setStudents(response.data.data);
      setPagination(prev => ({
        ...prev,
        totalPages: response.data.totalPages,
        total: response.data.total
      }));
    } catch (error) {
      setError('Failed to fetch students');
      console.error('Fetch students error:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm('Are you sure you want to deactivate this student?')) {
      try {
        await adminAPI.deleteStudent(studentId);
        fetchStudents();
      } catch (error) {
        setError('Error deactivating student');
      }
    }
  };

  const renderStudentCard = (student, index) => (
  <div 
    key={student._id} 
    className="group relative transform-gpu transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2 motion-reduce:transform-none"
    style={{ animationDelay: `${index * 100}ms` }}
  >
    {/* Floating particles */}
    <div className="absolute -inset-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-primary/30 rounded-full animate-float"
          style={{
            left: `${20 + i * 30}%`,
            animationDelay: `${i * 0.3}s`,
            animationDuration: `${2 + i * 0.5}s`
          }}
        />
      ))}
    </div>

    {/* Gradient border */}
    <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/30 via-secondary/30 to-accent/30 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105" />
    
    {/* Glass morphism card */}
    <div className="relative bg-base-100/70 dark:bg-base-200/50 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 shadow-xl hover:shadow-2xl transition-all duration-500 p-6 overflow-hidden">
      
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* Animated avatar */}
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center transform-gpu transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 motion-reduce:transform-none shadow-lg">
                <Users className="w-7 h-7 text-white transform transition-transform duration-300 group-hover:scale-110" />
              </div>
              {/* Status indicator */}
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-base-100 transition-colors duration-300 ${
                student.isActive ? 'bg-success' : 'bg-error'
              }`} />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-xl font-bold bg-gradient-to-r from-base-content to-base-content/80 bg-clip-text text-transparent transition-all duration-300 group-hover:from-primary group-hover:to-secondary">
                {student.name}
              </h3>
              <p className="text-sm text-base-content/60 font-medium">{student.studentId}</p>
            </div>
          </div>

          {/* Action buttons with micro-interactions */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
            {[
              { icon: Eye, color: 'info', label: 'View' },
              { icon: Edit, color: 'warning', label: 'Edit' },
              { icon: Trash2, color: 'error', label: 'Delete', onClick: () => handleDeleteStudent(student._id) }
            ].map(({ icon: Icon, color, label, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className={`p-2 rounded-xl bg-base-200/50 backdrop-blur-sm border border-base-300 transition-all duration-300 hover:scale-110 hover:bg-${color}/20 hover:border-${color}/30 hover:shadow-lg active:scale-95 motion-reduce:transform-none tooltip`}
                data-tip={label}
              >
                <Icon className={`w-4 h-4 text-${color}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Student info grid */}
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          {[
            { label: 'Email', value: student.email },
            { label: 'Department', value: student.department || 'N/A' },
            { label: 'Semester', value: student.semester || 'N/A' },
            { label: 'Room', value: student.roomNumber || 'Not assigned' }
          ].map((item, i) => (
            <div 
              key={item.label}
              className="transform transition-all duration-300 delay-100 group-hover:translate-x-1"
            >
              <span className="text-base-content/60 font-medium">{item.label}</span>
              <p className="text-base-content font-semibold truncate">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 hover:scale-105 motion-reduce:transform-none ${
            student.isFaceEnrolled 
              ? 'bg-success/20 text-success border border-success/30' 
              : 'bg-warning/20 text-warning border border-warning/30'
          }`}>
            {student.isFaceEnrolled ? (
              <>
                <UserCheck className="w-3 h-3 mr-1.5 transform transition-transform duration-300 group-hover:scale-125" />
                Face Enrolled
              </>
            ) : (
              <>
                <UserX className="w-3 h-3 mr-1.5 transform transition-transform duration-300 group-hover:scale-125" />
                Pending Enrollment
              </>
            )}
          </span>
          
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 hover:scale-105 ${
            student.isActive 
              ? 'bg-success/20 text-success border border-success/30' 
              : 'bg-error/20 text-error border border-error/30'
          }`}>
            {student.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
    </div>
  </div>
);

return (
  <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-100 to-base-300 dark:from-base-300 dark:via-base-200 dark:to-base-400 transition-all duration-500">
    <Navbar />
    
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Enhanced Header */}
      <div className="mb-8 text-center lg:text-left">
        <div className="relative inline-block">
          <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent transition-all duration-500 hover:scale-105 transform-gpu">
            Student Management
          </h1>
          <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        </div>
        <p className="mt-4 text-lg text-base-content/70 max-w-2xl mx-auto lg:mx-0">
          Manage student accounts with advanced facial recognition enrollment
        </p>
      </div>

      {/* Glass morphism search and filters */}
      <div className="bg-base-100/50 dark:bg-base-200/30 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 lg:p-8 mb-8 transform-gpu transition-all duration-500 hover:shadow-3xl">
        <div className="flex flex-col lg:flex-row gap-6 items-end lg:items-center">
          {/* Enhanced Search */}
          <div className="flex-1 w-full">
            <label className="block text-sm font-bold text-base-content/80 mb-2">
              Search Students
            </label>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/60 transition-colors duration-300 group-focus-within:text-primary" />
                <input
                  type="text"
                  placeholder="Search by name, email, or student ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-base-200/50 backdrop-blur-sm border border-base-300 rounded-2xl text-base-content placeholder-base-content/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300"
                />
              </div>
            </div>
          </div>

          {/* Enhanced Filters */}
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            {[
              {
                value: filters.department,
                onChange: (e) => handleFilterChange('department', e.target.value),
                options: ['All Departments', 'Computer Science', 'Information Technology', 'Electronics', 'Mechanical'],
                label: 'Department'
              },
              {
                value: filters.semester,
                onChange: (e) => handleFilterChange('semester', e.target.value),
                options: ['All Semesters', ...Array.from({length: 8}, (_, i) => `Semester ${i + 1}`)],
                label: 'Semester'
              },
              {
                value: filters.enrolled,
                onChange: (e) => handleFilterChange('enrolled', e.target.value),
                options: ['All Students', 'Face Enrolled', 'Not Enrolled'],
                label: 'Enrollment'
              }
            ].map((filter, index) => (
              <div key={filter.label} className="flex-1 lg:flex-none">
                <label className="block text-sm font-bold text-base-content/80 mb-2">
                  {filter.label}
                </label>
                <select
                  value={filter.value}
                  onChange={filter.onChange}
                  className="w-full lg:w-48 px-4 py-3 bg-base-200/50 backdrop-blur-sm border border-base-300 rounded-2xl text-base-content focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 appearance-none"
                >
                  {filter.options.map(option => (
                    <option key={option} value={option === 'All Departments' || option === 'All Semesters' || option === 'All Students' ? '' : option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Error Message */}
      {error && (
        <div className="bg-error/20 border border-error/30 text-error-content px-6 py-4 rounded-2xl mb-6 backdrop-blur-sm transform-gpu transition-all duration-500 hover:scale-[1.02]">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-semibold">{error}</p>
          </div>
        </div>
      )}

      {/* Students Grid */}
      {loading ? (
        <div className="text-center py-16 space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-base-content/70 font-semibold">Loading students...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-16 bg-base-100/50 backdrop-blur-sm rounded-3xl border border-white/20 transform-gpu transition-all duration-500 hover:scale-[1.01]">
          <Users className="mx-auto h-16 w-16 text-base-content/40 mb-4" />
          <h3 className="text-xl font-bold text-base-content/80 mb-2">No students found</h3>
          <p className="text-base-content/60">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {students.map((student, index) => renderStudentCard(student, index))}
          </div>

          {/* Enhanced Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-12">
              <div className="flex gap-3 items-center bg-base-100/50 backdrop-blur-sm rounded-2xl border border-white/20 p-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-6 py-3 rounded-xl bg-base-200 border border-base-300 disabled:opacity-30 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-105 hover:bg-base-300 active:scale-95 motion-reduce:transform-none font-semibold"
                >
                  Previous
                </button>
                
                <span className="px-6 py-3 text-base-content font-bold min-w-[120px] text-center">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-6 py-3 rounded-xl bg-base-200 border border-base-300 disabled:opacity-30 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-105 hover:bg-base-300 active:scale-95 motion-reduce:transform-none font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>

    <style jsx>{`
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        33% { transform: translateY(-10px) rotate(120deg); }
        66% { transform: translateY(5px) rotate(240deg); }
      }
      .animate-float {
        animation: float ease-in-out infinite;
      }
      
      @media (prefers-reduced-motion: reduce) {
        .animate-float {
          animation: none;
        }
      }
      
      .hover\\:shadow-3xl:hover {
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 25px -5px rgba(59, 130, 246, 0.1);
      }
    `}</style>
  </div>
);
};

export default AdminStudents;