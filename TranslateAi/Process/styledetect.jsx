/*****************************************************************
 * TranslateAi Style Detect Module v0.2 (2025) - Corin Faife
 * 
 * Helper module for detecting text styles in Adobe Illustrator documents.
 *****************************************************************/

/**
 * Find the title frame by identifying the frame with the largest font size
 * @param {Document} doc - The document to analyze
 * @return {Object} - Object containing the index and contents of the title frame
 */
function findTitleFrame(doc) {
    // debugLog("Identifying title frame by largest font size");
    var largestFontSize = 0;
    var titleIndex = -1;
    var titleContents = "";
        
    // Get all text frames from the document
    var textFrames = doc.textFrames;
    debugLog("Scanning " + textFrames.length + " text frames");
    
    // Find the frame with the largest font size
    for (var i = 0; i < textFrames.length; i++) {
        try {
            var frame = textFrames[i];
            
            // Skip if frame has no text content
            if (!frame.contents || frame.contents.length === 0) continue;
            
            // Get the font size from the text frame
            var fontSize = frame.textRange.characterAttributes.size;
            // debugLog("Frame " + i + " has font size: " + fontSize + " with content: '" + 
            //          (frame.contents.length > 30 ? frame.contents.substring(0, 30) + "..." : frame.contents) + "'");
            
            // Update if this is the largest font size so far
            if (fontSize > largestFontSize) {
                largestFontSize = fontSize;
                titleIndex = i;
                titleContents = frame.contents;
                // debugLog("New largest font size: " + largestFontSize + " in frame " + i);
            }
        } catch (frameError) {
            debugLog("Error processing frame " + i + ": " + frameError.message, 1);
        }
    }
    
    if (titleIndex >= 0) {
        // debugLog("Title frame found: index " + titleIndex + ", font size " + largestFontSize);
        return {
            index: titleIndex,
            contents: titleContents,
            fontSize: largestFontSize
        };
    } else {
        debugLog("No valid title frame found");
        return null;
    }
}

