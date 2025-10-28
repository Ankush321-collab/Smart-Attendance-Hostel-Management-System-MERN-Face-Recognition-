import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { UserPlus, Mail, Lock, User, BookOpen, Hash, Phone, AlertCircle } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentId: '',
    department: '',
    semester: '',
    phoneNumber: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      studentId: formData.studentId,
      department: formData.department,
      semester: parseInt(formData.semester),
      phoneNumber: formData.phoneNumber,
    });

    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };

  return (
  <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-600 dark:from-gray-900 dark:via-gray-800 dark:to-black relative overflow-hidden transition-all duration-500">
    {/* Animated Background Elements */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-white/5 to-transparent" />
    
    {/* Floating Particles Effect */}
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-white/20 dark:bg-white/10 rounded-full animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 2}s`
          }}
        />
      ))}
    </div>
    
    {/* Theme Toggle */}
    <div className="absolute top-6 right-6 z-50">
      <ThemeToggle />
    </div>
    
    {/* Main Container */}
    <div className="relative z-10 flex items-center justify-center min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl">
        {/* Glass Morphism Card */}
        <div className="group relative">
          {/* Background Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
          
          {/* Main Card */}
          <div className="relative bg-white/10 dark:bg-gray-800/10 backdrop-blur-2xl border border-white/20 dark:border-gray-600/20 rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 hover:shadow-3xl">
            
            {/* Animated Border */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-[2px] rounded-2xl bg-white dark:bg-gray-900" />
            
            {/* Content */}
            <div className="relative p-8 md:p-10">
              {/* Header with 3D Effect */}
              <div className="text-center mb-10 transform transition-all duration-500 group-hover:scale-105">
                <div className="relative inline-block">
                  {/* Icon Container with 3D Lift */}
                  <div className="relative group/icon">
                    <div className="absolute -inset-4 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-full blur-lg opacity-30 group-hover/icon:opacity-50 transition duration-500" />
                    <div className="relative bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-700 p-4 rounded-2xl shadow-2xl transform transition-all duration-500 group-hover/icon:scale-110 group-hover/icon:-translate-y-2 group-hover/icon:rotate-3 border border-white/50 dark:border-gray-600/50">
                      <UserPlus className="h-8 w-8 text-gradient bg-gradient-to-r from-emerald-500 to-cyan-600" />
                    </div>
                  </div>
                  
                  {/* Floating Elements */}
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-cyan-400 rounded-full animate-ping" />
                  <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                </div>
                
                <h2 className="mt-8 text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Create Account
                </h2>
                <p className="mt-3 text-lg text-gray-600 dark:text-gray-300 font-medium">
                  Join our learning community today
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-8 p-4 bg-red-50/80 dark:bg-red-900/30 backdrop-blur-lg border border-red-200 dark:border-red-700 rounded-xl transform transition-all duration-300 hover:scale-[1.02]">
                  <div className="flex items-center gap-3 text-red-800 dark:text-red-200">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                </div>
              )}

              {/* Registration Form */}
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { id: 'name', icon: User, label: 'Full Name *', type: 'text', placeholder: 'John Doe' },
                    { id: 'email', icon: Mail, label: 'Email Address *', type: 'email', placeholder: 'john@example.com' },
                    { id: 'studentId', icon: Hash, label: 'Student ID *', type: 'text', placeholder: 'STU001' },
                    { id: 'phoneNumber', icon: Phone, label: 'Phone Number', type: 'tel', placeholder: '1234567890' },
                    { id: 'department', icon: BookOpen, label: 'Department', type: 'text', placeholder: 'Computer Science' },
                  ].map(({ id, icon: Icon, label, type, placeholder }) => (
                    <div key={id} className="group/input">
                      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 transition-colors duration-200">
                        {label}
                      </label>
                      <div className="relative transform transition-all duration-300 group-hover/input:scale-[1.02]">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-xl blur-sm opacity-0 group-hover/input:opacity-100 transition duration-300" />
                        <div className="relative">
                          <Icon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 transition-colors duration-200 group-hover/input:text-emerald-500" />
                          <input
                            id={id}
                            name={id}
                            type={type}
                            required={label.includes('*')}
                            value={formData[id]}
                            onChange={handleChange}
                            className="w-full pl-12 pr-4 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/50 dark:border-gray-600/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent transition-all duration-300"
                            placeholder={placeholder}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Semester Select */}
                  <div className="group/input">
                    <label htmlFor="semester" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 transition-colors duration-200">
                      Semester
                    </label>
                    <div className="relative transform transition-all duration-300 group-hover/input:scale-[1.02]">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-xl blur-sm opacity-0 group-hover/input:opacity-100 transition duration-300" />
                      <select
                        id="semester"
                        name="semester"
                        value={formData.semester}
                        onChange={handleChange}
                        className="relative w-full px-4 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/50 dark:border-gray-600/50 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent transition-all duration-300 appearance-none"
                      >
                        <option value="">Select Semester</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                          <option key={sem} value={sem}>
                            Semester {sem}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <div className="w-2 h-2 border-r-2 border-b-2 border-gray-400 dark:border-gray-500 transform rotate-45" />
                      </div>
                    </div>
                  </div>

                  {/* Password Fields */}
                  {[
                    { id: 'password', label: 'Password *', placeholder: '••••••••' },
                    { id: 'confirmPassword', label: 'Confirm Password *', placeholder: '••••••••' },
                  ].map(({ id, label, placeholder }) => (
                    <div key={id} className="group/input">
                      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 transition-colors duration-200">
                        {label}
                      </label>
                      <div className="relative transform transition-all duration-300 group-hover/input:scale-[1.02]">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-xl blur-sm opacity-0 group-hover/input:opacity-100 transition duration-300" />
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 transition-colors duration-200 group-hover/input:text-emerald-500" />
                          <input
                            id={id}
                            name={id}
                            type="password"
                            required
                            value={formData[id]}
                            onChange={handleChange}
                            className="w-full pl-12 pr-4 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/50 dark:border-gray-600/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent transition-all duration-300"
                            placeholder={placeholder}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Submit Button */}
                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full py-5 px-6 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 dark:from-emerald-600 dark:to-cyan-700 dark:hover:from-emerald-500 dark:hover:to-cyan-600 rounded-2xl shadow-2xl transform transition-all duration-500 hover:scale-[1.02] hover:shadow-3xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {/* Button Background Animation */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Button Content */}
                    <div className="relative flex items-center justify-center">
                      {loading ? (
                        <>
                          <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin mr-3" />
                          <span className="text-white font-semibold text-lg">Creating Account...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-white font-semibold text-lg mr-3">Create Account</span>
                          <div className="transform transition-transform duration-300 group-hover:translate-x-1">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          </div>
                        </>
                      )}
                    </div>
                  </button>
                </div>

                {/* Login Link */}
                <div className="text-center pt-4">
                  <p className="text-gray-600 dark:text-gray-300 font-medium">
                    Already have an account?{' '}
                    <Link 
                      to="/login" 
                      className="group/link inline-flex items-center gap-2 font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300"
                    >
                      Sign in here
                      <div className="transform transition-transform duration-300 group-hover/link:translate-x-1">
                        →
                      </div>
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default Register;
