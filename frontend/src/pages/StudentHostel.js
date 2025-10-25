import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { hostelAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { 
  Home, 
  Users, 
  MapPin, 
  Calendar,
  Phone,
  Mail,
  Building,
  Bed
} from 'lucide-react';

const StudentHostel = () => {
  const { user } = useAuth();
  const [roomInfo, setRoomInfo] = useState(null);
  const [roommates, setRoommates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHostelInfo();
  }, []);

  const fetchHostelInfo = async () => {
    try {
      setLoading(true);
      // Get all rooms to find the student's room
      const response = await hostelAPI.getRooms();
      const rooms = response.data.data;
      
      // Find the room where current user is assigned
      const myRoom = rooms.find(room => 
        room.occupants.some(occupant => occupant._id === user._id)
      );

      if (myRoom) {
        setRoomInfo(myRoom);
        setRoommates(myRoom.occupants.filter(occupant => occupant._id !== user._id));
      }
    } catch (error) {
      setError('Error fetching hostel information');
      console.error('Hostel info error:', error);
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
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Hostel Information</h1>
          <p className="mt-2 text-gray-600">Your room details and hostel information</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!roomInfo ? (
          /* Not Assigned to Room */
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <Home className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Room Assigned</h3>
            <p className="text-gray-600 mb-4">
              You haven't been assigned to a hostel room yet. Please contact the hostel administration for room allocation.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Contact Hostel Office</h4>
              <p className="text-sm text-blue-800">
                📞 Phone: +91 9876543210<br />
                📧 Email: hostel@college.edu<br />
                📍 Office: Ground Floor, Admin Block
              </p>
            </div>
          </div>
        ) : (
          /* Room Information */
          <div className="space-y-6">
            {/* Room Details Card */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Room {roomInfo.roomNumber}</h2>
                  <p className="text-gray-600">Floor {roomInfo.floor} • {roomInfo.type.charAt(0).toUpperCase() + roomInfo.type.slice(1)} Room</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Bed className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Capacity</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{roomInfo.capacity}</p>
                  <p className="text-sm text-gray-600">Total beds</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Occupied</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{roomInfo.occupants.length}</p>
                  <p className="text-sm text-gray-600">Current occupants</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Location</span>
                  </div>
                  <p className="text-lg font-bold text-purple-600">Floor {roomInfo.floor}</p>
                  <p className="text-sm text-gray-600">Room location</p>
                </div>
              </div>

              {/* Facilities */}
              {roomInfo.facilities && roomInfo.facilities.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Room Facilities</h3>
                  <div className="flex flex-wrap gap-2">
                    {roomInfo.facilities.map((facility, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Roommates */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {roommates.length > 0 ? 'Your Roommates' : 'No Roommates Yet'}
              </h2>
              
              {roommates.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-600">You don't have any roommates assigned yet.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {roommates.map((roommate) => (
                    <div key={roommate._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-full">
                          <Users className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{roommate.name}</h3>
                          <p className="text-sm text-gray-600">{roommate.studentId}</p>
                          {roommate.department && (
                            <p className="text-sm text-gray-600">{roommate.department}</p>
                          )}
                        </div>
                      </div>
                      
                      {roommate.email && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-4 w-4" />
                            <span>{roommate.email}</span>
                          </div>
                          {roommate.phoneNumber && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <Phone className="h-4 w-4" />
                              <span>{roommate.phoneNumber}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hostel Guidelines */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Hostel Guidelines</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">📋 General Rules</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Maintain cleanliness in your room and common areas</li>
                    <li>• No loud music or noise after 10 PM</li>
                    <li>• Visitors must register at the reception</li>
                    <li>• No smoking or alcohol on premises</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">⏰ Timings</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Gate closing time: 11 PM</li>
                    <li>• Breakfast: 7 AM - 9 AM</li>
                    <li>• Lunch: 12 PM - 2 PM</li>
                    <li>• Dinner: 7 PM - 9 PM</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-red-900 mb-4">🚨 Emergency Contacts</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-medium text-red-900 mb-2">Hostel Warden</h3>
                  <p className="text-sm text-red-800">📞 +91 9876543210</p>
                </div>
                <div>
                  <h3 className="font-medium text-red-900 mb-2">Security</h3>
                  <p className="text-sm text-red-800">📞 +91 9876543211</p>
                </div>
                <div>
                  <h3 className="font-medium text-red-900 mb-2">Medical Emergency</h3>
                  <p className="text-sm text-red-800">📞 +91 9876543212</p>
                </div>
                <div>
                  <h3 className="font-medium text-red-900 mb-2">Maintenance</h3>
                  <p className="text-sm text-red-800">📞 +91 9876543213</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentHostel;