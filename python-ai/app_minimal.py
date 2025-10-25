from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import os
import json
import random

app = Flask(__name__)
CORS(app)

# Configuration
ENCODINGS_DIR = 'encodings'
os.makedirs(ENCODINGS_DIR, exist_ok=True)

@app.route('/')
def home():
    return jsonify({
        'message': 'Face Recognition AI Module (Minimal Version)',
        'version': '1.0.0',
        'status': 'running',
        'note': 'Minimal version for testing. Install opencv-python for full functionality.',
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
        'service': 'Face Recognition AI (Minimal)',
        'note': 'Basic server running. Install opencv-python for face detection.'
    })

@app.route('/encode', methods=['POST'])
def encode_face():
    """
    Encode a face from an image (Minimal demo version)
    """
    try:
        data = request.json
        
        if not data or 'image' not in data or 'studentId' not in data:
            return jsonify({
                'success': False,
                'message': 'Missing image or studentId in request'
            }), 400
        
        student_id = data['studentId']
        
        # Generate a dummy encoding for demo purposes
        dummy_encoding = [random.random() for _ in range(128)]
        
        # Save encoding to file
        encoding_file = os.path.join(ENCODINGS_DIR, f'{student_id}.json')
        with open(encoding_file, 'w') as f:
            json.dump({'studentId': student_id, 'encoding': dummy_encoding}, f)
        
        return jsonify({
            'success': True,
            'message': 'Face encoded successfully (demo mode)',
            'encoding': dummy_encoding,
            'studentId': student_id,
            'face_location': {'top': 100, 'right': 200, 'bottom': 200, 'left': 100},
            'note': 'This is a demo encoding. Install opencv-python for real face detection.'
        })
        
    except Exception as e:
        print(f"Encoding error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error processing image: {str(e)}'
        }), 500

@app.route('/recognize', methods=['POST'])
def recognize_face():
    """
    Recognize a face from an image (Minimal demo version)
    """
    try:
        data = request.json
        
        if not data or 'image' not in data or 'encodings' not in data:
            return jsonify({
                'success': False,
                'message': 'Missing image or encodings in request'
            }), 400
        
        enrollments = data['encodings']
        
        if len(enrollments) == 0:
            return jsonify({
                'success': False,
                'message': 'No enrolled students found for comparison'
            }), 400
        
        # Demo: Return the first enrolled student with random confidence
        recognized_student = enrollments[0]
        confidence = round(random.uniform(80, 95), 2)
        
        return jsonify({
            'success': True,
            'message': 'Face recognized successfully (demo mode)',
            'studentId': recognized_student['studentId'],
            'confidence': confidence,
            'distance': round(random.uniform(0.1, 0.3), 3),
            'face_location': {'top': 100, 'right': 200, 'bottom': 200, 'left': 100},
            'note': 'This is a demo recognition. Install opencv-python for real face detection.'
        })
        
    except Exception as e:
        print(f"Recognition error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error during face recognition: {str(e)}'
        }), 500

@app.route('/detect', methods=['POST'])
def detect_faces():
    """
    Detect faces in an image (Minimal demo version)
    """
    try:
        data = request.json
        
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'message': 'Missing image in request'
            }), 400
        
        # Demo: Always detect one face
        return jsonify({
            'success': True,
            'message': 'Detected 1 face(s) (demo mode)',
            'count': 1,
            'locations': [{'top': 100, 'right': 200, 'bottom': 200, 'left': 100}],
            'note': 'This is demo detection. Install opencv-python for real face detection.'
        })
        
    except Exception as e:
        print(f"Detection error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error detecting faces: {str(e)}'
        }), 500

if __name__ == '__main__':
    print('🧠 Face Recognition AI Module Starting (Minimal Version)...')
    print('📡 Server will run on http://localhost:5001')
    print('⚡ Ready to process face detection requests (demo mode)')
    print('💡 This is a minimal version for testing.')
    print('💡 Install opencv-python and other dependencies for full functionality.')
    
    try:
        app.run(host='127.0.0.1', port=5001, debug=False, threaded=True)
    except Exception as e:
        print(f'❌ Error starting server: {e}')
        print('🔧 Trying alternative port...')
        app.run(host='127.0.0.1', port=5002, debug=False)