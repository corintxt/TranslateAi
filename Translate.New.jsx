/*****************************************************************
 * Translate.Text v 1.0 (2025) - by Corin Faife - Corin Faife - https://corinfaife.co/
 * 
 * Adapted from: 
 * ===============================
 * TextConvert.Export 1.1 - by Bramus! - https://www.bram.us/
 *
 * v 1.1 - 2016.02.17 - UTF-8 support
 *                      Update license to MIT License
 *
 * v 1.0 - 2008.10.30 - (based upon TextExport 1.3, without the "save dialog" option)
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
// Load JSON polyfill.
#include "jsonparse.jsx"

 /** CONFIG ////
 * Currently are writing these arguments into the text input file
 * because Illustrator doesn't support passing arguments to command scripts
 */
// TODO: Replace with dropdown & dialogue box;
// consult scripts here for guidance: https://github.com/creold/illustrator-scripts
// Set target language
var targetLanguage = 'English';

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
		filePath = "/tmp/translateInput.json";
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
	// executeCommandScript();
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

/** TextExtraction
 * ----------------*/
// This is what we need to modify to write JSON
// And also extract more information from text frames
function oldTextFrameExport(el, fileOut) {
	// Get the frames
	var frames = el.textFrames;
	// Loop (will need to be modified to write JSON)
	for (var frameCount = frames.length; frameCount > 0; frameCount--){
		// curentFrame ref
		var frameIndex = frameCount-1;
		var currentFrame = frames[frameIndex];
		// fileOut.writeln(separator);
		fileOut.writeln('[----- ' + frameIndex + ' ]');
		fileOut.writeln(currentFrame.contents);
		fileOut.writeln('[=== ' + frameIndex + ' ]');
		fileOut.writeln('');
	}
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
        jsonData.frames[frameIndex] = {
            contents: frames[frameIndex].contents
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