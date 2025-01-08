/*****************************************************************
 * TextConvert.Translate v 1.0 (2025) - by Corin Faife
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
		// Set filePath and fileName
		// create temp file (Mac)
		filePath = "/tmp/translate_args.txt";
		// create temp file (Win) ?
		// filePath = Folder.temp + '/translate_args.txt'
		
		// create outfile
		var fileOut	= new File(filePath);
		// set linefeed
		fileOut.linefeed = fileLineFeed;
		// set encoding
		fileOut.encoding = "UTF8"
		// open for write
		fileOut.open("w", "TEXT", "????");
		// Set active Illustrator document
		app.activeDocument = docs[i];
		// Extract text frames from active document
		goTextExport3(app.activeDocument, fileOut, '/');
		// close the file
		fileOut.close();
	}

	// Post processing: give notice (multiple) or open file (single)
	if (runMultiple === true) {
		alert("Parsed " + documents.length + " files;\nFiles were saved in your documents folder", "TextExport");
	} else {
		// // Open the new text file if "openExport" is set to true in config
		// if (openExport){
		// 	fileOut.execute();
		// }
		// else {
		// 	//Otherwise we don't need to do anything
		// }
	}

	// Execute command script
	executeCommandScript();
}

/** TextExtraction
 * ----------------*/
function goTextExport3(el, fileOut, path) {
	// Get the frames
	var frames = el.textFrames;
	// Loop
	for (var frameCount = frames.length; frameCount > 0; frameCount--){
		// curentFrame ref
		var frameIndex = frameCount-1;
		var currentFrame = frames[frameIndex];
		// fileOut.writeln(separator);
		fileOut.writeln('[----- ' + path + frameIndex + ' ]');
		fileOut.writeln(currentFrame.contents);
		fileOut.writeln('[=== ' + path + frameIndex + ' ]');
		fileOut.writeln('');
	}
}

/** Invoke command script
 * ----------------------*/
function executeCommandScript() {
	var commandFile = File(File($.fileName).parent.fsName + '/translate.command');
	commandFile.execute()
}

/* Call script main function
 * --------------------------*/
initTextConvertTranslate();