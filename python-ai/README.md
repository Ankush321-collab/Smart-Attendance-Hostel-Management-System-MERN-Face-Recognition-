# Python AI Module - Face Recognition

This module handles all face detection and recognition tasks using OpenCV and face_recognition library.

## Setup

1. Create virtual environment:
```bash
python -m venv venv
```

2. Activate virtual environment:
```bash
# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Module

```bash
python app.py
```

The server will start on `http://localhost:5001`

## API Endpoints

### POST /encode
Encode a face from an image.

**Request:**
```json
{
  "image": "base64_encoded_image_string",
  "studentId": "STU001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Face encoded successfully",
  "encoding": [array of 128 numbers],
  "studentId": "STU001"
}
```

### POST /recognize
Recognize a face from an image.

**Request:**
```json
{
  "image": "base64_encoded_image_string",
  "encodings": [
    {
      "studentId": "STU001",
      "encoding": [array of 128 numbers]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Face recognized successfully",
  "studentId": "STU001",
  "confidence": 95.5
}
```

### POST /detect
Detect faces in an image (without recognition).

**Request:**
```json
{
  "image": "base64_encoded_image_string"
}
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "locations": [...]
}
```

## Technical Details

- **Face Detection**: HOG (Histogram of Oriented Gradients) algorithm
- **Face Encoding**: 128-dimensional feature vector
- **Matching**: Euclidean distance comparison
- **Threshold**: 0.6 (configurable)
- **Accuracy**: 95-99% for well-lit frontal images
