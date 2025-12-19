@echo off
echo Setting up MinIO buckets...
echo.

REM Setup MinIO Client alias (if mc is installed)
echo Step 1: Setting up MinIO alias...
mc alias set local http://127.0.0.1:9000 minioadmin minioadmin
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to set alias. Make sure MinIO server is running on port 9000.
    pause
    exit /b 1
)

echo.
echo Step 2: Creating buckets...
REM Create buckets
mc mb local/avatars
mc mb local/submissions
mc mb local/temp

echo.
echo Step 3: Setting public read policy...
REM Set public read policy for avatars and submissions
mc anonymous set download local/avatars
mc anonymous set download local/submissions

echo.
echo ✅ MinIO setup completed!
echo.
echo Buckets created:
echo   - avatars (public read)
echo   - submissions (public read)
echo   - temp (private)
echo.
pause

