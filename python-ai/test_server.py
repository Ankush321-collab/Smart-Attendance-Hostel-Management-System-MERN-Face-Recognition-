from flask import Flask, jsonify
import sys

app = Flask(__name__)

@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'message': 'Test server is running'})

@app.route('/')
def home():
    return jsonify({'message': 'Simple test server'})

if __name__ == '__main__':
    print('Starting simple test server...')
    try:
        app.run(host='127.0.0.1', port=5001, debug=False)
    except Exception as e:
        print(f'Error: {e}')
        sys.exit(1)