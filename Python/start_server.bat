@echo off@echo off

echo 🚀 Starting Face Recognition Server...REM Face Recognition Server Startup Script

echo ========================================REM Activates virtual environment and starts the server



REM Activate virtual environmentecho 🚀 Starting Face Recognition Server...

call face_recognition_env\Scripts\activate.batecho ====================================



REM Start the serverREM Check if virtual environment exists

echo ✅ Virtual environment activatedif not exist "face_recognition_env" (

echo 🔥 Starting enhanced face recognition server...    echo ❌ Virtual environment not found!

echo 📡 Server will be available at: http://localhost:8085    echo Please run setup.bat first to install dependencies.

echo.    pause

python face_recognition_server_enhanced.py    exit /b 1

)

pause
REM Activate virtual environment
echo 🔧 Activating virtual environment...
call face_recognition_env\Scripts\activate.bat

REM Check if the main server file exists
if not exist "face_recognition_server.py" (
    echo ❌ face_recognition_server.py not found!
    echo Please ensure you're in the correct directory.
    pause
    exit /b 1
)

REM Start the server
echo 🌟 Starting Face Recognition Server on http://localhost:8085
echo Press Ctrl+C to stop the server
echo.
python face_recognition_server.py