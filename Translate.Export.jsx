/*****************************************************************
 * TextConvert.Export v 2.0 (2025) - by Corin Faife - Corin Faife - https://corinfaife.co/
 * 
 * Adapted from: 
 * ==============
 * TextConvert.Export 1.1 - by Bramus! - https://www.bram.us/
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
// Load JSON polyfill.
#include "jsonparse.jsx"

// TODO: Set target languate with dropdown & dialogue box;
// consult scripts here for guidance: https://github.com/creold/illustrator-scripts

/** TextConvert Export & Translate function
 * ----------------------------------------*/
function initTextConvertTranslate() {
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

	// More than one document open?
	// TODO: Add support for multiple files
	if (app.documents.length > 1) {
		var runMultiple = confirm("TextConvert.Translate has detected Multiple Files.\nDo you wish to run TextConvert.Export on all opened files?", true, "TextConvert.Export");
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
		// set temp file location (Mac)
		filePath = "/tmp/translateinput.json";
		devPath = "/Users/cfaife/Documents/MATERIALS/Code/Illustrator/TranslateText/test/input.json";
		// set temp file location (Win) ?
		// filePath = Folder.temp + '/translate_input.txt';
		// Write text to file
		writeTextToFile(devPath, docs[i]);
	}

	// Post processing: give notice (multiple) or open file (single)
	if (runMultiple === true) {
		alert("Parsed " + documents.length + " files;\nFiles were saved in your documents folder", "TextExport");
	} else {
		// We don't need to do anything, why is this condition here?
		// Was something here but got deleted?
	}
	// Execute command script
	executeCommandScript();
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
/** Text export into JSON
 * -----------------------*/
function textFrameExport(el, fileOut) {
    var frames = el.textFrames;
    var jsonData = {
        frames: {}
    };
    
    for (var frameCount = frames.length; frameCount > 0; frameCount--) {
        var frameIndex = frameCount-1;
        var frame = frames[frameIndex];
		// Remove any line breaks from contents before writing to JSON
        var contentString = frame.textRange.contents.toString().replace(/[\r\n]+/g, '');
		// Write frame properties to JSON object with index as key
		// => docs on frame properties: https://ai-scripting.docsforadobe.dev/jsobjref/TextFrameItem.html
		// Get reference to all lines in range
		var lines = frame.textRange.lines;
		var lineCount = lines.length;
		// Get character count for each line
		var characters = [];
		for (var i = 0; i < lineCount; i++) {
			var line = lines[i];
			var lineCharCount = line.characters.length;
			characters.push(lineCharCount);
		}
		// Get longest character count of all lines in frame
		var longestLine = 0;
		for (var i = 0; i < characters.length; i++) {
			if (characters[i] > longestLine) {
				longestLine = characters[i];
			}
		}
		// Add frame data to JSON object
		jsonData.frames[frameIndex] = {
			anchor: frame.anchor,
            contents: contentString,
			lineCount: frame.textRange.lines.length,
			wordCount: frame.textRange.words.length,
			charCount: frame.textRange.characters.length,
			longestLine: longestLine
        };
    }
    
    fileOut.writeln(JSON.stringify(jsonData, null, 2));
}

/** Invoke command script
 * ----------------------*/
function executeCommandScript() {
	// Mac command
	var cfileName = '/pytranslate.command';
	// Win command
	// var cfileName = '/translate.bat'
	var commandFile = File(File($.fileName).parent.fsName + cfileName);
	commandFile.execute()
}

/* Call script main function
 * --------------------------*/
initTextConvertTranslate();