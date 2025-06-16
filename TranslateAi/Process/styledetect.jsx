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

// Could we look for explainer tag in same function?
function findSourceFrame(doc, keywords) {
    // debugLog("Identifying source frame by keywords: " + keywords.join(", "));
    var sourceIndex = -1;
    var sourceContents = "";
    var attributionIndex = -1;
    var attributionContents = "";
    
    // Get all text frames from the document
    var textFrames = doc.textFrames;
    debugLog("Scanning frames for source attribution and attribution marker");
    
    // Loop through each text frame
    for (var i = 0; i < textFrames.length; i++) {
        var frame = textFrames[i];
        
        // Skip if frame has no text content
        if (!frame.contents || frame.contents.length === 0) continue;
        
        // Check if this is an attribution frame (starts with *)
        if (frame.contents.charAt(0) === "*") {
            attributionIndex = i;
            attributionContents = frame.contents;
            debugLog("Attribution frame found at index " + i + ": '" + 
                    (attributionContents.length > 30 ? attributionContents.substring(0, 30) + "..." : attributionContents) + "'");
        }
        
        // Check if any keyword is present in the frame contents
        if (sourceIndex === -1) { // Only if we haven't found a source frame yet
            for (var j = 0; j < keywords.length; j++) {
                if (frame.contents.indexOf(keywords[j]) >= 0) {
                    sourceIndex = i;
                    sourceContents = frame.contents;
                    debugLog("Source frame found at index " + i + ": '" + 
                            (sourceContents.length > 30 ? sourceContents.substring(0, 30) + "..." : sourceContents) + "'");
                    break; // Exit the keywords loop once we find a match
                }
            }
        }
        
        // If we've found both frames, we can exit early
        if (sourceIndex >= 0 && attributionIndex >= 0) {
            break;
        }
    }
    
    return {
        source: sourceIndex >= 0 ? {
            index: sourceIndex,
            contents: sourceContents
        } : null,
        attribution: attributionIndex >= 0 ? {
            index: attributionIndex,
            contents: attributionContents
        } : null
    };
}


/**
 * Extract style information from a text range
 * @param {TextRange} textRange - The text range to analyze
 * @returns {Array} Array of style objects with range and properties
 */
function extractStyleInfo(textRange) {
    var styles = [];
    var currentStyle = null;
    var rangeStart = 0;
    
    // Process each character in the text range
    for (var i = 0; i < textRange.characters.length; i++) {
        var chars = textRange.characters[i];
        var charStyle = getcharacterStyle(chars);
        
        // If this is the first character or style changed
        if (!currentStyle || !areStylesEqual(currentStyle.style, charStyle)) {
            // If we have a previous style range, finalize it
            if (currentStyle) {
                currentStyle.end = i - 1;
                styles.push(currentStyle);
            }
            
            // Start a new style range
            currentStyle = {
                start: i,
                end: null,
                style: charStyle,
                text: sanitizeString(chars.contents)
            };
        } else {
            // Continue the current style range
            currentStyle.text += sanitizeString(chars.contents);
        }
    }
    
    // Finalize the last style range
    if (currentStyle) {
        currentStyle.end = textRange.characters.length - 1;
        styles.push(currentStyle);
    }
    
    return styles;
}

/**
 * Get style properties from a character
 * @param {TextRange} chars - The character to extract style from
 * @returns {Object} Style properties
 */
function getcharacterStyle(chars) {
    var style = {};
    
    try {
        // Font properties
        if (chars.textFont) style.fontName = chars.textFont.name;
        if (chars.fontSize) style.fontSize = chars.fontSize;
        
        // Character appearance
        if (chars.fillColor) style.fillColor = colorToHex(chars.fillColor);
        // if (chars.strokeWeight) style.strokeWeight = chars.strokeWeight;
        
        // Text styling
        style.bold = chars.textFont && chars.textFont.style.indexOf("Bold") >= 0;
        style.italic = chars.textFont && chars.textFont.style.indexOf("Italic") >= 0;

    } catch (e) {
        $.writeln("Warning: Error getting style for character: " + e.message);
    }
    
    return style;
}

/**
 * Compare two style objects for equality
 */
function areStylesEqual(style1, style2) {
    // Compare important style properties
    var properties = ["fontName", "fontSize", "fillColor", "bold", "italic"];
    
    for (var i = 0; i < properties.length; i++) {
        var prop = properties[i];
        if (style1[prop] !== style2[prop]) {
            return false;
        }
    }
    
    return true;
}

/**
 * Convert Illustrator color to hex string
 * @param {Color} color - Illustrator color object
 * @returns {String} Hex color string
 */
