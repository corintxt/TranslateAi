/*****************************************************************
 * TranslateAi.Export v 0.3 (2025) - by Corin Faife - https://corinfaife.co/
 * 
 * Originally forked from:
 * =========================
 * TextConvert.Export 1.1 (2016) - by Bramus! - https://www.bram.us/
 *****************************************************************/

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
        frames: {}
    };
    
	$.writeln("=== Starting TextFrame Export ===");
    $.writeln("Total frames found: " + frames.length);
    
    for (var frameCount = frames.length; frameCount > 0; frameCount--) {
        try {
            var frameIndex = frameCount-1;
            var frame = frames[frameIndex];
            
            // Debugging info
            $.writeln("\n--- Frame " + frameIndex + " ---");
            $.writeln("Kind: " + frame.kind);
            $.writeln("Type: " + frame.typename);
			// end debug
            
            // Check if textRange is available
            if (!frame.textRange) {
                throw new Error("No textRange available for this frame");
            }

            // Get style information
            var styleInfo = extractStyleInfo(frame.textRange);
            var hasMultipleStyles = false; // Flag for multiple styles in frame
            // If we have more than one style in the frame, set the flag to true
            if (styleInfo.length > 1) {
                hasMultipleStyles = true;
            }

            // Get the raw content
            var rawContent = frame.textRange.contents;
            
            // Create marked up content for translation
            var markedContent = addStyleMarkers(rawContent, styleInfo);
            
            // Sanitize the marked content for JSON
            var contentString = sanitizeString(markedContent);
		
			// Get all lines in range
			var lines = frame.textRange.lines;
			var lineCount = lines.length;
			// Get character count for each line
			var characters = [];
			for (var i = 0; i < lineCount; i++) {
				var line = lines[i];
				var lineCharCount = line.characters.length;
				characters.push(lineCharCount);
			}

			// Get bounds: geometricBounds returns [top, left, bottom, right]
			var bounds = null;
			try {
				bounds = frame.geometricBounds;
			} catch(e) {
				$.writeln("Warning: Could not get bounds for frame " + frameIndex + ": " + e);
			}

            // Add frame data to JSON object
            jsonData.frames[frameIndex] = {
                contents: contentString,  // Now contains marked up text
                originalContents: sanitizeString(rawContent),  // Store original for reference
                lineCount: lineCount,
                lineChars: characters,
                wordCount: frame.textRange.words.length,
                charCount: frame.textRange.characters.length,
                bounds: bounds,
                hasMultipleStyles: hasMultipleStyles,
                styleInfo: styleInfo  // Still include full style info
            };

		// Error handling / debug
		} catch (e) {
            $.writeln("ERROR in frame " + frameIndex + ":");
            $.writeln("Error message: " + e.message);
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
    
    fileOut.writeln(JSON.stringify(jsonData, null, 2));
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
    var waitDialog = new Window("palette", "TranslateAi", undefined, {closeButton: true});
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