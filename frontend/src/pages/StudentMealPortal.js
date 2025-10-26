import React, { useState, useEffect, useCallback } from 'react';
import { mealAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Meal Portal</h1>
          <p className="mt-2 text-gray-600">
            View today's meals, submit feedback, and track your meal preferences
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Utensils className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Meals Today</p>
                <p className="text-2xl font-bold">{meals.filter(m => new Date(m.date).toDateString() === new Date().toDateString()).length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Star className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Avg Rating Given</p>
                <p className="text-2xl font-bold">{stats.avgRatingGiven?.toFixed(1) || '0.0'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Feedback Given</p>
                <p className="text-2xl font-bold">{stats.totalFeedback || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Open Complaints</p>
                <p className="text-2xl font-bold">{stats.pendingComplaints || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* View Controls */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <button
                onClick={() => setViewMode('today')}
                className={`px-4 py-2 rounded-lg ${viewMode === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                Today
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 rounded-lg ${viewMode === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                This Week
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleDateChange(-1)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="text-center">
                <p className="font-semibold text-lg">
                  {viewMode === 'today' ? formatDate(currentDate) : `Week of ${formatDate(currentDate)}`}
                </p>
              </div>
              
              <button
                onClick={() => handleDateChange(1)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Meals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {meals.map(meal => {
            const IconComponent = mealIcons[meal.mealType.toLowerCase()] || Utensils;
            const status = getMealStatus(meal);
            
            return (
              <div key={meal._id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        <IconComponent className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg capitalize">{meal.mealType}</h3>
                        <p className="text-sm text-gray-600 flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatTime(meal.mealType)}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(status)}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Menu Items:</p>
                    <div className="space-y-1">
                      {meal.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{item.name}</span>
                          <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {meal.averageRating && (
                    <div className="flex items-center mb-4">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-sm text-gray-600">
                        {meal.averageRating.toFixed(1)} ({meal.totalRatings} ratings)
                      </span>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <button
                      onClick={() => openFeedbackModal(meal, 'review')}
                      className="flex-1 btn-secondary text-sm flex items-center justify-center"
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      Rate
                    </button>
                    <button
                      onClick={() => openFeedbackModal(meal, 'complaint')}
                      className="flex-1 btn-outline text-sm flex items-center justify-center"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Complain
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {meals.length === 0 && (
          <div className="text-center py-12">
            <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No meals scheduled for this {viewMode}</p>
          </div>
        )}

        {/* My Feedback Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">My Recent Feedback</h2>
          </div>
          <div className="p-6">
            {myFeedback.length > 0 ? (
              <div className="space-y-4">
                {myFeedback.slice(0, 5).map(feedback => (
                  <div key={feedback._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            feedback.feedbackType === 'complaint' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {feedback.feedbackType}
                          </span>
                          <span className="text-sm text-gray-600">
                            {new Date(feedback.createdAt).toLocaleDateString()}
                          </span>
                          {feedback.feedbackType === 'review' && (
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-400 mr-1" />
                              <span className="text-sm">{feedback.rating}/5</span>
                            </div>
                          )}
                        </div>
                        <p className="text-gray-800">{feedback.comments}</p>
                        {feedback.adminResponse && (
                          <div className="mt-2 p-3 bg-blue-50 rounded">
                            <p className="text-sm text-blue-800">
                              <strong>Admin Response:</strong> {feedback.adminResponse}
                            </p>
                          </div>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        feedback.status === 'resolved' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {feedback.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No feedback submitted yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {feedbackModal && selectedMeal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {feedbackForm.feedbackType === 'complaint' ? 'Submit Complaint' : 'Rate Meal'}
            </h2>
            <p className="text-gray-600 mb-4">
              {selectedMeal.mealType} - {new Date(selectedMeal.date).toLocaleDateString()}
            </p>
            
            <form onSubmit={submitFeedback}>
              {feedbackForm.feedbackType === 'review' && (
                <div className="form-group">
                  <label className="form-label">Rating</label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackForm({...feedbackForm, rating: star})}
                        className={`p-1 ${star <= feedbackForm.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                      >
                        <Star className="h-6 w-6 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {feedbackForm.feedbackType === 'complaint' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Complaint Category</label>
                    <select
                      value={feedbackForm.category}
                      onChange={(e) => setFeedbackForm({...feedbackForm, category: e.target.value})}
                      className="form-input"
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

                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      value={feedbackForm.priority}
                      onChange={(e) => setFeedbackForm({...feedbackForm, priority: e.target.value})}
                      className="form-input"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Comments</label>
                <textarea
                  value={feedbackForm.comments}
                  onChange={(e) => setFeedbackForm({...feedbackForm, comments: e.target.value})}
                  className="form-input"
                  rows="4"
                  placeholder={feedbackForm.feedbackType === 'complaint' ? 
                    "Describe the issue in detail..." : 
                    "Share your thoughts about this meal..."
                  }
                  required
                />
              </div>

              <div className="flex space-x-4 mt-6">
                <button type="submit" className="btn-primary">
                  Submit {feedbackForm.feedbackType === 'complaint' ? 'Complaint' : 'Review'}
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackModal(false)}
                  className="btn-secondary"
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