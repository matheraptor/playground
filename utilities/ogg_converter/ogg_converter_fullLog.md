---
type: readme
tags: [readme, batch, script, audioTools]
author: Matheraptor
version: 0.39.969 20260710
---

# OGG Audio Converter script

- [OGG Audio Converter script](#ogg-audio-converter-script)
  - [Overview](#overview)
  - [The script](#the-script)
    - [Drag-and-drop](#drag-and-drop)
    - [Labels](#labels)
    - [Validation](#validation)
    - [Termination](#termination)

---

## Overview

This Batch script converts audio files (currently only `.wav` and `.mp3`) to `.ogg` format, using `ffmpeg`.

It is a very simple script researched piece by piece on [Google](https://www.google.com/).

The purpose of this script came about out of frustration for having to rely on web conversion apps to convert my [Guitar Pro 8](https://www.guitar-pro.com/) creations into a format that is suitable for [RPG Maker MZ](https://www.rpgmakerweb.com/products/rpg-maker-mz). At some point, I thought, "there has to be a simpler way; afterall, it's all done with ffmpeg, right?".

So, that's how I started learning Batch scripting...

I break down each piece of this script below as a learning exercise.

---

## The script

```cmd
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
```

[Back to top ⤴️](#top)

---

### Drag-and-drop

`%~1` represents the very first argument passed to the script. When you drag a file onto a `.bat` file, Windows automatically passes that file's full path as the first argument. The tilde (`~`) strips away any wrapping quotation marks. [^missing.csail.mit.edu-shell-tools] [^wikibooks-windows_batch_scripting]

`if "%~1"==""`: if this argument is completely empty, it means you just double-clicked the script normally instead of dragging files onto it.

```cmd
if "%~1"=="" (
    echo [!] Error: No files were dragged onto this script.
    echo Please select your audio files in Windows Explorer, 
    echo then drag and drop them directly onto this .bat file.
    goto end
)
```

It prints an error message instructing you how to use it and uses `goto end` to jump straight to the termination block.

---

### Labels

`:label`

A label marks a point you can use in conjunction with the `goto` command.

```cmd
:: set the label
:label

:: go to the label
goto label
```

[Back to top ⤴️](#top)

---

### Validation

**File extension validation:**

```cmd
set "ext=%~x1"

if /I "%ext%"==".mp3" goto convert
if /I "%ext%"==".wav" goto convert

echo [Skipping] Not a supported audio file: "%~nx1"
goto advance
```

- `%~x1`: extracts **only the file extension** (e.g., `.mp3`) from the full path of the current file
- `if /I`: makes the text comparison case-insensitive to ensure files ending in `.MP3`, `.mp3`, `.WAV`, or `.wav` are all treated the same.
- `%~nx1`: if the file extension is not an `MP3` or `WAV`, it falls through to the `echo` message. The `%~nx1` modifier extracts the **name and extension** (e.g. `document.txt`) to show you exactly what file it is skipping, before jumping to the `:advance` label. [^gaijin.at-batch-programs]

**Existing file and conflict detection:**

```cmd
:convert
:: Check if the output .ogg file already exists
if exist "%~dpn1.ogg" (
    echo.
    set /p "choice=[?] '%~nx1.ogg' already exists. Overwrite? [y/N]: "
    if /I "!choice!"=="y" (
        :: User said yes, force FFmpeg to overwrite using -y
        echo Converting and overwriting: "%~nx1"
        ffmpeg -i "%~1" -y -c:a libvorbis -q:a 4 "%~dpn1.ogg"
    ) else (
        :: User said no or pressed enter, skip cleanly
        echo Not overwriting - skipping cleanly.
    )
) else (
    :: File does not exist, run normal conversion
    echo Converting: "%~nx1"
    ffmpeg -i "%~1" -c:a libvorbis -q:a 4 "%~dpn1.ogg"
)
```

`if exist "%~dpn1.ogg"`: checks the hard drive *before* `FFmpeg` fires up. The modifier `%~dpn1` breaks down the original file's path into `Drive`, `Path`, and `Name` (stripping the old extension). By adding `.ogg` to it, the script checks if a converted version lives in that exact folder.

**Interactive Prompt (If Conflict Exists):**

```cmd
    echo.
    set /p "choice=[?] '%~nx1.ogg' already exists. Overwrite? [y/N]: "
    if /I "!choice!"=="y" (
        echo Converting and overwriting: "%~nx1"
        ffmpeg -i "%~1" -y -c:a libvorbis -q:a 4 "%~dpn1.ogg"
    ) else (
        echo Not overwriting - skipping cleanly.
    )
```

- `set /p "choice=..."`: pauses the script and prompts you for text input, storing whatever you type into the variable `choice`.
- `!choice!`: because this interactive prompt happens inside an `if` block, we use exclamation marks (`!`) for delayed expansion. This reads your choice right after you type it. [^gaijin.at-batch-programs]
- `-y` (FFmpeg flag): if you type `y`, the script fires up `FFmpeg`. The `-y` flag tells `FFmpeg` to overwrite the file instantly without throwing an interactive prompt of its own.
- `else`: if you type anything else (like `n`) or just hit `ENTER`, it executes the fallback block, printing a clean skipping message and completely bypassing `FFmpeg`. This prevents the redundant "Error opening output file" message.

**Clean conversion (if 'File does not exist'):**

```cmd
) else (
  echo Converting: "%~nx1"
  ffmpeg -i "%~1" -c:a libvorbis -q:a 4 "%~dpn1.ogg" 
)
```

- if the `.ogg` file does not exist, it runs your original clean conversion layout
- `-c:a libvorbis -q:a 4`: compresses the audio using the standard `Vorbis` codec at a variable quality profile of `4` (roughly 128 kbps)

**Advancing to the next file:**

```cmd
:advance
shift
goto loop
```

- `shift`: This is the engine instruction for processing multi-file drops. It drops the current file argument (`%1`), moves the second file (`%2`) into the `%1` position, the third into the second, and so on.
- `goto loop`: Sends the script right back up to the top of the processing engine to check the new `%1` argument. [^dev.to-studio1hq-2476]

[^dev.to-studio1hq-2476]: [dev.to/studio1hq | 'I wrote a Batch Script to enhance my workflow on Command Prompt'](https://dev.to/studio1hq/i-wrote-a-batch-script-to-enhance-my-workflow-on-command-prompt-2476)

[^gaijin.at-batch-programs]: [gaijin.at | Windows Batch Programs](https://www.gaijin.at/en/infos/windows-batch-programs)

[^missing.csail.mit.edu-shell-tools]: [missing.csail.mit.edu | Shell Tools and Scripting](https://missing.csail.mit.edu/2020/shell-tools/)

[^wikibooks-windows_batch_scripting]: [wikibooks.org | Windows Batch Scripting](https://en.wikibooks.org/wiki/Windows_Batch_Scripting)

[Back to top ⤴️](#top)

---

### Termination

```cmd
:end
echo.
echo Processing complete!
pause
```

- executes when there are no more files left to look at. It prints a completion message and uses `pause` to keep the terminal window open.
- `pause` prints `Press any key to continue` and keeps the terminal open until you (duh!) press any key.

[Back to top ⤴️](#top)

---
