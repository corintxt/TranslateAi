/*****************************************************************
 * TextConvert.Import v 1.2 (2024) - Corin Faife
 * 
 * forked from: 
 * ===============================
 * TextConvert.Import 1.1 - by Bramus! - https://www.bram.us/
 *
 * v 1.1 - 2016.02.17 - UTF-8 support
 *                      Update license to MIT License
 *
 * v 1.0 - 2008.10.30 - Measure twice, cut once ;-)
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


/**
 *  Arrays holding the translations (keys and values)
 * -------------------------------------------------------------
 */

	var tKeys 	= [];
	var tValues	= [];
	var numReplaced	= 0;


/**
 *  TextConvert.Import Init function
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
			var translationFile = '/tmp/translation.txt' //MAC
			goFetchTranslations(translationFile)

			// We have translations
			if (tKeys.length > 0){
				// Set active document
				alert("Processing " + docs[i].name, "TextConvert.Import", true);
				app.activeDocument = docs[i];

				// Now apply the translations
				goTextImport3(app.activeDocument, '/');

				// update numReplaced
				numReplaced++;

			}

		}

		// Give notice of export
		alert("Changed the contents of " + numReplaced + " files in total", "TextConvert.Import");
	}

/**
 * goFetchTranslations
   * -------------------------------------------------------------
 */

	 function goFetchTranslations(filePath){

		 // reset translation arrays
		tKeys 	= [];
		tValues	= [];

		// create fileref
		var fileIn	= new File(filePath);

		// File with translations doesn't exist, no need to open the file
		if (!fileIn.exists) {
			alert("No translation file found.", "TextConvert.Import", true);
		}

		// Set encoding
		fileIn.encoding = "UTF8"

		// open for read
		fileIn.open("r", "TEXT", "????");

		// vars used in loop
		var tagOpen = false;		// Are we in tag?
		var tKey = '';				// translation key
		var tVal = '';				// translation value

		// loop all lines of the document
		while (!fileIn.eof) {

			// fetch lineContents
			var line = fileIn.readln();

			// Has "[BEGIN" tag
			if (line.indexOf('[----- ') !== -1){
				// fetch Key
				tKey = line.substr(7, line.length - 9);

				// clear Value
				tVal = '';

				// set tagOpen to true
				tagOpen = true;

			}

			// Has "[END" tag
			else if (line.indexOf('[=== ') !== -1){

				// if it's the closing line of our open key
				if (tKey == line.substr(5, line.length - 7)){

					// store Key & Value
					tKeys.push(tKey);
					tValues.push(tVal);

					// clear tKey & tVal
					tKey = '';
					tVal = '';

					// set tagOpen to false
					tagOpen = false;

				// not the closing tag, add it
				} else {
					if (tagOpen) {
						tVal += line + '\r';
					}
				}

			}

			// other: if tagOpen, add to value
			else if (tagOpen) {
				tVal += line + '\r';
			}
		}

		// close the file
		fileIn.close();

	}


  /**
   * TextImport Core Function
   * -------------------------------------------------------------
 */

	function goTextImport3(el, path){

		// debug
		// alert(tKeys);

			// Get the frames
			var frames = el.textFrames;
					
			// Loop
			for (var frameCount = frames.length; frameCount > 0; frameCount--){
				
				// curentFrame ref
				var frameIndex = frameCount-1;
				var currentFrame = frames[frameIndex];

					// get position in array of the string to translate
					var pos = Array_IndexOf(tKeys, path + frameIndex);

					// string found
					if (pos !== -1){

						// update contents with translated string
						currentFrame.contents = tValues[pos];

						// clean up tKeys & tValues array (speed improv!)
						Array_RemoveAtIndex(tKeys, pos);
						Array_RemoveAtIndex(tValues, pos);

					}
		}
	}


/**
 *  TextConvert.Export Boot her up
 * -------------------------------------------------------------
 */

	 initTextConvertImport();