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

export default api;
