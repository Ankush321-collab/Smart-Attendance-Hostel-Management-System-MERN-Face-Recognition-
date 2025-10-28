import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Webcam from 'react-webcam';
import { Camera, Upload, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const MarkAttendance = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showWebcam, setShowWebcam] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState(null);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [autoCapturing, setAutoCapturing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-capture functionality
  useEffect(() => {
    let interval;
    if (showWebcam && !loading && !attendanceMarked && !recognitionResult && !isProcessing) {
      if (autoCapturing && countdown > 0) {
        interval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              setAutoCapturing(false);
              captureImage();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else if (!autoCapturing && !isProcessing) {
        const startTimer = setTimeout(() => {
          setAutoCapturing(true);
          setCountdown(3);
        }, 2000);
        return () => clearTimeout(startTimer);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showWebcam, loading, attendanceMarked, recognitionResult, autoCapturing, countdown, isProcessing]);

  const captureImage = useCallback(async () => {
    if (!webcamRef.current || isProcessing) return;

    setIsProcessing(true);
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setError('Failed to capture image. Please try again.');
      setIsProcessing(false);
      return;
    }

    await recognizeAndMarkAttendance(imageSrc);
    setIsProcessing(false);
  }, [webcamRef, isProcessing]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      await recognizeAndMarkAttendance(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const recognizeAndMarkAttendance = async (imageData) => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      setRecognitionResult(null);

      const response = await fetch(imageData);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('image', blob, 'attendance-image.jpg');

      const recognizeResponse = await api.post('/face/recognize', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (recognizeResponse.data.success) {
        const studentData = recognizeResponse.data.data;
        setRecognitionResult(studentData);

        const attendanceResponse = await api.post('/attendance/mark', {
          studentId: studentData.studentId,
          method: 'face',
          confidence: studentData.confidence,
          location: 'Main Entrance'
        });

        if (attendanceResponse.data.success) {
          setAttendanceMarked(true);
          setMessage(
            `Attendance marked successfully for ${studentData.name} (${studentData.studentId})! ` +
            `Department: ${studentData.department || 'Not specified'} | ` +
            `Confidence: ${typeof studentData.confidence === 'number' 
              ? studentData.confidence.toFixed(1) 
              : parseFloat(studentData.confidence || 0).toFixed(1)}%`
          );
          setShowWebcam(false);
        }
      }
    } catch (error) {
      console.error('Recognition/Attendance error:', error);
      
      if (error.response?.status === 404) {
        setError('Face not recognized. Please ensure you are enrolled and your face is clearly visible. Auto-retry in 3 seconds...');
        setRecognitionResult(null);
        
        setTimeout(() => {
          if (showWebcam && !attendanceMarked) {
            setError('');
            setAutoCapturing(true);
            setCountdown(3);
          }
        }, 3000);
        
      } else if (error.response?.status === 400 && error.response?.data?.message?.includes('already marked')) {
        setError('Attendance already marked for today!');
      } else {
        setError(
          error.response?.data?.message || 
          'Failed to mark attendance. Please try again.'
        );
        setRecognitionResult(null);
        
        setTimeout(() => {
          if (showWebcam && !attendanceMarked) {
            setError('');
            setAutoCapturing(true);
            setCountdown(3);
          }
        }, 5000);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMessage('');
    setError('');
    setRecognitionResult(null);
    setAttendanceMarked(false);
    setShowWebcam(false);
    setAutoCapturing(false);
    setCountdown(0);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 lg:p-12 border border-gray-200 dark:border-gray-700">
            <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              Mark Attendance
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 font-medium mb-8 max-w-3xl mx-auto leading-relaxed">
              Use advanced face recognition technology to mark your attendance securely
            </p>
            <div className="inline-flex items-center gap-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl px-6 py-4 border border-blue-200 dark:border-blue-800">
              <Clock className="h-6 w-6 text-blue-600" />
              <span className="text-gray-800 dark:text-gray-200 font-bold text-lg">
                {new Date().toLocaleString('en-US', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-8">
            <div className="bg-green-50 dark:bg-green-900/20 backdrop-blur-xl rounded-2xl border border-green-200 dark:border-green-800 p-6 shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-green-900 dark:text-green-100 mb-2">Success!</h3>
                  <p className="text-green-800 dark:text-green-200 font-medium">{message}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-8">
            <div className="bg-red-50 dark:bg-red-900/20 backdrop-blur-xl rounded-2xl border border-red-200 dark:border-red-800 p-6 shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">Attention Required</h3>
                  <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recognition Result */}
        {recognitionResult && !attendanceMarked && (
          <div className="mb-8">
            <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 backdrop-blur-2xl rounded-2xl border-2 border-green-300 dark:border-green-600 p-6 lg:p-8 shadow-xl">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center mb-6">
                    <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg mr-4">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                      Face Recognized
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white bg-white/50 dark:bg-gray-800/50 px-4 py-2 rounded-xl shadow">
                        {recognitionResult.name}
                      </span>
                      <span className="px-4 py-2 text-base font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-xl">
                        {recognitionResult.studentId}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-lg">
                      <span className="font-bold text-gray-700 dark:text-gray-300 mr-3">Department:</span>
                      <span className="text-xl font-bold text-gray-900 dark:text-white bg-white/50 dark:bg-gray-800/50 px-3 py-1 rounded-lg">
                        {recognitionResult.department || 'Not specified'}
                      </span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                      <div className="flex items-center">
                        <span className="font-bold text-gray-700 dark:text-gray-300 mr-3 text-lg">Confidence:</span>
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-xl border border-green-300 dark:border-green-700">
                            {typeof recognitionResult.confidence === 'number' 
                              ? `${recognitionResult.confidence.toFixed(1)}%` 
                              : `${parseFloat(recognitionResult.confidence || 0).toFixed(1)}%`}
                          </span>
                          {(parseFloat(recognitionResult.confidence || 0) >= 90) && (
                            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700 rounded-xl text-sm font-bold">
                              High Confidence
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg mb-3">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-base font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-xl border border-green-300 dark:border-green-700">
                    Verified Identity
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl p-6 lg:p-8">
            {!showWebcam ? (
              <div className="text-center">
                {attendanceMarked ? (
                  <div className="py-12 lg:py-16">
                    <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center shadow-xl mx-auto mb-6">
                      <CheckCircle className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-6">
                      Attendance Marked!
                    </h3>
                    
                    {recognitionResult && (
                      <div className="mb-8 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl max-w-md mx-auto">
                        <div className="text-center space-y-3">
                          <div className="text-xl font-bold text-gray-900 dark:text-white">
                            {recognitionResult.name}
                          </div>
                          <div className="text-gray-700 dark:text-gray-300 font-bold">
                            Student ID: {recognitionResult.studentId}
                          </div>
                          <div className="text-gray-700 dark:text-gray-300 font-bold">
                            Department: {recognitionResult.department || 'Not specified'}
                          </div>
                          <div className="text-green-600 font-bold">
                            Confidence: {typeof recognitionResult.confidence === 'number' 
                              ? `${recognitionResult.confidence.toFixed(1)}%` 
                              : `${parseFloat(recognitionResult.confidence || 0).toFixed(1)}%`}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                      Your attendance has been successfully recorded for today.
                    </p>
                    <button
                      onClick={resetForm}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-shadow"
                    >
                      Mark Another Attendance
                    </button>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-8">Choose Recognition Method</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                      {/* Camera Option */}
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-6 lg:p-8 hover:border-blue-500 dark:hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-700/50">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
                          <Camera className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Use Camera</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                          Capture your photo for real-time face recognition with AI technology
                        </p>
                        <button
                          onClick={() => setShowWebcam(true)}
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Camera className="h-5 w-5 mr-2 inline" />
                          Open Camera
                        </button>
                      </div>

                      {/* Upload Option */}
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-6 lg:p-8 hover:border-green-500 dark:hover:border-green-500 transition-colors bg-gray-50 dark:bg-gray-700/50">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
                          <Upload className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Upload Photo</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                          Upload a clear, high-quality photo for accurate facial recognition
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-green-600 to-yellow-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Upload className="h-5 w-5 mr-2 inline" />
                          Choose File
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  {autoCapturing 
                    ? `Auto-capturing in ${countdown} seconds...` 
                    : 'Position your face in the camera'
                  }
                </h3>
                
                <div className="relative inline-block mb-8">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    width={480}
                    height={360}
                    className="rounded-2xl border-4 border-blue-300 shadow-xl"
                  />
                  
                  {autoCapturing && (
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-yellow-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center shadow-lg">
                      <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                      {countdown}
                    </div>
                  )}
                  
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl text-center shadow-xl">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">Processing...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Messages */}
                <div className="space-y-3 mb-8">
                  {!autoCapturing && !isProcessing && !recognitionResult && (
                    <p className="text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 rounded-xl inline-block font-bold border border-blue-200 dark:border-blue-800">
                      Auto-capture will start in a moment...
                    </p>
                  )}
                  
                  {autoCapturing && (
                    <p className="text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3 rounded-xl font-bold inline-block border border-yellow-200 dark:border-yellow-800">
                      Get ready! Auto-capturing in {countdown} seconds
                    </p>
                  )}
                  
                  {isProcessing && (
                    <p className="text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 rounded-xl font-bold inline-block border border-blue-200 dark:border-blue-800">
                      Recognizing face and marking attendance...
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={captureImage}
                    disabled={loading || isProcessing || autoCapturing}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading || isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2 inline-block"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Camera className="h-5 w-5 mr-2 inline" />
                        Manual Capture
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setShowWebcam(false)}
                    disabled={loading || isProcessing}
                    className="border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-8 py-4 rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 hover:shadow-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-6 lg:p-8 shadow-lg">
            <h3 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              Auto-Attendance Guidelines
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                "Ensure you have enrolled your face before marking attendance",
                "Make sure your face is well-lit and clearly visible",
                "Look directly at the camera and stay still during auto-capture",
                "Auto-capture will start automatically after opening camera",
                "You can also use manual capture if needed",
                "Attendance can only be marked once per day"
              ].map((guideline, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-xs">{index + 1}</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">{guideline}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendance;