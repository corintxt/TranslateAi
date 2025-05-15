/*****************************************************************
 * TranslateAi Bounds Detection Module v1.0 (2025) - Corin Faife
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
        
        // Ensure correct order: left, top, right, bottom
        var left = Math.min(bounds[0], bounds[2]);
        var right = Math.max(bounds[0], bounds[2]);
        var top = Math.max(bounds[1], bounds[3]);
        var bottom = Math.min(bounds[1], bounds[3]);
        
        // Calculate width and height using normalized bounds
        var width = right - left;
        var height = top - bottom;
        
        // debugLog("Frame " + index + " bounds: [" + bounds.join(", ") + "]", 3);
        
        // Create rectangle using normalized bounds
        var rect = layer.pathItems.rectangle(
            top,     // top
            left,    // left
            width,   // width
            height   // height
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

        // Use centralized throttling
        CPU.throttle.afterVisualization();
        
    } catch (e) {
        // debugLog("Error visualizing frame " + index + ": " + e.message, 1);
    }
}


/**
 * Checks for overlaps between text frames and visualizes them
 * @param {Array} textFrames - Array of text frames to check
 */
function checkForOverlaps(textFrames) {
    try {
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
        
        var overlapLayer = findOrCreateLayer(doc, "FrameOverlaps");
        overlapLayer.zOrder(ZOrderMethod.BRINGTOFRONT);
        
        // Check each pair of frames for overlaps
        for (var i = 0; i < textFrames.length; i++) {
            if (!textFrames[i] || !textFrames[i].geometricBounds) continue;
            
            var bounds1 = textFrames[i].geometricBounds;
            var left1 = Math.min(bounds1[0], bounds1[2]);
            var right1 = Math.max(bounds1[0], bounds1[2]);
            var top1 = Math.max(bounds1[1], bounds1[3]);
            var bottom1 = Math.min(bounds1[1], bounds1[3]);
            
            for (var j = i + 1; j < textFrames.length; j++) {
                if (!textFrames[j] || !textFrames[j].geometricBounds) continue;
                
                var bounds2 = textFrames[j].geometricBounds;
                var left2 = Math.min(bounds2[0], bounds2[2]);
                var right2 = Math.max(bounds2[0], bounds2[2]);
                var top2 = Math.max(bounds2[1], bounds2[3]);
                var bottom2 = Math.min(bounds2[1], bounds2[3]);
                
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
    } catch (err) {
        // debugLog("ERROR in checkForOverlaps: " + err.message, 1);
        return [];
    }
}

/**
 * Find or create a layer with the given name
 * @param {Document} doc - The document to modify
 * @param {String} layerName - Name of the layer to find or create
 * @return {Layer} The found or created layer
 */
function findOrCreateLayer(doc, layerName) {
    // First try to find the layer
    for (var i = 0; i < doc.layers.length; i++) {
        if (doc.layers[i].name === layerName) {
            var layer = doc.layers[i];
            
            // Make sure the layer is unlocked and visible
            try {
                layer.locked = false;
                layer.visible = true;
                return layer;
            } catch (e) {
                // debugLog("Found existing layer but couldn't modify it: " + e.message, 1);
                // We'll create a new layer below
            }
        }
    }
    
    // If not found or couldn't modify existing, create a new one
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

    // debugLog("\n----Starting frame detection and visualization----", 2);
    try {
        // Get only text frames
        var allTextFrames = doc.textFrames;
        var textFrames = [];
        
        // Filter out frames on the measurement layer
        for (var i = 0; i < allTextFrames.length; i++) {
            if (allTextFrames[i].layer.name !== "_MeasurementLayer") {
                textFrames.push(allTextFrames[i]);
            }
        }
        
        // debugLog("Visualizing bounds for " + textFrames.length + " text frames (excluding measurement frames)");
        
        // Create a layer for bounds visualization if it doesn't exist
        var boundsLayer = findOrCreateLayer(doc, "FrameBounds");
        
        // Loop through text frames only
        for (var i = 0; i < textFrames.length; i++) {
            visualizeFrameBounds(textFrames[i], boundsLayer, i);
        }
        
        // Check for overlaps
        checkForOverlaps(textFrames);
        
    } catch (e) {
        // debugLog("Error in detectAndVisualizeFrameIssues: " + e.message, 1);
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