function colorToHex(color) {
    try {
        // Handle specific color types
        switch(color.typename) {
            case "CMYKColor":
                return cmykToHex(color.cyan, color.magenta, color.yellow, color.black);
                
            case "RGBColor":
                return rgbToHex(color.red, color.green, color.blue);
                
            case "SpotColor":
                // Get base color and apply tint
                var baseColor = color.spot.color;
                var tint = color.tint / 100; // Convert to 0-1 range
                
                if (baseColor.typename === "CMYKColor") {
                    // Simply scale the CMYK values by the tint
                    return cmykToHex(
                        baseColor.cyan * tint, 
                        baseColor.magenta * tint, 
                        baseColor.yellow * tint, 
                        baseColor.black * tint
                    );
                } 
                return colorToHex(baseColor); // Handle other base color types
                
            case "GrayColor":
                // Convert gray to RGB (all components equal)
                var val = Math.round(255 * (1 - color.gray/100));
                return rgbToHex(val, val, val);
                
            default:
                return "#000000"; // Default to black for unrecognized types
        }
    } catch (e) {
        $.writeln("Color error: " + e.message);
        return "#000000"; 
    }
}


// Define special Unicode markers as string constants
var STYLE_START_MARKER = "\u25B6"; // Unicode right-pointing triangle (▶)
var STYLE_END_MARKER = "\u25C0";   // Unicode left-pointing triangle (◀)

/**
 * Adds style markers to text content based on style information
 * @param {String} content - The original text content
 * @param {Array} styleInfo - Array of style objects with start/end positions
 * @return {String} - Text with style markers inserted
 */
function addStyleMarkers(content, styleInfo) {
    // First sort the style ranges by start position to ensure proper ordering
    styleInfo.sort(function(a, b) {
        return a.start - b.start;
    });
    
    // Create a new string with markers inserted
    var result = "";
    var lastEnd = 0;
    
    for (var i = 0; i < styleInfo.length; i++) {
        var style = styleInfo[i];
        
        // Validate style range
        if (style.start < 0 || style.end >= content.length || style.start > style.end) {
            $.writeln("Warning: Invalid style range " + style.start + "-" + style.end + 
                      " for content length " + content.length);
            continue;
        }
        
        // Check for gaps between style ranges
        if (style.start > lastEnd) {
            // Handle any text not covered by style info - use default style (index -1)
            result += "-1" + STYLE_START_MARKER + 
                     content.substring(lastEnd, style.start) + 
                     STYLE_END_MARKER + "-1 ";
        }
        
        // Add the style marker, the text content, and the closing marker
        // Add a space after the closing marker but not before it
        result += i + STYLE_START_MARKER + 
                 content.substring(style.start, style.end + 1) + 
                 STYLE_END_MARKER + i;
        
        // Add a space after this segment if it's not the last one
        if (i < styleInfo.length - 1) {
            result += " ";
        }
        
        // Update the last position processed
        lastEnd = style.end + 1;
    }
    
    // If there's remaining text after the last style, add it with default style
    if (lastEnd < content.length) {
        result += " -1" + STYLE_START_MARKER + 
                 content.substring(lastEnd) + 
                 STYLE_END_MARKER + "-1";
    }
    
    return result;
}


/**
 * Convert CMYK values directly to hex color string
 * @param {Number} c - Cyan value (0-100)
 * @param {Number} m - Magenta value (0-100)
 * @param {Number} y - Yellow value (0-100)
 * @param {Number} k - Black value (0-100)
 * @returns {String} Hex color string
 */
function cmykToHex(c, m, y, k) {
    // Normalize values and convert directly to RGB
    c = Math.min(100, Math.max(0, c)) / 100;
    m = Math.min(100, Math.max(0, m)) / 100;
    y = Math.min(100, Math.max(0, y)) / 100;
    k = Math.min(100, Math.max(0, k)) / 100;
    
    // Calculate RGB values
    var r = Math.round(255 * (1 - c) * (1 - k));
    var g = Math.round(255 * (1 - m) * (1 - k));
    var b = Math.round(255 * (1 - y) * (1 - k));
    
    return rgbToHex(r, g, b);
}

/**
 * Convert RGB values to hex string
 */
function rgbToHex(r, g, b) {
    // Ensure values are in valid range and convert to hex
    r = Math.min(255, Math.max(0, Math.round(r)));
    g = Math.min(255, Math.max(0, Math.round(g)));
    b = Math.min(255, Math.max(0, Math.round(b)));
    
    return "#" + 
           (r < 16 ? "0" : "") + r.toString(16) + 
           (g < 16 ? "0" : "") + g.toString(16) + 
           (b < 16 ? "0" : "") + b.toString(16);
}