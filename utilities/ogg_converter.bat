:: hide the command text from showing in the console
:: only outputs and 'echo text' will display
@echo off

:: enable delayed variable expansion ('!variable!')
:: required for reading variables inside loops
setlocal enabledelayedexpansion

echo ============================================
echo   OGG audio converter v2
echo   (now with drag-and-drop!)
echo   by Matheraptor
echo ============================================
echo.

:: '%~1' is the very first argument passed to the script when 
:: you drag a file onto a '.bat' script.

:: Check if any files were dragged onto the script
if "%~1"=="" (
    echo "[ERROR]: No files were dragged onto this script."
    echo "Please, select your audio files in Windows Explorer," 
    echo "then drag and drop them directly onto this .bat file."
    goto end
)

:loop

:: Break the loop if no more files exist
if "%~1"=="" goto end

:: '%~x1' extracts only the file extension (e.g. '.mp3')
set "extension=%~x1"

:: Validate file extensions safely
:: '/I' makes the text comparison case-insensitive
if /I "%extension%"==".mp3" goto convert
if /I "%extension%"==".wav" goto convert

:: If it is not a supported file type
:: '%~nx1' extracts the name and extension (e.g. 'document.txt')
echo [Skipping] Not a supported audio file: "%~nx1"
goto advance

:convert
:: Check if the output .ogg file already exists
:: '%~dpn1' breaks the full path into 'Drive', 'Path', and 'Name'
if exist "%~dpn1.ogg" (
    echo.
    :: /p pauses the script
    :: "choice=" prompts you for text input and stores it into 'choice'
    set /p "choice=[?] '%~nx1.ogg' already exists. Overwrite? [y/n]: "
    if /I "!choice!"=="y" (
        :: User said yes, force FFmpeg to overwrite using -y
        :: '-y' is passed to ffmpeg to skip the its prompt
        echo Converting and overwriting: "%~nx1"
        ffmpeg -i "%~1" -y -c:a libvorbis -q:a 4 "%~dpn1.ogg"
    ) else (
        :: User said no or pressed enter, skip cleanly
        echo Not overwriting - skipping cleanly.
    )
) else (
    :: File does not exist, run normal conversion
    echo Converting: "%~nx1"
    :: '-c:a libvorbis -q:a 4' compress the audio using 'Vorbis'
    :: at a variable quality profile of '4' (roughly 128 kbps)
    ffmpeg -i "%~1" -c:a libvorbis -q:a 4 "%~dpn1.ogg"
)

:advance
:: Shift MUST run on every iteration to prevent infinite loops
:: it drops the current file argument '%1', moves the second file '%2'
:: into the '%1' position, the third into the second, and so on.
shift
goto loop

:end
echo.
echo ✅ Processing complete!
echo 😄 Thank you for using 'OGG audio converter'.
echo Check out more tools and games at:
echo https://matheraptor.itch.io
pause