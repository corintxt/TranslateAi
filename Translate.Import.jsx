/*****************************************************************
 * TextConvert.Import v 2.0 (2025) - Corin Faife - https://corinfaife.co/
 * 
 * Adapted from: 
 * ==============
 * TextConvert.Import 1.1 - by Bramus! - https://www.bram.us/
 *****************************************************************/

// Load JSON polyfill (doesn't natively exist in Illustrator).
#include "jsonparse.jsx"

var jsonData; // Global variable to hold the JSON data
var numReplaced	= 0;

/** TextConvert.Import Init function
 * -------------------------------------------------------------
 */
	 function initTextConvertImport() {
		// Linefeed stuff (-currently unused-)
		if ($.os.search(/windows/i) != -1)
			operatingSystem = "windows";
		else
			operatingSystem = "mac";

		// Do we have a document open?
		if (app.documents.length === 0) {
			alert("Please open a file", "TextConvert.Export Error", true);
			return;
		}

		// More than one document open!
		if (app.documents.length > 1) {
			var runMultiple = confirm("TextConvert.Import has detected Multiple Files.\nDo you wish to run TextConvert.Import on all opened files?", true, "TextConvert.Import");
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
			// Fetch translations
			// var translationFile = '???' //WIN
			var translationFile = "/tmp/" + docs[i].name + ".json"; //MAC
			devTranslationFile = "/Users/cfaife/Documents/MATERIALS/Code/Illustrator/TranslateText/test/" + docs[i].name + ".json";
			fetchTranslations(devTranslationFile)

			// We have translations
			if (jsonData && jsonData.frames) {
				// Set active document
				alert("Processing " + docs[i].name, "TextConvert.Import", true);
				app.activeDocument = docs[i];
				// Now apply the translations
				textFrameImport(app.activeDocument, '/');
				// update numReplaced
				numReplaced++;
			} else {
				alert("No translations found", "TextConvert.Import", true);
			}
		}
		// Give notice of export
		alert("Changed the contents of " + numReplaced + " files in total", "TextConvert.Import");
	}

/**
 * fetchTranslations (v2: JSON)
   * ---------------------------
 */
	function fetchTranslations(filePath) {
		// Create fileref
		var fileIn = new File(filePath);
		
		// Check if file exists
		if (!fileIn.exists) {
			alert("No translation file found.", "TextConvert.Import", true);
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
			// The tKeys and tValues arrays are no longer needed
		} catch(e) {
			alert("Error parsing JSON file: " + e.message, "TextConvert.Import", true);
		}
	}

  /**
   * textFrameImport: 
   * Import translated strings into the text frames from JSON
   * -------------------------------------------------------------
 */
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
            
            // Optional: Update frame position if needed
            // currentFrame.position = frameData.anchor;
        }
    }
}

// LineBuilder function:
// We use this to split the text into lines that fit into the text frame
// when re-importing our translated text.
// the character limit array is a property of each text frame that we will 
// read in from the JSON file
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
        
        if (line.length + currentWord.length <= charArray[limitIndex]) {
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

/** Call TextConvert.Import Init function
 * --------------------------------------
 */
	 initTextConvertImport();