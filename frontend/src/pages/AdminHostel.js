import React, { useState, useEffect, useCallback } from 'react';
import { hostelAPI } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import Navbar from '../components/Navbar';
import { 
  Building, 
  Bed, 
  Plus, 
  UserPlus, 
  UserMinus,
  Edit,
  Home
} from 'lucide-react';

const AdminHostel = () => {
  const [rooms, setRooms] = useState([]);
  const [overview, setOverview] = useState(null);
  const [unassignedStudents, setUnassignedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showAssignStudent, setShowAssignStudent] = useState(null);
  const [filters, setFilters] = useState({
    floor: '',
    type: '',
    availability: ''
  });

  const fetchHostelData = useCallback(async () => {
    try {
      setLoading(true);
      const [roomsRes, overviewRes, studentsRes] = await Promise.all([
        hostelAPI.getRooms(filters),
        hostelAPI.getOverview(),
        hostelAPI.getUnassignedStudents()
      ]);

      setRooms(roomsRes.data.data);
      setOverview(overviewRes.data.data);
      setUnassignedStudents(studentsRes.data.data);
    } catch (error) {
      setError('Failed to fetch hostel data');
      console.error('Fetch hostel data error:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchHostelData();
  }, [fetchHostelData]);

  const handleAssignStudent = async (roomId, studentId) => {
    try {
      await hostelAPI.assignStudent(roomId, studentId);
      setShowAssignStudent(null);
      fetchHostelData();
    } catch (error) {
      setError('Error assigning student to room');
    }
  };

  const handleRemoveStudent = async (roomId, studentId) => {
    if (window.confirm('Are you sure you want to remove this student from the room?')) {
      try {
        await hostelAPI.removeStudent(roomId, studentId);
        fetchHostelData();
      } catch (error) {
        setError('Error removing student from room');
      }
    }
  };

  const CreateRoomModal = () => {
    const [formData, setFormData] = useState({
      roomNumber: '',
      floor: '',
      capacity: '',
      type: 'double',
      facilities: []
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await hostelAPI.createRoom({
          ...formData,
          floor: parseInt(formData.floor),
          capacity: parseInt(formData.capacity)
        });
        setShowCreateRoom(false);
        fetchHostelData();
      } catch (error) {
        setError('Error creating room');
      }
    };

    return (
  <div className="fixed inset-0 bg-base-300/80 backdrop-blur-xl flex items-center justify-center z-50 p-4 transition-all duration-300">
    {/* Floating particles background */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-primary/20 rounded-full animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${3 + Math.random() * 4}s`
          }}
        />
      ))}
    </div>

    <div className="relative w-full max-w-md">
      {/* Glass morphism card with 3D transform */}
      <div className="bg-base-100/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl transform-gpu transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2 motion-reduce:transform-none">
        
        {/* Gradient border animation */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500 -z-10" />
        
        <div className="p-8 space-y-6">
          {/* Header with icon */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto transform-gpu transition-transform duration-300 hover:scale-110 hover:rotate-3">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Create New Room
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form fields with enhanced styling */}
            <div className="space-y-4">
              {[
                {
                  label: "Room Number",
                  type: "text",
                  value: formData.roomNumber,
                  onChange: (e) => setFormData({...formData, roomNumber: e.target.value}),
                  placeholder: "101, 102, etc."
                },
                {
                  label: "Floor",
                  type: "number",
                  value: formData.floor,
                  onChange: (e) => setFormData({...formData, floor: e.target.value}),
                  min: "1"
                },
                {
                  label: "Capacity",
                  type: "number",
                  value: formData.capacity,
                  onChange: (e) => setFormData({...formData, capacity: e.target.value}),
                  min: "1",
                  max: "4"
                }
              ].map((field, index) => (
                <div 
                  key={field.label}
                  className="transform-gpu transition-all duration-300 hover:scale-[1.02] motion-reduce:transform-none"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <label className="block text-sm font-semibold mb-2 text-base-content/80">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    required
                    value={field.value}
                    onChange={field.onChange}
                    min={field.min}
                    max={field.max}
                    className="w-full px-4 py-3 bg-base-200/50 border border-base-300 rounded-2xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 backdrop-blur-sm placeholder-base-content/40"
                    placeholder={field.placeholder}
                  />
                </div>
              ))}

              {/* Room Type Select */}
              <div className="transform-gpu transition-all duration-300 hover:scale-[1.02] motion-reduce:transform-none">
                <label className="block text-sm font-semibold mb-2 text-base-content/80">
                  Room Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-4 py-3 bg-base-200/50 border border-base-300 rounded-2xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 backdrop-blur-sm appearance-none"
                >
                  <option value="single">Single Room</option>
                  <option value="double">Double Room</option>
                  <option value="triple">Triple Room</option>
                  <option value="quad">Quad Room</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4">
                  <svg className="h-4 w-4 text-base-content/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateRoom(false)}
                className="flex-1 px-6 py-3 bg-base-200/50 text-base-content rounded-2xl border border-base-300 transform-gpu transition-all duration-300 hover:scale-105 hover:bg-base-300/50 active:scale-95 motion-reduce:transform-none font-semibold backdrop-blur-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-primary-content rounded-2xl transform-gpu transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 motion-reduce:transform-none font-semibold relative overflow-hidden group"
              >
                <span className="relative z-10">Create Room</span>
                <div className="absolute inset-0 bg-gradient-to-r from-secondary to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <style jsx>{`
      @keyframes float {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(180deg); }
      }
      .animate-float {
        animation: float linear infinite;
      }
      
      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .animate-float {
          animation: none;
        }
      }
    `}</style>
  </div>
);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-200">Hostel Management</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400 transition-colors duration-200">Manage rooms, assignments, and occupancy</p>
          </div>
          <button
            onClick={() => setShowCreateRoom(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            Add Room
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg mb-6 transition-colors duration-200">
            {error}
          </div>
        )}

        {/* Overview Statistics */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium transition-colors duration-200">Total Rooms</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-200">{overview.overview.totalRooms}</p>
                </div>
                <Building className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium transition-colors duration-200">Occupied Beds</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 transition-colors duration-200">{overview.overview.occupiedBeds}</p>
                </div>
                <Bed className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium transition-colors duration-200">Available Beds</p>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 transition-colors duration-200">{overview.overview.availableBeds}</p>
                </div>
                <Bed className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium transition-colors duration-200">Occupancy Rate</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 transition-colors duration-200">{overview.overview.occupancyRate}%</p>
                </div>
                <Home className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <select
              value={filters.floor}
              onChange={(e) => setFilters({...filters, floor: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Floors</option>
              {[1,2,3,4,5].map(floor => (
                <option key={floor} value={floor}>Floor {floor}</option>
              ))}
            </select>

            <select
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="triple">Triple</option>
              <option value="quad">Quad</option>
            </select>

            <select
              value={filters.availability}
              onChange={(e) => setFilters({...filters, availability: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Rooms</option>
              <option value="available">Available</option>
              <option value="occupied">Fully Occupied</option>
            </select>
          </div>
        </div>

        {/* Rooms Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <div key={room._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Room {room.roomNumber}</h3>
                  <p className="text-sm text-gray-600">Floor {room.floor} • {room.type.charAt(0).toUpperCase() + room.type.slice(1)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  room.isAvailable 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {room.isAvailable ? 'Available' : 'Full'}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Occupancy</span>
                  <span className="font-medium">{room.occupants.length}/{room.capacity}</span>
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(room.occupants.length / room.capacity) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Occupants */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Occupants</h4>
                {room.occupants.length === 0 ? (
                  <p className="text-sm text-gray-500">No students assigned</p>
                ) : (
                  <div className="space-y-1">
                    {room.occupants.map((student) => (
                      <div key={student._id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{student.name}</p>
                          <p className="text-xs text-gray-600">{student.studentId}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveStudent(room._id, student._id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {room.isAvailable && (
                  <button
                    onClick={() => setShowAssignStudent(room._id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    Assign Student
                  </button>
                )}
                <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Assign Student Modal */}
        {showAssignStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-96 overflow-y-auto">
              <h3 className="text-lg font-bold mb-4">Assign Student to Room</h3>
              {unassignedStudents.length === 0 ? (
                <p className="text-gray-600">No unassigned students available</p>
              ) : (
                <div className="space-y-3">
                  {unassignedStudents.map((student) => (
                    <div key={student._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-gray-600">{student.studentId} • {student.department}</p>
                      </div>
                      <button
                        onClick={() => handleAssignStudent(showAssignStudent, student._id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Assign
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowAssignStudent(null)}
                className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && <CreateRoomModal />}
    </div>
  );
};

export default AdminHostel;