import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Webcam from 'react-webcam';
import { Camera, Upload, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const MarkAttendance = () => {
  const { user } = useAuth();
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showWebcam, setShowWebcam] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState(null);
  const [attendanceMarked, setAttendanceMarked] = useState(false);

  const captureImage = useCallback(async () => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setError('Failed to capture image. Please try again.');
      return;
    }

    await recognizeAndMarkAttendance(imageSrc);
  }, [webcamRef]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB.');
      return;
    }

    // Convert to base64
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

      // Convert base64 to blob for FormData
      const response = await fetch(imageData);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('image', blob, 'attendance-image.jpg');

      // Step 1: Recognize face
      const recognizeResponse = await api.post('/face/recognize', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (recognizeResponse.data.success) {
        const studentData = recognizeResponse.data.data;
        setRecognitionResult(studentData);

        // Step 2: Mark attendance
        const attendanceResponse = await api.post('/attendance/mark', {
          studentId: studentData.studentId,
          method: 'face',
          confidence: studentData.confidence,
          location: 'Main Entrance'
        });

        if (attendanceResponse.data.success) {
          setAttendanceMarked(true);
          setMessage(`Attendance marked successfully for ${studentData.name}!`);
          setShowWebcam(false);
        }
      }
    } catch (error) {
      console.error('Recognition/Attendance error:', error);
      
      if (error.response?.status === 404) {
        setError('Face not recognized. Please ensure you are enrolled and your face is clearly visible.');
      } else if (error.response?.status === 400 && error.response?.data?.message?.includes('already marked')) {
        setError('Attendance already marked for today!');
      } else {
        setError(
          error.response?.data?.message || 
          'Failed to mark attendance. Please try again.'
        );
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
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Mark Attendance</h1>
            <p className="mt-2 text-lg text-gray-600">
              Use face recognition to mark your attendance
            </p>
            <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-2" />
              Current time: {new Date().toLocaleString()}
            </div>
          </div>

          {/* Messages */}
          {message && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              {message}
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {/* Recognition Result */}
          {recognitionResult && !attendanceMarked && (
            <div className="mb-6 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Face Recognized:</p>
                  <p className="text-sm">
                    {recognitionResult.name} ({recognitionResult.studentId})
                  </p>
                  <p className="text-sm">
                    Department: {recognitionResult.department}
                  </p>
                  <p className="text-sm">
                    Confidence: {recognitionResult.confidence}%
                  </p>
                </div>
                <div className="text-blue-600">
                  <CheckCircle className="h-8 w-8" />
                </div>
              </div>
            </div>
          )}

          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-8">
              {!showWebcam ? (
                <div className="text-center">
                  {attendanceMarked ? (
                    <div className="py-8">
                      <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                      <h3 className="text-xl font-medium text-gray-900 mb-2">
                        Attendance Marked Successfully!
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Your attendance has been recorded for today.
                      </p>
                      <button
                        onClick={resetForm}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Mark Another Attendance
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Camera Option */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 transition-colors">
                        <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Use Camera</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Capture your photo for face recognition
                        </p>
                        <button
                          onClick={() => setShowWebcam(true)}
                          disabled={loading}
                          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Open Camera
                        </button>
                      </div>

                      {/* Upload Option */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 transition-colors">
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Photo</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Upload a clear photo for recognition
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
                          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Choose File
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Position your face in the camera
                  </h3>
                  
                  <div className="relative inline-block mb-6">
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      width={400}
                      height={300}
                      className="rounded-lg border"
                    />
                    <div className="absolute inset-0 border-4 border-blue-400 rounded-lg pointer-events-none opacity-50"></div>
                  </div>

                  <div className="space-x-4">
                    <button
                      onClick={captureImage}
                      disabled={loading}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Recognizing...
                        </>
                      ) : (
                        <>
                          <Camera className="h-4 w-4 mr-2" />
                          Capture & Mark Attendance
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => setShowWebcam(false)}
                      disabled={loading}
                      className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-3">
              Attendance Guidelines
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start">
                <span className="flex-shrink-0 h-5 w-5 text-blue-500 mr-2">•</span>
                Ensure you have enrolled your face before marking attendance
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-5 w-5 text-blue-500 mr-2">•</span>
                Make sure your face is well-lit and clearly visible
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-5 w-5 text-blue-500 mr-2">•</span>
                Look directly at the camera with a neutral expression
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-5 w-5 text-blue-500 mr-2">•</span>
                Attendance can only be marked once per day
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-5 w-5 text-blue-500 mr-2">•</span>
                If recognition fails, try adjusting lighting or camera angle
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendance;