import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Plus, Eye, Edit, Trash2, Clock, User, Phone, Mail, Calendar } from 'lucide-react';

const AdminVisitors = () => {
  // State management
  const [visitors, setVisitors] = useState([]);
  const [stats, setStats] = useState({
    todayVisitors: 0,
    activeVisitors: 0,
    weeklyVisitors: 0,
    avgDuration: 0
  });
  const [filters, setFilters] = useState({
    status: 'all',
    purpose: 'all',
    date: '',
    search: ''
  });
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  
  const [checkInForm, setCheckInForm] = useState({
    name: '',
    phone: '',
    email: '',
    purpose: 'Meeting',
    studentToVisit: '',
    roomNumber: '',
    idProof: 'Aadhar Card',
    idNumber: '',
    address: '',
    remarks: '',
    visitDuration: ''
  });

  // Motion detection
  useEffect(() => {
    setMounted(true);
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    
    const handleMotionChange = (e) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleMotionChange);
    
    return () => mediaQuery.removeEventListener('change', handleMotionChange);
  }, []);

  // Mock data for development
  useEffect(() => {
    const mockVisitors = [
      {
        _id: 1,
        name: 'John Doe',
        phone: '+1234567890',
        email: 'john@example.com',
        purpose: 'Meeting',
        checkInTime: '2024-01-15T09:00:00Z',
        checkOutTime: '2024-01-15T11:30:00Z',
        isActive: false,
        roomNumber: '101',
        actualDuration: 150
      },
      {
        _id: 2,
        name: 'Jane Wilson',
        phone: '+0987654321',
        email: 'jane@example.com',
        purpose: 'Delivery',
        checkInTime: '2024-01-15T14:00:00Z',
        checkOutTime: null,
        isActive: true,
        roomNumber: '205',
        actualDuration: null
      },
      {
        _id: 3,
        name: 'Mike Johnson',
        phone: '+1122334455',
        email: 'mike@example.com',
        purpose: 'Family Visit',
        checkInTime: '2024-01-15T10:00:00Z',
        checkOutTime: null,
        isActive: true,
        roomNumber: '156',
        actualDuration: null
      }
    ];

    const mockStats = {
      todayVisitors: 12,
      activeVisitors: 3,
      weeklyVisitors: 45,
      avgDuration: 85
    };

    setTimeout(() => {
      setVisitors(mockVisitors);
      setStats(mockStats);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter visitors
  const filteredVisitors = visitors.filter(visitor => {
    const matchesSearch = !filters.search || 
      visitor.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      visitor.phone.toLowerCase().includes(filters.search.toLowerCase()) ||
      (visitor.roomNumber && visitor.roomNumber.toLowerCase().includes(filters.search.toLowerCase()));
    
    const matchesStatus = filters.status === 'all' || 
      (filters.status === 'active' ? visitor.isActive : !visitor.isActive);
    
    const matchesPurpose = filters.purpose === 'all' || visitor.purpose === filters.purpose;
    
    return matchesSearch && matchesStatus && matchesPurpose;
  });

  const handleCheckIn = async (e) => {
    e.preventDefault();
    try {
      // Mock API call
      const newVisitor = {
        ...checkInForm,
        _id: Date.now(),
        checkInTime: new Date().toISOString(),
        checkOutTime: null,
        isActive: true,
        actualDuration: null
      };
      
      setVisitors([newVisitor, ...visitors]);
      setShowCheckInModal(false);
      setCheckInForm({
        name: '',
        phone: '',
        email: '',
        purpose: 'Meeting',
        studentToVisit: '',
        roomNumber: '',
        idProof: 'Aadhar Card',
        idNumber: '',
        address: '',
        remarks: '',
        visitDuration: ''
      });
      
      // Update stats
      setStats(prev => ({
        ...prev,
        todayVisitors: prev.todayVisitors + 1,
        activeVisitors: prev.activeVisitors + 1
      }));
    } catch (error) {
      console.error('Error checking in visitor:', error);
      alert('Error checking in visitor');
    }
  };

  const handleCheckOut = async (visitorId) => {
    try {
      const remarks = prompt('Any checkout remarks?');
      if (remarks === null) return; // User cancelled
      
      setVisitors(visitors.map(visitor => {
        if (visitor._id === visitorId) {
          const checkOutTime = new Date();
          const checkInTime = new Date(visitor.checkInTime);
          const duration = Math.round((checkOutTime - checkInTime) / (1000 * 60));
          
          return {
            ...visitor,
            checkOutTime: checkOutTime.toISOString(),
            isActive: false,
            actualDuration: duration,
            remarks: remarks || visitor.remarks
          };
        }
        return visitor;
      }));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        activeVisitors: prev.activeVisitors - 1
      }));
    } catch (error) {
      console.error('Error checking out visitor:', error);
      alert('Error checking out visitor');
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Floating particles effect
  const FloatingParticles = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-primary/20 rounded-full animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  );

  // Enhanced statistics card with glass morphism
  const StatCard = ({ title, value, color, delay = 0 }) => (
    <div
      className={`group relative overflow-hidden rounded-2xl p-8 backdrop-blur-xl border border-white/20 
        bg-gradient-to-br from-white/10 to-white/5 shadow-2xl 
        hover:shadow-3xl transition-all duration-500 ease-out
        ${!isReducedMotion && 'hover:-translate-y-2 hover:scale-[1.02]'}
        animate-in fade-in slide-in-from-bottom-4`}
      style={{ 
        animationDelay: `${delay * 100}ms`,
        animationFillMode: 'both'
      }}
    >
      <FloatingParticles />
      <div className="relative z-10">
        <h3 className="text-sm font-semibold text-base-content/70 mb-2 transition-all duration-300 group-hover:text-base-content">
          {title}
        </h3>
        <p className={`text-4xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent 
          transition-all duration-500 group-hover:scale-110 origin-left`}>
          {value}
        </p>
      </div>
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 
        transition-opacity duration-500`} />
    </div>
  );

  // Enhanced filter input with gradient border
  const FilterInput = ({ label, children, className = '' }) => (
    <div className={`group relative ${className}`}>
      <label className="block text-sm font-semibold text-base-content/80 mb-3 transition-colors duration-300 group-hover:text-base-content">
        {label}
      </label>
      <div className="relative">
        {children}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/50 to-secondary/50 
          opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500 
          -z-10 blur-sm scale-105 group-hover:scale-110 group-focus-within:scale-110" />
      </div>
    </div>
  );

  // Enhanced table row with 3D effects
  const VisitorRow = ({ visitor, index }) => (
    <tr
      className={`group border-b border-base-300/30 hover:bg-base-200/50 transition-all duration-300
        ${!isReducedMotion && 'hover:scale-[1.01] hover:shadow-lg'}
        animate-in fade-in slide-in-from-bottom-2`}
      style={{ 
        animationDelay: `${index * 50}ms`,
        animationFillMode: 'both'
      }}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="space-y-1">
          <div className="font-semibold text-base-content group-hover:text-primary transition-colors duration-300">
            {visitor.name}
          </div>
          <div className="text-sm text-base-content/70">{visitor.phone}</div>
          {visitor.email && (
            <div className="text-sm text-base-content/60">{visitor.email}</div>
          )}
          {visitor.roomNumber && (
            <div className="text-sm text-base-content/60 flex items-center gap-1">
              <span className="w-1 h-1 bg-current rounded-full" />
              Room: {visitor.roomNumber}
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
          transition-all duration-300 group-hover:scale-110
          ${visitor.purpose === 'Emergency' ? 'bg-error/20 text-error' :
            visitor.purpose === 'Family Visit' ? 'bg-success/20 text-success' :
            visitor.purpose === 'Official' ? 'bg-primary/20 text-primary' :
            'bg-base-300 text-base-content'}`}>
          {visitor.purpose}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-base-content/70">
        {new Date(visitor.checkInTime).toLocaleString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
          transition-all duration-300 group-hover:scale-110
          ${visitor.isActive ? 'bg-success/20 text-success' : 'bg-base-300 text-base-content'}`}>
          <span className={`w-2 h-2 rounded-full mr-2 transition-all duration-300
            ${visitor.isActive ? 'bg-success animate-pulse' : 'bg-base-content'}`} />
          {visitor.isActive ? 'Inside' : 'Checked Out'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        {visitor.isActive ? (
          <button
            onClick={() => handleCheckOut(visitor._id)}
            className="relative overflow-hidden group/btn bg-gradient-to-r from-error to-red-600 text-white 
              px-4 py-2 rounded-xl font-semibold transition-all duration-300
              hover:shadow-xl hover:shadow-error/25 active:scale-95
              focus:outline-none focus:ring-2 focus:ring-error/50"
          >
            <span className="relative z-10 flex items-center gap-2">
              Check Out
              <svg className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" 
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
              </svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-error opacity-0 
              group-hover/btn:opacity-100 transition-opacity duration-300" />
          </button>
        ) : (
          <span className="text-base-content/50 font-medium">
            {formatDuration(visitor.actualDuration)}
          </span>
        )}
      </td>
    </tr>
  );

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-100 via-base-200 to-base-300 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 via-base-200 to-base-300 p-4 md:p-8">
      {/* Header Section */}
      <div className="relative mb-8 md:mb-12">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary 
              bg-clip-text text-transparent animate-in fade-in slide-in-from-left">
              Visitor Management
            </h1>
            <p className="text-base-content/70 text-lg animate-in fade-in slide-in-from-left 
              delay-150 duration-500">
              Premium visitor tracking and management system
            </p>
          </div>
          
          <button
            onClick={() => setShowCheckInModal(true)}
            className="relative group/btn overflow-hidden bg-gradient-to-r from-primary to-secondary 
              text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl
              transition-all duration-500 hover:shadow-3xl active:scale-95
              focus:outline-none focus:ring-4 focus:ring-primary/50
              animate-in fade-in slide-in-from-right"
          >
            <span className="relative z-10 flex items-center gap-3">
              <Plus className="w-5 h-5 transition-transform duration-300 group-hover/btn:scale-110" />
              Check In Visitor
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-secondary to-primary opacity-0 
              group-hover/btn:opacity-100 transition-opacity duration-500" />
          </button>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8 md:mb-12">
        <StatCard 
          title="Today's Visitors" 
          value={stats.todayVisitors || 0} 
          color="from-blue-500 to-cyan-500"
          delay={0}
        />
        <StatCard 
          title="Currently Inside" 
          value={stats.activeVisitors || 0} 
          color="from-green-500 to-emerald-500"
          delay={1}
        />
        <StatCard 
          title="This Week" 
          value={stats.weeklyVisitors || 0} 
          color="from-purple-500 to-pink-500"
          delay={2}
        />
        <StatCard 
          title="Avg Duration" 
          value={formatDuration(stats.avgDuration)} 
          color="from-orange-500 to-red-500"
          delay={3}
        />
      </div>

      {/* Filters Section */}
      <div className="relative mb-8 md:mb-12">
        <div className="backdrop-blur-xl bg-base-100/50 rounded-3xl p-6 md:p-8 border border-white/20 
          shadow-2xl animate-in fade-in slide-in-from-bottom duration-500 delay-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FilterInput label="Status">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full bg-base-100 border border-base-300 rounded-xl px-4 py-3 
                  font-medium transition-all duration-300 focus:ring-2 focus:ring-primary/50 
                  focus:border-primary backdrop-blur-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Currently Inside</option>
                <option value="completed">Checked Out</option>
              </select>
            </FilterInput>

            <FilterInput label="Purpose">
              <select
                value={filters.purpose}
                onChange={(e) => setFilters({ ...filters, purpose: e.target.value })}
                className="w-full bg-base-100 border border-base-300 rounded-xl px-4 py-3 
                  font-medium transition-all duration-300 focus:ring-2 focus:ring-primary/50 
                  focus:border-primary backdrop-blur-sm"
              >
                <option value="all">All Purposes</option>
                <option value="Meeting">Meeting</option>
                <option value="Delivery">Delivery</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Family Visit">Family Visit</option>
                <option value="Official">Official</option>
                <option value="Other">Other</option>
              </select>
            </FilterInput>

            <FilterInput label="Date">
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="w-full bg-base-100 border border-base-300 rounded-xl px-4 py-3 
                  font-medium transition-all duration-300 focus:ring-2 focus:ring-primary/50 
                  focus:border-primary backdrop-blur-sm"
              />
            </FilterInput>

            <FilterInput label="Search">
              <input
                type="text"
                placeholder="Name, phone, or room..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full bg-base-100 border border-base-300 rounded-xl px-4 py-3 
                  font-medium transition-all duration-300 focus:ring-2 focus:ring-primary/50 
                  focus:border-primary backdrop-blur-sm placeholder-base-content/40"
              />
            </FilterInput>
          </div>
        </div>
      </div>

      {/* Visitors Table */}
      <div className="backdrop-blur-xl bg-base-100/50 rounded-3xl border border-white/20 
        shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom duration-500 delay-500">
        <div className="px-6 md:px-8 py-6 border-b border-base-300/30">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-base-content to-base-content/80 
            bg-clip-text text-transparent">
            Visitor Records
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-base-300/30">
            <thead className="bg-base-200/50">
              <tr>
                {['Visitor Details', 'Purpose', 'Check In', 'Status', 'Actions'].map((header, index) => (
                  <th 
                    key={header}
                    className="px-6 py-4 text-left text-sm font-semibold text-base-content/70 
                      uppercase tracking-wider animate-in fade-in slide-in-from-bottom"
                    style={{ animationDelay: `${600 + index * 100}ms` }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-base-300/30">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center">
                    <div className="flex justify-center items-center gap-3 text-base-content/60">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Loading visitors...
                    </div>
                  </td>
                </tr>
              ) : filteredVisitors.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center">
                    <div className="text-base-content/50 space-y-2">
                      <User className="w-12 h-12 mx-auto opacity-50" />
                      <p className="font-medium">No visitors found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredVisitors.map((visitor, index) => (
                  <VisitorRow key={visitor._id} visitor={visitor} index={index} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Check In Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div 
            className="absolute inset-0 bg-base-content/50 backdrop-blur-sm"
            onClick={() => setShowCheckInModal(false)}
          />
          
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto
            backdrop-blur-2xl bg-base-100/90 border border-white/20 rounded-3xl shadow-3xl
            animate-in zoom-in duration-500 slide-in-from-bottom-8">
            
            <div className="sticky top-0 backdrop-blur-xl bg-base-100/80 border-b border-white/20 
              p-6 rounded-t-3xl">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary 
                  bg-clip-text text-transparent">
                  Check In Visitor
                </h3>
                <button
                  onClick={() => setShowCheckInModal(false)}
                  className="p-2 hover:bg-base-300 rounded-xl transition-all duration-300 
                    hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <svg className="w-6 h-6 text-base-content/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleCheckIn} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: 'Name *', type: 'text', value: checkInForm.name, key: 'name' },
                  { label: 'Phone *', type: 'tel', value: checkInForm.phone, key: 'phone' },
                  { label: 'Email', type: 'email', value: checkInForm.email, key: 'email' },
                  { 
                    label: 'Purpose *', 
                    type: 'select', 
                    value: checkInForm.purpose, 
                    key: 'purpose',
                    options: ['Meeting', 'Delivery', 'Maintenance', 'Family Visit', 'Official', 'Other']
                  },
                  { 
                    label: 'ID Proof Type *', 
                    type: 'select', 
                    value: checkInForm.idProof, 
                    key: 'idProof',
                    options: ['Aadhar Card', 'Driving License', 'Passport', 'Voter ID', 'Other']
                  },
                  { label: 'ID Number *', type: 'text', value: checkInForm.idNumber, key: 'idNumber' },
                ].map((field, index) => (
                  <FilterInput key={field.key}>
                    {field.type === 'select' ? (
                      <select
                        required={field.label.includes('*')}
                        value={field.value}
                        onChange={(e) => setCheckInForm({ ...checkInForm, [field.key]: e.target.value })}
                        className="w-full bg-base-100 border border-base-300 rounded-xl px-4 py-3 
                          font-medium transition-all duration-300 focus:ring-2 focus:ring-primary/50 
                          focus:border-primary backdrop-blur-sm"
                      >
                        {field.options.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        required={field.label.includes('*')}
                        placeholder={field.label}
                        value={field.value}
                        onChange={(e) => setCheckInForm({ ...checkInForm, [field.key]: e.target.value })}
                        className="w-full bg-base-100 border border-base-300 rounded-xl px-4 py-3 
                          font-medium transition-all duration-300 focus:ring-2 focus:ring-primary/50 
                          focus:border-primary backdrop-blur-sm placeholder-base-content/40"
                      />
                    )}
                  </FilterInput>
                ))}
              </div>

              <FilterInput label="Address *">
                <textarea
                  required
                  value={checkInForm.address}
                  onChange={(e) => setCheckInForm({ ...checkInForm, address: e.target.value })}
                  className="w-full bg-base-100 border border-base-300 rounded-xl px-4 py-3 
                    font-medium transition-all duration-300 focus:ring-2 focus:ring-primary/50 
                    focus:border-primary backdrop-blur-sm resize-none"
                  rows="3"
                  placeholder="Enter complete address..."
                />
              </FilterInput>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FilterInput label="Room Number">
                  <input
                    type="text"
                    value={checkInForm.roomNumber}
                    onChange={(e) => setCheckInForm({ ...checkInForm, roomNumber: e.target.value })}
                    className="w-full bg-base-100 border border-base-300 rounded-xl px-4 py-3 
                      font-medium transition-all duration-300 focus:ring-2 focus:ring-primary/50 
                      focus:border-primary backdrop-blur-sm"
                    placeholder="Optional room number"
                  />
                </FilterInput>

                <FilterInput label="Remarks">
                  <textarea
                    value={checkInForm.remarks}
                    onChange={(e) => setCheckInForm({ ...checkInForm, remarks: e.target.value })}
                    className="w-full bg-base-100 border border-base-300 rounded-xl px-4 py-3 
                      font-medium transition-all duration-300 focus:ring-2 focus:ring-primary/50 
                      focus:border-primary backdrop-blur-sm resize-none"
                    rows="2"
                    placeholder="Additional remarks..."
                  />
                </FilterInput>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-base-300/30">
                <button
                  type="button"
                  onClick={() => setShowCheckInModal(false)}
                  className="px-8 py-3 border border-base-300 rounded-xl font-semibold text-base-content/70
                    transition-all duration-300 hover:bg-base-300 hover:text-base-content
                    hover:scale-105 focus:outline-none focus:ring-2 focus:ring-base-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white 
                    rounded-xl font-semibold shadow-lg transition-all duration-300
                    hover:shadow-xl hover:scale-105 active:scale-95
                    focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  Check In Visitor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVisitors;