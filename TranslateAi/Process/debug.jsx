/*****************************************************************
 * TranslateAi Debug Module v1.0 (2025) - Corin Faife
 * 
 * Provides centralized debugging functionality for TranslateAi
 *****************************************************************/

// Module scope variables
var _debugEnabled = true;
var _debugLogFile = null;
var _debugLogPath = "";
var _debugConfig = {
    enabled: true,
    level: 3,
    logToFile: true
};

/**
 * Updates debug configuration settings
 * @param {Object} config - Debug configuration object
 */
function setDebugConfig(config) {
    if (config && config.debug) {
        _debugConfig = config.debug;
        _debugEnabled = config.debug.enabled;
    }
}

/**
 * Debug logging function that writes to a file
 * @param {String} message - Message to log
 * @param {Number} level - Log level (1=error, 2=normal, 3=verbose)
 */
function debugLog(message, level) {
    // Default to normal level if not specified
    level = level || 2;
    
    // Skip if debugging is disabled or message level is higher than config level
    if (!_debugEnabled || level > _debugConfig.level) return;
    
    try {
        // Write to console for immediate feedback
        $.writeln("[DEBUG" + (level === 1 ? "-ERROR" : level === 3 ? "-VERBOSE" : "") + "] " + message);
        
        // Write to log file if it's available and logToFile is enabled
        if (_debugConfig.logToFile && _debugLogFile) {
            _debugLogFile.writeln(new Date().toLocaleTimeString() + ": " + message);
            _debugLogFile.flush(); // Make sure it's written immediately
        }
    } catch (e) {
        // If debug logging itself fails, at least try to write to console
        $.writeln("Error in debug logging: " + e);
    }
}

/**
 * Initialize debug log file in the same directory as the translation file
 * @param {String} translationFilePath - Path to the translation file
 */
function initDebugLog(translationFilePath) {
    if (!_debugEnabled || !_debugConfig.logToFile) return;
    
    try {
        // Extract directory from translation file path
        var lastSeparator = Math.max(
            translationFilePath.lastIndexOf('/'),
            translationFilePath.lastIndexOf('\\')
        );
        
        if (lastSeparator > 0) {
            var directory = translationFilePath.substring(0, lastSeparator);
            var fileName = translationFilePath.substring(lastSeparator + 1);
            
            // Create log file name based on translation file
            _debugLogPath = directory + 
                           (directory.charAt(directory.length - 1) === '/' || 
                            directory.charAt(directory.length - 1) === '\\' ? 
                            '' : '/') + 
                           "TranslateAi_Debug_" + 
                           fileName.replace(".json", "") + 
                           ".log";
            
            // Close any existing log file
            if (_debugLogFile && _debugLogFile.open) {
                _debugLogFile.close();
            }
            
            // Create and open new log file
            _debugLogFile = new File(_debugLogPath);
            _debugLogFile.encoding = "UTF8";
            
            // Helper function to repeat a string (since String.repeat isn't available)
            function repeatString(str, count) {
                var result = "";
                for (var i = 0; i < count; i++) {
                    result += str;
                }
                return result;
            }
            
            var separator = repeatString("=", 50);
            
            if (_debugLogFile.exists) {
                // Append to existing file
                _debugLogFile.open("a");
                _debugLogFile.writeln("\n\n" + separator);
                _debugLogFile.writeln("NEW DEBUG SESSION STARTED: " + new Date().toString());
                _debugLogFile.writeln(separator + "\n");
                _debugLogFile.writeln("CONFIG SETTINGS:");
                _debugLogFile.writeln("- debug:");
                for (var setting in _debugConfig) {
                    if (_debugConfig.hasOwnProperty(setting)) {
                        _debugLogFile.writeln("  - " + setting + ": " + _debugConfig[setting]);
                    }
                }
                _debugLogFile.writeln("");
            } else {
                // Create new file
                _debugLogFile.open("w");
                _debugLogFile.writeln("TRANSLATEAI DEBUG LOG");
                _debugLogFile.writeln("Created: " + new Date().toString());
                _debugLogFile.writeln("Translation file: " + translationFilePath);
                _debugLogFile.writeln(separator + "\n");
                _debugLogFile.writeln("CONFIG SETTINGS:");
                _debugLogFile.writeln("- debug:");
                for (var setting in _debugConfig) {
                    if (_debugConfig.hasOwnProperty(setting)) {
                        _debugLogFile.writeln("  - " + setting + ": " + _debugConfig[setting]);
                    }
                }
                _debugLogFile.writeln("\n" + separator + "\n");
            }
            
            debugLog("Debug logging initialized. Log file: " + _debugLogPath);
        } else {
            $.writeln("Warning: Could not determine directory for debug log");
        }
    } catch (e) {
        $.writeln("Error initializing debug log: " + e);
        _debugLogFile = null;
    }
}

/**
 * Close debug log file when script finishes
 */
function closeDebugLog() {
    if (_debugLogFile && _debugLogFile.open) {
        try {
            _debugLogFile.writeln("\n--- End of Session: " + new Date().toString() + " ---");
            _debugLogFile.close();
        } catch (e) {
            $.writeln("Error closing debug log: " + e);
        }
    }
}