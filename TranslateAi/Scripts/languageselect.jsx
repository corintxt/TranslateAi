// Add these variables at the top of the file with other global variables
var targetLanguage = "fr"; // default to French
var languageOptions = {
    "en": "English",
    "fr": "French",
    "de": "German",
    "pt": "Portuguese",
    "es": "Spanish"
};

function showLanguageDialog() {
    var dialog = new Window("dialog", "Select Target Language");
    dialog.orientation = "column";
    
    var group = dialog.add("group");
    group.orientation = "row";
    group.add("statictext", undefined, "Target Language:");
    var dropdown = group.add("dropdownlist");
    
    for (var code in languageOptions) {
        var item = dropdown.add("item", languageOptions[code]);
        item.code = code;
    }
    
    dropdown.selection = 0;
    
    var buttons = dialog.add("group");
    buttons.orientation = "row";
    var okButton = buttons.add("button", undefined, "OK");
    var cancelButton = buttons.add("button", undefined, "Cancel");
    
    okButton.onClick = function() {
        targetLanguage = dropdown.selection.code;
        dialog.close();
    }
    
    cancelButton.onClick = function() {
        dialog.close();
    }
    
    dialog.show();
    // alert("TargetLang:" + targetLanguage);
    return targetLanguage;
}