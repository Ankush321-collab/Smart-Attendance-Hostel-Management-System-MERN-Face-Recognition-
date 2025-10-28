@echo off
echo 🎨 Starting DaisyUI Installation...

cd frontend

echo 📦 Installing DaisyUI...
npm install daisyui

echo 📦 Installing all dependencies...
npm install

echo 🧹 Clearing npm cache...
npm cache clean --force

echo 🔨 Building project to verify setup...
npm run build

echo ✅ DaisyUI installation complete!
echo.
echo 🚀 Next steps:
echo 1. Run 'npm start' to start the development server
echo 2. Check browser console for DaisyUI theme logs
echo 3. Navigate to /daisyui-test to verify components
echo.
echo 📚 Documentation:
echo - DaisyUI Components: https://daisyui.com/components/
echo - Theme Customization: https://daisyui.com/docs/themes/
echo - Setup Guide: ./DAISYUI_SETUP.md

pause