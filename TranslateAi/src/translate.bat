@echo off
setlocal EnableDelayedExpansion

echo ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
echo ~~~~~~AFP-TRANSLATE-AI~~~~~~~~
echo ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

:: Look for multiple possible OneDrive Documents folder paths
if exist "%USERPROFILE%\OneDrive - Agence France-Presse\Documents\TranslateAi" (
    set "DOCS_DIR=%USERPROFILE%\OneDrive - Agence France-Presse\Documents\TranslateAi"
    echo Using OneDrive AFP Documents folder
) else if exist "%USERPROFILE%\OneDrive\Documents\TranslateAi" (
    set "DOCS_DIR=%USERPROFILE%\OneDrive\Documents\TranslateAi"
    echo Using OneDrive Documents folder
) else if exist "%USERPROFILE%\Documents\TranslateAi" (
    set "DOCS_DIR=%USERPROFILE%\Documents\TranslateAi"
    echo Using local Documents folder
) else (
    echo Error: Could not find TranslateAi directory in Documents
    echo Checked: 
    echo - %USERPROFILE%\OneDrive\Documents\TranslateAi
    echo - %USERPROFILE%\OneDrive - Agence France-Presse\Documents\TranslateAi
    echo - %USERPROFILE%\Documents\TranslateAi
    pause
    exit /b 1
)

:: Define other document paths
set "SCRIPT_DIR=%~dp0"
set "CURRENT_DOC=%DOCS_DIR%\current_doc.txt"
set "CERT_PATH=%SCRIPT_DIR%_.afp.com.pem"

:: Remove any stale completion flags
if exist "%DOCS_DIR%\translation_complete.flag" del "%DOCS_DIR%\translation_complete.flag"

:: Check current_doc.txt
if not exist "%DOCS_DIR%\current_doc.txt" (
    echo Error: current_doc.txt not found at %DOCS_DIR%
    pause
    exit /b 1
)

:: Check config.json
if not exist "%SCRIPT_DIR%config.json" (
    echo Error: config.json not found at %SCRIPT_DIR%
    pause
    exit /b 1
)

:: Check certificate file
if not exist "%CERT_PATH%" (
    echo Error: Certificate file not found at %CERT_PATH%
    pause
    exit /b 1
)

:: Try to read current_doc.txt
type "%DOCS_DIR%\current_doc.txt" >nul 2>&1
if errorlevel 1 (
    echo Error: Cannot read current_doc.txt
    pause
    exit /b 1
)

:: Variable to track if any translation was successful
set "TRANSLATION_SUCCESS=false"

:: START MAIN SCRIPT.

:: Read all document names from temp file
for /f "usebackq tokens=* delims=" %%a in ("%CURRENT_DOC%") do (
    set "document_name=%%a"
    :: Remove leading/trailing spaces
    for /f "tokens=*" %%b in ("!document_name!") do set "document_name=%%b"
    
    if not "!document_name!"=="" (
        echo Processing document: !document_name!
        
        set "CONFIG=%SCRIPT_DIR%config.json"
        set "INPUT=%DOCS_DIR%\!document_name!.json"
        
        echo Found text to translate. Executing translate.py...
        python "%SCRIPT_DIR%translate.py" "!CONFIG!" "!INPUT!" "%CERT_PATH%"
        
        :: Check if translation was successful by looking for the output file
        if exist "%DOCS_DIR%\T-!document_name!.json" (
            set "TRANSLATION_SUCCESS=true"
            echo Translation successful for: !document_name!
        ) else (
            echo Translation failed for: !document_name!
        )
        
        echo Completed processing: !document_name!
        echo ------------------------
    )
)

:: If no translation flag was created by translate.py, create one here as backup
if "%TRANSLATION_SUCCESS%"=="true" (
    if not exist "%DOCS_DIR%\translation_complete.flag" (
        :: Get the first document name as fallback
        for /f "usebackq tokens=* delims=" %%c in ("%CURRENT_DOC%") do (
            echo %%c> "%DOCS_DIR%\translation_complete.flag"
            goto :done_creating_flag
        )
        :done_creating_flag
    )
)

echo ~~~~~~~~~FINISHED~~~~~~~~~~~
pause