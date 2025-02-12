/*****************************************************************
 * Translate.Import v 1.1 (2025) - Corin Faife - https://corinfaife.co/
 * 
 * Adapted from: 
 * ==============
 * TextConvert.Import 1.1 - by Bramus! - https://www.bram.us/
 *
 *****************************************************************
 *
 * Copyright (c) 2016 Bram(us) Van Damme - https://www.bram.us/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished
 * to do so, subject to the following conditions:
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

	/**
	 * Array Fixes: indexOf and remove don't natively exist!
	 * -------------------------------------------------------------
	 */

	function Array_IndexOf (arr, elem){
		var len = arr.length;

		var from = Number(arguments[2]) || 0;
		from = (from < 0) ? Math.ceil(from) : Math.floor(from);
		if (from < 0) {
			from += len;
		}

		for (; from < len; from++) {
			if (from in arr && arr[from] === elem) {
				return from;
			}
		}
		return -1;
	}

	function Array_RemoveAtIndex(arr, idx){
		if (idx !== -1) {
			arr.splice(idx, 1);
		}
	}

/** Arrays holding the translations (keys and values)
 * -------------------------------------------------------------
 */
	var tKeys 	= [];
	var tValues	= [];
	var numReplaced	= 0;

/** TextConvert.Import Init function
 * -------------------------------------------------------------
 */
	 function initTextConvertImport() {
		// Linefeed stuff
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
			if (tKeys.length > 0){
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
		// Reset translation arrays
		tKeys = [];
		tValues = [];

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
			var jsonData = JSON.parse(jsonString);
			
			// Extract frames data into translation arrays
			for (var frameIndex in jsonData.frames) {
				if (jsonData.frames.hasOwnProperty(frameIndex)) {
					tKeys.push(frameIndex);
					tValues.push(jsonData.frames[frameIndex].contents);
				}
			}
		} catch(e) {
			alert("Error parsing JSON file: " + e.message, "TextConvert.Import", true);
		}
	}

  /**
   * TextImport Core Function
   * -------------------------------------------------------------
 */
  function textFrameImport(el, path) {
    // Get the frames
    var frames = el.textFrames;
    
    // Loop through frames
    for (var frameCount = frames.length; frameCount > 0; frameCount--) {
        var frameIndex = frameCount-1;
        var currentFrame = frames[frameIndex];
        
        // Get position in array of the frame index
        var pos = Array_IndexOf(tKeys, frameIndex.toString());
        
        // If we have a translation for this frame
        if (pos !== -1) {
            // Update contents with translated string
            currentFrame.contents = tValues[pos];
            
            // Clean up arrays (speed improvement)
            Array_RemoveAtIndex(tKeys, pos);
            Array_RemoveAtIndex(tValues, pos);
        }
    }
}

/** Call TextConvert.Import Init function
 * --------------------------------------
 */
	 initTextConvertImport();