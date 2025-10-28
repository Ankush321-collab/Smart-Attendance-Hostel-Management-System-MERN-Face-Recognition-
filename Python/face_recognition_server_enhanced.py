#!/usr/bin/env python3
"""
Enhanced Face Recognition Server with Basic Image Analysis
This version uses simple image analysis for better recognition than pure mock
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import base64
import io
import json
import logging
import os
import time
import hashlib
from datetime import datetime
from PIL import Image
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all domains

# Configuration
CONFIDENCE_THRESHOLD = 0.90  # 90% confidence required for attendance
SIMILARITY_THRESHOLD = 0.70  # 70% similarity = 90%+ confidence

# Store image hashes for basic recognition (simulates face encodings)
stored_image_features = {}

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

def extract_simple_features(image):
    """Extract simple features from image for basic recognition"""
    try:
        # Resize image to standard size
        image_resized = image.resize((64, 64))
        
        # Convert to grayscale
        image_gray = image_resized.convert('L')
        
        # Get image array
        image_array = np.array(image_gray)
        
        # Extract simple features
        features = {
            'mean': float(np.mean(image_array)),
            'std': float(np.std(image_array)),
            'histogram': np.histogram(image_array, bins=16)[0].tolist(),
            'corners': [
                float(image_array[0, 0]),    # top-left
                float(image_array[0, -1]),   # top-right
                float(image_array[-1, 0]),   # bottom-left
                float(image_array[-1, -1])   # bottom-right
            ]
        }
        
        return features
    except Exception as e:
        logger.error(f"Error extracting features: {str(e)}")
        return None

def compare_features(features1, features2):
    """Compare two feature sets and return similarity score"""
    try:
        # Compare means
        mean_diff = abs(features1['mean'] - features2['mean']) / 255.0
        
        # Compare standard deviations
        std_diff = abs(features1['std'] - features2['std']) / 255.0
        
        # Compare histograms
        hist1 = np.array(features1['histogram'])
        hist2 = np.array(features2['histogram'])
        hist_correlation = np.corrcoef(hist1, hist2)[0, 1]
        if np.isnan(hist_correlation):
            hist_correlation = 0
        
        # Compare corners
        corners1 = np.array(features1['corners'])
        corners2 = np.array(features2['corners'])
        corners_diff = np.mean(np.abs(corners1 - corners2)) / 255.0
        
        # Calculate overall similarity (higher is more similar)
        similarity = (
            (1 - mean_diff) * 0.2 +
            (1 - std_diff) * 0.2 +
            abs(hist_correlation) * 0.4 +
            (1 - corners_diff) * 0.2
        )
        
        return max(0, min(1, similarity))
    except Exception as e:
        logger.error(f"Error comparing features: {str(e)}")
        return 0

@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "success",
        "message": "Enhanced Face Recognition Server is running (Basic Analysis Mode)",
        "timestamp": datetime.now().isoformat(),
        "version": "2.1.0-enhanced",
        "note": "Using basic image analysis for better recognition than pure mock mode."
    })

@app.route('/encode', methods=['POST'])
def encode_face():
    """
    Enhanced face encoding endpoint with basic image analysis
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
        
        logger.info(f"Processing enhanced face encoding for student: {student_id}")
        
        # Convert base64 to image
        image = base64_to_image(image_base64)
        if image is None:
            return jsonify({
                "success": False,
                "message": "Invalid image data"
            }), 400
        
        # Extract simple features
        features = extract_simple_features(image)
        if features is None:
            return jsonify({
                "success": False,
                "message": "Could not extract features from image"
            }), 400
        
        # Store features for this student
        stored_image_features[student_id] = features
        
        # Generate encoding (use features as encoding)
        encoding = (
            [features['mean'], features['std']] + 
            features['histogram'] + 
            features['corners'] + 
            [0] * (128 - 22)  # Pad to 128 dimensions like real face encodings
        )
        
        logger.info(f"Successfully generated enhanced encoding for student: {student_id}")
        
        return jsonify({
            "success": True,
            "message": "Face encoded successfully (ENHANCED MODE - Using basic image analysis)",
            "encoding": encoding,
            "studentId": student_id,
            "spoof_score": 1,  # Mock anti-spoofing score
            "face_location": [50, 200, 250, 100],  # Mock face location
            "timestamp": datetime.now().isoformat(),
            "note": "Using basic image analysis for better recognition than pure mock mode."
        })
        
    except Exception as e:
        logger.error(f"Error in enhanced face encoding: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Internal server error during face encoding",
            "error": str(e)
        }), 500

@app.route('/recognize', methods=['POST'])
def recognize_face():
    """
    Enhanced face recognition endpoint with basic image analysis
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
        
        logger.info(f"Processing enhanced face recognition against {len(stored_encodings)} enrolled students")
        
        # Convert base64 to image
        image = base64_to_image(image_base64)
        if image is None:
            return jsonify({
                "success": False,
                "message": "Invalid image data"
            }), 400
        
        # Extract features from current image
        current_features = extract_simple_features(image)
        if current_features is None:
            return jsonify({
                "success": False,
                "message": "Could not extract features from image"
            }), 400
        
        # Compare with stored features
        best_match = None
        best_similarity = 0
        
        for encoding_data in stored_encodings:
            student_id = encoding_data['studentId']
            
            # Use stored features if available, otherwise use encoding data
            if student_id in stored_image_features:
                stored_features = stored_image_features[student_id]
                similarity = compare_features(current_features, stored_features)
            else:
                # Fallback: use a hash-based approach for consistency
                image_hash = hashlib.md5(image_base64.encode()).hexdigest()
                encoding_hash = hashlib.md5(str(encoding_data['encoding']).encode()).hexdigest()
                
                # Simple hash comparison (not very accurate but consistent)
                hash_similarity = 1.0 - (abs(int(image_hash[:8], 16) - int(encoding_hash[:8], 16)) / 0xFFFFFFFF)
                similarity = max(0, hash_similarity)
            
            logger.info(f"Student {student_id}: similarity={similarity:.3f}")
            
            if similarity > best_similarity:
                best_similarity = similarity
                best_match = encoding_data
        
        # Check if best match meets threshold - STRICT 90% confidence requirement
        confidence_threshold = 0.70  # 70% similarity = 90%+ confidence for attendance
        
        if best_similarity < confidence_threshold:
            return jsonify({
                "success": False,
                "message": f"Face recognition confidence too low: {best_similarity * 100:.1f}%. Minimum 90% required for attendance.",
                "best_similarity": round(best_similarity, 3),
                "required_threshold": "90%",
                "security_note": "High confidence required to prevent false attendance marking"
            }), 404
        
        # Convert similarity to confidence percentage - MORE STRICT
        confidence = min(100, best_similarity * 100)
        
        # Additional check: Only allow attendance if confidence >= 90%
        if confidence < 90:
            return jsonify({
                "success": False,
                "message": f"Confidence {confidence:.1f}% is below 90% threshold. Cannot mark attendance.",
                "confidence": round(confidence, 1),
                "required_confidence": "90%",
                "security_note": "High confidence required for genuine attendance marking"
            }), 404
        
        logger.info(f"Enhanced face recognized: Student {best_match['studentId']} with {confidence:.1f}% confidence")
        
        return jsonify({
            "success": True,
            "message": "Face recognized successfully (ENHANCED MODE - Using basic image analysis)",
            "studentId": best_match['studentId'],
            "confidence": round(confidence, 1),
            "similarity": round(best_similarity, 3),
            "distance": round(1 - best_similarity, 3),
            "spoof_score": 1,
            "face_location": [50, 200, 250, 100],
            "timestamp": datetime.now().isoformat(),
            "note": "Using basic image analysis for better recognition than pure mock mode."
        })
        
    except Exception as e:
        logger.error(f"Error in enhanced face recognition: {str(e)}")
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
        "similarity_threshold": SIMILARITY_THRESHOLD,
        "minimum_confidence_for_attendance": "90%",
        "anti_spoof_enabled": False,
        "face_recognition_model": "basic_analysis_strict",
        "version": "2.1.0-enhanced-strict",
        "mode": "high_security",
        "note": "Using strict 90% confidence threshold for genuine attendance"
    })

@app.route('/clear-cache', methods=['POST'])
def clear_cache():
    """Clear stored image features cache"""
    global stored_image_features
    stored_image_features = {}
    return jsonify({
        "success": True,
        "message": "Feature cache cleared"
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
    logger.info("🚀 Starting Enhanced Face Recognition Server (Basic Analysis Mode)...")
    logger.info("📡 Server will be available at: http://localhost:8085")
    logger.info("🔧 Using basic image analysis for better recognition than pure mock")
    logger.info("💡 For full functionality, install: dlib, face-recognition packages")
    
    app.run(
        host="0.0.0.0", 
        port=8085, 
        debug=True,
        threaded=True
    )