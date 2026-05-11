@echo off
setlocal

set "SCRIPT_DIR=%~dp0"

pushd "%SCRIPT_DIR%\..\..\.." >nul
set "PROJECT_ROOT=%CD%"
popd >nul

call :append_if_missing "%PROJECT_ROOT%\AGENTS.md"
call :append_if_missing "%PROJECT_ROOT%\CLAUDE.md"

echo.
echo AILoveCode Workflow installed.
echo Project root: %PROJECT_ROOT%

endlocal
exit /b 0

:append_if_missing
set "FILE=%~1"

if not exist "%FILE%" (
    echo # %~nx1>"%FILE%"
    echo.>>"%FILE%"
)

findstr /C:"<ailovecode-workflow>" "%FILE%" >nul 2>&1

if errorlevel 1 (
    echo.>>"%FILE%"
    echo ^<ailovecode-workflow^>>> "%FILE%"
    echo This project uses AILoveCode Workflow.>> "%FILE%"
    echo.>> "%FILE%"
    echo Before working on any task, read and follow:>> "%FILE%"
    echo.>> "%FILE%"
    echo `workflow/guidelines.md`>> "%FILE%"
    echo.>> "%FILE%"
    echo Core rule:>> "%FILE%"
    echo.>> "%FILE%"
    echo Do not modify `task.md` unless explicitly requested.>> "%FILE%"
    echo ^</ailovecode-workflow^>>> "%FILE%"
    echo Appended: %FILE%
) else (
    echo Already installed: %FILE%
)

exit /b 0