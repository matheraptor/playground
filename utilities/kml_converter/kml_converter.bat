@echo off
setlocal enabledelayedexpansion

:: Check if a file was actually dropped
if "%~1"=="" (
    echo [ERROR] No file detected. Drag and drop a .kml file directly onto this icon.
    pause
    exit /b
)

:: CRITICAL FIX: Forces Windows to look in the batch file's actual directory 
:: instead of the shortcut's location
cd /d "%~dp0"

:: Run your Node script safely
node "kml_converter.js" "%~1"

:: Keep the window open for 3 seconds so you can see the success message
timeout /t 3
