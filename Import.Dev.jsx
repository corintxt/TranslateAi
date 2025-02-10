// Load JSON polyfill.
#include "jsonparse.jsx"

// // Parse JSON string
// var jsonString = '{"name": "Test", "value": 123}';
// var obj = JSON.parse(jsonString);
// alert(obj.name + " = " + obj.value);

// Load test translation JSON
var filePath = '/Users/cfaife/Documents/MATERIALS/Code/Illustrator/TranslateText/Examples/translation.json';
// create fileref
var fileIn	= new File(filePath);
// open for read
fileIn.open("r", "TEXT", "????");
// read contents (all on one line)
var line = fileIn.readln();
// Parse JSON string
var obj = JSON.parse(line);
alert(obj.provider)
// Close file
fileIn.close();