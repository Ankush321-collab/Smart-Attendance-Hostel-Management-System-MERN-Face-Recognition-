import React, { useState, useEffect, useCallback } from 'react';
import { mealAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { 
  Upload, 
  FileText, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  Edit,
  Download,
  Filter,
  Plus,
  MessageSquare,
  Star,
  TrendingUp,
  Utensils
} from 'lucide-react';

const AdminMealPlanning = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [weeklyPlans, setWeeklyPlans] = useState([]);
  const [dailyMeals, setDailyMeals] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploadModal, setUploadModal] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [processModal, setProcessModal] = useState(null);
  const [extractedMeals, setExtractedMeals] = useState([]);
  const [addMealModal, setAddMealModal] = useState(null); // For adding individual meals
  const [quickTextModal, setQuickTextModal] = useState(false); // For quick text input
  const [viewPlanModal, setViewPlanModal] = useState(null); // For viewing plan details
  const [quickTextForm, setQuickTextForm] = useState({
    extractedText: '',
    weekStartDate: new Date().toISOString().split('T')[0]
  });

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    weekStartDate: '',
    file: null
  });

  // Add meal form state
  const [addMealForm, setAddMealForm] = useState({
    date: '',
    mealType: 'Breakfast',
    items: [{ name: '', isVeg: true }]
  });

  const [filters, setFilters] = useState({
    status: 'all',
    feedbackType: 'all',
    priority: 'all',
    view: 'today'
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // For daily menu view, always fetch current week
      const mealsViewParam = activeTab === 'daily' ? 'week' : filters.view;
      
      const [weeklyRes, mealsRes, feedbackRes, statsRes] = await Promise.all([
        mealAPI.getWeeklyPlans({ status: filters.status }),
        mealAPI.getPlans({ view: mealsViewParam }),
        mealAPI.getFeedback({ 
          type: filters.feedbackType, 
          priority: filters.priority 
        }),
        mealAPI.getStats()
      ]);

      setWeeklyPlans(weeklyRes.data.data);
      setDailyMeals(mealsRes.data.data);
      setFeedback(feedbackRes.data.data);
      setStats(statsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    try {
      // First, extract text from the uploaded file using server-side OCR
      const fileForm = new FormData();
      fileForm.append('file', uploadForm.file);

      let extractedText = '';
      try {
        const ocrRes = await mealAPI.extractText(fileForm);
        if (ocrRes.data && ocrRes.data.data) {
          extractedText = ocrRes.data.data.extractedText || '';
        }
      } catch (ocrErr) {
        console.warn('OCR extraction failed, continuing upload without extracted text', ocrErr);
      }

      // Now upload the weekly plan and include extractedText so admin can review
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('title', uploadForm.title);
      formData.append('weekStartDate', uploadForm.weekStartDate);
      if (extractedText) formData.append('extractedText', extractedText);

      const response = await mealAPI.uploadWeeklyPlan(formData);

      if (response.data.success) {
        const savedPlan = response.data.data;
        setUploadModal(false);
        setUploadForm({ title: '', weekStartDate: '', file: null });
        // If server returned extracted text, prefill process modal so admin can review
        if (savedPlan && savedPlan.isExtracted && savedPlan.extractedText) {
          const meals = parseExtractedText(savedPlan.extractedText, savedPlan.weekStartDate);
          setExtractedMeals(meals);
          setProcessModal(savedPlan);
        }
        fetchData();
        alert('Weekly meal plan uploaded successfully!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(error.response?.data?.message || 'Upload failed');
    }
  };

  const handleProcessPlan = async (plan) => {
    // Parse the extracted text to create meal data
    // Enhanced parser for daily breakdown
    const extractedText = plan.extractedText || `
    Sunday:
    Breakfast: Idli, Sambar, Coconut Chutney, Tea
    Lunch: Rice, Dal, Mixed Vegetable, Roti, Pickle
    Snacks: Bhel Puri, Tea, Banana
    Dinner: Rice, Rajma, Dry Sabji, Roti, Curd
    
    Monday:
    Breakfast: Poha, Tea, Orange
    Lunch: Rice, Rajma, Sabji, Roti, Curd
    Snacks: Samosa, Chutney, Coffee
    Dinner: Rice, Dal Fry, Palak Paneer, Roti
    
    Tuesday:
    Breakfast: Upma, Coffee, Apple
    Lunch: Rice, Sambar, Dry Sabji, Roti, Papad
    Snacks: Biscuits, Tea, Seasonal Fruit
    Dinner: Rice, Chole, Mix Vegetables, Roti
    
    Wednesday:
    Breakfast: Paratha, Curd, Pickle, Tea
    Lunch: Rice, Chole, Mix Veg, Roti, Salad
    Snacks: Pakora, Tea, Banana
    Dinner: Rice, Dal Tadka, Aloo Gobi, Roti
    
    Thursday:
    Breakfast: Bread, Jam, Butter, Coffee
    Lunch: Rice, Dal Tadka, Aloo Gobi, Roti, Pickle
    Snacks: Dhokla, Chutney, Tea
    Dinner: Rice, Paneer Curry, Bhindi, Roti
    
    Friday:
    Breakfast: Dosa, Sambar, Chutney, Coffee
    Lunch: Rice, Paneer Curry, Bhindi, Roti, Curd
    Snacks: Vada Pav, Tea, Orange
    Dinner: Rice, Fish Curry, Cabbage Sabji, Roti
    
    Saturday:
    Breakfast: Puri Bhaji, Tea, Seasonal Fruit
    Lunch: Rice, Fish Curry, Sabji, Roti, Pickle
    Snacks: Chat, Cold Drink, Biscuits
    Dinner: Rice, Chicken Curry, Dal, Roti, Salad
    `;

    const meals = parseExtractedText(extractedText, plan.weekStartDate);
    setExtractedMeals(meals);
    setProcessModal(plan);
  };

  const parseExtractedText = (text, startDate) => {
    const meals = [];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const mealTypes = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];
    
    const startDateObj = new Date(startDate);
    
    // Enhanced parsing for daily menus
    days.forEach((day, dayIndex) => {
      const currentDate = new Date(startDateObj);
      currentDate.setDate(currentDate.getDate() + dayIndex);
      
      mealTypes.forEach(mealType => {
        // Try different patterns to extract meal data
        const patterns = [
          // Pattern: "Monday: Breakfast: item1, item2"
          new RegExp(`${day}[\\s\\S]*?${mealType}:\\s*([^\\n\\r]+)`, 'i'),
          // Pattern: "Breakfast (Monday): item1, item2"
          new RegExp(`${mealType}\\s*\\(${day}\\):\\s*([^\\n\\r]+)`, 'i'),
          // Pattern: Just meal type followed by items
          new RegExp(`${mealType}:\\s*([^\\n\\r]+)`, 'i')
        ];
        
        let items = [];
        let found = false;
        
        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match && !found) {
            items = match[1]
              .split(/[,;]/)
              .map(item => item.trim())
              .filter(item => item.length > 0)
              .slice(0, 6) // Limit to 6 items per meal
              .map(item => ({
                name: item.replace(/^[-•*]\s*/, ''), // Remove bullet points
                isVeg: !/(chicken|mutton|fish|egg|meat|beef|pork)/i.test(item)
              }));
            found = true;
          }
        }
        
        // If no items found, create default items for demo
        if (items.length === 0) {
          const defaultItems = {
            'Breakfast': ['Tea/Coffee', 'Bread & Butter', 'Boiled Eggs'],
            'Lunch': ['Rice', 'Dal', 'Vegetable Curry', 'Roti'],
            'Snacks': ['Biscuits', 'Tea', 'Seasonal Fruit'],
            'Dinner': ['Rice', 'Dal', 'Dry Sabji', 'Roti']
          };
          
          items = (defaultItems[mealType] || []).map(name => ({
            name,
            isVeg: !/(egg)/i.test(name)
          }));
        }
        
        if (items.length > 0) {
          meals.push({
            date: currentDate.toISOString().split('T')[0],
            mealType,
            items,
            dayName: day
          });
        }
      });
    });
    
    return meals;
  };

  const confirmProcessPlan = async () => {
    try {
      await mealAPI.processWeeklyPlan(processModal._id, { extractedMeals });
      setProcessModal(null);
      setExtractedMeals([]);
      fetchData();
      alert('Meal plan processed successfully!');
    } catch (error) {
      console.error('Process error:', error);
      alert('Error processing meal plan');
    }
  };

  const handleQuickTextProcess = async () => {
    try {
      if (!quickTextForm.extractedText.trim()) {
        alert('Please enter some text to process');
        return;
      }

      // Parse the extracted text into meals
      const meals = parseExtractedText(quickTextForm.extractedText, quickTextForm.weekStartDate);
      
      // Create each meal plan directly
      for (const meal of meals) {
        try {
          await mealAPI.createPlan({
            date: meal.date,
            mealType: meal.mealType,
            items: meal.items,
            occasion: 'Regular'
          });
        } catch (error) {
          console.warn(`Failed to create ${meal.mealType} for ${meal.date}:`, error);
        }
      }

      // Reset form and close modal
      setQuickTextForm({
        extractedText: '',
        weekStartDate: new Date().toISOString().split('T')[0]
      });
      setQuickTextModal(false);
      fetchData();
      alert(`Successfully processed ${meals.length} meals from extracted text!`);
    } catch (error) {
      console.error('Quick text process error:', error);
      alert('Error processing extracted text');
    }
  };

  const handleResolveFeedback = async (feedbackId, resolution) => {
    try {
      await mealAPI.resolveFeedback(feedbackId, {
        status: 'resolved',
        adminResponse: resolution
      });
      fetchData();
      alert('Feedback resolved successfully!');
    } catch (error) {
      console.error('Resolve error:', error);
      alert('Error resolving feedback');
    }
  };

  const updateMealStatus = async (mealId, status) => {
    try {
      await mealAPI.updateStatus(mealId, status);
      fetchData();
    } catch (error) {
      console.error('Status update error:', error);
      alert('Error updating meal status');
    }
  };

  const openAddMealModal = (day, mealType) => {
    const today = new Date();
    const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(day);
    const currentDayIndex = today.getDay();
    const daysToAdd = (dayIndex - currentDayIndex + 7) % 7;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysToAdd);
    
    setAddMealForm({
      date: targetDate.toISOString().split('T')[0],
      mealType,
      items: [{ name: '', isVeg: true }]
    });
    setAddMealModal({ day, mealType });
  };

  const addMealItem = () => {
    setAddMealForm({
      ...addMealForm,
      items: [...addMealForm.items, { name: '', isVeg: true }]
    });
  };

  const removeMealItem = (index) => {
    const newItems = addMealForm.items.filter((_, i) => i !== index);
    setAddMealForm({
      ...addMealForm,
      items: newItems.length > 0 ? newItems : [{ name: '', isVeg: true }]
    });
  };

  const updateMealItem = (index, field, value) => {
    const newItems = [...addMealForm.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setAddMealForm({
      ...addMealForm,
      items: newItems
    });
  };

  const submitAddMeal = async (e) => {
    e.preventDefault();
    try {
      const validItems = addMealForm.items.filter(item => item.name.trim());
      if (validItems.length === 0) {
        alert('Please add at least one meal item');
        return;
      }

      await mealAPI.createPlan({
        ...addMealForm,
        items: validItems
      });
      
      setAddMealModal(null);
      setAddMealForm({
        date: '',
        mealType: 'Breakfast',
        items: [{ name: '', isVeg: true }]
      });
      fetchData();
      alert('Meal added successfully!');
    } catch (error) {
      console.error('Add meal error:', error);
      alert('Error adding meal');
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Meal Planning Management</h1>
          <p className="mt-2 text-gray-600">
            Upload weekly meal plans, manage daily meals, and handle student feedback
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Today's Meals</p>
                <p className="text-2xl font-bold">{stats.todayMeals || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold">{stats.avgRatings?.avgRating?.toFixed(1) || '0.0'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Pending Complaints</p>
                <p className="text-2xl font-bold">{stats.pendingComplaints || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Weekly Plans</p>
                <p className="text-2xl font-bold">{stats.weeklyPlans || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { key: 'overview', label: 'Overview', icon: TrendingUp },
                { key: 'daily', label: 'Daily Menu View', icon: Calendar },
                { key: 'weekly', label: 'Weekly Plans', icon: FileText },
                { key: 'meals', label: 'Meal Management', icon: Utensils },
                { key: 'feedback', label: 'Feedback & Complaints', icon: MessageSquare }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Daily Menu View Tab */}
            {activeTab === 'daily' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Daily Menu Calendar</h2>
                  <div className="flex space-x-4">
                    <button 
                      onClick={() => setQuickTextModal(true)}
                      className="btn-primary text-sm"
                    >
                      📄 Quick Add from Text
                    </button>
                    <select
                      value={filters.view}
                      onChange={(e) => setFilters({...filters, view: e.target.value})}
                      className="form-input"
                    >
                      <option value="current">Current Week</option>
                      <option value="next">Next Week</option>
                      <option value="all">All Weeks</option>
                    </select>
                    <button 
                      onClick={fetchData}
                      className="btn-secondary text-sm"
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                {/* Debug info - shows total meals loaded */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    📊 Loaded {dailyMeals.length} meal plans | 
                    Active filter: {activeTab === 'daily' ? 'week' : filters.view} | 
                    {dailyMeals.length > 0 && (
                      <>Date range: {new Date(Math.min(...dailyMeals.map(m => new Date(m.date)))).toLocaleDateString()} - {new Date(Math.max(...dailyMeals.map(m => new Date(m.date)))).toLocaleDateString()}</>
                    )}
                  </p>
                </div>

                {/* Daily Menu Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, dayIndex) => {
                    // Calculate the date for this day in the current week
                    const today = new Date();
                    const currentDay = today.getDay(); // 0 = Sunday
                    const startOfWeek = new Date(today);
                    startOfWeek.setDate(today.getDate() - currentDay);
                    
                    const targetDate = new Date(startOfWeek);
                    targetDate.setDate(startOfWeek.getDate() + dayIndex);
                    
                    const dayMeals = dailyMeals.filter(meal => {
                      const mealDate = new Date(meal.date);
                      return mealDate.toDateString() === targetDate.toDateString();
                    });

                    return (
                      <div key={day} className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-bold text-center mb-4 text-lg text-blue-600">
                          {day}
                          <div className="text-xs text-gray-500 font-normal">
                            {targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </h3>
                        
                        {['Breakfast', 'Lunch', 'Snacks', 'Dinner'].map(mealType => {
                          const meal = dayMeals.find(m => m.mealType === mealType);
                          
                          return (
                            <div key={mealType} className="mb-4">
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold text-sm text-gray-700">{mealType}</h4>
                                  {meal && (
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      meal.status === 'served' ? 'bg-green-100 text-green-800' :
                                      meal.status === 'prepared' ? 'bg-blue-100 text-blue-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {meal.status}
                                    </span>
                                  )}
                                </div>
                                
                                {meal ? (
                                  <div className="space-y-1">
                                    {meal.items.slice(0, 3).map((item, index) => (
                                      <div key={index} className="flex items-center justify-between">
                                        <span className="text-xs text-gray-600">{item.name}</span>
                                        <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                      </div>
                                    ))}
                                    {meal.items.length > 3 && (
                                      <p className="text-xs text-gray-500">+{meal.items.length - 3} more items</p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-center py-2">
                                    <p className="text-xs text-gray-400">No menu planned</p>
                                    <button 
                                      onClick={() => openAddMealModal(day, mealType)}
                                      className="text-xs text-blue-600 hover:text-blue-800 mt-1 hover:underline"
                                    >
                                      Add Menu
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Weekly Plans Tab */}
            {activeTab === 'weekly' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Weekly Meal Plans</h2>
                  <button
                    onClick={() => setUploadModal(true)}
                    className="btn-primary flex items-center"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Weekly Plan
                  </button>
                </div>

                <div className="grid gap-6">
                  {weeklyPlans.map(plan => (
                    <div key={plan._id} className="border rounded-lg p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold">{plan.title}</h3>
                          <p className="text-gray-600">
                            Week: {new Date(plan.weekStartDate).toLocaleDateString()} - {new Date(plan.weekEndDate).toLocaleDateString()}
                          </p>
                          <div className="flex items-center mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              plan.status === 'processed' 
                                ? 'bg-green-100 text-green-800'
                                : plan.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                            </span>
                            {plan.isExtracted && (
                              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                Text Extracted
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {plan.isExtracted && plan.status !== 'processed' && (
                            <button
                              onClick={() => handleProcessPlan(plan)}
                              className="btn-primary text-sm"
                            >
                              Process Plan
                            </button>
                          )}
                          <button 
                            onClick={() => setViewPlanModal(plan)}
                            className="btn-secondary text-sm"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily Meals Tab */}
            {activeTab === 'daily' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Daily Meal Plans</h2>
                  <div className="flex space-x-4">
                    <select
                      value={filters.view}
                      onChange={(e) => setFilters({...filters, view: e.target.value})}
                      className="form-input"
                    >
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                    </select>
                    <button className="btn-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Meal
                    </button>
                  </div>
                </div>

                <div className="grid gap-4">
                  {dailyMeals.map(meal => (
                    <div key={meal._id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-4">
                            <h3 className="font-semibold">{meal.mealType}</h3>
                            <span className="text-gray-600">
                              {new Date(meal.date).toLocaleDateString()}
                            </span>
                            <select
                              value={meal.status}
                              onChange={(e) => updateMealStatus(meal._id, e.target.value)}
                              className="text-sm border rounded px-2 py-1"
                            >
                              <option value="planned">Planned</option>
                              <option value="prepared">Prepared</option>
                              <option value="served">Served</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              Items: {meal.items.map(item => item.name).join(', ')}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button className="btn-secondary text-sm">
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback & Complaints Tab */}
            {activeTab === 'feedback' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Feedback & Complaints</h2>
                  <div className="flex space-x-4">
                    <select
                      value={filters.feedbackType}
                      onChange={(e) => setFilters({...filters, feedbackType: e.target.value})}
                      className="form-input"
                    >
                      <option value="all">All Types</option>
                      <option value="review">Reviews</option>
                      <option value="complaint">Complaints</option>
                    </select>
                    <select
                      value={filters.priority}
                      onChange={(e) => setFilters({...filters, priority: e.target.value})}
                      className="form-input"
                    >
                      <option value="all">All Priorities</option>
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4">
                  {feedback.map(item => (
                    <div key={item._id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              item.feedbackType === 'complaint'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {item.feedbackType}
                            </span>
                            {item.feedbackType === 'complaint' && (
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                item.priority === 'urgent' ? 'bg-red-200 text-red-900' :
                                item.priority === 'high' ? 'bg-orange-200 text-orange-900' :
                                'bg-yellow-200 text-yellow-900'
                              }`}>
                                {item.priority} priority
                              </span>
                            )}
                            <span className="text-sm text-gray-600">
                              by {item.student?.name}
                            </span>
                          </div>
                          <p className="text-gray-800">{item.comments}</p>
                          {item.feedbackType === 'review' && (
                            <div className="flex items-center mt-2">
                              <Star className="h-4 w-4 text-yellow-400 mr-1" />
                              <span className="text-sm">{item.rating}/5</span>
                            </div>
                          )}
                        </div>
                        {item.status === 'pending' && (
                          <button
                            onClick={() => {
                              const resolution = prompt('Enter resolution:');
                              if (resolution) {
                                handleResolveFeedback(item._id, resolution);
                              }
                            }}
                            className="btn-primary text-sm"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {uploadModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg">
            <h2 className="text-xl font-bold mb-4">Upload Weekly Meal Plan</h2>
            <form onSubmit={handleFileUpload}>
              <div className="form-group">
                <label className="form-label">Plan Title</label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                  className="form-input"
                  required
                  placeholder="e.g., Week 1 - November 2025"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Week Start Date</label>
                <input
                  type="date"
                  value={uploadForm.weekStartDate}
                  onChange={(e) => setUploadForm({...uploadForm, weekStartDate: e.target.value})}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Upload File (PDF or Image)</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setUploadForm({...uploadForm, file: e.target.files[0]})}
                  className="form-input"
                  required
                />
                <p className="text-sm text-gray-600 mt-1">
                  Supported formats: PDF, JPG, PNG (Max 10MB)
                </p>
              </div>
              
              <div className="flex space-x-4 mt-6">
                <button type="submit" className="btn-primary">
                  Upload & Process
                </button>
                <button
                  type="button"
                  onClick={() => setUploadModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Process Modal */}
      {processModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-4xl">
            <h2 className="text-xl font-bold mb-4">Process Extracted Meal Plan</h2>
            <p className="text-gray-600 mb-4">
              Review and edit the extracted meal data before creating daily meal plans.
            </p>
            
            <div className="max-h-96 overflow-y-auto border rounded p-4 mb-4">
              {extractedMeals.map((meal, index) => (
                <div key={index} className="mb-4 p-4 border rounded">
                  <div className="flex items-center space-x-4 mb-2">
                    <span className="font-semibold">{meal.dayName}</span>
                    <span className="font-semibold">{new Date(meal.date).toLocaleDateString()}</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {meal.mealType}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Items: {meal.items.map(item => item.name).join(', ')}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={confirmProcessPlan}
                className="btn-primary"
              >
                Create Meal Plans ({extractedMeals.length} meals)
              </button>
              <button
                onClick={() => setProcessModal(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Meal Modal */}
      {addMealModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              Add {addMealModal.mealType} for {addMealModal.day}
            </h2>
            
            <form onSubmit={submitAddMeal}>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  value={addMealForm.date}
                  onChange={(e) => setAddMealForm({...addMealForm, date: e.target.value})}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Meal Type</label>
                <select
                  value={addMealForm.mealType}
                  onChange={(e) => setAddMealForm({...addMealForm, mealType: e.target.value})}
                  className="form-input"
                >
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Dinner">Dinner</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Menu Items</label>
                <div className="space-y-3">
                  {addMealForm.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateMealItem(index, 'name', e.target.value)}
                          placeholder="Item name (e.g., Rice, Dal, Roti)"
                          className="form-input w-full"
                          required
                        />
                      </div>
                      <div className="w-28">
                        <select
                          value={item.isVeg ? 'veg' : 'non-veg'}
                          onChange={(e) => updateMealItem(index, 'isVeg', e.target.value === 'veg')}
                          className="form-input w-full text-sm"
                        >
                          <option value="veg">Veg</option>
                          <option value="non-veg">Non-Veg</option>
                        </select>
                      </div>
                      {addMealForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMealItem(index)}
                          className="btn-danger text-sm px-3 py-2 min-w-[40px]"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addMealItem}
                  className="btn-secondary text-sm mt-3 w-full"
                >
                  + Add Another Item
                </button>
              </div>

              <div className="flex space-x-4 mt-6">
                <button type="submit" className="btn-primary">
                  Add Meal
                </button>
                <button
                  type="button"
                  onClick={() => setAddMealModal(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Text Modal */}
      {quickTextModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">📄 Quick Add from Extracted Text</h3>
            <p className="text-sm text-gray-600 mb-4">
              Paste your extracted text from OCR or manual entry. The system will automatically parse it into daily meal plans.
            </p>
            
            <form onSubmit={(e) => { e.preventDefault(); handleQuickTextProcess(); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Week Start Date
                  </label>
                  <input
                    type="date"
                    value={quickTextForm.weekStartDate}
                    onChange={(e) => setQuickTextForm({...quickTextForm, weekStartDate: e.target.value})}
                    className="form-input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Extracted Text
                  </label>
                  <textarea
                    value={quickTextForm.extractedText}
                    onChange={(e) => setQuickTextForm({...quickTextForm, extractedText: e.target.value})}
                    placeholder={`Example format:
Sunday:
Breakfast: Idli, Sambar, Coconut Chutney, Tea
Lunch: Rice, Dal, Vegetable Curry, Roti
Snacks: Biscuits, Tea, Fruit
Dinner: Rice, Chicken Curry, Sabji, Roti

Monday:
Breakfast: Dosa, Sambar, Chutney, Coffee
Lunch: Rice, Fish Curry, Dal, Roti
...`}
                    className="form-input w-full h-64 font-mono text-sm"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The system will parse meals for each day and meal type (Breakfast, Lunch, Snacks, Dinner)
                  </p>
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button type="submit" className="btn-primary">
                  📅 Process & Add to Calendar
                </button>
                <button
                  type="button"
                  onClick={() => setQuickTextModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Plan Modal */}
      {viewPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">📋 Weekly Plan Details</h3>
              <button
                onClick={() => setViewPlanModal(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            {/* Plan Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-lg mb-2">{viewPlanModal.title}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Week Period:</span>
                  <p>{new Date(viewPlanModal.weekStartDate).toLocaleDateString()} - {new Date(viewPlanModal.weekEndDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    viewPlanModal.status === 'processed' 
                      ? 'bg-green-100 text-green-800'
                      : viewPlanModal.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {viewPlanModal.status.charAt(0).toUpperCase() + viewPlanModal.status.slice(1)}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created:</span>
                  <p>{new Date(viewPlanModal.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">File:</span>
                  <p>{viewPlanModal.fileName || 'No file'}</p>
                </div>
              </div>
            </div>

            {/* Extracted Text Section */}
            {viewPlanModal.extractedText && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3 flex items-center">
                  📄 Extracted Text
                  {viewPlanModal.isExtracted && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      OCR Processed
                    </span>
                  )}
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                    {viewPlanModal.extractedText}
                  </pre>
                </div>
              </div>
            )}

            {/* Processed Meals Section */}
            {viewPlanModal.status === 'processed' && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3 flex items-center">
                  🍽️ Processed Daily Meals
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    {dailyMeals.filter(meal => {
                      const mealDate = new Date(meal.date);
                      const planStart = new Date(viewPlanModal.weekStartDate);
                      const planEnd = new Date(viewPlanModal.weekEndDate);
                      return mealDate >= planStart && mealDate <= planEnd;
                    }).length} Meals Created
                  </span>
                </h4>
                
                <div className="grid grid-cols-1 lg:grid-cols-7 gap-3">
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, dayIndex) => {
                    const startDate = new Date(viewPlanModal.weekStartDate);
                    const targetDate = new Date(startDate);
                    targetDate.setDate(startDate.getDate() + dayIndex);
                    
                    const dayMeals = dailyMeals.filter(meal => {
                      const mealDate = new Date(meal.date);
                      return mealDate.toDateString() === targetDate.toDateString();
                    });

                    return (
                      <div key={day} className="bg-gray-50 rounded-lg p-3">
                        <h5 className="font-bold text-center mb-2 text-sm text-blue-600">
                          {day}
                          <div className="text-xs text-gray-500 font-normal">
                            {targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </h5>
                        
                        {['Breakfast', 'Lunch', 'Snacks', 'Dinner'].map(mealType => {
                          const meal = dayMeals.find(m => m.mealType === mealType);
                          
                          return (
                            <div key={mealType} className="mb-2">
                              <div className="bg-white rounded p-2 shadow-sm">
                                <h6 className="font-medium text-xs text-gray-700 mb-1">{mealType}</h6>
                                {meal ? (
                                  <div className="space-y-1">
                                    {meal.items.slice(0, 2).map((item, index) => (
                                      <div key={index} className="flex items-center justify-between">
                                        <span className="text-xs text-gray-600">{item.name}</span>
                                        <span className={`w-1 h-1 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                      </div>
                                    ))}
                                    {meal.items.length > 2 && (
                                      <p className="text-xs text-gray-500">+{meal.items.length - 2} more</p>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-400">No menu</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex space-x-3">
                {viewPlanModal.isExtracted && viewPlanModal.status !== 'processed' && (
                  <button
                    onClick={() => {
                      setViewPlanModal(null);
                      handleProcessPlan(viewPlanModal);
                    }}
                    className="btn-primary"
                  >
                    📅 Process into Daily Meals
                  </button>
                )}
                {viewPlanModal.status === 'processed' && (
                  <span className="text-green-600 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Plan Processed Successfully
                  </span>
                )}
              </div>
              <button
                onClick={() => setViewPlanModal(null)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMealPlanning;