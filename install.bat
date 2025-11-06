@echo off
echo Installing SubGen dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Failed to install dependencies
    pause
    exit /b %errorlevel%
)

echo.
echo Installing additional AI packages...
call npm install fluent-ffmpeg @ffmpeg-installer/ffmpeg srt-parser-2 p-queue @types/fluent-ffmpeg
if %errorlevel% neq 0 (
    echo Failed to install AI packages
    pause
    exit /b %errorlevel%
)

echo.
echo Dependencies installed successfully!
echo.
echo IMPORTANT: To use free AI transcription, you need to:
echo 1. Download whisper.cpp from: https://github.com/ggerganov/whisper.cpp/releases
echo 2. Set WHISPER_BIN environment variable to the path of main.exe
echo 3. Download a model file (e.g., ggml-base.en.bin)
echo.
echo To start the development server, run:
echo   npm run dev
echo.
pause
