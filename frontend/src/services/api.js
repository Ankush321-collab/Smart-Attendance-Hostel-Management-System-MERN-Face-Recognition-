import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/updateprofile', data),
};

// Attendance API
export const attendanceAPI = {
  markAttendance: (data) => api.post('/attendance/mark', data),
  getAllAttendance: (params) => api.get('/attendance', { params }),
  getStudentAttendance: (studentId) => api.get(`/attendance/student/${studentId}`),
  getMyAttendance: () => api.get('/attendance/my'),
  exportCSV: (params) => api.get('/attendance/export', { 
    params,
    responseType: 'blob'
  }),
  deleteAttendance: (id) => api.delete(`/attendance/${id}`),
};

// Face Recognition API
export const faceAPI = {
  enrollFace: (formData) => {
    return api.post('/face/enroll', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  recognizeFace: (formData) => {
    return api.post('/face/recognize', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getFaceStatus: () => api.get('/face/status'),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getAllStudents: (params) => api.get('/admin/students', { params }),
  getStudent: (id) => api.get(`/admin/student/${id}`),
  updateStudent: (id, data) => api.put(`/admin/student/${id}`, data),
  deleteStudent: (id) => api.delete(`/admin/student/${id}`),
  getRooms: () => api.get('/admin/rooms'),
};

// Hostel API
export const hostelAPI = {
  getRooms: (params) => api.get('/hostel/rooms', { params }),
  createRoom: (data) => api.post('/hostel/rooms', data),
  updateRoom: (id, data) => api.put(`/hostel/rooms/${id}`, data),
  assignStudent: (roomId, studentId) => api.post(`/hostel/rooms/${roomId}/assign`, { studentId }),
  removeStudent: (roomId, studentId) => api.delete(`/hostel/rooms/${roomId}/remove/${studentId}`),
  getOverview: () => api.get('/hostel/overview'),
  getUnassignedStudents: () => api.get('/hostel/students/unassigned'),
};

// Visitor Management API
export const visitorAPI = {
  getAll: (params) => api.get('/visitors', { params }),
  getStats: () => api.get('/visitors/stats'),
  getById: (id) => api.get(`/visitors/${id}`),
  checkIn: (data) => api.post('/visitors/checkin', data),
  checkOut: (id, data) => api.put(`/visitors/${id}/checkout`, data),
  update: (id, data) => api.put(`/visitors/${id}`, data),
  delete: (id) => api.delete(`/visitors/${id}`)
};

// Maintenance Management API
export const maintenanceAPI = {
  getAll: (params) => api.get('/maintenance', { params }),
  getStats: () => api.get('/maintenance/stats'),
  getById: (id) => api.get(`/maintenance/${id}`),
  create: (data) => api.post('/maintenance', data),
  update: (id, data) => api.put(`/maintenance/${id}`, data),
  delete: (id) => api.delete(`/maintenance/${id}`)
};

// Meal Management API
export const mealAPI = {
  // Weekly meal plans (Admin only)
  uploadWeeklyPlan: (formData) => api.post('/meals/weekly/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getWeeklyPlans: (params) => api.get('/meals/weekly', { params }),
  processWeeklyPlan: (id, data) => api.post(`/meals/weekly/${id}/process`, data),
  
  // Daily meal plans
  getPlans: (params) => api.get('/meals', { params }),
  getStats: () => api.get('/meals/stats'),
  createPlan: (data) => api.post('/meals/create', data),
  // OCR extraction for uploaded file
  extractText: (formData) => api.post('/meals/ocr-extract', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  create: (data) => api.post('/meals', data),
  update: (id, data) => api.put(`/meals/${id}`, data),
  delete: (id) => api.delete(`/meals/${id}`),
  updateStatus: (id, status) => api.put(`/meals/${id}/status`, { status }),
  
  // Feedback and complaints
  submitFeedback: (id, data) => api.post(`/meals/${id}/feedback`, data),
  getFeedback: (params) => api.get('/meals/feedback', { params }),
  resolveFeedback: (id, data) => api.put(`/meals/feedback/${id}/resolve`, data),
  getMyFeedback: () => api.get('/meals/my-feedback'),
  getMyStats: () => api.get('/meals/my-stats')
};

export default api;
