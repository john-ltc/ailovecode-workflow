@echo off
setlocal enabledelayedexpansion

if "%~1"=="" (
    echo Usage: create-task.bat "task name"
    exit /b 1
)

set "TASK_NAME=%~1"
set "SCRIPT_DIR=%~dp0"

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMddTHHmm"') do set "TIMESTAMP=%%i"

for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "$s='%TASK_NAME%'.ToLower(); $s = $s -replace '[^a-z0-9]+','-'; $s.Trim('-')"`) do set "SLUG=%%i"

set "TASK_PATH=%SCRIPT_DIR%..\..\tasks\%TIMESTAMP%_%SLUG%"

mkdir "%TASK_PATH%\supporting-materials"

type nul > "%TASK_PATH%\task.md"
type nul > "%TASK_PATH%\implementation-plan.md"

echo Task created: %TASK_PATH%

endlocal