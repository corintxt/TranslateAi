/*****************************************************************
 * TranslateAi.Import v 2.0 (2025) - Corin Faife - https://corinfaife.co/
 * 
 * Adapted from: 
 * ==============
 * TextConvert.Import 1.1 (2016) - by Bramus! - https://www.bram.us/
 *****************************************************************/

// Load dependencies from script directory
var scriptPath = File($.fileName).parent.fsName;
var helpers = scriptPath + "/Scripts";
$.evalFile(helpers + "/jsonparse.jsx"); // JSON polyfill

var jsonData; // Declare global
var numReplaced	= 0;

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
        alert("Please open a file", "TranslateAi.Export Error", true);
        return;
    }
    // More than one document open
    if (app.documents.length > 1) {
        var runMultiple = confirm("Translate.Import has detected multiple files.\nDo you want to import text to all opened files?", true, "Translate.Import");
        if (runMultiple === true) {
            docs	= app.documents;
        } else {
            docs	= [app.activeDocument];
        }
    // Only one document open
    } else {
        runMultiple 	= false;
        docs 			= [app.activeDocument];
    }
    // Loop all documents
    for (var i = 0; i < docs.length; i++){
        // Get document name without .ai extension
        var docName = docs[i].name.replace(/\.ai$/i, "");
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
            // Set active document
            alert("Processing " + docs[i].name, "Translate.Import", true);
            app.activeDocument = docs[i];
            // Apply the translations
            textFrameImport(app.activeDocument);
            // update numReplaced
            numReplaced++;
        } else {
            alert("No translations found for " + docs[i].name, "Translate.Import", true);
        }
    }
    // Give notice of changes
    alert("Changed the contents of " + numReplaced + " files in total", "Translate.Import");
}

/** fetchTranslations (v2: reads from JSON)
* --------------------------------------- */
function fetchTranslations(filePath) {
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
    // Get all text frames in document
    var frames = el.textFrames;
    
    // Loop through frames in reverse order (since frame indices are zero-based)
    for (var frameCount = frames.length; frameCount > 0; frameCount--) {
        var frameIndex = frameCount - 1;
        var currentFrame = frames[frameIndex];
        
        // Get the corresponding frame data from JSON
        var frameData = jsonData.frames[frameIndex];
        
        // If we have data for this frame
        if (frameData) {
            // Use lineBuilder to split content into lines
            var lines = lineBuilder(frameData.contents, frameData.lineChars);
            // Join the lines with line breaks and update frame contents
            currentFrame.contents = lines.join('\r'); // return character needs to change for Mac/Windows?
            // Optional: Update frame position if needed?
            // currentFrame.position = frameData.anchor;
        }
    }
}

/** LineBuilder function: ///
* We use this to split translated text into lines that fit the text frame.
* The character limit array is a property of each text frame that we will 
* read in from the JSON file
----------------------------------------------*/
function lineBuilder(text, charArray) {
    function trimString(str) {
        return str.replace(/^\s+|\s+$/g, '');
    }
    
    var words = text.split(' ');
    var lines = [];
    var line = '';
    var wordIndex = 0;
    var limitIndex = 0;
    var maxLineLength = Math.max.apply(null, charArray);

    // Process words according to line limits in charArray
    while (wordIndex < words.length && limitIndex < charArray.length) {
        var currentWord = words[wordIndex] + ' ';
        
        if (line.length + currentWord.length <= charArray[limitIndex]+1) {
            line += currentWord;
            wordIndex++;
        } else {
            lines.push(trimString(line));
            line = '';
            limitIndex++;
        }
    }

    // Handle remaining words with respect to max line length
    if (wordIndex < words.length) {
        // First add any partial line if it exists
        if (line.length > 0) {
            lines.push(trimString(line));
            line = '';
        }
        
        // Process remaining words respecting max line length
        while (wordIndex < words.length) {
            var currentWord = words[wordIndex] + ' ';
            
            if (line.length + currentWord.length <= maxLineLength) {
                line += currentWord;
                wordIndex++;
            } else {
                if (line.length > 0) {
                    lines.push(trimString(line));
                    line = '';
                }
                // If a single word is longer than maxLineLength, 
                // we need to add it anyway to avoid infinite loop
                if (currentWord.length > maxLineLength) {
                    lines.push(trimString(currentWord));
                    wordIndex++;
                }
            }
        }
        
        // Add final line if anything remains
        if (line.length > 0) {
            lines.push(trimString(line));
        }
    } else if (line.length > 0) {
        lines.push(trimString(line));
    }

    return lines;
}

/** Call main import function
 * --------------------------- */
	 initTranslateImport();