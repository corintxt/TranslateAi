/*****************************************************************
 * TextConvert.Import v 2.0 (2025) - Corin Faife - https://corinfaife.co/
 * 
 * Adapted from: 
 * ==============
 * TextConvert.Import 1.1 - by Bramus! - https://www.bram.us/
 *
 *****************************************************************
 *
 * Original Copyright (c) 2016 Bram(us) Van Damme - https://www.bram.us/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished
 * to do so, subject to the follow ing conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
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
			fileLineFeed = "windows";
		else
			fileLineFeed = "macintosh";

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
			var translationFile = '/tmp/translation.json' //MAC
			var devTranslationFile = '/Users/cfaife/Documents/MATERIALS/Code/Illustrator/TranslateText/test/merged.json' //MAC
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
            var lines = lineBuilder(frameData.contents, frameData.longestLine);
            
            // Join the lines with line breaks and update frame contents
            currentFrame.contents = lines.join('\r'); // return character needs to change for Mac/Windows?
            
            // Optional: Update frame position if needed
            // currentFrame.position = frameData.anchor;
        }
    }
}

function lineBuilder(text, maxCharCount) {
	// Split text into words
	var words = text.split(' ');
	// Init line array
	var lines = [];
	// Init line
	var line = '';
	// Loop through words
	for (var i = 0; i < words.length; i++) {
		// Add word to line
		line += words[i] + ' ';
		// If line is too long
		if (line.length > maxCharCount - 3) {
			// Add line to lines array
			lines.push(line);
			// Reset line
			line = '';
		}
	}
	// Add last line
	lines.push(line);
	// Return lines
	return lines;
}

/** Call TextConvert.Import Init function
 * --------------------------------------
 */
	 initTextConvertImport();