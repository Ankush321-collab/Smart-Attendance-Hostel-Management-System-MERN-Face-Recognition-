import React, { useState, useEffect, useCallback } from 'react';
import { mealAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const MealPlanning = () => {
  const { user } = useAuth();
  const [mealPlans, setMealPlans] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [currentView, setCurrentView] = useState('today');

  const [createForm, setCreateForm] = useState({
    date: '',
    mealType: 'Breakfast',
    items: [{ name: '', description: '', isVeg: true, allergens: [] }],
    specialMenu: false,
    occasion: '',
    estimatedCost: ''
  });

  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    taste: 5,
    quantity: 5,
    hygiene: 5,
    comments: '',
    suggestions: ''
  });

  const fetchMealPlans = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (currentView === 'today') {
        params.date = new Date().toISOString().split('T')[0];
      } else if (currentView === 'week') {
        params.week = true;
      }
      
      const response = await mealAPI.getPlans(params);
      setMealPlans(response.data.plans);
    } catch (error) {
      console.error('Error fetching meal plans:', error);
    } finally {
      setLoading(false);
    }
  }, [currentView]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await mealAPI.getStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchMealPlans();
    if (user.role === 'admin') {
      fetchStats();
    }
  }, [fetchMealPlans, fetchStats, user.role]);

  const handleCreateMeal = async (e) => {
    e.preventDefault();
    try {
      await mealAPI.create(createForm);
      setShowCreateModal(false);
      resetCreateForm();
      fetchMealPlans();
      if (user.role === 'admin') fetchStats();
    } catch (error) {
      console.error('Error creating meal plan:', error);
      alert('Error creating meal plan');
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    try {
      await mealAPI.submitFeedback(selectedMeal._id, feedbackForm);
      setShowFeedbackModal(false);
      setSelectedMeal(null);
      resetFeedbackForm();
      fetchMealPlans();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback');
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      date: '',
      mealType: 'Breakfast',
      items: [{ name: '', description: '', isVeg: true, allergens: [] }],
      specialMenu: false,
      occasion: '',
      estimatedCost: ''
    });
  };

  const resetFeedbackForm = () => {
    setFeedbackForm({
      rating: 5,
      taste: 5,
      quantity: 5,
      hygiene: 5,
      comments: '',
      suggestions: ''
    });
  };

  const addMenuItem = () => {
    setCreateForm({
      ...createForm,
      items: [...createForm.items, { name: '', description: '', isVeg: true, allergens: [] }]
    });
  };

  const removeMenuItem = (index) => {
    const newItems = createForm.items.filter((_, i) => i !== index);
    setCreateForm({ ...createForm, items: newItems });
  };

  const updateMenuItem = (index, field, value) => {
    const newItems = [...createForm.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setCreateForm({ ...createForm, items: newItems });
  };

  const getMealTypeColor = (mealType) => {
    switch (mealType) {
      case 'Breakfast': return 'bg-yellow-100 text-yellow-800';
      case 'Lunch': return 'bg-green-100 text-green-800';
      case 'Snacks': return 'bg-purple-100 text-purple-800';
      case 'Dinner': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const openFeedbackModal = (meal) => {
    setSelectedMeal(meal);
    if (meal.userFeedback) {
      setFeedbackForm({
        rating: meal.userFeedback.rating,
        taste: meal.userFeedback.taste || 5,
        quantity: meal.userFeedback.quantity || 5,
        hygiene: meal.userFeedback.hygiene || 5,
        comments: meal.userFeedback.comments || '',
        suggestions: meal.userFeedback.suggestions || ''
      });
    } else {
      resetFeedbackForm();
    }
    setShowFeedbackModal(true);
  };

  const renderStarRating = (rating, setRating, fieldName) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating({ ...feedbackForm, [fieldName]: star })}
            className={`text-xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {user.role === 'admin' ? 'Meal Planning' : 'Meal Schedule'}
        </h1>
        <div className="flex space-x-3">
          {user.role === 'admin' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Add Meal Plan
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards (Admin Only) */}
      {user.role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Today's Meals</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.todayMeals || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Monthly Meals</h3>
            <p className="text-3xl font-bold text-green-600">{stats.monthlyMeals || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Avg Rating</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {stats.avgRatings?.avgRating ? stats.avgRatings.avgRating.toFixed(1) : '0.0'}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Total Feedback</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.totalFeedback || 0}</p>
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setCurrentView('today')}
            className={`px-4 py-2 rounded-md ${
              currentView === 'today' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Today's Meals
          </button>
          <button
            onClick={() => setCurrentView('week')}
            className={`px-4 py-2 rounded-md ${
              currentView === 'week' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            This Week
          </button>
        </div>
      </div>

      {/* Meal Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-8">Loading...</div>
        ) : mealPlans.length === 0 ? (
          <div className="col-span-full text-center py-8">No meal plans found</div>
        ) : (
          mealPlans.map((meal) => (
            <div key={meal._id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {new Date(meal.date).toLocaleDateString()}
                    </h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMealTypeColor(meal.mealType)}`}>
                      {meal.mealType}
                    </span>
                  </div>
                  {meal.specialMenu && (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      Special
                    </span>
                  )}
                </div>

                {meal.occasion && (
                  <div className="mb-3">
                    <span className="text-sm font-medium text-purple-600">🎉 {meal.occasion}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">Menu Items:</h4>
                  {meal.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium">{item.name}</span>
                        {item.description && (
                          <p className="text-xs text-gray-500">{item.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className={`text-xs px-2 py-1 rounded ${
                          item.isVeg ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.isVeg ? '🌱 Veg' : '🍗 Non-Veg'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {user.role === 'student' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {meal.userFeedback ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Your Rating:</span>
                          <div className="flex text-yellow-400">
                            {'★'.repeat(meal.userFeedback.rating)}
                            {'☆'.repeat(5 - meal.userFeedback.rating)}
                          </div>
                        </div>
                        <button
                          onClick={() => openFeedbackModal(meal)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openFeedbackModal(meal)}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-sm"
                      >
                        Rate This Meal
                      </button>
                    )}
                  </div>
                )}

                {meal.estimatedCost && (
                  <div className="mt-3 text-sm text-gray-600">
                    Estimated Cost: ₹{meal.estimatedCost}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Meal Plan Modal (Admin Only) */}
      {showCreateModal && user.role === 'admin' && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Create Meal Plan</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateMeal} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date *</label>
                  <input
                    type="date"
                    required
                    value={createForm.date}
                    onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Meal Type *</label>
                  <select
                    required
                    value={createForm.mealType}
                    onChange={(e) => setCreateForm({ ...createForm, mealType: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Dinner">Dinner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estimated Cost (₹)</label>
                  <input
                    type="number"
                    value={createForm.estimatedCost}
                    onChange={(e) => setCreateForm({ ...createForm, estimatedCost: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={createForm.specialMenu}
                    onChange={(e) => setCreateForm({ ...createForm, specialMenu: e.target.checked })}
                    className="mr-2"
                  />
                  Special Menu
                </label>
              </div>

              {createForm.specialMenu && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Occasion</label>
                  <input
                    type="text"
                    placeholder="e.g., Diwali, Birthday celebration"
                    value={createForm.occasion}
                    onChange={(e) => setCreateForm({ ...createForm, occasion: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Menu Items *</label>
                  <button
                    type="button"
                    onClick={addMenuItem}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add Item
                  </button>
                </div>
                {createForm.items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-md p-3 mb-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          placeholder="Item name *"
                          required
                          value={item.name}
                          onChange={(e) => updateMenuItem(index, 'name', e.target.value)}
                          className="block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => updateMenuItem(index, 'description', e.target.value)}
                          className="block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={item.isVeg}
                          onChange={(e) => updateMenuItem(index, 'isVeg', e.target.checked)}
                          className="mr-2"
                        />
                        Vegetarian
                      </label>
                      {createForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMenuItem(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Meal Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Modal (Students Only) */}
      {showFeedbackModal && user.role === 'student' && selectedMeal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Rate {selectedMeal.mealType} - {new Date(selectedMeal.date).toLocaleDateString()}
              </h3>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Overall Rating *</label>
                {renderStarRating(feedbackForm.rating, setFeedbackForm, 'rating')}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Taste</label>
                  {renderStarRating(feedbackForm.taste, setFeedbackForm, 'taste')}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                  {renderStarRating(feedbackForm.quantity, setFeedbackForm, 'quantity')}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hygiene</label>
                  {renderStarRating(feedbackForm.hygiene, setFeedbackForm, 'hygiene')}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Comments</label>
                <textarea
                  value={feedbackForm.comments}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, comments: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows="3"
                  placeholder="Share your thoughts about this meal..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Suggestions</label>
                <textarea
                  value={feedbackForm.suggestions}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, suggestions: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows="2"
                  placeholder="Any suggestions for improvement..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealPlanning;