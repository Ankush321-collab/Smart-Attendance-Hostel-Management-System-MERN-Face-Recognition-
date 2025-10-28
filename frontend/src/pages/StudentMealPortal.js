import React, { useState, useEffect, useCallback } from 'react';
import { mealAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Navbar from '../components/Navbar';
import { 
  Calendar, 
  Clock, 
  Star, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown,
  Coffee,
  Utensils,
  Cookie,
  Moon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Bell,
  AlertCircle,
  CheckCircle,
  MapPin
} from 'lucide-react';

const StudentMealPortal = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meals, setMeals] = useState([]);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('today'); // 'today', 'week'
  
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    comments: '',
    feedbackType: 'review',
    category: '',
    priority: 'medium'
  });

  const [myFeedback, setMyFeedback] = useState([]);
  const [stats, setStats] = useState({});

  const mealIcons = {
    breakfast: Coffee,
    lunch: Utensils,
    snacks: Cookie,
    dinner: Moon
  };

  const fetchMeals = useCallback(async () => {
    try {
      setLoading(true);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      let response;
      if (viewMode === 'today') {
        response = await mealAPI.getPlans({ date: dateStr });
      } else {
        // Get week's meals
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        response = await mealAPI.getPlans({ 
          startDate: startOfWeek.toISOString().split('T')[0],
          view: 'week'
        });
      }
      
      setMeals(response.data.data);
    } catch (error) {
      console.error('Error fetching meals:', error);
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewMode]);

  const fetchMyFeedback = useCallback(async () => {
    try {
      const response = await mealAPI.getMyFeedback();
      setMyFeedback(response.data.data);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await mealAPI.getMyStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchMeals();
    fetchMyFeedback();
    fetchStats();
  }, [fetchMeals, fetchMyFeedback, fetchStats]);

  const handleDateChange = (direction) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'today') {
      newDate.setDate(currentDate.getDate() + direction);
    } else {
      newDate.setDate(currentDate.getDate() + (direction * 7));
    }
    setCurrentDate(newDate);
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    try {
      await mealAPI.submitFeedback(selectedMeal._id, feedbackForm);
      setFeedbackModal(false);
      setFeedbackForm({
        rating: 5,
        comments: '',
        feedbackType: 'review',
        category: '',
        priority: 'medium'
      });
      setSelectedMeal(null);
      fetchMyFeedback();
      alert('Feedback submitted successfully!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback');
    }
  };

  const openFeedbackModal = (meal, type = 'review') => {
    setSelectedMeal(meal);
    setFeedbackForm({
      ...feedbackForm,
      feedbackType: type,
      category: type === 'complaint' ? 'quality' : ''
    });
    setFeedbackModal(true);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (mealType) => {
    const times = {
      breakfast: '7:00 AM - 9:00 AM',
      lunch: '12:00 PM - 2:00 PM',
      snacks: '4:00 PM - 5:00 PM',
      dinner: '7:00 PM - 9:00 PM'
    };
    return times[mealType.toLowerCase()] || 'Check with mess staff';
  };

  const getMealStatus = (meal) => {
    const now = new Date();
    const mealDate = new Date(meal.date);
    const today = new Date().toDateString();
    
    if (mealDate.toDateString() !== today) {
      return mealDate < now ? 'past' : 'upcoming';
    }
    
    return meal.status;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'served': return 'bg-green-100 text-green-800';
      case 'prepared': return 'bg-blue-100 text-blue-800';
      case 'planned': return 'bg-yellow-100 text-yellow-800';
      case 'past': return 'bg-gray-100 text-gray-800';
      case 'upcoming': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
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
    <div className="min-h-screen bg-gradient-to-br from-base-100 via-base-200 to-base-300">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-12 text-center animate-in fade-in slide-in-from-bottom duration-700">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
            Meal Portal
          </h1>
          <p className="text-xl text-base-content/70 max-w-2xl mx-auto leading-relaxed">
            View today's meals, submit feedback, and track your meal preferences
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
          <div className="group relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl border border-white/20 bg-gradient-to-br from-base-100/80 to-base-200/60 shadow-xl hover:shadow-2xl transition-all duration-500 ease-out hover:-translate-y-2 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="absolute w-1.5 h-1.5 bg-primary/30 rounded-full animate-float" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${i * 0.7}s`, animationDuration: `${4 + Math.random() * 3}s` }} />
              ))}
            </div>
            <div className="relative z-10 flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-12">
                <Utensils className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-base-content/70 mb-1 transition-colors duration-300 group-hover:text-base-content">Meals Today</p>
                <p className="text-2xl font-bold text-base-content transition-all duration-500 group-hover:scale-105">{meals.filter(m => new Date(m.date).toDateString() === new Date().toDateString()).length}</p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl border border-white/20 bg-gradient-to-br from-base-100/80 to-base-200/60 shadow-xl hover:shadow-2xl transition-all duration-500 ease-out hover:-translate-y-2 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4" style={{animationDelay: '100ms'}}>
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="absolute w-1.5 h-1.5 bg-green-500/30 rounded-full animate-float" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${i * 0.7}s`, animationDuration: `${4 + Math.random() * 3}s` }} />
              ))}
            </div>
            <div className="relative z-10 flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-12">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-base-content/70 mb-1 transition-colors duration-300 group-hover:text-base-content">Avg Rating Given</p>
                <p className="text-2xl font-bold text-base-content transition-all duration-500 group-hover:scale-105">{stats.avgRatingGiven?.toFixed(1) || '0.0'}</p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl border border-white/20 bg-gradient-to-br from-base-100/80 to-base-200/60 shadow-xl hover:shadow-2xl transition-all duration-500 ease-out hover:-translate-y-2 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4" style={{animationDelay: '200ms'}}>
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="absolute w-1.5 h-1.5 bg-yellow-500/30 rounded-full animate-float" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${i * 0.7}s`, animationDuration: `${4 + Math.random() * 3}s` }} />
              ))}
            </div>
            <div className="relative z-10 flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-12">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-base-content/70 mb-1 transition-colors duration-300 group-hover:text-base-content">Feedback Given</p>
                <p className="text-2xl font-bold text-base-content transition-all duration-500 group-hover:scale-105">{stats.totalFeedback || 0}</p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl border border-white/20 bg-gradient-to-br from-base-100/80 to-base-200/60 shadow-xl hover:shadow-2xl transition-all duration-500 ease-out hover:-translate-y-2 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4" style={{animationDelay: '300ms'}}>
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="absolute w-1.5 h-1.5 bg-red-500/30 rounded-full animate-float" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${i * 0.7}s`, animationDuration: `${4 + Math.random() * 3}s` }} />
              ))}
            </div>
            <div className="relative z-10 flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-12">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-base-content/70 mb-1 transition-colors duration-300 group-hover:text-base-content">Open Complaints</p>
                <p className="text-2xl font-bold text-base-content transition-all duration-500 group-hover:scale-105">{stats.pendingComplaints || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* View Controls */}
        <div className="relative mb-12">
          <div className="backdrop-blur-xl bg-base-100/50 rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl animate-in fade-in slide-in-from-bottom duration-500 delay-400">
            <div className="flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0">
              <div className="flex bg-base-200/50 rounded-2xl p-1.5 backdrop-blur-sm border border-white/20">
                <button
                  onClick={() => setViewMode('today')}
                  className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${viewMode === 'today' ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg' : 'text-base-content/70 hover:text-base-content hover:bg-base-300/50'}`}
                >
                  Today
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${viewMode === 'week' ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg' : 'text-base-content/70 hover:text-base-content hover:bg-base-300/50'}`}
                >
                  This Week
                </button>
              </div>

              <div className="flex items-center space-x-6">
                <button
                  onClick={() => handleDateChange(-1)}
                  className="p-3 rounded-2xl bg-base-200/50 backdrop-blur-sm border border-white/20 text-base-content/70 hover:text-base-content hover:bg-base-300/50 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                <div className="text-center min-w-[200px]">
                  <p className="font-bold text-lg text-base-content bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {viewMode === 'today' ? formatDate(currentDate) : `Week of ${formatDate(currentDate)}`}
                  </p>
                </div>
                
                <button
                  onClick={() => handleDateChange(1)}
                  className="p-3 rounded-2xl bg-base-200/50 backdrop-blur-sm border border-white/20 text-base-content/70 hover:text-base-content hover:bg-base-300/50 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Meals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
          {meals.map((meal, index) => {
            const IconComponent = mealIcons[meal.mealType.toLowerCase()] || Utensils;
            const status = getMealStatus(meal);
            
            return (
              <div key={meal._id} className="group relative overflow-hidden rounded-2xl backdrop-blur-xl border border-white/20 bg-gradient-to-br from-base-100/80 to-base-200/60 shadow-xl hover:shadow-2xl transition-all duration-500 ease-out hover:-translate-y-3 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4" style={{animationDelay: `${index * 100}ms`}}>
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="absolute w-1.5 h-1.5 bg-primary/30 rounded-full animate-float" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${i * 0.7}s`, animationDuration: `${4 + Math.random() * 3}s` }} />
                  ))}
                </div>
                
                <div className="relative z-10 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-12">
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <h3 className="font-bold text-lg text-base-content capitalize transition-colors duration-300 group-hover:text-primary">{meal.mealType}</h3>
                        <p className="text-sm text-base-content/70 flex items-center transition-colors duration-300 group-hover:text-base-content/90">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatTime(meal.mealType)}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm border transition-all duration-300 group-hover:scale-110 ${getStatusColor(status)}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-semibold text-base-content/80 mb-3 transition-colors duration-300 group-hover:text-base-content">Menu Items:</p>
                    <div className="space-y-2">
                      {meal.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-center justify-between py-2 px-3 rounded-lg bg-base-200/50 backdrop-blur-sm border border-white/20 transition-all duration-300 hover:bg-base-300/50 hover:scale-[1.02]">
                          <span className="text-sm text-base-content font-medium">{item.name}</span>
                          <span className={`w-3 h-3 rounded-full border-2 border-white shadow-lg transition-all duration-300 hover:scale-125 ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {meal.averageRating && (
                    <div className="flex items-center mb-4 p-3 rounded-lg bg-base-200/50 backdrop-blur-sm">
                      <Star className="h-5 w-5 text-yellow-400 mr-2 fill-current" />
                      <span className="text-sm font-semibold text-base-content">
                        {meal.averageRating.toFixed(1)} 
                        <span className="text-base-content/70 ml-1">({meal.totalRatings} ratings)</span>
                      </span>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button
                      onClick={() => openFeedbackModal(meal, 'review')}
                      className="flex-1 group/btn relative overflow-hidden bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-xl font-semibold text-sm shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <ThumbsUp className="h-4 w-4 transition-transform duration-300 group-hover/btn:scale-110" />
                        Rate
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-secondary to-primary opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                    </button>
                    
                    <button
                      onClick={() => openFeedbackModal(meal, 'complaint')}
                      className="flex-1 group/btn relative overflow-hidden bg-gradient-to-r from-base-300 to-base-400 text-base-content py-3 rounded-xl font-semibold text-sm border border-base-300 transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-base-300"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <MessageSquare className="h-4 w-4 transition-transform duration-300 group-hover/btn:scale-110" />
                        Complain
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {meals.length === 0 && (
          <div className="text-center py-16 animate-in fade-in duration-700">
            <div className="relative inline-block mb-6">
              <Utensils className="h-16 w-16 text-base-content/30 mx-auto" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                <Utensils className="h-16 w-16 opacity-50" />
              </div>
            </div>
            <p className="text-xl text-base-content/70 font-medium">No meals scheduled for this {viewMode}</p>
          </div>
        )}

        {/* My Feedback Section */}
        <div className="relative mb-8">
          <div className="backdrop-blur-xl bg-base-100/50 rounded-3xl border border-white/20 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom duration-500 delay-600">
            <div className="px-6 md:px-8 py-6 border-b border-base-300/30">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-base-content to-base-content/80 bg-clip-text text-transparent">My Recent Feedback</h2>
            </div>
            
            <div className="p-6 md:p-8">
              {myFeedback.length > 0 ? (
                <div className="space-y-4">
                  {myFeedback.slice(0, 5).map((feedback, index) => (
                    <div key={feedback._id} className="group relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl border border-white/20 bg-gradient-to-br from-base-100/80 to-base-200/60 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1 hover:scale-[1.01] animate-in fade-in slide-in-from-left" style={{animationDelay: `${index * 50}ms`}}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm border transition-all duration-300 group-hover:scale-105 ${feedback.feedbackType === 'complaint' ? 'bg-error/20 text-error border-error/20' : 'bg-success/20 text-success border-success/20'}`}>
                              {feedback.feedbackType}
                            </span>
                            <span className="text-sm text-base-content/70 font-medium">
                              {new Date(feedback.createdAt).toLocaleDateString()}
                            </span>
                            {feedback.feedbackType === 'review' && (
                              <div className="flex items-center bg-base-200/50 px-2 py-1 rounded-lg">
                                <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                                <span className="text-sm font-semibold">{feedback.rating}/5</span>
                              </div>
                            )}
                          </div>
                          
                          <p className="text-base-content font-medium mb-3">{feedback.comments}</p>
                          
                          {feedback.adminResponse && (
                            <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/20 backdrop-blur-sm transition-all duration-300 group-hover:bg-primary/15">
                              <p className="text-sm font-semibold text-primary mb-1">Admin Response:</p>
                              <p className="text-sm text-base-content/90">{feedback.adminResponse}</p>
                            </div>
                          )}
                        </div>
                        
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm border transition-all duration-300 group-hover:scale-105 ml-4 ${feedback.status === 'resolved' ? 'bg-success/20 text-success border-success/20' : 'bg-warning/20 text-warning border-warning/20'}`}>
                          {feedback.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 animate-in fade-in duration-500">
                  <div className="relative inline-block mb-6">
                    <MessageSquare className="h-16 w-16 text-base-content/30 mx-auto" />
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      <MessageSquare className="h-16 w-16 opacity-50" />
                    </div>
                  </div>
                  <p className="text-xl text-base-content/70 font-medium mb-8">No feedback submitted yet</p>
                  <button
                    onClick={() => meals.length > 0 && openFeedbackModal(meals[0], 'review')}
                    className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    Share Your First Feedback
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {feedbackModal && selectedMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-base-content/50 backdrop-blur-sm" onClick={() => setFeedbackModal(false)} />
          
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto backdrop-blur-2xl bg-base-100/95 border border-white/20 rounded-3xl shadow-3xl animate-in zoom-in duration-500 slide-in-from-bottom-8">
            
            <div className="sticky top-0 backdrop-blur-xl bg-base-100/80 border-b border-white/20 p-6 rounded-t-3xl">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {feedbackForm.feedbackType === 'complaint' ? 'Submit Complaint' : 'Rate Meal'}
                </h3>
                <button
                  onClick={() => setFeedbackModal(false)}
                  className="p-2 hover:bg-base-300 rounded-xl transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <svg className="w-6 h-6 text-base-content/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-base-content/70 mt-2">
                {selectedMeal.mealType} - {new Date(selectedMeal.date).toLocaleDateString()}
              </p>
            </div>

            <form onSubmit={submitFeedback} className="p-6 space-y-6">
              {feedbackForm.feedbackType === 'review' && (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-base-content/80">Rating</label>
                  <div className="flex justify-center space-x-4">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackForm({...feedbackForm, rating: star})}
                        className={`p-2 transition-all duration-300 transform hover:scale-125 ${star <= feedbackForm.rating ? 'text-yellow-400 scale-110' : 'text-base-300 hover:text-yellow-300'}`}
                      >
                        <Star className="h-8 w-8 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {feedbackForm.feedbackType === 'complaint' && (
                <>
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-base-content/80">Complaint Category</label>
                    <select
                      value={feedbackForm.category}
                      onChange={(e) => setFeedbackForm({...feedbackForm, category: e.target.value})}
                      className="w-full bg-base-200 border border-base-300 rounded-xl px-4 py-3 font-medium transition-all duration-300 focus:ring-2 focus:ring-primary/50 focus:border-primary backdrop-blur-sm"
                      required
                    >
                      <option value="">Select category</option>
                      <option value="quality">Food Quality</option>
                      <option value="quantity">Quantity Issue</option>
                      <option value="hygiene">Hygiene Concern</option>
                      <option value="service">Service Issue</option>
                      <option value="timing">Timing Problem</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-base-content/80">Priority</label>
                    <select
                      value={feedbackForm.priority}
                      onChange={(e) => setFeedbackForm({...feedbackForm, priority: e.target.value})}
                      className="w-full bg-base-200 border border-base-300 rounded-xl px-4 py-3 font-medium transition-all duration-300 focus:ring-2 focus:ring-primary/50 focus:border-primary backdrop-blur-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-base-content/80">Comments</label>
                <textarea
                  value={feedbackForm.comments}
                  onChange={(e) => setFeedbackForm({...feedbackForm, comments: e.target.value})}
                  className="w-full bg-base-200 border border-base-300 rounded-xl px-4 py-3 font-medium transition-all duration-300 focus:ring-2 focus:ring-primary/50 focus:border-primary backdrop-blur-sm resize-none"
                  rows="4"
                  placeholder={feedbackForm.feedbackType === 'complaint' ? "Describe the issue in detail..." : "Share your thoughts about this meal..."}
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-base-300/30">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  Submit {feedbackForm.feedbackType === 'complaint' ? 'Complaint' : 'Review'}
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackModal(false)}
                  className="flex-1 py-3 border border-base-300 rounded-xl font-semibold text-base-content/70 transition-all duration-300 hover:bg-base-300 hover:text-base-content hover:scale-105 focus:outline-none focus:ring-2 focus:ring-base-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentMealPortal;