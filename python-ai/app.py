from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import os
import json

# Simple imports that should always work
try:
    import cv2
    import numpy as np
    from PIL import Image
    import io
    OPENCV_AVAILABLE = True
    print("✅ OpenCV and PIL available")
except ImportError as e:
    OPENCV_AVAILABLE = False
    print(f"⚠️ OpenCV/PIL not available: {e}")

app = Flask(__name__)
CORS(app)

# Configuration
ENCODINGS_DIR = 'encodings'
os.makedirs(ENCODINGS_DIR, exist_ok=True)

def decode_base64_image(base64_string):
    """Decode base64 image string to numpy array"""
    try:
        # Remove header if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_string)
        
        # Convert to PIL Image
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert to numpy array
        image_array = np.array(image)
        
        return image_array
    except Exception as e:
        raise ValueError(f"Error decoding image: {str(e)}")

def preprocess_image(image):
    """Preprocess image for better face detection"""
    # Resize if too large (max 1024px on longest side)
    max_dimension = 1024
    height, width = image.shape[:2]
    
    if max(height, width) > max_dimension:
        if height > width:
            new_height = max_dimension
            new_width = int(width * (max_dimension / height))
        else:
            new_width = max_dimension
            new_height = int(height * (max_dimension / width))
        
        image = cv2.resize(image, (new_width, new_height))
    
    return image

def detect_faces_opencv(image):
    """Detect faces using OpenCV Haar Cascade"""
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    
    # Load face cascade
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    
    # Detect faces
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)
    
    # Convert to format compatible with face_recognition
    face_locations = []
    for (x, y, w, h) in faces:
        # Convert from (x, y, w, h) to (top, right, bottom, left)
        face_locations.append((y, x + w, y + h, x))
    
    return face_locations

@app.route('/')
def home():
    return jsonify({
        'message': 'Face Recognition AI Module (OpenCV Version)',
        'version': '1.0.0',
        'status': 'running',
        'note': 'This version uses OpenCV for face detection. For full face recognition, install face_recognition library.',
        'endpoints': {
            'encode': 'POST /encode',
            'recognize': 'POST /recognize',
            'detect': 'POST /detect',
            'health': 'GET /health'
        }
    })

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'Face Recognition AI (OpenCV)',
        'note': 'Basic face detection available. Install face_recognition for full functionality.'
    })

@app.route('/encode', methods=['POST'])
def encode_face():
    """
    Encode a face from an image (Simplified version)
    Expects JSON: { "image": "base64_string", "studentId": "STU001" }
    """
    try:
        data = request.json
        
        if not data or 'image' not in data or 'studentId' not in data:
            return jsonify({
                'success': False,
                'message': 'Missing image or studentId in request'
            }), 400
        
        # Decode image
        image = decode_base64_image(data['image'])
        
        # Preprocess image
        image = preprocess_image(image)
        
        # Detect faces using OpenCV
        face_locations = detect_faces_opencv(image)
        
        if len(face_locations) == 0:
            return jsonify({
                'success': False,
                'message': 'No face detected in the image. Please ensure your face is clearly visible.'
            }), 400
        
        if len(face_locations) > 1:
            return jsonify({
                'success': False,
                'message': f'Multiple faces detected ({len(face_locations)}). Please ensure only one face is in the image.'
            }), 400
        
        # Generate a dummy encoding (in real implementation, this would be face encoding)
        # For now, we'll create a simple hash-based encoding
        student_id = data['studentId']
        dummy_encoding = [float(i) for i in range(128)]  # 128-dimensional dummy encoding
        
        # Save encoding to file (optional, for backup)
        encoding_file = os.path.join(ENCODINGS_DIR, f'{student_id}.npy')
        np.save(encoding_file, np.array(dummy_encoding))
        
        return jsonify({
            'success': True,
            'message': 'Face detected and encoded successfully (demo mode)',
            'encoding': dummy_encoding,
            'studentId': student_id,
            'face_location': {
                'top': face_locations[0][0],
                'right': face_locations[0][1],
                'bottom': face_locations[0][2],
                'left': face_locations[0][3]
            },
            'note': 'This is a demo encoding. Install face_recognition library for real face encoding.'
        })
        
    except ValueError as ve:
        return jsonify({
            'success': False,
            'message': str(ve)
        }), 400
    except Exception as e:
        print(f"Encoding error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error processing image: {str(e)}'
        }), 500

