import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { hostelAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { 
  Home, 
  Users, 
  MapPin, 
  Phone,
  Mail,
  Building,
  Bed,
  AlertCircle
} from 'lucide-react';

const StudentHostel = () => {
  const { user } = useAuth();
  const [roomInfo, setRoomInfo] = useState(null);
  const [roommates, setRoommates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHostelInfo = useCallback(async () => {
    try {
      setLoading(true);
      // Get the student's room information
      const response = await hostelAPI.getMyRoom();
      const roomData = response.data.data;

      if (roomData && roomData.room) {
        // Set room info using the structured response
        setRoomInfo({
          ...roomData.room,
          occupants: roomData.occupants || []
        });
        
        // Get roommates (exclude current user)
        const roommates = (roomData.occupants || []).filter(occupant => occupant._id !== user.id);
        setRoommates(roommates);
      } else {
        setError('You are not assigned to any room yet. Please contact the administration.');
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setError('You are not assigned to any room yet. Please contact the hostel administration.');
      } else {
        setError('Failed to fetch hostel information');
      }
      console.error('Fetch hostel info error:', error);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchHostelInfo();
  }, [fetchHostelInfo]);

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
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-100/20 dark:from-gray-900 dark:via-blue-950/20 dark:to-emerald-900/10 transition-all duration-500">
    {/* Floating Particles Background */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-gradient-to-r from-blue-400/10 to-emerald-500/10 dark:from-blue-500/5 dark:to-emerald-600/5 animate-float"
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
    
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
      {/* Header with Glass Morphism */}
      <div className="relative group mb-12">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-emerald-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500 animate-tilt"></div>
        <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-8 border border-white/20 dark:border-gray-700/30 shadow-2xl">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-800 via-emerald-600 to-blue-600 dark:from-gray-100 dark:via-emerald-400 dark:to-blue-400 bg-clip-text text-transparent animate-gradient-x mb-3">
              Hostel Information
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 font-medium">
              Your room details and hostel information
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="relative group mb-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-pink-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
          <div className="relative bg-red-50/80 dark:bg-red-900/30 backdrop-blur-xl rounded-xl p-4 border border-red-200/50 dark:border-red-700/50 text-red-800 dark:text-red-300 transition-all duration-300">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
              {error}
            </div>
          </div>
        </div>
      )}

      {!roomInfo ? (
        /* Not Assigned to Room - Enhanced */
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-8 border border-white/20 dark:border-gray-700/30 shadow-2xl text-center transform transition-all duration-500 group-hover:scale-105">
            <div className="bg-gradient-to-br from-blue-100 to-emerald-100 dark:from-blue-900/20 dark:to-emerald-900/20 p-4 rounded-2xl inline-flex mb-6 transform group-hover:scale-110 transition-transform duration-300">
              <Home className="h-16 w-16 bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent" />
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-blue-600 dark:from-gray-100 dark:to-blue-400 bg-clip-text text-transparent mb-3">
              No Room Assigned
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
              You haven't been assigned to a hostel room yet. Please contact the hostel administration for room allocation.
            </p>
            
            <div className="relative group/contact">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl blur opacity-0 group-hover/contact:opacity-100 transition duration-300"></div>
              <div className="relative bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-sm rounded-xl p-6 border border-blue-200/50 dark:border-blue-700/30 transform transition-all duration-300 group-hover/contact:scale-105">
                <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-3 text-lg">Contact Hostel Office</h4>
                <div className="grid gap-2 text-sm text-blue-800 dark:text-blue-400">
                  <div className="flex items-center justify-center gap-2 group/item hover:text-blue-900 dark:hover:text-blue-300 transition-colors duration-200">
                    <Phone className="h-4 w-4 transform group-hover/item:scale-110 transition-transform duration-300" />
                    <span>+91 9876543210</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 group/item hover:text-blue-900 dark:hover:text-blue-300 transition-colors duration-200">
                    <Mail className="h-4 w-4 transform group-hover/item:scale-110 transition-transform duration-300" />
                    <span>hostel@college.edu</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 group/item hover:text-blue-900 dark:hover:text-blue-300 transition-colors duration-200">
                    <MapPin className="h-4 w-4 transform group-hover/item:scale-110 transition-transform duration-300" />
                    <span>Ground Floor, Admin Block</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Room Information - Enhanced */
        <div className="space-y-8">
          {/* Room Details Card */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-8 border border-white/20 dark:border-gray-700/30 shadow-2xl transform transition-all duration-500 group-hover:scale-105">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-100 to-emerald-100 dark:from-blue-900/20 dark:to-emerald-900/20 p-4 rounded-2xl transform group-hover:scale-110 transition-transform duration-300">
                  <Building className="h-8 w-8 bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-emerald-600 dark:from-gray-100 dark:to-emerald-400 bg-clip-text text-transparent">
                    Room {roomInfo.roomNumber}
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-300">
                    Floor {roomInfo.floor} • {roomInfo.type.charAt(0).toUpperCase() + roomInfo.type.slice(1)} Room
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                  {
                    icon: Bed,
                    label: "Capacity",
                    value: roomInfo.capacity,
                    sublabel: "Total beds",
                    color: "from-blue-500 to-cyan-500",
                    delay: 0
                  },
                  {
                    icon: Users,
                    label: "Occupied",
                    value: roomInfo.occupants.length,
                    sublabel: "Current occupants",
                    color: "from-emerald-500 to-green-500",
                    delay: 100
                  },
                  {
                    icon: MapPin,
                    label: "Location",
                    value: `Floor ${roomInfo.floor}`,
                    sublabel: "Room location",
                    color: "from-purple-500 to-pink-500",
                    delay: 200
                  }
                ].map((stat, index) => (
                  <div
                    key={index}
                    className="group/stat relative"
                    style={{ animationDelay: `${stat.delay}ms` }}
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300 blur rounded-xl"></div>
                    <div className="relative bg-white dark:bg-gray-700/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-600/50 transform transition-all duration-300 group-hover/stat:scale-105 group-hover/stat:-translate-y-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.color} bg-opacity-10 transform group-hover/stat:scale-110 transition-transform duration-300`}>
                          <stat.icon className={`h-6 w-6 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
                        </div>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{stat.label}</span>
                      </div>
                      <p className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                        {stat.value}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.sublabel}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Facilities */}
              {roomInfo.facilities && roomInfo.facilities.length > 0 && (
                <div className="relative group/facilities">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Room Facilities</h3>
                  <div className="flex flex-wrap gap-3">
                    {roomInfo.facilities.map((facility, index) => (
                      <span 
                        key={index}
                        className="group/tag relative"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full blur opacity-0 group-hover/tag:opacity-100 transition duration-300"></div>
                        <span className="relative px-4 py-2 bg-blue-100/80 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium backdrop-blur-sm border border-blue-200/50 dark:border-blue-700/30 transform transition-all duration-300 group-hover/tag:scale-110 group-hover/tag:-translate-y-0.5">
                          {facility}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Roommates - Enhanced */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-8 border border-white/20 dark:border-gray-700/30 shadow-2xl">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-purple-600 dark:from-gray-100 dark:to-purple-400 bg-clip-text text-transparent mb-6">
                {roommates.length > 0 ? 'Your Roommates' : 'No Roommates Yet'}
              </h2>
              
              {roommates.length === 0 ? (
                <div className="text-center py-8 group/empty">
                  <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-2xl inline-flex mb-4 transform group-hover/empty:scale-110 transition-transform duration-300">
                    <Users className="h-12 w-12 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" />
                  </div>
                  <p className="text-lg text-gray-600 dark:text-gray-300">You don't have any roommates assigned yet.</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {roommates.map((roommate, index) => (
                    <div
                      key={roommate._id}
                      className="group/card relative"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl blur opacity-0 group-hover/card:opacity-100 transition duration-300"></div>
                      <div className="relative bg-white dark:bg-gray-700/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-600/50 transform transition-all duration-500 group-hover/card:scale-105 group-hover/card:-translate-y-2">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 p-3 rounded-2xl transform group-hover/card:scale-110 group-hover/card:rotate-3 transition-transform duration-300">
                            <Users className="h-6 w-6 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">{roommate.name}</h3>
                            <p className="text-gray-600 dark:text-gray-400">{roommate.studentId}</p>
                            {roommate.department && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">{roommate.department}</p>
                            )}
                          </div>
                        </div>
                        
                        {(roommate.email || roommate.phoneNumber) && (
                          <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-600/50 space-y-2">
                            {roommate.email && (
                              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 group/item hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200">
                                <Mail className="h-4 w-4 transform group-hover/item:scale-110 transition-transform duration-300" />
                                <span>{roommate.email}</span>
                              </div>
                            )}
                            {roommate.phoneNumber && (
                              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 group/item hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200">
                                <Phone className="h-4 w-4 transform group-hover/item:scale-110 transition-transform duration-300" />
                                <span>{roommate.phoneNumber}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Hostel Guidelines - Enhanced */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-8 border border-white/20 dark:border-gray-700/30 shadow-2xl">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-amber-600 dark:from-gray-100 dark:to-amber-400 bg-clip-text text-transparent mb-6">
                Hostel Guidelines
              </h2>
              <div className="grid gap-8 md:grid-cols-2">
                <div className="group/section">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <span className="bg-gradient-to-r from-amber-500 to-orange-500 p-2 rounded-lg transform group-hover/section:scale-110 transition-transform duration-300">
                      📋
                    </span>
                    General Rules
                  </h3>
                  <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                    {[
                      "Maintain cleanliness in your room and common areas",
                      "No loud music or noise after 10 PM",
                      "Visitors must register at the reception",
                      "No smoking or alcohol on premises"
                    ].map((rule, index) => (
                      <li key={index} className="flex items-start gap-3 group/item hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200">
                        <span className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mt-2 transform group-hover/item:scale-150 transition-transform duration-300"></span>
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="group/section">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <span className="bg-gradient-to-r from-amber-500 to-orange-500 p-2 rounded-lg transform group-hover/section:scale-110 transition-transform duration-300">
                      ⏰
                    </span>
                    Timings
                  </h3>
                  <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                    {[
                      "Gate closing time: 11 PM",
                      "Breakfast: 7 AM - 9 AM",
                      "Lunch: 12 PM - 2 PM",
                      "Dinner: 7 PM - 9 PM"
                    ].map((timing, index) => (
                      <li key={index} className="flex items-start gap-3 group/item hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200">
                        <span className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mt-2 transform group-hover/item:scale-150 transition-transform duration-300"></span>
                        {timing}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contacts - Enhanced */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
            <div className="relative bg-red-50/80 dark:bg-red-900/30 backdrop-blur-xl rounded-2xl p-8 border border-red-200/50 dark:border-red-700/30 shadow-2xl">
              <h2 className="text-2xl font-bold text-red-900 dark:text-red-300 mb-6 flex items-center gap-3">
                <span className="bg-gradient-to-r from-red-500 to-pink-500 p-2 rounded-lg animate-pulse">🚨</span>
                Emergency Contacts
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                {[
                  { title: "Hostel Warden", phone: "+91 9876543210" },
                  { title: "Security", phone: "+91 9876543211" },
                  { title: "Medical Emergency", phone: "+91 9876543212" },
                  { title: "Maintenance", phone: "+91 9876543213" }
                ].map((contact, index) => (
                  <div
                    key={index}
                    className="group/contact relative"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl blur opacity-0 group-hover/contact:opacity-100 transition duration-300"></div>
                    <div className="relative bg-white/50 dark:bg-red-800/20 backdrop-blur-sm rounded-xl p-4 border border-red-200/50 dark:border-red-600/30 transform transition-all duration-300 group-hover/contact:scale-105">
                      <h3 className="font-bold text-red-900 dark:text-red-300 mb-2">{contact.title}</h3>
                      <div className="flex items-center gap-2 text-red-800 dark:text-red-400 group/item hover:text-red-900 dark:hover:text-red-300 transition-colors duration-200">
                        <Phone className="h-4 w-4 transform group-hover/item:scale-110 transition-transform duration-300" />
                        <span className="font-medium">{contact.phone}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Custom Animations */}
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

export default StudentHostel;