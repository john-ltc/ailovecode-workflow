@echo off
setlocal enabledelayedexpansion

set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%\..\..\.." >nul
set "PROJECT_ROOT=%CD%"
popd >nul

set "START_TAG=<ailovecode-workflow>"
set "END_TAG=</ailovecode-workflow>"

call :update_file "%PROJECT_ROOT%\AGENTS.md"
call :update_file "%PROJECT_ROOT%\CLAUDE.md"

echo.
echo AILoveCode Workflow installed at project root:
echo %PROJECT_ROOT%

exit /b 0

:update_file
set "FILE=%~1"
set "TEMP_FILE=%FILE%.tmp"
set "FOUND_BLOCK=0"
set "IN_BLOCK=0"

if exist "%FILE%" (
    findstr /C:"%START_TAG%" "%FILE%" >nul 2>&1
    if not errorlevel 1 (
        findstr /C:"%END_TAG%" "%FILE%" >nul 2>&1
        if not errorlevel 1 (
            set "FOUND_BLOCK=1"
        )
    )
)

if "%FOUND_BLOCK%"=="1" (
    if exist "%TEMP_FILE%" del "%TEMP_FILE%"

    for /f "usebackq delims=" %%A in ("%FILE%") do (
        set "LINE=%%A"

        echo !LINE! | findstr /C:"%START_TAG%" >nul 2>&1
        if not errorlevel 1 (
            call :write_block "%TEMP_FILE%"
            set "IN_BLOCK=1"
        ) else (
            echo !LINE! | findstr /C:"%END_TAG%" >nul 2>&1
            if not errorlevel 1 (
                set "IN_BLOCK=0"
            ) else (
                if "!IN_BLOCK!"=="0" (
                    echo !LINE!>>"%TEMP_FILE%"
                )
            )
        )
    )

    move /Y "%TEMP_FILE%" "%FILE%" >nul
    echo Updated: %FILE%
) else (
    if exist "%FILE%" (
        echo.>>"%FILE%"
        call :write_block "%FILE%"
        echo Appended: %FILE%
    ) else (
        echo # %~nx1>"%FILE%"
        echo.>>"%FILE%"
        call :write_block "%FILE%"
        echo Created: %FILE%
    )
)

exit /b 0

:write_block
set "TARGET=%~1"
(
echo ^<ailovecode-workflow^>
echo This project uses AILoveCode Workflow.
echo.
echo Before implementation:
echo.
echo 1. Read `workflow/guidelines.md`.
echo 2. Read the relevant `workflow/tasks/*/task.md`.
echo 3. Use `implementation-plan.md` for planning and progress.
echo 4. Do not modify `task.md` unless explicitly requested.
echo.
echo Core rules:
echo.
echo - `task.md` is the user-owned source of truth.
echo - AI should create or update `implementation-plan.md` before implementation.
echo - Keep documentation minimal and practical.
echo - Keep task-related files inside the relevant task folder.
echo ^</ailovecode-workflow^>
)>>"%TARGET%"

exit /b 0