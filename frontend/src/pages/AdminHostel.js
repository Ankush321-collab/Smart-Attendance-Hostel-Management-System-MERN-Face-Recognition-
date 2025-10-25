import React, { useState, useEffect } from 'react';
import { hostelAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { 
  Building, 
  Users, 
  Bed, 
  Plus, 
  Search, 
  Filter, 
  UserPlus, 
  UserMinus,
  Edit,
  Home,
  MapPin
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

  useEffect(() => {
    fetchHostelData();
  }, [filters]);

  const fetchHostelData = async () => {
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
      setError('Error fetching hostel data');
      console.error('Hostel data error:', error);
    } finally {
      setLoading(false);
    }
  };

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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-bold mb-4">Create New Room</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Room Number</label>
              <input
                type="text"
                required
                value={formData.roomNumber}
                onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="101, 102, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Floor</label>
              <input
                type="number"
                required
                value={formData.floor}
                onChange={(e) => setFormData({...formData, floor: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Capacity</label>
              <input
                type="number"
                required
                value={formData.capacity}
                onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                max="4"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Room Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="triple">Triple</option>
                <option value="quad">Quad</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCreateRoom(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Room
              </button>
            </div>
          </form>
        </div>
      </div>
    );
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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hostel Management</h1>
            <p className="mt-2 text-gray-600">Manage rooms, assignments, and occupancy</p>
          </div>
          <button
            onClick={() => setShowCreateRoom(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Room
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Overview Statistics */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Rooms</p>
                  <p className="text-3xl font-bold text-gray-900">{overview.overview.totalRooms}</p>
                </div>
                <Building className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Occupied Beds</p>
                  <p className="text-3xl font-bold text-green-600">{overview.overview.occupiedBeds}</p>
                </div>
                <Bed className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Available Beds</p>
                  <p className="text-3xl font-bold text-orange-600">{overview.overview.availableBeds}</p>
                </div>
                <Bed className="h-8 w-8 text-orange-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Occupancy Rate</p>
                  <p className="text-3xl font-bold text-purple-600">{overview.overview.occupancyRate}%</p>
                </div>
                <Home className="h-8 w-8 text-purple-600" />
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