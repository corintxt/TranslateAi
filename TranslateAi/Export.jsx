/*****************************************************************
 * TranslateAi.Export v 2.0 (2025) - by Corin Faife - https://corinfaife.co/
 * 
 * Adapted from: 
 * =========================
 * TextConvert.Export 1.1 (2016) - by Bramus! - https://www.bram.us/
 *****************************************************************/

// Load dependencies from TranslateAi directory
var scriptPath = File($.fileName).parent.fsName;
var helpers = scriptPath + "/Process";
$.evalFile(helpers + "/jsonparse.jsx"); // JSON polyfill
$.evalFile(helpers + "/languageselect.jsx"); // Language selection dialog

var runMultiple = false;
var callAPI = true; // Set false to export JSON without calling API
var targetLanguage; // Declare global - will be set by dialog

/** Translate Export function
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
		alert("Please open a file", "Translate.Export Error", true);
		return;
	}
	// More than one document open?
	if (app.documents.length > 1) {
		runMultiple = confirm("Translate.Export has detected multiple files.\nDo you want to export text from all open files?", true, "Translate.Export");
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
        // Remove .ai extension before writing
        var docName = docs[i].name.replace(/\.ai$/i, "");
        
        // Use platform-specific separator for file paths
        var separator = ($.os.search(/windows/i) != -1) ? '\\' : '/';
        
        // Set file location (cross-platform)
        filePath = Folder.myDocuments + separator + "TranslateAi" + separator + docName + ".json";
        
        // Optional dev path for testing
        devPath = File($.fileName).parent.fsName + separator + "test" + separator + docName + ".json";
        
        writeTextToFile(filePath, docs[i]);
    }

	// Post processing: give notice (multiple) or open file (single)
	if (runMultiple === true) {
		alert("Exported text from " + documents.length + " files.\nFiles were saved in your documents folder. Click OK to start translation.", "TextExport");
	} else {
		alert("Exported text from " + app.activeDocument.name + "\nClick OK to start translation.", "TextExport");
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
		
			// Remove any line breaks from contents before writing to JSON
			var contentString = sanitizeString(frame.textRange.contents);
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
			// Add frame data to JSON object
			jsonData.frames[frameIndex] = {
				anchor: frame.anchor,
				contents: contentString,
				lineCount: lineCount,
				lineChars:characters,
				wordCount: frame.textRange.words.length,
				charCount: frame.textRange.characters.length
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
        
        // Rest of the code remains the same
        if (runMultiple === true) {
            for (var i = 0; i < docs.length; i++) {
                var docName = docs[i].name.replace(/\.ai$/i, "");
                tempFile.writeln(docName);
            }
        } else {
            var docName = app.activeDocument.name.replace(/\.ai$/i, "");
            tempFile.writeln(docName);
        }
        tempFile.close();
        
        commandFile.execute();
    } else {
        alert("Command file not found: " + commandFile.fsName);
    }
}

/* Call main function 
 * --------------------*/
initTranslateTranslate();