/*****************************************************************
 * TranslateAi.Import v 0.3 (2025) - Corin Faife - https://corinfaife.co/
 * 
 * Adapted from: 
 * ==============
 * TextConvert.Import 1.1 (2016) - by Bramus! - https://www.bram.us/
 *****************************************************************/

// Load dependencies from script directory
var scriptPath = File($.fileName).parent.fsName;
var helpers = scriptPath + "/Process";
$.evalFile(helpers + "/debug.jsx"); // Debugging utilities
$.evalFile(helpers + "/jsonparse.jsx"); // JSON polyfill
$.evalFile(helpers + "/boundsdetect.jsx"); // Bounds detection
$.evalFile(helpers + "/styledetect.jsx"); // Bounds detection

var jsonData; // Declare global
var numReplaced	= 0;

var config = {
    debug: {
        enabled: true,
        level: 3, // 1=error, 2=normal, 3=verbose
        logToFile: true
    },
    bounds: {
        drawBounds: false, // Whether to draw bounds for text frames
        checkOverlaps: false // Whether to check for overlaps between text frames
    },
    keyWords: {
        source: ['Source','Fuente', 'Fonte', 'Quelle']
    }
};

// Update debug settings from config
setDebugConfig(config);


/** Translate.Import Init function
 * --------------------------------*/
function initTranslateImport() {
    // Linefeed stuff (-currently unused?-)
    if ($.os.search(/windows/i) != -1)
        operatingSystem = "windows";
    else
        operatingSystem = "mac";

    // Do we have a document open?
    if (app.documents.length === 0) {
        alert("Please open a file", "TranslateAi.Import Error", true);
        return;
    }

    // Get document name without .ai extension
    var docName = app.activeDocument.name.replace(/\.ai$/i, "");
    
    // Use platform-specific separator
    var separator = ($.os.search(/windows/i) != -1) ? '\\' : '/';
    
    // Set cross-platform translation file path
    var translationFile = Folder.myDocuments + separator + "TranslateAi" + separator + "T-" + docName + ".json";
    
    // Optional dev path for testing
    var devTranslationFile = File($.fileName).parent.fsName + separator + "test" + separator + "T-" + docName + ".json";
    
    // Use production path by default
    fetchTranslations(translationFile);

    // If we have translations
    if (jsonData && jsonData.frames) {
        // Apply the translations
        textFrameImport(app.activeDocument);
        numReplaced++;
        // Give notice of changes
        alert("Successfully applied translations to " + app.activeDocument.name, "TranslateAi");
    } else {
        alert("No translations found for " + app.activeDocument.name, "TranslateAi", true);
    }

    // Always close debug log
    closeDebugLog();
}

/** fetchTranslations (v2: reads from JSON)
* --------------------------------------- */
function fetchTranslations(filePath) {
    // Initialize debug logging first
    initDebugLog(filePath);
    debugLog("Starting to fetch translations from: " + filePath);

    // Create fileref
    var fileIn = new File(filePath);
    
    // Check if file exists
    if (!fileIn.exists) {
        alert("No translation file found.", "TranslateAi.Import", true);
        return;
    }

    // Set encoding and open file
    fileIn.encoding = "UTF8";
    fileIn.open("r", "TEXT");

    // Read entire file contents
    var jsonString = fileIn.read();
    fileIn.close();

    try {
        // Parse JSON content
        jsonData = JSON.parse(jsonString);
    } catch(e) {
        alert("Error parsing JSON file: " + e.message, "TranslateAi.Import", true);
    }
}

/** textFrameImport: 
* Import translated strings into the text frames from JSON
* --------------------------------------------------------*/
function textFrameImport(el) {
    debugLog("Starting textFrameImport for document: " + el.name, 1);
    // Get all text frames in document
    var frames = el.textFrames;

    // Find the title frame directly from the document
    var titleInfo = findTitleFrame(el);
    if (titleInfo) {
        debugLog("Found title frame at index " + titleInfo.index + 
                 " with font size " + titleInfo.fontSize, 2);
    } else {
        debugLog("No title frame detected in document");
    }

    // Find source attribution and attribution marker frames
    var frameInfo = findSourceFrame(el, config.keyWords.source);
    
    // Log source frame info if found
    if (frameInfo.source) {
        debugLog("Found source frame at index " + frameInfo.source.index, 2);
        debugLog("Source contents: '" + frameInfo.source.contents + "'", 3);
    } else {
        debugLog("No source frame detected in document", 2);
    }
    
    // Log attribution frame info if found
    if (frameInfo.attribution) {
        debugLog("Found attribution frame at index " + frameInfo.attribution.index, 2);
        debugLog("Attribution contents: '" + frameInfo.attribution.contents + "'", 3);
    } else {
        debugLog("No attribution frame detected in document", 2);
    }
    
    // Loop through frames in reverse order (since frame indices are zero-based)
    for (var frameCount = frames.length; frameCount > 0; frameCount--) {
        var frameIndex = frameCount - 1;
        var currentFrame = frames[frameIndex];
        debugLog("Processing frame at index " + frameIndex, 2);
        
        // Get the corresponding frame data from JSON
        var frameData = jsonData.frames[frameIndex];
        
        // If we have data for this frame:
        if (frameData) {
            // Process the text based on frame type
            if (frameIndex === titleInfo.index || 
                (frameInfo.source && frameIndex === frameInfo.source.index) || 
                (frameInfo.attribution && frameIndex === frameInfo.attribution.index)) {
                // For special frames like title, remove style tags and use titleBuilder
                currentFrame.contents = titleBuilder(
                    frameData.contents.replace(/<\/?-?\d+>/g, ''), 
                    frameData.lineChars
                );
            } else if (frameData.hasMultipleStyles === true) {
                // Apply styles to the text frame if it has multiple styles
                applyStylesToFrame(currentFrame, frameData);
            } else {
                // No style info or single style, just update content with lineBuilder
                var lines = lineBuilder(
                    frameData.contents.replace(/<\/?-?\d+>/g, ''), 
                    frameData.lineChars,
                    2 // Tolerance of 2 characters
                );
                currentFrame.contents = lines.join('\r');
            }
        }
    // Draw bounds for debugging (if enabled)
    detectAndVisualizeFrameIssues(el,
                                config.bounds.drawBounds, 
                                config.bounds.checkOverlaps);
    }
}

