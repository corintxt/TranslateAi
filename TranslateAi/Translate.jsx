/*****************************************************************
 * TranslateAi (2025) - by Corin Faife - https://corinfaife.co/
 * 
 * Originally forked from:
 * =========================
 * TextConvert.Export 1.1 (2016) - by Bramus! - https://www.bram.us/
 *****************************************************************/
// Declare version
var scriptVersion = "0.3.3";

// Load dependencies from TranslateAi directory
var scriptPath = File($.fileName).parent.fsName;
var helpers = scriptPath + "/src";
$.evalFile(helpers + "/jsonparse.jsx"); // JSON polyfill
$.evalFile(helpers + "/languageselect.jsx"); // Language selection dialog
$.evalFile(helpers + "/styledetect.jsx"); // Style detection module

var callAPI = true; // Set false to export text to JSON without calling API
var targetLanguage; // Declare global var - then set by user dialog

/** Translate export/re-import function
 * -----------------------------*/
function initTranslateTranslate() {
    // Show language selection dialog first
    targetLanguage = showLanguageDialog();
    if (!targetLanguage) return; // User cancelled

    // Linefeed stuff
    if ($.os.search(/windows/i) != -1)
        fileLineFeed = "windows";
    else
        fileLineFeed = "macintosh";

    // Do we have a document open?
    if (app.documents.length === 0) {
        alert("Please open a file", "TranslateAi.Export Error", true);
        return;
    }

    // Remove .ai extension before writing
    var docName = app.activeDocument.name.replace(/\.ai$/i, "");
    
    // Use platform-specific separator for file paths
    var separator = ($.os.search(/windows/i) != -1) ? '\\' : '/';
    
    // Set file location (cross-platform)
    filePath = Folder.myDocuments + separator + "TranslateAi" + separator + docName + ".json";
    
    // Optional dev path for testing
    devPath = File($.fileName).parent.fsName + separator + "test" + separator + docName + ".json";
    
    writeTextToFile(filePath, app.activeDocument);

    alert("Exported text from " + app.activeDocument.name + "\nClick OK to start translation.", "TranslateAi");
    
    // Execute command script (unless we're in export-only mode)
    if (callAPI){
        executeCommandScript();
    }
}

/** Write text frames to temp file
 * -----------------------------*/
function writeTextToFile(filePath, document) {
		// create outfile
		var fileOut	= new File(filePath);
		// set linefeed
		fileOut.linefeed = fileLineFeed;
		// set encoding
		fileOut.encoding = "UTF8"
		// open for write
		fileOut.open("w", "TEXT", "????");
		// Set active Illustrator document
		app.activeDocument = document;
		// Extract text frames from active document
		textFrameExport(app.activeDocument, fileOut);
		// close the file
		fileOut.close();
}

