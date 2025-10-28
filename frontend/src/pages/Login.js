import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

    const { login } = useAuth();
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
    setLoading(true);

    const result = await login(formData.email, formData.password);

    setLoading(false);

    if (result.success) {
      // Navigate based on user role
      if (result.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.message);
    }
  };

  return (
  <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-blue-700 dark:from-gray-900 dark:via-gray-800 dark:to-black relative overflow-hidden transition-all duration-700">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-purple-500/20 to-pink-500/20 dark:from-blue-600/10 dark:via-purple-600/10 dark:to-pink-600/10 animate-gradient-x" />
    
    {/* Floating Particles */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${15 + Math.random() * 10}s`
          }}
        />
      ))}
    </div>
    
    {/* Theme Toggle */}
    <div className="absolute top-6 right-6 z-50">
      <ThemeToggle />
    </div>
    
    {/* Main Card */}
    <div className="relative min-h-screen flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full transform transition-all duration-700">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:animate-gradient-xy group-hover:scale-105" />
        
        <div className="relative bg-white/20 dark:bg-gray-900/20 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 hover:shadow-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          
          <div className="p-8 space-y-8">
            {/* Header */}
            <div className="text-center transform transition-all duration-500 group-hover:translate-y-[-8px]">
              <div className="relative inline-block">
                <div className="relative mx-auto w-20 h-20 bg-white/20 dark:bg-gray-800/20 backdrop-blur-md rounded-2xl border border-white/30 dark:border-gray-700/30 flex items-center justify-center transform transition-all duration-500 hover:scale-110 hover:rotate-6 group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl" />
                  <LogIn className="h-10 w-10 text-white dark:text-gray-200 transform transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-75" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
                </div>
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 transform rotate-45 transition-all duration-500 delay-300" />
                <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-pink-400 rounded-full opacity-0 group-hover:opacity-100 transform -rotate-45 transition-all duration-500 delay-500" />
              </div>
              
              <h2 className="mt-6 text-4xl font-bold bg-gradient-to-r from-white to-gray-200 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent transform transition-all duration-500 hover:scale-105">
                Welcome Back
              </h2>
              <p className="mt-3 text-white/80 dark:text-gray-300/80 font-light tracking-wide transform transition-all duration-500 delay-100">
                Smart Attendance & Hostel Management System
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="animate-slide-in bg-red-500/20 dark:bg-red-900/30 border border-red-400/50 dark:border-red-600/50 text-red-800 dark:text-red-200 px-4 py-3 rounded-xl flex items-center gap-3 backdrop-blur-sm transform transition-all duration-300 hover:scale-[1.02]">
                <AlertCircle className="h-5 w-5 flex-shrink-0 animate-pulse" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
                {/* Email Input */}
                <div className="group">
                  <label htmlFor="email" className="block text-sm font-semibold text-white/90 dark:text-gray-200/90 mb-3 transition-colors duration-300">
                    Email Address
                  </label>
                  <div className="relative transform transition-all duration-500 group-hover:scale-[1.02]">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                    <div className="relative flex items-center">
                      <Mail className="absolute left-4 h-5 w-5 text-white/60 dark:text-gray-400/60 transform transition-transform duration-300 group-hover:scale-110 group-hover:text-white/80 z-10" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="relative w-full pl-12 pr-4 py-4 bg-white/10 dark:bg-gray-800/10 backdrop-blur-md border border-white/20 dark:border-gray-700/20 rounded-xl text-white dark:text-gray-200 placeholder-white/50 dark:placeholder-gray-400/50 focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-300"
                        placeholder="student@example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Password Input */}
                <div className="group">
                  <label htmlFor="password" className="block text-sm font-semibold text-white/90 dark:text-gray-200/90 mb-3 transition-colors duration-300">
                    Password
                  </label>
                  <div className="relative transform transition-all duration-500 group-hover:scale-[1.02]">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                    <div className="relative flex items-center">
                      <Lock className="absolute left-4 h-5 w-5 text-white/60 dark:text-gray-400/60 transform transition-transform duration-300 group-hover:scale-110 group-hover:text-white/80 z-10" />
                      <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="relative w-full pl-12 pr-4 py-4 bg-white/10 dark:bg-gray-800/10 backdrop-blur-md border border-white/20 dark:border-gray-700/20 rounded-xl text-white dark:text-gray-200 placeholder-white/50 dark:placeholder-gray-400/50 focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-300"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="relative w-full group overflow-hidden rounded-xl transform transition-all duration-700 hover:scale-[1.02] active:scale-95 disabled:transform-none"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 group-hover:from-blue-500 group-hover:via-purple-500 group-hover:to-pink-500 transition-all duration-500" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 overflow-hidden rounded-xl">
                  <div className="absolute -inset-y-full -left-20 w-20 transform skew-x-[-30deg] bg-white/20 group-hover:animate-shine transition-all duration-1000" />
                </div>
                <div className="relative py-4 px-6 flex items-center justify-center">
                  {loading ? (
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="text-white font-semibold">Signing In...</span>
                    </div>
                  ) : (
                    <>
                      <span className="text-white font-semibold text-lg tracking-wide transform transition-transform duration-300 group-hover:translate-x-1">
                        Sign In
                      </span>
                      <LogIn className="ml-2 h-5 w-5 text-white transform transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-110" />
                    </>
                  )}
                </div>
                <div className="absolute inset-0 overflow-hidden rounded-xl">
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                </div>
              </button>

              {/* Register Link */}
              <div className="text-center pt-4">
                <p className="text-white/70 dark:text-gray-300/70 text-sm transition-colors duration-300">
                  Don't have an account?{' '}
                  <Link 
                    to="/register" 
                    className="font-semibold text-white dark:text-gray-200 hover:text-white/90 dark:hover:text-gray-300 underline-offset-4 hover:underline transition-all duration-300 transform hover:scale-105 inline-block"
                  >
                    Register here
                  </Link>
                </p>
              </div>
            </form>

            {/* Demo Credentials */}
            <div className="pt-6">
              <div className="bg-white/10 dark:bg-gray-800/10 backdrop-blur-md border border-white/20 dark:border-gray-700/20 rounded-xl p-4 transform transition-all duration-500 hover:scale-[1.02] group">
                <p className="text-xs font-semibold text-white/90 dark:text-gray-200/90 mb-2 transition-colors duration-300">
                  Demo Credentials:
                </p>
                <p className="text-xs text-white/70 dark:text-gray-300/70 transition-colors duration-300">
                  Admin: admin@hostel.com / admin123
                </p>
                <p className="text-xs text-white/70 dark:text-gray-300/70 transition-colors duration-300">
                  Student: Register new account
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default Login;
