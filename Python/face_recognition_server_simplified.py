#!/usr/bin/env python3
"""
Simplified Face Recognition Server for Testing
This version works without dlib/face-recognition for initial setup
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import base64
import io
import json
import logging
import os
import time
from datetime import datetime
from PIL import Image
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all domains

# Configuration
CONFIDENCE_THRESHOLD = 0.6

def base64_to_image(base64_string):
    """Convert base64 string to PIL Image"""
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_string)
        
        # Convert to PIL Image
        pil_image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary
        if pil_image.mode != 'RGB':
            pil_image = pil_image.convert('RGB')
        
        return pil_image
    except Exception as e:
        logger.error(f"Error converting base64 to image: {str(e)}")
        return None

@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "success",
        "message": "Face Recognition Server is running (Simplified Mode)",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0-simplified",
        "note": "This is a simplified version for testing. Install dlib and face-recognition for full functionality."
    })

@app.route('/encode', methods=['POST'])
def encode_face():
    """
    Mock face encoding endpoint for testing
    """
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                "success": False,
                "message": "No image data provided"
            }), 400
        
        student_id = data.get('studentId', 'unknown')
        image_base64 = data['image']
        
        logger.info(f"Processing mock face encoding for student: {student_id}")
        
        # Convert base64 to image to validate it's a valid image
        image = base64_to_image(image_base64)
        if image is None:
            return jsonify({
                "success": False,
                "message": "Invalid image data"
            }), 400
        
        # Generate mock encoding (128-dimensional vector)
        mock_encoding = np.random.rand(128).tolist()
        
        logger.info(f"Successfully generated mock face encoding for student: {student_id}")
        
        return jsonify({
            "success": True,
            "message": "Face encoded successfully (MOCK MODE - Install face-recognition for real encoding)",
            "encoding": mock_encoding,
            "studentId": student_id,
            "spoof_score": 1,  # Mock anti-spoofing score
            "face_location": [50, 200, 250, 100],  # Mock face location
            "timestamp": datetime.now().isoformat(),
            "note": "This is a mock encoding for testing. Install dlib and face-recognition packages for real functionality."
        })
        
    except Exception as e:
        logger.error(f"Error in mock face encoding: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Internal server error during face encoding",
            "error": str(e)
        }), 500

@app.route('/recognize', methods=['POST'])
def recognize_face():
    """
    Mock face recognition endpoint for testing
    This version uses image hash to consistently recognize the same face
    """
    try:
        data = request.get_json()
        
        if not data or 'image' not in data or 'encodings' not in data:
            return jsonify({
                "success": False,
                "message": "Missing image data or face encodings"
            }), 400
        
        image_base64 = data['image']
        stored_encodings = data['encodings']
        
        if not stored_encodings:
            return jsonify({
                "success": False,
                "message": "No enrolled students found for comparison"
            }), 400
        
        logger.info(f"Processing mock face recognition against {len(stored_encodings)} enrolled students")
        
        # Convert base64 to image to validate it's a valid image
        image = base64_to_image(image_base64)
        if image is None:
            return jsonify({
                "success": False,
                "message": "Invalid image data"
            }), 400
        
        # Mock recognition: simulate actual face recognition behavior
        import random
        import hashlib
        
        # Create a hash from the image to simulate consistent recognition for same face
        image_hash = hashlib.md5(image_base64.encode()).hexdigest()
        
        # Use hash to consistently map to same student (simulates real face recognition)
        hash_value = int(image_hash[:8], 16)
        student_index = hash_value % len(stored_encodings)
        recognized_student = stored_encodings[student_index]
        
        # Sometimes fail recognition (simulate real-world behavior)
        recognition_success_rate = 0.85  # 85% success rate
        if random.random() > recognition_success_rate:
            return jsonify({
                "success": False,
                "message": "Face not recognized. Please try again with better lighting.",
                "spoof_score": 1,
                "confidence": round(random.uniform(30, 60), 1)
            }), 404
        
        mock_confidence = random.uniform(75, 95)  # Random confidence between 75-95%
        
        logger.info(f"Mock face recognized: Student {recognized_student['studentId']} with {mock_confidence:.1f}% confidence")
        
        return jsonify({
            "success": True,
            "message": "Face recognized successfully (MOCK MODE - Install face-recognition for real recognition)",
            "studentId": recognized_student['studentId'],
            "confidence": round(mock_confidence, 1),
            "distance": round(random.uniform(0.1, 0.4), 3),
            "spoof_score": 1,
            "face_location": [50, 200, 250, 100],
            "timestamp": datetime.now().isoformat(),
            "note": "This is mock recognition for testing. Install dlib and face-recognition packages for real functionality."
        })
        
    except Exception as e:
        logger.error(f"Error in mock face recognition: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Internal server error during face recognition",
            "error": str(e)
        }), 500

@app.route('/config', methods=['GET'])
def get_config():
    """Get server configuration"""
    return jsonify({
        "confidence_threshold": CONFIDENCE_THRESHOLD,
        "anti_spoof_enabled": False,
        "face_recognition_model": "mock",
        "version": "2.0.0-simplified",
        "mode": "testing",
        "note": "Install dlib and face-recognition packages for full functionality"
    })

@app.route('/install-instructions', methods=['GET'])
def install_instructions():
    """Get installation instructions for full functionality"""
    return jsonify({
        "message": "Installation Instructions for Full Face Recognition",
        "steps": [
            "1. Install Visual Studio Build Tools or Visual Studio Community",
            "2. Install CMake from https://cmake.org/download/",
            "3. Add CMake to your system PATH",
            "4. Restart your terminal/command prompt",
            "5. Run: pip install cmake",
            "6. Run: pip install dlib",
            "7. Run: pip install face-recognition",
            "8. Replace this simplified server with the full version"
        ],
        "cmake_download": "https://cmake.org/download/",
        "vs_build_tools": "https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022"
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "success": False,
        "message": "Endpoint not found"
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        "success": False,
        "message": "Internal server error"
    }), 500

if __name__ == "__main__":
    logger.info("🚀 Starting Simplified Face Recognition Server (Testing Mode)...")
    logger.info("📡 Server will be available at: http://localhost:8085")
    logger.info("⚠️  This is a simplified version for testing")
    logger.info("🔧 For full functionality, install: dlib, face-recognition packages")
    logger.info("📋 Visit http://localhost:8085/install-instructions for setup help")
    
    app.run(
        host="0.0.0.0", 
        port=8085, 
        debug=True,
        threaded=True
    )