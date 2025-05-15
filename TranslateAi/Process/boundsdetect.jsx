/*****************************************************************
 * TranslateAi Bounds Detection Module v1.1 (2025) - Corin Faife
 * 
 * Checks for overlap between text frames in an Adobe Illustrator document.
 *****************************************************************/

/**
 * Visualizes the bounds of a text frame
 * @param {TextFrame} textFrame - The text frame to visualize
 * @param {Layer} layer - The layer to add visualization to
 * @param {Number} index - The index of the frame (for labeling)
 */
function visualizeFrameBounds(textFrame, layer, index) {
    try {
        if (!textFrame || !textFrame.geometricBounds) {
            // debugLog("Warning: Invalid frame at index " + index);
            return;
        }
        
        var bounds = textFrame.geometricBounds; 
        // Order:[LEFT, TOP, RIGHT, BOTTOM]
        var left = bounds[0];
        var top = bounds[1];
        var right = bounds[2];
        var bottom = bounds[3];
        
        // Calculate width and height
        var width = right - left;
        var height = top - bottom;
        
        // Create rectangle using direct bounds
        var rect = layer.pathItems.rectangle(
            top, left, width, height
        );
        rect.stroked = true;
        rect.filled = false;
        rect.strokeColor = getBoundColor();
        rect.strokeWidth = 0.5;
        
        // Add a label with the frame index
        var label = layer.textFrames.add();
        label.contents = index.toString();
        label.position = [left, top - 5];
        label.textRange.characterAttributes.fillColor = getBoundColor();
        label.textRange.characterAttributes.size = 8;
        
    } catch (e) {
        // debugLog("Error visualizing frame " + index + ": " + e.message, 1);
    }
}


/**
 * Checks for overlaps between text frames and visualizes them
 * @param {Array} textFrames - Array of text frames to check
 */
function checkForOverlaps(textFrames) {
        var doc = app.activeDocument;
        var overlaps = [];
        // debugLog("Checking for overlaps among " + textFrames.length + " text frames");
        
        // Create a layer for visualizing overlaps
        try {
            var existingLayer = doc.layers.getByName("FrameOverlaps");
            existingLayer.remove();
            // debugLog("Removed existing FrameOverlaps layer");
        } catch (e) {
            // debugLog("No existing FrameOverlaps layer found");
        }
        
        var overlapLayer = createLayer(doc, "FrameOverlaps");
        overlapLayer.zOrder(ZOrderMethod.BRINGTOFRONT);
        
        // Check each pair of frames for overlaps
        for (var i = 0; i < textFrames.length; i++) {
            if (!textFrames[i] || !textFrames[i].geometricBounds) continue;
            
            var bounds1 = textFrames[i].geometricBounds;
            var left1 = bounds1[0];
            var top1 = bounds1[1];
            var right1 = bounds1[2];
            var bottom1 = bounds1[3];
            
            for (var j = i + 1; j < textFrames.length; j++) {
                if (!textFrames[j] || !textFrames[j].geometricBounds) continue;
                
                var bounds2 = textFrames[j].geometricBounds;
                var left2 = bounds2[0];
                var top2 = bounds2[1];
                var right2 = bounds2[2];
                var bottom2 = bounds2[3];
                
                // Check if frames overlap
                if (left1 < right2 && right1 > left2 && top1 > bottom2 && bottom1 < top2) {
                    // Calculate overlap area
                    var overlapLeft = Math.max(left1, left2);
                    var overlapRight = Math.min(right1, right2);
                    var overlapTop = Math.min(top1, top2);
                    var overlapBottom = Math.max(bottom1, bottom2);
                    var overlapWidth = overlapRight - overlapLeft;
                    var overlapHeight = overlapTop - overlapBottom;
                    
                    // Create visualization of overlap
                    try {
                        var rect = overlapLayer.pathItems.rectangle(
                            overlapTop,
                            overlapLeft,
                            overlapWidth,
                            overlapHeight
                        );
                        rect.stroked = true;
                        rect.filled = true;
                        rect.fillColor = getOverlapColor();
                        rect.strokeColor = getOverlapStrokeColor();
                        rect.strokeWidth = 1;
                        rect.opacity = 50;
                        
                        // Add overlap info to array
                        overlaps.push({
                            frame1: i,
                            frame2: j,
                            area: overlapWidth * overlapHeight
                        });
                        
                        // debugLog("Overlap detected between frames " + i + " and " + j);
                    } catch (rectErr) {
                        // debugLog("Error creating overlap visualization: " + rectErr);
                    }
                }
            }
        }
        // debugLog("Found " + overlaps.length + " overlapping frames");
        return overlaps;
}

/**
 * Find or create a layer with the given name
 * @param {Document} doc - The document to modify
 * @param {String} layerName - Name of the layer to find or create
 * @return {Layer} The found or created layer
 */
function createLayer(doc, layerName) {
    // Create a new layer if it doesn't exist
    try {
        // Make sure we have no active selection that might interfere
        doc.selection = null;
        
        var newLayer = doc.layers.add();
        newLayer.name = layerName;
        return newLayer;
    } catch (e) {
        // debugLog("Error creating new layer: " + e.message, 1);
        // As a last resort, try using the active layer
        // debugLog("Using active layer as fallback", 1);
        return doc.activeLayer;
    }
}

// Main function to visualize frame bounds -- called in Import.jsx
function detectAndVisualizeFrameIssues(doc) {
    try {
        // Get only text frames
        var allTextFrames = doc.textFrames;
        var textFrames = [];
        // Push all text frames into the array
        for (var i = 0; i < allTextFrames.length; i++) {
                textFrames.push(allTextFrames[i]);
        }
        
        // Create a layer for bounds visualization if it doesn't exist
        var boundsLayer = createLayer(doc, "FrameBounds");
        
        // Loop through text frames only
        for (var i = 0; i < textFrames.length; i++) {
            visualizeFrameBounds(textFrames[i], boundsLayer, i);
        }
        
        // Check for overlaps
        checkForOverlaps(textFrames);
        
    } catch (e) {
        alert("Error in detectAndVisualizeFrameIssues: " + e.message, "TranslateAi Error");
    }
}

/**
 * Create RGB colors for boundaries and overlaps
 */
function getBoundColor() {
    var color = new RGBColor();
    color.red = 0;
    color.green = 0;
    color.blue = 255;
    return color;
}

function getOverlapColor() {
    var color = new RGBColor();
    color.red = 255;
    color.green = 0;
    color.blue = 0;
    return color;
}

function getOverlapStrokeColor() {
    var color = new RGBColor();
    color.red = 180;
    color.green = 100;
    color.blue = 0;
    return color;
}