/** LineBuilder function: ///
* We use this to split translated text into lines that fit the text frame.
* The character limit array is a property of each text frame that we will 
* read in from the JSON file
* @param text - The text to split into lines
* @param charArray - Array of character limits for each line
* @param tolerance - Additional characters to allow before splitting (default: 0)
----------------------------------------------*/
function lineBuilder(text, charArray, tolerance) {
    // Set default tolerance if not provided
    tolerance = (tolerance !== undefined) ? tolerance : 0;
    
    debugLog("lineBuilder called with text: '" + text.substring(0, 30) + "...'", 3);
    
    function trimString(str) {
        return str.replace(/^\s+|\s+$/g, '');
    }
    
    var words = text.split(' ');
    debugLog("Split text into " + words.length + " words", 3);

    // First case: if there's only one word, return it immediately
    if (words.length === 1) {
        debugLog("Single word detected, returning one line.", 3);
        return [words[0]];
    }
    
    var lines = [];
    var line = '';
    var wordIndex = 0;
    var limitIndex = 0;
    var maxLineLength = Math.max.apply(null, charArray);
    debugLog("Maximum line length from charArray: " + maxLineLength, 3);

    // Process words according to line limits in charArray
    debugLog("Starting first phase - processing words with specific line limits", 3);
    while (wordIndex < words.length && limitIndex < charArray.length) {
        var currentWord = words[wordIndex] + ' ';
        var currentLimit = charArray[limitIndex] + tolerance + 1;
        
        if (line.length + currentWord.length <= currentLimit) {
            line += currentWord;
            wordIndex++;
        } else {
            debugLog("Line limit reached, creating new line from: '" + line + "'", 3);
            lines.push(trimString(line));
            line = '';
            limitIndex++;
        }
    }

    // Handle remaining words with respect to max line length
    if (wordIndex < words.length) {
        debugLog("Starting second phase - handling " + (words.length - wordIndex) + 
                " remaining words", 3);
        
        // First add any partial line if it exists
        if (line.length > 0) {
            debugLog("Adding partial line before continuing: '" + line + "'", 3);
            lines.push(trimString(line));
            line = '';
        }
        
        // Process remaining words respecting max line length
        debugLog("Using max line length: " + maxLineLength + " (+ tolerance: " + 
                tolerance + ")", 3);
        
        while (wordIndex < words.length) {
            var currentWord = words[wordIndex] + ' ';

            if (line.length + currentWord.length <= maxLineLength + tolerance) {
                line += currentWord;
                wordIndex++;
                debugLog("Added word to current line, new line: '" + line + "'", 3);
            } else {
                if (line.length > 0) {
                    debugLog("Max line length reached, creating new line from: '" + line + "'", 3);
                    lines.push(trimString(line));
                    line = '';
                }
                // If a single word is longer than maxLineLength, 
                // we need to add it anyway to avoid infinite loop
                if (currentWord.length > maxLineLength + tolerance) {
                    debugLog("Word is longer than max line length, adding as separate line: '" + 
                            currentWord + "'", 3);
                    lines.push(trimString(currentWord));
                    wordIndex++;
                }
            }
        }
        
        // Add final line if anything remains
        if (line.length > 0) {
            debugLog("Adding final remaining line: '" + line + "'", 3);
            lines.push(trimString(line));
        }
    } else if (line.length > 0) {
        debugLog("All words processed, adding final line: '" + line + "'", 3);
        lines.push(trimString(line));
    }
    debugLog("Generated " + lines.length + " lines", 3);
    
    return lines;
}


/** titleBuilder function: ///
* Handling title frames: check if title has just one line,
* if so we don't do any line splitting.
----------------------------------------------*/
function titleBuilder(text, charArray) {
    // If the title has only one line, return it as is
    if (charArray.length === 1) {
        return text;
    }
    
    // Otherwise, use lineBuilder to split into lines (tolerance of 2)
    return lineBuilder(text, charArray, 2).join('\r');
}


/** Call main import function
 * --------------------------- */
	 initTranslateImport();