@echo off
echo ============================================
echo   Building SubGen for Production
echo ============================================
echo.

echo [1/3] Cleaning previous build...
call npm run clean
echo.

echo [2/3] Installing dependencies...
call npm install --production=false
if %errorlevel% neq 0 (
    echo Failed to install dependencies
    pause
    exit /b %errorlevel%
)
echo.

echo [3/3] Building production bundle...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed
    pause
    exit /b %errorlevel%
)

echo.
echo ============================================
echo   Build Complete!
echo ============================================
echo.
echo To start production server:
echo   npm start
echo.
echo Or run: start-production.bat
echo.
pause
