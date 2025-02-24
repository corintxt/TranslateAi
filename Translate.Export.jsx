/*****************************************************************
 * TextConvert.Export v 2.0 (2025) - by Corin Faife - https://corinfaife.co/
 * 
 * Adapted from: 
 * =========================
 * TextConvert.Export 1.1 - by Bramus! - https://www.bram.us/
 *****************************************************************/

// Load dependencies
#include "jsonparse.jsx" // JSON polyfill
#include "languageselect.jsx" // Language selection dialog

var runMultiple = false;
var callAPI = true; // Set false to export JSON without calling API
var targetLanguage; // Will be set by dialog

// TODO: Set target languate with dropdown & dialogue box;
// consult scripts here for guidance: https://github.com/creold/illustrator-scripts

/** TextConvert Export & Translate function
 * ----------------------------------------*/
function initTextConvertTranslate() {
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
		alert("Please open a file", "TextConvert.Export Error", true);
		return;
	}

	// More than one document open?
	// TODO: Add support for multiple files
	if (app.documents.length > 1) {
		runMultiple = confirm("TextConvert.Translate has detected Multiple Files.\nDo you wish to run TextConvert.Export on all opened files?", true, "TextConvert.Export");
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
		// MAC: set temp file location
		// Auto set filePath and fileName
		// filePath = Folder.myDocuments + '/TextConvert-' + docs[i].name + '.txt';

		// Remove .ai extension before writing
		var docName = docs[i].name.replace(/\.ai$/i, "");
		filePath = "/tmp/" + docName + ".json";
		devPath = "/Users/cfaife/Documents/MATERIALS/Code/Illustrator/TranslateText/test/" + docName + ".json";
		
		// WINDOWS: set temp file location?
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
             .replace(/[\r\n]+/g, '')  // Remove line breaks
             .replace(/"/g, '\\"');     // Escape quotes
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
            
            // Enhanced debugging info
            $.writeln("\n--- Frame " + frameIndex + " ---");
            $.writeln("Kind: " + frame.kind);
            $.writeln("Type: " + frame.typename);
            // $.writeln("Contents: " + frame.contents);
            
            // Check if textRange is available
            if (!frame.textRange) {
                throw new Error("No textRange available for this frame");
            }
		
			// Remove any line breaks from contents before writing to JSON
			var contentString = sanitizeString(frame.textRange.contents);
			// Write frame properties to JSON object with index as key
			// => docs on frame properties: https://ai-scripting.docsforadobe.dev/jsobjref/TextFrameItem.html
			// Get reference to all lines in range
			var lines = frame.textRange.lines; // could we put this directly into jsonData?
			var lineCount = lines.length;
			// Get character count for each line
			var characters = [];
			for (var i = 0; i < lineCount; i++) {
				var line = lines[i];
				var lineCharCount = line.characters.length;
				characters.push(lineCharCount);
			}
			// Add frame data to JSON object
			jsonData.frames[frameIndex] = {
				anchor: frame.anchor,
				contents: contentString,
				lineCount: lineCount,
				lineChars:characters,
				wordCount: frame.textRange.words.length,
				charCount: frame.textRange.characters.length
			};

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
    var cfileName = '/pytranslate.command';
    var commandFile = File(File($.fileName).parent.fsName + cfileName);
    
    if (commandFile.exists) {        
        // Create a temporary file to store document name(s)
        var tempFile = new File("/tmp/current_doc.txt");
        tempFile.encoding = "UTF8";
        tempFile.lineFeed = "Unix"; // Force Unix line endings
        tempFile.open("w");
        
        // Write all document names if running in multiple mode
        if (runMultiple === true) {
            for (var i = 0; i < docs.length; i++) {
                // Remove .ai extension before writing
                var docName = docs[i].name.replace(/\.ai$/i, "");
                tempFile.writeln(docName);
            }
        } else {
            // Remove .ai extension before writing
            var docName = app.activeDocument.name.replace(/\.ai$/i, "");
            tempFile.writeln(docName);
        }
        tempFile.close();
        
        // Execute command file
        commandFile.execute();
    } else {
        alert("Command file not found: " + commandFile.fsName);
    }
}

/* Call script main function
 * --------------------------*/
initTextConvertTranslate();