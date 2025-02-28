@echo off
setlocal EnableDelayedExpansion
echo ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
echo ~~~~~AFP-TRANSLATE-TEXT~~~~~~~
echo ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

:: Define document paths
set "DOCS_DIR=%USERPROFILE%\Documents\TranslateAi"
set "SCRIPT_DIR=%~dp0"
set "CURRENT_DOC=%DOCS_DIR%\current_doc.txt"

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
        python "%SCRIPT_DIR%translate.py" "!CONFIG!" "!INPUT!"
        
        echo Completed processing: !document_name!
        echo ------------------------
    )
)

echo ~~~~~~~~~FINISHED~~~~~~~~~~~