@app.route('/recognize', methods=['POST'])
def recognize_face():
    """
    Recognize a face from an image (Simplified version)
    Expects JSON: { 
        "image": "base64_string",
        "encodings": [{"studentId": "STU001", "encoding": [...]}, ...]
    }
    """
    try:
        data = request.json
        
        if not data or 'image' not in data or 'encodings' not in data:
            return jsonify({
                'success': False,
                'message': 'Missing image or encodings in request'
            }), 400
        
        # Decode image
        image = decode_base64_image(data['image'])
        
        # Preprocess image
        image = preprocess_image(image)
        
        # Detect faces using OpenCV
        face_locations = detect_faces_opencv(image)
        
        if len(face_locations) == 0:
            return jsonify({
                'success': False,
                'message': 'No face detected in the image'
            }), 404
        
        # In demo mode, randomly select a student from the provided encodings
        # In real implementation, this would compare face encodings
        enrollments = data['encodings']
        
        if len(enrollments) == 0:
            return jsonify({
                'success': False,
                'message': 'No enrolled students found for comparison'
            }), 400
        
        # Demo: Return the first enrolled student with high confidence
        recognized_student = enrollments[0]
        confidence = 85.5  # Demo confidence
        
        return jsonify({
            'success': True,
            'message': 'Face recognized successfully (demo mode)',
            'studentId': recognized_student['studentId'],
            'confidence': confidence,
            'distance': 0.15,  # Demo distance
            'face_location': {
                'top': face_locations[0][0],
                'right': face_locations[0][1],
                'bottom': face_locations[0][2],
                'left': face_locations[0][3]
            },
            'note': 'This is a demo recognition. Install face_recognition library for real face matching.'
        })
        
    except ValueError as ve:
        return jsonify({
            'success': False,
            'message': str(ve)
        }), 400
    except Exception as e:
        print(f"Recognition error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error during face recognition: {str(e)}'
        }), 500

@app.route('/detect', methods=['POST'])
def detect_faces():
    """
    Detect faces in an image (no recognition)
    Expects JSON: { "image": "base64_string" }
    """
    try:
        data = request.json
        
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'message': 'Missing image in request'
            }), 400
        
        # Decode image
        image = decode_base64_image(data['image'])
        
        # Preprocess image
        image = preprocess_image(image)
        
        # Detect faces using OpenCV
        face_locations = detect_faces_opencv(image)
        
        return jsonify({
            'success': True,
            'message': f'Detected {len(face_locations)} face(s) using OpenCV',
            'count': len(face_locations),
            'locations': [
                {
                    'top': loc[0],
                    'right': loc[1],
                    'bottom': loc[2],
                    'left': loc[3]
                }
                for loc in face_locations
            ]
        })
        
    except Exception as e:
        print(f"Detection error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error detecting faces: {str(e)}'
        }), 500

if __name__ == '__main__':
    print('🧠 Face Recognition AI Module Starting (OpenCV Version)...')
    print('📡 Server will run on http://localhost:5001')
    print('⚡ Ready to process face detection requests')
    print('💡 Note: This version uses OpenCV for basic face detection.')
    print('💡 For full face recognition, install: pip install face-recognition')
    
    # Run the server
    try:
        app.run(host='127.0.0.1', port=5001, debug=False, threaded=True)
    except Exception as e:
        print(f'❌ Error starting server: {e}')
        print('🔧 Trying alternative configuration...')
        app.run(host='0.0.0.0', port=5001, debug=False)
