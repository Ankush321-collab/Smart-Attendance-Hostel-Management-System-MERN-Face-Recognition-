import React, { useState } from 'react';
import { CheckCircle, Clock } from 'lucide-react';

const TestRecognitionDisplay = () => {
  // Test data with the format your backend returns
  const [testRecognitionResult] = useState({
    name: 'Ankush',
    studentId: 'AP23110011672',
    department: 'CSE',
    confidence: 98.2,
    spoof_score: 1,
    email: 'ankush@example.com'
  });

  const [showTest, setShowTest] = useState(false);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Face Recognition Display Test
        </h1>
        <button
          onClick={() => setShowTest(!showTest)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showTest ? 'Hide Test' : 'Show Test Recognition Result'}
        </button>
      </div>

      {showTest && (
        <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-3">
                <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                <h3 className="text-lg font-bold text-green-800">Face Recognized:</h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-xl font-bold text-gray-900">
                    {testRecognitionResult.name}
                  </span>
                  <span className="ml-2 px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-full">
                    {testRecognitionResult.studentId}
                  </span>
                </div>
                
                <div className="flex items-center text-gray-700">
                  <span className="font-medium mr-2">Department:</span>
                  <span className="text-lg">{testRecognitionResult.department || 'Not specified'}</span>
                </div>
                
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 mr-2">Confidence:</span>
                  <div className="flex items-center">
                    <span className="text-lg font-bold text-green-600">
                      {typeof testRecognitionResult.confidence === 'number' 
                        ? `${testRecognitionResult.confidence.toFixed(1)}%` 
                        : `${parseFloat(testRecognitionResult.confidence || 0).toFixed(1)}%`}
                    </span>
                    {(parseFloat(testRecognitionResult.confidence || 0) >= 90) && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        High Confidence
                      </span>
                    )}
                  </div>
                </div>
                
                {testRecognitionResult.spoof_score && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Security Score:</span> {testRecognitionResult.spoof_score}
                  </div>
                )}
              </div>
            </div>
            
            <div className="ml-6 text-center">
              <div className="text-green-500 mb-2">
                <CheckCircle className="h-12 w-12 mx-auto" />
              </div>
              <div className="text-sm font-medium text-gray-700">Verified</div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-green-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <Clock className="h-4 w-4 inline mr-1" />
                Recognition Time: {new Date().toLocaleTimeString()}
              </div>
              <div className="text-sm text-green-700 font-medium">
                Ready to mark attendance
              </div>
            </div>
          </div>
        </div>
      )}

      {showTest && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-bold text-gray-900 mb-2">Test Data Format:</h3>
          <pre className="text-sm text-gray-600 bg-white p-3 rounded border overflow-x-auto">
            {JSON.stringify(testRecognitionResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TestRecognitionDisplay;