// Sanitize string so that text can be written to JSON
// (called in textFrameExport)
function sanitizeString(str) {
    return str.toString()
             .replace(/[\r\n]+/g, ' ')  // Replace line breaks with space
             .replace(/"/g, '\\"')     // Escape quotes
			 .replace(/\t/g, '\\t');    // Escape tabs
}

/** Text export into JSON
 * -----------------------*/
function textFrameExport(el, fileOut) {
    var frames = el.textFrames;
    var jsonData = {
        targetLanguage: targetLanguage,
        frames: {},
        debugInfo: {
            totalFrames: frames.length,
            processedFrames: 0,
            lastProcessedFrame: -1,
            lastOperation: "initialization",
            timestamp: new Date().toString()
        }
    };
    
    // Write initial JSON structure immediately
    fileOut.writeln(JSON.stringify(jsonData, null, 2));
    fileOut.close();
    
    // Reopen file for appending updates
    fileOut.open("w", "TEXT", "????");
    
    $.writeln("=== Starting TextFrame Export ===");
    $.writeln("Total frames found: " + frames.length);
    
    // NOTE: This has been rewriten with lots of calls to updateJSONFile
    // to ensure we capture the state of the export process at each step.
    // (Since it sometimes freezes on certain frames, we want to know where it got stuck.)
    for (var frameCount = frames.length; frameCount > 0; frameCount--) {
        try {
            var frameIndex = frameCount-1;
            var frame = frames[frameIndex];
            
            // Update debug info and write to file
            jsonData.debugInfo.lastProcessedFrame = frameIndex;
            jsonData.debugInfo.lastOperation = "starting frame " + frameIndex;
            updateJSONFile(fileOut, jsonData);
            
            // Debugging info
            $.writeln("\n--- Frame " + frameIndex + " ---");
            $.writeln("Kind: " + frame.kind);
            $.writeln("Type: " + frame.typename);
            
            // Update debug info
            jsonData.debugInfo.lastOperation = "checked frame properties";
            updateJSONFile(fileOut, jsonData);
            
            // Check if textRange is available
            if (!frame.textRange) {
                throw new Error("No textRange available for this frame");
            }
            
            // Update debug info
            jsonData.debugInfo.lastOperation = "verified textRange exists";
            updateJSONFile(fileOut, jsonData);

            // Get style information (potential freeze point)
            jsonData.debugInfo.lastOperation = "calling extractStyleInfo";
            updateJSONFile(fileOut, jsonData);
            
            var styleInfo = extractStyleInfo(frame.textRange);
            
            jsonData.debugInfo.lastOperation = "extractStyleInfo completed";
            updateJSONFile(fileOut, jsonData);
            
            var hasMultipleStyles = false;
            if (styleInfo.length > 1) {
                hasMultipleStyles = true;
            }

            // Get the raw content (potential freeze point)
            jsonData.debugInfo.lastOperation = "getting raw content";
            updateJSONFile(fileOut, jsonData);
            
            var rawContent = frame.textRange.contents;
            
            jsonData.debugInfo.lastOperation = "raw content retrieved";
            updateJSONFile(fileOut, jsonData);
            
            // Create marked up content for translation (potential freeze point)
            jsonData.debugInfo.lastOperation = "calling addStyleMarkers";
            updateJSONFile(fileOut, jsonData);
            
            var markedContent = addStyleMarkers(rawContent, styleInfo);
            
            jsonData.debugInfo.lastOperation = "addStyleMarkers completed";
            updateJSONFile(fileOut, jsonData);
            
            // Sanitize the marked content for JSON
            var contentString = sanitizeString(markedContent);
            
            // Get all lines in range (potential freeze point)
            jsonData.debugInfo.lastOperation = "getting lines";
            updateJSONFile(fileOut, jsonData);
            
            var lines = frame.textRange.lines;
            var lineCount = lines.length;
            
            jsonData.debugInfo.lastOperation = "lines retrieved, counting characters";
            updateJSONFile(fileOut, jsonData);
            
            // Get character count for each line (potential freeze point)
            var characters = [];
            for (var i = 0; i < lineCount; i++) {
                // Update progress for large line counts
                if (i % 10 === 0 && lineCount > 50) {
                    jsonData.debugInfo.lastOperation = "processing line " + i + " of " + lineCount;
                    updateJSONFile(fileOut, jsonData);
                }
                
                var line = lines[i];
                var lineCharCount = line.characters.length;
                characters.push(lineCharCount);
            }
            
            jsonData.debugInfo.lastOperation = "character counting completed";
            updateJSONFile(fileOut, jsonData);

            // Get bounds
            var bounds = null;
            try {
                jsonData.debugInfo.lastOperation = "getting geometric bounds";
                updateJSONFile(fileOut, jsonData);
                
                bounds = frame.geometricBounds;
                
                jsonData.debugInfo.lastOperation = "bounds retrieved";
                updateJSONFile(fileOut, jsonData);
            } catch(e) {
                $.writeln("Warning: Could not get bounds for frame " + frameIndex + ": " + e);
                jsonData.debugInfo.lastOperation = "bounds failed: " + e.message;
                updateJSONFile(fileOut, jsonData);
            }
            
            // Get word and character counts (potential freeze points)
            jsonData.debugInfo.lastOperation = "getting word count";
            updateJSONFile(fileOut, jsonData);
            
            var wordCount = frame.textRange.words.length;
            
            jsonData.debugInfo.lastOperation = "getting character count";
            updateJSONFile(fileOut, jsonData);
            
            var charCount = frame.textRange.characters.length;
            
            jsonData.debugInfo.lastOperation = "counts completed, building frame data";
            updateJSONFile(fileOut, jsonData);

            // Add frame data to JSON object
            jsonData.frames[frameIndex] = {
                contents: contentString,
                originalContents: sanitizeString(rawContent),
                lineCount: lineCount,
                lineChars: characters,
                wordCount: wordCount,
                charCount: charCount,
                bounds: bounds,
                hasMultipleStyles: hasMultipleStyles,
                styleInfo: styleInfo
            };
            
            // Update completion status
            jsonData.debugInfo.processedFrames++;
            jsonData.debugInfo.lastOperation = "frame " + frameIndex + " completed successfully";
            updateJSONFile(fileOut, jsonData);

        } catch (e) {
            $.writeln("ERROR in frame " + frameIndex + ":");
            $.writeln("Error message: " + e.message);
            
            // Log error to JSON
            jsonData.debugInfo.lastOperation = "ERROR in frame " + frameIndex + ": " + e.message;
            jsonData.debugInfo.errorFrame = frameIndex;
            updateJSONFile(fileOut, jsonData);
            
            $.writeln("Frame properties:");
            for (var prop in frame) {
                try {
                    $.writeln("  " + prop + ": " + frame[prop]);
                } catch(e) {
                    $.writeln("  " + prop + ": [Unable to read property]");
                }
            }
        }
    }
    
    // Final completion update
    jsonData.debugInfo.lastOperation = "export completed successfully";
    jsonData.debugInfo.completedAt = new Date().toString();
    updateJSONFile(fileOut, jsonData);
}

// Helper function to update JSON file with current state
function updateJSONFile(fileOut, jsonData) {
    try {
        fileOut.seek(0); // Go to beginning of file
        fileOut.writeln(JSON.stringify(jsonData, null, 2));
        // Don't close the file here, keep it open for next update
    } catch (e) {
        $.writeln("Warning: Could not update JSON file: " + e.message);
    }
}

/** Invoke command script
 * ----------------------*/

function executeCommandScript() {
	// Use platform-specific file separator
    var separator = ($.os.search(/windows/i) != -1) ? '\\' : '/';
    var cfileName = separator + 'translate' + ($.os.search(/windows/i) != -1 ? '.bat' : '.command');
    var commandFile = File(helpers + cfileName);
    
    if (commandFile.exists) {        
		// Create platform-specific path for temporary file
		// var tempFile = new File("/tmp/current_doc.txt"); // MAC
        var tempFile = new File(Folder.myDocuments + separator + "TranslateAi" + separator + "current_doc.txt");
        
        // Create TranslateAi directory if it doesn't exist
        var textConvertFolder = new Folder(Folder.myDocuments + separator + "TranslateAi");
        if (!textConvertFolder.exists) {
            textConvertFolder.create();
        }
        
        tempFile.encoding = "UTF8";
        tempFile.lineFeed = "Unix"; // Force Unix line endings
        tempFile.open("w");
        
        var docName = app.activeDocument.name.replace(/\.ai$/i, "");
        tempFile.writeln(docName);
        tempFile.close();
        
        commandFile.execute();
		
		// Wait for translation and import automatically
        if (callAPI) {
            waitForTranslationAndImport();
        }
    } else {
        alert("Command file not found: " + commandFile.fsName);
    }
}


/** Wait for translation completion and import
 * -------------------------------*/
function waitForTranslationAndImport() {
    var separator = ($.os.search(/windows/i) != -1) ? '\\' : '/';
    var completionFlag = new File(Folder.myDocuments + separator + "TranslateAi" + separator + "translation_complete.flag");
    var importScript = File(File($.fileName).parent.fsName + separator + "src" + separator + "Import.jsx");
    
    // First, ensure any old completion flag is removed before starting
    if (completionFlag.exists) {
        completionFlag.remove();
    }
    
    // Set up timer to check for completion flag
    var maxWaitTime = 90; // Time out after 90 seconds
    var waitInterval = 2; // Check every 2 seconds
    var elapsedTime = 0;
    
    // Create waiting dialog
    var waitDialog = new Window("palette", "TranslateAi v" + scriptVersion, undefined, {closeButton: true});
    waitDialog.orientation = "column";
    waitDialog.alignChildren = ["center", "top"];
    waitDialog.spacing = 10;
    waitDialog.margins = 16;
    
    waitDialog.statusText = waitDialog.add("statictext", undefined, "Translating text... Please wait");
    waitDialog.statusText.preferredSize.width = 300;
    
    var progressBar = waitDialog.add("progressbar", undefined, 0, maxWaitTime);
    progressBar.preferredSize.width = 300;
    
    var cancelBtn = waitDialog.add("button", undefined, "Please wait");
    cancelBtn.onClick = function() {
        waitDialog.close();
    };
    
    // The main monitoring loop
    var waitForTranslation = true;
    
    // Add a small delay before starting to check for the flag
    $.sleep(500); // Wait half second before starting to check
    
    // Start showing the dialog (non-modal)
    waitDialog.show();
    
    // Add proper flag to track completion
    var translationCompleted = false;

    // Main monitoring loop
    while (waitForTranslation && elapsedTime < maxWaitTime && !translationCompleted) {
        // Update progress bar
        progressBar.value = elapsedTime;
        waitDialog.statusText.text = "Sending text to translation server... " + elapsedTime + "s elapsed";
        
        // Check for completion flag
        if (completionFlag.exists) {
            // Read the flag file to confirm it's for our document
            completionFlag.open("r");
            var translatedDoc = completionFlag.read();
            completionFlag.close();
            
            // Verify the flag content matches our document
            var docName = app.activeDocument.name.replace(/\.ai$/i, "");
            
            if (translatedDoc.indexOf(docName) !== -1) {
                translationCompleted = true;
                // Don't return here, let loop exit properly
            }
        }
        
        // Process events to keep UI responsive
        waitDialog.update();
        
        // Sleep for the interval period
        $.sleep(waitInterval * 1000);
        
        // Increment elapsed time
        elapsedTime += waitInterval;
        
        // Check if dialog was closed
        if (!waitDialog.visible) {
            waitForTranslation = false;
        }
    }
    
    // Handle completion after loop
    if (translationCompleted) {
        // Delete the completion flag
        if (completionFlag.exists) {
            completionFlag.remove();
        }
        
        // Close the dialog
        if (waitDialog.visible) {
            waitDialog.close();
        }
        
        // Give the system time to finish writing the translation file
        $.sleep(500);
        
        // Give UI time to update before running Import
        $.sleep(250);
        
        // Proceed with import
        try {
            $.evalFile(importScript);
        } catch (e) {
            alert("Error importing translation: " + e.message, "TranslateAi Import Error");
        }
    } else if (!waitDialog.visible) {
        return; // User cancelled
    } else {
        // Timeout - close dialog
        if (waitDialog.visible) {
            waitDialog.close();
        }
        alert("Translation API timed out after " + maxWaitTime + " seconds. Please run script again.", "TranslateAi");
    }
}


/* Call main function 
 * --------------------*/
initTranslateTranslate();