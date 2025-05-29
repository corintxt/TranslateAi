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
                text: chars.contents
            };
        } else {
            // Continue the current style range
            currentStyle.text += chars.contents;
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
 * Convert Illustrator color to hex string
 * @param {Color} color - Illustrator color object
 * @returns {String} Hex color string
 */
function colorToHex(color) {
    try {
        // Different color models need different handling
        if (color.typename === "RGBColor") {
            return rgbToHex(color.red, color.green, color.blue);
        } else if (color.typename === "CMYKColor") {
            // For simplicity convert CMYK to approximate RGB
            var rgb = cmykToRgb(color.cyan, color.magenta, color.yellow, color.black);
            return rgbToHex(rgb.r, rgb.g, rgb.b);
        } else {
            return "unknown";
        }
    } catch (e) {
        return "error";
    }
}

/**
 * Convert RGB values to hex string
 */
function rgbToHex(r, g, b) {
    function componentToHex(c) {
        var hex = Math.round(c).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

/**
 * Convert CMYK to RGB (approximate)
 */
function cmykToRgb(c, m, y, k) {
    c = c / 100;
    m = m / 100;
    y = y / 100;
    k = k / 100;
    
    var r = 1 - Math.min(1, c * (1 - k) + k);
    var g = 1 - Math.min(1, m * (1 - k) + k);
    var b = 1 - Math.min(1, y * (1 - k) + k);
    
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
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
