@echo off
echo ============================================
echo   Push SubGen to GitHub
echo ============================================
echo.
echo First, create a repository on GitHub.com
echo Then enter your repository URL below.
echo.
set /p REPO_URL="Enter your GitHub repository URL: "
echo.
echo Connecting to GitHub...
git remote add origin %REPO_URL%
echo.
echo Pushing code...
git branch -M main
git push -u origin main
echo.
echo ============================================
echo   Done! Your code is on GitHub!
echo ============================================
echo.
pause
