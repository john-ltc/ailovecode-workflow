@echo off
setlocal enabledelayedexpansion

if "%~1"=="" (
    echo Usage: create-task.bat "task name"
    exit /b 1
)

set TASK_NAME=%~1

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmm"') do set TIMESTAMP=%%i

set SLUG=%TASK_NAME: =-%

set TASK_PATH=..\\..\\tasks\\%TIMESTAMP%_%SLUG%

mkdir "%TASK_PATH%\\supporting-materials"

(
echo # %TASK_NAME%
echo.
echo ## Notes
echo.
) > "%TASK_PATH%\\task.md"

(
echo # Implementation Plan: %TASK_NAME%
echo.
echo ## Summary
echo.
echo ## Goals
echo.
echo ## Architecture
echo.
echo ## Implementation Steps
echo.
echo ## Testing
echo.
echo ## Progress
echo.
) > "%TASK_PATH%\\implementation-plan.md"

echo Task created: %TASK_PATH%