import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Webcam from 'react-webcam';
import { Camera, Upload, CheckCircle, AlertCircle } from 'lucide-react';

const FaceEnrollment = () => {
  const { user } = useAuth();
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showWebcam, setShowWebcam] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);

  // Check enrollment status on component mount
  React.useEffect(() => {
    checkEnrollmentStatus();
  }, []);

  const checkEnrollmentStatus = async () => {
    try {
      const response = await api.get('/face/status');
      setEnrollmentStatus(response.data.data);
    } catch (error) {
      console.error('Status check error:', error);
    }
  };

  const captureImage = useCallback(async () => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setError('Failed to capture image. Please try again.');
      return;
    }

    await enrollFace(imageSrc);
  }, [enrollFace]);

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
      await enrollFace(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const enrollFace = async (imageData) => {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      // Convert base64 to blob for FormData
      const response = await fetch(imageData);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('image', blob, 'face-image.jpg');

      const enrollResponse = await api.post('/face/enroll', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (enrollResponse.data.success) {
        setMessage('Face enrolled successfully! You can now use face recognition for attendance.');
        setShowWebcam(false);
        await checkEnrollmentStatus(); // Refresh status
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      setError(
        error.response?.data?.message || 
        'Face enrollment failed. Please ensure your face is clearly visible and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Face Enrollment</h1>
            <p className="mt-2 text-lg text-gray-600">
              Enroll your face for secure attendance marking
            </p>
          </div>

          {/* Enrollment Status */}
          {enrollmentStatus && (
            <div className="mb-6">
              <div className={`p-4 rounded-lg border ${
                enrollmentStatus.isFaceEnrolled 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center">
                  {enrollmentStatus.isFaceEnrolled ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                      <span className="text-green-800 font-medium">
                        Face already enrolled! 
                        {enrollmentStatus.enrollmentDate && (
                          <span className="text-green-600 ml-1">
                            (Enrolled on {new Date(enrollmentStatus.enrollmentDate).toLocaleDateString()})
                          </span>
                        )}
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
                      <span className="text-yellow-800 font-medium">
                        Face not enrolled. Please enroll your face to use attendance features.
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {message && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {message}
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-8">
              {!showWebcam ? (
                <div className="text-center">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Camera Option */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 transition-colors">
                      <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Use Camera</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Capture your photo using your device's camera
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
                        Upload a clear photo of your face (JPG, PNG)
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
                          Processing...
                        </>
                      ) : (
                        <>
                          <Camera className="h-4 w-4 mr-2" />
                          Capture & Enroll
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
              Enrollment Guidelines
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start">
                <span className="flex-shrink-0 h-5 w-5 text-blue-500 mr-2">•</span>
                Ensure your face is well-lit and clearly visible
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-5 w-5 text-blue-500 mr-2">•</span>
                Look directly at the camera with a neutral expression
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-5 w-5 text-blue-500 mr-2">•</span>
                Remove glasses, hats, or anything covering your face
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-5 w-5 text-blue-500 mr-2">•</span>
                Only one face should be visible in the image
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-5 w-5 text-blue-500 mr-2">•</span>
                Image size should be less than 5MB
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceEnrollment;